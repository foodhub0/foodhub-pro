-- Migration: Complete fix for brands and RLS policies (idempotent)
-- Created: 2025-11-22
-- Description: Safe migration that can be run multiple times

-- ============================================================================
-- 1. SAFELY DROP ALL EXISTING POLICIES
-- ============================================================================

DO $$
BEGIN
    -- Drop all brand policies
    DROP POLICY IF EXISTS "Users can view brands they own or belong to" ON public.brands;
    DROP POLICY IF EXISTS "Users can view brands they belong to" ON public.brands;
    DROP POLICY IF EXISTS "Users can view their own brands" ON public.brands;
    DROP POLICY IF EXISTS "Owners can insert brands" ON public.brands;
    DROP POLICY IF EXISTS "Users can insert their own brands" ON public.brands;
    DROP POLICY IF EXISTS "Owners can update their brands" ON public.brands;
    DROP POLICY IF EXISTS "Users can update their own brands" ON public.brands;
    DROP POLICY IF EXISTS "Owners can delete their brands" ON public.brands;
    DROP POLICY IF EXISTS "Users can delete their own brands" ON public.brands;

    -- Drop all restaurant policies
    DROP POLICY IF EXISTS "Users can view restaurants of their brand" ON public.restaurants;
    DROP POLICY IF EXISTS "Users can view their own restaurants" ON public.restaurants;
    DROP POLICY IF EXISTS "Users can insert their own restaurants" ON public.restaurants;
    DROP POLICY IF EXISTS "Users can update their own restaurants" ON public.restaurants;
    DROP POLICY IF EXISTS "Users can delete their own restaurants" ON public.restaurants;

    RAISE NOTICE 'All existing policies dropped successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- ============================================================================
-- 2. CREATE SIMPLE BRAND POLICIES (NO RECURSION)
-- ============================================================================

-- SELECT policy
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
-- 3. CREATE SIMPLE RESTAURANT POLICIES (NO RECURSION)
-- ============================================================================

-- SELECT policy
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
-- 4. CREATE BRANDS FOR EXISTING RESTAURANTS
-- ============================================================================

DO $$
DECLARE
  restaurant_record RECORD;
  new_brand_id UUID;
  brands_created INTEGER := 0;
  restaurants_updated INTEGER := 0;
BEGIN
  -- Process each restaurant without brand_id
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
      BEGIN
        INSERT INTO public.brands (owner_id, name, slug)
        VALUES (
          restaurant_record.owner_id,
          restaurant_record.name,
          restaurant_record.slug
        )
        RETURNING id INTO new_brand_id;

        brands_created := brands_created + 1;
        RAISE NOTICE 'Created brand % for owner %', new_brand_id, restaurant_record.owner_id;
      EXCEPTION
        WHEN unique_violation THEN
          -- If slug already exists, try with a suffix
          INSERT INTO public.brands (owner_id, name, slug)
          VALUES (
            restaurant_record.owner_id,
            restaurant_record.name,
            restaurant_record.slug || '-' || substring(restaurant_record.id::text from 1 for 8)
          )
          RETURNING id INTO new_brand_id;

          brands_created := brands_created + 1;
          RAISE NOTICE 'Created brand % with modified slug for owner %', new_brand_id, restaurant_record.owner_id;
      END;
    END IF;

    -- Update restaurant with brand_id
    UPDATE public.restaurants
    SET brand_id = new_brand_id,
        restaurant_index = COALESCE(restaurant_index, 1)
    WHERE id = restaurant_record.id;

    restaurants_updated := restaurants_updated + 1;
  END LOOP;

  RAISE NOTICE 'Migration complete: % brands created, % restaurants updated', brands_created, restaurants_updated;
END $$;

-- ============================================================================
-- 5. VERIFY AND DISPLAY RESULTS
-- ============================================================================

DO $$
DECLARE
  with_brand INTEGER;
  without_brand INTEGER;
  total_brands INTEGER;
  total_restaurants INTEGER;
BEGIN
  SELECT COUNT(*) INTO with_brand FROM public.restaurants WHERE brand_id IS NOT NULL;
  SELECT COUNT(*) INTO without_brand FROM public.restaurants WHERE brand_id IS NULL;
  SELECT COUNT(*) INTO total_brands FROM public.brands;
  SELECT COUNT(*) INTO total_restaurants FROM public.restaurants;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '         MIGRATION RESULTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total restaurants: %', total_restaurants;
  RAISE NOTICE 'Restaurants with brand: %', with_brand;
  RAISE NOTICE 'Restaurants without brand: %', without_brand;
  RAISE NOTICE 'Total brands: %', total_brands;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  IF without_brand > 0 THEN
    RAISE WARNING 'There are still % restaurants without brand_id!', without_brand;
  ELSE
    RAISE NOTICE '✓ All restaurants have brands assigned';
  END IF;
END $$;
