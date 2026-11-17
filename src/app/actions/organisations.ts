"use server";

import { redirect } from "next/navigation";
import { requireSignedInUser } from "@/lib/auth/session";

export type OrganisationActionState = { message?: string; error?: string };

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitOrganisationApplicationAction(
  _previous: OrganisationActionState,
  formData: FormData,
): Promise<OrganisationActionState> {
  const name = field(formData, "name");
  const typeCode = field(formData, "type_code");
  const countryCode = field(formData, "country_code").toUpperCase();
  const contactEmail = field(formData, "contact_email").toLowerCase();
  const contactPhone = field(formData, "contact_phone");
  const address = field(formData, "registered_address");
  const registrationNumber = field(formData, "business_registration_number");
  const taxIdentifier = field(formData, "tax_identifier");
  if (name.length < 2 || name.length > 160) return { error: "Enter an organisation name between 2 and 160 characters." };
  if (!/^[a-z][a-z0-9_]{1,39}$/.test(typeCode)) return { error: "Choose an available organisation category." };
  if (!/^[A-Z]{2}$/.test(countryCode)) return { error: "Choose a valid two-letter country code." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return { error: "Enter a valid business contact email." };
  if ([contactPhone, address, registrationNumber, taxIdentifier].some((v) => v.length > 500)) {
    return { error: "One of the supplied fields is too long." };
  }
  const { supabase } = await requireSignedInUser();
  const { data, error } = await supabase.rpc("submit_organisation_application", {
    p_name: name,
    p_type_code: typeCode,
    p_country_code: countryCode,
    p_contact_email: contactEmail,
    p_contact_phone: contactPhone || null,
    p_registered_address: address || null,
    p_business_registration_number: registrationNumber || null,
    p_tax_identifier: taxIdentifier || null,
  });
  if (error || !data) {
    return { error: "The application could not be submitted. The Phase 1 database migration may still need approval and application to this preview database." };
  }
  redirect("/dashboard/" + data);
}

export async function createOrganisationInvitationAction(
  _previous: OrganisationActionState,
  formData: FormData,
): Promise<OrganisationActionState> {
  const organisationId = field(formData, "organisation_id");
  const email = field(formData, "email").toLowerCase();
  const role = field(formData, "role");
  if (!/^[0-9a-f-]{36}$/i.test(organisationId)) return { error: "Select a valid organisation." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!["admin", "operator", "finance", "viewer"].includes(role)) return { error: "Choose a valid organisation role." };
  const { supabase } = await requireSignedInUser();
  const { data, error } = await supabase.rpc("create_organisation_invitation", {
    p_organisation_id: organisationId,
    p_email: email,
    p_role: role,
  });
  const invitation = Array.isArray(data) ? data[0] : null;
  if (error || !invitation?.invitation_token) {
    return { error: "The invitation could not be created. Check your role and confirm the Phase 1 migration is applied to this preview database." };
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    || (process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : null);
  if (!origin) return { error: "Invitation links are unavailable until this preview URL is configured." };
  let safeOrigin: URL;
  try {
    safeOrigin = new URL(origin);
  } catch {
    return { error: "Invitation links are unavailable because the site URL is invalid." };
  }
  if (safeOrigin.protocol !== "https:" && safeOrigin.hostname !== "localhost") {
    return { error: "Invitation links require a secure HTTPS site URL." };
  }
  return { message: safeOrigin.origin + "/accept-invitation#token=" + encodeURIComponent(invitation.invitation_token) };
}

export async function acceptOrganisationInvitationAction(
  _previous: OrganisationActionState,
  formData: FormData,
): Promise<OrganisationActionState> {
  const token = field(formData, "token");
  if (!/^[a-f0-9]{64}$/i.test(token)) return { error: "The invitation link is invalid or expired." };
  const { supabase } = await requireSignedInUser();
  const { data, error } = await supabase.rpc("accept_organisation_invitation", { p_token: token });
  if (error || !data) return { error: "The invitation could not be accepted. Sign in with the invited email and try again." };
  redirect("/dashboard/" + data);
}

