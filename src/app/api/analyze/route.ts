import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODEL } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId, text } = await request.json();

  if (!text) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a third-party risk management expert. Analyze the following document and return a JSON object with two fields:
1. "summary": a 2-3 sentence summary of the document
2. "risks": an array of risk objects, each with { "title": string, "severity": "critical"|"high"|"medium"|"low", "description": string }

Document:
${text}

Return ONLY valid JSON, no markdown.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "Unexpected response" }, { status: 500 });
  }

  let analysis: { summary: string; risks: unknown[] };
  try {
    analysis = JSON.parse(content.text);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  if (documentId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("documents") as any)
      .update({
        ai_summary: analysis.summary,
        ai_risks: analysis.risks,
        ai_analyzed_at: new Date().toISOString(),
      })
      .eq("id", documentId);
  }

  return NextResponse.json(analysis);
}
