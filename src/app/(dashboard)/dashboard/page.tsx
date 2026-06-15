import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

// ── helpers ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, sub, subColor }: {
  label: string; value: number; icon: React.ReactNode; sub: string; subColor: string;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E7ECF2", borderRadius: 14, padding: "18px 18px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "#6B7892", fontWeight: 500 }}>{label}</span>
        {icon}
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 32, marginTop: 10, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 12, color: subColor, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>
    </div>
  );
}

function KpiIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C3CCDA" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function ProgressRow({ label, count, barW }: { label: string; count: number; barW: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 128, flexShrink: 0, fontSize: 13, fontWeight: 600, color: "#142033" }}>{label}</div>
      <div style={{ flex: 1, height: 10, background: "#EEF1F6", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: barW, height: "100%", background: "#0FB5A6", borderRadius: 999 }} />
      </div>
      <div style={{ width: 18, flexShrink: 0, textAlign: "end", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#5A6678" }}>{count}</div>
    </div>
  );
}

type Questionnaire = {
  id: string;
  title: string;
  client_name: string | null;
  standard: string | null;
  status: string;
  answered_questions: number;
  total_questions: number;
  due_date: string | null;
};

// ── page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = createClient();
  const t = await getTranslations("dashboard");
  const { data: { user } } = await supabase.auth.getUser();
  const name = user?.user_metadata?.full_name?.split(" ")[0]
    || user?.email?.split("@")[0]
    || "—";

  const [
    { count: vendorCount },
    { count: docCount },
    { data: questionnaires },
    { data: documents },
  ] = await Promise.all([
    (supabase.from("vendors") as any).select("*", { count: "exact", head: true }),
    (supabase.from("documents") as any).select("*", { count: "exact", head: true }),
    (supabase.from("questionnaires") as any)
      .select("id,title,client_name,standard,status,answered_questions,total_questions,due_date")
      .order("created_at", { ascending: false }),
    (supabase.from("documents") as any).select("frameworks"),
  ]);

  const openQuestionnaires: Questionnaire[] = (questionnaires ?? []).filter(
    (q: Questionnaire) => q.status !== "completed"
  );
  const totalQuestions = (questionnaires ?? []).reduce((s: number, q: Questionnaire) => s + (q.total_questions ?? 0), 0);

  // framework coverage
  const fwMap: Record<string, number> = {};
  for (const doc of documents ?? []) {
    for (const fw of doc.frameworks ?? []) {
      fwMap[fw] = (fwMap[fw] ?? 0) + 1;
    }
  }
  const fwEntries = Object.entries(fwMap).sort((a, b) => b[1] - a[1]);
  const maxFw = fwEntries[0]?.[1] ?? 1;

  // time saved: each answered question saves ~15 min
  const totalAnswered = (questionnaires ?? []).reduce((s: number, q: Questionnaire) => s + (q.answered_questions ?? 0), 0);
  const hoursSaved = Math.round((totalAnswered * 15) / 60);

  const questionnaireCount = (questionnaires ?? []).length;
  const inProgressCount = openQuestionnaires.length;

  return (
    <div style={{ maxWidth: 1080 }}>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 30, letterSpacing: "-0.02em", margin: 0 }}>
        {t("title")}
      </h1>
      <p style={{ color: "#6B7892", fontSize: 15.5, margin: "7px 0 28px" }}>
        {t("welcome", { name })}
      </p>

      {/* Row A — KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <KpiCard
          label={t("vendors")}
          value={vendorCount ?? 0}
          sub={vendorCount ? `${vendorCount} ${t("vendorsSub")}` : t("noVendorsYet")}
          subColor={vendorCount ? "#5A6678" : "#9AA6BD"}
          icon={<KpiIcon><path d="M3 21h18"/><path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M19 21V11a1 1 0 0 0-1-1h-3"/><path d="M9 8h2M9 12h2M9 16h2"/></KpiIcon>}
        />
        <KpiCard
          label={t("documents")}
          value={docCount ?? 0}
          sub={docCount ? `${docCount} ${t("documentsSub")}` : t("noDocumentsYet")}
          subColor={docCount ? "#1F9D6B" : "#9AA6BD"}
          icon={<KpiIcon><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h5"/></KpiIcon>}
        />
        <KpiCard
          label={t("questionnaires")}
          value={questionnaireCount}
          sub={inProgressCount ? `${inProgressCount} ${t("questionnairesSub")}` : t("noQuestionnairesYet")}
          subColor={inProgressCount ? "#E8920B" : "#9AA6BD"}
          icon={<KpiIcon><rect x="8" y="3" width="8" height="4" rx="1.2"/><path d="M16 5h1.5A1.5 1.5 0 0 1 19 6.5v13A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-13A1.5 1.5 0 0 1 6.5 5H8"/><path d="M9 12h6M9 16h6"/></KpiIcon>}
        />
        <KpiCard
          label={t("highRisk")}
          value={0}
          sub={t("highRiskSub")}
          subColor="#9AA6BD"
          icon={<KpiIcon><path d="M10.3 3.5 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></KpiIcon>}
        />
      </div>

      {/* Row B — Framework coverage + Time saved */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #E7ECF2", borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16 }}>{t("fwCoverage")}</div>
              <div style={{ fontSize: 13, color: "#8794A8", marginTop: 3 }}>{t("fwCoverageSub", { count: docCount ?? 0 })}</div>
            </div>
            {(docCount ?? 0) > 0 && (
              <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "#0E7E74", background: "#E3F6F3", padding: "4px 10px", borderRadius: 999 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0FB5A6", display: "inline-block" }} />
                {docCount} {t("documentsSub")}
              </span>
            )}
          </div>
          {fwEntries.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 20 }}>
              {fwEntries.map(([fw, count]) => (
                <ProgressRow key={fw} label={fw} count={count} barW={`${Math.round((count / maxFw) * 100)}%`} />
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 24, textAlign: "center", color: "#9AA6BD", fontSize: 13.5 }}>
              {t("noDocuments")}
              {" · "}
              <Link href="/documents" style={{ color: "#0E8C82", fontWeight: 600 }}>{t("uploadPolicies")}</Link>
            </div>
          )}
        </div>

        <div style={{ background: "#fff", border: "1px solid #E7ECF2", borderRadius: 14, padding: 22, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#6B7892", fontWeight: 600 }}>{t("savedTime")}</span>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: "#EEF6F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ width: 13, height: 13, border: "2px solid #0FB5A6", borderRadius: "50%", display: "inline-block" }} />
            </span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 42, letterSpacing: "-0.02em", marginTop: 14, lineHeight: 1 }}>
            {hoursSaved} h
          </div>
          <div style={{ fontSize: 13.5, color: "#5A6678", lineHeight: 1.55, marginTop: 12 }}>
            {t("savedTimeSub", { count: totalQuestions - totalAnswered })}
          </div>
          <Link
            href="/questionnaires"
            style={{ marginTop: 18, alignSelf: "flex-start", background: "#0FB5A6", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13.5, padding: "10px 16px", borderRadius: 10, textDecoration: "none", display: "inline-block" }}
          >
            {t("answerWithAI")}
          </Link>
        </div>
      </div>

      {/* Row C — Open questionnaires + Risk distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #E7ECF2", borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16 }}>{t("openQuestionnaires")}</div>
            <Link href="/questionnaires" style={{ background: "none", border: "none", cursor: "pointer", color: "#0E8C82", fontFamily: "inherit", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
              {t("viewAll")}
            </Link>
          </div>
          {openQuestionnaires.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "22px 16px" }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: "#EEF6F5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <span style={{ width: 18, height: 18, border: "2.5px solid #0FB5A6", borderRadius: "50%", display: "inline-block" }} />
              </div>
              <div style={{ fontSize: 14, color: "#5A6678" }}>{t("noQuestionnaires")}</div>
              <Link href="/questionnaires" style={{ marginTop: 12, background: "#0FB5A6", color: "#fff", fontWeight: 600, fontSize: 13.5, padding: "9px 16px", borderRadius: 10, textDecoration: "none", display: "inline-block" }}>
                {t("uploadQuestionnaire")}
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {openQuestionnaires.slice(0, 3).map((q) => {
                const pct = q.total_questions > 0 ? Math.round((q.answered_questions / q.total_questions) * 100) : 0;
                return (
                  <Link
                    key={q.id}
                    href={`/questionnaires/${q.id}`}
                    style={{ textAlign: "start", background: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", gap: 9, padding: "13px 14px", border: "1px solid #EDF1F6", borderRadius: 11, textDecoration: "none", color: "inherit" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%" }}>
                      <span style={{ fontWeight: 600, fontSize: 14.5, color: "#142033" }}>
                        {q.client_name} · {q.title}
                      </span>
                      <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 600, color: "#0E7E74", background: "#E3F6F3", padding: "4px 10px", borderRadius: 999 }}>
                        {t("inProgress")}
                      </span>
                    </div>
                    <div style={{ height: 6, width: "100%", background: "#EEF1F6", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "#0FB5A6", borderRadius: 999 }} />
                    </div>
                    <div style={{ fontSize: 12, color: "#8794A8", fontFamily: "'JetBrains Mono', monospace" }}>
                      {q.answered_questions ?? 0} / {q.total_questions ?? 0}
                      {q.due_date && ` · ${t("due")} ${new Date(q.due_date).toLocaleDateString()}`}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ background: "#fff", border: "1px solid #E7ECF2", borderRadius: 14, padding: 22 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{t("riskDist")}</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "22px 16px 6px" }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "#EEF6F5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <span style={{ width: 18, height: 18, border: "2.5px solid #0FB5A6", borderRadius: "50%", display: "inline-block" }} />
            </div>
            <div style={{ fontSize: 14.5, color: "#5A6678", lineHeight: 1.5, maxWidth: 260 }}>{t("emptyRisk")}</div>
            <Link
              href="/vendors"
              style={{ marginTop: 16, background: "#0FB5A6", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14, padding: "10px 18px", borderRadius: 10, textDecoration: "none", display: "inline-block" }}
            >
              {t("addVendor")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
