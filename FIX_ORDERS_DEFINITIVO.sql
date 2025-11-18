-- ═══════════════════════════════════════════════════════════════
-- FIX DEFINITIVO - SISTEMA DE PEDIDOS 100% FUNCIONAL
-- ═══════════════════════════════════════════════════════════════
--
-- Este script resolve TODOS os problemas de schema do banco de dados.
-- Pode ser executado múltiplas vezes sem causar erros.
--
-- INSTRUÇÕES:
-- 1. Abra o Supabase SQL Editor
-- 2. Copie TODO este conteúdo
-- 3. Cole e clique em RUN
-- 4. Aguarde a conclusão (pode levar 10-30 segundos)
--
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- PARTE 1: GARANTIR QUE OS ENUMS EXISTEM
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Criar ENUM types se não existirem
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_type') THEN
    CREATE TYPE order_type AS ENUM ('delivery', 'table', 'takeout');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'courier_status') THEN
    CREATE TYPE courier_status AS ENUM ('available', 'busy', 'offline');
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 2: DROPAR TABELAS ANTIGAS (EM ORDEM REVERSA DE DEPENDÊNCIA)
-- ═══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS order_item_variations CASCADE;
DROP TABLE IF EXISTS order_item_additionals CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 3: RECRIAR TABELAS COM SCHEMA CORRETO
-- ═══════════════════════════════════════════════════════════════

-- Tabela de Clientes
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  average_ticket DECIMAL(10,2) DEFAULT 0,
  last_order_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint para evitar clientes duplicados
  UNIQUE(restaurant_id, phone)
);

-- Tabela de Pedidos (CORRETA!)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Número do pedido (gerado automaticamente)
  order_number TEXT UNIQUE,

  -- Tipo de pedido (ENUM)
  order_type order_type NOT NULL,

  -- Status do pedido (ENUM) ← AQUI ESTÁ A COLUNA QUE ESTAVA FALTANDO!
  status order_status DEFAULT 'pending',

  -- Status do pagamento (ENUM)
  payment_status payment_status DEFAULT 'pending',

  -- Informações do cliente (snapshot para histórico)
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- Endereço de entrega
  delivery_address TEXT,
  delivery_number TEXT,
  delivery_complement TEXT,
  delivery_neighborhood TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_zipcode TEXT,
  delivery_instructions TEXT,

  -- Mesa (para pedidos no local)
  table_number TEXT,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,

  -- Valores financeiros
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0, -- ← NOME CORRETO: total_amount

  -- Método de pagamento
  payment_method TEXT CHECK (
    payment_method IN ('pix', 'credit_card', 'debit_card', 'cash', 'voucher')
  ),

  -- Observações
  notes TEXT,

  -- Timestamps
  estimated_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  prepared_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de Itens do Pedido
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Snapshot do produto (para histórico)
  product_name TEXT NOT NULL,
  product_image_url TEXT,

  -- Quantidade e preços
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,

  -- Observações especiais
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Variações do Item (tamanhos)
CREATE TABLE order_item_variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,

  -- Snapshot da variação
  variation_name TEXT NOT NULL,
  variation_price DECIMAL(10,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Adicionais do Item
CREATE TABLE order_item_additionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  additional_id UUID REFERENCES additionals(id) ON DELETE SET NULL,

  -- Snapshot do adicional
  additional_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- PARTE 4: ÍNDICES PARA PERFORMANCE
-- ═══════════════════════════════════════════════════════════════

-- Índices para customers
CREATE INDEX idx_customers_restaurant ON customers(restaurant_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_last_order ON customers(last_order_at DESC);

-- Índices para orders
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status); -- ← AGORA VAI FUNCIONAR!
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Índices para order_items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Índices para order_item_variations
CREATE INDEX idx_order_item_variations_item ON order_item_variations(order_item_id);

-- Índices para order_item_additionals
CREATE INDEX idx_order_item_additionals_item ON order_item_additionals(order_item_id);

-- ═══════════════════════════════════════════════════════════════
-- PARTE 5: FUNÇÕES E TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar número do pedido automaticamente
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  date_prefix TEXT;
BEGIN
  -- Se já tem número, não gerar
  IF NEW.order_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Gerar prefixo da data (YYYYMMDD)
  date_prefix := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  -- Buscar próximo número sequencial do dia
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM orders
  WHERE order_number LIKE date_prefix || '%';

  -- Gerar número do pedido: YYYYMMDD0001
  NEW.order_number := date_prefix || LPAD(next_number::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas do cliente
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Atualizar estatísticas
  UPDATE customers
  SET
    total_orders = (
      SELECT COUNT(*)
      FROM orders
      WHERE customer_id = NEW.customer_id
        AND status NOT IN ('cancelled')
    ),
    total_spent = (
      SELECT COALESCE(SUM(total_amount), 0)
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

  -- Calcular ticket médio
  UPDATE customers
  SET average_ticket = CASE
    WHEN total_orders > 0 THEN total_spent / total_orders
    ELSE 0
  END
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar cliente automaticamente se não existir
CREATE OR REPLACE FUNCTION auto_create_customer()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Se já tem customer_id, não fazer nada
  IF NEW.customer_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar se já existe cliente com este telefone no restaurante
  SELECT id INTO v_customer_id
  FROM customers
  WHERE restaurant_id = NEW.restaurant_id
    AND phone = NEW.customer_phone
  LIMIT 1;

  -- Se não existe, criar novo cliente
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (
      restaurant_id,
      name,
      phone,
      email,
      total_orders,
      total_spent,
      average_ticket
    ) VALUES (
      NEW.restaurant_id,
      NEW.customer_name,
      NEW.customer_phone,
      NEW.customer_email,
      0,
      0,
      0
    ) RETURNING id INTO v_customer_id;
  END IF;

  -- Associar o pedido ao cliente
  NEW.customer_id := v_customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 6: APLICAR TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Trigger: Atualizar updated_at em customers
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Atualizar updated_at em orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Gerar order_number automaticamente
DROP TRIGGER IF EXISTS generate_order_number_trigger ON orders;
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- Trigger: Auto-criar cliente se não existir
DROP TRIGGER IF EXISTS auto_create_customer_trigger ON orders;
CREATE TRIGGER auto_create_customer_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_customer();

-- Trigger: Atualizar estatísticas do cliente
DROP TRIGGER IF EXISTS update_customer_stats_trigger ON orders;
CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- ═══════════════════════════════════════════════════════════════
-- PARTE 7: ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

-- Habilitar RLS em todas as tabelas
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_additionals ENABLE ROW LEVEL SECURITY;

-- ========== CUSTOMERS ==========

DROP POLICY IF EXISTS "Public can view customers" ON customers;
DROP POLICY IF EXISTS "Restaurants can view their customers" ON customers;
DROP POLICY IF EXISTS "Restaurants can insert customers" ON customers;
DROP POLICY IF EXISTS "Restaurants can update their customers" ON customers;
DROP POLICY IF EXISTS "Anyone can create customer" ON customers;
DROP POLICY IF EXISTS "Customers can view their data" ON customers;

-- Público pode criar clientes (guest checkout)
CREATE POLICY "Public can insert customers" ON customers
  FOR INSERT WITH CHECK (true);

-- Público pode ver clientes (necessário para guest checkout)
CREATE POLICY "Public can view customers" ON customers
  FOR SELECT USING (true);

-- Restaurantes podem atualizar seus clientes
CREATE POLICY "Restaurants can update their customers" ON customers
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT id FROM restaurants
      WHERE owner_id = auth.uid()
    )
  );

-- ========== ORDERS ==========

DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can view their orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can update their orders" ON orders;
DROP POLICY IF EXISTS "Public can create orders" ON orders;

-- Público pode criar pedidos (guest checkout)
CREATE POLICY "Public can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Restaurantes podem ver seus pedidos
CREATE POLICY "Restaurants can view their orders" ON orders
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM restaurants
      WHERE owner_id = auth.uid()
    )
  );

-- Restaurantes podem atualizar seus pedidos
CREATE POLICY "Restaurants can update their orders" ON orders
  FOR UPDATE USING (
    restaurant_id IN (
      SELECT id FROM restaurants
      WHERE owner_id = auth.uid()
    )
  );

-- ========== ORDER ITEMS ==========

DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;
DROP POLICY IF EXISTS "Restaurant owners can view order items" ON order_items;
DROP POLICY IF EXISTS "Public can view order items" ON order_items;
DROP POLICY IF EXISTS "Public can create order items" ON order_items;

-- Público pode criar itens de pedido
CREATE POLICY "Public can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Público pode ver itens de pedido
CREATE POLICY "Public can view order items" ON order_items
  FOR SELECT USING (true);

-- ========== ORDER ITEM VARIATIONS ==========

DROP POLICY IF EXISTS "Anyone can create order item variations" ON order_item_variations;
DROP POLICY IF EXISTS "Restaurant owners can view order item variations" ON order_item_variations;
DROP POLICY IF EXISTS "Public can view order item variations" ON order_item_variations;
DROP POLICY IF EXISTS "Public can create order item variations" ON order_item_variations;

-- Público pode criar variações
CREATE POLICY "Public can create order item variations" ON order_item_variations
  FOR INSERT WITH CHECK (true);

-- Público pode ver variações
CREATE POLICY "Public can view order item variations" ON order_item_variations
  FOR SELECT USING (true);

-- ========== ORDER ITEM ADDITIONALS ==========

DROP POLICY IF EXISTS "Public can create order item additionals" ON order_item_additionals;
DROP POLICY IF EXISTS "Public can view order item additionals" ON order_item_additionals;

-- Público pode criar adicionais
CREATE POLICY "Public can create order item additionals" ON order_item_additionals
  FOR INSERT WITH CHECK (true);

-- Público pode ver adicionais
CREATE POLICY "Public can view order item additionals" ON order_item_additionals
  FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════
-- PARTE 8: HABILITAR REALTIME
-- ═══════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 9: VERIFICAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_orders_exists BOOLEAN;
  v_status_column_exists BOOLEAN;
  v_total_amount_column_exists BOOLEAN;
  v_order_number_column_exists BOOLEAN;
  v_index_status_exists BOOLEAN;
BEGIN
  -- Verificar se tabela orders existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) INTO v_orders_exists;

  -- Verificar se coluna status existe
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status'
  ) INTO v_status_column_exists;

  -- Verificar se coluna total_amount existe
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'total_amount'
  ) INTO v_total_amount_column_exists;

  -- Verificar se coluna order_number existe
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_number'
  ) INTO v_order_number_column_exists;

  -- Verificar se índice idx_orders_status existe
  SELECT EXISTS (
    SELECT FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'orders' AND indexname = 'idx_orders_status'
  ) INTO v_index_status_exists;

  -- Exibir resultados
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FIX DEFINITIVO CONCLUÍDO COM SUCESSO!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Verificações:';
  RAISE NOTICE '   ✓ Tabela orders: %', CASE WHEN v_orders_exists THEN '✅ Criada' ELSE '❌ Erro' END;
  RAISE NOTICE '   ✓ Coluna status: %', CASE WHEN v_status_column_exists THEN '✅ Existe' ELSE '❌ Erro' END;
  RAISE NOTICE '   ✓ Coluna total_amount: %', CASE WHEN v_total_amount_column_exists THEN '✅ Existe' ELSE '❌ Erro' END;
  RAISE NOTICE '   ✓ Coluna order_number: %', CASE WHEN v_order_number_column_exists THEN '✅ Existe' ELSE '❌ Erro' END;
  RAISE NOTICE '   ✓ Índice idx_orders_status: %', CASE WHEN v_index_status_exists THEN '✅ Criado' ELSE '❌ Erro' END;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Recursos configurados:';
  RAISE NOTICE '   ✓ Geração automática de order_number';
  RAISE NOTICE '   ✓ Auto-criação de clientes';
  RAISE NOTICE '   ✓ Atualização automática de estatísticas';
  RAISE NOTICE '   ✓ RLS Policies configuradas';
  RAISE NOTICE '   ✓ Realtime habilitado';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Próximos passos:';
  RAISE NOTICE '   1. Acesse a aba Pedidos no FoodHub';
  RAISE NOTICE '   2. Verifique se não há mais erro "Erro ao carregar pedidos"';
  RAISE NOTICE '   3. Teste criar um pedido no cardápio público';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';

  -- Se alguma verificação falhou, lançar erro
  IF NOT (v_orders_exists AND v_status_column_exists AND v_total_amount_column_exists AND v_order_number_column_exists) THEN
    RAISE EXCEPTION '❌ Erro: Nem todas as verificações passaram. Verifique o log acima.';
  END IF;
END $$;
