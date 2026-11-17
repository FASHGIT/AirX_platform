-- Row access remains governed by RLS. Keep browser roles at the minimum
-- table-level grants needed by the current policies; leave service_role intact.
revoke all privileges on all tables in schema public from anon;
revoke all privileges on all tables in schema public from authenticated;

grant select on all tables in schema public to authenticated;
grant insert, update on table public.listings to authenticated;

