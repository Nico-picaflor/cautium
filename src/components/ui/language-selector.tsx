"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

interface Props {
  currentLocale: string;
  compact?: boolean;
}

export function LanguageSelector({ currentLocale, compact = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = LANGUAGES.find((l) => l.code === currentLocale) ?? LANGUAGES[0];

  async function select(code: string) {
    if (code === currentLocale) { setOpen(false); return; }
    setSaving(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: code }),
    });
    setOpen(false);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className={cn(
          "flex items-center gap-1.5 rounded-lg text-sm font-medium transition-colors",
          compact
            ? "px-2 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            : "px-3 py-2 border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
        )}
      >
        <Globe className="h-3.5 w-3.5 shrink-0" />
        <span>{current.flag} {!compact && current.label}</span>
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
            style={{ bottom: compact ? "calc(100% + 4px)" : undefined, top: compact ? undefined : "calc(100% + 4px)" }}>
            <div className="max-h-72 overflow-y-auto py-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => select(lang.code)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span className={lang.code === currentLocale ? "font-semibold text-teal-700" : "text-gray-700"}>
                    {lang.label}
                  </span>
                  {lang.code === currentLocale && (
                    <Check className="h-3.5 w-3.5 text-teal-600 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
