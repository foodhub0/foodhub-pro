-- Migration: Sistema RBAC Multi-Restaurante
-- Criado em: 2025-11-19
-- Descrição: Tabelas para gerenciamento de marcas, perfis, permissões e auditoria

-- ============================================================================
-- 1. TABELA DE MARCAS (BRANDS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_owner ON public.brands(owner_id);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON public.brands(slug);

COMMENT ON TABLE public.brands IS 'Marcas/Grupos de restaurantes';

-- ============================================================================
-- 2. ATUALIZAR TABELA RESTAURANTS
-- ============================================================================
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE;

ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS restaurant_index INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_restaurants_brand ON public.restaurants(brand_id);

COMMENT ON COLUMN public.restaurants.brand_id IS 'Marca/Grupo ao qual o restaurante pertence';
COMMENT ON COLUMN public.restaurants.restaurant_index IS 'Número sequencial da unidade (1-20)';

-- ============================================================================
-- 3. TABELA DE PERFIS/ROLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- 'owner', 'manager', 'financial', 'waiter', 'cashier', 'kitchen'
  display_name TEXT NOT NULL, -- 'Dono', 'Gerente', 'Financeiro', etc
  description TEXT,
  level INTEGER NOT NULL, -- Hierarquia: 100=owner, 80=manager, 60=financial, 40=waiter, 30=cashier, 20=kitchen
  color TEXT, -- Cor do badge (hex)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_level ON public.roles(level);

COMMENT ON TABLE public.roles IS 'Perfis de usuário do sistema';

-- ============================================================================
-- 4. TABELA DE PERMISSÕES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL, -- 'orders', 'products', 'reports', 'users', 'kitchen', 'payments', etc
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'execute'
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'operational', 'financial', 'administrative'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource, action)
);

CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);

COMMENT ON TABLE public.permissions IS 'Permissões granulares do sistema';

-- ============================================================================
-- 5. TABELA DE PERMISSÕES POR PERFIL
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);

COMMENT ON TABLE public.role_permissions IS 'Relacionamento entre perfis e permissões';

-- ============================================================================
-- 6. TABELA DE OVERRIDES DE PERMISSÕES POR USUÁRIO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  PRIMARY KEY (user_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_overrides_user ON public.user_permission_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_overrides_permission ON public.user_permission_overrides(permission_id);

COMMENT ON TABLE public.user_permission_overrides IS 'Permissões personalizadas por usuário (override do RBAC)';

-- ============================================================================
-- 7. TABELA DE LOGS DE AUDITORIA
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'create_user', 'edit_menu', 'change_order_status', etc
  resource_type TEXT, -- 'user', 'product', 'order', 'setting', etc
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant ON public.audit_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_brand ON public.audit_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

COMMENT ON TABLE public.audit_logs IS 'Registro de auditoria de todas as ações do sistema';

-- ============================================================================
-- 8. FUNÇÃO PARA ATUALIZAR updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para brands
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view brands they belong to"
  ON public.brands FOR SELECT
  TO authenticated
  USING (
    id = (SELECT (raw_user_meta_data->>'brand_id')::uuid FROM auth.users WHERE id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Owners can insert brands"
  ON public.brands FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their brands"
  ON public.brands FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their brands"
  ON public.brands FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Restaurants (atualizar para incluir brand_id)
DROP POLICY IF EXISTS "Users can view restaurants of their brand" ON public.restaurants;
CREATE POLICY "Users can view restaurants of their brand"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (
    brand_id = (SELECT (raw_user_meta_data->>'brand_id')::uuid FROM auth.users WHERE id = auth.uid())
    OR owner_id = auth.uid()
  );

-- Roles (público para leitura)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

-- Permissions (público para leitura)
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

-- Role Permissions (público para leitura)
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- User Permission Overrides
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own overrides"
  ON public.user_permission_overrides FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owners can view all overrides in their brand"
  ON public.user_permission_overrides FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role_name') = 'owner'
      AND (raw_user_meta_data->>'brand_id') = (
        SELECT raw_user_meta_data->>'brand_id' FROM auth.users WHERE id = user_permission_overrides.user_id
      )
    )
  );

CREATE POLICY "Owners can manage overrides"
  ON public.user_permission_overrides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role_name') = 'owner'
    )
  );

-- Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs of their brand"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    brand_id = (SELECT (raw_user_meta_data->>'brand_id')::uuid FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Anyone can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 10. SEED DE DADOS INICIAIS
-- ============================================================================

-- Inserir Roles padrão
INSERT INTO public.roles (name, display_name, description, level, color) VALUES
  ('owner', 'Dono', 'Acesso total a todos os restaurantes da marca', 100, '#8b5cf6'),
  ('manager', 'Gerente', 'Gestão completa de uma unidade específica', 80, '#2563eb'),
  ('financial', 'Financeiro', 'Acesso a relatórios financeiros e pagamentos', 60, '#10b981'),
  ('waiter', 'Garçom', 'Anotação de pedidos e visualização de mesas', 40, '#f59e0b'),
  ('cashier', 'Caixa', 'Registro de pedidos, pagamentos e fechamento de comandas', 30, '#06b6d4'),
  ('kitchen', 'Cozinha', 'Visualização e atualização de status de pedidos', 20, '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- Inserir Permissões padrão
INSERT INTO public.permissions (resource, action, display_name, description, category) VALUES
  -- Pedidos
  ('orders', 'create', 'Criar Pedidos', 'Registrar novos pedidos', 'operational'),
  ('orders', 'read', 'Ver Pedidos', 'Visualizar pedidos', 'operational'),
  ('orders', 'update', 'Editar Pedidos', 'Modificar pedidos existentes', 'operational'),
  ('orders', 'delete', 'Excluir Pedidos', 'Remover pedidos', 'operational'),
  ('orders', 'execute', 'Processar Pedidos', 'Alterar status dos pedidos', 'operational'),

  -- Produtos
  ('products', 'create', 'Criar Produtos', 'Adicionar produtos ao cardápio', 'operational'),
  ('products', 'read', 'Ver Produtos', 'Visualizar produtos', 'operational'),
  ('products', 'update', 'Editar Produtos', 'Modificar produtos', 'operational'),
  ('products', 'delete', 'Excluir Produtos', 'Remover produtos', 'operational'),

  -- Categorias
  ('categories', 'create', 'Criar Categorias', 'Adicionar categorias', 'operational'),
  ('categories', 'read', 'Ver Categorias', 'Visualizar categorias', 'operational'),
  ('categories', 'update', 'Editar Categorias', 'Modificar categorias', 'operational'),
  ('categories', 'delete', 'Excluir Categorias', 'Remover categorias', 'operational'),

  -- Relatórios
  ('reports', 'read', 'Ver Relatórios Operacionais', 'Acessar relatórios gerais', 'operational'),
  ('financial_reports', 'read', 'Ver Relatórios Financeiros', 'Acessar relatórios financeiros detalhados', 'financial'),

  -- Pagamentos
  ('payments', 'create', 'Processar Pagamentos', 'Registrar pagamentos', 'financial'),
  ('payments', 'read', 'Ver Pagamentos', 'Visualizar histórico de pagamentos', 'financial'),

  -- Custos
  ('costs', 'create', 'Registrar Custos', 'Adicionar custos operacionais', 'financial'),
  ('costs', 'read', 'Ver Custos', 'Visualizar custos', 'financial'),
  ('costs', 'update', 'Editar Custos', 'Modificar custos', 'financial'),
  ('costs', 'delete', 'Excluir Custos', 'Remover custos', 'financial'),

  -- Usuários
  ('users', 'create', 'Criar Usuários', 'Adicionar novos usuários', 'administrative'),
  ('users', 'read', 'Ver Usuários', 'Visualizar usuários', 'administrative'),
  ('users', 'update', 'Editar Usuários', 'Modificar usuários', 'administrative'),
  ('users', 'delete', 'Excluir Usuários', 'Remover usuários', 'administrative'),
  ('users', 'execute', 'Gerenciar Permissões', 'Alterar permissões de usuários', 'administrative'),

  -- Mesas
  ('tables', 'create', 'Criar Mesas', 'Adicionar mesas', 'operational'),
  ('tables', 'read', 'Ver Mesas', 'Visualizar mesas', 'operational'),
  ('tables', 'update', 'Editar Mesas', 'Modificar mesas', 'operational'),
  ('tables', 'delete', 'Excluir Mesas', 'Remover mesas', 'operational'),

  -- Cozinha
  ('kitchen', 'read', 'Ver Tela da Cozinha', 'Acessar visualização da cozinha', 'operational'),
  ('kitchen', 'execute', 'Processar Pedidos na Cozinha', 'Atualizar status dos pedidos', 'operational'),

  -- Configurações
  ('settings', 'read', 'Ver Configurações', 'Visualizar configurações', 'administrative'),
  ('settings', 'update', 'Editar Configurações', 'Modificar configurações', 'administrative'),

  -- Marca
  ('brand', 'read', 'Ver Dashboard da Marca', 'Acessar visão consolidada', 'administrative'),
  ('brand', 'update', 'Editar Configurações da Marca', 'Modificar settings da marca', 'administrative'),

  -- Auditoria
  ('audit', 'read', 'Ver Logs de Auditoria', 'Acessar histórico de ações', 'administrative')
ON CONFLICT (resource, action) DO NOTHING;

-- Atribuir permissões aos perfis
DO $$
DECLARE
  role_owner UUID;
  role_manager UUID;
  role_financial UUID;
  role_waiter UUID;
  role_cashier UUID;
  role_kitchen UUID;
BEGIN
  SELECT id INTO role_owner FROM public.roles WHERE name = 'owner';
  SELECT id INTO role_manager FROM public.roles WHERE name = 'manager';
  SELECT id INTO role_financial FROM public.roles WHERE name = 'financial';
  SELECT id INTO role_waiter FROM public.roles WHERE name = 'waiter';
  SELECT id INTO role_cashier FROM public.roles WHERE name = 'cashier';
  SELECT id INTO role_kitchen FROM public.roles WHERE name = 'kitchen';

  -- Owner tem TODAS as permissões
  INSERT INTO public.role_permissions (role_id, permission_id, granted)
  SELECT role_owner, id, true FROM public.permissions
  ON CONFLICT DO NOTHING;

  -- Manager: operacional + relatórios básicos
  INSERT INTO public.role_permissions (role_id, permission_id, granted)
  SELECT role_manager, id, true FROM public.permissions
  WHERE category IN ('operational', 'administrative')
    AND resource NOT IN ('brand', 'financial_reports')
  ON CONFLICT DO NOTHING;

  -- Financial: apenas financeiro + auditoria
  INSERT INTO public.role_permissions (role_id, permission_id, granted)
  SELECT role_financial, id, true FROM public.permissions
  WHERE category = 'financial'
    OR (resource = 'audit' AND action = 'read')
  ON CONFLICT DO NOTHING;

  -- Waiter: pedidos, mesas
  INSERT INTO public.role_permissions (role_id, permission_id, granted)
  SELECT role_waiter, id, true FROM public.permissions
  WHERE resource IN ('orders', 'tables')
    AND action IN ('create', 'read', 'execute')
  ON CONFLICT DO NOTHING;

  -- Cashier: pedidos, pagamentos
  INSERT INTO public.role_permissions (role_id, permission_id, granted)
  SELECT role_cashier, id, true FROM public.permissions
  WHERE resource IN ('orders', 'payments')
    AND action IN ('create', 'read', 'execute')
  ON CONFLICT DO NOTHING;

  -- Kitchen: apenas cozinha
  INSERT INTO public.role_permissions (role_id, permission_id, granted)
  SELECT role_kitchen, id, true FROM public.permissions
  WHERE resource = 'kitchen'
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================
COMMENT ON DATABASE postgres IS 'FoodHub Pro - Sistema RBAC Multi-Restaurante implementado';
