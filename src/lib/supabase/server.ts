import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return url && key ? { url, key } : null;
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null;
}

export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured for this environment.");
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. The proxy refreshes them.
        }
      },
    },
  });
}

export function getAuthRedirectOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredOrigin) {
    const url = new URL(configuredOrigin);
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS outside local development.");
    }
    return url.origin;
  }
  if (process.env.VERCEL_URL) return "https://" + process.env.VERCEL_URL;
  return "http://localhost:3000";
}

