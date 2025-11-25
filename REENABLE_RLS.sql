-- ============================================================================
-- REABILITAR RLS - Execute após criar o restaurante
-- ============================================================================
-- Este script:
-- 1. Reabilita RLS
-- 2. Cria políticas corretas usando função PostgreSQL
-- 3. Testa se tudo está funcionando
-- ============================================================================

-- Passo 1: Criar função auxiliar
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

-- Passo 2: Limpar políticas antigas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'brands' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.brands';
    END LOOP;

    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'restaurants' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.restaurants';
    END LOOP;
END $$;

-- Passo 3: Reabilitar RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Passo 4: Criar políticas para BRANDS
CREATE POLICY "brands_select_all"
  ON public.brands FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR id = public.get_user_brand_id()
  );

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

-- Passo 5: Criar políticas para RESTAURANTS
CREATE POLICY "restaurants_select_all"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR brand_id = public.get_user_brand_id()
  );

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

-- Passo 6: Verificação
DO $$
DECLARE
  v_brands_policies INTEGER;
  v_restaurants_policies INTEGER;
  v_brands_rls BOOLEAN;
  v_restaurants_rls BOOLEAN;
  v_function_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_user_brand_id') INTO v_function_exists;
  SELECT COUNT(*) INTO v_brands_policies FROM pg_policies WHERE tablename = 'brands' AND schemaname = 'public';
  SELECT COUNT(*) INTO v_restaurants_policies FROM pg_policies WHERE tablename = 'restaurants' AND schemaname = 'public';
  SELECT rowsecurity INTO v_brands_rls FROM pg_tables WHERE tablename = 'brands' AND schemaname = 'public';
  SELECT rowsecurity INTO v_restaurants_rls FROM pg_tables WHERE tablename = 'restaurants' AND schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '       ✅ RLS REABILITADO ✅';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Função criada: %', v_function_exists;
  RAISE NOTICE 'RLS brands: %', v_brands_rls;
  RAISE NOTICE 'RLS restaurants: %', v_restaurants_rls;
  RAISE NOTICE 'Políticas brands: %', v_brands_policies;
  RAISE NOTICE 'Políticas restaurants: %', v_restaurants_policies;
  RAISE NOTICE '';

  IF v_function_exists AND v_brands_policies = 4 AND v_restaurants_policies = 4
     AND v_brands_rls AND v_restaurants_rls THEN
    RAISE NOTICE '✅ Tudo configurado corretamente!';
    RAISE NOTICE '✅ Owners e usuários podem acessar';
  ELSE
    RAISE WARNING 'Algo pode estar errado!';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
