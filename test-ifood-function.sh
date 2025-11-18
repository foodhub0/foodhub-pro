#!/bin/bash

# Script para testar a Edge Function do iFood localmente
# Uso: ./test-ifood-function.sh

echo "🧪 Testando Edge Function - iFood OAuth Start"
echo "=============================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se o Supabase está rodando
echo "1️⃣  Verificando Supabase local..."
if curl -s http://localhost:54321 > /dev/null; then
    echo -e "${GREEN}✓ Supabase está rodando${NC}"
else
    echo -e "${RED}✗ Supabase não está rodando${NC}"
    echo "Execute: supabase start"
    exit 1
fi

# 2. Verificar variáveis de ambiente
echo ""
echo "2️⃣  Verificando variáveis de ambiente..."

if [ -f "supabase/.env.local" ]; then
    echo -e "${GREEN}✓ Arquivo .env.local encontrado${NC}"

    if grep -q "IFOOD_CLIENT_ID" supabase/.env.local; then
        echo -e "${GREEN}✓ IFOOD_CLIENT_ID configurado${NC}"
    else
        echo -e "${RED}✗ IFOOD_CLIENT_ID não encontrado${NC}"
    fi

    if grep -q "IFOOD_CLIENT_SECRET" supabase/.env.local; then
        echo -e "${GREEN}✓ IFOOD_CLIENT_SECRET configurado${NC}"
    else
        echo -e "${RED}✗ IFOOD_CLIENT_SECRET não encontrado${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Arquivo .env.local não encontrado${NC}"
    echo "Crie o arquivo supabase/.env.local com:"
    echo "IFOOD_CLIENT_ID=seu-client-id"
    echo "IFOOD_CLIENT_SECRET=seu-client-secret"
    echo "APP_URL=http://localhost:5173"
fi

# 3. Obter um token de acesso (você precisa fazer login no app primeiro)
echo ""
echo "3️⃣  Token de autenticação..."
echo -e "${YELLOW}⚠ Você precisa obter um token válido${NC}"
echo "Como obter:"
echo "  1. Abra o app no navegador"
echo "  2. Faça login"
echo "  3. Abra DevTools (F12) > Console"
echo "  4. Execute: localStorage.getItem('supabase.auth.token')"
echo "  5. Copie o access_token"
echo ""

read -p "Cole seu access_token aqui: " ACCESS_TOKEN

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}✗ Token não fornecido${NC}"
    exit 1
fi

# 4. Obter restaurant_id
echo ""
echo "4️⃣  Restaurant ID..."
read -p "Cole o restaurant_id (UUID): " RESTAURANT_ID

if [ -z "$RESTAURANT_ID" ]; then
    echo -e "${RED}✗ Restaurant ID não fornecido${NC}"
    exit 1
fi

# 5. Testar Edge Function
echo ""
echo "5️⃣  Testando Edge Function..."
echo "URL: http://localhost:54321/functions/v1/ifood-oauth-start"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  http://localhost:54321/functions/v1/ifood-oauth-start \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"restaurantId\":\"$RESTAURANT_ID\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Status Code: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

echo ""
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Função executada com sucesso!${NC}"

    # Extrair URL de autorização
    AUTH_URL=$(echo "$BODY" | jq -r '.data.authorizationUrl' 2>/dev/null)
    if [ ! -z "$AUTH_URL" ] && [ "$AUTH_URL" != "null" ]; then
        echo ""
        echo "URL de autorização gerada:"
        echo "$AUTH_URL"
        echo ""
        echo "Você pode abrir essa URL no navegador para testar o fluxo completo"
    fi
else
    echo -e "${RED}✗ Erro ao executar função${NC}"

    # Sugestões baseadas no erro
    if [ "$HTTP_CODE" -eq 401 ]; then
        echo "Possível causa: Token inválido ou expirado"
        echo "Solução: Obtenha um novo token fazendo login novamente"
    elif [ "$HTTP_CODE" -eq 500 ]; then
        echo "Possível causa: Erro interno da função"
        echo "Solução: Verifique os logs com: supabase functions logs ifood-oauth-start"
    fi
fi

echo ""
echo "=============================================="
echo "Para ver logs em tempo real:"
echo "  supabase functions logs ifood-oauth-start --follow"
