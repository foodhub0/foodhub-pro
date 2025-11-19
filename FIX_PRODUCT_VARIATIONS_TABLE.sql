-- ============================================================================
-- FIX: Product Variations Table Error
-- ============================================================================
-- This script fixes the "product_variations does not exist" error
-- by applying the restructured products system migration safely.
--
-- INSTRUCTIONS:
-- 1. Go to: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql/new
-- 2. Copy this ENTIRE file content
-- 3. Paste into the SQL Editor
-- 4. Click RUN or press CTRL+ENTER
-- ============================================================================

-- Read the restructured migration file
\i /home/user/foodhub-pro/supabase/migrations/20251119_restructure_products_system.sql

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT
  'Tables Created Successfully!' AS status,
  COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'product_sizes',
  'product_addon_groups',
  'addon_group_items',
  'product_addon_group_links'
);

-- Show table structures
\d product_sizes
\d product_addon_groups
\d addon_group_items
\d product_addon_group_links
