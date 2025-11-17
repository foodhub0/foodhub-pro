/**
 * Script para aplicar a correção da política RLS do restaurante
 * Este script corrige o erro 404 ao acessar cardápios públicos
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega as variáveis de ambiente
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  console.error('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY estão definidas');
  process.exit(1);
}

// Cria o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔄 Aplicando correção da política RLS...\n');

const sql = `
-- Drop the restrictive policy that requires is_open = true
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;

-- Create a new policy that allows public viewing of any restaurant
CREATE POLICY "Public can view all restaurants" ON restaurants
  FOR SELECT USING (true);
`;

console.log('SQL a ser executado:');
console.log('-------------------');
console.log(sql);
console.log('-------------------\n');

// NOTA: A chave anon não tem permissões para executar DDL (CREATE/DROP POLICY)
// Este script serve como documentação, mas a migração precisa ser aplicada
// manualmente através do painel do Supabase ou com service_role key

console.log('⚠️  ATENÇÃO:');
console.log('A chave ANON não tem permissões para executar comandos DDL.');
console.log('Você precisa aplicar esta migração manualmente através do painel do Supabase.\n');
console.log('📝 Instruções:');
console.log('1. Acesse: https://supabase.com/dashboard');
console.log('2. Selecione seu projeto');
console.log('3. Vá em "SQL Editor"');
console.log('4. Cole o SQL acima');
console.log('5. Clique em "Run"\n');
console.log('✅ Ou consulte MIGRATION_INSTRUCTIONS.md para mais detalhes.');
