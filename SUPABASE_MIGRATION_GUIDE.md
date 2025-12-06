# 🔄 GUIA COMPLETO DE MIGRAÇÃO DO SUPABASE - FOODHUB PRO

## 📋 Sumário

- [1. Visão Geral](#1-visão-geral)
- [2. Estrutura do Banco de Dados](#2-estrutura-do-banco-de-dados)
- [3. Passos para Migração](#3-passos-para-migração)
- [4. Edge Functions](#4-edge-functions)
- [5. Storage e Buckets](#5-storage-e-buckets)
- [6. Configuração do Projeto](#6-configuração-do-projeto)
- [7. Verificação Pós-Migração](#7-verificação-pós-migração)

---

## 1. Visão Geral

### 1.1 Informações do Projeto Atual

- **Project ID Atual**: `wisikawnpzrrfzqutatl`
- **URL Atual**: `https://wisikawnpzrrfzqutatl.supabase.co`
- **Total de Migrações**: 23 arquivos SQL
- **Total de Tabelas**: 50+
- **Total de Edge Functions**: 9
- **Total de Políticas RLS**: 100+

### 1.2 Módulos do Sistema

1. **Core System** - Restaurantes, produtos, categorias
2. **Orders System** - Pedidos completos com histórico
3. **RBAC System** - Sistema de permissões multi-restaurante
4. **Costs Module** - Gerenciamento de custos e ingredientes
5. **iFood Integration** - Integração OAuth com iFood
6. **Reviews System** - Sistema de avaliações
7. **Tracking & Analytics** - Facebook Pixel e conversões

---

## 2. Estrutura do Banco de Dados

### 2.1 Enums (Tipos Personalizados)

```sql
-- order_status
'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'

-- order_type
'delivery' | 'table' | 'takeout'

-- payment_status
'pending' | 'paid' | 'refunded'

-- courier_status
'available' | 'busy' | 'offline'
```

### 2.2 Tabelas por Módulo

#### **MÓDULO CORE (Sistema Base)**

##### `restaurants` (Tabela Principal)
```sql
- id (UUID, PK)
- owner_id (UUID, FK -> auth.users)
- brand_id (UUID, FK -> brands)
- name (TEXT)
- slug (TEXT, UNIQUE)
- description (TEXT)
- phone, email, address, city, state, zip_code (TEXT)
- logo_url, cover_url (TEXT)
- delivery_fee, delivery_radius, delivery_time_estimate (NUMERIC)
- pickup_time_estimate (INTEGER)
- allows_delivery, allows_table, allows_takeout (BOOLEAN)
- is_open (BOOLEAN)
- opening_hours (JSONB)
- business_type, business_niche (TEXT)
- ai_configured (BOOLEAN)
- ai_config (JSONB)
- latitude, longitude (NUMERIC) -- Coordenadas GPS
- webhook_url, webhook_secret (TEXT)
- restaurant_index (INTEGER)
- created_at, updated_at (TIMESTAMPTZ)
```

**Relacionamentos**:
- `owner_id` → `auth.users.id` (CASCADE)
- `brand_id` → `brands.id` (CASCADE)

**Índices**:
- `idx_restaurants_owner` (owner_id)
- `idx_restaurants_slug` (slug)
- `idx_restaurants_brand` (brand_id)

---

##### `categories` (Categorias de Produtos)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- name (TEXT)
- description (TEXT)
- image_url (TEXT)
- display_order (INTEGER)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

**Relacionamentos**:
- `restaurant_id` → `restaurants.id` (CASCADE)

**Índices**:
- `idx_categories_restaurant` (restaurant_id)

---

##### `products` (Produtos do Cardápio)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- category_id (UUID, FK -> categories)
- name (TEXT)
- description (TEXT)
- image_url (TEXT)
- base_price (DECIMAL)
- is_active, is_featured (BOOLEAN)
- manage_stock (BOOLEAN)
- stock_quantity (INTEGER)
- preparation_time (INTEGER)
- has_sizes (BOOLEAN) -- Indica se tem tamanhos
- created_at, updated_at (TIMESTAMPTZ)
```

**Relacionamentos**:
- `restaurant_id` → `restaurants.id` (CASCADE)
- `category_id` → `categories.id` (SET NULL)

**Índices**:
- `idx_products_restaurant` (restaurant_id)
- `idx_products_category` (category_id)
- `idx_products_active` (is_active)

---

##### `product_variations` (LEGADO - Variações de Produtos)
```sql
- id (UUID, PK)
- product_id (UUID, FK -> products)
- name (TEXT)
- price_modifier (DECIMAL)
- display_order (INTEGER)
- size_type (TEXT)
- size_metadata (JSONB)
- is_ai_generated (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

⚠️ **NOTA**: Este é o sistema legado. O novo sistema usa `product_sizes` (ver abaixo).

---

##### `additionals` (Extras/Adicionais)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- name (TEXT)
- price (DECIMAL)
- created_at (TIMESTAMPTZ)
```

---

##### `product_additionals` (Relação Produto-Adicionais)
```sql
- product_id (UUID, FK -> products)
- additional_id (UUID, FK -> additionals)
- is_required (BOOLEAN)
- max_quantity (INTEGER)
- PRIMARY KEY (product_id, additional_id)
```

---

##### `tables` (Mesas do Restaurante)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- table_number (TEXT)
- qr_code (TEXT)
- capacity (INTEGER)
- is_available (BOOLEAN)
- created_at (TIMESTAMPTZ)
- UNIQUE(restaurant_id, table_number)
```

---

#### **MÓDULO DE PRODUTOS REESTRUTURADO**

##### `product_sizes` (Tamanhos Absolutos)
```sql
- id (UUID, PK)
- product_id (UUID, FK -> products)
- name (TEXT) -- P, M, G, 300ml, etc
- price (DECIMAL) -- Preço absoluto (não modifier)
- display_order (INTEGER)
- is_available (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

---

##### `product_addon_groups` (Grupos de Adicionais)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- name (TEXT) -- "Sabores", "Borda", "Ponto da Carne"
- description (TEXT)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

---

##### `addon_group_items` (Itens dos Grupos)
```sql
- id (UUID, PK)
- addon_group_id (UUID, FK -> product_addon_groups)
- name (TEXT) -- "Mussarela", "Calabresa", etc
- price (DECIMAL)
- display_order (INTEGER)
- is_available (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

---

##### `product_addon_group_links` (Vinculação Produto-Grupo)
```sql
- id (UUID, PK)
- product_id (UUID, FK -> products)
- addon_group_id (UUID, FK -> product_addon_groups)
- is_required (BOOLEAN)
- min_quantity, max_quantity (INTEGER)
- allow_multiple (BOOLEAN)
- display_order (INTEGER)
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(product_id, addon_group_id)
```

---

#### **MÓDULO DE CLIENTES**

##### `customers` (Clientes)
```sql
- id (UUID, PK)
- user_id (UUID, FK -> auth.users, NULLABLE)
- name (TEXT)
- phone, email (TEXT)
- total_orders (INTEGER)
- total_spent, average_ticket (DECIMAL)
- last_order_at (TIMESTAMPTZ)
- created_at, updated_at (TIMESTAMPTZ)
```

**Índices**:
- `idx_customers_phone` (phone)
- `idx_customers_email` (email)

---

##### `delivery_addresses` (Endereços de Entrega)
```sql
- id (UUID, PK)
- customer_id (UUID, FK -> customers)
- street, number, complement (TEXT)
- neighborhood, city, state, zip_code (TEXT)
- latitude, longitude (DECIMAL)
- is_default (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

---

##### `couriers` (Entregadores)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- user_id (UUID, FK -> auth.users, NULLABLE)
- name, phone (TEXT)
- vehicle_type, license_plate (TEXT)
- status (courier_status ENUM)
- total_deliveries (INTEGER)
- rating (DECIMAL)
- created_at (TIMESTAMPTZ)
```

---

#### **MÓDULO DE PEDIDOS**

##### `orders` (Pedidos)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- customer_id (UUID, FK -> customers, NULLABLE)
- courier_id (UUID, FK -> couriers, NULLABLE)
- table_id (UUID, FK -> tables, NULLABLE)
- delivery_address_id (UUID, FK -> delivery_addresses, NULLABLE)
- order_number (TEXT)
- order_type (order_type ENUM)
- status (order_status ENUM)
- payment_status (payment_status ENUM)
- customer_name, customer_phone (TEXT)
- subtotal, delivery_fee, discount, total_amount (DECIMAL)
- notes (TEXT)
- estimated_time (INTEGER)
- confirmed_at, prepared_at, ready_at, delivered_at (TIMESTAMPTZ)
- created_at, updated_at (TIMESTAMPTZ)
```

**Índices**:
- `idx_orders_restaurant` (restaurant_id)
- `idx_orders_customer` (customer_id)
- `idx_orders_status` (status)
- `idx_orders_created` (created_at DESC)
- `idx_orders_order_number` (order_number)

---

##### `order_items` (Itens do Pedido)
```sql
- id (UUID, PK)
- order_id (UUID, FK -> orders)
- product_id (UUID, FK -> products, NULLABLE)
- variation_id (UUID, FK -> product_variations, NULLABLE)
- product_name (TEXT)
- quantity (INTEGER)
- unit_price, subtotal (DECIMAL)
- notes (TEXT)
- created_at (TIMESTAMPTZ)
```

**Índices**:
- `idx_order_items_order` (order_id)
- `idx_order_items_product` (product_id)

---

##### `order_item_additionals` (Adicionais dos Itens)
```sql
- id (UUID, PK)
- order_item_id (UUID, FK -> order_items)
- additional_id (UUID, FK -> additionals, NULLABLE)
- additional_name (TEXT)
- quantity (INTEGER)
- unit_price (DECIMAL)
- created_at (TIMESTAMPTZ)
```

---

##### `order_status_history` (Histórico de Status)
```sql
- id (UUID, PK)
- order_id (UUID, FK -> orders)
- old_status, new_status (order_status ENUM)
- changed_by (UUID, FK -> auth.users, NULLABLE)
- changed_at (TIMESTAMPTZ)
- notes (TEXT)
```

---

##### `order_notifications` (Notificações de Pedidos)
```sql
- id (UUID, PK)
- order_id (UUID, FK -> orders)
- notification_type (TEXT)
- recipient (TEXT)
- message (TEXT)
- sent_at (TIMESTAMPTZ)
- delivered (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

---

#### **MÓDULO RBAC (Multi-Restaurante)**

##### `brands` (Marcas/Grupos)
```sql
- id (UUID, PK)
- owner_id (UUID, FK -> auth.users)
- name (TEXT)
- slug (TEXT, UNIQUE)
- logo_url (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

**Índices**:
- `idx_brands_owner` (owner_id)
- `idx_brands_slug` (slug)

---

##### `roles` (Perfis de Usuário)
```sql
- id (UUID, PK)
- name (TEXT, UNIQUE) -- 'owner', 'manager', 'financial', 'waiter', etc
- display_name (TEXT)
- description (TEXT)
- level (INTEGER) -- Hierarquia: 100=owner, 80=manager, etc
- color (TEXT) -- Cor hex para badge
- created_at (TIMESTAMPTZ)
```

**Roles Padrão**:
1. `owner` (level: 100) - #8b5cf6
2. `manager` (level: 80) - #2563eb
3. `financial` (level: 60) - #10b981
4. `marketing` (level: 50) - #ec4899
5. `waiter` (level: 40) - #f59e0b
6. `reception` (level: 35) - #14b8a6
7. `cashier` (level: 30) - #06b6d4
8. `kitchen` (level: 20) - #ef4444

**Índices**:
- `idx_roles_name` (name)
- `idx_roles_level` (level)

---

##### `permissions` (Permissões)
```sql
- id (UUID, PK)
- resource (TEXT) -- 'orders', 'products', 'reports', 'users', etc
- action (TEXT) -- 'create', 'read', 'update', 'delete', 'execute'
- display_name (TEXT)
- description (TEXT)
- category (TEXT) -- 'operational', 'financial', 'administrative'
- created_at (TIMESTAMPTZ)
- UNIQUE(resource, action)
```

**Índices**:
- `idx_permissions_resource` (resource)
- `idx_permissions_category` (category)

---

##### `role_permissions` (Permissões por Perfil)
```sql
- role_id (UUID, FK -> roles)
- permission_id (UUID, FK -> permissions)
- granted (BOOLEAN)
- created_at (TIMESTAMPTZ)
- PRIMARY KEY (role_id, permission_id)
```

---

##### `user_permission_overrides` (Overrides de Permissão)
```sql
- user_id (UUID, FK -> auth.users)
- permission_id (UUID, FK -> permissions)
- granted (BOOLEAN)
- granted_by (UUID, FK -> auth.users, NULLABLE)
- granted_at (TIMESTAMPTZ)
- notes (TEXT)
- PRIMARY KEY (user_id, permission_id)
```

---

##### `audit_logs` (Logs de Auditoria)
```sql
- id (UUID, PK)
- user_id (UUID, FK -> auth.users, NULLABLE)
- action (TEXT)
- resource_type (TEXT)
- resource_id (UUID)
- old_values, new_values (JSONB)
- ip_address (TEXT)
- user_agent (TEXT)
- created_at (TIMESTAMPTZ)
```

**Índices**:
- `idx_audit_logs_user` (user_id)
- `idx_audit_logs_resource` (resource_type, resource_id)
- `idx_audit_logs_created` (created_at DESC)

---

#### **MÓDULO DE CUSTOS**

##### `ingredient_categories` (Categorias de Insumos)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- name (TEXT)
- description, icon, color (TEXT)
- is_ai_generated (BOOLEAN)
- ai_metadata (JSONB)
- display_order (INTEGER)
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(restaurant_id, name)
```

**Índices**:
- `idx_ingredient_categories_restaurant` (restaurant_id)

---

##### `ingredients` (Insumos/Matérias-Primas)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- category_id (UUID, FK -> ingredient_categories, NULLABLE)
- name (TEXT)
- description (TEXT)
- unit_type (TEXT) -- g, kg, ml, L, un, cx
- cost_per_unit (DECIMAL)
- minimum_stock, current_stock (DECIMAL)
- supplier_name, supplier_contact (TEXT)
- is_active (BOOLEAN)
- is_ai_generated (BOOLEAN)
- ai_metadata (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```

**Índices**:
- `idx_ingredients_restaurant` (restaurant_id)
- `idx_ingredients_category` (category_id)
- `idx_ingredients_active` (is_active)

---

##### `recipe_ingredients` (Receitas com Ingredientes)
```sql
- id (UUID, PK)
- product_id (UUID, FK -> products, NULLABLE)
- product_variation_id (UUID, FK -> product_variations, NULLABLE)
- ingredient_id (UUID, FK -> ingredients)
- quantity (DECIMAL)
- unit_type (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

---

##### `beverage_categories` (Categorias de Bebidas)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- name, description, icon, color (TEXT)
- is_ai_generated (BOOLEAN)
- ai_metadata (JSONB)
- display_order (INTEGER)
- created_at, updated_at (TIMESTAMPTZ)
```

---

##### `beverages` (Bebidas)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- category_id (UUID, FK -> beverage_categories, NULLABLE)
- name, description (TEXT)
- unit_type (TEXT)
- cost_per_unit, sale_price (DECIMAL)
- minimum_stock, current_stock (DECIMAL)
- supplier_name, supplier_contact (TEXT)
- is_active (BOOLEAN)
- is_ai_generated (BOOLEAN)
- ai_metadata (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```

---

##### `combos` (Combos Promocionais)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- name, description, image_url (TEXT)
- total_cost, sale_price (DECIMAL)
- is_active (BOOLEAN)
- is_ai_generated (BOOLEAN)
- ai_metadata (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```

---

##### `combo_items` (Itens dos Combos)
```sql
- id (UUID, PK)
- combo_id (UUID, FK -> combos)
- item_type (TEXT) -- 'product', 'ingredient', 'beverage'
- item_id (UUID)
- quantity (DECIMAL)
- created_at (TIMESTAMPTZ)
```

---

##### `fixed_costs` (Custos Fixos)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- name, description, category (TEXT)
- amount (DECIMAL)
- frequency (TEXT) -- 'monthly', 'yearly', 'one-time'
- is_active (BOOLEAN)
- is_ai_generated (BOOLEAN)
- ai_metadata (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```

---

##### `variable_costs` (Custos Variáveis)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- name, description, category (TEXT)
- amount (DECIMAL)
- reference_month (DATE)
- is_ai_generated (BOOLEAN)
- ai_metadata (JSONB)
- created_at (TIMESTAMPTZ)
```

---

##### `cost_calculator_settings` (Configurações do Calculador)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants, UNIQUE)
- profit_margin_percentage (DECIMAL)
- waste_percentage (DECIMAL)
- tax_percentage (DECIMAL)
- other_costs_percentage (DECIMAL)
- is_ai_generated (BOOLEAN)
- ai_metadata (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```

---

##### `ai_business_templates` (Templates de IA)
```sql
- id (UUID, PK)
- business_type, business_niche (TEXT)
- template_data (JSONB)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(business_type, business_niche)
```

---

#### **MÓDULO IFOOD**

##### `ifood_integrations` (Configuração OAuth)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants, UNIQUE)
- access_token, refresh_token (TEXT)
- token_expires_at (TIMESTAMPTZ)
- user_code, authorization_code, authorization_code_verifier (TEXT)
- verification_url, verification_url_complete (TEXT)
- user_code_expires_at (TIMESTAMPTZ)
- is_active, is_authorized (BOOLEAN)
- last_sync_at (TIMESTAMPTZ)
- created_at, updated_at (TIMESTAMPTZ)
```

---

##### `ifood_merchants` (Merchants Vinculados)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- ifood_integration_id (UUID, FK -> ifood_integrations)
- merchant_id (UUID)
- merchant_name (TEXT)
- widget_id (TEXT)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
- UNIQUE(restaurant_id, merchant_id)
```

---

##### `ifood_product_mappings` (Mapeamento de Produtos)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- local_product_id (UUID, FK -> products)
- ifood_product_id (TEXT)
- ifood_merchant_table_id (UUID, FK -> ifood_merchants, NULLABLE)
- auto_sync (BOOLEAN)
- last_sync_at (TIMESTAMPTZ)
- sync_status (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

---

##### `ifood_sync_logs` (Logs de Sincronização)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- ifood_integration_id (UUID, FK -> ifood_integrations)
- sync_type (TEXT) -- 'catalog', 'orders', 'full'
- status (TEXT) -- 'started', 'success', 'error'
- items_synced, items_created, items_updated, items_failed (INTEGER)
- error_message (TEXT)
- error_details (JSONB)
- started_at, completed_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
```

---

#### **MÓDULO DE AVALIAÇÕES**

##### `reviews` (Avaliações de Clientes)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- order_id (UUID, FK -> orders, NULLABLE)
- customer_id (UUID, FK -> customers, NULLABLE)
- rating (INTEGER) CHECK (rating >= 1 AND rating <= 5)
- comment (TEXT)
- created_at, updated_at (TIMESTAMPTZ)
```

---

#### **MÓDULO DE TRACKING & ANALYTICS**

##### `facebook_pixel_config` (Configuração Facebook Pixel)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants, UNIQUE)
- pixel_id (TEXT)
- access_token (TEXT)
- is_active (BOOLEAN)
- events_enabled (JSONB)
- created_at, updated_at (TIMESTAMPTZ)
```

---

##### `tracking_events` (Eventos de Tracking)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants, NULLABLE)
- session_id (TEXT)
- event_name (TEXT)
- event_data (JSONB)
- user_agent (TEXT)
- ip_address (TEXT)
- created_at (TIMESTAMPTZ)
```

**Índices**:
- `idx_tracking_events_restaurant` (restaurant_id)
- `idx_tracking_events_session` (session_id)

---

##### `conversion_analytics` (Materialized View - Analytics)
```sql
- restaurant_id (UUID)
- date (DATE)
- page_views (BIGINT)
- add_to_carts (BIGINT)
- checkouts (BIGINT)
- purchases (BIGINT)
- total_revenue (NUMERIC)
- conversion_rate (NUMERIC)
- UNIQUE(restaurant_id, date)
```

**Índices**:
- `idx_conversion_analytics_restaurant_date` (restaurant_id, date)

---

#### **MÓDULO DE INVENTÁRIO**

##### `inventory_movements` (Movimentações de Estoque)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- product_id (UUID, FK -> products)
- order_id (UUID, FK -> orders, NULLABLE)
- type (TEXT) -- 'purchase', 'sale', 'adjustment', 'return'
- quantity (INTEGER)
- notes (TEXT)
- created_at (TIMESTAMPTZ)
```

---

##### `coupons` (Cupons de Desconto)
```sql
- id (UUID, PK)
- restaurant_id (UUID, FK -> restaurants)
- code (TEXT)
- discount_type (TEXT) -- 'percentage', 'fixed'
- discount_value (DECIMAL)
- min_order_value (DECIMAL)
- max_uses, used_count (INTEGER)
- valid_from, valid_until (TIMESTAMPTZ)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- UNIQUE(restaurant_id, code)
```

---

### 2.3 Funções PostgreSQL

#### `update_updated_at_column()`
**Descrição**: Atualiza automaticamente o campo `updated_at` em triggers BEFORE UPDATE.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Usado em**:
- `restaurants`
- `categories`
- `products`
- `orders`
- `customers`
- `brands`
- `reviews`

---

#### `update_reviews_updated_at()`
**Descrição**: Versão específica para tabela de reviews.

```sql
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

#### `update_customer_stats()`
**Descrição**: Recalcula estatísticas do cliente após mudanças em pedidos.

```sql
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE customers SET
      total_orders = (SELECT COUNT(*) FROM orders WHERE customer_id = NEW.customer_id AND status = 'delivered'),
      total_spent = (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = NEW.customer_id AND status = 'delivered'),
      average_ticket = (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE customer_id = NEW.customer_id AND status = 'delivered'),
      last_order_at = (SELECT MAX(created_at) FROM orders WHERE customer_id = NEW.customer_id)
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger**: `trigger_update_customer_stats` AFTER INSERT OR UPDATE ON orders

---

#### `log_order_status_change()`
**Descrição**: Registra automaticamente mudanças de status em `order_status_history`.

```sql
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_at)
    VALUES (NEW.id, OLD.status, NEW.status, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger**: `trigger_log_order_status_change` AFTER UPDATE ON orders

---

#### `archive_old_delivered_orders()`
**Descrição**: Arquiva pedidos antigos entregues (se implementado).

```sql
-- Função para arquivar pedidos antigos
```

---

#### `refresh_conversion_analytics()`
**Descrição**: Atualiza a materialized view de analytics.

```sql
CREATE OR REPLACE FUNCTION refresh_conversion_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY conversion_analytics;
END;
$$ LANGUAGE plpgsql;
```

---

#### `process_new_user_as_owner()`
**Descrição**: Processa novo usuário como owner (auto-criação de brand e restaurante).

```sql
CREATE OR REPLACE FUNCTION process_new_user_as_owner()
RETURNS TRIGGER AS $$
DECLARE
  new_brand_id UUID;
BEGIN
  -- Criar brand padrão
  INSERT INTO brands (owner_id, name, slug)
  VALUES (NEW.id, 'Minha Marca', 'minha-marca-' || NEW.id)
  RETURNING id INTO new_brand_id;

  -- Criar restaurante padrão vinculado à brand
  -- ...

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger**: Executado após signup de novo usuário

---

### 2.4 Triggers

| Trigger | Tabela | Evento | Função | Descrição |
|---------|--------|--------|---------|-----------|
| `update_brands_updated_at` | `brands` | BEFORE UPDATE | `update_updated_at_column()` | Atualiza timestamp |
| `update_restaurants_updated_at` | `restaurants` | BEFORE UPDATE | `update_updated_at_column()` | Atualiza timestamp |
| `update_categories_updated_at` | `categories` | BEFORE UPDATE | `update_updated_at_column()` | Atualiza timestamp |
| `update_products_updated_at` | `products` | BEFORE UPDATE | `update_updated_at_column()` | Atualiza timestamp |
| `update_orders_updated_at` | `orders` | BEFORE UPDATE | `update_updated_at_column()` | Atualiza timestamp |
| `update_customers_updated_at` | `customers` | BEFORE UPDATE | `update_updated_at_column()` | Atualiza timestamp |
| `reviews_updated_at` | `reviews` | BEFORE UPDATE | `update_reviews_updated_at()` | Atualiza timestamp |
| `trigger_update_customer_stats` | `orders` | AFTER INSERT OR UPDATE | `update_customer_stats()` | Atualiza estatísticas |
| `trigger_log_order_status_change` | `orders` | AFTER UPDATE | `log_order_status_change()` | Registra mudanças |

---

### 2.5 Políticas RLS (Row Level Security)

⚠️ **IMPORTANTE**: Todas as tabelas têm RLS habilitado (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

#### Estratégias de RLS

**Públicas (Leitura sem autenticação)**:
- `restaurants` - `FOR SELECT USING (true)`
- `categories` - `FOR SELECT USING (is_active = true)`
- `products` - `FOR SELECT USING (is_active = true)`
- `reviews` - `FOR SELECT USING (true)`
- `tracking_events` - `FOR INSERT WITH CHECK (true)` (tracking anônimo)

**Owner-Based (Baseado em owner_id)**:
- `restaurants` - Owner pode CRUD seus restaurantes
- `brands` - Owner pode CRUD suas brands
- `categories`, `products`, `coupons`, etc - Via `restaurant_id` → `restaurants.owner_id`

**Multi-Tenant via RBAC**:
- Acesso controlado por `role_permissions` e `user_permission_overrides`
- Usuários com permissão podem acessar recursos do restaurante vinculado

**Exemplos de Políticas**:

```sql
-- Restaurants
CREATE POLICY "Owners can view their restaurants" ON restaurants
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Public can view restaurants by slug" ON restaurants
  FOR SELECT USING (true);

-- Products
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

-- Orders
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

CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);
```

---

## 3. Passos para Migração

### 3.1 Criar Novo Projeto no Supabase

1. Acesse https://supabase.com
2. Clique em "New Project"
3. Escolha:
   - Nome do projeto: `foodhub-pro`
   - Database password: [gere uma senha forte]
   - Região: escolha a mais próxima (ex: South America - São Paulo)
4. Aguarde a criação do projeto (~2 minutos)

### 3.2 Configurar Projeto Local

1. **Atualizar `supabase/config.toml`**:

```toml
project_id = "SEU_NOVO_PROJECT_ID"
```

2. **Obter credenciais do novo projeto**:
   - URL do projeto: `https://SEU_PROJECT_ID.supabase.co`
   - Anon Key: Settings → API → anon public
   - Service Role Key: Settings → API → service_role

3. **Atualizar variáveis de ambiente** (.env ou .env.local):

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY
```

### 3.3 Executar Migrações SQL

#### Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. Acesse o SQL Editor: Dashboard → SQL Editor
2. Execute as migrações NA ORDEM:

```bash
# Ordem correta de execução:
1. 20251117021015_507a0c91-e0ea-431c-8de3-adedc254101e.sql (Schema base)
2. 20251117021053_6e8f2bc8-1b4a-448d-ac29-82aec6c8104a.sql
3. 20251117_create_orders_system.sql
4. 20251117_add_order_history_and_archive.sql
5. 20251117_setup_storage.sql
6. 20251117_fix_public_menu_access.sql
7. 20251117_fix_public_menu_access_v2.sql
8. 20251118_fix_orders_columns.sql
9. 20251118_add_customer_stats.sql
10. 20251118_add_pickup_time_to_restaurants.sql
11. 20251118_create_costs_module.sql
12. 20251118_create_ifood_integration.sql
13. 20251118_create_reviews_system.sql
14. 20251118_create_tracking_analytics.sql
15. 20251119_create_rbac_system.sql
16. 20251119_restructure_products_system.sql
17. 20251119_auto_owner_on_signup.sql
18. 20251119_add_marketing_reception_roles.sql
19. 20251122_complete_owner_fix.sql
20. 20251122_fix_brands_complete.sql
21. 20251122_fix_policies_final.sql
22. 20251125_fix_brand_rls_for_non_owners.sql
23. 20251201_add_restaurant_coordinates.sql
```

3. Copie o conteúdo de cada arquivo e execute no SQL Editor
4. Verifique se há erros após cada migração

#### Opção 2: Via CLI do Supabase

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login
supabase login

# Link com o novo projeto
supabase link --project-ref SEU_PROJECT_ID

# Executar migrações
supabase db push
```

### 3.4 Popular Dados Iniciais (Seeds)

#### 3.4.1 Roles e Permissões Padrão

Execute no SQL Editor:

```sql
-- Inserir Roles Padrão
INSERT INTO roles (name, display_name, description, level, color) VALUES
  ('owner', 'Dono', 'Proprietário do negócio com acesso total', 100, '#8b5cf6'),
  ('manager', 'Gerente', 'Gerente com amplos poderes administrativos', 80, '#2563eb'),
  ('financial', 'Financeiro', 'Responsável por finanças e relatórios', 60, '#10b981'),
  ('marketing', 'Marketing', 'Responsável por marketing e análises', 50, '#ec4899'),
  ('waiter', 'Garçom', 'Atende mesas e registra pedidos', 40, '#f59e0b'),
  ('reception', 'Recepção', 'Atende clientes e gerencia mesas', 35, '#14b8a6'),
  ('cashier', 'Caixa', 'Opera o caixa e processa pagamentos', 30, '#06b6d4'),
  ('kitchen', 'Cozinha', 'Visualiza e atualiza pedidos na cozinha', 20, '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- Inserir Permissões Padrão
INSERT INTO permissions (resource, action, display_name, description, category) VALUES
  ('orders', 'create', 'Criar Pedidos', 'Criar novos pedidos', 'operational'),
  ('orders', 'read', 'Ver Pedidos', 'Visualizar pedidos', 'operational'),
  ('orders', 'update', 'Editar Pedidos', 'Atualizar status e detalhes de pedidos', 'operational'),
  ('orders', 'delete', 'Excluir Pedidos', 'Cancelar/excluir pedidos', 'operational'),
  ('products', 'create', 'Criar Produtos', 'Adicionar novos produtos', 'administrative'),
  ('products', 'read', 'Ver Produtos', 'Visualizar produtos', 'administrative'),
  ('products', 'update', 'Editar Produtos', 'Atualizar produtos existentes', 'administrative'),
  ('products', 'delete', 'Excluir Produtos', 'Remover produtos', 'administrative'),
  ('categories', 'create', 'Criar Categorias', 'Criar categorias de produtos', 'administrative'),
  ('categories', 'read', 'Ver Categorias', 'Visualizar categorias', 'administrative'),
  ('categories', 'update', 'Editar Categorias', 'Atualizar categorias', 'administrative'),
  ('categories', 'delete', 'Excluir Categorias', 'Remover categorias', 'administrative'),
  ('users', 'create', 'Criar Usuários', 'Adicionar novos usuários', 'administrative'),
  ('users', 'read', 'Ver Usuários', 'Visualizar usuários', 'administrative'),
  ('users', 'update', 'Editar Usuários', 'Atualizar perfis e permissões', 'administrative'),
  ('users', 'delete', 'Excluir Usuários', 'Remover usuários', 'administrative'),
  ('kitchen', 'read', 'Ver Cozinha', 'Visualizar pedidos na cozinha', 'operational'),
  ('kitchen', 'update', 'Atualizar Cozinha', 'Marcar itens como preparados', 'operational'),
  ('payments', 'read', 'Ver Pagamentos', 'Visualizar pagamentos', 'financial'),
  ('payments', 'update', 'Processar Pagamentos', 'Confirmar pagamentos', 'financial'),
  ('reports', 'read', 'Ver Relatórios', 'Acessar relatórios financeiros', 'financial'),
  ('analytics', 'read', 'Ver Analytics', 'Acessar dados analíticos', 'financial'),
  ('customers', 'read', 'Ver Clientes', 'Visualizar dados de clientes', 'administrative'),
  ('customers', 'update', 'Editar Clientes', 'Atualizar informações de clientes', 'administrative'),
  ('coupons', 'create', 'Criar Cupons', 'Criar cupons de desconto', 'administrative'),
  ('coupons', 'read', 'Ver Cupons', 'Visualizar cupons', 'administrative'),
  ('coupons', 'update', 'Editar Cupons', 'Atualizar cupons', 'administrative'),
  ('coupons', 'delete', 'Excluir Cupons', 'Remover cupons', 'administrative'),
  ('tables', 'create', 'Criar Mesas', 'Adicionar mesas', 'administrative'),
  ('tables', 'read', 'Ver Mesas', 'Visualizar mesas', 'administrative'),
  ('tables', 'update', 'Editar Mesas', 'Atualizar mesas', 'administrative'),
  ('tables', 'delete', 'Excluir Mesas', 'Remover mesas', 'administrative'),
  ('audit', 'read', 'Ver Auditoria', 'Acessar logs de auditoria', 'administrative'),
  ('prints', 'execute', 'Imprimir', 'Enviar comandos para impressora', 'operational')
ON CONFLICT (resource, action) DO NOTHING;
```

### 3.5 Configurar Storage (Buckets)

1. Acesse Dashboard → Storage
2. Crie os seguintes buckets:

#### Bucket: `restaurant-images`
- **Public**: ✅ Yes
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

Política RLS:
```sql
-- Qualquer um pode ler
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'restaurant-images');

-- Owners podem inserir
CREATE POLICY "Owners can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'restaurant-images'
    AND auth.role() = 'authenticated'
  );

-- Owners podem atualizar
CREATE POLICY "Owners can update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'restaurant-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Owners podem deletar
CREATE POLICY "Owners can delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'restaurant-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

#### Bucket: `product-images`
- Configuração idêntica a `restaurant-images`

#### Bucket: `category-images`
- Configuração idêntica a `restaurant-images`

---

## 4. Edge Functions

### 4.1 Lista de Edge Functions

| Função | Descrição | Arquivo |
|--------|-----------|---------|
| `ai-chat` | Chat com IA para assistência | `supabase/functions/ai-chat/index.ts` |
| `create-user-admin` | Criar usuário admin | `supabase/functions/create-user-admin/index.ts` |
| `delete-user-admin` | Deletar usuário | `supabase/functions/delete-user-admin/index.ts` |
| `list-users-admin` | Listar usuários | `supabase/functions/list-users-admin/index.ts` |
| `reset-user-password` | Resetar senha | `supabase/functions/reset-user-password/index.ts` |
| `signup-owner` | Signup para proprietário | `supabase/functions/signup-owner/index.ts` |
| `ifood-oauth-start` | Iniciar OAuth iFood | `supabase/functions/ifood-oauth-start/index.ts` |
| `ifood-oauth-callback` | Callback OAuth iFood | `supabase/functions/ifood-oauth-callback/index.ts` |
| `ifood-sync-catalog` | Sincronizar catálogo | `supabase/functions/ifood-sync-catalog/index.ts` |

### 4.2 Deploy das Edge Functions

```bash
# Login (se ainda não fez)
supabase login

# Link com o projeto
supabase link --project-ref SEU_PROJECT_ID

# Deploy de todas as functions
supabase functions deploy ai-chat
supabase functions deploy create-user-admin
supabase functions deploy delete-user-admin
supabase functions deploy list-users-admin
supabase functions deploy reset-user-password
supabase functions deploy signup-owner
supabase functions deploy ifood-oauth-start
supabase functions deploy ifood-oauth-callback
supabase functions deploy ifood-sync-catalog
```

### 4.3 Configurar Secrets das Functions

```bash
# OpenAI (para ai-chat)
supabase secrets set OPENAI_API_KEY=sk-...

# iFood OAuth (IMPORTANTE!)
supabase secrets set IFOOD_CLIENT_ID=seu_client_id
supabase secrets set IFOOD_CLIENT_SECRET=seu_client_secret

# Service Role (para functions admin)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
```

---

## 5. Storage e Buckets

Já coberto na seção 3.5 acima.

---

## 6. Configuração do Projeto

### 6.1 Atualizar Arquivo de Configuração

**`src/integrations/supabase/client.ts`**:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
```

### 6.2 Regenerar Types

```bash
# Via CLI
supabase gen types typescript --project-id SEU_PROJECT_ID > src/integrations/supabase/types.ts

# OU via Dashboard
# Settings → API → Generate TypeScript types
# Copiar e colar em src/integrations/supabase/types.ts
```

### 6.3 Atualizar `.env` ou `.env.local`

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY

# Para development local
SUPABASE_SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY

# iFood (se usar)
IFOOD_CLIENT_ID=seu_client_id
IFOOD_CLIENT_SECRET=seu_client_secret
```

### 6.4 Configurar Autenticação

1. **Dashboard → Authentication → Providers**
2. Habilitar:
   - ✅ Email (confirmação via email)
   - ✅ Google (opcional)
   - ✅ Facebook (opcional)

3. **Email Templates**:
   - Customize: Confirm signup, Reset password, Magic Link, etc.

4. **URL Configuration**:
   - Site URL: `https://seu-dominio.com`
   - Redirect URLs: `https://seu-dominio.com/**, http://localhost:5173/**`

---

## 7. Verificação Pós-Migração

### 7.1 Checklist de Verificação

- [ ] Todas as 23 migrações executadas sem erros
- [ ] Tabelas criadas (verificar no Table Editor)
- [ ] Enums criados (`order_status`, `order_type`, `payment_status`, `courier_status`)
- [ ] Funções PostgreSQL criadas (verificar em Database → Functions)
- [ ] Triggers aplicados (verificar logs de migração)
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas RLS criadas e ativas
- [ ] Buckets de storage criados com políticas corretas
- [ ] Edge Functions deployadas
- [ ] Secrets configurados
- [ ] Types TypeScript regenerados
- [ ] Aplicação conectando corretamente ao novo Supabase

### 7.2 Testar Funcionalidades

#### Teste 1: Autenticação
```bash
# Criar uma conta de teste via aplicação
# Verificar se o usuário foi criado em auth.users
```

#### Teste 2: CRUD de Restaurante
```bash
# Criar um restaurante
# Verificar se brand foi criada automaticamente
# Verificar se owner_id está correto
```

#### Teste 3: CRUD de Produtos
```bash
# Criar categoria
# Criar produto
# Criar variações/tamanhos
# Verificar RLS (só owner deve ver)
```

#### Teste 4: Sistema de Pedidos
```bash
# Criar pedido
# Verificar order_number gerado automaticamente
# Atualizar status
# Verificar order_status_history
# Verificar atualização de customer_stats
```

#### Teste 5: Edge Functions
```bash
# Testar signup-owner
curl -X POST https://SEU_PROJECT_ID.supabase.co/functions/v1/signup-owner \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","password":"senha123","restaurantName":"Teste"}'
```

### 7.3 Monitoramento

**Dashboard → Logs**:
- Verificar erros nas queries
- Monitorar uso de API
- Verificar logs das Edge Functions

**Dashboard → Database → Extensions**:
- Verificar se `uuid-ossp` está habilitado
- Verificar se `pg_trgm` está habilitado

---

## 8. Migração de Dados (Se houver dados no antigo Supabase)

⚠️ **ATENÇÃO**: Se você tinha dados no projeto antigo e quer migrar:

### 8.1 Exportar Dados do Projeto Antigo

```bash
# Via pg_dump (se tiver acesso direto ao PostgreSQL)
pg_dump -h db.wisikawnpzrrfzqutatl.supabase.co \
  -U postgres \
  -d postgres \
  --data-only \
  --inserts \
  -t restaurants \
  -t categories \
  -t products \
  # ... adicione todas as tabelas
  > dados_antigos.sql
```

### 8.2 Importar Dados no Novo Projeto

```bash
# Via psql
psql -h db.SEU_NOVO_PROJECT_ID.supabase.co \
  -U postgres \
  -d postgres \
  < dados_antigos.sql
```

**OU via Dashboard**:
- SQL Editor → Copiar conteúdo de `dados_antigos.sql` → Run

⚠️ **Cuidado com**:
- Conflitos de UUID (se você recriar dados, os IDs mudarão)
- Foreign Keys (importar na ordem correta: restaurants → categories → products → orders)
- Timestamps (podem ser regenerados)

---

## 9. Rollback (Em caso de problemas)

Se algo der errado:

### 9.1 Resetar Banco de Dados

```bash
# Via CLI
supabase db reset
```

### 9.2 Reexecutar Migrações

Recomece do passo 3.3 deste guia.

---

## 10. Contatos e Suporte

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Community**: https://github.com/supabase/supabase/discussions
- **Supabase Status**: https://status.supabase.com

---

## 11. Resumo Executivo

### O que você tem agora:

✅ **50+ tabelas** organizadas em módulos:
- Core (restaurantes, produtos, categorias)
- Orders (pedidos completos com histórico)
- RBAC (8 roles + permissões granulares)
- Costs (ingredientes, receitas, custos)
- iFood (integração OAuth completa)
- Reviews, Analytics, Tracking

✅ **100+ políticas RLS** para segurança multi-tenant

✅ **20+ funções** e **9 triggers** para automação

✅ **9 Edge Functions** para lógica serverless

✅ **3 Buckets de Storage** com políticas públicas/privadas

✅ **4 Enums** para tipos de dados estruturados

### Próximos Passos:

1. Criar novo projeto no Supabase
2. Executar as 23 migrações em ordem
3. Popular dados iniciais (roles e permissões)
4. Configurar storage buckets
5. Deployar edge functions
6. Atualizar variáveis de ambiente
7. Regenerar types TypeScript
8. Testar todas as funcionalidades
9. (Opcional) Migrar dados do projeto antigo

---

**BOA SORTE COM A MIGRAÇÃO! 🚀**

Se tiver dúvidas, consulte a documentação oficial do Supabase ou abra uma issue no repositório.
