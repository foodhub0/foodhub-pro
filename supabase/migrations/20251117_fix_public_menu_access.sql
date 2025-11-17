-- Fix RLS policy to allow public access to restaurants by slug
-- This fixes the 404 error when accessing public menus

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;

-- Create a new policy that allows viewing by slug
-- This allows the public menu to load even if the restaurant is closed
CREATE POLICY "Public can view restaurants by slug" ON restaurants
  FOR SELECT USING (slug IS NOT NULL);

-- Note: The PublicMenu component can still show a "closed" message
-- if needed, but the restaurant data will be accessible
