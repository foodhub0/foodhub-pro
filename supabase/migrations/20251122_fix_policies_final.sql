-- ============================================================================
-- MIGRAÇÃO FINAL: Corrigir políticas RLS sem duplicação
-- ============================================================================
-- Esta migração pode ser executada múltiplas vezes sem causar erros

-- ============================================================================
-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover todas as políticas de brands
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'brands' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.brands';
    END LOOP;

    -- Remover todas as políticas de restaurants
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'restaurants' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.restaurants';
    END LOOP;

    RAISE NOTICE 'Todas as políticas antigas foram removidas';
END $$;

-- ============================================================================
-- 2. CRIAR POLÍTICAS SIMPLES PARA BRANDS
-- ============================================================================

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

-- ============================================================================
-- 3. CRIAR POLÍTICAS SIMPLES PARA RESTAURANTS
-- ============================================================================

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
-- 4. GARANTIR QUE ROLE OWNER EXISTE
-- ============================================================================

INSERT INTO public.roles (name, display_name, description, level, color)
VALUES ('owner', 'Dono', 'Proprietário do sistema com acesso total', 100, '#8b5cf6')
ON CONFLICT (name)
DO UPDATE SET
  display_name = 'Dono',
  description = 'Proprietário do sistema com acesso total',
  level = 100,
  color = '#8b5cf6';

-- ============================================================================
-- 5. MOSTRAR RESULTADOS
-- ============================================================================

DO $$
DECLARE
  v_owner_role_id UUID;
  v_brands_count INTEGER;
  v_restaurants_count INTEGER;
  v_restaurants_no_brand INTEGER;
BEGIN
  -- Buscar role owner
  SELECT id INTO v_owner_role_id FROM public.roles WHERE name = 'owner';

  -- Contar dados
  SELECT COUNT(*) INTO v_brands_count FROM public.brands;
  SELECT COUNT(*) INTO v_restaurants_count FROM public.restaurants;
  SELECT COUNT(*) INTO v_restaurants_no_brand FROM public.restaurants WHERE brand_id IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRAÇÃO CONCLUÍDA ===';
  RAISE NOTICE 'Owner Role ID: %', v_owner_role_id;
  RAISE NOTICE 'Total de Brands: %', v_brands_count;
  RAISE NOTICE 'Total de Restaurants: %', v_restaurants_count;
  RAISE NOTICE 'Restaurants sem brand: %', v_restaurants_no_brand;
  RAISE NOTICE '';
  RAISE NOTICE '✓ Políticas RLS criadas com sucesso';
  RAISE NOTICE '===========================';
END $$;
