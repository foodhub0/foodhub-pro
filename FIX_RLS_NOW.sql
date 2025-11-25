-- ============================================================================
-- CORREÇÃO IMEDIATA: Execute este script no Dashboard do Supabase
-- ============================================================================
-- Dashboard: https://app.supabase.com/project/wisikawnpzrrfzqutatl/sql/new
--
-- Este script corrige o problema de 403 Forbidden ao acessar brands e
-- restaurants, permitindo que:
-- 1. Owners vejam seus próprios brands/restaurants
-- 2. Usuários não-owners vejam brands/restaurants através do brand_id
-- ============================================================================

-- Passo 1: Remover TODAS as políticas antigas de brands
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'brands' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.brands';
    END LOOP;
    RAISE NOTICE 'Políticas antigas de brands removidas';
END $$;

-- Passo 2: Remover TODAS as políticas antigas de restaurants
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'restaurants' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.restaurants';
    END LOOP;
    RAISE NOTICE 'Políticas antigas de restaurants removidas';
END $$;

-- Passo 3: Criar políticas para BRANDS
-- SELECT: Owner pode ver seus brands OU usuário pode ver brand pelo metadata
CREATE POLICY "brands_select_policy"
  ON public.brands FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR id = (
      SELECT (raw_user_meta_data->>'brand_id')::uuid
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- INSERT: Apenas owners podem criar brands
CREATE POLICY "brands_insert_policy"
  ON public.brands FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Apenas owners podem atualizar
CREATE POLICY "brands_update_policy"
  ON public.brands FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: Apenas owners podem deletar
CREATE POLICY "brands_delete_policy"
  ON public.brands FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Passo 4: Criar políticas para RESTAURANTS
-- SELECT: Owner pode ver seus restaurants OU usuário pode ver pelo brand_id
CREATE POLICY "restaurants_select_policy"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR brand_id = (
      SELECT (raw_user_meta_data->>'brand_id')::uuid
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- INSERT: Apenas owners podem criar
CREATE POLICY "restaurants_insert_policy"
  ON public.restaurants FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Apenas owners podem atualizar
CREATE POLICY "restaurants_update_policy"
  ON public.restaurants FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: Apenas owners podem deletar
CREATE POLICY "restaurants_delete_policy"
  ON public.restaurants FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Passo 5: Verificar que tudo foi criado
DO $$
DECLARE
  v_brands_policies INTEGER;
  v_restaurants_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_brands_policies
  FROM pg_policies
  WHERE tablename = 'brands' AND schemaname = 'public';

  SELECT COUNT(*) INTO v_restaurants_policies
  FROM pg_policies
  WHERE tablename = 'restaurants' AND schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '         CORREÇÃO APLICADA!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Políticas de brands: %', v_brands_policies;
  RAISE NOTICE 'Políticas de restaurants: %', v_restaurants_policies;
  RAISE NOTICE '';

  IF v_brands_policies = 4 AND v_restaurants_policies = 4 THEN
    RAISE NOTICE '✓ SUCESSO! Todas as políticas foram criadas';
    RAISE NOTICE '✓ Usuários podem fazer login agora';
  ELSE
    RAISE WARNING 'ATENÇÃO: Número incorreto de políticas criadas';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
