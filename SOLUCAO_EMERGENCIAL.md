# 🚨 SOLUÇÃO EMERGENCIAL - Desabilitar RLS Temporariamente

## ⚠️ IMPORTANTE
Esta é uma solução **TEMPORÁRIA** para você conseguir criar o primeiro restaurante e depois reabilitar o RLS com as políticas corretas.

---

## 🎯 Por Que Fazer Isso?

O erro 403/406 está impedindo que você:
1. Crie o primeiro restaurante como owner
2. Garçons/managers façam login

**Solução rápida:**
1. ✅ Desabilitar RLS temporariamente
2. ✅ Criar o restaurante
3. ✅ Reabilitar RLS com políticas corretas

---

## 📋 PASSO A PASSO

### ETAPA 1: Desabilitar RLS

👉 Abra: https://app.supabase.com/project/wisikawnpzrrfzqutatl/sql/new

**Execute:** `EMERGENCY_DISABLE_RLS.sql`

```sql
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
```

**Mensagem esperada:**
```
⚠️  RLS DESABILITADO  ⚠️
```

---

### ETAPA 2: Criar Restaurante

1. **Faça logout** do sistema
2. **Faça login** novamente
3. Você será redirecionado para `/setup`
4. **Preencha o formulário:**
   - Nome do Restaurante
   - URL Personalizada (slug)
   - Descrição, telefone, email
5. **Clique em "Criar Restaurante"**
6. ✅ O restaurante será criado sem erro!

---

### ETAPA 3: Reabilitar RLS (IMPORTANTE!)

⚠️ **NÃO PULE ESTA ETAPA!**

Volte ao SQL Editor e execute: `REENABLE_RLS.sql`

**Este script:**
- ✅ Reabilita RLS
- ✅ Cria políticas corretas
- ✅ Usa função PostgreSQL
- ✅ Funciona para owners E não-owners

**Mensagem esperada:**
```
✅ RLS REABILITADO ✅
✅ Tudo configurado corretamente!
```

---

### ETAPA 4: Testar

1. **Owner**: Faça logout e login
   - ✅ Deve ver o restaurante criado
   - ✅ Pode acessar normalmente

2. **Criar garçom/manager**:
   - Vá em Usuários
   - Adicione um novo usuário (garçom/manager)
   - Peça para ele fazer login
   - ✅ Deve funcionar normalmente!

---

## ⏱️ Tempo Estimado

- Desabilitar RLS: 30 segundos
- Criar restaurante: 2 minutos
- Reabilitar RLS: 30 segundos
- **Total: 3 minutos**

---

## 🔐 Segurança

**Durante a desabilitação:**
- ⚠️ Qualquer usuário autenticado pode ver/editar qualquer brand/restaurant
- ⚠️ Execute rapidamente e reabilite logo!

**Após reabilitar:**
- ✅ Owners só veem seus brands
- ✅ Usuários só veem brands onde têm brand_id
- ✅ Apenas owners podem criar/editar/deletar
- ✅ Sistema seguro novamente

---

## 📁 Arquivos

1. **`EMERGENCY_DISABLE_RLS.sql`** - Execute PRIMEIRO
2. **`REENABLE_RLS.sql`** - Execute DEPOIS de criar restaurante
3. **`SOLUCAO_EMERGENCIAL.md`** - Este documento

---

## ❓ E Se Algo Der Errado?

### Problema: Ainda dá erro após reabilitar RLS
**Solução:**
```sql
-- Execute novamente o REENABLE_RLS.sql
-- E verifique com DIAGNOSE_RLS.sql
```

### Problema: Esqueci de reabilitar RLS
**Solução:**
```sql
-- Execute REENABLE_RLS.sql o quanto antes!
-- Não importa quanto tempo passou
```

### Problema: Garçom ainda não consegue fazer login
**Solução:**
1. Verifique se o garçom tem `brand_id` no metadata
2. Execute `DIAGNOSE_RLS.sql` e me envie o resultado
3. Pode precisar atualizar o metadata do garçom

---

## ✅ Checklist

- [ ] Executei `EMERGENCY_DISABLE_RLS.sql`
- [ ] Fiz logout e login
- [ ] Criei o restaurante com sucesso
- [ ] Executei `REENABLE_RLS.sql` ⚠️ **IMPORTANTE!**
- [ ] Testei login como owner - funcionou
- [ ] Criei um garçom/manager
- [ ] Testei login do garçom - funcionou

---

## 🚀 Execute Agora!

**ETAPA 1:** Cole e execute `EMERGENCY_DISABLE_RLS.sql`
**ETAPA 2:** Crie seu restaurante
**ETAPA 3:** Cole e execute `REENABLE_RLS.sql`

**Me avise quando completar cada etapa!**
