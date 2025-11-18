# Configuração de Credenciais do iFood

Este documento explica como configurar as credenciais centralizadas do iFood para o FoodHub Pro.

## Por que credenciais centralizadas?

O FoodHub Pro usa uma **aplicação centralizada** registrada no iFood. Isso significa:

✅ **Usuários não precisam registrar aplicações** - Sem burocracia
✅ **Um clique para conectar** - Experiência simplificada
✅ **Gestão centralizada** - Atualizações e manutenção facilitadas
✅ **Padrão de mercado** - Igual "Login com Google", "Login com Facebook"

## Como Funciona

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Usuário    │────────>│ FoodHub Pro │────────>│   iFood     │
│             │ Clica   │ (com creds  │ Redireciona│  Login     │
│             │         │ centralizadas)│         │             │
└─────────────┘         └─────────────┘         └─────────────┘
                               │                       │
                               │<──────────────────────│
                               │   Autorização         │
                               ▼                       │
                        ✅ Conectado!                  │
```

## Passo a Passo

### 1. Registrar Aplicação no iFood

1. Acesse https://developer.ifood.com.br
2. Faça login com CNPJ (não aceita CPF)
3. Clique em **"Cadastrar Nova Aplicação"**
4. Preencha os dados:
   - **Nome**: FoodHub Pro
   - **Descrição**: Sistema de gestão para restaurantes
   - **Tipo**: Centralizado (SaaS)
   - **Redirect URI**: `https://seu-dominio.com/ifood-callback`
     - Para desenvolvimento: `http://localhost:5173/ifood-callback`
     - Para produção: `https://foodhub-pro.vercel.app/ifood-callback`

### 2. Obter Credenciais

Após registrar, você receberá:
- **Client ID**: `d28ed85f-9b43-4555-a7c1-...`
- **Client Secret**: `s18lm6m5uwatgihxdl6h9pr0j11ugh9...`

### 3. Configurar no Supabase

#### Opção A: Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá para **Settings > Functions**
3. Clique em **Manage secrets**
4. Adicione as variáveis:
   ```
   IFOOD_CLIENT_ID=seu-client-id-aqui
   IFOOD_CLIENT_SECRET=seu-client-secret-aqui
   APP_URL=https://seu-dominio.com
   ```

#### Opção B: Supabase CLI

```bash
# Configurar secrets localmente
supabase secrets set IFOOD_CLIENT_ID=seu-client-id
supabase secrets set IFOOD_CLIENT_SECRET=seu-client-secret
supabase secrets set APP_URL=http://localhost:5173

# Deploy
supabase functions deploy ifood-oauth-start
supabase functions deploy ifood-oauth-callback
supabase functions deploy ifood-sync-catalog
```

### 4. Verificar Configuração

Execute este teste para verificar se as credenciais estão configuradas:

```bash
# Testar se as secrets estão disponíveis
supabase functions invoke ifood-oauth-start --method OPTIONS
```

Se retornar erro "iFood credentials not configured", as variáveis não estão configuradas corretamente.

## Variáveis de Ambiente Necessárias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `IFOOD_CLIENT_ID` | Client ID da aplicação iFood | `d28ed85f-9b43-...` |
| `IFOOD_CLIENT_SECRET` | Client Secret da aplicação iFood | `s18lm6m5uwatgi...` |
| `APP_URL` | URL base da aplicação (para callbacks) | `https://foodhub.com` |
| `SUPABASE_URL` | URL do projeto Supabase | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Chave anônima do Supabase | `eyJhbGci...` |

## Segurança

⚠️ **IMPORTANTE**:
- **NUNCA** commite o `.env` no Git
- Use `.env.example` como template
- Credenciais devem estar apenas:
  - Em variáveis de ambiente do Supabase (produção)
  - No arquivo `.env.local` (desenvolvimento)
  - No gerenciador de secrets do Vercel (se usar Vercel)

## Troubleshooting

### Erro: "iFood credentials not configured"

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
1. Verifique se configurou `IFOOD_CLIENT_ID` e `IFOOD_CLIENT_SECRET`
2. Faça redeploy das Edge Functions
3. Teste novamente

### Erro: "Redirect URI mismatch"

**Causa**: URL de callback não está registrada no iFood

**Solução**:
1. Acesse o Portal de Desenvolvedores do iFood
2. Edite sua aplicação
3. Adicione a URL correta em "Redirect URIs":
   - Dev: `http://localhost:5173/ifood-callback`
   - Prod: `https://seu-dominio.com/ifood-callback`

### Erro: "Invalid client credentials"

**Causa**: Client ID ou Secret incorretos

**Solução**:
1. Verifique se copiou corretamente do Portal do iFood
2. Certifique-se de não ter espaços extras
3. Gere novas credenciais se necessário

## Fluxo de Desenvolvimento

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/foodhub-pro

# 2. Copiar env example
cp .env.example .env.local

# 3. Preencher credenciais
# Edite .env.local com suas credenciais

# 4. Instalar dependências
npm install

# 5. Iniciar dev server
npm run dev

# 6. Deploy Edge Functions (se modificou)
supabase functions deploy ifood-oauth-start
supabase functions deploy ifood-oauth-callback
supabase functions deploy ifood-sync-catalog
```

## Produção

Para deploy em produção:

1. **Vercel**: Configure as variáveis de ambiente no dashboard
2. **Netlify**: Use o arquivo `netlify.toml` ou dashboard
3. **Outra plataforma**: Consulte documentação específica

## Suporte

Se tiver problemas:
1. Verifique os logs das Edge Functions no Supabase Dashboard
2. Confira a documentação oficial: https://developer.ifood.com.br
3. Abra uma issue no repositório

---

**Última atualização**: 2025-11-18
**Versão**: 2.0.0
