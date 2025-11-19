# Plano de Refatoração - Sistema de Produtos

## Status Atual

### Arquivos Afetados pela Mudança de Estrutura

1. **src/pages/Products.tsx** ❌
   - Problema: Só gerencia info básica do produto
   - Falta: Interface para gerenciar sizes e addon groups
   - Necessário: Adicionar tabs/seções para sizes e addons

2. **src/components/ProductModal.tsx** ❌ CRÍTICO
   - Problema: Usa `product_variations` (será `product_variations_old`)
   - Problema: Não suporta grupos de adicionais
   - Problema: Sem validação de min/max/required
   - Necessário: Reescrever completamente

3. **src/pages/MenuPreview.tsx** ⚠️
   - Problema: Usa ProductModal (que vai quebrar)
   - Solução: Funcionará após atualizar ProductModal

4. **src/pages/PublicMenu.tsx** ⚠️
   - Problema: Usa ProductModal (que vai quebrar)
   - Solução: Funcionará após atualizar ProductModal

## Estratégia de Refatoração

### Fase 1: Atualizar Backend Types

Criar tipos TypeScript para nova estrutura:
- `ProductSize`
- `ProductAddonGroup`
- `AddonGroupItem`
- `ProductAddonGroupLink`

### Fase 2: Refatorar Products.tsx (Admin)

Adicionar 3 abas/seções:

#### Aba 1: Informações Básicas
- Nome, descrição, imagem, categoria
- **Campo novo**: `has_sizes` (toggle)
- Se `has_sizes = false`: mostrar campo `base_price`
- Se `has_sizes = true`: ocultar `base_price` (será definido nos sizes)
- is_active, is_featured

#### Aba 2: Tamanhos (se has_sizes = true)
- Lista de tamanhos (P, M, G, etc)
- Cada tamanho tem: name, price (absoluto), is_available
- Botão: Adicionar Tamanho
- Ordenar por display_order (drag & drop seria ideal)

#### Aba 3: Grupos de Adicionais
- Vincular produto aos grupos existentes
- Configurar: is_required, min_quantity, max_quantity, allow_multiple
- Definir display_order (ordem de apresentação)

### Fase 3: Criar Página de Grupos de Adicionais

Nova página: **src/pages/AddonGroups.tsx**

Funcionalidades:
- CRUD de grupos (nome, descrição)
- Gerenciar itens do grupo (nome, preço, order)
- Drag & drop para ordenar itens

Estrutura:
```
Grupos de Adicionais
├─ Sabores
│  ├─ Mussarela (R$0)
│  ├─ Calabresa (R$3)
│  └─ Frango (R$3)
├─ Borda
│  ├─ Catupiry (R$5)
│  └─ Cheddar (R$5)
└─ Extras
   ├─ Azeitona (R$2)
   └─ Orégano (R$0)
```

### Fase 4: Refatorar ProductModal.tsx (Customer)

Fluxo completo redesenhado:

#### Passo 1: Escolher Tamanho (se has_sizes)
```tsx
if (product.has_sizes) {
  // Radio buttons para tamanhos
  // Cliente DEVE escolher um
}
```

#### Passo 2: Grupos de Adicionais (em ordem)
```tsx
// Para cada grupo (ordenado por display_order):
<AddonGroupSection
  group={group}
  link={link} // tem is_required, min, max
  selectedItems={selectedItems}
  onItemsChange={handleItemsChange}
/>
```

Validações:
- ✅ Grupo obrigatório: cliente deve selecionar min_quantity
- ✅ Max quantity: não pode selecionar mais que max
- ✅ Allow multiple: checkbox vs radio

#### Passo 3: Quantidade e Observações
- Igual ao atual

#### Passo 4: Adicionar ao Carrinho
- Validar antes:
  - Se has_sizes: size foi selecionado?
  - Para cada grupo required: min_quantity atingido?
  - Para cada item: max_quantity respeitado?

### Fase 5: Atualizar CartContext

Atualizar estrutura do cart item:

```typescript
interface CartItem {
  productId: string;
  productName: string;
  productImage: string | null;

  // NOVO: Size selecionado
  size?: {
    id: string;
    name: string;
    price: number;
  };

  // ATUALIZADO: Adicionais agora são por grupo
  addonGroups?: Array<{
    groupId: string;
    groupName: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number; // quantas vezes o adicional foi selecionado
    }>;
  }>;

  quantity: number; // quantidade do produto
  notes?: string;
  restaurantId: string;
}
```

Cálculo do preço:
```typescript
const itemTotal = (
  (size?.price || product.base_price) +
  addonGroups.reduce((sum, group) =>
    sum + group.items.reduce((s, item) =>
      s + (item.price * item.quantity), 0
    ), 0
  )
) * quantity;
```

## Ordem de Implementação

1. ✅ Migration criada (20251119_restructure_products_system.sql)
2. 🔧 Aplicar migration (`supabase db push`)
3. 🔧 Criar types TypeScript
4. 🔧 Criar página AddonGroups.tsx
5. 🔧 Refatorar Products.tsx (adicionar abas)
6. 🔧 Refatorar ProductModal.tsx (fluxo completo)
7. 🔧 Atualizar CartContext e CartDrawer
8. ✅ Testar fluxo completo

## Tipos TypeScript (Criar em integrations/supabase/types.ts)

```typescript
export interface ProductSize {
  id: string;
  product_id: string;
  name: string;
  price: number;
  display_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAddonGroup {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddonGroupItem {
  id: string;
  addon_group_id: string;
  name: string;
  price: number;
  display_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAddonGroupLink {
  id: string;
  product_id: string;
  addon_group_id: string;
  is_required: boolean;
  min_quantity: number;
  max_quantity: number | null;
  allow_multiple: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;

  // Relations
  product_addon_groups?: ProductAddonGroup;
}

// Atualizar Product type
export interface Product {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  has_sizes: boolean; // NOVO
  is_active: boolean;
  is_featured: boolean;
  manage_stock: boolean;
  stock_quantity: number;
  preparation_time: number;
  created_at: string;
  updated_at: string;

  // Relations
  categories?: { name: string };
  product_sizes?: ProductSize[];
  product_addon_group_links?: ProductAddonGroupLink[];
}
```

## Considerações de UX

### Para o Admin (Products.tsx)

- **Wizard-style**: Guiar o admin passo a passo
  1. Criar produto básico
  2. Se tem tamanhos, adicionar sizes
  3. Vincular grupos de adicionais

- **Validações**:
  - Se `has_sizes = true`: deve ter pelo menos 1 size
  - Avisar se produto não tem grupos vinculados

### Para o Cliente (ProductModal.tsx)

- **Visual claro**: Mostrar preço atualizado em tempo real
- **Grupos obrigatórios**: Destacar visualmente
- **Validação em tempo real**:
  - "Selecione pelo menos 1 sabor"
  - "Máximo 2 sabores"
- **Contador de itens**: "1/2 selecionados"

## Sincronização Preview ↔ Publicado

**Problema atual**: User reportou divergência

**Investigar**:
- MenuPreview usa quais dados?
- PublicMenu usa quais dados?
- Existe sistema de "publicar" ou tudo é real-time?

**Solução**:
- Se ambos usam mesmas tabelas: devem estar sincronizados
- Se Preview tem cache: limpar cache
- Se existe sistema publish/draft: implementar toggle

## Testes Necessários

### Teste 1: Produto sem Tamanhos
- Pizza preço único R$25
- Adicionar grupo "Extras" (opcional)
- Cliente deve ver: R$25 + extras

### Teste 2: Produto com Tamanhos
- Pizza com P (R$25), M (R$35), G (R$45)
- Grupo "Sabores" (obrigatório, min:1, max:2)
- Grupo "Borda" (opcional, max:1)
- Cliente escolhe M + 2 sabores + borda = R$35 + R$6 + R$5 = R$46

### Teste 3: Validações
- Tentar adicionar sem escolher tamanho: erro
- Tentar adicionar sem sabor obrigatório: erro
- Tentar selecionar 3 sabores (max=2): bloqueado

### Teste 4: Carrinho
- Adicionar 2x Pizza M com sabores diferentes
- Deve criar 2 line items separados
- Total correto

## Próximos Passos Imediatos

1. Aplicar migration no banco
2. Criar tipos TypeScript
3. Criar componente AddonGroupsManager
4. Refatorar ProductModal (prioridade alta - está quebrado após migration)
