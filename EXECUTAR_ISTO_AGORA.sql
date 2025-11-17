-- ═══════════════════════════════════════════════════════════════
-- EXECUTE ISTO AGORA NO SUPABASE (2 segundos)
-- ═══════════════════════════════════════════════════════════════
--
-- Link direto: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql
--
-- Cole TUDO abaixo e clique em RUN
-- ═══════════════════════════════════════════════════════════════

-- REMOVER POLÍTICA ANTIGA
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;

-- CRIAR POLÍTICA NOVA (PERMITE ACESSO PÚBLICO)
CREATE POLICY "Public can view all restaurants" ON restaurants
  FOR SELECT USING (true);

-- VERIFICAR SE FUNCIONOU
SELECT
  '✅ CORRIGIDO! Acesse agora:' as status,
  'https://foodhub-idsb2hnel-marcelos-projects-1cb1a1ac.vercel.app/m/' || slug as url_producao
FROM restaurants
WHERE slug = 'pepperspizza';
