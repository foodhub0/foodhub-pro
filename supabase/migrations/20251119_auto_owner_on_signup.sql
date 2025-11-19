-- Migration: Sistema de Auto-Owner via Webhook/Function
-- Criado em: 2025-11-19
-- Descrição: Cria função que pode ser chamada após signup para tornar primeiro usuário Owner

-- ============================================================================
-- 1. FUNÇÃO PARA PROCESSAR NOVO USUÁRIO E TORNAR OWNER SE FOR O PRIMEIRO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_new_user_as_owner(user_id UUID, user_email TEXT, user_name TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_owner_role_id UUID;
  v_brand_id UUID;
  v_restaurant_id UUID;
  v_brand_name TEXT;
  v_restaurant_name TEXT;
  v_slug TEXT;
  v_final_name TEXT;
  v_brand_count INTEGER;
  v_result JSONB;
BEGIN
  -- Verificar se é o primeiro usuário (via contagem de brands)
  SELECT COUNT(*) INTO v_brand_count FROM public.brands;

  -- Se já existem brands, retornar erro
  IF v_brand_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Já existe um proprietário cadastrado. Entre em contato com o administrador para criar sua conta.',
      'is_owner', false
    );
  END IF;

  -- Obter role de owner
  SELECT id INTO v_owner_role_id FROM public.roles WHERE name = 'owner' LIMIT 1;

  IF v_owner_role_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Role owner não encontrado no sistema',
      'is_owner', false
    );
  END IF;

  -- Definir nome do usuário
  v_final_name := COALESCE(user_name, split_part(user_email, '@', 1));

  -- Criar slug (sem acentos, lowercase, com hifens)
  v_slug := regexp_replace(
    lower(
      translate(
        v_final_name,
        'áàâãäåāăąèéêëēĕėęěìíîïìĩīĭḿńǹñóòôõöōŏőṕŕśșšţťùúûüũūŭůűųẃẁẅỳýŷÿ',
        'aaaaaaaaaeeeeeeeeeiiiiiiiimnnnooooooooprsstttuuuuuuuuuwwwyyy'
      )
    ),
    '[^a-z0-9]+', '-', 'g'
  );
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');

  -- Criar Brand
  v_brand_name := v_final_name;

  INSERT INTO public.brands (name, slug, owner_id)
  VALUES (v_brand_name, v_slug, user_id)
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
    user_id,
    v_brand_id,
    1,
    false
  )
  RETURNING id INTO v_restaurant_id;

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
    user_id,
    v_brand_id,
    v_restaurant_id,
    'auto_signup_owner',
    'user',
    user_id,
    jsonb_build_object(
      'email', user_email,
      'role', 'owner',
      'auto_created', true
    )
  );

  -- Retornar resultado de sucesso com IDs
  RETURN jsonb_build_object(
    'success', true,
    'is_owner', true,
    'role_id', v_owner_role_id,
    'brand_id', v_brand_id,
    'restaurant_id', v_restaurant_id,
    'role_name', 'owner',
    'role_color', '#8b5cf6',
    'message', 'Você é o proprietário do sistema!'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'is_owner', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão para usuários autenticados chamarem a função
GRANT EXECUTE ON FUNCTION public.process_new_user_as_owner(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION public.process_new_user_as_owner(UUID, TEXT, TEXT) IS
'Processa novo usuário e o torna Owner se for o primeiro do sistema. Retorna JSON com resultado.';

-- ============================================================================
-- EXEMPLO DE USO
-- ============================================================================

-- Esta função deve ser chamada após o signup, por exemplo:
-- SELECT public.process_new_user_as_owner(auth.uid(), auth.email(), 'Nome do Usuário');
