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

interface Props {
  searchParams?: { locale?: string };
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
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
            <h1 className="text-xl font-bold text-[#0F1A2E]">{t("signIn")}</h1>
            <p className="text-sm text-[#5A6678] mt-1">{t("signInDesc")}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-[#0F1A2E]">{t("email")}</Label>
              <Input
                id="email" type="email"
                placeholder={t("emailPlaceholder")}
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-[#0F1A2E]">{t("password")}</Label>
              <Input
                id="password" type="password"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("signingIn") : t("signIn")}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[#8794A8]">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-teal-600 hover:underline font-medium">{t("signUpLink")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
