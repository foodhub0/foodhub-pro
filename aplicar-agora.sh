#!/bin/bash

echo "🚀 Aplicando Migration no Supabase..."
echo ""

# Configurações
PROJECT="wisikawnpzrrfzqutatl"
PASSWORD="QByHs8P5MMfKBUsH"

# Pooler connection string
CONNECTION="postgresql://postgres.${PROJECT}:${PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

echo "📡 Conectando ao Supabase..."
echo ""

PGPASSWORD="${PASSWORD}" psql "${CONNECTION}" \
  -f supabase/migrations/20251119_restructure_products_system.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ ✅ ✅ MIGRATION APLICADA COM SUCESSO! ✅ ✅ ✅"
  echo ""
  echo "Verificando tabelas criadas..."
  PGPASSWORD="${PASSWORD}" psql "${CONNECTION}" -c "
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('product_sizes', 'product_addon_groups', 'addon_group_items', 'product_addon_group_links')
    ORDER BY table_name;
  "
  echo ""
  echo "🎉 Pronto! Agora me avise que eu continuo a implementação!"
else
  echo ""
  echo "❌ Erro ao aplicar migration"
  echo ""
  echo "💡 Tente via Dashboard do Supabase:"
  echo "   https://supabase.com/dashboard/project/${PROJECT}/sql"
fi
