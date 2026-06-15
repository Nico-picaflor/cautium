import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function CheckEmailPage() {
  const t = await getTranslations("auth");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FB]">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#E7ECF2] shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="#0FB5A6"/>
                <path d="M14 6l5 8H9l5-8z" fill="white" opacity="0.9"/>
                <path d="M14 22l-5-8h10l-5 8z" fill="white" opacity="0.6"/>
              </svg>
              <span className="text-xl font-bold text-[#0F1A2E]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Cautium</span>
            </div>
          </div>
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#0F1A2E] mb-2">{t("checkEmail")}</h1>
          <p className="text-sm text-[#5A6678]">{t("checkEmailDesc")}</p>
          <p className="mt-6 text-sm text-[#8794A8]">
            {t("haveAccount")}{" "}<Link href="/login" className="text-teal-600 hover:underline font-medium">{t("signInLink")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
