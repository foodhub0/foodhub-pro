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

**IMPORTANTE:** Certifique-se de que você configurou a chave da OpenAI no passo 1 antes de fazer o deploy!

```bash
# 1. Deploy da função de chat IA (requer OPENAI_API_KEY configurada)
supabase functions deploy ai-chat

# 2. Deploy da função de signup (cria primeiro usuário como Owner)
supabase functions deploy signup-owner

# 3. Deploy da função de criar usuários (admin) - opcional
supabase functions deploy create-user-admin
```

### Verificar Deploy

Após o deploy, verifique se as funções foram deployadas com sucesso:

```bash
# Listar funções deployadas
supabase functions list

# Ver logs de uma função específica
supabase functions logs ai-chat
supabase functions logs signup-owner
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

## Troubleshooting

### Erro: "OpenAI API key not configured"

**Causa:** A chave da OpenAI não foi configurada no Supabase Edge Functions.

**Solução:**
```bash
# Configurar a chave
supabase secrets set OPENAI_API_KEY=$(cat OPENAI_KEY.txt | grep '^sk-' | tr -d '\n')

# Fazer redeploy da função
supabase functions deploy ai-chat
```

### Erro: "Já existe um proprietário cadastrado"

**Causa:** Já existe um Owner no sistema e você está tentando criar conta via signup público.

**Solução:**
- Se você é o Owner, faça login normalmente
- Se você precisa de uma conta, peça ao Owner para criar sua conta em `/users/new`
- Se você quer resetar o sistema (CUIDADO: apaga tudo):
  ```sql
  -- Execute no SQL Editor do Supabase
  DELETE FROM brands; -- Isso deleta tudo em cascata
  ```

### Erro: "Failed to bundle the function"

**Causa:** Erro de import ou dependência nas Edge Functions.

**Solução:**
- ✅ Já corrigido! As funções foram atualizadas para não usar imports compartilhados
- Faça pull das últimas mudanças: `git pull`
- Redeploy: `supabase functions deploy ai-chat signup-owner`

### Edge Function não responde

**Verificar:**
```bash
# Ver logs em tempo real
supabase functions logs ai-chat --follow

# Testar função localmente
supabase functions serve ai-chat
```

### Banco de dados vazio após migrações

**Causa:** Migrações não foram aplicadas.

**Solução:**
```bash
# Verificar status
supabase db status

# Aplicar migrações
supabase db push

# Ou executar manualmente no SQL Editor
```

### Chat IA não funciona

**Checklist:**
1. ✅ Chave OpenAI configurada? `supabase secrets list`
2. ✅ Função deployada? `supabase functions list`
3. ✅ Logs mostram erros? `supabase functions logs ai-chat`
4. ✅ Variáveis no .env corretas? Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

## Suporte

Se tiver problemas:
1. Verifique os logs das Edge Functions no Supabase Dashboard
2. Verifique se as migrações foram aplicadas
3. Confirme que a chave da OpenAI está configurada corretamente
4. Consulte a seção Troubleshooting acima
