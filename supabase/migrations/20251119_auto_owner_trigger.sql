-- Migration: Trigger para tornar primeiro usuário Owner automaticamente
-- Criado em: 2025-11-19
-- Descrição: Cria trigger que transforma o primeiro signup em Owner

-- ============================================================================
-- 1. FUNÇÃO PARA CRIAR OWNER AUTOMATICAMENTE NO SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_role_id UUID;
  v_brand_id UUID;
  v_restaurant_id UUID;
  v_brand_name TEXT;
  v_restaurant_name TEXT;
  v_slug TEXT;
  v_user_name TEXT;
  v_brand_count INTEGER;
BEGIN
  -- Verificar se é o primeiro usuário (via contagem de brands)
  SELECT COUNT(*) INTO v_brand_count FROM public.brands;

  -- Se já existem brands, não fazer nada (usuário normal)
  IF v_brand_count > 0 THEN
    RETURN NEW;
  END IF;

  -- Obter role de owner
  SELECT id INTO v_owner_role_id FROM public.roles WHERE name = 'owner' LIMIT 1;

  IF v_owner_role_id IS NULL THEN
    RAISE EXCEPTION 'Role owner não encontrado';
  END IF;

  -- Extrair nome do email ou usar metadata
  v_user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  -- Criar slug (sem acentos, lowercase, com hifens)
  v_slug := regexp_replace(
    lower(
      translate(
        v_user_name,
        'áàâãäåāăąèéêëēĕėęěìíîïìĩīĭḿńǹñóòôõöōŏőṕŕśșšţťùúûüũūŭůűųẃẁẅỳýŷÿ',
        'aaaaaaaaaeeeeeeeeeiiiiiiiimnnnooooooooprsstttuuuuuuuuuwwwyyy'
      )
    ),
    '[^a-z0-9]+', '-', 'g'
  );
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');

  -- Criar Brand
  v_brand_name := v_user_name;

  INSERT INTO public.brands (name, slug, owner_id)
  VALUES (v_brand_name, v_slug, NEW.id)
  RETURNING id INTO v_brand_id;

  -- Criar Restaurante
  v_restaurant_name := v_brand_name || ' - Unidade 1';

  INSERT INTO public.restaurants (
    name,
    slug,
    owner_id,
    brand_id,
    restaurant_index,
    is_open
  )
  VALUES (
    v_restaurant_name,
    v_slug || '-1',
    NEW.id,
    v_brand_id,
    1,
    false
  )
  RETURNING id INTO v_restaurant_id;

  -- Atualizar metadata do usuário
  NEW.raw_user_meta_data := jsonb_build_object(
    'name', v_user_name,
    'role_id', v_owner_role_id,
    'role_name', 'owner',
    'role_color', '#8b5cf6',
    'brand_id', v_brand_id,
    'restaurant_id', v_restaurant_id,
    'is_active', true
  );

  -- Criar log de auditoria
  INSERT INTO public.audit_logs (
    user_id,
    brand_id,
    restaurant_id,
    action,
    resource_type,
    resource_id,
    new_value
  )
  VALUES (
    NEW.id,
    v_brand_id,
    v_restaurant_id,
    'auto_signup_owner',
    'user',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'role', 'owner',
      'auto_created', true
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. CRIAR TRIGGER NO SIGNUP
-- ============================================================================

-- Remover trigger se já existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger que roda ANTES de inserir o usuário
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- ============================================================================
-- 3. COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user_signup() IS
'Transforma automaticamente o primeiro usuário que se cadastra em Owner, criando Brand e Restaurante';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
'Trigger que executa handle_new_user_signup() ao criar novo usuário';

-- ============================================================================
-- 4. TESTE (Comentado - Descomente apenas para testar)
-- ============================================================================

-- Para testar, você pode:
-- 1. DELETE FROM brands; (limpa tudo)
-- 2. Fazer signup via /auth
-- 3. Verificar: SELECT * FROM brands; SELECT * FROM restaurants;
