-- New product categories for AliExpress dropship items.
-- ASCII slugs consistent with existing enum values.
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'sukat';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'avaimenperat';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'asut';
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'naamiot';
