import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, FileText, ClipboardList, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ count: vendorCount }, { count: docCount }, { count: questionnaireCount }] =
    await Promise.all([
      supabase.from("vendors").select("*", { count: "exact", head: true }),
      supabase.from("documents").select("*", { count: "exact", head: true }),
      supabase.from("questionnaires").select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    { label: "Total Vendors", value: vendorCount ?? 0, icon: Building2, color: "text-blue-600" },
    { label: "Documents", value: docCount ?? 0, icon: FileText, color: "text-green-600" },
    { label: "Questionnaires", value: questionnaireCount ?? 0, icon: ClipboardList, color: "text-purple-600" },
    { label: "High Risk Vendors", value: 0, icon: AlertTriangle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.user_metadata?.full_name ?? user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No vendors yet. Add your first vendor to start tracking risk.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open Questionnaires</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No questionnaires sent. Create one to assess vendor risk.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
