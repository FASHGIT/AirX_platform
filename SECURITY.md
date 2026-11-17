# Security policy

Report security issues privately to the repository maintainers. Do not include credentials or customer data in issues.

## Current boundaries

- The foundation page is static and makes no transaction requests.
- `.env*` files are ignored except `.env.example`.
- Only public Supabase URL and publishable/anon key placeholders are documented for browser use.
- Service-role keys must stay in protected server-side secret storage and must never be exposed to a browser.
- All tables exposed through Supabase APIs require row-level security and least-privilege grants.
- Tenant authorization must derive from authenticated membership data, not user-editable profile metadata.

The connected Supabase project was checked on 2026-11-17. All 15 public tables have RLS enabled. Anonymous table privileges have been revoked; authenticated has SELECT on all 15 tables and INSERT/UPDATE only on listings, with RLS still enforcing row access. `service_role` remains privileged and must stay server-side. The helper `public.is_org_member(uuid)` remains executable by authenticated users because RLS policies use it; the Supabase advisor flags its `SECURITY DEFINER` status for further review. Its original schema definition is not included here.
