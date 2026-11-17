import { redirect } from "next/navigation";
import Link from "next/link";
import { ReviewApplicationForm } from "@/components/OrganisationForms";
import { requireSignedInUser } from "@/lib/auth/session";

export default async function PlatformAdministrationPage() {
  const { user, supabase } = await requireSignedInUser();
  const { data: membership, error: membershipError } = await supabase
    .from("platform_admin_memberships").select("role,is_active")
    .eq("user_id", user.id).maybeSingle();
  if (membershipError || !membership?.is_active) redirect("/dashboard?access=platform-admin-required");
  const { data: applications, error } = await supabase.from("organisation_applications")
    .select("id,organisation_id,submitted_by,organisation_type_code,country_code,contact_email,status,submitted_at")
    .in("status", ["submitted", "under_review", "more_information_required"])
    .order("submitted_at", { ascending: true });
  return (
    <main className="platform-shell">
      <header className="page-heading"><div><p className="eyebrow">AIRX PLATFORM ADMINISTRATION</p><h1>Onboarding review</h1><p className="muted">Signed-in platform role: <strong>{membership.role.replaceAll("_", " ")}</strong></p></div></header>
      <Link className="back-link" href="/dashboard">← Return to organisation workspace</Link>
      {error && <div className="notice notice-warning">Applications could not be loaded. Confirm the Phase 1 migration and platform role.</div>}
      {!error && (!applications || applications.length === 0) && <div className="empty-state"><h2>No open applications</h2><p>New organisation applications appear here after submission.</p></div>}
      {(applications ?? []).map((application) => (
        <section className="content-card application-card" key={application.id}>
          <div><p className="eyebrow">{application.organisation_type_code.replaceAll("_", " ")} · {application.country_code}</p>
            <h2>Organisation {application.organisation_id.slice(0, 8)}</h2>
            <p>Applicant {application.submitted_by.slice(0, 8)} · {application.contact_email}</p>
            <span className="status-pill">{application.status.replaceAll("_", " ")}</span>
          </div>
          <ReviewApplicationForm applicationId={application.id} />
        </section>
      ))}
      <p className="form-footnote">Platform administrators are provisioned by a trusted database operator. Organisation membership does not grant platform access.</p>
    </main>
  );
}



