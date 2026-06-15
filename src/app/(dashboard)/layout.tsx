import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getLocale } from "next-intl/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const locale = await getLocale();
  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "?";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F9FB", color: "#0F1A2E", fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <Sidebar locale={locale} />
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar userName={userName} locale={locale} />
        <div style={{ flex: 1, overflowY: "auto", padding: "34px 40px 60px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
