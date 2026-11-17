import { requireOrganisation } from "@/lib/auth/session";

function naira(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(kobo / 100);
}

export default async function ExchangePage({ params }: { params: Promise<{ organisationId: string }> }) {
  const { organisationId } = await params;
  const { supabase } = await requireOrganisation(organisationId);
  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, dealer_organisation_id, network_code, face_value_kobo, available_value_kobo, discount_bps, active_until")
    .eq("status", "active")
    .gt("available_value_kobo", 0)
    .order("created_at", { ascending: false })
    .limit(50);
  return (
    <div className="page-stack">
      <header className="page-heading"><div><p className="eyebrow">PILLAR 01</p><h1>Airtime Stock Exchange</h1><p className="muted">Active listings visible to signed-in exchange participants.</p></div></header>
      {error && <div className="notice notice-warning">Listings are unavailable. Check the database connection and row-level security migration.</div>}
      {!error && (!listings || listings.length === 0) && <div className="empty-state"><h2>No active stock listings</h2><p>Listings will appear here when approved organisations publish exchange stock.</p></div>}
      {listings && listings.length > 0 && (
        <div className="table-wrap"><table><thead><tr><th>Network</th><th>Face value</th><th>Available</th><th>Discount</th><th>Dealer reference</th><th>Expires</th></tr></thead>
          <tbody>{listings.map((listing) => <tr key={listing.id}>
            <td>{listing.network_code}</td><td>{naira(listing.face_value_kobo)}</td><td>{naira(listing.available_value_kobo)}</td>
            <td>{(listing.discount_bps / 100).toFixed(2)}%</td><td>{listing.dealer_organisation_id.slice(0, 8)}</td>
            <td>{listing.active_until ? new Date(listing.active_until).toLocaleDateString() : "No expiry set"}</td>
          </tr>)}</tbody></table></div>
      )}
      <p className="form-footnote">This page is read-only. Orders and financial settlement are not enabled in Phase 1.</p>
    </div>
  );
}

