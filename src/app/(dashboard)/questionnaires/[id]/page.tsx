"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

type Question = {
  id: string; text: string; category: string | null; order_index: number;
  ai_answer: string | null; ai_confidence: string | null; ai_source: string | null;
  human_answer: string | null; approved: boolean;
};

type Questionnaire = {
  id: string; title: string; client_name: string | null; standard: string | null;
  status: string; total_questions: number; answered_questions: number;
};

function ConfBadge({ conf }: { conf: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    high:   { color: "#0E7E74", bg: "#E3F6F3", label: "Confianza alta" },
    medium: { color: "#9A6400", bg: "#FBF1DD", label: "Confianza media" },
    low:    { color: "#B91C1C", bg: "#FEF2F2", label: "Confianza baja" },
  };
  const s = map[conf] ?? map.low;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: s.color, background: s.bg, padding: "4px 11px", borderRadius: 999, flexShrink: 0 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "#fff", border: "1px solid #E7ECF2", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ height: 16, width: 160, background: "#F1F4F8", borderRadius: 6, animation: "cautiumShimmer 1.4s ease-in-out infinite" }} />
      </div>
      <div style={{ height: 18, width: "70%", background: "#F1F4F8", borderRadius: 6, marginBottom: 10, animation: "cautiumShimmer 1.4s ease-in-out infinite" }} />
      <div style={{ background: "#F7F9FB", border: "1px solid #EEF1F6", borderRadius: 11, padding: "13px 15px" }}>
        <div style={{ height: 14, width: "90%", background: "#EEF1F6", borderRadius: 5, marginBottom: 8, animation: "cautiumShimmer 1.4s ease-in-out infinite" }} />
        <div style={{ height: 14, width: "75%", background: "#EEF1F6", borderRadius: 5, animation: "cautiumShimmer 1.4s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

export default function QuestionnairePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();
  const t = useTranslations("detail");

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    setLoading(true);
    const [{ data: q }, { data: qs }] = await Promise.all([
      (supabase.from("questionnaires") as any).select("*").eq("id", id).single(),
      (supabase.from("questions") as any).select("*").eq("questionnaire_id", id).order("order_index"),
    ]);
    setQuestionnaire(q);
    setQuestions(qs ?? []);
    const first = (qs ?? []).find((q: Question) => !q.approved);
    if (first) setExpandedId(first.id);

    const allApproved = (qs ?? []).length > 0 && (qs ?? []).every((q: Question) => q.approved);
    if (allApproved && q?.status !== "completed") {
      await (supabase.from("questionnaires") as any).update({ status: "completed" }).eq("id", id);
      setQuestionnaire((prev: any) => prev ? { ...prev, status: "completed" } : prev);
    }
    setLoading(false);
  }

  async function handleAnswerWithAI() {
    setAnswering(true);
    setAnswerError(null);
    try {
      const res = await fetch(`/api/questionnaires/${id}/answer`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al responder");
      await fetchData();
    } catch (e: any) {
      setAnswerError(e.message);
    } finally {
      setAnswering(false);
    }
  }

  async function handleApproveAll() {
    const unapproved = questions.filter((q) => !q.approved && q.human_answer);
    await Promise.all(unapproved.map((q) =>
      (supabase.from("questions") as any).update({ approved: true }).eq("id", q.id)
    ));
    const updated = questions.map((q) => q.human_answer ? { ...q, approved: true } : q);
    setQuestions(updated);
    const allNowApproved = updated.every((q) => q.approved);
    if (allNowApproved) {
      await (supabase.from("questionnaires") as any).update({ status: "completed" }).eq("id", id);
      setQuestionnaire((prev: any) => prev ? { ...prev, status: "completed" } : prev);
    }
    setExpandedId(null);
  }

  async function saveAnswer(question: Question, newAnswer: string) {
    setSavingId(question.id);
    await (supabase.from("questions") as any).update({ human_answer: newAnswer }).eq("id", question.id);
    setQuestions((prev) => prev.map((q) => q.id === question.id ? { ...q, human_answer: newAnswer } : q));
    setSavingId(null);
  }

  async function toggleApprove(question: Question) {
    const newVal = !question.approved;
    await (supabase.from("questions") as any).update({ approved: newVal }).eq("id", question.id);
    const updated = questions.map((q) => q.id === question.id ? { ...q, approved: newVal } : q);
    setQuestions(updated);
    const totalApproved = updated.filter((q) => q.approved).length;
    const newStatus = totalApproved === updated.length && updated.length > 0 ? "completed" : "in_progress";
    await (supabase.from("questionnaires") as any).update({ status: newStatus }).eq("id", id);
    setQuestionnaire((prev: any) => prev ? { ...prev, status: newStatus } : prev);
    if (newVal) {
      const idx = questions.findIndex((q) => q.id === question.id);
      const next = questions.slice(idx + 1).find((q) => !q.approved);
      setExpandedId(next?.id ?? null);
    }
  }

  async function handleExport() {
    setExporting(true);
    const res = await fetch(`/api/questionnaires/${id}/export`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${questionnaire?.client_name ?? "cuestionario"}_respuestas.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  }

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#9AA6BD" }} />
    </div>
  );
  if (!questionnaire) return (
    <div style={{ padding: "80px 0", textAlign: "center", color: "#8794A8" }}>{t("notFound")}</div>
  );

  const hasAnswers = questions.some((q) => q.ai_answer);
  const approved = questions.filter((q) => q.approved).length;
  const highConf = questions.filter((q) => q.ai_confidence === "high").length;
  const medConf  = questions.filter((q) => q.ai_confidence === "medium").length;
  const categories = Array.from(new Set(questions.map((q) => q.category).filter(Boolean))) as string[];
  const filtered = filterCategory ? questions.filter((q) => q.category === filterCategory) : questions;

  return (
    <div style={{ maxWidth: 1080 }}>
      {/* Back */}
      <button
        onClick={() => router.push("/questionnaires")}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "#6B7892", fontFamily: "inherit", fontSize: 14, fontWeight: 600, padding: 0, marginBottom: 14 }}
      >
        <span style={{ fontSize: 17 }}>‹</span>{t("back")}
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 28, letterSpacing: "-0.02em", margin: 0 }}>
              {questionnaire.client_name} · {questionnaire.title}
            </h1>
            {questionnaire.standard && (
              <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#5A6678", background: "#F1F4F8", padding: "3px 8px", borderRadius: 6 }}>
                {questionnaire.standard}
              </span>
            )}
          </div>
          <p style={{ color: "#6B7892", fontSize: 14, margin: "7px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>
            {t("client")}: <strong style={{ color: "#142033" }}>{questionnaire.client_name}</strong>
            {" · "}{questions.length} {t("questions")}
            {" · "}{approved} {t("approved")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          {hasAnswers && (
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{ display: "flex", alignItems: "center", gap: 7, background: "#fff", color: "#5A6678", border: "1px solid #E2E8F0", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13.5, padding: "9px 16px", borderRadius: 10 }}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              )}
              {t("exportExcel")}
            </button>
          )}
          {hasAnswers && approved < questions.length && (
            <button
              onClick={handleApproveAll}
              style={{ background: "#0FB5A6", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13.5, padding: "9px 18px", borderRadius: 10, boxShadow: "0 10px 22px -12px rgba(15,181,166,0.8)" }}
            >
              {t("approveAll")}
            </button>
          )}
          {!hasAnswers ? (
            <button
              onClick={handleAnswerWithAI}
              disabled={answering}
              style={{ display: "flex", alignItems: "center", gap: 7, background: "#0FB5A6", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13.5, padding: "9px 18px", borderRadius: 10, boxShadow: "0 10px 22px -12px rgba(15,181,166,0.8)" }}
            >
              {answering && <Loader2 className="h-4 w-4 animate-spin" />}
              {answering ? t("answering") : t("answerWithAI")}
            </button>
          ) : (
            <button
              onClick={handleAnswerWithAI}
              disabled={answering}
              style={{ display: "flex", alignItems: "center", gap: 7, background: "#fff", color: "#5A6678", border: "1px solid #E2E8F0", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13.5, padding: "9px 16px", borderRadius: 10 }}
            >
              {answering ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              )}
              {answering ? t("answering") : t("reGenerate")}
            </button>
          )}
        </div>
      </div>

      {/* Summary banner */}
      {hasAnswers && !answering && (
        <div style={{ marginTop: 20, background: "#EAF7F5", border: "1px solid #CDEDE8", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 10, background: "#0FB5A6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 }}>✦</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 600, fontSize: 15.5, color: "#0C5F58" }}>{t("draftsReady", { count: questions.length })}</div>
            <div style={{ fontSize: 13.5, color: "#3F7A73", marginTop: 3 }}>{t("draftsReadySub")}</div>
          </div>
          <div style={{ flexShrink: 0, display: "flex", gap: 8 }}>
            {highConf > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#0E7E74", background: "#fff", border: "1px solid #CDEDE8", padding: "5px 11px", borderRadius: 999 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0E7E74", display: "inline-block" }} />
                {highConf} {t("confHighShort")}
              </span>
            )}
            {medConf > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#9A6400", background: "#fff", border: "1px solid #EFE0C0", padding: "5px 11px", borderRadius: 999 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#D8920B", display: "inline-block" }} />
                {medConf} {t("confMedShort")}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {hasAnswers && !answering && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7892", marginBottom: 6 }}>
            <span>{t("reviewProgress")}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{approved} / {questions.length}</span>
          </div>
          <div style={{ height: 6, background: "#EEF1F6", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${questions.length ? (approved / questions.length) * 100 : 0}%`, height: "100%", background: "#0FB5A6", borderRadius: 999, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {/* Error */}
      {answerError && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", marginTop: 16 }}>
          <AlertTriangle className="h-4 w-4" style={{ flexShrink: 0 }} />{answerError}
        </div>
      )}

      {/* Answering skeleton */}
      {answering && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#EAF7F5", border: "1px solid #CDEDE8", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14 }}>
            <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#0FB5A6", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: "#0C5F58", fontSize: 15 }}>{t("analyzing", { count: questions.length })}</div>
              <div style={{ fontSize: 13, color: "#3F7A73", marginTop: 3 }}>{t("analyzingDesc")}</div>
            </div>
          </div>
          {Array.from({ length: Math.min(5, questions.length || 5) }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Category filter */}
      {categories.length > 1 && !answering && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
          {[null, ...categories].map((cat) => (
            <button
              key={cat ?? "__all"}
              onClick={() => setFilterCategory(cat)}
              style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 999, border: "1px solid", cursor: "pointer", fontFamily: "inherit", borderColor: filterCategory === cat ? "#0F1A2E" : "#E7ECF2", background: filterCategory === cat ? "#0F1A2E" : "#fff", color: filterCategory === cat ? "#fff" : "#5A6678" }}
            >
              {cat ?? t("filterAll")}
            </button>
          ))}
        </div>
      )}

      {/* No answers yet */}
      {!hasAnswers && !answering && (
        <div style={{ background: "#fff", border: "1px solid #E7ECF2", borderRadius: 14, marginTop: 20, padding: "64px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#EEF6F5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <span style={{ width: 20, height: 20, border: "2.5px solid #0FB5A6", borderRadius: "50%", display: "inline-block" }} />
          </div>
          <div style={{ fontWeight: 600, color: "#142033", fontSize: 16 }}>{t("noAnswersYet", { count: questions.length })}</div>
          <div style={{ fontSize: 14, color: "#8794A8", marginTop: 6, maxWidth: 360 }}>{t("noAnswersDesc")}</div>
        </div>
      )}

      {/* Question cards */}
      {hasAnswers && !answering && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((q, idx) => {
            const isExpanded = expandedId === q.id;
            const qNum = String(q.order_index + 1).padStart(2, "0");
            const tag = q.category ? `Q-${qNum} · ${q.category.toUpperCase()}` : `Q-${qNum}`;

            return (
              <div
                key={q.id}
                style={{ background: q.approved ? "rgba(240,253,250,0.5)" : "#fff", border: `1px solid ${q.approved ? "#A7F3D0" : "#E7ECF2"}`, borderRadius: 14, padding: "18px 20px", cursor: "pointer" }}
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
              >
                {/* Top row: tag + confidence */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#9AA6BD", letterSpacing: "0.05em" }}>{tag}</span>
                  {q.ai_confidence && <ConfBadge conf={q.ai_confidence} />}
                </div>

                {/* Question text */}
                <div style={{ fontWeight: 600, fontSize: 15, color: "#142033", marginTop: 11, lineHeight: 1.45 }}>{q.text}</div>

                {/* AI answer box */}
                {!isExpanded && q.human_answer && (
                  <div style={{ fontSize: 14, color: "#3C4A60", lineHeight: 1.6, marginTop: 9, background: "#F7F9FB", border: "1px solid #EEF1F6", borderRadius: 11, padding: "13px 15px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {q.human_answer}
                  </div>
                )}

                {isExpanded && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {/* Full answer box */}
                    <div style={{ fontSize: 14, color: "#3C4A60", lineHeight: 1.6, marginTop: 9, background: "#F7F9FB", border: "1px solid #EEF1F6", borderRadius: 11, padding: "13px 15px" }}>
                      {q.human_answer ?? q.ai_answer}
                    </div>

                    {/* Editable textarea */}
                    <div style={{ marginTop: 10 }}>
                      <Textarea
                        style={{ minHeight: 110, fontSize: 14, resize: "vertical", fontFamily: "inherit" }}
                        value={q.human_answer ?? ""}
                        onChange={(e) => setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, human_answer: e.target.value } : item))}
                        onBlur={(e) => saveAnswer(q, e.target.value)}
                        placeholder={t("answerLabelAI")}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {savingId === q.id && <div style={{ fontSize: 12, color: "#9AA6BD", marginTop: 4 }}>{t("saving")}</div>}
                    </div>

                    {/* Source */}
                    {q.ai_source && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#6B7892", marginTop: 13, minWidth: 0 }}>
                        <span style={{ width: 13, height: 16, flexShrink: 0, border: "2px solid #0E8C82", borderRadius: 2, opacity: 0.75, display: "inline-block" }} />
                        <span style={{ fontWeight: 600, color: "#0E7E74" }}>{q.ai_source}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#9AA6BD" }}>· {t("source")}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 13 }}>
                      {q.ai_answer && q.human_answer !== q.ai_answer && (
                        <button
                          onClick={() => setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, human_answer: item.ai_answer } : item))}
                          style={{ background: "#fff", color: "#8794A8", border: "1px solid #E2E8F0", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, padding: "8px 15px", borderRadius: 9 }}
                        >
                          {t("restoreAI")}
                        </button>
                      )}
                      <button
                        onClick={() => { /* open edit inline — already handled by textarea */ }}
                        style={{ background: "#fff", color: "#5A6678", border: "1px solid #E2E8F0", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, padding: "8px 15px", borderRadius: 9 }}
                      >
                        {t("edit")}
                      </button>
                      <button
                        onClick={() => toggleApprove(q)}
                        disabled={!q.human_answer}
                        style={{ background: q.approved ? "#fff" : "#0FB5A6", color: q.approved ? "#0E7E74" : "#fff", border: q.approved ? "1px solid #A7F3D0" : "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, padding: "8px 16px", borderRadius: 9 }}
                      >
                        {q.approved ? t("unapprove") : t("approve")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* All approved banner */}
      {hasAnswers && approved === questions.length && questions.length > 0 && !answering && (
        <div style={{ marginTop: 16, background: "#EAF7F5", border: "1px solid #CDEDE8", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, color: "#0C5F58", fontSize: 15.5 }}>{t("allApproved")}</div>
            <div style={{ fontSize: 13.5, color: "#3F7A73", marginTop: 3 }}>{t("allApprovedDesc")}</div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{ display: "flex", alignItems: "center", gap: 7, background: "#0FB5A6", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13.5, padding: "10px 18px", borderRadius: 10, flexShrink: 0 }}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            )}
            {t("download")}
          </button>
        </div>
      )}
    </div>
  );
}
