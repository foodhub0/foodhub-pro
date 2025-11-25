-- ============================================================================
-- MIGRAÇÃO: Corrigir RLS para permitir acesso de usuários não-owners
-- ============================================================================
-- Data: 2025-11-25
-- Descrição: Restaura políticas RLS que permitem usuários verem brands e
--            restaurants aos quais pertencem através do brand_id no metadata
--
-- Problema: Usuários criados por owners não conseguem fazer login porque
--           as políticas RLS atuais só permitem acesso baseado em owner_id
--
-- Solução: Atualizar políticas para verificar brand_id no metadata do usuário
-- ============================================================================

-- ============================================================================
-- 1. REMOVER POLÍTICAS EXISTENTES DE BRANDS
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

    RAISE NOTICE 'Políticas antigas de brands removidas';
END $$;

-- ============================================================================
-- 2. CRIAR NOVAS POLÍTICAS PARA BRANDS
-- ============================================================================

-- SELECT: Usuários podem ver brands onde são owners OU onde brand_id está no metadata
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

-- UPDATE: Apenas owners podem atualizar brands
CREATE POLICY "brands_update_policy"
  ON public.brands FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: Apenas owners podem deletar brands
CREATE POLICY "brands_delete_policy"
  ON public.brands FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- 3. REMOVER POLÍTICAS EXISTENTES DE RESTAURANTS
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover todas as políticas de restaurants
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'restaurants' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.restaurants';
    END LOOP;

    RAISE NOTICE 'Políticas antigas de restaurants removidas';
END $$;

-- ============================================================================
-- 4. CRIAR NOVAS POLÍTICAS PARA RESTAURANTS
-- ============================================================================

-- SELECT: Usuários podem ver restaurants onde são owners OU onde brand_id corresponde ao metadata
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

-- INSERT: Apenas owners podem criar restaurants
CREATE POLICY "restaurants_insert_policy"
  ON public.restaurants FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- UPDATE: Apenas owners podem atualizar restaurants
CREATE POLICY "restaurants_update_policy"
  ON public.restaurants FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE: Apenas owners podem deletar restaurants
CREATE POLICY "restaurants_delete_policy"
  ON public.restaurants FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- 5. VERIFICAÇÃO E LOG
-- ============================================================================

DO $$
DECLARE
  v_brands_policies INTEGER;
  v_restaurants_policies INTEGER;
BEGIN
  -- Contar políticas criadas
  SELECT COUNT(*) INTO v_brands_policies
  FROM pg_policies
  WHERE tablename = 'brands' AND schemaname = 'public';

  SELECT COUNT(*) INTO v_restaurants_policies
  FROM pg_policies
  WHERE tablename = 'restaurants' AND schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '   MIGRAÇÃO CONCLUÍDA COM SUCESSO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Políticas de brands criadas: %', v_brands_policies;
  RAISE NOTICE 'Políticas de restaurants criadas: %', v_restaurants_policies;
  RAISE NOTICE '';
  RAISE NOTICE '✓ Usuários não-owners agora podem acessar';
  RAISE NOTICE '  brands e restaurants através do brand_id';
  RAISE NOTICE '  armazenado em seus metadados';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
