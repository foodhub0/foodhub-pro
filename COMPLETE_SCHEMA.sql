-- ============================================
-- FOODHUB PRO - COMPLETE DATABASE SCHEMA
-- ============================================
-- Execute this file in your Supabase SQL editor
-- This is a clean, complete schema for the entire FoodHub system

-- ============================================
-- 1. EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- 2. ENUM TYPES
-- ============================================

-- Drop existing types if they exist (to avoid conflicts)
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS order_type CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS courier_status CASCADE;

-- Create enum types
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

CREATE TYPE order_type AS ENUM (
  'delivery',
  'table',
  'takeout'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'refunded',
  'failed'
);

CREATE TYPE courier_status AS ENUM (
  'available',
  'busy',
  'offline'
);

-- ============================================
-- 3. CORE TABLES
-- ============================================

-- ----------------------
-- 3.1 RESTAURANTS
-- ----------------------
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Contact
  phone TEXT,
  email TEXT,

  -- Branding
  logo_url TEXT,
  cover_url TEXT,

  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Delivery Settings
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  delivery_radius INTEGER DEFAULT 5,
  delivery_time_estimate INTEGER DEFAULT 30,
  pickup_time_estimate INTEGER DEFAULT 20,

  -- Operating Modes
  allows_takeout BOOLEAN DEFAULT true,
  allows_delivery BOOLEAN DEFAULT true,
  allows_table BOOLEAN DEFAULT true,
  is_open BOOLEAN DEFAULT true,
  opening_hours JSONB,

  -- Webhook for printer
  webhook_url TEXT,
  webhook_secret TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- 3.2 CATEGORIES
-- ----------------------
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- 3.3 PRODUCTS
-- ----------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Stock Management
  manage_stock BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,

  -- Preparation
  preparation_time INTEGER DEFAULT 15,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- 3.4 PRODUCT VARIATIONS
-- ----------------------
CREATE TABLE IF NOT EXISTS product_variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  price_modifier DECIMAL(10,2) DEFAULT 0,
  display_order INTEGER DEFAULT 0,

  -- For costs module
  size_type TEXT,
  size_metadata JSONB DEFAULT '{}'::jsonb,
  is_ai_generated BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- 3.5 ADDITIONALS (EXTRAS)
-- ----------------------
CREATE TABLE IF NOT EXISTS additionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- 3.6 PRODUCT ADDITIONALS (MANY-TO-MANY)
-- ----------------------
CREATE TABLE IF NOT EXISTS product_additionals (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  additional_id UUID REFERENCES additionals(id) ON DELETE CASCADE,

  is_required BOOLEAN DEFAULT false,
  max_quantity INTEGER DEFAULT 1,

  PRIMARY KEY (product_id, additional_id)
);

-- ----------------------
-- 3.7 TABLES
-- ----------------------
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,

  table_number TEXT NOT NULL,
  qr_code TEXT,
  capacity INTEGER DEFAULT 4,
  is_available BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(restaurant_id, table_number)
);

-- ----------------------
-- 3.8 CUSTOMERS
-- ----------------------
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Basic Info
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,

  -- Address (for guest checkout)
  address TEXT,
  address_number TEXT,
  address_complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zipcode TEXT,

  -- Statistics
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  average_ticket DECIMAL(10,2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- 3.9 DELIVERY ADDRESSES
-- ----------------------
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,

  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,

  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- 3.10 COURIERS
-- ----------------------
CREATE TABLE IF NOT EXISTS couriers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT,
  license_plate TEXT,

  status courier_status DEFAULT 'offline',
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ORDERS SYSTEM
-- ============================================

-- ----------------------
-- 4.1 ORDERS
-- ----------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,

  -- Order Info
  order_number TEXT,
  order_type order_type NOT NULL,
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',

  -- Customer Info (snapshot for history)
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,

  -- Delivery Info
  delivery_address TEXT,
  delivery_number TEXT,
  delivery_complement TEXT,
  delivery_neighborhood TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_zipcode TEXT,
  delivery_instructions TEXT,
  delivery_address_id UUID REFERENCES delivery_addresses(id) ON DELETE SET NULL,

  -- Payment
  payment_method TEXT CHECK (
    payment_method IN ('pix', 'credit_card', 'debit_card', 'cash', 'voucher')
  ),

  -- Values
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,

  -- Notes
  notes TEXT,
  table_number TEXT,

  -- Timing
  estimated_time INTEGER,
  confirmed_at TIMESTAMPTZ,
  prepared_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- 4.2 ORDER ITEMS
-- ----------------------
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,

  -- Product snapshot
  product_name TEXT NOT NULL,
  product_image_url TEXT,

  -- Quantities and prices
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- 4.3 ORDER ITEM ADDITIONALS
-- ----------------------
CREATE TABLE IF NOT EXISTS order_item_additionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  additional_id UUID REFERENCES additionals(id) ON DELETE SET NULL,

  additional_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- 4.4 ORDER ITEM VARIATIONS
-- ----------------------
CREATE TABLE IF NOT EXISTS order_item_variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,

  variation_name TEXT NOT NULL,
  variation_price DECIMAL(10,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. ADDITIONAL MODULES
-- ============================================

-- ----------------------
-- 5.1 COUPONS
-- ----------------------
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,

  code TEXT NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_value DECIMAL(10,2) DEFAULT 0,

  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,

  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(restaurant_id, code)
);

-- ----------------------
-- 5.2 INVENTORY MOVEMENTS
-- ----------------------
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,

  type TEXT CHECK (type IN ('purchase', 'sale', 'adjustment', 'return')),
  quantity INTEGER NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- 5.3 REVIEWS
-- ----------------------
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================

-- Restaurants
CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_restaurant ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE additionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_additionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_additionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ----------------------
-- RESTAURANTS POLICIES
-- ----------------------
CREATE POLICY "Owners can view their restaurants" ON restaurants
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their restaurants" ON restaurants
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their restaurants" ON restaurants
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Public can view restaurants by slug" ON restaurants
  FOR SELECT USING (true);

-- ----------------------
-- CATEGORIES POLICIES
-- ----------------------
CREATE POLICY "Owners can manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT USING (is_active = true);

-- ----------------------
-- PRODUCTS POLICIES
-- ----------------------
CREATE POLICY "Owners can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = products.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (is_active = true);

-- ----------------------
-- PRODUCT VARIATIONS POLICIES
-- ----------------------
CREATE POLICY "Owners can manage variations" ON product_variations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.id = product_variations.product_id
      AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view variations" ON product_variations
  FOR SELECT USING (true);

-- ----------------------
-- ADDITIONALS POLICIES
-- ----------------------
CREATE POLICY "Owners can manage additionals" ON additionals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = additionals.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view additionals" ON additionals
  FOR SELECT USING (true);

-- ----------------------
-- PRODUCT ADDITIONALS POLICIES
-- ----------------------
CREATE POLICY "Owners can manage product additionals" ON product_additionals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.id = product_additionals.product_id
      AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view product additionals" ON product_additionals
  FOR SELECT USING (true);

-- ----------------------
-- TABLES POLICIES
-- ----------------------
CREATE POLICY "Owners can manage tables" ON tables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = tables.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view tables" ON tables
  FOR SELECT USING (is_available = true);

-- ----------------------
-- CUSTOMERS POLICIES
-- ----------------------
CREATE POLICY "Users can view their customer profile" ON customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create customer" ON customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their customer profile" ON customers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owners can view their customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.customer_id = customers.id
      AND r.owner_id = auth.uid()
    )
  );

-- ----------------------
-- DELIVERY ADDRESSES POLICIES
-- ----------------------
CREATE POLICY "Users can manage their addresses" ON delivery_addresses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = delivery_addresses.customer_id
      AND customers.user_id = auth.uid()
    )
  );

-- ----------------------
-- COURIERS POLICIES
-- ----------------------
CREATE POLICY "Owners can manage couriers" ON couriers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = couriers.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Couriers can view their profile" ON couriers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Couriers can update their status" ON couriers
  FOR UPDATE USING (auth.uid() = user_id);

-- ----------------------
-- ORDERS POLICIES
-- ----------------------
CREATE POLICY "Owners can view restaurant orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view their orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = orders.customer_id
      AND customers.user_id = auth.uid()
    )
  );

CREATE POLICY "Couriers can view assigned orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM couriers
      WHERE couriers.id = orders.courier_id
      AND couriers.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can update restaurant orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- ----------------------
-- ORDER ITEMS POLICIES
-- ----------------------
CREATE POLICY "Users can view order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      LEFT JOIN restaurants r ON r.id = o.restaurant_id
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN couriers co ON co.id = o.courier_id
      WHERE o.id = order_items.order_id
      AND (r.owner_id = auth.uid() OR c.user_id = auth.uid() OR co.user_id = auth.uid())
    )
  );

CREATE POLICY "Anyone can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- ----------------------
-- ORDER ITEM ADDITIONALS POLICIES
-- ----------------------
CREATE POLICY "Users can view order item additionals" ON order_item_additionals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN restaurants r ON r.id = o.restaurant_id
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN couriers co ON co.id = o.courier_id
      WHERE oi.id = order_item_additionals.order_item_id
      AND (r.owner_id = auth.uid() OR c.user_id = auth.uid() OR co.user_id = auth.uid())
    )
  );

CREATE POLICY "Anyone can insert order item additionals" ON order_item_additionals
  FOR INSERT WITH CHECK (true);

-- ----------------------
-- ORDER ITEM VARIATIONS POLICIES
-- ----------------------
CREATE POLICY "Users can view order item variations" ON order_item_variations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE oi.id = order_item_variations.order_item_id
      AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create order item variations" ON order_item_variations
  FOR INSERT WITH CHECK (true);

-- ----------------------
-- COUPONS POLICIES
-- ----------------------
CREATE POLICY "Owners can manage coupons" ON coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = coupons.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active coupons" ON coupons
  FOR SELECT USING (is_active = true);

-- ----------------------
-- INVENTORY MOVEMENTS POLICIES
-- ----------------------
CREATE POLICY "Owners can view inventory movements" ON inventory_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = inventory_movements.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert inventory movements" ON inventory_movements
  FOR INSERT WITH CHECK (true);

-- ----------------------
-- REVIEWS POLICIES
-- ----------------------
CREATE POLICY "Owners can view restaurant reviews" ON reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = reviews.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create reviews" ON reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view reviews" ON reviews
  FOR SELECT USING (true);

-- ============================================
-- 8. FUNCTIONS & TRIGGERS
-- ============================================

-- ----------------------
-- 8.1 UPDATE TIMESTAMP FUNCTION
-- ----------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ----------------------
-- 8.2 GENERATE ORDER NUMBER
-- ----------------------
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Generate sequential number based on current date
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO next_number
  FROM orders
  WHERE restaurant_id = NEW.restaurant_id
  AND DATE(created_at) = CURRENT_DATE;

  NEW.order_number := TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(next_number::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- ----------------------
-- 8.3 UPDATE STOCK ON ORDER
-- ----------------------
CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Decrease stock
    UPDATE products p SET
      stock_quantity = stock_quantity - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id
      AND p.manage_stock = true;

    -- Register movement
    INSERT INTO inventory_movements (restaurant_id, product_id, type, quantity, order_id, created_at)
    SELECT NEW.restaurant_id, product_id, 'sale', -quantity, NEW.id, NOW()
    FROM order_items
    WHERE order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- ----------------------
-- 8.4 UPDATE CUSTOMER STATS
-- ----------------------
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
$$;

-- ============================================
-- 9. APPLY TRIGGERS
-- ============================================

-- Updated at triggers
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Order number trigger
DROP TRIGGER IF EXISTS generate_order_number_trigger ON orders;
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- Stock update trigger
DROP TRIGGER IF EXISTS update_stock_trigger ON orders;
CREATE TRIGGER update_stock_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_order();

-- Customer stats trigger
DROP TRIGGER IF EXISTS update_customer_stats_trigger ON orders;
CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.customer_id IS NOT NULL)
  EXECUTE FUNCTION update_customer_stats();

-- ============================================
-- 10. ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
-- Execute this script in your Supabase SQL Editor
-- After execution, your FoodHub database will be 100% ready!
