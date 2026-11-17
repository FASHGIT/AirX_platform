import { redirect } from "next/navigation";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
export { hasOrganisationPermission } from "@/lib/auth/permissions.mjs";

export type OrganisationMembership = {
  organisation_id: string;
  role: "owner" | "admin" | "operator" | "finance" | "viewer";
  organisation: {
    id: string;
    name: string;
    status: string;
    organisation_type_code: string | null;
  };
};

export async function getSignedInUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { user: data.user, supabase };
}

export async function requireSignedInUser() {
  const session = await getSignedInUser();
  if (!session) redirect("/login");
  return session;
}

export async function requireOrganisation(organisationId: string) {
  const { user, supabase } = await requireSignedInUser();
  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("organisation_id, role")
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError || !membership) redirect("/dashboard?access=denied");

  const { data: organisation, error: organisationError } = await supabase
    .from("organisations")
    .select("id, name, status, organisation_type_code")
    .eq("id", organisationId)
    .maybeSingle();
  if (organisationError || !organisation) redirect("/dashboard?access=denied");

  return {
    user,
    supabase,
    membership: membership as { organisation_id: string; role: OrganisationMembership["role"] },
    organisation: organisation as OrganisationMembership["organisation"],
  };
}

export async function getOrganisationMemberships() {
  const { user, supabase } = await requireSignedInUser();
  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("organisation_id, role, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error || !memberships?.length) return { user, supabase, memberships: [] };

  const ids = memberships.map((membership) => membership.organisation_id);
  const { data: organisations } = await supabase
    .from("organisations")
    .select("id, name, status, organisation_type_code")
    .in("id", ids);
  const byId = new Map((organisations ?? []).map((organisation) => [organisation.id, organisation]));
  return {
    user,
    supabase,
    memberships: memberships.flatMap((membership) => {
      const organisation = byId.get(membership.organisation_id);
      return organisation ? [{ ...membership, organisation } as OrganisationMembership] : [];
    }),
  };
}


