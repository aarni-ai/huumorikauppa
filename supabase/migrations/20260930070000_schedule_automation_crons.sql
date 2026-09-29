-- Schedule three automation crons:
--   1. recover-orders         — hourly sweep of unprocessed paid Stripe sessions
--   2. check-stuck-orders     — daily alert for Printify orders stuck >5 days
--   3. site-health-check      — daily check that key pages respond HTTP 200
--
-- Requires pg_cron + pg_net (both available on Supabase).
-- Run the SUPABASE_URL/SERVICE_ROLE_KEY settings before applying:
--   SELECT set_config('app.settings.supabase_url', '<url>', false);
--   SELECT set_config('app.settings.service_role_key', '<key>', false);
--
-- To revert:
--   SELECT cron.unschedule('recover-orders-hourly');
--   SELECT cron.unschedule('check-stuck-orders-daily');
--   SELECT cron.unschedule('site-health-check-daily');

DO $$
BEGIN
  -- 1. recover-orders: every hour at :05
  PERFORM cron.unschedule('recover-orders-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'recover-orders-hourly',
  '5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/recover-orders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

DO $$
BEGIN
  -- 2. check-stuck-orders: every day at 07:05 UTC
  PERFORM cron.unschedule('check-stuck-orders-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'check-stuck-orders-daily',
  '5 7 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/check-stuck-orders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

DO $$
BEGIN
  -- 3. site-health-check: every day at 06:00 UTC
  PERFORM cron.unschedule('site-health-check-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'site-health-check-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/site-health-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
