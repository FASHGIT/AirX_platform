-- AirX multi-tenant foundation. Apply only to a new/approved Supabase project.
create extension if not exists pgcrypto;

create type public.org_kind as enum ('dealer','buyer','channel_client','airx');
create type public.member_role as enum ('owner','admin','operator','finance','viewer');
create type public.listing_status as enum ('draft','active','paused','closed','depleted');
create type public.order_status as enum ('quoted','accepted','processing','delivered','failed','pending_review','refunded','cancelled');
create type public.ledger_status as enum ('pending','posted','reversed');

create table public.organisations (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  kind public.org_kind not null, status text not null default 'pending_review',
  brand_name text, logo_url text, support_email text, support_phone text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer', created_at timestamptz not null default now(),
  unique(organisation_id,user_id)
);
create table public.dealer_profiles (
  organisation_id uuid primary key references public.organisations(id) on delete cascade,
  dealer_code text, network_codes text[] not null default '{}', public_description text,
  storefront_enabled boolean not null default false, storefront_config jsonb not null default '{}'::jsonb,
  agreement_review_status text not null default 'not_started', created_at timestamptz not null default now()
);
create table public.buyer_profiles (
  organisation_id uuid primary key references public.organisations(id) on delete cascade,
  buyer_type text not null default 'business', credit_status text not null default 'prepaid',
  webhook_url text, allowed_networks text[] not null default '{}', created_at timestamptz not null default now()
);
create table public.dealer_accounts (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  account_label text not null, provider_name text, external_account_ref text,
  currency char(3) not null default 'NGN', is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.listings (
  id uuid primary key default gen_random_uuid(), dealer_organisation_id uuid not null references public.organisations(id),
  network_code text not null, face_value_kobo bigint not null check(face_value_kobo > 0),
  available_value_kobo bigint not null check(available_value_kobo >= 0),
  discount_bps integer not null check(discount_bps between 0 and 10000),
  status public.listing_status not null default 'draft', active_from timestamptz, active_until timestamptz,
  availability_mode text not null default 'seller_confirmed' check(availability_mode in ('live_provider','seller_confirmed')),
  last_verified_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index listings_discovery_idx on public.listings(network_code,status,active_until);
create table public.api_clients (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  client_name text not null, key_prefix text not null, secret_hash text not null,
  allowed_ips inet[] not null default '{}', scopes text[] not null default '{}',
  environment text not null default 'sandbox', is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), buyer_organisation_id uuid not null references public.organisations(id),
  client_reference text not null, network_code text not null, msisdn_ciphertext text,
  amount_kobo bigint not null check(amount_kobo > 0), currency char(3) not null default 'NGN',
  status public.order_status not null default 'quoted', strategy text not null default 'balanced',
  idempotency_key text not null, final_provider_reference text, failure_code text, failure_message text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(buyer_organisation_id,client_reference), unique(buyer_organisation_id,idempotency_key)
);
create index orders_status_created_idx on public.orders(status,created_at desc);
create table public.order_legs (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete restrict,
  dealer_organisation_id uuid not null references public.organisations(id), listing_id uuid references public.listings(id),
  provider_code text, provider_reference text, amount_kobo bigint not null check(amount_kobo > 0),
  status public.order_status not null default 'accepted', idempotency_key text not null unique,
  request_payload_redacted jsonb not null default '{}'::jsonb, response_payload_redacted jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id),
  order_id uuid references public.orders(id), entry_group_id uuid not null, account_code text not null,
  direction text not null check(direction in ('debit','credit')), amount_kobo bigint not null check(amount_kobo > 0),
  currency char(3) not null default 'NGN', status public.ledger_status not null default 'pending',
  narration text not null, reversal_of uuid references public.ledger_entries(id), created_at timestamptz not null default now()
);
create index ledger_org_created_idx on public.ledger_entries(organisation_id,created_at desc);
create table public.settlements (
  id uuid primary key default gen_random_uuid(), dealer_organisation_id uuid not null references public.organisations(id),
  amount_kobo bigint not null check(amount_kobo > 0), currency char(3) not null default 'NGN',
  status text not null default 'pending', partner_reference text, scheduled_at timestamptz, settled_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.reconciliations (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id),
  source text not null, period_start timestamptz not null, period_end timestamptz not null,
  expected_amount_kobo bigint, observed_amount_kobo bigint,
  variance_kobo bigint generated always as (coalesce(observed_amount_kobo,0)-coalesce(expected_amount_kobo,0)) stored,
  status text not null default 'open', notes text, created_at timestamptz not null default now()
);
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id),
  event_type text not null, payload jsonb not null, delivery_attempts integer not null default 0,
  delivered_at timestamptz, next_attempt_at timestamptz, created_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), organisation_id uuid references public.organisations(id),
  actor_user_id uuid references auth.users(id), action text not null, resource_type text not null,
  resource_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.disputes (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
  raised_by_organisation_id uuid not null references public.organisations(id), reason_code text not null,
  description text, status text not null default 'open', resolution text, created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.organisations enable row level security;
alter table public.memberships enable row level security;
alter table public.dealer_profiles enable row level security;
alter table public.buyer_profiles enable row level security;
alter table public.dealer_accounts enable row level security;
alter table public.listings enable row level security;
alter table public.api_clients enable row level security;
alter table public.orders enable row level security;
alter table public.order_legs enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.settlements enable row level security;
alter table public.reconciliations enable row level security;
alter table public.webhook_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.disputes enable row level security;

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.memberships m
    where m.organisation_id = target_org and m.user_id = (select auth.uid()));
$$;

create policy "members read own organisations" on public.organisations
for select to authenticated using (public.is_org_member(id));
create policy "members read own memberships" on public.memberships
for select to authenticated using (user_id = (select auth.uid()) or public.is_org_member(organisation_id));
create policy "dealer profile members read" on public.dealer_profiles
for select to authenticated using (public.is_org_member(organisation_id));
create policy "buyer profile members read" on public.buyer_profiles
for select to authenticated using (public.is_org_member(organisation_id));
create policy "dealer accounts members read" on public.dealer_accounts
for select to authenticated using (public.is_org_member(organisation_id));
create policy "listing members and buyers read" on public.listings
for select to authenticated using (public.is_org_member(dealer_organisation_id) or status = 'active');
create policy "listing members insert own" on public.listings
for insert to authenticated with check (public.is_org_member(dealer_organisation_id));
create policy "listing members update own" on public.listings
for update to authenticated using (public.is_org_member(dealer_organisation_id)) with check (public.is_org_member(dealer_organisation_id));
create policy "api clients members read" on public.api_clients
for select to authenticated using (public.is_org_member(organisation_id));
create policy "orders buyer members read" on public.orders
for select to authenticated using (public.is_org_member(buyer_organisation_id));
create policy "order legs buyer or dealer members read" on public.order_legs
for select to authenticated using (
  exists(select 1 from public.orders o where o.id = order_id and public.is_org_member(o.buyer_organisation_id))
  or public.is_org_member(dealer_organisation_id)
);
create policy "ledger members read own" on public.ledger_entries
for select to authenticated using (public.is_org_member(organisation_id));
create policy "settlement members read own" on public.settlements
for select to authenticated using (public.is_org_member(dealer_organisation_id));
create policy "reconciliation members read own" on public.reconciliations
for select to authenticated using (public.is_org_member(organisation_id));
create policy "webhook members read own" on public.webhook_events
for select to authenticated using (public.is_org_member(organisation_id));
create policy "audit members read own" on public.audit_logs
for select to authenticated using (organisation_id is not null and public.is_org_member(organisation_id));
create policy "dispute parties read" on public.disputes
for select to authenticated using (
  public.is_org_member(raised_by_organisation_id)
  or exists(select 1 from public.orders o where o.id = order_id and public.is_org_member(o.buyer_organisation_id))
);
revoke insert, update, delete on public.ledger_entries from anon, authenticated;
revoke insert, update, delete on public.order_legs from anon, authenticated;
revoke insert, update, delete on public.settlements from anon, authenticated;
revoke insert, update, delete on public.api_clients from anon, authenticated;


