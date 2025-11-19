# ⚡ Aplicação Rápida - Migration RBAC (2 minutos)

## 🎯 Passo a Passo Simples

### 1. Abra o SQL Editor do Supabase

Acesse diretamente: **https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql/new**

### 2. Copie o SQL

Abra o arquivo: `supabase/migrations/20251119_create_rbac_system.sql`

**OU** use o comando:
```bash
cat supabase/migrations/20251119_create_rbac_system.sql
```

Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)

### 3. Cole e Execute

1. Cole no editor SQL do Supabase (Ctrl+V)
2. Clique no botão **RUN** (canto superior direito)
3. Aguarde 10-15 segundos

### 4. Verifique se Funcionou

Execute este SQL para confirmar:

```sql
-- Deve retornar 6 linhas
SELECT COUNT(*) as total_tabelas FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('brands', 'roles', 'permissions', 'role_permissions', 'user_permission_overrides', 'audit_logs');

-- Deve retornar 6 roles
SELECT name, display_name, level FROM roles ORDER BY level DESC;
```

Resultado esperado:
- ✅ total_tabelas = 6
- ✅ 6 roles listados (owner, manager, financial, waiter, cashier, kitchen)

---

## 🚀 Próximo Passo: Deploy da Edge Function

Depois de aplicar a migration, você precisa fazer deploy da Edge Function para criar usuários.

**Se você tem Supabase CLI instalado:**
```bash
supabase functions deploy create-user-admin
```

**Se NÃO tem Supabase CLI:**

1. Acesse: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/functions
2. Clique em **"Deploy a new function"**
3. Nome: `create-user-admin`
4. Cole o código de: `supabase/functions/create-user-admin/index.ts`
5. Clique em **Deploy**

---

## ✅ Pronto!

Depois disso você pode:
1. Acessar `/users` no sistema
2. Clicar em "Novo Usuário"
3. Criar membros da equipe

---

## ❓ Problemas?

**Erro "already exists"**: A migration já foi aplicada antes. Tudo OK!

**Erro "column does not exist"**: Execute apenas as partes que falharam ou me chame.

**Erro de permissão**: Certifique-se de estar logado como owner do projeto.
