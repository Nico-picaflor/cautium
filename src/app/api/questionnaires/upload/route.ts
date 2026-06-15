import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const service = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseQuestions(buffer: Buffer, filename: string): { text: string; category?: string }[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const questions: { text: string; category?: string }[] = [];
  let currentCategory: string | undefined;

  for (const row of rows) {
    const cells = row.map((c: any) => String(c).trim()).filter(Boolean);
    if (cells.length === 0) continue;

    const first = cells[0];
    // Heuristic: if row has only one cell and looks like a section header, treat as category
    if (cells.length === 1 && first.length < 80 && !first.endsWith("?")) {
      currentCategory = first;
      continue;
    }

    // Find the question text — look for cells that end in ? or are long sentences
    const questionCell = cells.find((c: string) => c.endsWith("?") || c.length > 20);
    if (questionCell) {
      questions.push({ text: questionCell, category: currentCategory });
    }
  }

  return questions;
}

function parseCsvQuestions(text: string): { text: string; category?: string }[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  // Skip header line if it looks like one
  const start = lines[0]?.toLowerCase().includes("question") ? 1 : 0;
  return lines.slice(start).map((line) => {
    // Remove surrounding quotes and CSV delimiters
    const clean = line.replace(/^["']|["']$/g, "").split(/[,;]\s*/).join(" ").trim();
    return { text: clean };
  }).filter((q) => q.text.length > 5);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await (service.from("users") as any)
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const clientName = (formData.get("client_name") as string) || "Cliente";
  const title = (formData.get("title") as string) || file?.name.replace(/\.[^.]+$/, "") || "Cuestionario";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = file.name.toLowerCase();

  let questions: { text: string; category?: string }[] = [];

  try {
    if (filename.endsWith(".csv")) {
      questions = parseCsvQuestions(buffer.toString("utf-8"));
    } else {
      questions = parseQuestions(buffer, filename);
    }
  } catch {
    return NextResponse.json({ error: "No se pudo parsear el archivo" }, { status: 400 });
  }

  if (questions.length === 0) {
    return NextResponse.json({ error: "No se encontraron preguntas en el archivo" }, { status: 400 });
  }

  // Create questionnaire
  const { data: questionnaire, error: qError } = await (service.from("questionnaires") as any)
    .insert({
      organization_id: profile.organization_id,
      title,
      client_name: clientName,
      status: "in_progress",
      created_by: user.id,
      total_questions: questions.length,
      answered_questions: 0,
    })
    .select()
    .single();

  if (qError) return NextResponse.json({ error: "Error al crear cuestionario" }, { status: 500 });

  // Insert questions
  const questionRows = questions.map((q, i) => ({
    questionnaire_id: questionnaire.id,
    text: q.text,
    category: q.category ?? null,
    type: "text",
    order_index: i,
    required: true,
  }));

  const { error: questionsError } = await (service.from("questions") as any).insert(questionRows);
  if (questionsError) return NextResponse.json({ error: "Error al guardar preguntas" }, { status: 500 });

  return NextResponse.json({ questionnaire: { ...questionnaire, question_count: questions.length } });
}
