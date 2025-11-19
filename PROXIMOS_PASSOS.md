# ✅ Sistema de Criação de Usuários - Próximos Passos

## 📦 O que já está pronto:

✅ **Frontend completo:**
- Página de listagem de usuários (`/users`)
- Formulário de criação (`/users/new`)
- Rotas protegidas (apenas owner e manager)
- Validações e UI completa

✅ **Backend preparado:**
- Migration SQL do RBAC (`supabase/migrations/20251119_create_rbac_system.sql`)
- Edge Function create-user-admin (`supabase/functions/create-user-admin/index.ts`)
- Contexts, Guards e Permissões

✅ **Código commitado e enviado:**
- Tudo no branch: `claude/ifood-oauth-integration-01MAWzMgbzsbxsvEVadAHhX9`

---

## 🚀 O que VOCÊ precisa fazer agora (5 minutos):

### **PASSO 1: Aplicar Migration do RBAC** (2 min)

1. Acesse: **https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql/new**

2. Abra o arquivo: `supabase/migrations/20251119_create_rbac_system.sql`

3. Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)

4. Cole no SQL Editor e clique em **RUN**

5. Aguarde ~15 segundos até ver "Success"

**Confirme que funcionou:**
Execute este SQL:
```sql
SELECT COUNT(*) FROM roles;
```
Deve retornar: **6** (os 6 perfis: Owner, Manager, Financial, Waiter, Cashier, Kitchen)

---

### **PASSO 2: Deploy da Edge Function** (3 min)

**Opção A - Se você tem Supabase CLI instalado:**
```bash
cd /home/user/foodhub-pro
supabase functions deploy create-user-admin
```

**Opção B - Via Dashboard (se não tiver CLI):**

1. Acesse: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/functions

2. Clique em **"Deploy a new function"** ou **"New Edge Function"**

3. Preencha:
   - **Function name:** `create-user-admin`
   - **Code:** Cole o conteúdo de `supabase/functions/create-user-admin/index.ts`

4. Clique em **Deploy**

**Verifique:**
A função deve aparecer na lista como "Deployed"

---

## 🎉 TUDO PRONTO!

Depois dos 2 passos acima, você poderá:

1. **Acessar `/users` no sistema**
2. **Clicar em "Novo Usuário"**
3. **Preencher:**
   - Nome, email, perfil
   - Restaurante (se não for owner)
   - Senha temporária
4. **Criar** e o usuário estará pronto para usar!

---

## 📋 Resumo do Fluxo Completo:

```
Owner faz login
  ↓
Acessa /users (menu lateral)
  ↓
Clica "Novo Usuário"
  ↓
Preenche formulário
  ↓
Sistema chama Edge Function
  ↓
Edge Function usa Admin API
  ↓
Usuário criado no Supabase Auth
  ↓
Metadata definido (role, brand, restaurant)
  ↓
Novo colaborador pode fazer login!
```

---

## ❓ Dúvidas ou Erros?

**Erro ao criar usuário:**
- Verifique se a Edge Function foi deployada
- Confira os logs em: Dashboard → Functions → create-user-admin → Logs

**Tabelas não foram criadas:**
- Re-execute a migration do PASSO 1
- Verifique se há erros no SQL Editor

**Não consegue acessar /users:**
- Verifique se seu usuário tem `role_name: 'owner'` ou `'manager'` no user_metadata
- Faça logout e login novamente

---

## 📚 Documentação Adicional:

- `APLICAR_MIGRATION.md` - Outras formas de aplicar a migration
- `APLICACAO_RAPIDA.md` - Guia detalhado de aplicação
- `supabase/functions/create-user-admin/README.md` - Docs da Edge Function
- `scripts/setup-rbac.sh` - Script auxiliar (opcional)

---

**🎯 Após completar os 2 passos, seu sistema RBAC estará 100% funcional!**
