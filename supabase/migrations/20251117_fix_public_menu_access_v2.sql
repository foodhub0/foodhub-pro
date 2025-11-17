-- Fix RLS policy to allow public access to restaurants by slug
-- This fixes the 404 error when accessing public menus

-- Drop the restrictive policy that requires is_open = true
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;

-- Create a new policy that allows public viewing of any restaurant
-- The application layer can handle showing "closed" messages
CREATE POLICY "Public can view all restaurants" ON restaurants
  FOR SELECT USING (true);

-- Alternative approach: Allow viewing restaurants with a slug
-- This ensures only properly configured restaurants are accessible
-- CREATE POLICY "Public can view restaurants with slug" ON restaurants
--   FOR SELECT USING (slug IS NOT NULL AND slug != '');

-- Note: If you want to show a "closed" message instead of 404,
-- the PublicMenu component can check the is_open field and display accordingly
