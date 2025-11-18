-- Adicionar campos de estatísticas à tabela customers se não existirem

DO $$
BEGIN
  -- Adicionar total_orders se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'total_orders'
  ) THEN
    ALTER TABLE customers ADD COLUMN total_orders INTEGER DEFAULT 0;
  END IF;

  -- Adicionar total_spent se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'total_spent'
  ) THEN
    ALTER TABLE customers ADD COLUMN total_spent DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- Adicionar average_ticket se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'average_ticket'
  ) THEN
    ALTER TABLE customers ADD COLUMN average_ticket DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- Adicionar last_order_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'last_order_at'
  ) THEN
    ALTER TABLE customers ADD COLUMN last_order_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Criar função para atualizar estatísticas do cliente
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar estatísticas quando o pedido for atualizado ou inserido
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.customer_id IS NOT NULL THEN
    UPDATE customers
    SET
      total_orders = (
        SELECT COUNT(*)
        FROM orders
        WHERE customer_id = NEW.customer_id
        AND status = 'delivered'
      ),
      total_spent = (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM orders
        WHERE customer_id = NEW.customer_id
        AND status = 'delivered'
      ),
      average_ticket = (
        SELECT COALESCE(AVG(total_amount), 0)
        FROM orders
        WHERE customer_id = NEW.customer_id
        AND status = 'delivered'
      ),
      last_order_at = (
        SELECT MAX(created_at)
        FROM orders
        WHERE customer_id = NEW.customer_id
      )
    WHERE id = NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar estatísticas automaticamente
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON orders;
CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- Recalcular estatísticas para todos os clientes existentes
UPDATE customers c
SET
  total_orders = (
    SELECT COUNT(*)
    FROM orders o
    WHERE o.customer_id = c.id
    AND o.status = 'delivered'
  ),
  total_spent = (
    SELECT COALESCE(SUM(o.total_amount), 0)
    FROM orders o
    WHERE o.customer_id = c.id
    AND o.status = 'delivered'
  ),
  average_ticket = (
    SELECT COALESCE(AVG(o.total_amount), 0)
    FROM orders o
    WHERE o.customer_id = c.id
    AND o.status = 'delivered'
  ),
  last_order_at = (
    SELECT MAX(o.created_at)
    FROM orders o
    WHERE o.customer_id = c.id
  );
