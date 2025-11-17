#!/usr/bin/env node

/**
 * Script para verificar slugs dos restaurantes no Supabase
 *
 * USO:
 * node check-slug.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que .env existe com:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 Buscando restaurantes...\n');

async function checkSlugs() {
  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('id, name, slug, is_open, owner_id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar restaurantes:', error.message);

      if (error.message.includes('JWT') || error.message.includes('RLS')) {
        console.error('\n⚠️  POSSÍVEL PROBLEMA:');
        console.error('A política RLS está bloqueando o acesso.');
        console.error('\nSOLUÇÃO: Execute este SQL no Supabase:');
        console.error('─'.repeat(60));
        console.error('DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;');
        console.error('CREATE POLICY "Public can view all restaurants" ON restaurants FOR SELECT USING (true);');
        console.error('─'.repeat(60));
        console.error('\nLink: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql');
      }

      return;
    }

    if (!restaurants || restaurants.length === 0) {
      console.log('⚠️  Nenhum restaurante encontrado!');
      console.log('\n📝 Crie um restaurante primeiro:');
      console.log('   http://localhost:8080/setup');
      return;
    }

    console.log('✅ Restaurantes encontrados:\n');
    console.log('─'.repeat(80));

    restaurants.forEach((restaurant, index) => {
      console.log(`\n${index + 1}. ${restaurant.name}`);
      console.log(`   ID:     ${restaurant.id}`);
      console.log(`   Slug:   ${restaurant.slug}`);
      console.log(`   Aberto: ${restaurant.is_open ? '✅ Sim' : '❌ Não'}`);
      console.log(`   Owner:  ${restaurant.owner_id || 'N/A'}`);
      console.log(`   \n   🌐 URL do Cardápio:`);
      console.log(`      http://localhost:8080/m/${restaurant.slug}`);
      console.log(`   \n   🔍 URL de Diagnóstico:`);
      console.log(`      http://localhost:8080/diagnostic/${restaurant.slug}`);
    });

    console.log('\n' + '─'.repeat(80));
    console.log('\n💡 Dica: Use a URL de diagnóstico se o cardápio não abrir!');
    console.log('');

  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
  }
}

checkSlugs();
