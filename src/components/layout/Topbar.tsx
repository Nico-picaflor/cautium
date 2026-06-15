"use client";

import { useRouter } from "next/navigation";
import { LanguageSelector } from "@/components/ui/language-selector";

interface Props {
  userName: string;
  locale: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function Topbar({ userName, locale }: Props) {
  return (
    <div
      className="flex items-center justify-end gap-3.5 px-8 py-3.5 border-b sticky top-0 z-10"
      style={{
        borderColor: "#EAEEF3",
        background: "rgba(247,249,251,0.8)",
        backdropFilter: "blur(8px)",
      }}
    >
      <LanguageSelector currentLocale={locale} />

      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
        style={{
          background: "linear-gradient(140deg,#1FD3C2,#0E8C82)",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {initials(userName) || "?"}
      </div>
    </div>
  );
}
