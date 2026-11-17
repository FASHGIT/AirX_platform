import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafePath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = getSafePath(request.nextUrl.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL("/login?auth=callback-error", request.url));

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/login?auth=callback-error", request.url));
    return NextResponse.redirect(new URL(next, request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?auth=setup-required", request.url));
  }
}

