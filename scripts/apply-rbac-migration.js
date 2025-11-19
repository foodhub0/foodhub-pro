#!/usr/bin/env node

/**
 * Script para aplicar a migration do RBAC diretamente no Supabase
 * Usa o Service Role Key para executar SQL via RPC
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Credenciais do Supabase
const SUPABASE_URL = 'https://wisikawnpzrrfzqutatl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpc2lrYXducHpycmZ6cXV0YXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIzMTcwOSwiZXhwIjoyMDc4ODA3NzA5fQ.Qk5NS5IIhJl3kpeu6db4kW9i3xtIK4I2hKwgQWjiHDY';

// Criar cliente Supabase com Service Role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🚀 Iniciando aplicação da migration do RBAC...\n');

    // Ler o arquivo de migration
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251119_create_rbac_system.sql');
    console.log(`📄 Lendo migration: ${migrationPath}`);

    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration lida: ${migrationSQL.length} caracteres\n`);

    // Dividir o SQL em statements individuais
    // Remover comentários e linhas vazias
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Total de statements SQL: ${statements.length}\n`);

    // Executar cada statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Pular comentários de bloco e statements vazios
      if (statement.trim().startsWith('/*') || statement.trim().length < 5) {
        continue;
      }

      try {
        // Mostrar preview do statement
        const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
        process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

        // Executar via RPC raw SQL
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          // Alguns erros podem ser esperados (DROP IF EXISTS, etc)
          if (error.message.includes('does not exist') ||
              error.message.includes('already exists') ||
              error.message.includes('duplicate key')) {
            console.log('⚠️  (ignorado)');
          } else {
            throw error;
          }
        } else {
          console.log('✅');
          successCount++;
        }
      } catch (err) {
        console.log('❌');
        console.error(`\n   Erro: ${err.message}\n`);
        errorCount++;

        // Continuar mesmo com erro (algumas statements podem falhar se já existirem)
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Migration concluída!`);
    console.log(`   Sucesso: ${successCount} statements`);
    console.log(`   Erros: ${errorCount} statements`);
    console.log('='.repeat(60) + '\n');

    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando tabelas criadas...\n');

    const tables = ['brands', 'roles', 'permissions', 'role_permissions', 'user_permission_overrides', 'audit_logs'];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0} registros`);
      }
    }

    console.log('\n🎉 RBAC System migration aplicada com sucesso!\n');

  } catch (error) {
    console.error('\n❌ Erro fatal ao aplicar migration:');
    console.error(error);
    process.exit(1);
  }
}

// Executar
applyMigration();
