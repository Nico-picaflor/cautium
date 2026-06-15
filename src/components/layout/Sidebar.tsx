"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

interface Props {
  locale: string;
}

const NAV_ICONS = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="7" height="9" rx="1.2" />
      <rect x="14" y="3" width="7" height="5" rx="1.2" />
      <rect x="14" y="12" width="7" height="9" rx="1.2" />
      <rect x="3" y="16" width="7" height="5" rx="1.2" />
    </svg>
  ),
  vendors: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M3 21h18" />
      <path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
      <path d="M19 21V11a1 1 0 0 0-1-1h-3" />
      <path d="M9 8h2M9 12h2M9 16h2" />
    </svg>
  ),
  documents: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h5" />
    </svg>
  ),
  questionnaires: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="8" y="3" width="8" height="4" rx="1.2" />
      <path d="M16 5h1.5A1.5 1.5 0 0 1 19 6.5v13A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-13A1.5 1.5 0 0 1 6.5 5H8" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  signOut: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
      <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
};

export default function Sidebar({ locale }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("nav");

  const navItems = [
    { href: "/dashboard", label: t("panel"), icon: NAV_ICONS.dashboard },
    { href: "/vendors", label: t("vendors"), icon: NAV_ICONS.vendors },
    { href: "/documents", label: t("documents"), icon: NAV_ICONS.documents },
    { href: "/questionnaires", label: t("questionnaires"), icon: NAV_ICONS.questionnaires },
    { href: "/settings", label: t("settings"), icon: NAV_ICONS.settings },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navBase: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "start",
    border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14.5, fontWeight: 600,
    padding: "10px 12px", borderRadius: 10, background: "none", color: "#5A6678",
    textDecoration: "none", transition: "background 0.15s",
  };
  const navActive: React.CSSProperties = { ...navBase, background: "#E6F7F5", color: "#0C7A70" };

  return (
    <aside style={{ width: 248, flexShrink: 0, background: "#FFFFFF", borderInlineEnd: "1px solid #E7ECF2", display: "flex", flexDirection: "column", padding: "22px 16px" }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "4px 8px 22px" }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(140deg,#1FD3C2,#0E8C82)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px -8px rgba(15,181,166,0.7)", flexShrink: 0 }}>
          <div style={{ width: 12, height: 12, background: "#FFFFFF", transform: "rotate(45deg)", borderRadius: 2 }} />
        </div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 18, letterSpacing: "-0.02em", lineHeight: 1 }}>Cautium</div>
          <div style={{ fontSize: 11.5, color: "#8794A8", marginTop: 3 }}>{t("brandSub")}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={active ? navActive : navBase}>
              {icon}
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{ marginTop: "auto", paddingTop: 18, borderTop: "1px solid #EEF1F6" }}>
        <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", background: "none", border: "none", cursor: "pointer", color: "#6B7892", fontFamily: "inherit", fontSize: 14.5, fontWeight: 500, padding: "9px 12px", borderRadius: 10 }}>
          {NAV_ICONS.signOut}
          {t("signOut")}
        </button>
      </div>
    </aside>
  );
}
