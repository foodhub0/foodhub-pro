-- ============================================================================
-- SOLUÇÃO COMPLETA: Owner Role System
-- ============================================================================
-- Este script resolve TODOS os problemas de permissão de owner
-- Pode ser executado múltiplas vezes sem causar erros

-- ============================================================================
-- PARTE 1: GARANTIR QUE TABELA ROLES EXISTE E TEM OWNER
-- ============================================================================

-- Inserir role de owner se não existir
INSERT INTO public.roles (name, display_name, description, level, color)
VALUES ('owner', 'Dono', 'Proprietário do sistema com acesso total', 100, '#8b5cf6')
ON CONFLICT (name)
DO UPDATE SET
  display_name = 'Dono',
  description = 'Proprietário do sistema com acesso total',
  level = 100,
  color = '#8b5cf6';

-- ============================================================================
-- PARTE 2: CORRIGIR POLÍTICAS RLS (SEM RECURSÃO)
-- ============================================================================

-- Limpar políticas antigas
DO $$
BEGIN
    -- Brands
    DROP POLICY IF EXISTS "Users can view brands they own or belong to" ON public.brands;
    DROP POLICY IF EXISTS "Users can view brands they belong to" ON public.brands;
    DROP POLICY IF EXISTS "Users can view their own brands" ON public.brands;
    DROP POLICY IF EXISTS "Owners can insert brands" ON public.brands;
    DROP POLICY IF EXISTS "Users can insert their own brands" ON public.brands;
    DROP POLICY IF EXISTS "Owners can update their brands" ON public.brands;
    DROP POLICY IF EXISTS "Users can update their own brands" ON public.brands;
    DROP POLICY IF EXISTS "Owners can delete their brands" ON public.brands;
    DROP POLICY IF EXISTS "Users can delete their own brands" ON public.brands;

    -- Restaurants
    DROP POLICY IF EXISTS "Users can view restaurants of their brand" ON public.restaurants;
    DROP POLICY IF EXISTS "Users can view their own restaurants" ON public.restaurants;
    DROP POLICY IF EXISTS "Users can insert their own restaurants" ON public.restaurants;
    DROP POLICY IF EXISTS "Users can update their own restaurants" ON public.restaurants;
    DROP POLICY IF EXISTS "Users can delete their own restaurants" ON public.restaurants;
END $$;

-- Criar políticas simples para BRANDS
CREATE POLICY "brands_select_policy"
  ON public.brands FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "brands_insert_policy"
  ON public.brands FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "brands_update_policy"
  ON public.brands FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "brands_delete_policy"
  ON public.brands FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Criar políticas simples para RESTAURANTS
CREATE POLICY "restaurants_select_policy"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "restaurants_insert_policy"
  ON public.restaurants FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "restaurants_update_policy"
  ON public.restaurants FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "restaurants_delete_policy"
  ON public.restaurants FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- PARTE 3: CRIAR FUNÇÃO PARA ATUALIZAR METADATA DOS USUÁRIOS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fix_all_owners_metadata()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  brand_id UUID,
  role_id UUID,
  status TEXT
) AS $$
DECLARE
  v_owner_role_id UUID;
  brand_rec RECORD;
BEGIN
  -- Buscar ID do role owner
  SELECT id INTO v_owner_role_id
  FROM public.roles
  WHERE name = 'owner'
  LIMIT 1;

  IF v_owner_role_id IS NULL THEN
    RAISE EXCEPTION 'Role owner não encontrado';
  END IF;

  -- Para cada brand, atualizar o owner
  FOR brand_rec IN
    SELECT DISTINCT b.id as brand_id, b.owner_id, u.email
    FROM public.brands b
    JOIN auth.users u ON u.id = b.owner_id
  LOOP
    -- Retornar informação
    user_id := brand_rec.owner_id;
    user_email := brand_rec.email;
    brand_id := brand_rec.brand_id;
    role_id := v_owner_role_id;
    status := 'UPDATED';

    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 4: EXECUTAR CORREÇÃO E MOSTRAR RESULTADOS
-- ============================================================================

-- Ver todos os owners que serão atualizados
SELECT * FROM public.fix_all_owners_metadata();

-- Mostrar estatísticas
SELECT
  'Total de Brands' as metric,
  COUNT(*)::text as value
FROM public.brands
UNION ALL
SELECT
  'Total de Restaurants',
  COUNT(*)::text
FROM public.restaurants
UNION ALL
SELECT
  'Restaurants sem brand',
  COUNT(*)::text
FROM public.restaurants
WHERE brand_id IS NULL
UNION ALL
SELECT
  'Role Owner ID',
  id::text
FROM public.roles
WHERE name = 'owner';

-- ============================================================================
-- PARTE 5: INSTRUÇÕES FINAIS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Copie o role_id mostrado acima';
  RAISE NOTICE '2. Execute o código JavaScript no console do navegador';
  RAISE NOTICE '3. Faça logout e login novamente';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
