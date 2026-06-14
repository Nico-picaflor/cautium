import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { anthropic, MODEL } from "@/lib/anthropic";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user's org
  const { data: profile } = await (supabase.from("users") as any)
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDFs are supported" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to Supabase Storage
  const storagePath = `${profile.organization_id}/${Date.now()}_${file.name}`;
  const { error: storageError } = await serviceClient.storage
    .from("documents")
    .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });

  if (storageError) {
    return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
  }

  // Insert document record
  const { data: doc, error: insertError } = await (serviceClient.from("documents") as any)
    .insert({
      organization_id: profile.organization_id,
      name: file.name,
      file_path: storagePath,
      file_size: file.size,
      file_type: "application/pdf",
      type: "other",
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to save document record" }, { status: 500 });
  }

  // Analyze with Claude (PDF as base64)
  const base64 = buffer.toString("base64");

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            } as any,
            {
              type: "text",
              text: `You are a third-party risk management expert. Analyze this document and return a JSON object with:
1. "summary": 2-3 sentence overview of the document
2. "risks": array of { "title": string, "severity": "critical"|"high"|"medium"|"low", "description": string }

Return ONLY valid JSON, no markdown, no code blocks.`,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const analysis = JSON.parse(content.text);
      await (serviceClient.from("documents") as any)
        .update({
          ai_summary: analysis.summary,
          ai_risks: analysis.risks,
          ai_analyzed_at: new Date().toISOString(),
        })
        .eq("id", doc.id);

      return NextResponse.json({ document: { ...doc, ai_summary: analysis.summary, ai_risks: analysis.risks } });
    }
  } catch {
    // Analysis failed — return doc without analysis
  }

  return NextResponse.json({ document: doc });
}
