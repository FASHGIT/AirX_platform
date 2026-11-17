-- Phase 1 identity, organisation onboarding, role checks, invitations and audit.
-- This migration is staged for review only. Do not apply it to a hosted project
-- until the owner approves a non-production database target.

-- Existing defaults grant broad privileges to browser roles. Correct defaults
-- for both roles observed creating objects in public so future tables do not
-- inherit access accidentally. Existing tables remain protected by explicit
-- grants and RLS.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role supabase_admin in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role supabase_admin in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role supabase_admin in schema public
  revoke execute on functions from public, anon, authenticated;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create table public.organisation_types (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{1,39}$'),
  display_name text not null unique,
  legacy_kind public.org_kind not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.organisation_types (code, display_name, legacy_kind) values
  ('airtime_distributor', 'Airtime Distributor', 'dealer'),
  ('telecom_operator', 'Telecom Operator', 'channel_client'),
  ('master_sub_dealer', 'Master Dealer or Sub-dealer', 'dealer'),
  ('retailer_agent', 'Retailer or Agent', 'dealer'),
  ('fintech_payment_provider', 'Fintech or Payment Provider', 'channel_client'),
  ('independent_api_aggregator', 'Independent API Aggregator', 'channel_client')
on conflict (code) do nothing;

create table public.platform_capabilities (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{1,39}$'),
  display_name text not null unique,
  is_enabled boolean not null default true
);
insert into public.platform_capabilities (code, display_name) values
  ('airtime_exchange', 'Airtime Stock Exchange'),
  ('shared_vending', 'Shared API and Vending Infrastructure'),
  ('dealer_channels', 'Personalised Dealer Digital Channels'),
  ('api_access', 'Organisation API Access')
on conflict (code) do nothing;

create table public.organisation_capabilities (
  organisation_id uuid not null
    references public.organisations(id) on delete cascade,
  capability_code text not null
    references public.platform_capabilities(code) on delete restrict,
  status text not null default 'requested'
    check (status in ('requested','approved','suspended','revoked')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  primary key (organisation_id, capability_code)
);

alter table public.organisations
  add column if not exists organisation_type_code text
    references public.organisation_types(code),
  add column if not exists country_code text not null default 'NG'
    check (country_code ~ '^[A-Z]{2}$');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisation_applications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null unique
    references public.organisations(id) on delete cascade,
  submitted_by uuid not null references auth.users(id),
  organisation_type_code text not null
    references public.organisation_types(code),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  contact_email text not null,
  contact_phone text,
  registered_address text,
  business_registration_number text,
  tax_identifier text,
  status text not null default 'submitted'
    check (status in ('submitted','under_review','more_information_required',
                      'approved','rejected','active','suspended','deactivated')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisation_application_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.organisation_applications(id) on delete restrict,
  reviewer_user_id uuid not null references auth.users(id),
  decision text not null
    check (decision in ('under_review','more_information_required','approved','rejected')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.organisation_invitations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations(id) on delete cascade,
  email text not null check (email = lower(btrim(email))),
  role public.member_role not null
    check (role in ('admin','operator','finance','viewer')),
  token_hash text not null unique,
  status text not null default 'pending'
    check (status in ('pending','accepted','cancelled','expired')),
  invited_by uuid not null references auth.users(id),
  accepted_by uuid references auth.users(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  cancelled_at timestamptz
);
create unique index organisation_invitations_pending_email_idx
  on public.organisation_invitations (organisation_id, email)
  where status = 'pending';

create type public.platform_admin_role as enum
  ('super_admin','operations_admin','compliance_risk_admin',
   'finance_settlement_admin','technical_api_admin','platform_auditor');

create table public.platform_admin_memberships (
  user_id uuid primary key references auth.users(id) on delete restrict,
  role public.platform_admin_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index memberships_user_org_idx
  on public.memberships (user_id, organisation_id);
create index organisation_applications_submitter_idx
  on public.organisation_applications (submitted_by, submitted_at desc);
create index organisation_application_reviews_application_idx
  on public.organisation_application_reviews (application_id, created_at desc);

alter table public.organisation_types enable row level security;
alter table public.platform_capabilities enable row level security;
alter table public.organisation_capabilities enable row level security;
alter table public.profiles enable row level security;
alter table public.organisation_applications enable row level security;
alter table public.organisation_application_reviews enable row level security;
alter table public.organisation_invitations enable row level security;
alter table public.platform_admin_memberships enable row level security;

grant select on public.organisation_types to authenticated;
grant select on public.platform_capabilities, public.organisation_capabilities to authenticated;
grant select, update (display_name, updated_at) on public.profiles to authenticated;
grant select on public.organisation_applications to authenticated;
grant select on public.organisation_application_reviews to authenticated;
grant select on public.organisation_invitations to authenticated;
grant select on public.platform_admin_memberships to authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.organisation_types, public.profiles,
     public.platform_capabilities, public.organisation_capabilities,
     public.organisation_applications, public.organisation_application_reviews,
     public.organisation_invitations, public.platform_admin_memberships
  from anon, authenticated;
revoke all on public.organisation_application_reviews,
  public.organisation_invitations, public.platform_admin_memberships
  from anon;
revoke insert, update, delete on public.organisation_capabilities,
  public.platform_capabilities from anon, authenticated;

create or replace function private.is_org_member(target_org uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.organisation_id = target_org
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_org_role(
  target_org uuid,
  allowed_roles text[]
)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.organisation_id = target_org
      and m.user_id = (select auth.uid())
      and m.role::text = any (allowed_roles)
  );
$$;

create or replace function private.is_platform_admin(allowed_roles text[] default null)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admin_memberships p
    where p.user_id = (select auth.uid())
      and p.is_active
      and (allowed_roles is null or p.role::text = any (allowed_roles))
  );
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.has_org_role(uuid, text[]) from public, anon;
revoke all on function private.is_platform_admin(text[]) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated, service_role;
grant execute on function private.has_org_role(uuid, text[]) to authenticated, service_role;
grant execute on function private.is_platform_admin(text[]) to authenticated, service_role;
revoke execute on function public.is_org_member(uuid) from public, anon, authenticated;

-- Rebind all existing tenant read policies to the non-exposed helper schema.
drop policy if exists "members read own organisations" on public.organisations;
create policy "members read own organisations" on public.organisations
  for select to authenticated using (private.is_org_member(id));
drop policy if exists "members read own memberships" on public.memberships;
create policy "members read own memberships" on public.memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_org_member(organisation_id));
drop policy if exists "dealer profile members read" on public.dealer_profiles;
create policy "dealer profile members read" on public.dealer_profiles
  for select to authenticated using (private.is_org_member(organisation_id));
drop policy if exists "buyer profile members read" on public.buyer_profiles;
create policy "buyer profile members read" on public.buyer_profiles
  for select to authenticated using (private.is_org_member(organisation_id));
drop policy if exists "dealer accounts members read" on public.dealer_accounts;
create policy "dealer accounts members read" on public.dealer_accounts
  for select to authenticated using (private.is_org_member(organisation_id));
drop policy if exists "listing members and buyers read" on public.listings;
create policy "listing members and buyers read" on public.listings
  for select to authenticated
  using (private.is_org_member(dealer_organisation_id) or status = 'active');
drop policy if exists "listing members insert own" on public.listings;
create policy "listing members insert own" on public.listings
  for insert to authenticated
  with check (private.has_org_role(dealer_organisation_id, array['owner','admin','operator']));
drop policy if exists "listing members update own" on public.listings;
create policy "listing members update own" on public.listings
  for update to authenticated
  using (private.has_org_role(dealer_organisation_id, array['owner','admin','operator']))
  with check (private.has_org_role(dealer_organisation_id, array['owner','admin','operator']));
drop policy if exists "api clients members read" on public.api_clients;
create policy "api clients members read" on public.api_clients
  for select to authenticated using (private.is_org_member(organisation_id));
drop policy if exists "orders buyer members read" on public.orders;
create policy "orders buyer members read" on public.orders
  for select to authenticated using (private.is_org_member(buyer_organisation_id));
drop policy if exists "order legs buyer or dealer members read" on public.order_legs;
create policy "order legs buyer or dealer members read" on public.order_legs
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_legs.order_id
        and private.is_org_member(o.buyer_organisation_id)
    )
    or private.is_org_member(dealer_organisation_id)
  );
drop policy if exists "ledger members read own" on public.ledger_entries;
create policy "ledger members read own" on public.ledger_entries
  for select to authenticated using (private.is_org_member(organisation_id));
drop policy if exists "settlement members read own" on public.settlements;
create policy "settlement members read own" on public.settlements
  for select to authenticated using (private.is_org_member(dealer_organisation_id));
drop policy if exists "reconciliation members read own" on public.reconciliations;
create policy "reconciliation members read own" on public.reconciliations
  for select to authenticated using (private.is_org_member(organisation_id));
drop policy if exists "webhook members read own" on public.webhook_events;
create policy "webhook members read own" on public.webhook_events
  for select to authenticated using (private.is_org_member(organisation_id));
drop policy if exists "audit members read own" on public.audit_logs;
create policy "audit members read own" on public.audit_logs
  for select to authenticated
  using (organisation_id is not null and private.is_org_member(organisation_id));
drop policy if exists "dispute parties read" on public.disputes;
create policy "dispute parties read" on public.disputes
  for select to authenticated
  using (
    private.is_org_member(raised_by_organisation_id)
    or exists (
      select 1 from public.orders o
      where o.id = disputes.order_id
        and private.is_org_member(o.buyer_organisation_id)
    )
  );

create policy "organisation types enabled read" on public.organisation_types
  for select to authenticated using (is_enabled);
create policy "platform capabilities enabled read" on public.platform_capabilities
  for select to authenticated using (is_enabled);
create policy "organisation members read capabilities" on public.organisation_capabilities
  for select to authenticated using (private.is_org_member(organisation_id));
create policy "profile self read" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "profile self update" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "profile shared organisation read" on public.profiles
  for select to authenticated using (
    exists (
      select 1
      from public.memberships own
      join public.memberships peer on peer.organisation_id = own.organisation_id
      where own.user_id = (select auth.uid())
        and peer.user_id = profiles.user_id
    )
  );
create policy "applications applicant and reviewers read"
  on public.organisation_applications for select to authenticated
  using (
    submitted_by = (select auth.uid())
    or private.is_platform_admin(array['super_admin','operations_admin','compliance_risk_admin'])
  );
create policy "application reviews applicant and reviewers read"
  on public.organisation_application_reviews for select to authenticated
  using (
    exists (
      select 1 from public.organisation_applications a
      where a.id = application_id
        and (a.submitted_by = (select auth.uid())
             or private.is_platform_admin(array['super_admin','operations_admin','compliance_risk_admin']))
    )
  );
create policy "organisation managers read invitations"
  on public.organisation_invitations for select to authenticated
  using (private.has_org_role(organisation_id, array['owner','admin']));
create policy "platform admins read own role"
  on public.platform_admin_memberships for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
    values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 120))
    on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
drop trigger if exists airx_auth_user_profile on auth.users;
create trigger airx_auth_user_profile
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

create or replace function private.touch_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.touch_profile_updated_at() from public, anon, authenticated;
create trigger airx_profile_updated_at
  before update on public.profiles
  for each row execute function private.touch_profile_updated_at();

create or replace function public.submit_organisation_application(
  p_name text,
  p_type_code text,
  p_country_code text,
  p_contact_email text,
  p_contact_phone text default null,
  p_registered_address text default null,
  p_business_registration_number text default null,
  p_tax_identifier text default null
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  selected_type public.organisation_types%rowtype;
  new_org_id uuid;
  safe_name text := btrim(p_name);
  safe_slug text;
  safe_country text := upper(btrim(p_country_code));
  safe_email text := lower(btrim(p_contact_email));
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if safe_name is null or length(safe_name) < 2 or length(safe_name) > 160 then
    raise exception 'Organisation name must be 2 to 160 characters' using errcode = '22023';
  end if;
  if safe_country !~ '^[A-Z]{2}$' then
    raise exception 'Country must be a two-letter ISO code' using errcode = '22023';
  end if;
  if safe_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or length(safe_email) > 254 then
    raise exception 'A valid contact email is required' using errcode = '22023';
  end if;
  select * into selected_type from public.organisation_types
    where code = p_type_code and is_enabled;
  if not found then raise exception 'Organisation category is unavailable' using errcode = '22023'; end if;

  safe_slug := left(trim(both '-' from regexp_replace(lower(safe_name), '[^a-z0-9]+', '-', 'g')), 48)
    || '-' || left(replace(gen_random_uuid()::text, '-', ''), 8);
  insert into public.organisations (name, slug, kind, status, organisation_type_code, country_code)
    values (safe_name, safe_slug, selected_type.legacy_kind, 'pending_review', selected_type.code, safe_country)
    returning id into new_org_id;
  insert into public.memberships (organisation_id, user_id, role)
    values (new_org_id, caller_id, 'owner');
  insert into public.organisation_applications (
    organisation_id, submitted_by, organisation_type_code, country_code,
    contact_email, contact_phone, registered_address,
    business_registration_number, tax_identifier
  ) values (
    new_org_id, caller_id, selected_type.code, safe_country,
    safe_email, nullif(btrim(p_contact_phone), ''), nullif(btrim(p_registered_address), ''),
    nullif(btrim(p_business_registration_number), ''), nullif(btrim(p_tax_identifier), '')
  );
  insert into public.audit_logs (organisation_id, actor_user_id, action, resource_type, resource_id, metadata)
    values (new_org_id, caller_id, 'organisation.application.submitted', 'organisation_application',
            new_org_id::text, jsonb_build_object('type', selected_type.code, 'country', safe_country));
  return new_org_id;
end;
$$;

create or replace function public.create_organisation_invitation(
  p_organisation_id uuid,
  p_email text,
  p_role public.member_role
)
returns table (invitation_id uuid, invitation_token text, expires_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  raw_token text := encode(gen_random_bytes(32), 'hex');
  invited_email text := lower(btrim(p_email));
  new_id uuid;
  end_at timestamptz := now() + interval '7 days';
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if not private.has_org_role(p_organisation_id, array['owner','admin']) then
    raise exception 'Organisation administrator access required' using errcode = '42501';
  end if;
  if p_role not in ('admin','operator','finance','viewer') then
    raise exception 'This role cannot be assigned by invitation' using errcode = '22023';
  end if;
  if invited_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;
  insert into public.organisation_invitations
    (organisation_id, email, role, token_hash, invited_by, expires_at)
  values
    (p_organisation_id, invited_email, p_role, encode(digest(raw_token, 'sha256'), 'hex'), caller_id, end_at)
  returning id into new_id;
  insert into public.audit_logs (organisation_id, actor_user_id, action, resource_type, resource_id, metadata)
    values (p_organisation_id, caller_id, 'organisation.invitation.created', 'organisation_invitation',
            new_id::text, jsonb_build_object('email', invited_email, 'role', p_role::text));
  return query select new_id, raw_token, end_at;
end;
$$;

create or replace function public.accept_organisation_invitation(p_token text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_email text;
  invitation public.organisation_invitations%rowtype;
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  select lower(email) into caller_email from auth.users where id = caller_id;
  select * into invitation
    from public.organisation_invitations
    where token_hash = encode(digest(p_token, 'sha256'), 'hex')
    for update;
  if not found or invitation.status <> 'pending' or invitation.expires_at <= now() then
    raise exception 'Invitation is invalid or expired' using errcode = '22023';
  end if;
  if invitation.email <> caller_email then
    raise exception 'Sign in with the invited email address' using errcode = '42501';
  end if;
  insert into public.memberships (organisation_id, user_id, role)
    values (invitation.organisation_id, caller_id, invitation.role)
    on conflict (organisation_id, user_id) do nothing;
  update public.organisation_invitations
    set status = 'accepted', accepted_by = caller_id, accepted_at = now()
    where id = invitation.id;
  insert into public.audit_logs (organisation_id, actor_user_id, action, resource_type, resource_id, metadata)
    values (invitation.organisation_id, caller_id, 'organisation.invitation.accepted',
            'organisation_invitation', invitation.id::text, jsonb_build_object('role', invitation.role::text));
  return invitation.organisation_id;
end;
$$;

create or replace function public.cancel_organisation_invitation(p_invitation_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  invitation public.organisation_invitations%rowtype;
  caller_id uuid := (select auth.uid());
begin
  select * into invitation from public.organisation_invitations
    where id = p_invitation_id for update;
  if not found or not private.has_org_role(invitation.organisation_id, array['owner','admin']) then
    raise exception 'Invitation administrator access required' using errcode = '42501';
  end if;
  if invitation.status <> 'pending' then raise exception 'Invitation is no longer pending' using errcode = '22023'; end if;
  update public.organisation_invitations set status = 'cancelled', cancelled_at = now()
    where id = p_invitation_id;
  insert into public.audit_logs (organisation_id, actor_user_id, action, resource_type, resource_id)
    values (invitation.organisation_id, caller_id, 'organisation.invitation.cancelled',
            'organisation_invitation', p_invitation_id::text);
end;
$$;

create or replace function public.review_organisation_application(
  p_application_id uuid,
  p_decision text,
  p_notes text default ''
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  application public.organisation_applications%rowtype;
  next_status text := p_decision;
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if not private.is_platform_admin(array['super_admin','operations_admin','compliance_risk_admin']) then
    raise exception 'Platform review access required' using errcode = '42501';
  end if;
  if p_decision not in ('under_review','more_information_required','approved','rejected') then
    raise exception 'Unsupported review decision' using errcode = '22023';
  end if;
  select * into application from public.organisation_applications
    where id = p_application_id for update;
  if not found then raise exception 'Application not found' using errcode = 'P0002'; end if;
  if application.status not in ('submitted','under_review','more_information_required') then
    raise exception 'This application is no longer open for review' using errcode = '22023';
  end if;
  if application.submitted_by = caller_id then
    raise exception 'Applicants cannot review their own application' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.organisation_application_reviews r
    where r.application_id = p_application_id and r.reviewer_user_id = caller_id
  ) then raise exception 'A different administrator must perform this review' using errcode = '42501';
  end if;
  insert into public.organisation_application_reviews
    (application_id, reviewer_user_id, decision, notes)
    values (p_application_id, caller_id, p_decision, left(coalesce(p_notes,''), 4000));
  update public.organisation_applications set status = next_status, updated_at = now()
    where id = p_application_id;
  update public.organisations
    set status = case when next_status = 'approved' then 'approved'
                      when next_status = 'rejected' then 'rejected'
                      else status end,
        updated_at = now()
    where id = application.organisation_id;
  insert into public.audit_logs (organisation_id, actor_user_id, action, resource_type, resource_id, metadata)
    values (application.organisation_id, caller_id, 'organisation.application.reviewed',
            'organisation_application', p_application_id::text,
            jsonb_build_object('decision', p_decision));
end;
$$;

create or replace function public.set_organisation_member_role(
  p_organisation_id uuid,
  p_user_id uuid,
  p_role public.member_role
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  current_role public.member_role;
  owner_count integer;
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if not private.has_org_role(p_organisation_id, array['owner','admin']) then
    raise exception 'Organisation administrator access required' using errcode = '42501';
  end if;
  select role into current_role from public.memberships
    where organisation_id = p_organisation_id and user_id = p_user_id for update;
  if not found then raise exception 'Member not found' using errcode = 'P0002'; end if;
  if current_role = 'owner'
     and not private.has_org_role(p_organisation_id, array['owner']) then
    raise exception 'Only an owner may change an owner role' using errcode = '42501';
  end if;
  if p_role = 'owner' and not private.has_org_role(p_organisation_id, array['owner']) then
    raise exception 'Only an owner may assign the owner role' using errcode = '42501';
  end if;
  if current_role = 'owner' and p_role <> 'owner' then
    select count(*) into owner_count from public.memberships
      where organisation_id = p_organisation_id and role = 'owner';
    if owner_count < 2 then raise exception 'The organisation must keep an owner' using errcode = '23514'; end if;
  end if;
  update public.memberships set role = p_role
    where organisation_id = p_organisation_id and user_id = p_user_id;
  insert into public.audit_logs (organisation_id, actor_user_id, action, resource_type, resource_id, metadata)
    values (p_organisation_id, caller_id, 'organisation.member.role_changed', 'membership',
            p_user_id::text, jsonb_build_object('from', current_role::text, 'to', p_role::text));
end;
$$;

create or replace function public.remove_organisation_member(
  p_organisation_id uuid,
  p_user_id uuid
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target_role public.member_role;
  owner_count integer;
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if not private.has_org_role(p_organisation_id, array['owner','admin']) then
    raise exception 'Organisation administrator access required' using errcode = '42501';
  end if;
  select role into target_role from public.memberships
    where organisation_id = p_organisation_id and user_id = p_user_id for update;
  if not found then raise exception 'Member not found' using errcode = 'P0002'; end if;
  if target_role = 'owner'
     and not private.has_org_role(p_organisation_id, array['owner']) then
    raise exception 'Only an owner may remove an owner' using errcode = '42501';
  end if;
  if target_role = 'owner' then
    select count(*) into owner_count from public.memberships
      where organisation_id = p_organisation_id and role = 'owner';
    if owner_count < 2 then raise exception 'The organisation must keep an owner' using errcode = '23514'; end if;
  end if;
  delete from public.memberships
    where organisation_id = p_organisation_id and user_id = p_user_id;
  insert into public.audit_logs (organisation_id, actor_user_id, action, resource_type, resource_id, metadata)
    values (p_organisation_id, caller_id, 'organisation.member.removed', 'membership',
            p_user_id::text, jsonb_build_object('role', target_role::text));
end;
$$;

create or replace function public.set_organisation_capability(
  p_organisation_id uuid,
  p_capability_code text,
  p_status text
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  old_status text;
begin
  if caller_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if not private.is_platform_admin(array['super_admin','operations_admin']) then
    raise exception 'Platform operations access required' using errcode = '42501';
  end if;
  if p_status not in ('approved','suspended','revoked') then
    raise exception 'Unsupported capability decision' using errcode = '22023';
  end if;
  if not exists (select 1 from public.organisations where id = p_organisation_id) then
    raise exception 'Organisation not found' using errcode = 'P0002';
  end if;
  select status into old_status from public.organisation_capabilities
    where organisation_id = p_organisation_id and capability_code = p_capability_code for update;
  insert into public.organisation_capabilities
    (organisation_id, capability_code, status, updated_at, updated_by)
    values (p_organisation_id, p_capability_code, p_status, now(), caller_id)
    on conflict (organisation_id, capability_code) do update
      set status = excluded.status, updated_at = now(), updated_by = caller_id;
  insert into public.audit_logs (organisation_id, actor_user_id, action, resource_type, resource_id, metadata)
    values (p_organisation_id, caller_id, 'organisation.capability.changed', 'organisation_capability',
            p_capability_code, jsonb_build_object('from', old_status, 'to', p_status));
end;
$$;

revoke execute on function public.submit_organisation_application(text,text,text,text,text,text,text,text)
  from public, anon;
revoke execute on function public.create_organisation_invitation(uuid,text,public.member_role)
  from public, anon;
revoke execute on function public.accept_organisation_invitation(text)
  from public, anon;
revoke execute on function public.cancel_organisation_invitation(uuid)
  from public, anon;
revoke execute on function public.review_organisation_application(uuid,text,text)
  from public, anon;
grant execute on function public.submit_organisation_application(text,text,text,text,text,text,text,text)
  to authenticated;
grant execute on function public.create_organisation_invitation(uuid,text,public.member_role)
  to authenticated;
grant execute on function public.accept_organisation_invitation(text)
  to authenticated;
grant execute on function public.cancel_organisation_invitation(uuid)
  to authenticated;
grant execute on function public.review_organisation_application(uuid,text,text)
  to authenticated;
revoke execute on function public.set_organisation_member_role(uuid,uuid,public.member_role)
  from public, anon;
revoke execute on function public.remove_organisation_member(uuid,uuid)
  from public, anon;
revoke execute on function public.set_organisation_capability(uuid,text,text)
  from public, anon;
grant execute on function public.set_organisation_member_role(uuid,uuid,public.member_role)
  to authenticated;
grant execute on function public.remove_organisation_member(uuid,uuid)
  to authenticated;
grant execute on function public.set_organisation_capability(uuid,text,text)
  to authenticated;

-- Existing public grants are explicitly limited. New application tables are
-- read-only to users; all writes happen through checked, audited RPCs above.
revoke all privileges on public.organisation_types, public.profiles,
  public.organisation_applications, public.organisation_application_reviews,
  public.organisation_invitations, public.platform_admin_memberships
  from anon;


