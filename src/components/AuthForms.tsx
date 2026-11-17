"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useInvitationToken } from "@/lib/auth/useInvitationToken";
import {
  resetPasswordAction,
  signInAction,
  signUpAction,
  type AuthActionState,
} from "@/app/actions/auth";

type AuthMode = "login" | "register" | "reset";

export function AuthForm({ mode, nextPath = "/dashboard" }: { mode: AuthMode; nextPath?: string }) {
  const action = mode === "register" ? signUpAction : mode === "reset" ? resetPasswordAction : signInAction;
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(action, {});
  const invitationToken = useInvitationToken();
  return (
    <form className="form-stack" action={formAction}>
      {mode === "register" && (
        <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={120} /></label>
      )}
      <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      {mode !== "reset" && (
        <label>Password
          <input name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 12 : 1} maxLength={128} />
          {mode === "register" && <small>Use at least 12 characters.</small>}
        </label>
      )}
      {mode === "login" && <input type="hidden" name="next" value={nextPath} />}
      {mode !== "reset" && <input type="hidden" name="invitation_token" value={invitationToken} />}
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
      </button>
      <p aria-live="polite" className={state.error ? "form-message error" : "form-message"}>{state.error || state.message || ""}</p>
      {mode === "login" && (
        <div className="form-links">
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href={invitationToken ? "/register#token=" + invitationToken : "/register"}>Create an account</Link>
        </div>
      )}
      {mode === "register" && <p className="form-footnote">Already registered? <Link href={invitationToken ? "/login#token=" + invitationToken : "/login"}>Sign in</Link></p>}
      {mode === "reset" && <p className="form-footnote"><Link href="/login">Return to sign in</Link></p>}
    </form>
  );
}





