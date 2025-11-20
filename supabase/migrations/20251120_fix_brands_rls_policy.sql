-- ============================================================================
-- Fix brands RLS policy to allow users to view their brands
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view brands they belong to" ON public.brands;

-- Create improved policy that checks multiple ways
CREATE POLICY "Users can view brands they belong to"
  ON public.brands FOR SELECT
  TO authenticated
  USING (
    -- Check if user owns this brand
    owner_id = auth.uid()
    OR
    -- Check if user's metadata contains this brand_id
    id::text = (auth.jwt()->>'brand_id')
    OR
    -- Check if user owns any restaurant that belongs to this brand
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.brand_id = brands.id
      AND r.owner_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON POLICY "Users can view brands they belong to" ON public.brands IS
  'Allows users to view brands they own, brands in their metadata, or brands of restaurants they own';
