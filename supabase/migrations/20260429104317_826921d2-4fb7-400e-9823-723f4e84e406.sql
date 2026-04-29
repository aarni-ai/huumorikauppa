UPDATE public.products
SET stock = 4 + (abs(hashtext(id::text)) % 3) -- 4, 5, or 6
WHERE stock < 4;