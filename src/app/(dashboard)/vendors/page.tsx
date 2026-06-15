import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border border-red-200",
  high: "bg-orange-50 text-orange-700 border border-orange-200",
  medium: "bg-amber-50 text-amber-700 border border-amber-200",
  low: "bg-green-50 text-green-700 border border-green-200",
};

export default async function VendorsPage() {
  const supabase = createClient();
  const t = await getTranslations("vendors");
  const { data: vendors } = await supabase.from("vendors").select("*").order("created_at", { ascending: false }) as any;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1A2E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t("title")}</h1>
          <p className="text-sm text-[#5A6678] mt-0.5">{t("desc")}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 me-2" />{t("add")}
        </Button>
      </div>

      {vendors && vendors.length > 0 ? (
        <div className="grid gap-2">
          {vendors.map((vendor: any) => (
            <Card key={vendor.id} className="border-[#E7ECF2] hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-[#F7F9FB] rounded-lg p-2">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F1A2E]">{vendor.name}</h3>
                    <p className="text-sm text-[#8794A8]">{vendor.industry ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {vendor.risk_tier && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${RISK_COLORS[vendor.risk_tier] ?? RISK_COLORS.low}`}>
                      {vendor.risk_tier.toUpperCase()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-[#E7ECF2]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mb-3" />
            <p className="font-medium text-[#0F1A2E]">{t("none")}</p>
            <p className="text-sm text-[#8794A8] mt-1">{t("noneDesc")}</p>
            <Button className="mt-4">
              <Plus className="h-4 w-4 me-2" />{t("add")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
