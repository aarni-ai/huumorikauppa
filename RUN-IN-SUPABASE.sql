-- ============================================================
-- HUUMORIKAUPPA – Supabase SQL Editor -kyselyt
-- Aja nämä Supabase-projektin SQL Editorissa:
-- https://supabase.com/dashboard/project/exhzrrbvipqwhjhjgnxs/editor
-- ============================================================


-- ============================================================
-- OSA A: Auli Hurskaisen tilaus (auli.hurskainen@gmail.com, 27.9.2026, t-paita 27,56 e)
-- Vastaanottaja: Toini Aro c/o Auli Hurskainen, Tarvasjoentie 619, 21530 Paimio
-- ============================================================

SELECT
  id,
  LEFT(id::text, 8) AS tilausnumero,
  created_at,
  status,
  printify_status,
  printify_order_id,
  printify_error,
  tracking_number,
  tracking_url,
  carrier,
  shipped_at,
  shipping_notification_sent,
  customer_email,
  customer_name,
  recipient_name,
  shipping_address,
  total,
  items
FROM orders
WHERE customer_email ILIKE 'auli.hurskainen@gmail.com'
  AND created_at >= '2026-09-27 00:00:00'
  AND created_at <  '2026-09-28 23:59:59'
ORDER BY created_at DESC
LIMIT 5;

-- Jos tilaus on jumissa (printify_status = 'pending' tai 'failed'),
-- päivitä se takaisin jonoon:
-- UPDATE orders SET printify_status = 'pending', printify_error = NULL
-- WHERE id = '<tilauksen-uuid>';


-- ============================================================
-- OSA A2: Tiina Kivivirran tilaus (tiina.kivivirta@gmail.com, 24.9.2026, muki 23,80 e)
-- ============================================================

SELECT
  id,
  LEFT(id::text, 8) AS tilausnumero,
  created_at,
  status,
  printify_status,
  printify_order_id,
  printify_error,
  tracking_number,
  tracking_url,
  carrier,
  shipped_at,
  shipping_notification_sent,
  customer_email,
  customer_name,
  recipient_name,
  shipping_address,
  total,
  items
FROM orders
WHERE customer_email ILIKE 'tiina.kivivirta@gmail.com'
  AND created_at >= '2026-09-24 00:00:00'
  AND created_at <  '2026-09-25 23:59:59'
ORDER BY created_at DESC
LIMIT 5;

-- Jumissa (pending / failed / skipped) -> nollaa jonoon, recover-orders yrittaa tunnin sisalla:
-- UPDATE orders SET printify_status = 'pending', printify_error = NULL
-- WHERE id = '<tilauksen-uuid>';
-- Tai aja heti: Supabase Dashboard -> Edge Functions -> recover-orders -> Invoke (body {} )


-- ============================================================
-- OSA B: Kaikki maksetut tilaukset 1.9.2026 lahtien (ei Printifyssa tai yli 10 pv ilman lahetysta)
-- ============================================================

SELECT
  id,
  LEFT(id::text, 8) AS tilausnumero,
  created_at::date AS pvm,
  customer_email,
  customer_name,
  total,
  status,
  printify_status,
  printify_order_id,
  printify_error,
  tracking_number,
  shipped_at,
  shipping_notification_sent,
  CASE
    WHEN shipped_at IS NULL AND created_at < NOW() - INTERVAL '10 days' THEN 'YLI 10 PV - TOIMITA!'
    WHEN shipped_at IS NULL AND created_at < NOW() - INTERVAL '5 days'  THEN 'yli 5 pv - tarkista'
    ELSE ''
  END AS huomio
FROM orders
WHERE status = 'paid'
  AND created_at >= '2026-09-01 00:00:00'
  AND (
    printify_status <> 'submitted'
    OR (shipped_at IS NULL AND created_at < NOW() - INTERVAL '10 days')
  )
ORDER BY created_at DESC;

-- Sahkopostilista samoista tilauksista (asiakkaille ilmoitettavat):
SELECT DISTINCT customer_email
FROM orders
WHERE status = 'paid'
  AND created_at >= '2026-09-01 00:00:00'
  AND (
    printify_status <> 'submitted'
    OR (shipped_at IS NULL AND created_at < NOW() - INTERVAL '10 days')
  );


-- ============================================================
-- OSA E: Tarkista migraatiot (sarakkeet lisatty)
-- ============================================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN (
    'tracking_number', 'tracking_url', 'carrier',
    'shipped_at', 'shipping_notification_sent', 'recipient_name'
  )
ORDER BY column_name;


-- ============================================================
-- OSA E: Tarkista pg_cron-ajastukset
-- ============================================================

SELECT jobname, schedule, command, active
FROM cron.job
ORDER BY jobname;


-- ============================================================
-- OSA E: Tarkista jumissa olevat tilaukset (yli 5 pv pending/failed)
-- ============================================================

SELECT
  id,
  LEFT(id::text, 8) AS tilausnumero,
  created_at::date AS pvm,
  customer_email,
  printify_status,
  printify_error,
  NOW() - created_at AS ikä
FROM orders
WHERE status = 'paid'
  AND printify_status IN ('pending', 'failed', 'skipped')
  AND created_at < NOW() - INTERVAL '5 days'
ORDER BY created_at;


-- ============================================================
-- OSA F: Testaa daily-summary manuaalisesti (aja Edge Functionista)
-- Supabase Dashboard -> Edge Functions -> daily-summary -> Invoke
-- tai:
-- ============================================================
-- SELECT net.http_post(
--   url := 'https://exhzrrbvipqwhjhjgnxs.supabase.co/functions/v1/daily-summary',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
--   ),
--   body := '{}'::jsonb
-- );
