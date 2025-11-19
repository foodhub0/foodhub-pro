#!/usr/bin/env node

/**
 * Aplica migration RBAC executando statements SQL individuais
 * Via Supabase Client com Service Role Key
 */

import { createClient } from '../node_modules/@supabase/supabase-js/dist/module/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://wisikawnpzrrfzqutatl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpc2lrYXducHpycmZ6cXV0YXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIzMTcwOSwiZXhwIjoyMDc4ODA3NzA5fQ.Qk5NS5IIhJl3kpeu6db4kW9i3xtIK4I2hKwgQWjiHDY';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Aplicando Migration RBAC...\n');

  try {
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251119_create_rbac_system.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log(`📄 Migration carregada (${sql.length} chars)\n`);

    // Dividir em statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));

    console.log(`📊 ${statements.length} statements para executar\n`);

    // Como a Supabase JS client não tem método direto para executar DDL,
    // vamos precisar fazer via SQL Editor ou criar uma função auxiliar

    console.log('⚠️  O Supabase JS Client não suporta execução direta de DDL.\n');
    console.log('📋 Opções para aplicar a migration:\n');
    console.log('1. Dashboard SQL Editor (RECOMENDADO):');
    console.log('   → https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql/new');
    console.log('   → Cole o conteúdo de: supabase/migrations/20251119_create_rbac_system.sql');
    console.log('   → Clique em RUN\n');
    console.log('2. Via psql (se tiver acesso local):');
    console.log('   → Veja APLICAR_MIGRATION.md\n');
    console.log('3. Via Supabase CLI (se instalado):');
    console.log('   → supabase db push\n');

    // Verificar se as tabelas já existem
    console.log('🔍 Verificando se migration já foi aplicada...\n');

    const tables = ['brands', 'roles', 'permissions'];
    let alreadyApplied = 0;

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          console.log(`✅ ${table}: já existe (${count || 0} registros)`);
          alreadyApplied++;
        } else {
          console.log(`❌ ${table}: não existe`);
        }
      } catch (err) {
        console.log(`❌ ${table}: não existe`);
      }
    }

    if (alreadyApplied === tables.length) {
      console.log('\n🎉 Migration parece já estar aplicada!');
    } else {
      console.log(`\n📝 Faltam ${tables.length - alreadyApplied} tabelas principais.`);
      console.log('Por favor, aplique via Dashboard conforme instruções acima.\n');
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

applyMigration();
