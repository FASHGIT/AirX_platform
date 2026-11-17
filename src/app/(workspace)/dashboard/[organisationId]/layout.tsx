import Link from "next/link";
import { notFound } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { requireOrganisation, hasOrganisationPermission } from "@/lib/auth/session";

const moduleLinks = [
  { path: "", title: "Overview" },
  { path: "/exchange", title: "Airtime Stock Exchange" },
  { path: "/vending", title: "Shared Vending" },
  { path: "/dealer-channels", title: "Dealer Channels" },
  { path: "/team", title: "Team & Access", permission: "manage-members" as const },
  { path: "/audit", title: "Audit Log" },
];

export default async function OrganisationLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ organisationId: string }> }>) {
  const { organisationId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(organisationId)) notFound();
  const { membership, organisation, user } = await requireOrganisation(organisationId);
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <Link className="brand workspace-brand" href="/"><span className="brand-mark">A</span><span>AirX<span className="brand-light"> Platform</span></span></Link>
        <div className="workspace-identity">
          <span className="sidebar-label">ORGANISATION</span>
          <strong>{organisation.name}</strong>
          <span className="status-pill">{organisation.status.replaceAll("_", " ")}</span>
        </div>
        <nav className="workspace-nav" aria-label="Organisation workspace">
          {moduleLinks.map((item) => {
            if (item.permission && !hasOrganisationPermission(membership.role, item.permission)) return null;
            return <Link key={item.path} href={"/dashboard/" + organisationId + item.path}>{item.title}</Link>;
          })}
          <Link href="/platform">AirX Administration</Link>
        </nav>
        <div className="sidebar-bottom">
          <span className="user-email">{user.email}</span>
          <span className="role-label">{membership.role} access</span>
          <form action={signOutAction}><button className="button button-quiet" type="submit">Sign out</button></form>
        </div>
      </aside>
      <main className="workspace-main">{children}</main>
    </div>
  );
}

