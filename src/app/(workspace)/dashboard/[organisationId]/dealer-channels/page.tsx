import { requireOrganisation } from "@/lib/auth/session";

export default async function DealerChannelsPage({ params }: { params: Promise<{ organisationId: string }> }) {
  const { organisationId } = await params;
  const { supabase, organisation } = await requireOrganisation(organisationId);
  const { data: profile, error } = await supabase.from("dealer_profiles")
    .select("dealer_code, public_description, storefront_enabled, agreement_review_status")
    .eq("organisation_id", organisationId).maybeSingle();
  return (
    <div className="page-stack">
      <header className="page-heading"><div><p className="eyebrow">PILLAR 03</p><h1>Personalised Dealer Digital Channels</h1><p className="muted">Organisation-owned digital channel settings.</p></div></header>
      {error && <div className="notice notice-warning">Channel profile is unavailable. Confirm the database connection and RLS policies.</div>}
      {!profile && !error && <div className="empty-state"><h2>No dealer profile yet</h2><p>{organisation.name} does not have an approved dealer profile configured.</p></div>}
      {profile && <section className="content-card detail-grid">
        <div><span>Dealer code</span><strong>{profile.dealer_code || "Not assigned"}</strong></div>
        <div><span>Storefront</span><strong>{profile.storefront_enabled ? "Enabled" : "Disabled"}</strong></div>
        <div><span>Agreement review</span><strong>{profile.agreement_review_status.replaceAll("_", " ")}</strong></div>
        <div className="wide"><span>Public description</span><p>{profile.public_description || "No description supplied."}</p></div>
      </section>}
    </div>
  );
}

