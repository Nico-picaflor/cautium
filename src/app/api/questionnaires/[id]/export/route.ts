import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const service = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: questionnaire } = await (service.from("questionnaires") as any)
    .select("title, client_name")
    .eq("id", params.id)
    .single();

  const { data: questions } = await (service.from("questions") as any)
    .select("text, category, human_answer, ai_confidence, ai_source, approved, order_index")
    .eq("questionnaire_id", params.id)
    .order("order_index");

  if (!questions?.length) return NextResponse.json({ error: "No questions" }, { status: 404 });

  const rows = questions.map((q: any) => ({
    "#": q.order_index + 1,
    "Categoría": q.category ?? "",
    "Pregunta": q.text,
    "Respuesta": q.human_answer ?? "",
    "Confianza IA": q.ai_confidence ?? "",
    "Fuente": q.ai_source ?? "",
    "Aprobado": q.approved ? "Sí" : "No",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 4 }, { wch: 20 }, { wch: 60 }, { wch: 80 }, { wch: 12 }, { wch: 30 }, { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Respuestas");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `${questionnaire?.client_name ?? "cuestionario"}_respuestas.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
