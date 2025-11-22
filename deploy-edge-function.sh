#!/bin/bash

# Script para fazer deploy da Edge Function create-user-admin
# Execute este script após fazer login no Supabase CLI

echo "🚀 Fazendo deploy da Edge Function create-user-admin..."

# Verificar se está logado
if ! supabase projects list &> /dev/null; then
    echo "❌ Você não está logado no Supabase CLI"
    echo "Execute: supabase login"
    exit 1
fi

# Deploy da função
supabase functions deploy create-user-admin

if [ $? -eq 0 ]; then
    echo "✅ Edge Function deployada com sucesso!"
    echo ""
    echo "📝 Próximos passos:"
    echo "1. Teste criar um usuário no FoodHub Pro"
    echo "2. O erro 'Auth session missing!' deve estar resolvido"
else
    echo "❌ Erro ao fazer deploy"
    echo "Verifique se o projeto está linkado: supabase link --project-ref SEU_PROJECT_REF"
    exit 1
fi
