import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cautium — TPRM con IA",
  description: "Responde cuestionarios de seguridad en minutos, no en días. Cautium lee tus políticas, entiende cada pregunta y redacta respuestas citando tus propias fuentes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Hanken Grotesk', sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
