-- ============================================================================
-- EMERGÊNCIA: Desabilitar RLS Temporariamente
-- ============================================================================
-- ⚠️ USO TEMPORÁRIO APENAS PARA CRIAR O PRIMEIRO RESTAURANTE
-- ⚠️ REABILITAR RLS APÓS CRIAR O RESTAURANTE!
-- ============================================================================
--
-- Este script:
-- 1. Desabilita RLS temporariamente
-- 2. Permite criar restaurantes sem erro
-- 3. Depois você DEVE reabilitar com o script de reabilitação
--
-- ============================================================================

-- DESABILITAR RLS
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT
  tablename,
  rowsecurity as "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('brands', 'restaurants');

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '    ⚠️  RLS DESABILITADO  ⚠️';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. Agora você pode criar seu restaurante';
  RAISE NOTICE '2. Faça logout e login novamente';
  RAISE NOTICE '3. Crie o restaurante';
  RAISE NOTICE '4. DEPOIS execute REENABLE_RLS.sql';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: Não deixe o RLS desabilitado!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
