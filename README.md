# AirX Platform Foundation

This repository is a **reconstruction** of the AirX Platform Foundation v0.1 package. The source ZIP linked in the original chat could not be downloaded, so this repository does not claim to reproduce its unavailable files verbatim. It provides a clean, preview-ready foundation for the three requested pillars:

1. Airtime Stock Exchange
2. Shared API and Vending Infrastructure
3. Personalised Dealer Digital Channels

The current app is an informational foundation page. It does not vend airtime, accept payments, call provider APIs, or expose dealer or customer data.

## Stack

- Next.js App Router with TypeScript and React
- Supabase project schema and row-level security managed separately from this web app
- Vercel Preview compatible; no deployment is performed by this repository setup

## Local setup

Requirements: Node.js 20.9 or newer and pnpm 11.

```sh
pnpm install
pnpm dev
```

Before connecting the UI to Supabase, copy `.env.example` to `.env.local` and supply only the project URL and publishable/anon key. Never use a service-role or secret key in a browser-exposed `NEXT_PUBLIC_` variable. Keep production credentials out of Preview and use a separate non-production Supabase project for previews.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm build
```

## Supabase security

The connected Supabase project contains organisation, membership, dealer, buyer, listing, API-client, order, ledger, settlement, reconciliation, webhook, audit and dispute tables. Row-level security is enabled on all 15 listed public tables. The only existing broad authenticated read is the active listing marketplace policy; review the exposed listing columns before adding sensitive fields. Database access must remain server-authorized and organisation-scoped.

This repository contains a small follow-up migration that revokes anonymous execution of `public.is_org_member(uuid)` while preserving authenticated execution needed by membership policies. Apply local migrations only after reviewing the target project and migration history. The original foundation schema migration is in the connected project but its full SQL package was not recoverable from chat; do not replay an invented replacement over that project.

## Before enabling product flows

- Export and commit the authoritative initial schema migration from the connected Supabase project.
- Review every table policy with tests using at least two organisations and anonymous access.
- Add authentication, organisation provisioning, role authorization and audit requirements.
- Approve and implement real provider integrations with idempotency, signing, retry limits and reconciliation.
- Approve payment integration and settlement controls separately.
- Add product-specific automated tests, CI, observability and operational runbooks.

No live provider or payment integration is configured here.
