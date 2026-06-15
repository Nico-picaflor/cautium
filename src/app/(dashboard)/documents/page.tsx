"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Loader2, AlertTriangle, X, CheckCircle2, Search, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

type Doc = {
  id: string; name: string; display_name?: string | null; type: string;
  file_size: number | null; extracted_text: string | null; created_at: string;
  frameworks?: string[] | null; valid_until?: string | null;
};

const TYPE_COLORS: Record<string, string> = {
  contract: "bg-blue-50 text-blue-700 border border-blue-200",
  policy: "bg-violet-50 text-violet-700 border border-violet-200",
  certificate: "bg-green-50 text-green-700 border border-green-200",
  report: "bg-amber-50 text-amber-700 border border-amber-200",
  other: "bg-gray-100 text-gray-600 border border-gray-200",
};

function humanize(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const FILTERS = ["all", "policy", "certificate", "report", "contract"] as const;
type FilterKey = typeof FILTERS[number];

export default function DocumentsPage() {
  const t = useTranslations("documents");
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const filterLabels: Record<FilterKey, string> = {
    all: t("filterAll"),
    policy: t("filterPolicies"),
    certificate: t("filterCertificates"),
    report: t("filterReports"),
    contract: t("filterContracts"),
  };

  const typeLabels: Record<string, string> = {
    contract: t("typeContract"),
    policy: t("typePolicy"),
    certificate: t("typeCertificate"),
    report: t("typeReport"),
    other: t("typeOther"),
  };

  useEffect(() => { fetchDocuments(); }, []);

  async function fetchDocuments() {
    setLoading(true);
    const { data, error } = await (supabase.from("documents") as any)
      .select("id, name, display_name, type, file_size, extracted_text, created_at, frameworks, valid_until")
      .order("created_at", { ascending: false });
    if (error) setError(`${t("errorLoad")}: ${error.message}`);
    setDocuments(data ?? []);
    setLoading(false);
  }

  async function handleFile(file: File) {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type) && !file.name.endsWith(".pdf") && !file.name.endsWith(".docx")) {
      setError(t("errorTypes")); return;
    }
    if (file.size > 20 * 1024 * 1024) { setError(t("errorSize")); return; }
    setError(null);
    setUploading((n) => n + 1);
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
      setUploading((n) => n - 1);
    }
  }

  const isExpired = (valid_until?: string | null) =>
    valid_until ? new Date(valid_until) < new Date() : false;

  const filtered = documents.filter((doc) => {
    const q = search.toLowerCase();
    const name = (doc.display_name || doc.name).toLowerCase();
    const matchSearch = !q || name.includes(q);
    const matchFilter = filter === "all" || doc.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1A2E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {t("title")}
          </h1>
          <p className="text-sm text-[#5A6678] mt-0.5">{t("desc")}</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading > 0}>
          {uploading > 0 ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Plus className="h-4 w-4 me-2" />}
          {uploading > 0 ? t("processing", { count: uploading }) : t("upload")}
        </Button>
      </div>

      <input
        ref={fileInputRef} type="file" accept=".pdf,.docx,application/pdf" multiple className="hidden"
        onChange={(e) => { Array.from(e.target.files ?? []).forEach(handleFile); e.target.value = ""; }}
      />

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          <button className="ms-auto" onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {uploading > 0 && (
        <Card className="border-teal-200 bg-teal-50">
          <CardContent className="flex items-center gap-4 p-5">
            <Loader2 className="h-7 w-7 text-teal-500 animate-spin shrink-0" />
            <div>
              <p className="font-semibold text-teal-900">{t("processing", { count: uploading })}</p>
              <p className="text-sm text-teal-600">{t("processingDesc")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="w-full ps-9 pe-4 py-2 text-sm border border-[#E7ECF2] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filter === f
                    ? "bg-[#0F1A2E] text-white border-[#0F1A2E]"
                    : "border-[#E7ECF2] text-[#5A6678] hover:border-gray-300 bg-white"
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : documents.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); Array.from(e.dataTransfer.files).forEach(handleFile); }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-20 transition-colors ${
            dragOver ? "border-teal-400 bg-teal-50" : "border-[#E7ECF2] hover:border-gray-300 bg-white"
          }`}
        >
          <FileText className="h-12 w-12 text-gray-300 mb-3" />
          <p className="font-medium text-[#0F1A2E]">{t("dropzone")}</p>
          <p className="text-sm text-[#8794A8] mt-1">{t("dropzoneDesc")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-sm text-[#8794A8] text-center py-8">{t("search")} — no results</p>
          )}
          {filtered.map((doc) => {
            const displayName = doc.display_name || humanize(doc.name);
            const expired = isExpired(doc.valid_until);
            return (
              <Card key={doc.id} className="border-[#E7ECF2]">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-[#F7F9FB] rounded-lg p-2 shrink-0">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-[#0F1A2E] truncate">{displayName}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <p className="text-xs text-[#8794A8]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : "—"} · {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                        {doc.valid_until && (
                          <span className={`flex items-center gap-1 text-xs ${expired ? "text-red-600" : "text-[#8794A8]"}`}>
                            <Calendar className="h-3 w-3" />
                            {expired ? t("expired") : `${t("validUntil")} ${new Date(doc.valid_until).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                      {doc.frameworks && doc.frameworks.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {doc.frameworks.map((fw) => (
                            <span key={fw} className="text-xs px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {fw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ms-4 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[doc.type] ?? TYPE_COLORS.other}`}>
                      {typeLabels[doc.type] ?? doc.type}
                    </span>
                    {doc.extracted_text ? (
                      <span className="flex items-center gap-1 text-xs text-teal-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />{t("indexed")}
                      </span>
                    ) : (
                      <span className="text-xs text-[#8794A8]">{t("noText")}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); Array.from(e.dataTransfer.files).forEach(handleFile); }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl flex items-center justify-center py-5 transition-colors ${
              dragOver ? "border-teal-400 bg-teal-50" : "border-[#E7ECF2] hover:border-gray-300"
            }`}
          >
            <p className="text-sm text-[#8794A8]">{t("dropzoneMore")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
