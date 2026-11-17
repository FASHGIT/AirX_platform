# Security policy

Report security issues privately to the repository maintainers. Do not include credentials or customer data in issues.

## Current boundaries

- The foundation page is static and makes no transaction requests.
- `.env*` files are ignored except `.env.example`.
- Only public Supabase URL and publishable/anon key placeholders are documented for browser use.
- Service-role keys must stay in protected server-side secret storage and must never be exposed to a browser.
- All tables exposed through Supabase APIs require row-level security and least-privilege grants.
- Tenant authorization must derive from authenticated membership data, not user-editable profile metadata.

The connected Supabase project was checked on 2026-11-17. All 15 listed public tables had RLS enabled. The project advisor reported anonymous and authenticated execution on the `SECURITY DEFINER` helper `public.is_org_member(uuid)`. A follow-up migration in this repository revokes public/anonymous execution while retaining authenticated execution for RLS checks. Re-run Supabase security advisors after applying migrations.
