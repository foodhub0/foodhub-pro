-- Corrigir colunas da tabela orders para compatibilidade com o código frontend
-- Esta migração adiciona order_number e renomeia total para total_amount

-- Adicionar coluna order_number se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_number TEXT;
  END IF;
END $$;

-- Renomear coluna total para total_amount se necessário
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE orders RENAME COLUMN total TO total_amount;
  END IF;
END $$;

-- Criar função para gerar números de pedido sequenciais
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Gerar número sequencial baseado na data atual
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM orders
  WHERE order_number LIKE TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '%';

  NEW.order_number := TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(next_number::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar order_number automaticamente
DROP TRIGGER IF EXISTS generate_order_number_trigger ON orders;
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- Adicionar índice para order_number
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
