import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const riskColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

export default async function VendorsPage() {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: vendors } = await supabase.from("vendors").select("*").order("created_at", { ascending: false }) as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-muted-foreground">Manage your third-party relationships</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add vendor
        </Button>
      </div>

      {vendors && vendors.length > 0 ? (
        <div className="grid gap-4">
          {vendors.map((vendor: any) => (
            <Card key={vendor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-semibold">{vendor.name}</h3>
                  <p className="text-sm text-muted-foreground">{vendor.industry ?? "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  {vendor.risk_tier && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${riskColors[vendor.risk_tier]}`}>
                      {vendor.risk_tier.toUpperCase()}
                    </span>
                  )}
                  <Badge variant={vendor.status === "active" ? "default" : "secondary"}>
                    {vendor.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">No vendors yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first vendor to start tracking third-party risk.</p>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add vendor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
