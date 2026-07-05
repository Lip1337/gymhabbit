import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[auth/callback] exchangeCodeForSession fehlgeschlagen:", error);
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  const errorDescription =
    searchParams.get("error_description") ?? searchParams.get("error");
  console.error(
    "[auth/callback] Kein code-Parameter erhalten.",
    errorDescription ?? "(keine Fehlermeldung vom Provider)",
  );
  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent(
      errorDescription ?? "kein-code-erhalten",
    )}`,
  );
}