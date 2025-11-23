-- Corrigir RLS para permitir acesso a todos os usuários da marca (não apenas owner)
-- Data: 2025-11-23

-- Remover políticas antigas que só permitem owner
DROP POLICY IF EXISTS "brands_select_policy" ON public.brands;
DROP POLICY IF EXISTS "brands_insert_policy" ON public.brands;
DROP POLICY IF EXISTS "brands_update_policy" ON public.brands;
DROP POLICY IF EXISTS "brands_delete_policy" ON public.brands;

DROP POLICY IF EXISTS "restaurants_select_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_insert_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_update_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_delete_policy" ON public.restaurants;

-- Criar função para obter brand_id do usuário atual
CREATE OR REPLACE FUNCTION auth.get_user_brand_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt()->>'user_metadata')::jsonb->>'brand_id',
    NULL
  )::uuid;
$$;

-- Políticas para BRANDS - permite acesso baseado no brand_id do metadata
CREATE POLICY "brands_select_for_brand_users"
  ON public.brands FOR SELECT
  TO authenticated
  USING (
    id = auth.get_user_brand_id() OR
    owner_id = auth.uid()
  );

CREATE POLICY "brands_insert_for_owners"
  ON public.brands FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "brands_update_for_brand_users"
  ON public.brands FOR UPDATE
  TO authenticated
  USING (
    id = auth.get_user_brand_id() OR
    owner_id = auth.uid()
  )
  WITH CHECK (
    id = auth.get_user_brand_id() OR
    owner_id = auth.uid()
  );

CREATE POLICY "brands_delete_for_owners"
  ON public.brands FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Políticas para RESTAURANTS - permite acesso a todos da marca
CREATE POLICY "restaurants_select_for_brand_users"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (
    brand_id = auth.get_user_brand_id() OR
    owner_id = auth.uid()
  );

CREATE POLICY "restaurants_insert_for_brand_users"
  ON public.restaurants FOR INSERT
  TO authenticated
  WITH CHECK (
    brand_id = auth.get_user_brand_id() OR
    owner_id = auth.uid()
  );

CREATE POLICY "restaurants_update_for_brand_users"
  ON public.restaurants FOR UPDATE
  TO authenticated
  USING (
    brand_id = auth.get_user_brand_id() OR
    owner_id = auth.uid()
  )
  WITH CHECK (
    brand_id = auth.get_user_brand_id() OR
    owner_id = auth.uid()
  );

CREATE POLICY "restaurants_delete_for_owners"
  ON public.restaurants FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Comentários
COMMENT ON FUNCTION auth.get_user_brand_id() IS 'Retorna o brand_id do metadata do usuário autenticado';
COMMENT ON POLICY "brands_select_for_brand_users" ON public.brands IS 'Permite que todos os usuários da marca vejam a brand';
COMMENT ON POLICY "restaurants_select_for_brand_users" ON public.restaurants IS 'Permite que todos os usuários da marca vejam os restaurantes';
