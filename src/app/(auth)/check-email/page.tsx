import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <span className="text-2xl font-bold text-blue-600">Cautium</span>
          </div>
          <div className="flex justify-center mb-2 text-4xl">📬</div>
          <CardTitle className="text-2xl">Revisa tu email</CardTitle>
          <CardDescription>
            Te hemos enviado un enlace de confirmación. Haz clic en él para activar tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            ¿No lo ves? Revisa la carpeta de spam o{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              intenta de nuevo
            </Link>
            .
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">Volver al inicio de sesión</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
