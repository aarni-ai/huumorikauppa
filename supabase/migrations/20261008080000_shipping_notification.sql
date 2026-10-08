-- Add tracking and shipping notification columns to orders table.
-- Used by the recover-orders cron to detect when Printify ships
-- and send the customer a shipping notification with tracking info.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS carrier text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS shipping_notification_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recipient_name text;

-- Index for the cron query (submitted + not notified)
CREATE INDEX IF NOT EXISTS idx_orders_shipping_notify
  ON orders (printify_status, shipping_notification_sent)
  WHERE printify_status = 'submitted' AND shipping_notification_sent = false;
