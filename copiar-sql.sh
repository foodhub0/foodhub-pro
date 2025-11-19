#!/bin/bash

# Script para copiar SQL da migration para clipboard

echo "📋 Copiando SQL da Migration RBAC..."
echo ""

SQL_FILE="supabase/migrations/20251119_create_rbac_system.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Erro: Arquivo não encontrado: $SQL_FILE"
    exit 1
fi

# Tentar copiar para clipboard
if command -v xclip &> /dev/null; then
    cat "$SQL_FILE" | xclip -selection clipboard
    echo "✅ SQL copiado para clipboard (xclip)!"
    echo ""
    echo "Agora:"
    echo "1. Abra: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql/new"
    echo "2. Cole com Ctrl+V"
    echo "3. Clique em RUN"
elif command -v pbcopy &> /dev/null; then
    cat "$SQL_FILE" | pbcopy
    echo "✅ SQL copiado para clipboard (pbcopy)!"
    echo ""
    echo "Agora:"
    echo "1. Abra: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql/new"
    echo "2. Cole com Cmd+V"
    echo "3. Clique em RUN"
elif command -v clip.exe &> /dev/null; then
    cat "$SQL_FILE" | clip.exe
    echo "✅ SQL copiado para clipboard (Windows)!"
    echo ""
    echo "Agora:"
    echo "1. Abra: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql/new"
    echo "2. Cole com Ctrl+V"
    echo "3. Clique em RUN"
else
    echo "⚠️  Clipboard não disponível."
    echo ""
    echo "Execute este comando para ver o SQL:"
    echo ""
    echo "    cat $SQL_FILE"
    echo ""
    echo "Depois copie e cole em:"
    echo "https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql/new"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📖 Veja APLICAR_AGORA.txt para instruções completas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
