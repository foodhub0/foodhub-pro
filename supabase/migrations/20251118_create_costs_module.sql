-- ============================================
-- COSTS MODULE - Complete Database Schema
-- ============================================
-- This migration creates all tables needed for the intelligent costs module
-- that adapts to different business types (pizzeria, burger, cafe, etc.)

-- ============================================
-- 1. RESTAURANT BUSINESS TYPE & SETTINGS
-- ============================================

-- Add business type and AI configuration to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS business_niche TEXT,
ADD COLUMN IF NOT EXISTS ai_configured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_config JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN restaurants.business_type IS 'Main business category: food_service, retail, etc.';
COMMENT ON COLUMN restaurants.business_niche IS 'Specific niche: pizzeria, hamburgueria, cafeteria, sorveteria, etc.';
COMMENT ON COLUMN restaurants.ai_configured IS 'Whether AI has configured this restaurant';
COMMENT ON COLUMN restaurants.ai_config IS 'AI-generated configuration including templates, categories, units, etc.';

-- ============================================
-- 2. INGREDIENT CATEGORIES (Categorias de Insumos)
-- ============================================

CREATE TABLE IF NOT EXISTS ingredient_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Icon identifier for UI
  color TEXT, -- Hex color for UI

  -- AI Generated
  is_ai_generated BOOLEAN DEFAULT false,
  ai_metadata JSONB DEFAULT '{}'::jsonb,

  -- Order for display
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(restaurant_id, name)
);

CREATE INDEX idx_ingredient_categories_restaurant ON ingredient_categories(restaurant_id);

COMMENT ON TABLE ingredient_categories IS 'Categories for ingredients/supplies (e.g., carnes, laticínios, embalagens)';

-- ============================================
-- 3. INGREDIENTS (Insumos)
-- ============================================

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES ingredient_categories(id) ON DELETE SET NULL,

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,

  -- Unit & Cost
  unit_type TEXT NOT NULL, -- g, kg, ml, L, un (unidade), cx (caixa), etc.
  cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  minimum_stock DECIMAL(10,2) DEFAULT 0,
  current_stock DECIMAL(10,2) DEFAULT 0,

  -- Supplier
  supplier_name TEXT,
  supplier_contact TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- AI Generated
  is_ai_generated BOOLEAN DEFAULT false,
  ai_metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ingredients_restaurant ON ingredients(restaurant_id);
CREATE INDEX idx_ingredients_category ON ingredients(category_id);
CREATE INDEX idx_ingredients_active ON ingredients(is_active);

COMMENT ON TABLE ingredients IS 'Raw materials and supplies used in production';

-- ============================================
-- 4. PRODUCT SIZES/UNITS (Tamanhos/Unidades)
-- ============================================
-- Note: We already have product_variations table, but we'll extend it
-- with additional metadata for different business types

ALTER TABLE product_variations
ADD COLUMN IF NOT EXISTS size_type TEXT, -- pizza_size, burger_weight, cup_size, portion_size, etc.
ADD COLUMN IF NOT EXISTS size_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;

COMMENT ON COLUMN product_variations.size_type IS 'Type of size variation based on business niche';
COMMENT ON COLUMN product_variations.size_metadata IS 'Additional metadata like weight, volume, multipliers';

-- ============================================
-- 5. RECIPE INGREDIENTS (Receitas - Liga Produtos com Insumos)
-- ============================================

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  -- Product reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_variation_id UUID REFERENCES product_variations(id) ON DELETE CASCADE,

  -- Ingredient reference
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,

  -- Quantity needed
  quantity DECIMAL(10,3) NOT NULL, -- Can be fractional (e.g., 0.5kg, 150g)
  unit TEXT NOT NULL, -- Should match ingredient.unit_type

  -- Cost calculation
  cost_per_serving DECIMAL(10,2), -- Auto-calculated

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(product_id, product_variation_id, ingredient_id)
);

CREATE INDEX idx_recipe_ingredients_product ON recipe_ingredients(product_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX idx_recipe_ingredients_restaurant ON recipe_ingredients(restaurant_id);

COMMENT ON TABLE recipe_ingredients IS 'Links products to ingredients with quantities (recipes)';

-- ============================================
-- 6. BEVERAGE CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS beverage_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,

  is_ai_generated BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(restaurant_id, name)
);

CREATE INDEX idx_beverage_categories_restaurant ON beverage_categories(restaurant_id);

-- ============================================
-- 7. BEVERAGES (Bebidas)
-- ============================================

CREATE TABLE IF NOT EXISTS beverages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES beverage_categories(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Pricing
  cost DECIMAL(10,2) DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,

  -- Size/Volume
  size TEXT, -- 350ml, 500ml, 1L, 2L, etc.
  volume_ml INTEGER,

  is_active BOOLEAN DEFAULT true,
  is_ai_generated BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_beverages_restaurant ON beverages(restaurant_id);
CREATE INDEX idx_beverages_category ON beverages(category_id);
CREATE INDEX idx_beverages_active ON beverages(is_active);

COMMENT ON TABLE beverages IS 'Beverages/drinks sold separately or in combos';

-- ============================================
-- 8. COMBOS
-- ============================================

CREATE TABLE IF NOT EXISTS combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Pricing
  total_cost DECIMAL(10,2) DEFAULT 0, -- Auto-calculated from items
  price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_ai_generated BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_combos_restaurant ON combos(restaurant_id);
CREATE INDEX idx_combos_active ON combos(is_active);

COMMENT ON TABLE combos IS 'Combo deals with multiple products/beverages/additionals';

-- ============================================
-- 9. COMBO ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,

  -- Item can be product, beverage, or additional
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'beverage', 'additional')),

  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_variation_id UUID REFERENCES product_variations(id) ON DELETE CASCADE,
  beverage_id UUID REFERENCES beverages(id) ON DELETE CASCADE,
  additional_id UUID REFERENCES additionals(id) ON DELETE CASCADE,

  quantity INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_combo_items_combo ON combo_items(combo_id);
CREATE INDEX idx_combo_items_product ON combo_items(product_id);
CREATE INDEX idx_combo_items_beverage ON combo_items(beverage_id);

COMMENT ON TABLE combo_items IS 'Items included in a combo';

-- ============================================
-- 10. FIXED COSTS (Custos Fixos)
-- ============================================

CREATE TABLE IF NOT EXISTS fixed_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- aluguel, salários, internet, energia, água, contador, etc.

  amount DECIMAL(10,2) NOT NULL,

  -- Recurring
  is_recurring BOOLEAN DEFAULT true,
  recurring_period TEXT DEFAULT 'monthly', -- daily, weekly, monthly, yearly

  -- Due dates
  due_day INTEGER, -- Day of month (1-31) for monthly costs
  next_due_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_ai_generated BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fixed_costs_restaurant ON fixed_costs(restaurant_id);
CREATE INDEX idx_fixed_costs_category ON fixed_costs(category);
CREATE INDEX idx_fixed_costs_active ON fixed_costs(is_active);

COMMENT ON TABLE fixed_costs IS 'Fixed/recurring costs like rent, salaries, utilities';

-- ============================================
-- 11. VARIABLE COSTS (Custos Variáveis)
-- ============================================

CREATE TABLE IF NOT EXISTS variable_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- embalagens, taxa_plataforma, gasolina, cartão, etc.

  amount DECIMAL(10,2) NOT NULL,
  cost_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Can be linked to orders or standalone
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- For percentage-based costs (e.g., credit card fees)
  is_percentage BOOLEAN DEFAULT false,
  percentage DECIMAL(5,2), -- e.g., 2.5% for card fees
  base_amount DECIMAL(10,2), -- Amount the percentage is calculated from

  is_ai_generated BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variable_costs_restaurant ON variable_costs(restaurant_id);
CREATE INDEX idx_variable_costs_category ON variable_costs(category);
CREATE INDEX idx_variable_costs_date ON variable_costs(cost_date);
CREATE INDEX idx_variable_costs_order ON variable_costs(order_id);

COMMENT ON TABLE variable_costs IS 'Variable/one-time costs like packaging, delivery fees, platform fees';

-- ============================================
-- 12. COST CALCULATOR SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS cost_calculator_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

  -- Margin targets
  target_margin_percentage DECIMAL(5,2) DEFAULT 60, -- Target profit margin
  minimum_margin_percentage DECIMAL(5,2) DEFAULT 40,

  -- Markup
  default_markup DECIMAL(5,2) DEFAULT 2.5, -- Default markup multiplier

  -- Cost allocation
  fixed_costs_allocation_method TEXT DEFAULT 'per_item', -- per_item, per_revenue, custom

  -- Settings
  include_fixed_costs_in_price BOOLEAN DEFAULT true,
  include_variable_costs_in_price BOOLEAN DEFAULT true,

  -- AI suggestions
  enable_ai_pricing BOOLEAN DEFAULT true,
  ai_pricing_strategy TEXT DEFAULT 'competitive', -- competitive, premium, budget

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(restaurant_id)
);

CREATE INDEX idx_cost_calculator_settings_restaurant ON cost_calculator_settings(restaurant_id);

COMMENT ON TABLE cost_calculator_settings IS 'Settings for price calculator and cost analysis';

-- ============================================
-- 13. AI TEMPLATES (for different business niches)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_business_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business type
  business_niche TEXT NOT NULL UNIQUE, -- pizzaria, hamburgueria, cafeteria, etc.
  display_name TEXT NOT NULL,
  description TEXT,

  -- Template data (JSON structure with all defaults)
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
  Structure:
  {
    "ingredient_categories": ["carnes", "queijos", "vegetais", ...],
    "size_types": [{"name": "Pequena", "alias": "P", "multiplier": 0.7}, ...],
    "common_products": [...],
    "beverage_categories": [...],
    "combo_templates": [...],
    "fixed_cost_categories": ["aluguel", "salários", ...],
    "variable_cost_categories": ["embalagens", "delivery", ...],
    "units": [{"type": "g", "display": "gramas"}, ...]
  }
  */

  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_templates_niche ON ai_business_templates(business_niche);
CREATE INDEX idx_ai_templates_active ON ai_business_templates(is_active);

COMMENT ON TABLE ai_business_templates IS 'AI templates for different business niches';

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE ingredient_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE beverage_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE beverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE variable_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_calculator_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_business_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Ingredient Categories
CREATE POLICY "Users can view their restaurant's ingredient categories"
  ON ingredient_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = ingredient_categories.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their restaurant's ingredient categories"
  ON ingredient_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = ingredient_categories.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Ingredients
CREATE POLICY "Users can view their restaurant's ingredients"
  ON ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = ingredients.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their restaurant's ingredients"
  ON ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = ingredients.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Recipe Ingredients
CREATE POLICY "Users can view their restaurant's recipes"
  ON recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = recipe_ingredients.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their restaurant's recipes"
  ON recipe_ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = recipe_ingredients.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Beverage Categories
CREATE POLICY "Users can view their restaurant's beverage categories"
  ON beverage_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = beverage_categories.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their restaurant's beverage categories"
  ON beverage_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = beverage_categories.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Beverages
CREATE POLICY "Users can view their restaurant's beverages"
  ON beverages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = beverages.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their restaurant's beverages"
  ON beverages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = beverages.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Combos
CREATE POLICY "Users can view their restaurant's combos"
  ON combos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = combos.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their restaurant's combos"
  ON combos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = combos.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Combo Items (inherit from combos)
CREATE POLICY "Users can view combo items"
  ON combo_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM combos
      JOIN restaurants ON restaurants.id = combos.restaurant_id
      WHERE combos.id = combo_items.combo_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage combo items"
  ON combo_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM combos
      JOIN restaurants ON restaurants.id = combos.restaurant_id
      WHERE combos.id = combo_items.combo_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Fixed Costs
CREATE POLICY "Users can view their restaurant's fixed costs"
  ON fixed_costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = fixed_costs.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their restaurant's fixed costs"
  ON fixed_costs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = fixed_costs.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Variable Costs
CREATE POLICY "Users can view their restaurant's variable costs"
  ON variable_costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = variable_costs.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their restaurant's variable costs"
  ON variable_costs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = variable_costs.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Cost Calculator Settings
CREATE POLICY "Users can view their restaurant's calculator settings"
  ON cost_calculator_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = cost_calculator_settings.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their restaurant's calculator settings"
  ON cost_calculator_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = cost_calculator_settings.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- AI Templates (Public read access)
CREATE POLICY "Anyone can view AI templates"
  ON ai_business_templates FOR SELECT
  USING (is_active = true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_ingredient_categories_updated_at BEFORE UPDATE ON ingredient_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_ingredients_updated_at BEFORE UPDATE ON recipe_ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beverages_updated_at BEFORE UPDATE ON beverages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_combos_updated_at BEFORE UPDATE ON combos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixed_costs_updated_at BEFORE UPDATE ON fixed_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variable_costs_updated_at BEFORE UPDATE ON variable_costs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED AI TEMPLATES
-- ============================================

INSERT INTO ai_business_templates (business_niche, display_name, description, template_data) VALUES
('pizzaria', 'Pizzaria', 'Template para pizzarias tradicionais e delivery', '{
  "ingredient_categories": ["Massas", "Molhos", "Queijos", "Carnes", "Vegetais", "Temperos", "Embalagens"],
  "size_types": [
    {"name": "Broto", "alias": "B", "multiplier": 0.5, "slices": 4},
    {"name": "Pequena", "alias": "P", "multiplier": 0.7, "slices": 6},
    {"name": "Média", "alias": "M", "multiplier": 1.0, "slices": 8},
    {"name": "Grande", "alias": "G", "multiplier": 1.3, "slices": 10},
    {"name": "Gigante", "alias": "GG", "multiplier": 1.6, "slices": 12}
  ],
  "common_products": ["Pizza Margherita", "Pizza Calabresa", "Pizza Portuguesa", "Pizza 4 Queijos", "Pizza Frango"],
  "beverage_categories": ["Refrigerantes", "Cervejas", "Sucos", "Águas"],
  "combo_templates": ["Pizza + Refrigerante", "2 Pizzas + Refrigerante 2L"],
  "fixed_cost_categories": ["Aluguel", "Salários", "Energia", "Gás", "Água", "Internet", "Contador"],
  "variable_cost_categories": ["Embalagens", "Taxa Delivery", "Gasolina Motoboy", "Taxa Cartão"],
  "units": [
    {"type": "g", "display": "Gramas"},
    {"type": "kg", "display": "Quilogramas"},
    {"type": "ml", "display": "Mililitros"},
    {"type": "L", "display": "Litros"},
    {"type": "un", "display": "Unidade"}
  ]
}'::jsonb),

('hamburgueria', 'Hamburgueria', 'Template para hamburguerias e fast food', '{
  "ingredient_categories": ["Carnes/Blends", "Pães", "Queijos", "Vegetais", "Molhos", "Batatas", "Embalagens"],
  "size_types": [
    {"name": "120g", "weight": 120, "multiplier": 0.8},
    {"name": "180g", "weight": 180, "multiplier": 1.0},
    {"name": "240g", "weight": 240, "multiplier": 1.3},
    {"name": "360g", "weight": 360, "multiplier": 2.0}
  ],
  "common_products": ["Hambúrguer Clássico", "Cheeseburger", "Bacon Burger", "Veggie Burger"],
  "beverage_categories": ["Refrigerantes", "Sucos", "Milkshakes", "Cervejas"],
  "combo_templates": ["Burger + Batata + Refrigerante", "2 Burgers + Batata Grande + 2 Refrigerantes"],
  "fixed_cost_categories": ["Aluguel", "Salários", "Energia", "Gás", "Água", "Internet"],
  "variable_cost_categories": ["Embalagens", "Taxa Delivery", "Taxa iFood/Rappi", "Taxa Cartão"],
  "units": [
    {"type": "g", "display": "Gramas"},
    {"type": "kg", "display": "Quilogramas"},
    {"type": "ml", "display": "Mililitros"},
    {"type": "un", "display": "Unidade"}
  ]
}'::jsonb),

('cafeteria', 'Cafeteria', 'Template para cafeterias e coffee shops', '{
  "ingredient_categories": ["Cafés", "Leites", "Açúcares", "Xaropes", "Pós", "Copos/Embalagens"],
  "size_types": [
    {"name": "Pequeno", "volume_ml": 240, "multiplier": 0.7},
    {"name": "Médio", "volume_ml": 350, "multiplier": 1.0},
    {"name": "Grande", "volume_ml": 480, "multiplier": 1.3}
  ],
  "common_products": ["Espresso", "Cappuccino", "Latte", "Mocha", "Café Americano"],
  "beverage_categories": ["Cafés Quentes", "Cafés Gelados", "Chás", "Sucos"],
  "combo_templates": ["Café + Pão de Queijo", "Café + Brownie"],
  "fixed_cost_categories": ["Aluguel", "Salários", "Energia", "Água", "Internet", "Equipamentos"],
  "variable_cost_categories": ["Copos", "Tampas", "Canudos", "Taxa Cartão"],
  "units": [
    {"type": "g", "display": "Gramas"},
    {"type": "kg", "display": "Quilogramas"},
    {"type": "ml", "display": "Mililitros"},
    {"type": "L", "display": "Litros"},
    {"type": "un", "display": "Unidade"}
  ]
}'::jsonb),

('sorveteria', 'Sorveteria / Açaiteria', 'Template para sorveterias e açaiterias', '{
  "ingredient_categories": ["Sorvetes/Açaí Base", "Frutas", "Granolas", "Caldas", "Complementos", "Embalagens"],
  "size_types": [
    {"name": "300ml", "volume_ml": 300, "multiplier": 0.7},
    {"name": "500ml", "volume_ml": 500, "multiplier": 1.0},
    {"name": "700ml", "volume_ml": 700, "multiplier": 1.4},
    {"name": "1L", "volume_ml": 1000, "multiplier": 2.0}
  ],
  "common_products": ["Açaí", "Sorvete", "Picolé", "Milkshake"],
  "beverage_categories": ["Sucos", "Águas", "Refrigerantes"],
  "combo_templates": ["Açaí + Suco"],
  "fixed_cost_categories": ["Aluguel", "Salários", "Energia", "Água", "Freezers/Equipamentos"],
  "variable_cost_categories": ["Copos", "Colheres", "Embalagens", "Taxa Delivery"],
  "units": [
    {"type": "g", "display": "Gramas"},
    {"type": "kg", "display": "Quilogramas"},
    {"type": "ml", "display": "Mililitros"},
    {"type": "L", "display": "Litros"},
    {"type": "un", "display": "Unidade"}
  ]
}'::jsonb),

('restaurante', 'Restaurante / Marmitaria', 'Template para restaurantes e marmitarias', '{
  "ingredient_categories": ["Carnes", "Grãos", "Vegetais", "Temperos", "Óleos", "Embalagens"],
  "size_types": [
    {"name": "Pequena", "weight": 300, "multiplier": 0.7},
    {"name": "Média", "weight": 500, "multiplier": 1.0},
    {"name": "Grande", "weight": 800, "multiplier": 1.4}
  ],
  "common_products": ["Marmita Executiva", "Prato Feito", "À la Carte"],
  "beverage_categories": ["Refrigerantes", "Sucos", "Águas"],
  "combo_templates": ["Marmita + Refrigerante", "PF + Suco"],
  "fixed_cost_categories": ["Aluguel", "Salários", "Energia", "Gás", "Água", "Equipamentos"],
  "variable_cost_categories": ["Marmitas", "Talheres", "Taxa Delivery", "Taxa iFood"],
  "units": [
    {"type": "g", "display": "Gramas"},
    {"type": "kg", "display": "Quilogramas"},
    {"type": "ml", "display": "Mililitros"},
    {"type": "L", "display": "Litros"},
    {"type": "un", "display": "Unidade"}
  ]
}'::jsonb);
