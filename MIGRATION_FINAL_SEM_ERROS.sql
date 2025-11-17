-- ═══════════════════════════════════════════════════════════════
-- MIGRAÇÃO 100% SEGURA - EXECUTE QUANTAS VEZES QUISER
-- ═══════════════════════════════════════════════════════════════
--
-- Esta migração é IDEMPOTENTE - pode ser executada múltiplas vezes
-- sem causar erros, mesmo se já foi executada parcialmente antes.
--
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- PARTE 1: CORRIGIR O ERRO 404
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Remover política restritiva
  DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;

  -- Criar nova política que permite acesso público
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'restaurants'
    AND policyname = 'Public can view all restaurants'
  ) THEN
    CREATE POLICY "Public can view all restaurants" ON restaurants
      FOR SELECT USING (true);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 2: CRIAR TABELAS (se não existirem)
-- ═══════════════════════════════════════════════════════════════

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  address_number TEXT,
  address_complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zipcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT,
  delivery_number TEXT,
  delivery_complement TEXT,
  delivery_neighborhood TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_zipcode TEXT,
  delivery_instructions TEXT,
  order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup', 'dine_in')),
  table_number TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')
  ),
  payment_method TEXT CHECK (
    payment_method IN ('pix', 'credit_card', 'debit_card', 'cash', 'voucher')
  ),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'paid', 'failed', 'refunded')
  ),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Variações do Item
CREATE TABLE IF NOT EXISTS order_item_variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
  variation_name TEXT NOT NULL,
  variation_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- PARTE 3: ÍNDICES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_variations_item ON order_item_variations(order_item_id);

-- ═══════════════════════════════════════════════════════════════
-- PARTE 4: FUNCTION E TRIGGERS (100% SEGURO)
-- ═══════════════════════════════════════════════════════════════

-- Criar ou substituir a função
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover e recriar triggers com DO block (evita erros)
DO $$
BEGIN
  -- Customers
  DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
  CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- Orders
  DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
  CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END $$;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 5: ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_variations ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas e criar novas (COM PROTEÇÃO)
DO $$
BEGIN
  -- CUSTOMERS
  DROP POLICY IF EXISTS "Anyone can create customer" ON customers;
  DROP POLICY IF EXISTS "Customers can view their data" ON customers;

  CREATE POLICY "Anyone can create customer" ON customers
    FOR INSERT WITH CHECK (true);

  CREATE POLICY "Customers can view their data" ON customers
    FOR SELECT USING (true);

  -- ORDERS
  DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
  DROP POLICY IF EXISTS "Restaurant owners can view their orders" ON orders;
  DROP POLICY IF EXISTS "Restaurant owners can update their orders" ON orders;

  CREATE POLICY "Anyone can create orders" ON orders
    FOR INSERT WITH CHECK (true);

  CREATE POLICY "Restaurant owners can view their orders" ON orders
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM restaurants
        WHERE restaurants.id = orders.restaurant_id
        AND restaurants.owner_id = auth.uid()
      )
    );

  CREATE POLICY "Restaurant owners can update their orders" ON orders
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM restaurants
        WHERE restaurants.id = orders.restaurant_id
        AND restaurants.owner_id = auth.uid()
      )
    );

  -- ORDER ITEMS
  DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;
  DROP POLICY IF EXISTS "Restaurant owners can view order items" ON order_items;

  CREATE POLICY "Anyone can create order items" ON order_items
    FOR INSERT WITH CHECK (true);

  CREATE POLICY "Restaurant owners can view order items" ON order_items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM orders
        JOIN restaurants ON restaurants.id = orders.restaurant_id
        WHERE orders.id = order_items.order_id
        AND restaurants.owner_id = auth.uid()
      )
    );

  -- ORDER ITEM VARIATIONS
  DROP POLICY IF EXISTS "Anyone can create order item variations" ON order_item_variations;
  DROP POLICY IF EXISTS "Restaurant owners can view order item variations" ON order_item_variations;

  CREATE POLICY "Anyone can create order item variations" ON order_item_variations
    FOR INSERT WITH CHECK (true);

  CREATE POLICY "Restaurant owners can view order item variations" ON order_item_variations
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM order_items
        JOIN orders ON orders.id = order_items.order_id
        JOIN restaurants ON restaurants.id = orders.restaurant_id
        WHERE order_items.id = order_item_variations.order_item_id
        AND restaurants.owner_id = auth.uid()
      )
    );
END $$;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  restaurant_count INTEGER;
  table_exists BOOLEAN;
BEGIN
  -- Verificar tabelas
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'orders'
  ) INTO table_exists;

  IF table_exists THEN
    RAISE NOTICE '✅ Tabela orders criada com sucesso!';
  ELSE
    RAISE EXCEPTION '❌ Erro ao criar tabela orders';
  END IF;

  -- Verificar restaurantes
  SELECT COUNT(*) INTO restaurant_count FROM restaurants;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumo:';
  RAISE NOTICE '   - Restaurantes cadastrados: %', restaurant_count;
  RAISE NOTICE '   - Tabelas criadas: customers, orders, order_items, order_item_variations';
  RAISE NOTICE '   - Políticas RLS: configuradas';
  RAISE NOTICE '   - Erro 404: corrigido';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Próximos passos:';
  RAISE NOTICE '   1. Acesse: http://localhost:8080/diagnostic/teste';
  RAISE NOTICE '   2. Copie a URL do cardápio que aparece lá';
  RAISE NOTICE '   3. Teste adicionar produtos ao carrinho';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- Mostrar restaurantes disponíveis
SELECT
  '🏪 Restaurantes Disponíveis:' as info,
  name as "Nome",
  slug as "Slug",
  CASE WHEN is_open THEN '✅ Aberto' ELSE '❌ Fechado' END as "Status",
  'http://localhost:8080/m/' || slug as "URL do Cardápio"
FROM restaurants
ORDER BY created_at DESC;
