-- Fix security warnings by adding search_path to functions

-- Fix update_updated_at_column function
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

-- Fix generate_order_number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM orders
  WHERE restaurant_id = NEW.restaurant_id
  AND DATE(created_at) = CURRENT_DATE;

  NEW.order_number := TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(next_number::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Fix update_stock_on_order function
CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Diminuir estoque
    UPDATE products p SET
      stock_quantity = stock_quantity - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id
      AND p.manage_stock = true;

    -- Registrar movimentação
    INSERT INTO inventory_movements (restaurant_id, product_id, type, quantity, order_id, created_at)
    SELECT NEW.restaurant_id, product_id, 'sale', -quantity, NEW.id, NOW()
    FROM order_items
    WHERE order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix update_customer_stats function
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE customers SET
      total_orders = (SELECT COUNT(*) FROM orders WHERE customer_id = NEW.customer_id AND status = 'delivered'),
      total_spent = (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = NEW.customer_id AND status = 'delivered'),
      average_ticket = (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE customer_id = NEW.customer_id AND status = 'delivered'),
      last_order_at = (SELECT MAX(created_at) FROM orders WHERE customer_id = NEW.customer_id)
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;