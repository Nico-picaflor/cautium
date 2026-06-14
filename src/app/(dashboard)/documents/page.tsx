"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Loader2, AlertTriangle, X, CheckCircle2 } from "lucide-react";

type Doc = {
  id: string; name: string; type: string; file_size: number | null;
  extracted_text: string | null; created_at: string;
};

const typeColors: Record<string, string> = {
  contract: "bg-blue-100 text-blue-700",
  policy: "bg-purple-100 text-purple-700",
  certificate: "bg-green-100 text-green-700",
  report: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

const typeLabel: Record<string, string> = {
  contract: "Contrato", policy: "Política", certificate: "Certificado",
  report: "Informe", other: "Otro",
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => { fetchDocuments(); }, []);

  async function fetchDocuments() {
    setLoading(true);
    const { data } = await (supabase.from("documents") as any)
      .select("id, name, type, file_size, extracted_text, created_at")
      .order("created_at", { ascending: false });
    setDocuments(data ?? []);
    setLoading(false);
  }

  async function handleFile(file: File) {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type) && !file.name.endsWith(".pdf") && !file.name.endsWith(".docx")) {
      setError("Solo se admiten PDF o DOCX"); return;
    }
    if (file.size > 20 * 1024 * 1024) { setError("Máximo 20 MB"); return; }
    setError(null);
    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al subir");
      setDocuments((prev) => [json.document, ...prev]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Base de conocimiento</h1>
          <p className="text-muted-foreground">Políticas, controles, auditorías y certificados de tu empresa</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          {uploading ? "Procesando…" : "Subir documento"}
        </Button>
      </div>

      <input
        ref={fileInputRef} type="file" accept=".pdf,.docx,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          <button className="ml-auto" onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {uploading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-4 p-5">
            <Loader2 className="h-7 w-7 text-blue-500 animate-spin shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">Extrayendo texto del documento…</p>
              <p className="text-sm text-blue-600">Claude está indexando el contenido para la base de conocimiento.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : documents.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-20 transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}
        >
          <FileText className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-medium text-gray-700">Arrastra un PDF o DOCX aquí</p>
          <p className="text-sm text-muted-foreground mt-1">Políticas de seguridad, ISO 27001, SOC2, controles internos…</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-7 w-7 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : "—"} · {new Date(doc.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[doc.type] ?? typeColors.other}`}>
                      {typeLabel[doc.type] ?? doc.type}
                    </span>
                    {doc.extracted_text ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />Indexado
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Sin texto</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Drop zone for more */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl flex items-center justify-center py-6 transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}
          >
            <p className="text-sm text-muted-foreground">+ Arrastra otro documento aquí</p>
          </div>
        </div>
      )}
    </div>
  );
}
