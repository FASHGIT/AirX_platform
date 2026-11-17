# Security notes

## Secrets and deployments

- `.env*` files are ignored except `.env.example`. Never commit credentials, tokens, production URLs with sensitive parameters, or Supabase service-role keys.
- Server and browser clients use only the Supabase publishable/anon key. No service-role client exists in this foundation.
- Configure separate, non-production Supabase credentials for Vercel Preview before testing authenticated flows. Production deployment and production database changes are not authorized by this work.
- Invitation tokens are random, single-use, time-limited, stored as SHA-256 hashes, and returned once in a URL fragment. Share invite URLs out of band until a verified email service is approved.

## Tenant authorization

- Browser access uses the signed-in user's Supabase session and RLS.
- Sensitive writes use narrowly scoped `SECURITY DEFINER` RPCs with empty `search_path`, explicit identity/role checks and audit events.
- Organisation membership policies are rebound to private-schema helper functions. Listing creation and modification require owner/admin/operator membership.
- Platform administrator memberships must be provisioned through a controlled operator process; there is no self-service platform-admin assignment.
- The Phase 1 migration is staged, not applied or integration-tested against a local Supabase database. Apply first only to a designated non-production database, then verify grants and cross-tenant denial tests before any production migration.

## Not production-ready

No live airtime vending or payment processing is enabled. There is no provider credential integration, financial transaction workflow, settlement/reconciliation implementation, production monitoring, or completed compliance review. Do not turn on live transactions until provider integrations, independent security review, operational controls and required approvals are complete.

