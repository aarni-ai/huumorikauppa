-- Add new category values to the enum
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'bodyt';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'peitot';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'pipot';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'laukut';
