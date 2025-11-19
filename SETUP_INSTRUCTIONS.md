# FoodHub Pro - Instruções de Configuração

## 1. Configurar Variáveis de Ambiente

### Supabase Edge Functions Secrets

Para configurar a chave da OpenAI nas Edge Functions:

```bash
# Via CLI
supabase secrets set OPENAI_API_KEY=sua-chave-openai-aqui
```

**IMPORTANTE:** Use a chave da OpenAI fornecida separadamente (não versionada por segurança).

Ou via Dashboard:
1. Acesse: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/settings/edge-functions
2. Vá em "Edge Functions Secrets"
3. Adicione `OPENAI_API_KEY` com o valor da chave acima

## 2. Deploy das Edge Functions

```bash
# Deploy da função de chat IA
supabase functions deploy ai-chat

# Deploy da função de signup
supabase functions deploy signup-owner

# Deploy da função de criar usuários (admin)
supabase functions deploy create-user-admin
```

## 3. Executar Migrações do Banco de Dados

```bash
# Aplicar todas as migrações
supabase db push

# Ou executar manualmente no SQL Editor do Supabase:
# 1. supabase/migrations/20251119_create_rbac_system.sql
# 2. supabase/migrations/20251119_add_marketing_reception_roles.sql
```

## 4. Primeiro Acesso - Criar Conta Owner

### Importante: O primeiro usuário a se cadastrar será automaticamente o Owner!

1. Acesse a página de cadastro: `/auth`
2. Clique em "Criar Conta"
3. Digite seu email e senha
4. A Edge Function `signup-owner` irá:
   - Verificar se é o primeiro usuário
   - Criar você como **Owner** (acesso total)
   - Criar sua **Brand** automaticamente
   - Criar seu **Restaurante** (Unidade 1)
   - Configurar todas as permissões

### Após o Primeiro Cadastro

Todos os outros usuários devem ser criados por você (Owner) ou por Managers através da interface:
- Acesse: `/users/new`
- Selecione o role apropriado (Manager, Garçom, Recepção, etc.)

## 5. Sistema de Roles e Permissões

### Roles Disponíveis

| Role | Descrição | Acesso |
|------|-----------|--------|
| **Owner** | Proprietário | Acesso total ao sistema + Dashboard da Marca |
| **Manager** | Gerente | Gestão completa da unidade + Criar usuários |
| **Financeiro** | Financeiro | Custos, métricas, análises, relatórios |
| **Marketing** | Marketing | Análises, cupons, ferramentas de marketing |
| **Recepção** | Recepção | Mesas, pedidos, clientes, impressões |
| **Garçom** | Garçom | Interface de pedidos simplificada |
| **Caixa** | Caixa | Pagamentos e fechamento |
| **Cozinha** | Cozinha | Visualização de pedidos |

### Interfaces Específicas

- **Garçom**: `/waiter-orders` - Interface focada em criar pedidos de mesa
- **Recepção**: `/reception` - Gestão completa de mesas e atendimento
- **Manager/Owner**: Todas as rotas

## 6. Chat IA

O assistente de IA está disponível em todas as páginas (botão flutuante no canto inferior direito).

Funcionalidades:
- Análise de custos
- Estratégias de vendas
- Otimização de delivery
- Gestão de cardápio
- Dicas de marketing
- Análise de métricas

## 7. Próximos Passos

Após o setup:

1. ✅ Faça login como Owner
2. ✅ Configure seu restaurante em `/restaurant`
3. ✅ Adicione categorias e produtos
4. ✅ Crie mesas em `/tables`
5. ✅ Crie usuários (garçons, recepção, etc) em `/users/new`
6. ✅ Configure custos em `/costs`
7. ✅ Publique seu cardápio

## 8. Variáveis de Ambiente (.env)

Certifique-se de que o arquivo `.env` está configurado:

```env
VITE_SUPABASE_PROJECT_ID="wisikawnpzrrfzqutatl"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://wisikawnpzrrfzqutatl.supabase.co"
```

## Suporte

Se tiver problemas:
1. Verifique os logs das Edge Functions no Supabase Dashboard
2. Verifique se as migrações foram aplicadas
3. Confirme que a chave da OpenAI está configurada corretamente
