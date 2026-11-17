"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getAuthRedirectOrigin } from "@/lib/supabase/server";

export type AuthActionState = { message?: string; error?: string };

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeNext(formData: FormData) {
  const next = field(formData, "next");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signInAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");
  const invitationToken = field(formData, "invitation_token");
  if (!email || !password) return { error: "Enter your email and password." };
  let destination = safeNext(formData);
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "We could not sign you in. Check your details and try again." };
    if (invitationToken) {
      if (!/^[a-f0-9]{64}$/i.test(invitationToken)) return { error: "The invitation link is invalid or expired." };
      const { data, error: inviteError } = await supabase.rpc("accept_organisation_invitation", { p_token: invitationToken });
      if (inviteError || !data) return { error: "You are signed in, but this invitation could not be accepted. Confirm you used the invited email address." };
      destination = "/dashboard/" + data;
    }
  } catch {
    return { error: "Sign-in is not configured for this preview yet." };
  }
  redirect(destination);
}

export async function signUpAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");
  const invitationToken = field(formData, "invitation_token");
  if (name.length < 2 || name.length > 120) return { error: "Enter your name (2 to 120 characters)." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 12 || password.length > 128) return { error: "Use a password between 12 and 128 characters." };
  let destination: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: getAuthRedirectOrigin() + "/auth/callback?next=" + encodeURIComponent(invitationToken && /^[a-f0-9]{64}$/i.test(invitationToken) ? "/accept-invitation#token=" + invitationToken : "/dashboard"),
      },
    });
    if (error) return { error: "We could not create the account. Check the details or try signing in." };
    if (data.session && invitationToken) {
      if (!/^[a-f0-9]{64}$/i.test(invitationToken)) return { error: "The invitation link is invalid or expired." };
      const { data: organisationId, error: inviteError } = await supabase.rpc("accept_organisation_invitation", { p_token: invitationToken });
      if (inviteError || !organisationId) return { error: "Your account was created, but this invitation could not be accepted." };
      destination = "/dashboard/" + organisationId;
    }
    if (data.session && !destination) destination = "/onboarding/organisation";
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_PUBLIC_SITE_URL")) {
      return { error: "The sign-up return address is not configured correctly." };
    }
    return { error: "Account registration is not configured for this preview yet." };
  }
  if (destination) redirect(destination);
  return { message: "Check your email to confirm your account, then sign in to continue." };
}

export async function resetPasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = field(formData, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectOrigin() + "/auth/callback?next=/reset-password",
    });
    if (error) return { error: "We could not send the reset email. Try again later." };
    return { message: "If the account exists, a password reset email is on its way." };
  } catch {
    return { error: "Password recovery is not configured for this preview yet." };
  }
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function setOrganisationMemberRoleAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const organisationId = field(formData, "organisation_id");
  const userId = field(formData, "user_id");
  const role = field(formData, "role");
  if (!/^[0-9a-f-]{36}$/i.test(organisationId) || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return { error: "Choose a valid organisation member." };
  }
  if (!["owner", "admin", "operator", "finance", "viewer"].includes(role)) {
    return { error: "Choose a valid organisation role." };
  }
  const { requireSignedInUser } = await import("@/lib/auth/session");
  const { supabase } = await requireSignedInUser();
  const { error } = await supabase.rpc("set_organisation_member_role", {
    p_organisation_id: organisationId,
    p_user_id: userId,
    p_role: role,
  });
  if (error) return { error: "The role was not changed. Check your organisation permissions." };
  revalidatePath("/dashboard/" + organisationId + "/team");
  return { message: "Member role updated." };
}

export async function removeOrganisationMemberAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const organisationId = field(formData, "organisation_id");
  const userId = field(formData, "user_id");
  if (!/^[0-9a-f-]{36}$/i.test(organisationId) || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return { error: "Choose a valid organisation member." };
  }
  const { requireSignedInUser } = await import("@/lib/auth/session");
  const { supabase } = await requireSignedInUser();
  const { error } = await supabase.rpc("remove_organisation_member", {
    p_organisation_id: organisationId,
    p_user_id: userId,
  });
  if (error) return { error: "The member was not removed. The last organisation owner cannot be removed." };
  revalidatePath("/dashboard/" + organisationId + "/team");
  return { message: "Member removed from the organisation." };
}

export async function reviewOrganisationApplicationAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const applicationId = field(formData, "application_id");
  const decision = field(formData, "decision");
  const notes = field(formData, "notes");
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) return { error: "Choose a valid application." };
  if (!["under_review", "more_information_required", "approved", "rejected"].includes(decision)) {
    return { error: "Choose a valid review decision." };
  }
  if (notes.length > 4000) return { error: "Review notes must be 4,000 characters or fewer." };
  const { requireSignedInUser } = await import("@/lib/auth/session");
  const { supabase } = await requireSignedInUser();
  const { error } = await supabase.rpc("review_organisation_application", {
    p_application_id: applicationId,
    p_decision: decision,
    p_notes: notes,
  });
  if (error) return { error: "The application was not updated. Confirm your platform role and the maker-checker rules." };
  revalidatePath("/platform");
  return { message: "Application review recorded." };
}




