import { redirect } from "next/navigation";
import { MemberRoleForm, OrganisationInvitationForm } from "@/components/OrganisationForms";
import { hasOrganisationPermission, requireOrganisation } from "@/lib/auth/session";

export default async function TeamPage({ params }: { params: Promise<{ organisationId: string }> }) {
  const { organisationId } = await params;
  const { supabase, membership } = await requireOrganisation(organisationId);
  const canManage = hasOrganisationPermission(membership.role, "manage-members");
  if (!canManage) redirect("/dashboard/" + organisationId + "?access=denied");
  const [memberQuery, inviteQuery] = await Promise.all([
    supabase.from("memberships").select("user_id,role,created_at")
      .eq("organisation_id", organisationId).order("created_at", { ascending: true }),
    supabase.from("organisation_invitations").select("id,email,role,status,expires_at,created_at")
      .eq("organisation_id", organisationId).eq("status", "pending").order("created_at", { ascending: false }),
  ]);
  const userIds = (memberQuery.data ?? []).map((member) => member.user_id);
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("user_id,display_name").in("user_id", userIds)
    : { data: [] };
  const names = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.display_name]));
  return (
    <div className="page-stack">
      <header className="page-heading"><div><p className="eyebrow">ORGANISATION ADMINISTRATION</p><h1>Team and access</h1><p className="muted">Manage organisation membership and roles. Platform privileges are managed separately.</p></div></header>
      {memberQuery.error && <div className="notice notice-warning">Member list is unavailable. Confirm the migration and RLS setup.</div>}
      <section className="content-card">
        <div className="card-heading"><div><p className="eyebrow">MEMBERS</p><h2>Organisation members</h2></div></div>
        {(memberQuery.data ?? []).length === 0 ? <div className="empty-state compact"><p>No members were returned for this organisation.</p></div> : (
          <div className="table-wrap"><table><thead><tr><th>Member</th><th>Role</th><th>Joined</th><th>Access</th></tr></thead><tbody>
            {(memberQuery.data ?? []).map((member) => <tr key={member.user_id}>
              <td><strong>{names.get(member.user_id) || "AirX user"}</strong><small>{member.user_id}</small></td>
              <td>{member.role}</td><td>{new Date(member.created_at).toLocaleDateString()}</td>
              <td><MemberRoleForm organisationId={organisationId} userId={member.user_id} currentRole={member.role} canAssignOwner={membership.role === "owner"} /></td>
            </tr>)}
          </tbody></table></div>
        )}
      </section>
      <section className="page-stack">
        <div><p className="eyebrow">INVITATIONS</p><h2>Invite a colleague</h2></div>
        <OrganisationInvitationForm organisationId={organisationId} />
      </section>
      <section className="content-card">
        <div className="card-heading"><div><p className="eyebrow">PENDING</p><h2>Open invitations</h2></div></div>
        {inviteQuery.error && <div className="notice notice-warning">Invitations are unavailable. Confirm the Phase 1 database migration has been approved and applied.</div>}
        {(inviteQuery.data ?? []).length === 0 ? <p className="muted">There are no open invitations.</p> : (
          <div className="table-wrap"><table><thead><tr><th>Email</th><th>Role</th><th>Expires</th></tr></thead><tbody>
            {(inviteQuery.data ?? []).map((invite) => <tr key={invite.id}><td>{invite.email}</td><td>{invite.role}</td><td>{new Date(invite.expires_at).toLocaleDateString()}</td></tr>)}
          </tbody></table></div>
        )}
      </section>
      <p className="form-footnote">Invitation links are single-use and expire after seven days. Email sending is not configured; share links securely out of band.</p>
    </div>
  );
}

