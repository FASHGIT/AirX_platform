import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForms";
import { getSignedInUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; auth?: string }>;
}) {
  const params = await searchParams;
  if (await getSignedInUser()) redirect("/dashboard");
  return (
    <>
      <p className="eyebrow">AIRX WORKSPACE</p>
      <h1>Sign in</h1>
      <p className="auth-description">Access your organisation’s AirX workspace.</p>
      {!isSupabaseConfigured() && (
        <div className="notice notice-warning">Authentication is not connected in this environment yet. Add the public Supabase URL and publishable key to Preview settings.</div>
      )}
      {params.auth && <div className="notice notice-warning">We could not complete the email confirmation. Please sign in again.</div>}
      <AuthForm mode="login" nextPath={params.next || "/dashboard"} />
      <p className="form-footnote">New to AirX? <Link href="/register">Create an account</Link></p>
    </>
  );
}

