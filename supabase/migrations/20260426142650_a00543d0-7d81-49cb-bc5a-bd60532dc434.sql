
-- Add Printify mapping to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS printify_product_id text;

-- Add fulfillment + email status tracking to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS printify_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS printify_order_id text,
  ADD COLUMN IF NOT EXISTS printify_error text,
  ADD COLUMN IF NOT EXISTS email_confirmation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS email_error text;

-- Discount codes table
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percent', -- 'percent' or 'fixed'
  discount_value numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active discount codes are readable by everyone"
  ON public.discount_codes
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage discount codes"
  ON public.discount_codes
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default codes (idempotent)
INSERT INTO public.discount_codes (code, discount_type, discount_value, description)
VALUES
  ('HUUMORI10', 'percent', 10, 'Uutiskirjetilaajan tervetuliaiskoodi -10%'),
  ('HUUMORI5', 'fixed', 5, 'Kuukausittainen uutiskirjekoodi -5€')
ON CONFLICT (code) DO NOTHING;

-- Add active flag + unique to newsletter_subscribers if missing
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_unique
  ON public.newsletter_subscribers (lower(email));
