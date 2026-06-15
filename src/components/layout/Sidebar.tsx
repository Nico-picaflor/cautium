"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, FileText, ClipboardList, Settings, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/vendors", label: "Proveedores", icon: Building2 },
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/questionnaires", label: "Cuestionarios", icon: ClipboardList },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {/* Cautium logo — teal rounded square + diamond */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#0FB5A6"/>
            <path d="M14 6l5 8H9l5-8z" fill="white" opacity="0.9"/>
            <path d="M14 22l-5-8h10l-5 8z" fill="white" opacity="0.6"/>
          </svg>
          <span className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Cautium</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Third Party Risk</p>
      </div>

      <nav className="flex-1 p-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-teal-600" : "text-gray-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 w-full transition-colors"
        >
          <LogOut className="h-4 w-4 text-gray-400" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
