#!/bin/bash

# Script para configurar o sistema RBAC no Supabase
# Executa a migration SQL diretamente via psql

set -e

echo "🚀 Setup do Sistema RBAC no FoodHub Pro"
echo "========================================"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variáveis do Supabase
PROJECT_REF="wisikawnpzrrfzqutatl"
SUPABASE_URL="https://wisikawnpzrrfzqutatl.supabase.co"

echo -e "${BLUE}📊 Informações do Projeto:${NC}"
echo "  Project Ref: $PROJECT_REF"
echo "  URL: $SUPABASE_URL"
echo ""

# Verificar se migration existe
MIGRATION_FILE="supabase/migrations/20251119_create_rbac_system.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Erro: Migration não encontrada em $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Migration encontrada${NC}"
echo ""

# Opções de aplicação
echo -e "${YELLOW}Como você deseja aplicar a migration?${NC}"
echo ""
echo "1) Copiar SQL para colar no Dashboard (RECOMENDADO)"
echo "2) Via psql (precisa da DB password)"
echo "3) Mostrar instruções detalhadas"
echo "4) Sair"
echo ""
read -p "Escolha uma opção [1-4]: " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}📋 Copiando SQL para clipboard...${NC}"

        # Tentar copiar para clipboard
        if command -v xclip &> /dev/null; then
            cat "$MIGRATION_FILE" | xclip -selection clipboard
            echo -e "${GREEN}✅ SQL copiado! Cole no Dashboard do Supabase.${NC}"
        elif command -v pbcopy &> /dev/null; then
            cat "$MIGRATION_FILE" | pbcopy
            echo -e "${GREEN}✅ SQL copiado! Cole no Dashboard do Supabase.${NC}"
        else
            echo -e "${YELLOW}⚠️  Clipboard não disponível. Copie manualmente:${NC}"
            echo ""
            echo "Arquivo: $MIGRATION_FILE"
        fi

        echo ""
        echo -e "${BLUE}🌐 Passos:${NC}"
        echo "1. Abra: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
        echo "2. Cole o SQL"
        echo "3. Clique em RUN"
        echo ""
        ;;

    2)
        echo ""
        read -p "Digite a senha do banco de dados: " -s DB_PASSWORD
        echo ""

        DB_URL="postgresql://postgres:$DB_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres"

        echo -e "${BLUE}📤 Aplicando migration via psql...${NC}"

        if psql "$DB_URL" -f "$MIGRATION_FILE"; then
            echo ""
            echo -e "${GREEN}✅ Migration aplicada com sucesso!${NC}"
        else
            echo ""
            echo -e "${RED}❌ Erro ao aplicar migration${NC}"
            exit 1
        fi
        ;;

    3)
        cat APLICAR_MIGRATION.md
        ;;

    4)
        echo "👋 Saindo..."
        exit 0
        ;;

    *)
        echo -e "${RED}Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Processo concluído!${NC}"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. Verificar se as tabelas foram criadas"
echo "2. Fazer deploy da Edge Function: supabase functions deploy create-user-admin"
echo "3. Acessar /users no sistema para criar usuários"
echo ""
