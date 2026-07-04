-- Schedule the monthly product newsletter via pg_cron.
-- Runs on the 1st of each month at 08:00 UTC (= 10:00 Finnish winter time / 11:00 summer).
-- The edge function selects the products (novelty -> best-sellers -> fallback) and
-- aborts if none are found, so an empty/broken newsletter is never sent.
-- To revert: SELECT cron.unschedule('send-monthly-newsletter');

DO $$
BEGIN
  PERFORM cron.unschedule('send-monthly-newsletter');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'send-monthly-newsletter',
  '0 8 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://exhzrrbvipqwhjhjgnxs.supabase.co/functions/v1/send-monthly-newsletter',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
