import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, ClipboardList, AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("dashboard");

  const [{ count: vendorCount }, { count: docCount }, { count: questionnaireCount }] =
    await Promise.all([
      (supabase.from("vendors") as any).select("*", { count: "exact", head: true }),
      (supabase.from("documents") as any).select("*", { count: "exact", head: true }),
      (supabase.from("questionnaires") as any).select("*", { count: "exact", head: true }),
    ]);

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "—";

  const stats = [
    { label: t("vendors"), value: vendorCount ?? 0, icon: Building2, sub: t("vendorsSub") },
    { label: t("documents"), value: docCount ?? 0, icon: FileText, sub: t("documentsSub") },
    { label: t("questionnaires"), value: questionnaireCount ?? 0, icon: ClipboardList, sub: t("questionnairesSub") },
    { label: t("highRisk"), value: 0, icon: AlertTriangle, sub: t("highRiskSub") },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1A2E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {t("title")}
        </h1>
        <p className="text-sm text-[#5A6678] mt-0.5">
          {t("welcome", { name })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, sub }) => (
          <Card key={label} className="overflow-hidden border-[#E7ECF2]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#8794A8] uppercase tracking-wide">{label}</p>
                  <p className="text-3xl font-bold text-[#0F1A2E] mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
                  <p className="text-xs text-[#8794A8] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{sub}</p>
                </div>
                <div className="bg-[#F7F9FB] rounded-lg p-2 shrink-0">
                  <Icon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-[#E7ECF2]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#5A6678]">{t("openQuestionnaires")}</CardTitle>
          </CardHeader>
          <CardContent>
            {(questionnaireCount ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ClipboardList className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-sm text-[#8794A8]">{t("noQuestionnaires")}</p>
                <Link href="/questionnaires" className="text-xs text-teal-600 hover:underline mt-1">
                  {t("uploadQuestionnaire")}
                </Link>
              </div>
            ) : (
              <p className="text-sm text-[#8794A8]">
                <Link href="/questionnaires" className="text-teal-600 hover:underline">{t("questionnaires")}</Link>
                {" · "}{t("manageQuestionnaires")}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-[#E7ECF2]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#5A6678]">{t("knowledgeBase")}</CardTitle>
          </CardHeader>
          <CardContent>
            {(docCount ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-sm text-[#8794A8]">{t("noDocuments")}</p>
                <Link href="/documents" className="text-xs text-teal-600 hover:underline mt-1">
                  {t("uploadPolicies")}
                </Link>
              </div>
            ) : (
              <p className="text-sm text-[#5A6678]">
                <span className="font-semibold text-[#0F1A2E]">{docCount}</span>{" "}
                {t("documentsReady", { count: docCount ?? 0 })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
