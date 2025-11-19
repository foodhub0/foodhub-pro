#!/bin/bash

# Aplicar migration via Supabase REST API
# Usa a API de queries SQL do Supabase

SUPABASE_URL="https://wisikawnpzrrfzqutatl.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpc2lrYXducHpycmZ6cXV0YXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIzMTcwOSwiZXhwIjoyMDc4ODA3NzA5fQ.Qk5NS5IIhJl3kpeu6db4kW9i3xtIK4I2hKwgQWjiHDY"

echo "🚀 Aplicando Migration do RBAC via REST API..."
echo ""

# Ler o arquivo SQL
MIGRATION_SQL=$(cat supabase/migrations/20251119_create_rbac_system.sql)

# Tentar executar via PostgREST (geralmente não funciona para DDL)
echo "📤 Tentando via PostgREST..."

RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/query_exec" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\":$(echo "$MIGRATION_SQL" | jq -Rs .)}" \
  2>&1)

echo "$RESPONSE"
echo ""
echo "⚠️  A REST API geralmente não suporta DDL statements."
echo "📋 Por favor, aplique manualmente via Dashboard do Supabase."
echo ""
echo "Instruções completas em: APLICAR_MIGRATION.md"
