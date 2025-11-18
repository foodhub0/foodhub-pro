# Troubleshooting - Integração iFood

## Erro: "Failed to fetch" ao clicar em "Conectar com iFood"

### Causa Provável
A Edge Function não está respondendo ou não foi deployed.

### Verificações

#### 1. Verificar se Edge Functions foram deployed

```bash
# Listar Edge Functions
supabase functions list

# Você deve ver:
# - ifood-oauth-start
# - ifood-oauth-callback
# - ifood-sync-catalog
```

**Se não aparecerem**, faça o deploy:

```bash
supabase functions deploy ifood-oauth-start
supabase functions deploy ifood-oauth-callback
supabase functions deploy ifood-sync-catalog
```

#### 2. Verificar variáveis de ambiente

As Edge Functions precisam dessas variáveis configuradas:

```bash
# Verificar secrets (via Supabase Dashboard)
# Settings > Edge Functions > Manage secrets

# Deve ter:
IFOOD_CLIENT_ID = xxx
IFOOD_CLIENT_SECRET = yyy
APP_URL = https://seu-dominio.com
```

**Para configurar via CLI:**

```bash
supabase secrets set IFOOD_CLIENT_ID=seu-client-id
supabase secrets set IFOOD_CLIENT_SECRET=seu-client-secret
supabase secrets set APP_URL=https://seu-dominio.com

# Redeploy após configurar
supabase functions deploy ifood-oauth-start
```

#### 3. Testar Edge Function manualmente

```bash
# Obter um token de autenticação do Supabase
# (Faça login no app e pegue do DevTools > Application > Local Storage)

curl -X POST https://seu-projeto.supabase.co/functions/v1/ifood-oauth-start \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "seu-restaurant-id"
  }'

# Deve retornar:
# {
#   "success": true,
#   "data": {
#     "authorizationUrl": "https://merchant-api.ifood.com.br/...",
#     "integrationId": "xxx"
#   }
# }
```

#### 4. Verificar logs da Edge Function

```bash
# Via CLI
supabase functions logs ifood-oauth-start --follow

# Ou no Supabase Dashboard:
# Edge Functions > ifood-oauth-start > Logs
```

#### 5. Verificar URL do Supabase no frontend

Arquivo: `/.env` ou `/.env.local`

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

**Importante**: Após alterar `.env`, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Erro: "iFood credentials not configured"

### Causa
As variáveis `IFOOD_CLIENT_ID` e `IFOOD_CLIENT_SECRET` não estão configuradas.

### Solução

1. **Registre uma aplicação no iFood:**
   - Acesse https://developer.ifood.com.br
   - Crie uma aplicação do tipo "Centralizado (SaaS)"
   - Anote o Client ID e Client Secret

2. **Configure no Supabase:**

```bash
supabase secrets set IFOOD_CLIENT_ID=d28ed85f-9b43-4555-a7c1-...
supabase secrets set IFOOD_CLIENT_SECRET=s18lm6m5uwatgihxdl6h9pr0j11ugh9...
supabase secrets set APP_URL=https://seu-dominio.com
```

3. **Redeploy:**

```bash
supabase functions deploy ifood-oauth-start
supabase functions deploy ifood-oauth-callback
```

## Erro: "Redirect URI mismatch"

### Causa
A URL de callback não está registrada na aplicação do iFood.

### Solução

1. Acesse o Portal de Desenvolvedores do iFood
2. Edite sua aplicação
3. Em "Redirect URIs", adicione:
   - **Desenvolvimento**: `http://localhost:5173/ifood-callback`
   - **Produção**: `https://seu-dominio.com/ifood-callback`

## Testando Localmente (Sem Deploy)

### Opção 1: Supabase Local

```bash
# Iniciar Supabase localmente
supabase start

# Configurar secrets locais
supabase secrets set IFOOD_CLIENT_ID=xxx --env-file ./supabase/.env.local
supabase secrets set IFOOD_CLIENT_SECRET=yyy --env-file ./supabase/.env.local

# Servir Edge Functions localmente
supabase functions serve

# Atualizar .env.local para usar URL local
VITE_SUPABASE_URL=http://localhost:54321
```

### Opção 2: Mock da Edge Function (Desenvolvimento)

Crie um arquivo `src/services/ifood-mock.ts`:

```typescript
export const mockIfoodOAuth = async (restaurantId: string) => {
  // Retorna URL fake para teste
  return {
    success: true,
    data: {
      authorizationUrl: 'http://localhost:5173/ifood-callback?code=MOCK_CODE&state=' + restaurantId,
      integrationId: 'mock-integration-id',
    },
  };
};
```

E use no desenvolvimento:

```typescript
// Em IFoodIntegration.tsx
const handleConnectIFood = async () => {
  if (import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_URL) {
    // Modo mock
    const result = await mockIfoodOAuth(restaurantId);
    window.location.href = result.data.authorizationUrl;
    return;
  }
  // ... código normal
};
```

## Checklist de Deploy

Antes de usar em produção, verifique:

- [ ] Edge Functions deployed
- [ ] Variáveis de ambiente configuradas no Supabase
- [ ] Aplicação registrada no Portal iFood
- [ ] Redirect URI configurada corretamente
- [ ] Migração SQL executada no banco
- [ ] URL da aplicação configurada em `APP_URL`
- [ ] Frontend buildado e deployed
- [ ] Variáveis de ambiente do frontend configuradas (Vercel/Netlify)

## Debug Mode

Ative logs detalhados no console do navegador:

1. Abra DevTools (F12)
2. Console tab
3. Clique em "Conectar com iFood"
4. Veja os logs:
   - "Iniciando conexão com iFood..."
   - "Calling Edge Function: ..."
   - "Response status: ..."
   - "Result: ..."

Se aparecer erro, copie e cole aqui para análise.

## Suporte

Se nada funcionar:

1. **Verifique os logs das Edge Functions** no Supabase Dashboard
2. **Teste a função manualmente** com curl (comando acima)
3. **Verifique se a migração foi executada**:
   ```sql
   SELECT * FROM ifood_integrations LIMIT 1;
   -- Deve existir a tabela
   ```

## Erros Comuns e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| Failed to fetch | Edge Function não deployed | `supabase functions deploy ifood-oauth-start` |
| 401 Unauthorized | Token expirado | Faça logout e login novamente |
| 500 Internal Server | Credenciais não configuradas | Configure `IFOOD_CLIENT_ID` e `IFOOD_CLIENT_SECRET` |
| CORS error | Configuração incorreta | Verifique `corsHeaders` na Edge Function |
| Restaurant not found | Usuário sem restaurante | Verifique se tem restaurante cadastrado |

## Logs Úteis

Adicione isso temporariamente no código para debug:

```typescript
console.log('Environment:', {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  isDev: import.meta.env.DEV,
  restaurantId,
});
```

---

**Última atualização**: 2025-11-18
