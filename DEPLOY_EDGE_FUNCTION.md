# 🚀 Deploy da Edge Function: create-user-admin

## ⚡ QUICK START (3 Comandos)

```bash
# 1. Login no Supabase
supabase login

# 2. Linkar projeto (SUBSTITUA SEU_PROJECT_REF)
supabase link --project-ref SEU_PROJECT_REF

# 3. Deploy!
supabase functions deploy create-user-admin
```

---

## 📋 Passo a Passo Detalhado

### 1️⃣ Instalar Supabase CLI

Se ainda não tiver instalado:

```bash
npm install -g supabase
```

Verificar instalação:
```bash
supabase --version
```

---

### 2️⃣ Login no Supabase

```bash
supabase login
```

Isso abrirá seu navegador para autenticação.

---

### 3️⃣ Encontrar seu Project Reference ID

1. Vá em: https://app.supabase.com
2. Abra seu projeto **foodhub-pro**
3. Clique em **Settings** (⚙️) → **General**
4. Copie o **Reference ID** (algo como: `abcdefghijklmnop`)

---

### 4️⃣ Linkar o Projeto

No diretório do projeto:

```bash
cd /home/user/foodhub-pro

supabase link --project-ref SEU_PROJECT_REF_AQUI
```

**Exemplo:**
```bash
supabase link --project-ref wisikawnpzrrfzqutatl
```

---

### 5️⃣ Deploy da Edge Function

```bash
supabase functions deploy create-user-admin
```

**Output esperado:**
```
Deploying Function create-user-admin (project ref: xxx)
Bundled create-user-admin (Deno) [142ms]
✅ Deployed Function create-user-admin
```

---

### 6️⃣ Verificar Deployment

Liste as funções deployadas:

```bash
supabase functions list
```

Deve aparecer:
```
┌──────────────────────┬─────────┬──────────────┐
│ NAME                 │ STATUS  │ UPDATED      │
├──────────────────────┼─────────┼──────────────┤
│ create-user-admin    │ ACTIVE  │ Just now     │
└──────────────────────┴─────────┴──────────────┘
```

---

## ✅ Testar se Funcionou

1. **No FoodHub Pro**, vá em **Usuários** → **Novo Usuário**
2. Preencha os dados
3. Clique em **Criar Usuário**
4. **Se der certo:** Usuário criado sem desconectar você! ✅
5. **Se der erro:** Veja troubleshooting abaixo

---

## 🆘 Troubleshooting

### ❌ "Supabase CLI not found"
```bash
npm install -g supabase
# ou
brew install supabase/tap/supabase  # macOS
```

---

### ❌ "Not logged in"
```bash
supabase login
```

Isso abrirá o navegador para você fazer login.

---

### ❌ "Project not linked"
```bash
supabase link --project-ref SEU_PROJECT_REF
```

Certifique-se de copiar o Reference ID correto do dashboard.

---

### ❌ "Failed to send request to Edge Function"

**Causa:** A função ainda não foi deployada ou está inativa.

**Solução:**
```bash
# Re-deploy
supabase functions deploy create-user-admin

# Verificar status
supabase functions list
```

---

### ❌ "Permission denied"

**Causa:** Você não tem permissões no projeto Supabase.

**Solução:**
1. Certifique-se de estar logado com a conta correta
2. Verifique se você é owner/admin do projeto no Supabase

---

## 🧪 Teste Local (Opcional)

Para testar antes de fazer deploy:

```bash
# Iniciar Supabase local
supabase start

# Servir função localmente
supabase functions serve create-user-admin

# Em outro terminal
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/create-user-admin' \
  --header 'Authorization: Bearer ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "user_email":"teste@teste.com",
    "user_password":"senha123",
    "user_metadata": {
      "role_name":"waiter",
      "name":"João"
    }
  }'
```

---

## 📝 Logs da Edge Function

Para ver logs em tempo real:

```bash
supabase functions logs create-user-admin --follow
```

ou no Dashboard:
1. **Supabase Dashboard** → **Edge Functions**
2. Clique em **create-user-admin**
3. Aba **Logs**

---

## 🔄 Re-deploy após mudanças

Se você modificar o código da função:

```bash
supabase functions deploy create-user-admin
```

Não precisa fazer nada mais, só re-executar o deploy!

---

## ✅ Checklist Completo

- [ ] Supabase CLI instalado
- [ ] Login feito (`supabase login`)
- [ ] Projeto linkado (`supabase link`)
- [ ] Edge Function deployada (`supabase functions deploy create-user-admin`)
- [ ] Função aparece na lista (`supabase functions list`)
- [ ] Teste criando usuário no FoodHub Pro
- [ ] Usuário criado com sucesso! 🎉

---

**Pronto! Agora você pode criar usuários sem perder sua sessão de owner! 🚀**
