# Deploy das Edge Functions

## ⚠️ Importante

As Edge Functions do FoodHub Pro **NÃO** usam arquivos compartilhados. Cada função tem seus próprios headers CORS incluídos diretamente.

## Pré-requisitos

1. **Supabase CLI instalado**
   ```bash
   npm install -g supabase
   ```

2. **Login no Supabase**
   ```bash
   supabase login
   ```

3. **Link ao projeto**
   ```bash
   supabase link --project-ref wisikawnpzrrfzqutatl
   ```

4. **Configurar chave da OpenAI** (obrigatório para ai-chat)
   ```bash
   # Usando o arquivo OPENAI_KEY.txt
   supabase secrets set OPENAI_API_KEY=$(cat OPENAI_KEY.txt | grep '^sk-' | tr -d '\n')

   # Ou via Dashboard
   # https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/settings/edge-functions
   ```

## Deploy Individual

### 1. AI Chat (requer OPENAI_API_KEY)

```bash
cd /home/user/foodhub-pro
supabase functions deploy ai-chat --no-verify-jwt
```

**Testar:**
```bash
curl -X POST \
  "https://wisikawnpzrrfzqutatl.supabase.co/functions/v1/ai-chat" \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Olá"}]}'
```

### 2. Signup Owner

```bash
cd /home/user/foodhub-pro
supabase functions deploy signup-owner --no-verify-jwt
```

**Testar:**
```bash
curl -X POST \
  "https://wisikawnpzrrfzqutatl.supabase.co/functions/v1/signup-owner" \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"123456","name":"Teste"}'
```

### 3. Create User Admin

```bash
cd /home/user/foodhub-pro
supabase functions deploy create-user-admin --no-verify-jwt
```

## Deploy de Todas

```bash
cd /home/user/foodhub-pro

# Deploy todas as funções principais
supabase functions deploy ai-chat --no-verify-jwt
supabase functions deploy signup-owner --no-verify-jwt
supabase functions deploy create-user-admin --no-verify-jwt
```

## Verificação

### Listar funções deployadas

```bash
supabase functions list
```

### Ver logs em tempo real

```bash
# AI Chat
supabase functions logs ai-chat --follow

# Signup Owner
supabase functions logs signup-owner --follow
```

### Testar localmente (antes do deploy)

```bash
# Iniciar função localmente
supabase functions serve ai-chat

# Em outro terminal, testar
curl -X POST \
  "http://localhost:54321/functions/v1/ai-chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"teste"}]}'
```

## Troubleshooting

### Erro: "Module not found _shared/cors.ts"

**Causa:** Cache ou versão antiga do código.

**Solução:**
```bash
# 1. Verificar se o diretório _shared existe
ls -la supabase/functions/

# 2. Se existir, deletar
rm -rf supabase/functions/_shared

# 3. Verificar conteúdo das funções
head -n 10 supabase/functions/ai-chat/index.ts
# Deve mostrar: const corsHeaders = { ... }
# NÃO deve ter: import { corsHeaders } from ...

# 4. Redeploy
supabase functions deploy ai-chat --no-verify-jwt
```

### Erro: "OpenAI API key not configured"

```bash
# Configurar secret
supabase secrets set OPENAI_API_KEY=$(cat OPENAI_KEY.txt | grep '^sk-' | tr -d '\n')

# Verificar se foi configurado
supabase secrets list

# Redeploy
supabase functions deploy ai-chat --no-verify-jwt
```

### Erro: "Failed to bundle"

```bash
# Limpar cache do Supabase
rm -rf ~/.supabase/cache

# Verificar sintaxe TypeScript
cd supabase/functions/ai-chat
deno check index.ts

# Redeploy
cd /home/user/foodhub-pro
supabase functions deploy ai-chat --no-verify-jwt
```

### Deploy fica travado

```bash
# Cancelar (Ctrl+C) e tentar com verbose
supabase functions deploy ai-chat --no-verify-jwt --debug
```

## Estrutura Esperada

```
supabase/functions/
├── ai-chat/
│   ├── index.ts          # CORS incluído diretamente
│   └── README.md
├── signup-owner/
│   ├── index.ts          # CORS incluído diretamente
│   └── README.md
├── create-user-admin/
│   ├── index.ts          # CORS incluído diretamente
│   └── README.md
└── DEPLOY.md             # Este arquivo
```

**NÃO deve ter:**
- ❌ `_shared/` directory
- ❌ `import { corsHeaders } from "../_shared/cors.ts"`

## Secrets Configurados

Verifique quais secrets estão configurados:

```bash
supabase secrets list
```

Deve mostrar:
```
OPENAI_API_KEY (configurado)
```

## Comandos Úteis

```bash
# Ver todas as funções
supabase functions list

# Deletar uma função
supabase functions delete ai-chat

# Ver secrets
supabase secrets list

# Definir secret
supabase secrets set CHAVE=valor

# Remover secret
supabase secrets unset CHAVE
```
