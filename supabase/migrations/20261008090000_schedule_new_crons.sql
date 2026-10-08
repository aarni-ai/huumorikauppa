-- Schedule check-printify-shipments (hourly) and daily-summary (07:00 Finnish = 05:00 UTC).

-- Hourly: poll Printify for shipped orders and send customer notifications
SELECT cron.schedule(
  'check-printify-shipments-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/check-printify-shipments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Daily at 05:00 UTC (= 07:00 Finnish time, summer/winter varies ±1h)
SELECT cron.schedule(
  'daily-summary-0700fi',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/daily-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
