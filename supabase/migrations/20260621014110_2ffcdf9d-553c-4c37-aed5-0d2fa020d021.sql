
-- 1. Add review-request tracking columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS review_request_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_token UUID UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS review_unsubscribed BOOLEAN NOT NULL DEFAULT false;

UPDATE public.orders SET review_token = gen_random_uuid() WHERE review_token IS NULL;

-- 2. Product reviews table (collected from real customers via the email link)
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_slug TEXT,
  customer_name TEXT,
  customer_email TEXT,
  stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  text TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_reviews TO anon;          -- only approved reviews via RLS
GRANT SELECT ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.product_reviews;
CREATE POLICY "Anyone can read approved reviews"
  ON public.product_reviews FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Admins manage reviews" ON public.product_reviews;
CREATE POLICY "Admins manage reviews"
  ON public.product_reviews FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS product_reviews_slug_idx ON public.product_reviews(product_slug);
CREATE INDEX IF NOT EXISTS product_reviews_order_idx ON public.product_reviews(order_id);
