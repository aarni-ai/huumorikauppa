ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;
-- Backfill from shipping_address JSON if present
UPDATE public.orders
SET customer_phone = shipping_address->>'phone'
WHERE customer_phone IS NULL AND shipping_address ? 'phone';