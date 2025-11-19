-- Migration: Adicionar roles Marketing e Reception + Ajustar permissões
-- Criado em: 2025-11-19
-- Descrição: Adiciona roles Marketing e Reception e ajusta permissões do Financeiro

-- ============================================================================
-- 1. ADICIONAR NOVOS ROLES
-- ============================================================================

-- Inserir novos Roles
INSERT INTO public.roles (name, display_name, description, level, color) VALUES
  ('marketing', 'Marketing', 'Acesso a análises e ferramentas de marketing', 50, '#ec4899'),
  ('reception', 'Recepção', 'Gestão de mesas, clientes e atendimento', 35, '#14b8a6')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. ADICIONAR NOVAS PERMISSÕES
-- ============================================================================

-- Inserir novas permissões necessárias
INSERT INTO public.permissions (resource, action, display_name, description, category) VALUES
  -- Clientes
  ('customers', 'create', 'Criar Clientes', 'Adicionar novos clientes', 'operational'),
  ('customers', 'read', 'Ver Clientes', 'Visualizar clientes', 'operational'),
  ('customers', 'update', 'Editar Clientes', 'Modificar clientes', 'operational'),
  ('customers', 'delete', 'Excluir Clientes', 'Remover clientes', 'operational'),

  -- Analytics
  ('analytics', 'read', 'Ver Análises', 'Acessar dashboards e análises', 'operational'),

  -- Impressões
  ('prints', 'read', 'Ver Impressões', 'Visualizar fila de impressão', 'operational'),
  ('prints', 'execute', 'Processar Impressões', 'Enviar para impressão', 'operational'),

  -- Cupons/Promoções
  ('coupons', 'create', 'Criar Cupons', 'Adicionar cupons de desconto', 'operational'),
  ('coupons', 'read', 'Ver Cupons', 'Visualizar cupons', 'operational'),
  ('coupons', 'update', 'Editar Cupons', 'Modificar cupons', 'operational'),
  ('coupons', 'delete', 'Excluir Cupons', 'Remover cupons', 'operational')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================================
-- 3. ATRIBUIR PERMISSÕES AOS NOVOS ROLES E AJUSTAR EXISTENTES
-- ============================================================================

DO $$
DECLARE
  role_financial UUID;
  role_marketing UUID;
  role_reception UUID;
  role_waiter UUID;
BEGIN
  SELECT id INTO role_financial FROM public.roles WHERE name = 'financial';
  SELECT id INTO role_marketing FROM public.roles WHERE name = 'marketing';
  SELECT id INTO role_reception FROM public.roles WHERE name = 'reception';
  SELECT id INTO role_waiter FROM public.roles WHERE name = 'waiter';

  -- ========================================
  -- FINANCEIRO: Todas métricas, custos, pedidos e análises
  -- ========================================

  -- Adicionar permissões de leitura para o Financeiro
  INSERT INTO public.role_permissions (role_id, permission_id, granted)
  SELECT role_financial, id, true FROM public.permissions
  WHERE (
    -- Todas permissões financeiras (já tem)
    category = 'financial'
    -- Métricas e relatórios
    OR (resource = 'reports' AND action = 'read')
    -- Análises
    OR (resource = 'analytics' AND action = 'read')
    -- Visualizar pedidos
    OR (resource = 'orders' AND action = 'read')
    -- Visualizar produtos para análise
    OR (resource = 'products' AND action = 'read')
    -- Visualizar clientes para análise
    OR (resource = 'customers' AND action = 'read')
    -- Auditoria (já tem)
    OR (resource = 'audit' AND action = 'read')
  )
  ON CONFLICT DO NOTHING;

  -- ========================================
  -- MARKETING: Todas análises
  -- ========================================

  INSERT INTO public.role_permissions (role_id, permission_id, granted)
  SELECT role_marketing, id, true FROM public.permissions
  WHERE (
    -- Análises
    (resource = 'analytics' AND action = 'read')
    -- Relatórios operacionais
    OR (resource = 'reports' AND action = 'read')
    -- Ver pedidos para análise
    OR (resource = 'orders' AND action = 'read')
    -- Ver clientes
    OR (resource = 'customers' AND action = 'read')
    -- Ver produtos
    OR (resource = 'products' AND action = 'read')
    -- Gerenciar cupons
    OR (resource = 'coupons')
  )
  ON CONFLICT DO NOTHING;

  -- ========================================
  -- RECEPÇÃO: Pedidos, mesas, impressões, clientes
  -- ========================================

  INSERT INTO public.role_permissions (role_id, permission_id, granted)
  SELECT role_reception, id, true FROM public.permissions
  WHERE (
    -- Pedidos (criar, ver, atualizar)
    (resource = 'orders' AND action IN ('create', 'read', 'update', 'execute'))
    -- Mesas (todas)
    OR (resource = 'tables')
    -- Impressões
    OR (resource = 'prints')
    -- Clientes (todas)
    OR (resource = 'customers')
  )
  ON CONFLICT DO NOTHING;

  -- ========================================
  -- GARÇOM: Adicionar permissões de clientes e mesas
  -- ========================================

  -- Adicionar permissão para gerenciar mesas ao garçom
  INSERT INTO public.role_permissions (role_id, permission_id, granted)
  SELECT role_waiter, id, true FROM public.permissions
  WHERE (
    -- Mesas (criar, ver, atualizar)
    (resource = 'tables' AND action IN ('create', 'read', 'update'))
    -- Clientes (criar, ver para vincular pedidos)
    OR (resource = 'customers' AND action IN ('create', 'read'))
  )
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.roles IS 'Sistema de roles agora inclui Marketing e Recepção';
