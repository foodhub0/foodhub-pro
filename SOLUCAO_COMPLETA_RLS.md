# 🎯 SOLUÇÃO COMPLETA - Erro RLS 403/406

## 📊 Problemas Identificados

### 1. **Owner não consegue criar restaurante**
- Erro 403/406 ao tentar acessar tabelas `brands` e `restaurants`
- Vê mensagem "Nenhum restaurante encontrado"
- É redirecionado para página de Setup mas não consegue criar

### 2. **Garçom/Manager não consegue fazer login**
- Tem `brand_id` correto no metadata
- Erro 406 ao buscar brand e restaurants
- Query retorna null mesmo com dados corretos

### 3. **Causa Raiz**
As políticas RLS que foram aplicadas não estão funcionando corretamente:
- Script `FIX_RLS_NOW.sql` usava subqueries que podem causar problemas
- Script `FIX_RLS_ALTERNATIVE.sql` só permitia owners (temporário)
- Necessário uma solução que funcione para TODOS os tipos de usuários

---

## ✅ SOLUÇÃO DEFINITIVA

Execute o script **`FIX_RLS_COMPLETE.sql`** no dashboard do Supabase.

### 🔑 O Que Este Script Faz Diferente:

1. **Cria função PostgreSQL auxiliar**
   ```sql
   CREATE FUNCTION get_user_brand_id() RETURNS uuid
   ```
   - Retorna o `brand_id` do usuário logado
   - Evita problemas com subqueries inline
   - Mais eficiente e confiável

2. **Remove TODAS as políticas antigas**
   - Limpa completamente as políticas problemáticas
   - Garante que não há conflitos

3. **Cria políticas que funcionam para TODOS**
   - **Owners**: Acesso via `owner_id = auth.uid()`
   - **Não-owners**: Acesso via `brand_id = get_user_brand_id()`
   - **Segurança**: Apenas owners podem INSERT/UPDATE/DELETE

---

## 📋 COMO APLICAR

### Passo 1: Abra o SQL Editor
👉 https://app.supabase.com/project/wisikawnpzrrfzqutatl/sql/new

### Passo 2: Execute o Script
Cole todo o conteúdo de **`FIX_RLS_COMPLETE.sql`** e execute (Ctrl+Enter)

### Passo 3: Verifique a Mensagem
```
✅ SUCESSO COMPLETO!
✅ Owners podem criar/ver restaurantes
✅ Garçons/managers podem ver restaurantes
✅ Políticas funcionando para TODOS os usuários
```

### Passo 4: Teste
1. **Owner**: Recarregue e crie um restaurante
2. **Garçom**: Faça login - deve ver o restaurante

---

## 🔍 Diferença Entre os Scripts

### `FIX_RLS_NOW.sql` ❌ (não funcionou)
```sql
-- Subquery inline pode causar problemas
USING (
  owner_id = auth.uid()
  OR id = (SELECT brand_id FROM auth.users WHERE...)
)
```

### `FIX_RLS_ALTERNATIVE.sql` ⚠️ (temporário)
```sql
-- Apenas para owners
USING (owner_id = auth.uid())
```

### `FIX_RLS_COMPLETE.sql` ✅ (solução final)
```sql
-- Função PostgreSQL + políticas completas
CREATE FUNCTION get_user_brand_id() RETURNS uuid ...

USING (
  owner_id = auth.uid()
  OR id = get_user_brand_id()  -- Usa a função
)
```

---

## 🎯 Resultados Esperados

### ✅ Para Owners:
- Conseguem criar restaurantes sem erro
- Veem todos os seus restaurantes
- Podem gerenciar brands e restaurants

### ✅ Para Garçons/Managers:
- Fazem login normalmente
- Veem o brand e restaurants corretos
- Acessam apenas seu contexto (não podem ver outros brands)

### ✅ Para o Sistema:
- RLS funcionando corretamente
- Segurança mantida
- Performance melhorada (função PostgreSQL é mais rápida)

---

## 🆘 Se Ainda Não Funcionar

Se após executar o script o problema persistir, execute também:

### Script de Diagnóstico
Cole `DIAGNOSE_RLS.sql` e me envie o resultado. Isso mostrará:
- Quantas políticas existem
- Se RLS está habilitado
- Se a função foi criada

### Informações Úteis
Me envie:
1. ❓ Qual mensagem apareceu após executar o script?
2. ❓ Ainda dá erro 403 ou 406?
3. ❓ Owner consegue criar restaurante?
4. ❓ Garçom consegue fazer login?

---

## 📁 Arquivos no Projeto

1. **`FIX_RLS_COMPLETE.sql`** ⭐ - Execute ESTE agora
2. **`DIAGNOSE_RLS.sql`** - Para diagnóstico se necessário
3. **`FIX_RLS_NOW.sql`** - Primeiro script (não funcionou)
4. **`FIX_RLS_ALTERNATIVE.sql`** - Script temporário
5. **`SOLUCAO_COMPLETA_RLS.md`** - Este documento

---

## 🔐 Segurança

As políticas criadas são seguras:
- ✅ Owners só veem seus próprios brands
- ✅ Usuários só veem brands onde têm brand_id
- ✅ Apenas owners podem criar/editar/deletar
- ✅ Não há acesso cruzado entre brands diferentes

---

## ✨ Próximos Passos Após Correção

1. Owner cria o primeiro restaurante
2. Owner adiciona garçons/managers
3. Garçons/managers fazem login e acessam seu restaurante
4. Sistema funciona normalmente!

**Execute o script `FIX_RLS_COMPLETE.sql` AGORA e me avise o resultado! 🚀**
