-- ============================================================================
-- DIAGNÓSTICO RLS - Execute para ver o estado atual
-- ============================================================================
-- Este script mostra informações sobre as políticas RLS atuais
-- ============================================================================

-- 1. Verificar se RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('brands', 'restaurants')
ORDER BY tablename;

-- 2. Listar todas as políticas atuais de BRANDS
SELECT
  schemaname,
  tablename,
  policyname as "Nome da Política",
  permissive as "Permissiva?",
  roles as "Roles",
  cmd as "Comando",
  qual as "USING",
  with_check as "WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'brands'
ORDER BY policyname;

-- 3. Listar todas as políticas atuais de RESTAURANTS
SELECT
  schemaname,
  tablename,
  policyname as "Nome da Política",
  permissive as "Permissiva?",
  roles as "Roles",
  cmd as "Comando",
  qual as "USING",
  with_check as "WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'restaurants'
ORDER BY policyname;

-- 4. Contar políticas
SELECT
  tablename,
  COUNT(*) as "Total de Políticas"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('brands', 'restaurants')
GROUP BY tablename;

-- 5. Verificar se há brands e restaurants no banco
SELECT 'Brands na tabela' as "Tipo", COUNT(*) as "Total" FROM public.brands
UNION ALL
SELECT 'Restaurants na tabela', COUNT(*) FROM public.restaurants;
