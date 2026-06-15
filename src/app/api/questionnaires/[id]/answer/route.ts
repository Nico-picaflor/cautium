import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { anthropic, MODEL } from "@/lib/anthropic";

const service = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await (service.from("users") as any)
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const questionnaireId = params.id;

  // Load questionnaire metadata
  const { data: questionnaire } = await (service.from("questionnaires") as any)
    .select("title, client_name")
    .eq("id", questionnaireId)
    .single();

  // Load questions
  const { data: questions } = await (service.from("questions") as any)
    .select("id, text, category, order_index")
    .eq("questionnaire_id", questionnaireId)
    .order("order_index");

  if (!questions?.length) return NextResponse.json({ error: "No questions found" }, { status: 404 });

  // Load knowledge base documents
  const { data: docs } = await (service.from("documents") as any)
    .select("name, extracted_text, type")
    .eq("organization_id", profile.organization_id)
    .not("extracted_text", "is", null);

  const knowledgeBase = (docs ?? [])
    .filter((d: any) => d.extracted_text?.trim())
    .map((d: any) => `=== DOCUMENTO: ${d.name} (${d.type}) ===\n${d.extracted_text}`)
    .join("\n\n");

  if (!knowledgeBase) {
    return NextResponse.json({ error: "No hay documentos en la base de conocimiento. Sube políticas y controles primero." }, { status: 400 });
  }

  const titleContext = questionnaire?.title ? `Tipo de cuestionario: ${questionnaire.title}.` : "";

  function buildPrompt(batch: any[]) {
    const questionsList = batch.map((q: any, i: number) =>
      `${i + 1}. [ID:${q.id}]${q.category ? ` [CATEGORÍA: ${q.category}]` : ""} ${q.text}`
    ).join("\n");

    return `Eres un experto en seguridad de la información y gestión de riesgos de terceros (TPRM).
${titleContext}

Base de conocimiento interna (políticas, controles, auditorías y certificados):
${knowledgeBase}

---

Usando ÚNICAMENTE los documentos anteriores, responde cada pregunta:
- Si tiene categoría, úsala para contextualizar
- Respuesta concisa (1-3 párrafos)
- Cita el documento fuente
- Confianza: "high" (respuesta directa), "medium" (inferida), "low" (insuficiente)

PREGUNTAS:
${questionsList}

Responde en JSON (array, una entrada por pregunta):
[{"id":"uuid","answer":"respuesta","confidence":"high|medium|low","source":"doc"}]

ÚNICAMENTE el JSON, sin markdown.`;
  }

  // Process in batches of 15 to stay within Vercel's 60s timeout
  const BATCH_SIZE = 15;
  const batches: any[][] = [];
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    batches.push(questions.slice(i, i + BATCH_SIZE));
  }

  let answers: any[] = [];
  for (const batch of batches) {
    try {
      const msg = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: "user", content: buildPrompt(batch) }],
      });
      if (msg.content[0].type !== "text") continue;
      const batchAnswers = JSON.parse(msg.content[0].text);
      answers = answers.concat(batchAnswers);
    } catch (e) {
      // Continue with next batch on error
    }
  }

  if (answers.length === 0) {
    return NextResponse.json({ error: "Error al procesar respuestas de IA" }, { status: 500 });
  }

  // Update each question with AI answer
  const updates = answers.map((a: any) =>
    (service.from("questions") as any)
      .update({
        ai_answer: a.answer,
        ai_confidence: a.confidence,
        ai_source: a.source,
        human_answer: a.answer,
        approved: false,
      })
      .eq("id", a.id)
  );
  await Promise.all(updates);

  await (service.from("questionnaires") as any)
    .update({ answered_questions: answers.length, status: "in_progress" })
    .eq("id", questionnaireId);

  return NextResponse.json({ answered: answers.length });
}
