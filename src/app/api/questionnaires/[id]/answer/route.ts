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

  const { data: profile } = await (supabase.from("users") as any)
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const questionnaireId = params.id;

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

  // Build prompt — answer all questions in one call
  const questionsList = questions.map((q: any, i: number) =>
    `${i + 1}. [ID:${q.id}]${q.category ? ` [CATEGORÍA: ${q.category}]` : ""} ${q.text}`
  ).join("\n");

  const prompt = `Eres un experto en seguridad de la información y gestión de riesgos de terceros (TPRM).

Tu empresa tiene la siguiente base de conocimiento (políticas internas, controles, certificados y auditorías):

${knowledgeBase}

---

Usando ÚNICAMENTE la información de los documentos anteriores, responde cada una de las siguientes preguntas de un cuestionario de seguridad enviado por un cliente. Para cada pregunta:
- Da una respuesta concisa y precisa (1-3 párrafos)
- Cita el documento específico que respalda la respuesta
- Asigna una confianza: "high" (respuesta directa en los docs), "medium" (respuesta inferida), "low" (información insuficiente)

PREGUNTAS:
${questionsList}

Responde en JSON con este formato exacto (array con una entrada por pregunta):
[
  {
    "id": "uuid-de-la-pregunta",
    "answer": "respuesta completa aquí",
    "confidence": "high|medium|low",
    "source": "nombre del documento citado"
  }
]

Devuelve ÚNICAMENTE el JSON, sin markdown ni comentarios.`;

  let answers: any[] = [];
  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8096,
      messages: [{ role: "user", content: prompt }],
    });

    if (msg.content[0].type !== "text") throw new Error("Unexpected response type");
    answers = JSON.parse(msg.content[0].text);
  } catch (e) {
    return NextResponse.json({ error: "Error al procesar respuestas de IA" }, { status: 500 });
  }

  // Update each question with AI answer
  const updates = answers.map((a: any) =>
    (service.from("questions") as any)
      .update({
        ai_answer: a.answer,
        ai_confidence: a.confidence,
        ai_source: a.source,
        human_answer: a.answer, // pre-fill human answer with AI answer for editing
        approved: false,
      })
      .eq("id", a.id)
  );

  await Promise.all(updates);

  // Update questionnaire answered count
  await (service.from("questionnaires") as any)
    .update({ answered_questions: answers.length, status: "in_progress" })
    .eq("id", questionnaireId);

  return NextResponse.json({ answered: answers.length });
}
