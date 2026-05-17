
-- 1) Remove public read access on discount_codes; validation already happens server-side via service role
DROP POLICY IF EXISTS "Active discount codes are readable by everyone" ON public.discount_codes;

-- 2) Lock down SECURITY DEFINER helper functions to service role only
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- 3) Trigger-only helper; no API caller needs it
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Note: public.has_role(uuid, app_role) intentionally remains executable by authenticated
-- because it is used inside RLS policies and must be callable in the user's context.
