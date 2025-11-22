-- Migration: Fix RLS policies to avoid infinite recursion
-- Created: 2025-11-22
-- Description: Simplifies RLS policies to avoid circular dependencies between brands and restaurants

-- ============================================================================
-- 1. FIX BRANDS RLS POLICIES - SIMPLE, NO RECURSION
-- ============================================================================

-- Drop all existing brand policies
DROP POLICY IF EXISTS "Users can view brands they own or belong to" ON public.brands;
DROP POLICY IF EXISTS "Users can view brands they belong to" ON public.brands;
DROP POLICY IF EXISTS "Owners can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Owners can update their brands" ON public.brands;
DROP POLICY IF EXISTS "Owners can delete their brands" ON public.brands;

-- Simple SELECT policy - only check owner_id, no subqueries
CREATE POLICY "Users can view their own brands"
  ON public.brands FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- INSERT policy
CREATE POLICY "Users can insert their own brands"
  ON public.brands FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- UPDATE policy
CREATE POLICY "Users can update their own brands"
  ON public.brands FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE policy
CREATE POLICY "Users can delete their own brands"
  ON public.brands FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- 2. FIX RESTAURANTS RLS POLICIES - SIMPLE, NO RECURSION
-- ============================================================================

-- Drop all existing restaurant policies
DROP POLICY IF EXISTS "Users can view restaurants of their brand" ON public.restaurants;
DROP POLICY IF EXISTS "Users can insert their own restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Users can update their own restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Users can delete their own restaurants" ON public.restaurants;

-- Simple SELECT policy - only check owner_id, no subqueries
CREATE POLICY "Users can view their own restaurants"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- INSERT policy
CREATE POLICY "Users can insert their own restaurants"
  ON public.restaurants FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- UPDATE policy
CREATE POLICY "Users can update their own restaurants"
  ON public.restaurants FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- DELETE policy
CREATE POLICY "Users can delete their own restaurants"
  ON public.restaurants FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================================
-- 3. CREATE BRANDS FOR EXISTING RESTAURANTS WITHOUT BRAND
-- ============================================================================

DO $$
DECLARE
  restaurant_record RECORD;
  new_brand_id UUID;
BEGIN
  FOR restaurant_record IN
    SELECT id, owner_id, name, slug
    FROM public.restaurants
    WHERE brand_id IS NULL
  LOOP
    -- Check if owner already has a brand
    SELECT id INTO new_brand_id
    FROM public.brands
    WHERE owner_id = restaurant_record.owner_id
    LIMIT 1;

    -- If owner doesn't have a brand, create one
    IF new_brand_id IS NULL THEN
      INSERT INTO public.brands (owner_id, name, slug)
      VALUES (
        restaurant_record.owner_id,
        restaurant_record.name,
        restaurant_record.slug
      )
      RETURNING id INTO new_brand_id;

      RAISE NOTICE 'Created brand % for restaurant %', new_brand_id, restaurant_record.id;
    END IF;

    -- Update restaurant with brand_id
    UPDATE public.restaurants
    SET brand_id = new_brand_id,
        restaurant_index = 1
    WHERE id = restaurant_record.id;

    RAISE NOTICE 'Updated restaurant % with brand_id %', restaurant_record.id, new_brand_id;
  END LOOP;
END $$;

-- ============================================================================
-- 4. VERIFY RESULTS
-- ============================================================================

DO $$
DECLARE
  with_brand INTEGER;
  without_brand INTEGER;
  total_brands INTEGER;
BEGIN
  SELECT COUNT(*) INTO with_brand FROM public.restaurants WHERE brand_id IS NOT NULL;
  SELECT COUNT(*) INTO without_brand FROM public.restaurants WHERE brand_id IS NULL;
  SELECT COUNT(*) INTO total_brands FROM public.brands;

  RAISE NOTICE '=== Migration Results ===';
  RAISE NOTICE 'Restaurants with brand_id: %', with_brand;
  RAISE NOTICE 'Restaurants without brand_id: %', without_brand;
  RAISE NOTICE 'Total brands: %', total_brands;
  RAISE NOTICE '========================';
END $$;
