# 🚀 Como Aplicar a Migration do RBAC

## Opção 1: Via Supabase Dashboard (RECOMENDADO)

### Passo a Passo:

1. **Acesse o Dashboard do Supabase:**
   - URL: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl
   - Faça login com sua conta

2. **Abra o SQL Editor:**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New Query"

3. **Cole o SQL da Migration:**
   - Abra o arquivo: `supabase/migrations/20251119_create_rbac_system.sql`
   - Copie TODO o conteúdo
   - Cole no editor SQL

4. **Execute:**
   - Clique no botão "RUN" (ou pressione Ctrl/Cmd + Enter)
   - Aguarde a execução (pode levar 10-20 segundos)

5. **Verifique:**
   - Se tudo der certo, você verá a mensagem de sucesso
   - As tabelas `brands`, `roles`, `permissions`, etc. estarão criadas

---

## Opção 2: Via Supabase CLI (se você tiver instalado)

```bash
# 1. Fazer login
supabase login

# 2. Vincular ao projeto
supabase link --project-ref wisikawnpzrrfzqutatl

# 3. Aplicar migrations
supabase db push
```

---

## Opção 3: Via Script SQL Direto (PostgreSQL)

Se você tiver a connection string do banco:

```bash
psql "postgresql://postgres:[PASSWORD]@db.wisikawnpzrrfzqutatl.supabase.co:5432/postgres" \
  -f supabase/migrations/20251119_create_rbac_system.sql
```

---

## ✅ Como Verificar se Foi Aplicada

Após aplicar, execute este SQL no SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('brands', 'roles', 'permissions', 'role_permissions', 'user_permission_overrides', 'audit_logs');

-- Ver roles criados
SELECT * FROM roles ORDER BY level DESC;

-- Ver permissões criadas
SELECT resource, COUNT(*) as total
FROM permissions
GROUP BY resource
ORDER BY total DESC;
```

Você deve ver:
- ✅ 6 tabelas criadas
- ✅ 6 roles (Owner, Manager, Financial, Waiter, Cashier, Kitchen)
- ✅ 40+ permissões distribuídas por recursos

---

## 🔧 Próximo Passo: Deploy da Edge Function

Após aplicar a migration com sucesso, você precisa fazer o deploy da Edge Function para criar usuários:

```bash
# Via Supabase CLI
supabase functions deploy create-user-admin
```

Ou siga o README em: `supabase/functions/create-user-admin/README.md`

---

## ⚠️ Troubleshooting

**Se der erro "column does not exist":**
- Isso significa que já foi aplicada parcialmente antes
- Execute apenas as partes que falharam
- Ou use DROP TABLE IF EXISTS antes de recriar

**Se der erro "already exists":**
- A migration já foi aplicada
- Você pode ignorar ou fazer DROP das tabelas primeiro

**Se der erro de permissão:**
- Certifique-se de estar usando o Service Role Key
- Ou estar logado como owner do projeto no Dashboard
