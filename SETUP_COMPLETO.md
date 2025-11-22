# 🎯 SETUP COMPLETO - FoodHub Pro Owner System

Este guia garante que TUDO funcione 100%.

---

## 📌 ORDEM DE EXECUÇÃO

Siga EXATAMENTE nesta ordem:

1. ✅ Migração SQL
2. ✅ Deploy da Edge Function
3. ✅ Atualizar Metadata do Owner
4. ✅ Logout e Login
5. ✅ Testar

---

## 1️⃣ MIGRAÇÃO SQL

### Executar no Supabase Dashboard:

1. Vá em: https://app.supabase.com
2. Abra seu projeto
3. **SQL Editor** → **New Query**
4. Cole o SQL abaixo e clique **RUN**:

```sql
-- ============================================================================
-- MIGRAÇÃO FINAL: Políticas RLS sem duplicação
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover TODAS as políticas de brands
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'brands' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.brands';
    END LOOP;

    -- Remover TODAS as políticas de restaurants
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'restaurants' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.restaurants';
    END LOOP;

    RAISE NOTICE 'Políticas antigas removidas';
END $$;

-- Criar políticas para BRANDS
CREATE POLICY "brands_select_policy" ON public.brands FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "brands_insert_policy" ON public.brands FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "brands_update_policy" ON public.brands FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "brands_delete_policy" ON public.brands FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Criar políticas para RESTAURANTS
CREATE POLICY "restaurants_select_policy" ON public.restaurants FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "restaurants_insert_policy" ON public.restaurants FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "restaurants_update_policy" ON public.restaurants FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "restaurants_delete_policy" ON public.restaurants FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Garantir role owner
INSERT INTO public.roles (name, display_name, description, level, color)
VALUES ('owner', 'Dono', 'Proprietário do sistema com acesso total', 100, '#8b5cf6')
ON CONFLICT (name) DO UPDATE SET display_name = 'Dono', level = 100, color = '#8b5cf6';

-- Mostrar Owner Role ID (COPIE ESTE ID!)
SELECT id as owner_role_id FROM public.roles WHERE name = 'owner';
```

### ⚠️ IMPORTANTE!
**COPIE o `owner_role_id`** que aparecer no resultado! Você vai precisar dele no passo 3.

---

## 2️⃣ DEPLOY DA EDGE FUNCTION

No terminal:

```bash
# Navegar para o projeto
cd /home/user/foodhub-pro

# Login no Supabase
supabase login

# Linkar projeto (SUBSTITUA SEU_PROJECT_REF pelo ID do seu projeto)
supabase link --project-ref SEU_PROJECT_REF

# Deploy da Edge Function
supabase functions deploy create-user-admin
```

### Como encontrar seu Project Reference:
1. Dashboard Supabase → **Settings** → **General**
2. Copie o **Reference ID**

### Verificar se funcionou:
```bash
supabase functions list
```

Deve aparecer `create-user-admin` como **ACTIVE**.

---

## 3️⃣ ATUALIZAR METADATA DO OWNER

No **Console do navegador** (F12) do FoodHub Pro:

```javascript
// COLE O OWNER_ROLE_ID QUE VOCÊ COPIOU NO PASSO 1
const OWNER_ROLE_ID = 'COLE_AQUI_O_ID_DO_PASSO_1';

// Pegar usuário atual
const { data: { user } } = await supabase.auth.getUser();

console.log('📋 Metadata ANTES:', user.user_metadata);

// Atualizar metadata
await supabase.auth.updateUser({
  data: {
    ...user.user_metadata,
    role_name: 'owner',
    role_id: OWNER_ROLE_ID,
  }
});

console.log('✅ Metadata atualizado! Faça logout e login agora.');
```

---

## 4️⃣ LOGOUT E LOGIN

1. Clique em **Sair** no menu
2. Faça **Login** novamente
3. **Recarregue** a página (F5)

---

## 5️⃣ TESTAR TUDO

### ✅ Teste 1: Verificar Role

No console (F12):

```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('role_name:', user.user_metadata.role_name);
console.log('role_id:', user.user_metadata.role_id);
console.log('brand_id:', user.user_metadata.brand_id);
```

**Esperado:**
```javascript
role_name: "owner"
role_id: "algum-uuid"
brand_id: "algum-uuid"
```

---

### ✅ Teste 2: Menu Lateral

Você deve ver TODAS estas opções:

- ✅ Início
- ✅ Dashboard
- ✅ Pedidos
- ✅ Clientes
- ✅ Meu Restaurante
- ✅ Produtos
- ✅ Mesas
- ✅ Custos
- ✅ Entregadores
- ✅ Cardápio
- ✅ Analytics
- ✅ **Usuários** ← DEVE APARECER!

---

### ✅ Teste 3: Aba "Início"

1. Clique em **Início**
2. Deve carregar sem erro
3. **NÃO** deve mostrar "Marca não encontrada"

---

### ✅ Teste 4: Aba "Usuários"

1. Clique em **Usuários**
2. Deve mostrar lista de usuários
3. **NÃO** deve mostrar "Marca não encontrada"

---

### ✅ Teste 5: Criar Usuário

1. **Usuários** → **Novo Usuário**
2. Preencha os dados:
   - Nome: João Silva
   - Email: joao@teste.com
   - Perfil: Gerente
   - Senha: (clique em Gerar)
3. Clique **Criar Usuário**
4. **Resultado esperado:** ✅ Usuário criado sem desconectar você!

---

## 🆘 TROUBLESHOOTING

### ❌ "Marca não encontrada" ainda aparece

**Solução:**
```javascript
// No console (F12)
const { data: { user } } = await supabase.auth.getUser();
console.log('Metadata:', user.user_metadata);

// Se brand_id estiver undefined, buscar e atualizar:
const { data: brands } = await supabase.from('brands').select('*').eq('owner_id', user.id);
console.log('Suas brands:', brands);

if (brands && brands.length > 0) {
  await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      brand_id: brands[0].id,
      role_name: 'owner',
    }
  });
  console.log('✅ Brand ID atualizado! Recarregue a página.');
}
```

---

### ❌ "Failed to send request to Edge Function"

**Causa:** Edge Function não foi deployada.

**Solução:**
```bash
supabase functions deploy create-user-admin
```

---

### ❌ Abas "Início" e "Usuários" não aparecem

**Causa:** `role_id` não está definido.

**Solução:** Execute novamente o **Passo 3**.

---

### ❌ Erro 406 ao buscar brands/restaurants

**Causa:** Políticas RLS bloqueando acesso.

**Solução:** Execute novamente a **Migração SQL do Passo 1**.

---

## ✅ CHECKLIST FINAL

Marque tudo que funcionou:

- [ ] Migração SQL executada sem erro
- [ ] Edge Function deployada
- [ ] Metadata atualizado com `role_id` e `role_name`
- [ ] Logout e login realizados
- [ ] Console mostra `role_name: "owner"`
- [ ] Aba "Início" funciona
- [ ] Aba "Usuários" funciona
- [ ] Consegue criar usuários sem perder sessão
- [ ] Não vê "Marca não encontrada"

---

## 🎉 TUDO FUNCIONANDO!

Se marcou todos os itens acima, **PARABÉNS!** 🚀

Seu sistema está 100% funcional:
- ✅ Você é owner
- ✅ Tem acesso total
- ✅ Pode criar usuários
- ✅ Dados reais conectados
- ✅ Sem mocks

---

**Qualquer dúvida, consulte os logs:**

```javascript
// Ver logs do BrandContext
// (Abra o console e recarregue a página)

// Ver logs do PermissionsContext
// (Vai mostrar se role foi carregado)
```
