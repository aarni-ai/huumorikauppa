UPDATE products 
SET variants = jsonb_set(
  variants, 
  '{variant_images,Vaaleanharmaa}', 
  '["https://images-api.printify.com/mockup/69a555a9cbd6c9d4db0b9a0e/32872/98424/maailman-paras-aiti-huppari.jpg?camera_label=front"]'::jsonb
)
WHERE slug = 'maailman-paras-aiti-huppari'