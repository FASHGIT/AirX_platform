import { requireOrganisation } from "@/lib/auth/session";

export default async function AuditPage({ params }: { params: Promise<{ organisationId: string }> }) {
  const { organisationId } = await params;
  const { supabase } = await requireOrganisation(organisationId);
  const { data: events, error } = await supabase.from("audit_logs")
    .select("id,actor_user_id,action,resource_type,resource_id,metadata,created_at")
    .eq("organisation_id", organisationId).order("created_at", { ascending: false }).limit(100);
  return (
    <div className="page-stack">
      <header className="page-heading"><div><p className="eyebrow">SECURITY AND GOVERNANCE</p><h1>Audit log</h1><p className="muted">Recent application and membership events for this organisation.</p></div></header>
      {error && <div className="notice notice-warning">Audit events are unavailable. Confirm the database migration and row-level security setup.</div>}
      {!error && (!events || events.length === 0) && <div className="empty-state"><h2>No audit events yet</h2><p>Organisation onboarding, invitations and membership changes will be recorded here.</p></div>}
      {!!events?.length && <div className="table-wrap"><table><thead><tr><th>Time</th><th>Action</th><th>Resource</th><th>Actor</th><th>Details</th></tr></thead><tbody>
        {events.map((event) => <tr key={event.id}><td>{new Date(event.created_at).toLocaleString()}</td><td>{event.action}</td><td>{event.resource_type}</td><td>{event.actor_user_id?.slice(0, 8) || "System"}</td><td><code>{JSON.stringify(event.metadata)}</code></td></tr>)}
      </tbody></table></div>}
    </div>
  );
}

