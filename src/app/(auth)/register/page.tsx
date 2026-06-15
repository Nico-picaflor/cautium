"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSelector } from "@/components/ui/language-selector";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("auth");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName, org_name: orgName },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      router.push("/check-email");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FB]">
      <div className="absolute top-4 end-4">
        <LanguageSelector currentLocale="es" />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#E7ECF2] shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="7" fill="#0FB5A6"/>
                  <path d="M14 6l5 8H9l5-8z" fill="white" opacity="0.9"/>
                  <path d="M14 22l-5-8h10l-5 8z" fill="white" opacity="0.6"/>
                </svg>
                <span className="text-2xl font-bold text-[#0F1A2E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Cautium</span>
              </div>
            </div>
            <h1 className="text-xl font-bold text-[#0F1A2E]">{t("signUp")}</h1>
            <p className="text-sm text-[#5A6678] mt-1">{t("signUpDesc")}</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="orgName" className="text-sm font-medium text-[#0F1A2E]">{t("orgName")}</Label>
              <Input id="orgName" placeholder={t("orgNamePlaceholder")} value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium text-[#0F1A2E]">{t("fullName")}</Label>
              <Input id="fullName" placeholder={t("fullNamePlaceholder")} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-[#0F1A2E]">{t("email")}</Label>
              <Input id="email" type="email" placeholder={t("emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-[#0F1A2E]">{t("password")}</Label>
              <Input id="password" type="password" placeholder={t("passwordMin")} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("creatingAccount") : t("signUp")}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[#8794A8]">
            {t("haveAccount")}{" "}
            <Link href="/login" className="text-teal-600 hover:underline font-medium">{t("signInLink")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
