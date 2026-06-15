"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Sparkles, Download, CheckCircle2, Circle,
  Loader2, AlertTriangle, ChevronDown, ChevronUp, BookOpen,
} from "lucide-react";

type Question = {
  id: string; text: string; category: string | null; order_index: number;
  ai_answer: string | null; ai_confidence: string | null; ai_source: string | null;
  human_answer: string | null; approved: boolean;
};

type Questionnaire = {
  id: string; title: string; client_name: string | null;
  status: string; total_questions: number; answered_questions: number;
};

const confidenceBadge: Record<string, string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-red-100 text-red-700",
};
const confidenceLabel: Record<string, string> = {
  high: "Alta confianza", medium: "Media confianza", low: "Baja confianza",
};

export default function QuestionnairePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

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
    // Auto-expand first unanswered
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

    // Move to next unapproved
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
  if (!questionnaire) return <div className="py-20 text-center text-muted-foreground">Cuestionario no encontrado</div>;

  const hasAnswers = questions.some((q) => q.ai_answer);
  const approved = questions.filter((q) => q.approved).length;
  const categories = Array.from(new Set(questions.map((q) => q.category).filter(Boolean))) as string[];
  const filtered = filterCategory ? questions.filter((q) => q.category === filterCategory) : questions;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push("/questionnaires")} className="mt-1 text-muted-foreground hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{questionnaire.title}</h1>
          <p className="text-muted-foreground">
            Cliente: <span className="font-medium text-gray-700">{questionnaire.client_name ?? "—"}</span>
            {" · "}{questions.length} preguntas · {approved} aprobadas
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {hasAnswers && (
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Exportar Excel
            </Button>
          )}
          {!hasAnswers ? (
            <Button onClick={handleAnswerWithAI} disabled={answering}>
              {answering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {answering ? "Respondiendo con IA…" : "Responder con IA"}
            </Button>
          ) : (
            <Button variant="outline" onClick={handleAnswerWithAI} disabled={answering}>
              {answering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Re-generar
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {hasAnswers && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progreso de revisión</span>
            <span>{approved} / {questions.length}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${questions.length ? (approved / questions.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* AI error */}
      {answerError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />{answerError}
        </div>
      )}

      {/* Answering overlay */}
      {answering && (
        <Card className="border-teal-200 bg-teal-50">
          <CardContent className="flex items-center gap-4 p-5">
            <Loader2 className="h-8 w-8 text-teal-500 animate-spin shrink-0" />
            <div>
              <p className="font-semibold text-teal-900">Respondiendo {questions.length} preguntas…</p>
              <p className="text-sm text-teal-600">Cautium está analizando tu base de conocimiento. Puede tardar 30–60 segundos.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategory(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!filterCategory ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterCategory === cat ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Empty state — no answers yet */}
      {!hasAnswers && !answering && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-12 w-12 text-gray-300 mb-3" />
            <p className="font-medium text-gray-700">{questions.length} preguntas listas</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Haz clic en "Responder con IA" para que Cautium analice tu base de conocimiento y responda automáticamente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      {hasAnswers && (
        <div className="grid gap-3">
          {filtered.map((q) => (
            <Card key={q.id} className={`overflow-hidden transition-shadow ${q.approved ? "border-green-200 bg-green-50/30" : "hover:shadow-md"}`}>
              {/* Question header */}
              <CardContent
                className="flex items-start gap-3 p-5 cursor-pointer"
                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
              >
                <button
                  className="mt-0.5 shrink-0"
                  onClick={(e) => { e.stopPropagation(); if (q.human_answer) toggleApprove(q); }}
                >
                  {q.approved
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                    : <Circle className="h-5 w-5 text-gray-300" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {q.category && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{q.category}</span>
                    )}
                    {q.ai_confidence && (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${confidenceBadge[q.ai_confidence]}`}>
                        {confidenceLabel[q.ai_confidence]}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-medium ${q.approved ? "text-gray-500 line-through" : "text-gray-900"}`}>
                    {q.order_index + 1}. {q.text}
                  </p>
                  {q.human_answer && expandedId !== q.id && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{q.human_answer}</p>
                  )}
                </div>
                {expandedId === q.id ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 mt-1" />}
              </CardContent>

              {/* Expanded answer editor */}
              {expandedId === q.id && (
                <div className="border-t px-5 pb-5 pt-4 space-y-4 bg-white">
                  {q.ai_source && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <BookOpen className="h-3.5 w-3.5" />
                      Fuente: <span className="font-medium text-gray-700">{q.ai_source}</span>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 block">
                      Respuesta {q.human_answer !== q.ai_answer ? "(editada)" : "(IA)"}
                    </label>
                    <Textarea
                      className="min-h-[120px] text-sm resize-y"
                      value={q.human_answer ?? ""}
                      onChange={(e) => setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, human_answer: e.target.value } : item))}
                      onBlur={(e) => saveAnswer(q, e.target.value)}
                    />
                    {savingId === q.id && <p className="text-xs text-gray-400 mt-1">Guardando…</p>}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      onClick={() => toggleApprove(q)}
                      variant={q.approved ? "outline" : "default"}
                      disabled={!q.human_answer}
                    >
                      {q.approved ? "Quitar aprobación" : "✓ Aprobar respuesta"}
                    </Button>
                    {q.ai_answer && q.human_answer !== q.ai_answer && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, human_answer: item.ai_answer } : item))}
                      >
                        Restaurar IA
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Export CTA when all approved */}
      {hasAnswers && approved === questions.length && questions.length > 0 && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="font-semibold text-green-900">¡Todas las respuestas aprobadas!</p>
              <p className="text-sm text-green-700">El cuestionario está listo para exportar.</p>
            </div>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Descargar Excel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
