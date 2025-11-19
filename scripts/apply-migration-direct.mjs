#!/usr/bin/env node

/**
 * Aplica migration SQL diretamente via REST API do Supabase
 * Usa chunking para evitar timeouts em migrations grandes
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://wisikawnpzrrfzqutatl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpc2lrYXducHpycmZ6cXV0YXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIzMTcwOSwiZXhwIjoyMDc4ODA3NzA5fQ.Qk5NS5IIhJl3kpeu6db4kW9i3xtIK4I2hKwgQWjiHDY';

async function executeSQLQuery(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function applyMigration() {
  console.log('🚀 Aplicando Migration do RBAC...\n');

  try {
    // Ler migration
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251119_create_rbac_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log(`📄 Migration carregada: ${migrationSQL.length} chars\n`);
    console.log('📤 Executando SQL no Supabase...\n');

    // Tentar executar tudo de uma vez
    try {
      await executeSQLQuery(migrationSQL);
      console.log('✅ Migration aplicada com sucesso!\n');
    } catch (error) {
      console.error('❌ Erro ao aplicar migration via API:\n', error.message);
      console.log('\n⚠️  A REST API pode não suportar execução direta de SQL.');
      console.log('📋 Por favor, aplique manualmente via Dashboard do Supabase.\n');
      console.log('👉 Veja instruções em: APLICAR_MIGRATION.md\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

applyMigration();
