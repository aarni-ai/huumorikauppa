UPDATE public.products
SET images = ARRAY[
  'https://images-api.printify.com/mockup/69dfba8d2d234fca16038da6/65216/6310/tonnin-seteli-kahvikuppi.jpg?camera_label=front',
  'https://images-api.printify.com/mockup/69dfba8d2d234fca16038da6/65216/6311/tonnin-seteli-kahvikuppi.jpg?camera_label=right',
  'https://images-api.printify.com/mockup/69dfba8d2d234fca16038da6/65216/101798/tonnin-seteli-kahvikuppi.jpg?camera_label=back',
  'https://images-api.printify.com/mockup/69dfba8d2d234fca16038da6/65216/6312/tonnin-seteli-kahvikuppi.jpg?camera_label=left'
],
variants = jsonb_set(
  COALESCE(variants, '{}'::jsonb),
  '{variant_images}',
  jsonb_build_object('Valkoinen', jsonb_build_array(
    'https://images-api.printify.com/mockup/69dfba8d2d234fca16038da6/65216/6310/tonnin-seteli-kahvikuppi.jpg?camera_label=front',
    'https://images-api.printify.com/mockup/69dfba8d2d234fca16038da6/65216/6311/tonnin-seteli-kahvikuppi.jpg?camera_label=right',
    'https://images-api.printify.com/mockup/69dfba8d2d234fca16038da6/65216/101798/tonnin-seteli-kahvikuppi.jpg?camera_label=back',
    'https://images-api.printify.com/mockup/69dfba8d2d234fca16038da6/65216/6312/tonnin-seteli-kahvikuppi.jpg?camera_label=left'
  ))
),
updated_at = now()
WHERE id = '07b34936-904c-4463-b5fc-0b7fa2701039';