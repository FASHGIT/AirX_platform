-- The helper is used by authenticated RLS policies. Anonymous callers do not
-- need direct RPC access to test organisation membership.
revoke execute on function public.is_org_member(uuid) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated, service_role;

