import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations, getLocale } from "next-intl/server";
import { LanguageSelector } from "@/components/ui/language-selector";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations("settings");
  const locale = await getLocale();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1A2E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {t("title")}
        </h1>
        <p className="text-sm text-[#5A6678] mt-0.5">{t("desc")}</p>
      </div>

      <Card className="border-[#E7ECF2]">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#5A6678]">{t("accountSection")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between py-1 border-b border-[#F7F9FB]">
            <span className="text-[#8794A8]">{t("email")}</span>
            <span className="text-[#0F1A2E]">{user?.email}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#F7F9FB]">
            <span className="text-[#8794A8]">{t("name")}</span>
            <span className="text-[#0F1A2E]">{user?.user_metadata?.full_name || user?.email?.split("@")[0] || "—"}</span>
          </div>
          <div className="flex justify-between py-1 items-center">
            <span className="text-[#8794A8]">{t("userId")}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-xs text-gray-300">
              {user?.id ? `${user.id.slice(0, 8)}…` : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E7ECF2]">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#5A6678]">{t("languageSection")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#0F1A2E]">{t("languageLabel")}</p>
              <p className="text-xs text-[#8794A8] mt-0.5">Afecta la interfaz y los exportes</p>
            </div>
            <LanguageSelector currentLocale={locale} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E7ECF2]">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#5A6678]">{t("planSection")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[#5A6678]">
          <p>{t("freePlan")} · <a href="mailto:hola@cautium.org" className="text-teal-600 hover:underline">{t("contactPro")}</a></p>
        </CardContent>
      </Card>
    </div>
  );
}
