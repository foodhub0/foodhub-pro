import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wisikawnpzrrfzqutatl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpc2lrYXducHpycmZ6cXV0YXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzE3MDksImV4cCI6MjA3ODgwNzcwOX0.WHiwj3ALHXe4tFIby8EvCadi9vWFEP_2QmII9Zydm2A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateProducts() {
  console.log('🚀 Iniciando população de produtos...\n');

  // 1. Buscar o restaurante
  console.log('📍 Buscando restaurante...');
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('id, name, slug')
    .or('slug.eq.marcelo-lanches,name.ilike.%Marcelo Lanche%')
    .limit(1)
    .single();

  if (restaurantError || !restaurant) {
    console.error('❌ Restaurante não encontrado!', restaurantError);
    return;
  }

  console.log(`✅ Restaurante encontrado: ${restaurant.name} (${restaurant.id})\n`);

  const restaurantId = restaurant.id;

  // 2. Criar categorias
  console.log('📁 Criando categorias...');

  const categories = [
    { name: 'Lanches', description: 'Deliciosos lanches artesanais', display_order: 1 },
    { name: 'Bebidas', description: 'Bebidas geladas e refrescantes', display_order: 2 },
    { name: 'Porções', description: 'Porções para compartilhar', display_order: 3 }
  ];

  const categoryIds = {};

  for (const cat of categories) {
    // Verificar se categoria já existe
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('name', cat.name)
      .single();

    if (existing) {
      console.log(`  ℹ️  Categoria "${cat.name}" já existe`);
      categoryIds[cat.name] = existing.id;
    } else {
      const { data: newCat, error } = await supabase
        .from('categories')
        .insert({
          restaurant_id: restaurantId,
          name: cat.name,
          description: cat.description,
          display_order: cat.display_order,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Erro ao criar categoria "${cat.name}":`, error);
        return;
      }

      console.log(`  ✅ Categoria "${cat.name}" criada`);
      categoryIds[cat.name] = newCat.id;
    }
  }

  console.log('\n🍔 Criando produtos...');

  // 3. Criar produtos de lanches
  const lanches = [
    { name: 'X-Bacon Especial', description: 'Pão, hambúrguer artesanal 180g, queijo, bacon crocante, alface, tomate e molho especial', price: 25.90, is_featured: true },
    { name: 'X-Tudo', description: 'Pão, hambúrguer 180g, queijo, presunto, bacon, ovo, alface, tomate, milho e batata palha', price: 32.90, is_featured: true },
    { name: 'X-Salada', description: 'Pão, hambúrguer 150g, queijo, alface, tomate e molho especial', price: 18.90, is_featured: false },
    { name: 'X-Burguer', description: 'Pão, hambúrguer 150g, queijo e molho especial', price: 15.90, is_featured: false },
    { name: 'X-Frango', description: 'Pão, peito de frango grelhado, queijo, alface, tomate e maionese', price: 19.90, is_featured: false }
  ];

  for (const product of lanches) {
    // Verificar se produto já existe
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('name', product.name)
      .single();

    if (existing) {
      console.log(`  ℹ️  Produto "${product.name}" já existe`);
    } else {
      const { error } = await supabase
        .from('products')
        .insert({
          restaurant_id: restaurantId,
          category_id: categoryIds['Lanches'],
          name: product.name,
          description: product.description,
          base_price: product.price,
          price: product.price,
          is_active: true,
          is_featured: product.is_featured
        });

      if (error) {
        console.error(`  ❌ Erro ao criar produto "${product.name}":`, error);
      } else {
        console.log(`  ✅ Produto "${product.name}" criado ${product.is_featured ? '⭐ (destaque)' : ''}`);
      }
    }
  }

  // 4. Criar produtos de bebidas
  const bebidas = [
    { name: 'Coca-Cola 2L', description: 'Refrigerante Coca-Cola 2 litros gelada', price: 10.00, is_featured: false },
    { name: 'Guaraná Antarctica 2L', description: 'Refrigerante Guaraná 2 litros gelado', price: 9.00, is_featured: false },
    { name: 'Suco Natural Laranja', description: 'Suco de laranja natural 500ml', price: 8.00, is_featured: true },
    { name: 'Água Mineral', description: 'Água mineral sem gás 500ml', price: 3.00, is_featured: false }
  ];

  for (const product of bebidas) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('name', product.name)
      .single();

    if (existing) {
      console.log(`  ℹ️  Produto "${product.name}" já existe`);
    } else {
      const { error } = await supabase
        .from('products')
        .insert({
          restaurant_id: restaurantId,
          category_id: categoryIds['Bebidas'],
          name: product.name,
          description: product.description,
          base_price: product.price,
          price: product.price,
          is_active: true,
          is_featured: product.is_featured
        });

      if (error) {
        console.error(`  ❌ Erro ao criar produto "${product.name}":`, error);
      } else {
        console.log(`  ✅ Produto "${product.name}" criado ${product.is_featured ? '⭐ (destaque)' : ''}`);
      }
    }
  }

  // 5. Criar produtos de porções
  const porcoes = [
    { name: 'Batata Frita Grande', description: 'Porção grande de batata frita crocante', price: 22.00, is_featured: false },
    { name: 'Onion Rings', description: 'Anéis de cebola empanados e fritos - 15 unidades', price: 18.00, is_featured: false },
    { name: 'Nuggets de Frango', description: 'Nuggets de frango crocantes - 12 unidades', price: 20.00, is_featured: false }
  ];

  for (const product of porcoes) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('name', product.name)
      .single();

    if (existing) {
      console.log(`  ℹ️  Produto "${product.name}" já existe`);
    } else {
      const { error } = await supabase
        .from('products')
        .insert({
          restaurant_id: restaurantId,
          category_id: categoryIds['Porções'],
          name: product.name,
          description: product.description,
          base_price: product.price,
          price: product.price,
          is_active: true,
          is_featured: product.is_featured
        });

      if (error) {
        console.error(`  ❌ Erro ao criar produto "${product.name}":`, error);
      } else {
        console.log(`  ✅ Produto "${product.name}" criado`);
      }
    }
  }

  console.log('\n✨ Processo concluído com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`  - 3 categorias criadas/verificadas`);
  console.log(`  - 12 produtos criados/verificados`);
  console.log(`  - 3 produtos marcados como destaque (⭐)`);
  console.log(`\n🌐 Acesse o cardápio em: http://localhost:8080/menu/${restaurant.slug}`);
}

populateProducts().catch(console.error);
