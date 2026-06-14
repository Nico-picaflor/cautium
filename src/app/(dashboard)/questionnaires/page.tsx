import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  sent: "outline",
  in_progress: "default",
  completed: "default",
  expired: "destructive",
};

export default async function QuestionnairesPage() {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questionnaires } = await supabase.from("questionnaires").select("*, vendors(name)").order("created_at", { ascending: false }) as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questionnaires</h1>
          <p className="text-muted-foreground">Send risk assessments to your vendors</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New questionnaire
        </Button>
      </div>

      {questionnaires && questionnaires.length > 0 ? (
        <div className="grid gap-4">
          {questionnaires.map((q: any) => (
            <Card key={q.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-semibold">{q.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(q as any).vendors?.name ?? "No vendor"}{" "}
                    {q.due_date ? `· Due ${new Date(q.due_date).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <Badge variant={statusVariant[q.status] ?? "secondary"}>
                  {q.status.replace("_", " ")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-muted-foreground">No questionnaires yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Create a questionnaire to assess vendor security posture.</p>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              New questionnaire
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
