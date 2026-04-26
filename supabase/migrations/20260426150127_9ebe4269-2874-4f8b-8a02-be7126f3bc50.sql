-- Drop the partial unique index (incompatible with ON CONFLICT in supabase-js upsert)
DROP INDEX IF EXISTS public.products_printify_product_id_key;

-- Add a real UNIQUE constraint. NULLs are allowed in unlimited number by default in Postgres.
ALTER TABLE public.products
  ADD CONSTRAINT products_printify_product_id_key UNIQUE (printify_product_id);