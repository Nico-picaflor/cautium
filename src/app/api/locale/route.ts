import { NextRequest, NextResponse } from "next/server";

const VALID = [
  "en", "es", "pt", "fr", "de", "it", "nl", "pl",
  "sv", "da", "fi", "cs", "ro", "el", "tr", "ru",
  "ar", "he", "ja", "ko", "zh",
];

export async function POST(request: NextRequest) {
  const { locale } = await request.json();
  if (!VALID.includes(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("locale", locale, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  return res;
}
