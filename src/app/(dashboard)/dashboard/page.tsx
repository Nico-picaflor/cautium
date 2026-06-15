import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, ClipboardList, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ count: vendorCount }, { count: docCount }, { count: questionnaireCount }] =
    await Promise.all([
      (supabase.from("vendors") as any).select("*", { count: "exact", head: true }),
      (supabase.from("documents") as any).select("*", { count: "exact", head: true }),
      (supabase.from("questionnaires") as any).select("*", { count: "exact", head: true }),
    ]);

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "—";

  const stats = [
    { label: "Proveedores", value: vendorCount ?? 0, icon: Building2, sub: "registrados" },
    { label: "Documentos", value: docCount ?? 0, icon: FileText, sub: "indexados" },
    { label: "Cuestionarios", value: questionnaireCount ?? 0, icon: ClipboardList, sub: "en total" },
    { label: "Alto riesgo", value: 0, icon: AlertTriangle, sub: "proveedores" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Panel</h1>
        <p className="text-sm text-gray-500 mt-0.5">Hola de nuevo, <span className="font-medium text-gray-700">{name}</span></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, sub }) => (
          <Card key={label} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{sub}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 shrink-0">
                  <Icon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Cuestionarios abiertos</CardTitle>
          </CardHeader>
          <CardContent>
            {(questionnaireCount ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ClipboardList className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">Sin cuestionarios todavía</p>
                <a href="/questionnaires" className="text-xs text-teal-600 hover:underline mt-1">Subir cuestionario →</a>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Ve a <a href="/questionnaires" className="text-teal-600 hover:underline">Cuestionarios</a> para gestionar.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Base de conocimiento</CardTitle>
          </CardHeader>
          <CardContent>
            {(docCount ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">Sin documentos indexados</p>
                <a href="/documents" className="text-xs text-teal-600 hover:underline mt-1">Subir políticas →</a>
              </div>
            ) : (
              <p className="text-sm text-gray-500"><span className="font-semibold text-gray-800">{docCount}</span> documentos indexados y listos.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
