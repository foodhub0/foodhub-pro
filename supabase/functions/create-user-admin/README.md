# Edge Function: create-user-admin

Esta Edge Function permite que administradores (owners e managers) criem novos usuários no sistema usando a Supabase Admin API.

## 🔐 Segurança

A função verifica:
- ✅ Autenticação válida (Bearer token)
- ✅ Permissão do usuário (apenas `owner` ou `manager`)
- ✅ Validação de dados de entrada

## 📦 Deploy

### 1. Fazer login no Supabase CLI

```bash
supabase login
```

### 2. Vincular ao projeto

```bash
supabase link --project-ref SEU_PROJECT_REF
```

### 3. Deploy da função

```bash
supabase functions deploy create-user-admin
```

### 4. Verificar status

```bash
supabase functions list
```

## 🧪 Teste Local

Para testar localmente antes do deploy:

```bash
# Iniciar Supabase local
supabase start

# Servir a função localmente
supabase functions serve create-user-admin

# Em outro terminal, fazer requisição de teste
curl -i --location --request POST 'http://localhost:54321/functions/v1/create-user-admin' \
  --header 'Authorization: Bearer SEU_ACCESS_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"user_email":"teste@exemplo.com","user_password":"senha123","user_metadata":{"name":"Teste","role_name":"waiter"},"send_email":false}'
```

## 📝 Parâmetros

**Body (JSON):**
```typescript
{
  user_email: string;       // Email do novo usuário
  user_password: string;    // Senha temporária (mín 6 caracteres)
  user_metadata: {          // Metadata do usuário
    name: string;
    role_id: string;
    role_name: string;
    role_display_name: string;
    role_color?: string;
    brand_id: string;
    restaurant_id?: string | null;
    is_active: boolean;
  };
  send_email: boolean;      // Enviar email de boas-vindas?
}
```

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

## ✅ Resposta de Sucesso

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    ...
  },
  "message": "Usuário criado com sucesso"
}
```

## ❌ Resposta de Erro

```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

## 🔑 Variáveis de Ambiente

A Edge Function usa automaticamente as seguintes variáveis (fornecidas pelo Supabase):

- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (permissões de admin)

Essas variáveis são injetadas automaticamente pelo Supabase ao fazer deploy.

## 📚 Documentação

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Admin API](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
