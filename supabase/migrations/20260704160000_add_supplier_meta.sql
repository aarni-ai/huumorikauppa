-- Supplier metadata for a multi-supplier catalog (Printify + AliExpress dropship + future).
-- Enables VAT/IOSS reporting (origin country) and per-supplier fulfillment/handling.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS supplier text NOT NULL DEFAULT 'printify',
  ADD COLUMN IF NOT EXISTS origin_country text;

-- Existing catalog is Printify, printed in the EU.
UPDATE public.products SET origin_country = 'EU' WHERE origin_country IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(supplier);
