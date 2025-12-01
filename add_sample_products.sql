-- Script para adicionar produtos de exemplo ao restaurante Marcelo Lanche's

-- Primeiro, vamos verificar o ID do restaurante
DO $$
DECLARE
  v_restaurant_id uuid;
  v_category_lanches uuid;
  v_category_bebidas uuid;
  v_category_porcoes uuid;
BEGIN
  -- Buscar o restaurante pelo slug
  SELECT id INTO v_restaurant_id
  FROM public.restaurants
  WHERE slug = 'marcelo-lanches' OR name ILIKE '%Marcelo Lanche%'
  LIMIT 1;

  IF v_restaurant_id IS NULL THEN
    RAISE NOTICE 'Restaurante não encontrado!';
    RETURN;
  END IF;

  RAISE NOTICE 'Restaurante ID: %', v_restaurant_id;

  -- Criar categorias
  INSERT INTO public.categories (id, restaurant_id, name, description, display_order, is_active)
  VALUES
    (gen_random_uuid(), v_restaurant_id, 'Lanches', 'Deliciosos lanches artesanais', 1, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_category_lanches;

  IF v_category_lanches IS NULL THEN
    SELECT id INTO v_category_lanches FROM public.categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Lanches' LIMIT 1;
  END IF;

  INSERT INTO public.categories (id, restaurant_id, name, description, display_order, is_active)
  VALUES
    (gen_random_uuid(), v_restaurant_id, 'Bebidas', 'Bebidas geladas e refrescantes', 2, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_category_bebidas;

  IF v_category_bebidas IS NULL THEN
    SELECT id INTO v_category_bebidas FROM public.categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Bebidas' LIMIT 1;
  END IF;

  INSERT INTO public.categories (id, restaurant_id, name, description, display_order, is_active)
  VALUES
    (gen_random_uuid(), v_restaurant_id, 'Porções', 'Porções para compartilhar', 3, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_category_porcoes;

  IF v_category_porcoes IS NULL THEN
    SELECT id INTO v_category_porcoes FROM public.categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Porções' LIMIT 1;
  END IF;

  -- Criar produtos de lanches (alguns como destaque)
  INSERT INTO public.products (restaurant_id, category_id, name, description, base_price, price, is_active, is_featured)
  VALUES
    (v_restaurant_id, v_category_lanches, 'X-Bacon Especial', 'Pão, hambúrguer artesanal 180g, queijo, bacon crocante, alface, tomate e molho especial', 25.90, 25.90, true, true),
    (v_restaurant_id, v_category_lanches, 'X-Tudo', 'Pão, hambúrguer 180g, queijo, presunto, bacon, ovo, alface, tomate, milho e batata palha', 32.90, 32.90, true, true),
    (v_restaurant_id, v_category_lanches, 'X-Salada', 'Pão, hambúrguer 150g, queijo, alface, tomate e molho especial', 18.90, 18.90, true, false),
    (v_restaurant_id, v_category_lanches, 'X-Burguer', 'Pão, hambúrguer 150g, queijo e molho especial', 15.90, 15.90, true, false),
    (v_restaurant_id, v_category_lanches, 'X-Frango', 'Pão, peito de frango grelhado, queijo, alface, tomate e maionese', 19.90, 19.90, true, false)
  ON CONFLICT DO NOTHING;

  -- Criar produtos de bebidas
  INSERT INTO public.products (restaurant_id, category_id, name, description, base_price, price, is_active, is_featured)
  VALUES
    (v_restaurant_id, v_category_bebidas, 'Coca-Cola 2L', 'Refrigerante Coca-Cola 2 litros gelada', 10.00, 10.00, true, false),
    (v_restaurant_id, v_category_bebidas, 'Guaraná Antarctica 2L', 'Refrigerante Guaraná 2 litros gelado', 9.00, 9.00, true, false),
    (v_restaurant_id, v_category_bebidas, 'Suco Natural Laranja', 'Suco de laranja natural 500ml', 8.00, 8.00, true, true),
    (v_restaurant_id, v_category_bebidas, 'Água Mineral', 'Água mineral sem gás 500ml', 3.00, 3.00, true, false)
  ON CONFLICT DO NOTHING;

  -- Criar produtos de porções
  INSERT INTO public.products (restaurant_id, category_id, name, description, base_price, price, is_active, is_featured)
  VALUES
    (v_restaurant_id, v_category_porcoes, 'Batata Frita Grande', 'Porção grande de batata frita crocante', 22.00, 22.00, true, false),
    (v_restaurant_id, v_category_porcoes, 'Onion Rings', 'Anéis de cebola empanados e fritos - 15 unidades', 18.00, 18.00, true, false),
    (v_restaurant_id, v_category_porcoes, 'Nuggets de Frango', 'Nuggets de frango crocantes - 12 unidades', 20.00, 20.00, true, false)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Produtos criados com sucesso!';
  RAISE NOTICE 'Categoria Lanches ID: %', v_category_lanches;
  RAISE NOTICE 'Categoria Bebidas ID: %', v_category_bebidas;
  RAISE NOTICE 'Categoria Porções ID: %', v_category_porcoes;

END $$;
