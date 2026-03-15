ALTER TABLE inventory ADD CONSTRAINT IF NOT EXISTS inventory_product_id_unique UNIQUE (product_id);
