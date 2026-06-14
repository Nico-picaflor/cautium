"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ClipboardList, Loader2, X, AlertTriangle, ChevronRight } from "lucide-react";

type Questionnaire = {
  id: string; title: string; client_name: string | null;
  status: string; total_questions: number; answered_questions: number;
  created_at: string;
};

const statusLabel: Record<string, string> = {
  draft: "Borrador", in_progress: "En progreso", completed: "Completado",
  sent: "Enviado", expired: "Expirado",
};
const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary", in_progress: "default", completed: "default",
  sent: "outline", expired: "destructive",
};

export default function QuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchQuestionnaires(); }, []);

  async function fetchQuestionnaires() {
    setLoading(true);
    const { data } = await (supabase.from("questionnaires") as any)
      .select("id, title, client_name, status, total_questions, answered_questions, created_at")
      .order("created_at", { ascending: false });
    setQuestionnaires(data ?? []);
    setLoading(false);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function handleUpload() {
    if (!selectedFile) { setError("Selecciona un archivo"); return; }
    if (!clientName.trim()) { setError("Introduce el nombre del cliente"); return; }
    setError(null);
    setUploading(true);

    const form = new FormData();
    form.append("file", selectedFile);
    form.append("client_name", clientName.trim());
    form.append("title", title.trim() || selectedFile.name);

    try {
      const res = await fetch("/api/questionnaires/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al subir");
      router.push(`/questionnaires/${json.questionnaire.id}`);
    } catch (e: any) {
      setError(e.message);
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuestionarios</h1>
          <p className="text-muted-foreground">Sube cuestionarios de clientes y respóndelos con IA</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo cuestionario
        </Button>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Subir cuestionario</h2>
              <button onClick={() => { setShowUpload(false); setError(null); setSelectedFile(null); }}>
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}

            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre del cliente *</label>
                <Input placeholder="Ej: Acme Corp" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Título del cuestionario</label>
                <Input placeholder="Ej: TPSA 2024" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Archivo (XLS, XLSX o CSV) *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-center hover:border-blue-400 transition-colors"
                >
                  {selectedFile ? (
                    <p className="text-sm font-medium text-blue-700">{selectedFile.name}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Haz clic para seleccionar o arrastra aquí</p>
                  )}
                </div>
                <input
                  ref={fileInputRef} type="file"
                  accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  className="hidden" onChange={onFileChange}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button onClick={handleUpload} disabled={uploading} className="flex-1">
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Procesando…</> : "Subir y continuar →"}
              </Button>
              <Button variant="outline" onClick={() => { setShowUpload(false); setError(null); setSelectedFile(null); }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : questionnaires.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mb-3" />
            <p className="font-medium text-gray-700">Sin cuestionarios todavía</p>
            <p className="text-sm text-muted-foreground mt-1">Sube un XLS o CSV con las preguntas de un cliente.</p>
            <Button className="mt-4" onClick={() => setShowUpload(true)}>
              <Plus className="h-4 w-4 mr-2" />Nuevo cuestionario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {questionnaires.map((q) => (
            <Card key={q.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/questionnaires/${q.id}`)}>
              <CardContent className="flex items-center justify-between p-5">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{q.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {q.client_name ?? "—"} · {q.answered_questions ?? 0}/{q.total_questions ?? 0} preguntas respondidas · {new Date(q.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <Badge variant={statusVariant[q.status] ?? "secondary"}>
                    {statusLabel[q.status] ?? q.status}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
