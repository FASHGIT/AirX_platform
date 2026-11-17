# AirX Platform Foundation

AirX is being built around three business pillars: Airtime Stock Exchange, shared API and vending infrastructure, and personalised dealer digital channels. This foundation adds sign-in, organisation onboarding, invitations, membership roles, a review queue, audit events, and tenant-scoped read views.

## Local development

1. Copy `.env.example` to `.env.local` and add a Supabase project URL and publishable key (or legacy anon key). Never use a service-role key in browser or application environment variables.
2. Install locked dependencies with `pnpm install --frozen-lockfile`.
3. Start with `pnpm dev`.
4. Run `pnpm lint`, `pnpm test`, `pnpm typecheck`, and `pnpm build`.

The Phase 1 database migration is staged in `supabase/migrations`. Review and apply it only to a designated non-production Supabase project. It has not been applied to any hosted database. With no Supabase environment configured, app routes that need authentication cannot complete sign-in or database operations.

## Phase 1 status

The interface and server actions for identity and organisation governance are implemented against the staged RPC/schema contract. Exchange listings are read-only; vending and payments remain explicitly disabled. Provider integrations, financial ledger writes, settlement, compliance-document storage, operational monitoring, and production launch are out of scope.

See `docs/phase1-status.md` and `SECURITY.md` before configuring a preview environment.

