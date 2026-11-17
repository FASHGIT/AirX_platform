import { redirect } from "next/navigation";
import { getOrganisationMemberships } from "@/lib/auth/session";

export default async function DashboardRedirect() {
  const { memberships } = await getOrganisationMemberships();
  if (memberships.length === 0) redirect("/onboarding/organisation");
  redirect("/dashboard/" + memberships[0].organisation_id);
}

