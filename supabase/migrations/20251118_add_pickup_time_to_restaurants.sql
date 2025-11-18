-- Adicionar campo de tempo estimado de retirada à tabela restaurants
-- A tabela já possui delivery_time_estimate e is_open

-- Adicionar coluna pickup_time_estimate se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'pickup_time_estimate'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN pickup_time_estimate INTEGER DEFAULT 20;
  END IF;
END $$;

-- Adicionar comentário explicativo
COMMENT ON COLUMN restaurants.pickup_time_estimate IS 'Tempo estimado em minutos para retirada no local';
COMMENT ON COLUMN restaurants.delivery_time_estimate IS 'Tempo estimado em minutos para entrega';
COMMENT ON COLUMN restaurants.is_open IS 'Status de abertura da loja (true = aberta, false = fechada)';
