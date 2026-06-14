import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Sparkles } from "lucide-react";

const typeColors: Record<string, string> = {
  contract: "bg-blue-100 text-blue-700",
  policy: "bg-purple-100 text-purple-700",
  certificate: "bg-green-100 text-green-700",
  report: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

export default async function DocumentsPage() {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: documents } = await supabase.from("documents").select("*, vendors(name)").order("created_at", { ascending: false }) as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-muted-foreground">Upload and analyze contracts, policies, and certificates</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload document
        </Button>
      </div>

      {documents && documents.length > 0 ? (
        <div className="grid gap-4">
          {documents.map((doc: any) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-gray-400" />
                  <div>
                    <h3 className="font-semibold">{doc.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {(doc as any).vendors?.name ?? "No vendor"} ·{" "}
                      {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[doc.type]}`}>
                    {doc.type}
                  </span>
                  {doc.ai_analyzed_at ? (
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI analyzed
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      Analyze
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-muted-foreground">No documents yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Upload contracts and policies to analyze them with AI.</p>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Upload document
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
