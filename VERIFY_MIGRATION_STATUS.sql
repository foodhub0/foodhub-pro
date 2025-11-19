-- ============================================================================
-- VERIFICATION: Check Product Restructure Migration Status
-- ============================================================================
-- Run this in Supabase SQL Editor to check if migration was applied
-- ============================================================================

-- 1. Check if new tables exist
SELECT
  'New Tables Status' AS check_type,
  CASE
    WHEN COUNT(*) = 4 THEN '✅ All 4 tables exist'
    ELSE '❌ Missing tables: ' || (4 - COUNT(*))::text
  END AS status,
  string_agg(table_name, ', ') AS tables_found
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'product_sizes',
  'product_addon_groups',
  'addon_group_items',
  'product_addon_group_links'
);

-- 2. Check if old tables were renamed
SELECT
  'Old Tables Backup Status' AS check_type,
  CASE
    WHEN COUNT(*) >= 1 THEN '✅ Old tables backed up: ' || string_agg(table_name, ', ')
    ELSE '⚠️ No old tables found (might not have existed)'
  END AS status,
  COUNT(*) AS old_tables_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'additionals_old',
  'product_additionals_old',
  'product_variations_old'
);

-- 3. Check has_sizes column on products
SELECT
  'Products Table Update' AS check_type,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'has_sizes'
    ) THEN '✅ has_sizes column exists'
    ELSE '❌ has_sizes column missing'
  END AS status;

-- 4. Check RLS policies
SELECT
  'RLS Policies' AS check_type,
  COUNT(*) AS policy_count,
  string_agg(DISTINCT tablename, ', ') AS tables_with_policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'product_sizes',
  'product_addon_groups',
  'addon_group_items',
  'product_addon_group_links'
);

-- 5. Check specific policies
SELECT
  tablename AS table_name,
  policyname AS policy_name,
  '✅ Exists' AS status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'product_sizes',
  'product_addon_groups',
  'addon_group_items',
  'product_addon_group_links'
)
ORDER BY tablename, policyname;

-- 6. Check indexes
SELECT
  'Indexes' AS check_type,
  COUNT(*) AS index_count,
  string_agg(indexname, ', ') AS indexes_found
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'product_sizes',
  'product_addon_groups',
  'addon_group_items',
  'product_addon_group_links'
);

-- 7. Check data in new tables
SELECT
  'product_sizes' AS table_name,
  COUNT(*) AS row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ Has data' ELSE '⚠️ Empty' END AS status
FROM product_sizes
UNION ALL
SELECT
  'product_addon_groups' AS table_name,
  COUNT(*) AS row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ Has data' ELSE '⚠️ Empty' END AS status
FROM product_addon_groups
UNION ALL
SELECT
  'addon_group_items' AS table_name,
  COUNT(*) AS row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ Has data' ELSE '⚠️ Empty' END AS status
FROM addon_group_items
UNION ALL
SELECT
  'product_addon_group_links' AS table_name,
  COUNT(*) AS row_count,
  CASE WHEN COUNT(*) > 0 THEN '✅ Has data' ELSE '⚠️ Empty' END AS status
FROM product_addon_group_links;

-- ============================================================================
-- CONCLUSION
-- ============================================================================

SELECT
  '🎉 MIGRATION STATUS' AS summary,
  CASE
    WHEN (
      SELECT COUNT(*) FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'product_sizes',
        'product_addon_groups',
        'addon_group_items',
        'product_addon_group_links'
      )
    ) = 4 THEN '✅ MIGRATION ALREADY APPLIED SUCCESSFULLY - No need to run again!'
    ELSE '❌ MIGRATION INCOMPLETE - Please run the migration script'
  END AS status;
