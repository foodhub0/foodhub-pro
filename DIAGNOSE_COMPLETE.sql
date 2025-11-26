-- ============================================================================
-- DIAGNÓSTICO COMPLETO - Execute e me envie o resultado
-- ============================================================================

-- 1. Ver todos os usuários e seus metadados
SELECT
  id,
  email,
  raw_user_meta_data->>'role_name' as role,
  raw_user_meta_data->>'brand_id' as brand_id,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Ver todos os brands e seus owners
SELECT
  id,
  name,
  slug,
  owner_id,
  created_at
FROM brands
ORDER BY created_at DESC;

-- 3. Ver todos os restaurants e seus vínculos
SELECT
  r.id,
  r.name,
  r.owner_id,
  r.brand_id,
  b.name as brand_name,
  r.created_at
FROM restaurants r
LEFT JOIN brands b ON r.brand_id = b.id
ORDER BY r.created_at DESC;

-- 4. Teste de permissões - conte quantos restaurants cada owner deveria ver
SELECT
  u.email,
  u.raw_user_meta_data->>'role_name' as role,
  COUNT(r.id) as restaurants_count
FROM auth.users u
LEFT JOIN restaurants r ON (
  r.owner_id = u.id
  OR r.brand_id = (u.raw_user_meta_data->>'brand_id')::uuid
)
WHERE u.raw_user_meta_data->>'role_name' = 'owner'
GROUP BY u.id, u.email, u.raw_user_meta_data
ORDER BY u.created_at DESC;
