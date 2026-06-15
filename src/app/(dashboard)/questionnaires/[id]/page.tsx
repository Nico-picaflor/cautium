"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Sparkles, Download, CheckCircle2, Circle,
  Loader2, AlertTriangle, ChevronDown, ChevronUp, BookOpen,
} from "lucide-react";
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

const CONFIDENCE_BADGE: Record<string, string> = {
  high: "bg-green-50 text-green-700 border border-green-200",
  medium: "bg-amber-50 text-amber-700 border border-amber-200",
  low: "bg-red-50 text-red-700 border border-red-200",
};

function SkeletonRow() {
  return (
    <Card className="border-[#E7ECF2]">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
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

  async function saveAnswer(question: Question, newAnswer: string) {
    setSavingId(question.id);
    await (supabase.from("questions") as any)
      .update({ human_answer: newAnswer })
      .eq("id", question.id);
    setQuestions((prev) => prev.map((q) => q.id === question.id ? { ...q, human_answer: newAnswer } : q));
    setSavingId(null);
  }

  async function toggleApprove(question: Question) {
    const newVal = !question.approved;
    await (supabase.from("questions") as any)
      .update({ approved: newVal })
      .eq("id", question.id);
    setQuestions((prev) => prev.map((q) => q.id === question.id ? { ...q, approved: newVal } : q));
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  if (!questionnaire) return <div className="py-20 text-center text-[#8794A8]">{t("notFound")}</div>;

  const hasAnswers = questions.some((q) => q.ai_answer);
  const approved = questions.filter((q) => q.approved).length;
  const categories = Array.from(new Set(questions.map((q) => q.category).filter(Boolean))) as string[];
  const filtered = filterCategory ? questions.filter((q) => q.category === filterCategory) : questions;

  const confidenceLabel: Record<string, string> = {
    high: t("confidenceHigh"),
    medium: t("confidenceMedium"),
    low: t("confidenceLow"),
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start gap-4">
        <button onClick={() => router.push("/questionnaires")} className="mt-1 text-[#8794A8] hover:text-[#0F1A2E] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[#0F1A2E] truncate" style={{ fontFamily: "\'Space Grotesk\', sans-serif" }}>
              {questionnaire.title}
            </h1>
            {questionnaire.standard && (
              <span className="text-xs px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 shrink-0" style={{ fontFamily: "\'JetBrains Mono\', monospace" }}>
                {questionnaire.standard}
              </span>
            )}
          </div>
          <p className="text-sm text-[#5A6678] mt-0.5">
            {t("client")}: <span className="font-medium text-[#0F1A2E]">{questionnaire.client_name ?? "—"}</span>
            {" · "}{t("questions", { count: questions.length })} · {t("approved", { count: approved })}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {hasAnswers && (
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Download className="h-4 w-4 me-2" />}
              {exporting ? t("exporting") : t("exportExcel")}
            </Button>
          )}
          {!hasAnswers ? (
            <Button onClick={handleAnswerWithAI} disabled={answering}>
              {answering ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Sparkles className="h-4 w-4 me-2" />}
              {answering ? t("answering") : t("answerWithAI")}
            </Button>
          ) : (
            <Button variant="outline" onClick={handleAnswerWithAI} disabled={answering}>
              {answering ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Sparkles className="h-4 w-4 me-2" />}
              {answering ? t("answering") : t("reGenerate")}
            </Button>
          )}
        </div>
      </div>

      {hasAnswers && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-[#5A6678]">
            <span>{t("reviewProgress")}</span>
            <span style={{ fontFamily: "\'JetBrains Mono\', monospace" }}>{approved} / {questions.length}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${questions.length ? (approved / questions.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {answerError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />{answerError}
        </div>
      )}

      {answering && (
        <div className="space-y-3">
          <Card className="border-teal-200 bg-teal-50">
            <CardContent className="flex items-center gap-4 p-5">
              <Loader2 className="h-8 w-8 text-teal-500 animate-spin shrink-0" />
              <div>
                <p className="font-semibold text-teal-900">{t("analyzing", { count: questions.length })}</p>
                <p className="text-sm text-teal-600">{t("analyzingDesc")}</p>
              </div>
            </CardContent>
          </Card>
          {questions.slice(0, 6).map((q) => (
            <Card key={q.id} className="border-[#E7ECF2]">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-[#0F1A2E]">{q.order_index + 1}. {q.text}</p>
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {questions.length > 6 && Array.from({ length: Math.min(4, questions.length - 6) }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {categories.length > 1 && !answering && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCategory(null)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!filterCategory ? "bg-[#0F1A2E] text-white border-[#0F1A2E]" : "border-[#E7ECF2] text-[#5A6678] hover:border-gray-300"}`}>
            {t("filterAll")}
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat === filterCategory ? null : cat)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterCategory === cat ? "bg-[#0F1A2E] text-white border-[#0F1A2E]" : "border-[#E7ECF2] text-[#5A6678] hover:border-gray-300"}`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {!hasAnswers && !answering && (
        <Card className="border-[#E7ECF2]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-12 w-12 text-gray-300 mb-3" />
            <p className="font-medium text-[#0F1A2E]">{t("noAnswersYet", { count: questions.length })}</p>
            <p className="text-sm text-[#8794A8] mt-1 max-w-sm">{t("noAnswersDesc")}</p>
          </CardContent>
        </Card>
      )}

      {hasAnswers && !answering && (
        <div className="grid gap-2">
          {filtered.map((q) => (
            <Card key={q.id} className={`overflow-hidden transition-shadow ${q.approved ? "border-green-200 bg-green-50/30" : "border-[#E7ECF2] hover:shadow-md"}`}>
              <CardContent className="flex items-start gap-3 p-5 cursor-pointer" onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}>
                <button className="mt-0.5 shrink-0" onClick={(e) => { e.stopPropagation(); if (q.human_answer) toggleApprove(q); }}>
                  {q.approved ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-gray-300" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {q.category && <span className="text-xs text-[#8794A8] bg-gray-100 px-2 py-0.5 rounded">{q.category}</span>}
                    {q.ai_confidence && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONFIDENCE_BADGE[q.ai_confidence]}`}>
                        {confidenceLabel[q.ai_confidence]}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-medium ${q.approved ? "text-gray-400 line-through" : "text-[#0F1A2E]"}`}>
                    {q.order_index + 1}. {q.text}
                  </p>
                  {q.human_answer && expandedId !== q.id && (
                    <p className="text-sm text-[#5A6678] mt-1 line-clamp-1">{q.human_answer}</p>
                  )}
                </div>
                {expandedId === q.id ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 mt-1" />}
              </CardContent>

              {expandedId === q.id && (
                <div className="border-t border-[#E7ECF2] px-5 pb-5 pt-4 space-y-4 bg-white">
                  {q.ai_source && (
                    <div className="flex items-center gap-2 text-xs text-[#8794A8]">
                      <BookOpen className="h-3.5 w-3.5" />
                      {t("source")}: <span className="font-medium text-[#5A6678]">{q.ai_source}</span>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-[#8794A8] mb-2 block">
                      {q.human_answer !== q.ai_answer ? t("answerLabelEdited") : t("answerLabelAI")}
                    </label>
                    <Textarea
                      className="min-h-[120px] text-sm resize-y"
                      value={q.human_answer ?? ""}
                      onChange={(e) => setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, human_answer: e.target.value } : item))}
                      onBlur={(e) => saveAnswer(q, e.target.value)}
                    />
                    {savingId === q.id && <p className="text-xs text-[#8794A8] mt-1">{t("saving")}</p>}
                  </div>
                  <div className="flex gap-3">
                    <Button size="sm" onClick={() => toggleApprove(q)} variant={q.approved ? "outline" : "default"} disabled={!q.human_answer}>
                      {q.approved ? t("unapprove") : t("approve")}
                    </Button>
                    {q.ai_answer && q.human_answer !== q.ai_answer && (
                      <Button size="sm" variant="ghost" onClick={() => setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, human_answer: item.ai_answer } : item))}>
                        {t("restoreAI")}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {hasAnswers && approved === questions.length && questions.length > 0 && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="font-semibold text-green-900">{t("allApproved")}</p>
              <p className="text-sm text-green-700">{t("allApprovedDesc")}</p>
            </div>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Download className="h-4 w-4 me-2" />}
              {t("download")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
