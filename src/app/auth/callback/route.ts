import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_OPTIONS } from "@/lib/constants/cookies";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") ?? "/";
  // Prefix checks miss tricks like "/\t/evil.com", which the URL parser turns into another host.
  // Resolving first and comparing origins is the only check that matches what the browser will do.
  let redirectUrl = new URL("/", requestUrl.origin);
  try {
    const resolvedNext = new URL(rawNext, requestUrl.origin);
    if (resolvedNext.origin === requestUrl.origin) redirectUrl = resolvedNext;
  } catch {
    // Malformed target: fall back to the homepage instead of failing the login.
  }

  if (code) {
    const cookieStore = await cookies();
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options) {
            response.cookies.set({ name, value, ...options, ...COOKIE_OPTIONS });
          },
          remove(name: string, options) {
            response.cookies.set({ name, value: '', ...options, ...COOKIE_OPTIONS });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.session?.user) {
        const userId = data.session.user.id;

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (!existingProfile) {
          await supabase.from("profiles").upsert({
            id: userId,
            full_name: data.session.user.user_metadata?.full_name || "",
            avatar_url: data.session.user.user_metadata?.avatar_url || data.session.user.user_metadata?.picture || ""
          }, { onConflict: "id" });
        }
      }
      return response;
    }
  }

  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}