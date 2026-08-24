-- Prevent browser roles from invoking the RLS helper as a SECURITY DEFINER RPC.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
