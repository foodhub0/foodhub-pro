-- Migration: Reestruturar Sistema de Produtos
-- Data: 2025-11-19
-- Descrição: Implementar estrutura de produtos com grupos de adicionais organizados

-- ============================================================================
-- PASSO 1: CRIAR NOVAS TABELAS
-- ============================================================================

-- 1.1 Tamanhos de Produtos (substitui product_variations)
CREATE TABLE IF NOT EXISTS product_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- P, M, G, 300ml, 500ml, etc
  price DECIMAL(10,2) NOT NULL, -- Preço absoluto, não modifier
  display_order INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 Grupos de Adicionais
CREATE TABLE IF NOT EXISTS product_addon_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- Sabores, Borda, Extras, Ponto da Carne, etc
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 Itens dentro dos Grupos
CREATE TABLE IF NOT EXISTS addon_group_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  addon_group_id UUID REFERENCES product_addon_groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- Mussarela, Calabresa, Catupiry, etc
  price DECIMAL(10,2) NOT NULL DEFAULT 0, -- Preço adicional
  display_order INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.4 Vínculo Produto <-> Grupo de Adicionais (com configurações)
CREATE TABLE IF NOT EXISTS product_addon_group_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  addon_group_id UUID REFERENCES product_addon_groups(id) ON DELETE CASCADE NOT NULL,
  is_required BOOLEAN DEFAULT false, -- Obrigatório selecionar ao menos min_quantity
  min_quantity INTEGER DEFAULT 0, -- Quantidade mínima a selecionar
  max_quantity INTEGER, -- Quantidade máxima (NULL = ilimitado)
  allow_multiple BOOLEAN DEFAULT true, -- Permite seleções múltiplas
  display_order INTEGER DEFAULT 0, -- Ordem de exibição no produto
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, addon_group_id)
);

-- ============================================================================
-- PASSO 2: ADICIONAR CAMPO AO PRODUCTS
-- ============================================================================

-- Indica se produto tem tamanhos (sizes) ou preço único
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_sizes BOOLEAN DEFAULT false;

-- ============================================================================
-- PASSO 3: MIGRAR DADOS EXISTENTES
-- ============================================================================

-- 3.1 Migrar product_variations para product_sizes (se a tabela existir)
-- Converter price_modifier para preço absoluto (base_price + price_modifier)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_variations') THEN
    INSERT INTO product_sizes (product_id, name, price, display_order, created_at)
    SELECT
      pv.product_id,
      pv.name,
      p.base_price + pv.price_modifier AS price, -- Preço absoluto
      pv.display_order,
      pv.created_at
    FROM product_variations pv
    JOIN products p ON p.id = pv.product_id
    WHERE NOT EXISTS (
      SELECT 1 FROM product_sizes ps WHERE ps.product_id = pv.product_id AND ps.name = pv.name
    );
  END IF;
END $$;

-- Marcar produtos que têm tamanhos
UPDATE products SET has_sizes = true
WHERE id IN (SELECT DISTINCT product_id FROM product_sizes);

-- 3.2 Criar grupo padrão "Adicionais Gerais" por restaurante
-- (para migrar additionals existentes, se a tabela existir)
DO $$
DECLARE
  r RECORD;
  group_id UUID;
  additionals_exists BOOLEAN;
  product_additionals_exists BOOLEAN;
BEGIN
  -- Verificar se as tabelas existem
  SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'additionals') INTO additionals_exists;
  SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_additionals') INTO product_additionals_exists;

  IF additionals_exists THEN
    FOR r IN SELECT DISTINCT restaurant_id FROM additionals LOOP
      -- Criar grupo "Adicionais Gerais"
      INSERT INTO product_addon_groups (restaurant_id, name, description, is_active)
      VALUES (
        r.restaurant_id,
        'Adicionais Gerais',
        'Adicionais migrados do sistema anterior',
        true
      )
      RETURNING id INTO group_id;

      -- Migrar additionals para addon_group_items
      INSERT INTO addon_group_items (addon_group_id, name, price, display_order)
      SELECT
        group_id,
        a.name,
        a.price,
        ROW_NUMBER() OVER (ORDER BY a.created_at) - 1
      FROM additionals a
      WHERE a.restaurant_id = r.restaurant_id;

      -- Criar vínculos produto <-> grupo para produtos que usavam esses additionals
      IF product_additionals_exists THEN
        INSERT INTO product_addon_group_links (
          product_id,
          addon_group_id,
          is_required,
          max_quantity,
          display_order
        )
        SELECT DISTINCT
          pa.product_id,
          group_id,
          pa.is_required,
          pa.max_quantity,
          0
        FROM product_additionals pa
        JOIN additionals a ON a.id = pa.additional_id
        WHERE a.restaurant_id = r.restaurant_id;
      END IF;
    END LOOP;
  END IF;
END $$;

-- ============================================================================
-- PASSO 4: RENOMEAR TABELAS ANTIGAS (backup)
-- ============================================================================

-- Renomear para _old (manter por segurança)
ALTER TABLE IF EXISTS product_variations RENAME TO product_variations_old;
ALTER TABLE IF EXISTS additionals RENAME TO additionals_old;
ALTER TABLE IF EXISTS product_additionals RENAME TO product_additionals_old;

-- ============================================================================
-- PASSO 5: HABILITAR ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_group_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addon_group_links ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASSO 6: CRIAR POLÍTICAS RLS
-- ============================================================================

-- 6.1 Product Sizes
-- Owners podem gerenciar tamanhos de seus produtos
CREATE POLICY "Owners can manage product sizes" ON product_sizes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.id = product_sizes.product_id
      AND r.owner_id = auth.uid()
    )
  );

-- Público pode ver tamanhos disponíveis
CREATE POLICY "Public can view available sizes" ON product_sizes
  FOR SELECT USING (is_available = true);

-- 6.2 Product Addon Groups
-- Owners podem gerenciar grupos de adicionais de seus restaurantes
CREATE POLICY "Owners can manage addon groups" ON product_addon_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = product_addon_groups.restaurant_id
      AND r.owner_id = auth.uid()
    )
  );

-- Público pode ver grupos ativos
CREATE POLICY "Public can view active addon groups" ON product_addon_groups
  FOR SELECT USING (is_active = true);

-- 6.3 Addon Group Items
-- Owners podem gerenciar itens de grupos de seus restaurantes
CREATE POLICY "Owners can manage addon items" ON addon_group_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM product_addon_groups g
      JOIN restaurants r ON r.id = g.restaurant_id
      WHERE g.id = addon_group_items.addon_group_id
      AND r.owner_id = auth.uid()
    )
  );

-- Público pode ver itens disponíveis
CREATE POLICY "Public can view available addon items" ON addon_group_items
  FOR SELECT USING (is_available = true);

-- 6.4 Product Addon Group Links
-- Owners podem gerenciar vínculos de seus produtos
CREATE POLICY "Owners can manage product addon links" ON product_addon_group_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.id = product_addon_group_links.product_id
      AND r.owner_id = auth.uid()
    )
  );

-- Público pode ver vínculos
CREATE POLICY "Public can view product addon links" ON product_addon_group_links
  FOR SELECT USING (true);

-- ============================================================================
-- PASSO 7: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_sizes_product ON product_sizes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sizes_available ON product_sizes(is_available);

CREATE INDEX IF NOT EXISTS idx_addon_groups_restaurant ON product_addon_groups(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_addon_groups_active ON product_addon_groups(is_active);

CREATE INDEX IF NOT EXISTS idx_addon_items_group ON addon_group_items(addon_group_id);
CREATE INDEX IF NOT EXISTS idx_addon_items_available ON addon_group_items(is_available);

CREATE INDEX IF NOT EXISTS idx_addon_links_product ON product_addon_group_links(product_id);
CREATE INDEX IF NOT EXISTS idx_addon_links_group ON product_addon_group_links(addon_group_id);
CREATE INDEX IF NOT EXISTS idx_addon_links_order ON product_addon_group_links(product_id, display_order);

-- ============================================================================
-- PASSO 8: CRIAR TRIGGERS PARA UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_product_sizes_updated_at
  BEFORE UPDATE ON product_sizes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addon_groups_updated_at
  BEFORE UPDATE ON product_addon_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addon_items_updated_at
  BEFORE UPDATE ON addon_group_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addon_links_updated_at
  BEFORE UPDATE ON product_addon_group_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PASSO 9: CRIAR VIEWS ÚTEIS
-- ============================================================================

-- View: Produtos com seus tamanhos
CREATE OR REPLACE VIEW products_with_sizes AS
SELECT
  p.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', ps.id,
        'name', ps.name,
        'price', ps.price,
        'display_order', ps.display_order,
        'is_available', ps.is_available
      ) ORDER BY ps.display_order
    ) FILTER (WHERE ps.id IS NOT NULL),
    '[]'
  ) AS sizes
FROM products p
LEFT JOIN product_sizes ps ON ps.product_id = p.id
GROUP BY p.id;

-- View: Produtos com seus grupos de adicionais
CREATE OR REPLACE VIEW products_with_addon_groups AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  COALESCE(
    json_agg(
      json_build_object(
        'group_id', g.id,
        'group_name', g.name,
        'group_description', g.description,
        'is_required', l.is_required,
        'min_quantity', l.min_quantity,
        'max_quantity', l.max_quantity,
        'allow_multiple', l.allow_multiple,
        'display_order', l.display_order,
        'items', (
          SELECT json_agg(
            json_build_object(
              'id', i.id,
              'name', i.name,
              'price', i.price,
              'display_order', i.display_order,
              'is_available', i.is_available
            ) ORDER BY i.display_order
          )
          FROM addon_group_items i
          WHERE i.addon_group_id = g.id
          AND i.is_available = true
        )
      ) ORDER BY l.display_order
    ) FILTER (WHERE g.id IS NOT NULL),
    '[]'
  ) AS addon_groups
FROM products p
LEFT JOIN product_addon_group_links l ON l.product_id = p.id
LEFT JOIN product_addon_groups g ON g.id = l.addon_group_id
WHERE p.is_active = true
GROUP BY p.id, p.name;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE product_sizes IS 'Tamanhos disponíveis para produtos (P, M, G, etc)';
COMMENT ON TABLE product_addon_groups IS 'Grupos de adicionais (Sabores, Borda, Extras, etc)';
COMMENT ON TABLE addon_group_items IS 'Itens dentro de cada grupo de adicionais';
COMMENT ON TABLE product_addon_group_links IS 'Vincula produtos aos grupos de adicionais com configurações';

COMMENT ON COLUMN product_addon_group_links.is_required IS 'Cliente deve selecionar pelo menos min_quantity itens';
COMMENT ON COLUMN product_addon_group_links.min_quantity IS 'Quantidade mínima de itens a selecionar';
COMMENT ON COLUMN product_addon_group_links.max_quantity IS 'Quantidade máxima de itens (NULL = ilimitado)';
COMMENT ON COLUMN product_addon_group_links.allow_multiple IS 'Permite selecionar múltiplos itens do grupo';
COMMENT ON COLUMN product_addon_group_links.display_order IS 'Ordem de exibição do grupo no produto';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
