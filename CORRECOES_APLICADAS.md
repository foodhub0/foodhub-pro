# Correções Aplicadas e Próximos Passos

## ✅ Problema 1: Garçom com acesso à aba Clientes
**Status:** ✅ CORRIGIDO

### O que foi feito:
- Removidas permissões `customers.create` e `customers.read` do role `waiter` no banco de dados
- Agora garçons **NÃO** veem a aba "Clientes" no menu

### Permissões atuais do garçom:
- `orders`: create, read, execute
- `tables`: create, read, update

---

## ⚠️ Problema 2: Aba "Início" não conectada ao banco (Dashboard)
**Status:** ⚠️ REQUER CORREÇÃO NO CÓDIGO

### Problema identificado:
O arquivo `/src/pages/DashboardNew.tsx` (linhas 72-97) busca restaurante com:
```typescript
const { data: restaurant } = await supabase
  .from("restaurants")
  .select("id")
  .eq("owner_id", user.id)  // ❌ Só funciona para owners
  .single();
```

Isso **não funciona para garçons** porque eles não são owners do restaurante.

### Solução necessária:
Usar o `BrandContext` que já tem o `currentRestaurant`:

```typescript
// Adicionar import
import { useBrand } from "@/contexts/BrandContext";

// No component
const { currentRestaurant, isLoading } = useBrand();

// Simplificar checkAuth
const checkAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    navigate("/auth");
    return;
  }

  // Aguardar BrandContext carregar
  if (isLoading) return;

  if (!currentRestaurant) {
    toast({
      title: "Nenhum restaurante encontrado",
      description: "Você precisa criar um restaurante primeiro.",
      variant: "destructive",
    });
    navigate("/setup");
    return;
  }

  setRestaurantId(currentRestaurant.id);
};
```

**Arquivo a editar:** `/src/pages/DashboardNew.tsx`

---

## ❓ Problema 3: Onde owner cria novos restaurantes?
**Status:** ⚠️ FUNCIONALIDADE NÃO EXISTE

### Situação atual:
- Página `/setup` só cria o PRIMEIRO restaurante
- Não existe interface para owner adicionar mais restaurantes
- Owner com múltiplos restaurantes precisa gerenciá-los

### Solução sugerida:
**Opção A:** Adicionar botão na página `/brand-dashboard` ou `/restaurant`

**Opção B:** Criar nova página `/restaurants/new` com formulário

### Implementação sugerida:
1. Adicionar botão "Adicionar Restaurante" na página `/brand-dashboard`
2. Abrir modal ou navegar para formulário
3. Criar novo restaurante com:
   - Mesmo `brand_id` do owner
   - Próximo `restaurant_index` disponível
   - Mesmo `owner_id`

---

## 📝 Resumo das Ações Necessárias

### ✅ Já Aplicado (Via SQL):
1. ✅ Políticas RLS simplificadas funcionando
2. ✅ Garçom sem acesso a "Clientes"

### ⚠️ Requer Edição de Código:
1. **Dashboard (`DashboardNew.tsx`):**
   - Adicionar `import { useBrand }`
   - Usar `currentRestaurant` ao invés de buscar por `owner_id`
   - Remover lógica que redireciona garçom para `/setup`

2. **Adicionar funcionalidade de criar restaurantes:**
   - Interface para owner adicionar novos restaurantes
   - Sugestão: Botão em `/brand-dashboard`

---

## 🧪 Como Testar Após Correções:

### Teste 1: Garçom não vê Clientes
1. Login como garçom
2. Verificar menu lateral
3. ✅ Não deve aparecer "Clientes"

### Teste 2: Dashboard funciona para todos
1. Login como owner → Dashboard carrega
2. Login como garçom → Dashboard carrega
3. ✅ Ambos veem estatísticas

### Teste 3: Owner cria novo restaurante
1. Login como owner
2. Ir para `/brand-dashboard` ou interface de restaurantes
3. Clicar "Adicionar Restaurante"
4. Preencher dados
5. ✅ Novo restaurante criado

---

## 📂 Arquivos que Precisam de Edição:

1. **`/src/pages/DashboardNew.tsx`**
   - Linha 19: Adicionar import `useBrand`
   - Linhas 72-97: Substituir lógica de `checkAuth`

2. **`/src/pages/BrandDashboard.tsx`** (opcional)
   - Adicionar botão/modal para criar novo restaurante

3. **`/src/pages/Restaurant.tsx`** (opcional)
   - Adicionar seção para gerenciar múltiplos restaurantes

---

## 🔄 Próximos Passos Recomendados:

1. **Corrigir DashboardNew.tsx** para usar BrandContext
2. **Criar interface** para adicionar restaurantes
3. **Testar** com owner e garçom
4. **Verificar** todas as outras páginas que usam `owner_id` diretamente

---

**Deseja que eu implemente alguma dessas correções agora?**
