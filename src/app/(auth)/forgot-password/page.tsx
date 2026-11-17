import { AuthForm } from "@/components/AuthForms";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function ForgotPasswordPage() {
  return (
    <>
      <p className="eyebrow">ACCOUNT RECOVERY</p>
      <h1>Reset password</h1>
      <p className="auth-description">We’ll send a recovery link if an account exists for that email.</p>
      {!isSupabaseConfigured() && <div className="notice notice-warning">Password recovery is not connected in this environment yet.</div>}
      <AuthForm mode="reset" />
    </>
  );
}

