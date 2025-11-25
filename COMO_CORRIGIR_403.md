# 🚨 Correção Erro 403 - Passo a Passo

## Situação Atual
O erro 403 persiste mesmo após executar o primeiro script. Vamos diagnosticar e corrigir o problema.

---

## 📋 PASSO 1: Diagnóstico

Execute este script primeiro para ver o que está acontecendo:

👉 **Abra:** https://app.supabase.com/project/wisikawnpzrrfzqutatl/sql/new

**Cole o conteúdo do arquivo:** `DIAGNOSE_RLS.sql`

**Execute e veja os resultados:**
- RLS está habilitado?
- Quantas políticas existem?
- As políticas têm a estrutura correta?

---

## 🔧 PASSO 2: Correção Alternativa

Se o diagnóstico mostrou problemas ou muitas políticas, execute:

**Cole o conteúdo do arquivo:** `FIX_RLS_ALTERNATIVE.sql`

Este script:
1. ✅ Desabilita RLS temporariamente
2. ✅ Remove TODAS as políticas antigas
3. ✅ Reabilita RLS
4. ✅ Cria políticas **SIMPLIFICADAS** (apenas para owners por enquanto)
5. ✅ Verifica se tudo foi criado corretamente

**Mensagem de Sucesso Esperada:**
```
✓ SUCESSO! Políticas simplificadas criadas
✓ Owners podem fazer login agora

NOTA: Essas são políticas simplificadas
Apenas OWNERS podem acessar por enquanto
```

---

## 🧪 PASSO 3: Teste

1. Recarregue a página de login
2. Tente fazer login com uma conta **OWNER**
3. Verifique no console (F12) se não há mais erro 403

---

## ❓ O Que Mudou?

### Script Original (não funcionou):
```sql
USING (
  owner_id = auth.uid()
  OR id = (SELECT ...)  -- Subquery pode causar problemas
)
```

### Script Alternativo (simplificado):
```sql
USING (owner_id = auth.uid())  -- Apenas verificação direta
```

---

## 🎯 Próximos Passos

**Se o script alternativo funcionar:**
1. ✅ Owners poderão fazer login
2. ⚠️ Usuários não-owners ainda não conseguirão (isso é temporário)
3. 📝 Depois adicionaremos políticas para não-owners de forma mais cuidadosa

**Me diga após executar o script alternativo:**
- ✅ Login de owner funcionou?
- ❌ Ainda dá erro 403?
- 📊 O que apareceu no diagnóstico?

---

## 📁 Arquivos

1. **DIAGNOSE_RLS.sql** - Diagnóstico do problema
2. **FIX_RLS_ALTERNATIVE.sql** - Correção alternativa simplificada
3. **FIX_RLS_NOW.sql** - Script original (com subquery)

---

## 🆘 Se Nada Funcionar

Pode haver outros problemas:
- Configurações de segurança do Supabase
- Problemas com o token de autenticação
- RLS não habilitado corretamente
- Conflitos com outras políticas em outras tabelas

Me informe o resultado para continuarmos investigando!
