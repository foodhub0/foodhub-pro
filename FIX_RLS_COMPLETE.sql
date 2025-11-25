-- ============================================================================
-- CORREÇÃO DEFINITIVA RLS - Execute este script
-- ============================================================================
-- Este script resolve:
-- 1. Owners não conseguem criar/ver restaurantes (erro 403/406)
-- 2. Garçons/managers não conseguem ver restaurantes (erro 406)
-- 3. Usa funções PostgreSQL ao invés de subqueries problemáticas
-- ============================================================================

-- Passo 1: Criar função auxiliar para pegar brand_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_brand_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (raw_user_meta_data->>'brand_id')::uuid
  FROM auth.users
  WHERE id = auth.uid();
$$;

-- Passo 2: Desabilitar RLS temporariamente
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;

-- Passo 3: Remover TODAS as políticas antigas
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Brands
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'brands' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.brands';
    END LOOP;

    -- Restaurants
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'restaurants' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.restaurants';
    END LOOP;

    RAISE NOTICE 'Todas as políticas antigas foram removidas';
END $$;

-- Passo 4: Reabilitar RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Passo 5: Criar políticas para BRANDS usando função
-- ============================================================================

-- SELECT: Owner OU usuário com brand_id no metadata
CREATE POLICY "brands_select_all_users"
  ON public.brands FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR id = public.get_user_brand_id()
  );

-- INSERT: Apenas owners
CREATE POLICY "brands_insert_owner"
  ON public.brands FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Apenas owners
CREATE POLICY "brands_update_owner"
  ON public.brands FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: Apenas owners
CREATE POLICY "brands_delete_owner"
  ON public.brands FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- Passo 6: Criar políticas para RESTAURANTS usando função
-- ============================================================================

-- SELECT: Owner OU usuário com brand_id correspondente
CREATE POLICY "restaurants_select_all_users"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR brand_id = public.get_user_brand_id()
  );

-- INSERT: Apenas owners
CREATE POLICY "restaurants_insert_owner"
  ON public.restaurants FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Apenas owners
CREATE POLICY "restaurants_update_owner"
  ON public.restaurants FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: Apenas owners
CREATE POLICY "restaurants_delete_owner"
  ON public.restaurants FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- Passo 7: Verificação final
-- ============================================================================

DO $$
DECLARE
  v_brands_policies INTEGER;
  v_restaurants_policies INTEGER;
  v_brands_rls BOOLEAN;
  v_restaurants_rls BOOLEAN;
  v_function_exists BOOLEAN;
BEGIN
  -- Verificar função
  SELECT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'get_user_brand_id'
  ) INTO v_function_exists;

  -- Contar políticas
  SELECT COUNT(*) INTO v_brands_policies
  FROM pg_policies
  WHERE tablename = 'brands' AND schemaname = 'public';

  SELECT COUNT(*) INTO v_restaurants_policies
  FROM pg_policies
  WHERE tablename = 'restaurants' AND schemaname = 'public';

  -- Verificar RLS
  SELECT rowsecurity INTO v_brands_rls
  FROM pg_tables
  WHERE tablename = 'brands' AND schemaname = 'public';

  SELECT rowsecurity INTO v_restaurants_rls
  FROM pg_tables
  WHERE tablename = 'restaurants' AND schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '      CORREÇÃO DEFINITIVA APLICADA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Função auxiliar criada: %', v_function_exists;
  RAISE NOTICE 'RLS brands habilitado: %', v_brands_rls;
  RAISE NOTICE 'RLS restaurants habilitado: %', v_restaurants_rls;
  RAISE NOTICE 'Políticas de brands: %', v_brands_policies;
  RAISE NOTICE 'Políticas de restaurants: %', v_restaurants_policies;
  RAISE NOTICE '';

  IF v_function_exists AND v_brands_policies = 4 AND v_restaurants_policies = 4
     AND v_brands_rls AND v_restaurants_rls THEN
    RAISE NOTICE '✅ SUCESSO COMPLETO!';
    RAISE NOTICE '✅ Owners podem criar/ver restaurantes';
    RAISE NOTICE '✅ Garçons/managers podem ver restaurantes';
    RAISE NOTICE '✅ Políticas funcionando para TODOS os usuários';
  ELSE
    RAISE WARNING 'ATENÇÃO: Algo pode estar incorreto';
    RAISE WARNING 'Função: %, Brands RLS: %, Restaurants RLS: %',
      v_function_exists, v_brands_rls, v_restaurants_rls;
    RAISE WARNING 'Políticas brands: %, Políticas restaurants: %',
      v_brands_policies, v_restaurants_policies;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- Passo 8: Testar a função
-- ============================================================================

-- Teste: Mostrar o brand_id do usuário atual
SELECT
  auth.uid() as "Meu User ID",
  public.get_user_brand_id() as "Meu Brand ID";
