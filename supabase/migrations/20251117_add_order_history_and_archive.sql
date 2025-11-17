-- ============================================
-- SISTEMA DE HISTÓRICO E ARQUIVAMENTO DE PEDIDOS
-- ============================================

-- Adicionar campo de arquivamento aos pedidos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Criar índice para pedidos arquivados
CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders(is_archived, archived_at);

-- Tabela de histórico de mudanças de status
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id, created_at DESC);

-- Tabela de notificações de pedidos
CREATE TABLE IF NOT EXISTS order_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  notification_type TEXT NOT NULL CHECK (
    notification_type IN ('status_change', 'order_confirmed', 'order_ready', 'out_for_delivery', 'delivered')
  ),
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  is_sent BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_notifications_order ON order_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notifications_sent ON order_notifications(is_sent, created_at);

-- Função para registrar mudanças de status
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou, registrar no histórico
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());

    -- Criar notificação para o cliente
    INSERT INTO order_notifications (
      order_id,
      customer_phone,
      customer_email,
      notification_type,
      status,
      message
    ) VALUES (
      NEW.id,
      NEW.customer_phone,
      NEW.customer_email,
      'status_change',
      NEW.status,
      CASE NEW.status
        WHEN 'confirmed' THEN 'Seu pedido foi confirmado e está sendo preparado!'
        WHEN 'preparing' THEN 'Seu pedido está sendo preparado com carinho!'
        WHEN 'ready' THEN 'Seu pedido está pronto! Aguardando entregador...'
        WHEN 'out_for_delivery' THEN 'Seu pedido saiu para entrega! Em breve chegará até você.'
        WHEN 'delivered' THEN 'Seu pedido foi entregue! Bom apetite!'
        WHEN 'cancelled' THEN 'Seu pedido foi cancelado.'
        ELSE 'Atualização do pedido'
      END
    );

    -- Se o pedido foi entregue, agendar arquivamento
    IF NEW.status = 'delivered' AND NEW.completed_at IS NULL THEN
      NEW.completed_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar mudanças de status
DROP TRIGGER IF EXISTS trigger_log_order_status_change ON orders;
CREATE TRIGGER trigger_log_order_status_change
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Função para arquivar pedidos entregues há mais de 30 minutos
CREATE OR REPLACE FUNCTION archive_old_delivered_orders()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE orders
  SET
    is_archived = TRUE,
    archived_at = NOW()
  WHERE
    status = 'delivered'
    AND completed_at IS NOT NULL
    AND completed_at < (NOW() - INTERVAL '30 minutes')
    AND is_archived = FALSE;

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies para as novas tabelas

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;

-- Histórico de status: Restaurante pode ver o histórico dos seus pedidos
CREATE POLICY "Restaurant owners can view order status history" ON order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = order_status_history.order_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Notificações: Restaurante pode ver notificações dos seus pedidos
CREATE POLICY "Restaurant owners can view order notifications" ON order_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = order_notifications.order_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Permitir criação automática de notificações
CREATE POLICY "System can create order notifications" ON order_notifications
  FOR INSERT WITH CHECK (true);

-- Permitir criação automática de histórico
CREATE POLICY "System can create order status history" ON order_status_history
  FOR INSERT WITH CHECK (true);

-- Comentários nas tabelas
COMMENT ON TABLE order_status_history IS 'Histórico de todas as mudanças de status dos pedidos';
COMMENT ON TABLE order_notifications IS 'Notificações enviadas aos clientes sobre mudanças nos pedidos';
COMMENT ON COLUMN orders.is_archived IS 'Indica se o pedido foi arquivado (não aparece mais no kanban)';
COMMENT ON COLUMN orders.archived_at IS 'Data e hora em que o pedido foi arquivado';
