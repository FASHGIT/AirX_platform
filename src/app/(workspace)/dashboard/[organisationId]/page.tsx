import Link from "next/link";
import { requireOrganisation } from "@/lib/auth/session";

function MetricCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <article className="metric-card"><span>{label}</span><strong>{value.toLocaleString()}</strong><small>{detail}</small></article>;
}

export default async function OrganisationDashboard({
  params,
}: {
  params: Promise<{ organisationId: string }>;
}) {
  const { organisationId } = await params;
  const { supabase, organisation, membership } = await requireOrganisation(organisationId);
  const [listingCount, orderCount, capabilityQuery] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("dealer_organisation_id", organisationId),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("buyer_organisation_id", organisationId),
    supabase.from("organisation_capabilities").select("capability_code,status").eq("organisation_id", organisationId),
  ]);
  const status = organisation.status.toLowerCase();
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div><p className="eyebrow">ORGANISATION WORKSPACE</p><h1>{organisation.name}</h1><p className="muted">Welcome back. This workspace is limited to your organisation membership.</p></div>
        <span className="status-pill">{organisation.status.replaceAll("_", " ")}</span>
      </header>
      {["pending_review", "submitted"].includes(status) && <div className="notice notice-info">Your organisation is waiting for AirX review. Trading and vending access remain disabled until approved.</div>}
      <section className="metric-grid" aria-label="Organisation activity">
        <MetricCard label="Stock listings" value={listingCount.count ?? 0} detail="Scoped to this organisation’s listings" />
        <MetricCard label="Buyer orders" value={orderCount.count ?? 0} detail="Scoped to this organisation’s orders" />
        <MetricCard label="Approved capabilities" value={(capabilityQuery.data ?? []).filter((item) => item.status === "approved").length} detail="Platform-approved access only" />
      </section>
      {capabilityQuery.error && <div className="notice notice-warning">Capability status is unavailable. Confirm the Phase 1 database migration has been reviewed and applied.</div>}
      <section className="content-card">
        <div className="card-heading"><div><p className="eyebrow">AIRX PLATFORM</p><h2>Three connected pillars</h2></div></div>
        <div className="pillar-links">
          <Link href={"/dashboard/" + organisationId + "/exchange"}><span>01</span><strong>Airtime Stock Exchange</strong><small>Browse active listings available to authenticated organisations.</small></Link>
          <Link href={"/dashboard/" + organisationId + "/vending"}><span>02</span><strong>Shared API and Vending Infrastructure</strong><small>Check approved integration readiness; no live provider is configured.</small></Link>
          <Link href={"/dashboard/" + organisationId + "/dealer-channels"}><span>03</span><strong>Personalised Dealer Digital Channels</strong><small>Review your organisation’s dealer channel profile.</small></Link>
        </div>
      </section>
      <p className="form-footnote">Signed in as {membership.role}. Counts are live database queries subject to Supabase row-level security.</p>
    </div>
  );
}

