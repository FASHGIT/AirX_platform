import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForms";
import { getSignedInUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function RegisterPage() {
  if (await getSignedInUser()) redirect("/onboarding/organisation");
  return (
    <>
      <p className="eyebrow">CREATE AN AIRX ACCOUNT</p>
      <h1>Get started</h1>
      <p className="auth-description">Create your individual account, then register or join an organisation.</p>
      {!isSupabaseConfigured() && <div className="notice notice-warning">Account creation is not connected in this environment yet. Supabase Preview settings need a URL and publishable key.</div>}
      <AuthForm mode="register" />
    </>
  );
}

