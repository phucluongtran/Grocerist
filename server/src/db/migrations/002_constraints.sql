DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inventory_product_id_unique'
      AND conrelid = 'public.inventory'::regclass
  ) THEN
    ALTER TABLE public.inventory ADD CONSTRAINT inventory_product_id_unique UNIQUE (product_id);
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;
