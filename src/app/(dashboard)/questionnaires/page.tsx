"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ClipboardList, Loader2, X, AlertTriangle, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

type Questionnaire = {
  id: string; title: string; client_name: string | null; standard: string | null;
  status: string; total_questions: number; answered_questions: number; created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border border-slate-200",
  in_progress: "bg-teal-50 text-teal-700 border border-teal-200",
  review: "bg-amber-50 text-amber-700 border border-amber-200",
  completed: "bg-green-50 text-green-700 border border-green-200",
  sent: "bg-blue-50 text-blue-700 border border-blue-200",
  expired: "bg-red-50 text-red-700 border border-red-200",
};

export default function QuestionnairesPage() {
  const t = useTranslations("questionnaires");
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("");
  const [standard, setStandard] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const statusLabels: Record<string, string> = {
    draft: t("statusDraft"),
    in_progress: t("statusInProgress"),
    review: t("statusReview"),
    completed: t("statusApproved"),
    sent: t("statusSent"),
    expired: t("statusExpired"),
  };

  useEffect(() => { fetchQuestionnaires(); }, []);

  async function fetchQuestionnaires() {
    setLoading(true);
    const { data } = await (supabase.from("questionnaires") as any)
      .select("id, title, client_name, standard, status, total_questions, answered_questions, created_at")
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
    if (!selectedFile) { setError(t("errorNoFile")); return; }
    if (!clientName.trim()) { setError(t("errorNoClient")); return; }
    setError(null);
    setUploading(true);
    const form = new FormData();
    form.append("file", selectedFile);
    form.append("client_name", clientName.trim());
    form.append("title", title.trim() || selectedFile.name);
    if (standard.trim()) form.append("standard", standard.trim());
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

  function closeUpload() {
    setShowUpload(false);
    setError(null);
    setSelectedFile(null);
    setClientName("");
    setTitle("");
    setStandard("");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1A2E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {t("title")}
          </h1>
          <p className="text-sm text-[#5A6678] mt-0.5">{t("desc")}</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Plus className="h-4 w-4 me-2" />{t("new")}
        </Button>
      </div>

      {showUpload && (
        <Card className="border-teal-200 bg-teal-50/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#0F1A2E]">{t("uploadTitle")}</h2>
              <button onClick={closeUpload}><X className="h-4 w-4 text-gray-500" /></button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}

            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium text-[#0F1A2E] mb-1 block">{t("clientName")}</label>
                <Input placeholder={t("clientNamePlaceholder")} value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[#0F1A2E] mb-1 block">{t("qTitle")}</label>
                  <Input placeholder={t("qTitlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0F1A2E] mb-1 block">{t("standard")}</label>
                  <Input placeholder={t("standardPlaceholder")} value={standard} onChange={(e) => setStandard(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#0F1A2E] mb-1 block">{t("file")}</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-teal-300 rounded-lg px-4 py-5 text-center hover:border-teal-400 transition-colors bg-white"
                >
                  {selectedFile ? (
                    <p className="text-sm font-medium text-teal-700">{selectedFile.name}</p>
                  ) : (
                    <p className="text-sm text-[#8794A8]">{t("filePrompt")}</p>
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
                {uploading ? <><Loader2 className="h-4 w-4 me-2 animate-spin" />{t("processing")}</> : t("uploadBtn")}
              </Button>
              <Button variant="outline" onClick={closeUpload}>{t("cancel")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : questionnaires.length === 0 ? (
        <Card className="border-[#E7ECF2]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mb-3" />
            <p className="font-medium text-[#0F1A2E]">{t("none")}</p>
            <p className="text-sm text-[#8794A8] mt-1">{t("noneDesc")}</p>
            <Button className="mt-4" onClick={() => setShowUpload(true)}>
              <Plus className="h-4 w-4 me-2" />{t("new")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {questionnaires.map((q) => {
            const progress = q.total_questions > 0 ? (q.answered_questions / q.total_questions) * 100 : 0;
            return (
              <Card
                key={q.id}
                className="border-[#E7ECF2] hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/questionnaires/${q.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[#0F1A2E] truncate">{q.title}</h3>
                        {q.standard && (
                          <span className="text-xs px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {q.standard}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#8794A8] mt-0.5">
                        {q.client_name ?? "—"} · {t("answered", { answered: q.answered_questions ?? 0, total: q.total_questions ?? 0 })} · {new Date(q.created_at).toLocaleDateString()}
                      </p>
                      {q.total_questions > 0 && (
                        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                          <div
                            className="h-full bg-teal-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[q.status] ?? STATUS_STYLES.draft}`}>
                        {statusLabels[q.status] ?? q.status}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
