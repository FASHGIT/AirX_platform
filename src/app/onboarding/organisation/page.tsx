import { redirect } from "next/navigation";
import { OrganisationApplicationForm } from "@/components/OrganisationForms";
import { getOrganisationMemberships } from "@/lib/auth/session";

export default async function OrganisationOnboardingPage() {
  const { supabase, memberships } = await getOrganisationMemberships();
  if (memberships.length) redirect("/dashboard");
  const { data: types, error } = await supabase.from("organisation_types")
    .select("code,display_name").eq("is_enabled", true).order("display_name");
  return (
    <main className="onboarding-shell">
      <div className="onboarding-card">
        <p className="eyebrow">ORGANISATION ONBOARDING</p><h1>Start your organisation application</h1>
        <p className="muted">Your account is individual. Create an organisation workspace, then AirX reviews its application before access to commercial features is enabled.</p>
        {error && <div className="notice notice-warning">Organisation categories are not available. The Phase 1 database migration must be reviewed and applied to this preview database first.</div>}
        <OrganisationApplicationForm types={types ?? []} />
      </div>
    </main>
  );
}

