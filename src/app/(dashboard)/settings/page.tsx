import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Ajustes</h1>
        <p className="text-sm text-gray-500">Gestiona tu cuenta y organización</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700">Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900">{user?.email}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Nombre</span>
            <span className="text-gray-900">{user?.user_metadata?.full_name || user?.email?.split("@")[0] || "—"}</span>
          </div>
          <div className="flex justify-between py-1 items-center">
            <span className="text-gray-500">ID de usuario</span>
            <span className="font-mono text-xs text-gray-300">
              {user?.id ? `${user.id.slice(0, 8)}…` : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700">Plan</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">
          <p>Plan gratuito · <a href="mailto:hola@cautium.org" className="text-teal-600 hover:underline">Contactar para Pro</a></p>
        </CardContent>
      </Card>
    </div>
  );
}
