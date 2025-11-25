# 🚨 CORREÇÃO URGENTE - Erro 403 Forbidden

## ⚠️ Problema Atual

**ERRO 403** ao tentar fazer login - usuários não conseguem acessar o sistema!

```
Failed to load resource: the server responded with a status of 403
[BrandContext] Existing brands: null
[BrandContext] Restaurant query result: null
```

As políticas RLS (Row Level Security) estão **bloqueando completamente** o acesso às tabelas `brands` e `restaurants`.

---

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### **Execute o script SQL abaixo AGORA:**

#### Passo 1️⃣: Acesse o Dashboard
👉 **[Clique aqui para abrir o SQL Editor](https://app.supabase.com/project/wisikawnpzrrfzqutatl/sql/new)**

#### Passo 2️⃣: Copie o Script
Abra o arquivo **`FIX_RLS_NOW.sql`** na raiz do projeto

#### Passo 3️⃣: Execute
1. Cole todo o conteúdo no SQL Editor
2. Clique em **RUN** ou pressione `Ctrl+Enter`
3. Aguarde a mensagem de sucesso:
   ```
   ✓ SUCESSO! Todas as políticas foram criadas
   ✓ Usuários podem fazer login agora
   ```

#### Passo 4️⃣: Teste
Recarregue a página de login e tente entrar novamente

---

## 📋 O que o Script Faz

1. ❌ Remove **todas** as políticas RLS antigas que estão causando erro 403
2. ✅ Cria novas políticas que permitem:
   - **Owners**: Acessar seus próprios brands/restaurants
   - **Usuários não-owners**: Acessar através do `brand_id` no metadata
3. 🔒 Mantém segurança: Apenas owners podem INSERT/UPDATE/DELETE

---

## 🔍 Detalhes Técnicos

### Políticas Criadas

**Brands (4 políticas):**
- `brands_select_policy` - Permite SELECT para owners e usuários com brand_id
- `brands_insert_policy` - INSERT apenas para owners
- `brands_update_policy` - UPDATE apenas para owners
- `brands_delete_policy` - DELETE apenas para owners

**Restaurants (4 políticas):**
- `restaurants_select_policy` - Permite SELECT para owners e usuários com brand_id
- `restaurants_insert_policy` - INSERT apenas para owners
- `restaurants_update_policy` - UPDATE apenas para owners
- `restaurants_delete_policy` - DELETE apenas para owners

---

## ⚡ Método Alternativo (CLI)

Se você tiver o Supabase CLI autenticado:

```bash
npx supabase db push
```

---

## 🧪 Após Aplicar - Como Verificar

### ✅ Mensagem de Sucesso no SQL Editor:
```
✓ SUCESSO! Todas as políticas foram criadas
✓ Usuários podem fazer login agora
```

### ✅ No Console do Navegador (F12):
- ❌ Não deve aparecer mais: `Failed to load resource: 403`
- ✅ Deve aparecer: `[BrandContext] Brand query result: [Object]`
- ✅ Login deve funcionar normalmente

---

## 📁 Arquivos Relacionados

- **`FIX_RLS_NOW.sql`** - Script para executar agora
- **`supabase/migrations/20251125_fix_brand_rls_for_non_owners.sql`** - Migration versionada
