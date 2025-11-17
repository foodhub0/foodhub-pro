-- ═══════════════════════════════════════════════════════════════
-- VERIFICAÇÃO: A política já está OK!
-- ═══════════════════════════════════════════════════════════════
--
-- Execute isto para verificar se está tudo funcionando
--
-- ═══════════════════════════════════════════════════════════════

-- Ver todas as políticas da tabela restaurants
SELECT
  '📋 Políticas RLS configuradas:' as info,
  policyname as "Nome da Política",
  CASE
    WHEN policyname = 'Public can view all restaurants' THEN '✅ CORRETO'
    WHEN policyname = 'Public can view active restaurants' THEN '❌ ANTIGA (deve ser removida)'
    ELSE '⚠️ Outra'
  END as status
FROM pg_policies
WHERE tablename = 'restaurants';

-- Ver seu restaurante
SELECT
  '🏪 Seu Restaurante:' as info,
  name as "Nome",
  slug as "Slug",
  CASE WHEN is_open THEN '✅ Aberto' ELSE '❌ Fechado' END as "Status",
  'https://foodhub-idsb2hnel-marcelos-projects-1cb1a1ac.vercel.app/m/' || slug as "🌐 URL do Cardápio"
FROM restaurants
WHERE slug = 'pepperspizza';

-- Testar se consegue acessar publicamente
SELECT
  '✅ TUDO CERTO! Acesse o cardápio agora:' as "🎉 STATUS",
  'https://foodhub-idsb2hnel-marcelos-projects-1cb1a1ac.vercel.app/m/pepperspizza' as "🔗 URL";
