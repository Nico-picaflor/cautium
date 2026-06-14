"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Sparkles, X, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

const typeColors: Record<string, string> = {
  contract: "bg-blue-100 text-blue-700",
  policy: "bg-purple-100 text-purple-700",
  certificate: "bg-green-100 text-green-700",
  report: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

type Risk = { title: string; severity: string; description: string };
type Doc = {
  id: string; name: string; type: string; file_size: number;
  ai_summary: string | null; ai_risks: Risk[] | null; ai_analyzed_at: string | null;
  created_at: string;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    const { data } = await (supabase.from("documents") as any)
      .select("id, name, type, file_size, ai_summary, ai_risks, ai_analyzed_at, created_at")
      .order("created_at", { ascending: false });
    setDocuments(data ?? []);
    setLoading(false);
  }

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") { setError("Solo se admiten archivos PDF"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("El archivo supera el límite de 10 MB"); return; }
    setError(null);
    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al subir");
      setDocuments((prev) => [json.document, ...prev]);
      setExpandedId(json.document.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-muted-foreground">Sube contratos y políticas para analizarlos con IA</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          {uploading ? "Analizando…" : "Subir documento"}
        </Button>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={onFileInputChange} />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
          <button className="ml-auto" onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Drop zone (shown when no docs) */}
      {!loading && documents.length === 0 && !uploading && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-20 transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}
        >
          <FileText className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-medium text-gray-700">Arrastra un PDF aquí</p>
          <p className="text-sm text-muted-foreground mt-1">o haz clic para seleccionar · máx. 10 MB</p>
        </div>
      )}

      {/* Uploading skeleton */}
      {uploading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-4 p-6">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">Analizando documento con IA…</p>
              <p className="text-sm text-blue-600">Esto puede tardar unos segundos</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents list */}
      {documents.length > 0 && (
        <div className="grid gap-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="overflow-hidden">
              {/* Row */}
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-8 w-8 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{doc.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : "—"} ·{" "}
                      {new Date(doc.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[doc.type] ?? typeColors.other}`}>
                    {doc.type}
                  </span>
                  {doc.ai_analyzed_at ? (
                    <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}>
                      <Sparkles className="h-3 w-3" />
                      Analizado
                      {expandedId === doc.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-400">Pendiente</Badge>
                  )}
                </div>
              </CardContent>

              {/* Expanded analysis */}
              {expandedId === doc.id && doc.ai_summary && (
                <div className="border-t bg-gray-50 px-5 py-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Resumen</p>
                    <p className="text-sm text-gray-700">{doc.ai_summary}</p>
                  </div>
                  {doc.ai_risks && doc.ai_risks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Riesgos identificados</p>
                      <div className="grid gap-2">
                        {doc.ai_risks.map((risk, i) => (
                          <div key={i} className={`rounded-lg border px-4 py-3 ${severityColors[risk.severity] ?? severityColors.low}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{risk.title}</span>
                              <span className="text-xs uppercase font-bold opacity-70">{risk.severity}</span>
                            </div>
                            <p className="text-sm opacity-90">{risk.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Drop zone overlay when docs exist */}
      {documents.length > 0 && !uploading && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl flex items-center justify-center py-8 transition-colors cursor-pointer ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-sm text-muted-foreground">+ Arrastra otro PDF o haz clic aquí</p>
        </div>
      )}
    </div>
  );
}
