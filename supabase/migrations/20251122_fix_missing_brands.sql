-- Migration: Fix missing brands for existing restaurants
-- Created: 2025-11-22
-- Description: Creates brands for restaurants that don't have one and updates RLS policies

-- ============================================================================
-- 1. CREATE BRANDS FOR EXISTING RESTAURANTS WITHOUT BRAND
-- ============================================================================

-- Create brands for restaurants that don't have brand_id
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
-- 2. UPDATE RLS POLICIES TO BE MORE PERMISSIVE
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view brands they belong to" ON public.brands;

-- Create more permissive policy for SELECT
CREATE POLICY "Users can view brands they own or belong to"
  ON public.brands FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT brand_id FROM public.restaurants WHERE owner_id = auth.uid()
    )
    OR id = (SELECT (raw_user_meta_data->>'brand_id')::uuid FROM auth.users WHERE id = auth.uid())
  );

-- ============================================================================
-- 3. VERIFY AND LOG RESULTS
-- ============================================================================

-- Count restaurants with and without brand_id
DO $$
DECLARE
  with_brand INTEGER;
  without_brand INTEGER;
  total_brands INTEGER;
BEGIN
  SELECT COUNT(*) INTO with_brand FROM public.restaurants WHERE brand_id IS NOT NULL;
  SELECT COUNT(*) INTO without_brand FROM public.restaurants WHERE brand_id IS NULL;
  SELECT COUNT(*) INTO total_brands FROM public.brands;

  RAISE NOTICE 'Restaurants with brand_id: %', with_brand;
  RAISE NOTICE 'Restaurants without brand_id: %', without_brand;
  RAISE NOTICE 'Total brands: %', total_brands;
END $$;
