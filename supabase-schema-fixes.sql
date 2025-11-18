-- ============================================================================
-- FOOD HUB - SQL COMPLETO PARA CONEXÃO DE PEDIDOS E CLIENTES
-- ============================================================================
-- Este script corrige a estrutura do banco de dados para conectar
-- corretamente pedidos, clientes e restaurantes
-- ============================================================================

-- 1. ADICIONAR COLUNA restaurant_id À TABELA customers
-- ----------------------------------------------------------------------------
-- Clientes devem pertencer a restaurantes, não a usuários autenticados
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS restaurant_id uuid;

-- Adicionar foreign key para restaurants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'customers_restaurant_id_fkey'
    ) THEN
        ALTER TABLE public.customers
        ADD CONSTRAINT customers_restaurant_id_fkey
        FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. TORNAR user_id NULLABLE (clientes não precisam ser usuários autenticados)
-- ----------------------------------------------------------------------------
ALTER TABLE public.customers
ALTER COLUMN user_id DROP NOT NULL;

-- 3. MIGRAR DADOS EXISTENTES
-- ----------------------------------------------------------------------------
-- Associar clientes existentes aos restaurantes baseado nos pedidos
UPDATE public.customers c
SET restaurant_id = o.restaurant_id
FROM public.orders o
WHERE c.id = o.customer_id
  AND c.restaurant_id IS NULL
  AND o.restaurant_id IS NOT NULL;

-- 4. TORNAR restaurant_id OBRIGATÓRIO APÓS MIGRAÇÃO
-- ----------------------------------------------------------------------------
-- Agora que migramos os dados, restaurant_id deve ser obrigatório
DO $$
BEGIN
    -- Verificar se ainda existem clientes sem restaurant_id
    IF NOT EXISTS (SELECT 1 FROM public.customers WHERE restaurant_id IS NULL) THEN
        ALTER TABLE public.customers ALTER COLUMN restaurant_id SET NOT NULL;
    ELSE
        RAISE NOTICE 'ATENÇÃO: Ainda existem clientes sem restaurant_id. Corrija antes de tornar a coluna NOT NULL.';
    END IF;
END $$;

-- 5. ADICIONAR ÍNDICES PARA PERFORMANCE
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id
ON public.customers(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_customers_phone
ON public.customers(phone);

CREATE INDEX IF NOT EXISTS idx_customers_last_order
ON public.customers(last_order_at DESC);

-- 6. ADICIONAR CONSTRAINT ÚNICA (restaurante + telefone)
-- ----------------------------------------------------------------------------
-- Evitar clientes duplicados no mesmo restaurante
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'customers_restaurant_phone_unique'
    ) THEN
        ALTER TABLE public.customers
        ADD CONSTRAINT customers_restaurant_phone_unique
        UNIQUE (restaurant_id, phone);
    END IF;
END $$;

-- 7. ADICIONAR delivery_zones À TABELA restaurants
-- ----------------------------------------------------------------------------
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS delivery_zones jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.restaurants.delivery_zones IS
'Array de zonas de entrega com raio e taxa: [{"id": "1", "radius": 3, "fee": 5.00}]';

-- 8. ADICIONAR delivery_mode À TABELA restaurants
-- ----------------------------------------------------------------------------
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS delivery_mode text DEFAULT 'fixed' CHECK (delivery_mode IN ('fixed', 'zones'));

COMMENT ON COLUMN public.restaurants.delivery_mode IS
'Modo de cálculo de taxa de entrega: fixed (taxa fixa) ou zones (por raio)';

-- 9. ADICIONAR COLUNAS DE ENDEREÇO FALTANTES EM customers (se necessário)
-- ----------------------------------------------------------------------------
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS addresses jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.customers.addresses IS
'Endereços do cliente: [{"street": "Rua X", "number": "123", "neighborhood": "Bairro", "city": "Cidade", "state": "UF", "zipcode": "12345-678", "complement": ""}]';

-- 10. FUNÇÃO PARA ATUALIZAR ESTATÍSTICAS DO CLIENTE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar estatísticas quando um pedido é criado ou atualizado
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.customer_id IS NOT NULL THEN
        UPDATE public.customers
        SET
            total_orders = (
                SELECT COUNT(*)
                FROM public.orders
                WHERE customer_id = NEW.customer_id
                  AND status NOT IN ('cancelled')
            ),
            total_spent = (
                SELECT COALESCE(SUM(total_amount), 0)
                FROM public.orders
                WHERE customer_id = NEW.customer_id
                  AND status = 'delivered'
            ),
            last_order_at = (
                SELECT MAX(created_at)
                FROM public.orders
                WHERE customer_id = NEW.customer_id
            )
        WHERE id = NEW.customer_id;

        -- Calcular ticket médio
        UPDATE public.customers
        SET average_ticket = CASE
            WHEN total_orders > 0 THEN total_spent / total_orders
            ELSE 0
        END
        WHERE id = NEW.customer_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. CRIAR TRIGGER PARA ATUALIZAR STATS AUTOMATICAMENTE
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON public.orders;

CREATE TRIGGER trigger_update_customer_stats
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

-- 12. FUNÇÃO PARA AUTO-CRIAR CLIENTE SE NÃO EXISTIR
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_create_customer()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_id uuid;
BEGIN
    -- Se já tem customer_id, não fazer nada
    IF NEW.customer_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Verificar se já existe cliente com este telefone no restaurante
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE restaurant_id = NEW.restaurant_id
      AND phone = NEW.customer_phone
    LIMIT 1;

    -- Se não existe, criar novo cliente
    IF v_customer_id IS NULL THEN
        INSERT INTO public.customers (
            restaurant_id,
            name,
            phone,
            total_orders,
            total_spent,
            average_ticket
        ) VALUES (
            NEW.restaurant_id,
            NEW.customer_name,
            NEW.customer_phone,
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

-- 13. CRIAR TRIGGER PARA AUTO-CRIAR CLIENTE
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_auto_create_customer ON public.orders;

CREATE TRIGGER trigger_auto_create_customer
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_customer();

-- 14. ATUALIZAR RLS POLICIES PARA customers
-- ----------------------------------------------------------------------------
-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Users can view their own customer records" ON public.customers;
DROP POLICY IF EXISTS "Users can create their own customer records" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customer records" ON public.customers;

-- Habilitar RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurantes podem ver seus próprios clientes
CREATE POLICY "Restaurants can view their customers"
ON public.customers
FOR SELECT
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurantes podem inserir clientes
CREATE POLICY "Restaurants can insert customers"
ON public.customers
FOR INSERT
WITH CHECK (
    restaurant_id IN (
        SELECT id FROM public.restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurantes podem atualizar seus clientes
CREATE POLICY "Restaurants can update their customers"
ON public.customers
FOR UPDATE
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurantes podem deletar seus clientes
CREATE POLICY "Restaurants can delete their customers"
ON public.customers
FOR DELETE
USING (
    restaurant_id IN (
        SELECT id FROM public.restaurants
        WHERE owner_id = auth.uid()
    )
);

-- 15. CRIAR VIEW PARA ESTATÍSTICAS DE CLIENTES
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW customer_stats AS
SELECT
    c.id,
    c.restaurant_id,
    c.name,
    c.phone,
    c.email,
    c.total_orders,
    c.total_spent,
    c.average_ticket,
    c.last_order_at,
    c.created_at,
    -- Classificação do cliente
    CASE
        WHEN c.total_orders >= 10 THEN 'VIP'
        WHEN c.total_orders >= 5 THEN 'Frequente'
        WHEN c.total_orders >= 2 THEN 'Regular'
        ELSE 'Novo'
    END as customer_tier,
    -- Dias desde último pedido
    EXTRACT(DAY FROM NOW() - c.last_order_at) as days_since_last_order,
    -- Status (ativo se pediu nos últimos 30 dias)
    CASE
        WHEN c.last_order_at >= NOW() - INTERVAL '30 days' THEN 'Ativo'
        WHEN c.last_order_at >= NOW() - INTERVAL '90 days' THEN 'Inativo'
        ELSE 'Perdido'
    END as customer_status
FROM public.customers c;

-- 16. CORRIGIR DADOS EXISTENTES DOS CLIENTES (RECALCULAR STATS)
-- ----------------------------------------------------------------------------
-- Atualizar todos os clientes com dados corretos dos pedidos
UPDATE public.customers c
SET
    total_orders = (
        SELECT COUNT(*)
        FROM public.orders o
        WHERE o.customer_id = c.id
          AND o.status NOT IN ('cancelled')
    ),
    total_spent = (
        SELECT COALESCE(SUM(o.total_amount), 0)
        FROM public.orders o
        WHERE o.customer_id = c.id
          AND o.status = 'delivered'
    ),
    last_order_at = (
        SELECT MAX(o.created_at)
        FROM public.orders o
        WHERE o.customer_id = c.id
    );

-- Calcular ticket médio
UPDATE public.customers
SET average_ticket = CASE
    WHEN total_orders > 0 THEN total_spent / total_orders
    ELSE 0
END;

-- 17. CRIAR ÍNDICE PARA BUSCA DE CLIENTES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_customers_search
ON public.customers USING gin(to_tsvector('portuguese', name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, '')));

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Verificações finais
DO $$
DECLARE
    v_customers_without_restaurant integer;
    v_orders_without_customer integer;
BEGIN
    -- Contar clientes sem restaurante
    SELECT COUNT(*) INTO v_customers_without_restaurant
    FROM public.customers
    WHERE restaurant_id IS NULL;

    -- Contar pedidos sem cliente
    SELECT COUNT(*) INTO v_orders_without_customer
    FROM public.orders
    WHERE customer_id IS NULL;

    -- Exibir resultados
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'VERIFICAÇÃO FINAL DA MIGRAÇÃO';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Clientes sem restaurant_id: %', v_customers_without_restaurant;
    RAISE NOTICE 'Pedidos sem customer_id: %', v_orders_without_customer;

    IF v_customers_without_restaurant = 0 AND v_orders_without_customer = 0 THEN
        RAISE NOTICE 'STATUS: ✓ Migração concluída com sucesso!';
    ELSE
        RAISE NOTICE 'STATUS: ⚠ Existem registros que precisam de atenção';
    END IF;
    RAISE NOTICE '============================================================================';
END $$;
