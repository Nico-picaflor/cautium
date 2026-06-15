import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { anthropic, MODEL } from "@/lib/anthropic";

const service = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let { data: profile } = await (service.from("users") as any)
    .select("organization_id")
    .eq("id", user.id)
    .single();

  // Auto-create org + profile if trigger didn't run (e.g. user registered before trigger was set up)
  if (!profile) {
    const orgSlug = `org-${user.id.replace(/-/g, "").slice(0, 8)}`;
    const orgName = user.email?.split("@")[1] ?? "My Organization";
    const { data: org } = await (service.from("organizations") as any)
      .insert({ name: orgName, slug: orgSlug })
      .select()
      .single();
    if (org) {
      await (service.from("users") as any).insert({
        id: user.id,
        organization_id: org.id,
        full_name: user.email?.split("@")[0] ?? "User",
        role: "owner",
      });
      profile = { organization_id: org.id };
    }
  }

  if (!profile) return NextResponse.json({ error: "No se pudo crear el perfil de usuario" }, { status: 500 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (!allowedTypes.includes(file.type) && !file.name.endsWith(".pdf") && !file.name.endsWith(".docx")) {
    return NextResponse.json({ error: "Solo se admiten PDF o DOCX" }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Archivo demasiado grande (máx 20 MB)" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to Supabase Storage
  const storagePath = `${profile.organization_id}/${Date.now()}_${file.name}`;
  const { error: storageError } = await service.storage
    .from("documents")
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (storageError) return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });

  // Extract text via Claude (PDF native support)
  let extractedText = "";
  try {
    const base64 = buffer.toString("base64");
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } } as any,
          { type: "text", text: "Extract all text content from this document. Return only the plain text, preserving structure with newlines. No commentary." },
        ],
      }],
    });
    if (msg.content[0].type === "text") extractedText = msg.content[0].text;
  } catch {
    // Continue without text extraction — document still saved
  }

  // Detect document type from name
  const name = file.name.toLowerCase();
  const type = name.includes("contrat") ? "contract"
    : name.includes("polic") ? "policy"
    : name.includes("certif") ? "certificate"
    : name.includes("report") || name.includes("informe") ? "report"
    : "other";

  const { data: doc, error: insertError } = await (service.from("documents") as any)
    .insert({
      organization_id: profile.organization_id,
      name: file.name,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      type,
      extracted_text: extractedText || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: "Error al guardar documento" }, { status: 500 });

  return NextResponse.json({ document: doc });
}
