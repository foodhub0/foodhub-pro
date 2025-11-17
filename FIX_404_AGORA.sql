-- ============================================
-- EXECUTE ISTO NO SUPABASE PARA CORRIGIR O 404
-- ============================================
--
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql
-- 2. Cole TUDO abaixo
-- 3. Clique em RUN (ou Ctrl+Enter)
-- ============================================

-- Remover política restritiva
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;

-- Criar nova política que permite acesso público
CREATE POLICY "Public can view all restaurants" ON restaurants
  FOR SELECT USING (true);

-- Verificar se funcionou
SELECT
  'Política aplicada com sucesso!' as status,
  COUNT(*) as total_restaurantes
FROM restaurants;
