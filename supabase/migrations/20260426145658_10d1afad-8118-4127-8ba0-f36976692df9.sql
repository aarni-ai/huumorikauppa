-- Add unique constraint on printify_product_id so we can use ON CONFLICT
-- in the Printify auto-sync (lazy + cron). Partial unique index allows
-- multiple NULLs (e.g. for legacy/manual products without a Printify link).
CREATE UNIQUE INDEX IF NOT EXISTS products_printify_product_id_key
  ON public.products (printify_product_id)
  WHERE printify_product_id IS NOT NULL;