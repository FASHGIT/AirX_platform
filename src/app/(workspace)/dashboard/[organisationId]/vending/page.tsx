import { requireOrganisation } from "@/lib/auth/session";

export default async function VendingPage({ params }: { params: Promise<{ organisationId: string }> }) {
  const { organisationId } = await params;
  const { supabase } = await requireOrganisation(organisationId);
  const { data: capabilities, error } = await supabase.from("organisation_capabilities")
    .select("status").eq("organisation_id", organisationId).eq("capability_code", "shared_vending").maybeSingle();
  const approved = capabilities?.status === "approved";
  return (
    <div className="page-stack">
      <header className="page-heading"><div><p className="eyebrow">PILLAR 02</p><h1>Shared API and Vending Infrastructure</h1><p className="muted">Provider connections must be approved and tested before transactions are enabled.</p></div></header>
      {error && <div className="notice notice-warning">Capability readiness is unavailable. Confirm the Phase 1 database migration has been applied.</div>}
      <section className="content-card integration-status">
        <span className={approved ? "status-dot ready" : "status-dot pending"} aria-hidden="true" />
        <div><h2>{approved ? "Capability approved; provider connection pending" : "Vending is not enabled"}</h2>
          <p>{approved ? "No provider adapter or credentials are configured. This workspace will not send vending requests." : "No provider adapter or credentials are configured, and this workspace will not send vending requests."}</p>
          <small>Live airtime vending is disabled.</small>
        </div>
      </section>
    </div>
  );
}

