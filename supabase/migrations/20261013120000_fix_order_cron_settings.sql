-- Fix the four order-automation crons so they actually fire.
--
-- Problems in the earlier schedules:
--   20260930070000: url built from current_setting('app.settings.supabase_url', true),
--                   which is NULL unless someone set that GUC -> net.http_post(NULL) -> no call.
--   20261008090000: used current_setting('app.supabase_url') / ('app.service_role_key')
--                   (wrong names, and without missing_ok) -> every run raises an error.
--
-- The crons that have worked since June (auto-sync, newsletter, abandoned-cart) hardcode the
-- project URL and read only 'app.settings.service_role_key'. Reschedule all four the same way.
-- cron.schedule with an existing jobname updates it in place; the unschedule guards are for
-- older pg_cron versions.
--
-- To revert: SELECT cron.unschedule('<jobname>') for each of the four names below.

DO $$
BEGIN
  PERFORM cron.unschedule('recover-orders-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'recover-orders-hourly',
  '5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://exhzrrbvipqwhjhjgnxs.supabase.co/functions/v1/recover-orders',
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
  PERFORM cron.unschedule('check-stuck-orders-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'check-stuck-orders-daily',
  '5 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://exhzrrbvipqwhjhjgnxs.supabase.co/functions/v1/check-stuck-orders',
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
  PERFORM cron.unschedule('check-printify-shipments-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'check-printify-shipments-hourly',
  '20 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://exhzrrbvipqwhjhjgnxs.supabase.co/functions/v1/check-printify-shipments',
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
  PERFORM cron.unschedule('daily-summary-0700fi');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'daily-summary-0700fi',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://exhzrrbvipqwhjhjgnxs.supabase.co/functions/v1/daily-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
