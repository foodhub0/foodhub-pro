#!/bin/bash

echo "🔍 Verificando Edge Functions do FoodHub Pro..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Verificar se diretório _shared existe
echo "1. Verificando diretório _shared..."
if [ -d "supabase/functions/_shared" ]; then
    echo -e "${RED}❌ ERRO: Diretório _shared ainda existe!${NC}"
    echo "   Solução: rm -rf supabase/functions/_shared"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ OK: Diretório _shared não existe${NC}"
fi

# Verificar imports em ai-chat
echo ""
echo "2. Verificando ai-chat/index.ts..."
if grep -q "_shared/cors" supabase/functions/ai-chat/index.ts; then
    echo -e "${RED}❌ ERRO: ai-chat ainda importa _shared/cors${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ OK: Sem imports de _shared${NC}"
fi

if grep -q "const corsHeaders" supabase/functions/ai-chat/index.ts; then
    echo -e "${GREEN}✅ OK: CORS headers definidos localmente${NC}"
else
    echo -e "${RED}❌ ERRO: CORS headers não encontrados${NC}"
    ERRORS=$((ERRORS+1))
fi

# Verificar imports em signup-owner
echo ""
echo "3. Verificando signup-owner/index.ts..."
if grep -q "_shared/cors" supabase/functions/signup-owner/index.ts; then
    echo -e "${RED}❌ ERRO: signup-owner ainda importa _shared/cors${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ OK: Sem imports de _shared${NC}"
fi

if grep -q "const corsHeaders" supabase/functions/signup-owner/index.ts; then
    echo -e "${GREEN}✅ OK: CORS headers definidos localmente${NC}"
else
    echo -e "${RED}❌ ERRO: CORS headers não encontrados${NC}"
    ERRORS=$((ERRORS+1))
fi

# Verificar se OPENAI_API_KEY está configurada
echo ""
echo "4. Verificando secret OPENAI_API_KEY..."
if [ -f "OPENAI_KEY.txt" ]; then
    echo -e "${GREEN}✅ OK: OPENAI_KEY.txt existe${NC}"
    echo -e "${YELLOW}   Lembre-se de configurar no Supabase:${NC}"
    echo "   supabase secrets set OPENAI_API_KEY=\$(cat OPENAI_KEY.txt | grep '^sk-' | tr -d '\\n')"
else
    echo -e "${YELLOW}⚠️  AVISO: OPENAI_KEY.txt não encontrado${NC}"
fi

# Verificar .env
echo ""
echo "5. Verificando .env..."
if [ -f ".env" ]; then
    if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✅ OK: Variáveis de ambiente configuradas${NC}"
    else
        echo -e "${RED}❌ ERRO: Variáveis faltando no .env${NC}"
        ERRORS=$((ERRORS+1))
    fi
else
    echo -e "${RED}❌ ERRO: Arquivo .env não encontrado${NC}"
    ERRORS=$((ERRORS+1))
fi

# Resumo
echo ""
echo "════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Todas as verificações passaram!${NC}"
    echo ""
    echo "Você pode fazer o deploy com:"
    echo "  supabase functions deploy ai-chat --no-verify-jwt"
    echo "  supabase functions deploy signup-owner --no-verify-jwt"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erro(s) encontrado(s)${NC}"
    echo ""
    echo "Corrija os erros acima antes de fazer deploy."
    exit 1
fi
