-- ============================================================================
-- CORREÇÃO ALTERNATIVA: Políticas RLS Simplificadas
-- ============================================================================
-- Se o primeiro script não funcionou, tente este
-- Este usa uma abordagem diferente que pode contornar problemas de subquery
-- ============================================================================

-- Passo 1: Desabilitar RLS temporariamente para limpar
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;

-- Passo 2: Remover TODAS as políticas antigas
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

-- Passo 3: Reabilitar RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Passo 4: Criar políticas SIMPLIFICADAS para BRANDS
-- Versão simplificada: apenas owner_id por enquanto
CREATE POLICY "brands_select_owner"
  ON public.brands FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "brands_insert_owner"
  ON public.brands FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "brands_update_owner"
  ON public.brands FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "brands_delete_owner"
  ON public.brands FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Passo 5: Criar políticas SIMPLIFICADAS para RESTAURANTS
CREATE POLICY "restaurants_select_owner"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "restaurants_insert_owner"
  ON public.restaurants FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "restaurants_update_owner"
  ON public.restaurants FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "restaurants_delete_owner"
  ON public.restaurants FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Passo 6: Verificar
DO $$
DECLARE
  v_brands_policies INTEGER;
  v_restaurants_policies INTEGER;
  v_brands_rls BOOLEAN;
  v_restaurants_rls BOOLEAN;
BEGIN
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
  RAISE NOTICE '    CORREÇÃO ALTERNATIVA APLICADA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS brands habilitado: %', v_brands_rls;
  RAISE NOTICE 'RLS restaurants habilitado: %', v_restaurants_rls;
  RAISE NOTICE 'Políticas de brands: %', v_brands_policies;
  RAISE NOTICE 'Políticas de restaurants: %', v_restaurants_policies;
  RAISE NOTICE '';

  IF v_brands_policies = 4 AND v_restaurants_policies = 4 AND v_brands_rls AND v_restaurants_rls THEN
    RAISE NOTICE '✓ SUCESSO! Políticas simplificadas criadas';
    RAISE NOTICE '✓ Owners podem fazer login agora';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTA: Essas são políticas simplificadas';
    RAISE NOTICE 'Apenas OWNERS podem acessar por enquanto';
    RAISE NOTICE 'Depois precisaremos adicionar políticas para não-owners';
  ELSE
    RAISE WARNING 'ATENÇÃO: Algo deu errado';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
