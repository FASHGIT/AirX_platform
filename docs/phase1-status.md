# Phase 1 status and rollout plan

## Included in this foundation

- App Router navigation, responsive workspace shell and routes for the three AirX pillars.
- Supabase cookie-based sign-in, account registration, password reset and auth callback.
- Organisation application submission, owner membership, invitation acceptance, team role management and platform review actions.
- Tenant-aware server loaders and route checks; policy/RPC contract for audit logging and access governance.
- Vending and payment pages state that operation is disabled; exchange screens are read-only.

## Database and security status

The baseline migration reconstructs the existing foundation schema and is retained for reproducibility. The Phase 1 migration adds organisation categories/capabilities, profiles, onboarding applications/reviews, hashed invitations, platform-admin roles, audit-backed RPC operations, and private helper policies. It is not applied to a hosted database and was not executed locally because the Supabase CLI was unavailable in this Windows environment. Treat SQL as pending review; do not consider RLS integration verified until a non-production Supabase project has applied it and tenant-isolation tests have passed.

Existing review found broad authenticated SELECT table grants guarded by RLS, an exposed membership helper, and listing write policies that checked membership without restricting roles. The staged migration moves policy checks to private helpers, revokes direct access to the exposed helper, and restricts listing writes to owner/admin/operator. Broad default grants for future objects require verification for the migration owner role on the target Supabase project.

## Preview setup

1. Create/identify a separate non-production Supabase project.
2. Review and apply migrations there only after approval; confirm resulting grants and policies through SQL inspection and cross-tenant tests.
3. Add that project's URL, publishable key and the exact preview site URL to Vercel Preview environment only.
4. Configure Supabase Auth redirect allow-list for local development and the selected preview URL.
5. Verify sign-up, confirmation, invitation, role denial, RLS isolation and audit event flows on preview.

No deployment was initiated by this change. Do not merge to `main`, configure production credentials, apply production database changes, or enable live vending/payments without explicit approval.

## Remaining before production

- Apply and test the schema on non-production Supabase; add automated cross-tenant RLS and role-matrix integration tests.
- Resolve Supabase default-privilege ownership/grant behavior and review SQL with the project owner.
- Add secure email delivery and invitation delivery workflow; add rate limiting, abuse controls, account recovery verification and session policy.
- Build compliance/KYB document storage, retention and access controls.
- Implement and independently review provider integrations, idempotent vending, ledger, payment, settlement and reconciliation workflows before enabling transactions.
- Add observability, alerting, backup/recovery, incident response, accessibility review and production operations runbooks.
- Complete legal, compliance and penetration/security review; only then prepare a separately approved production release.

