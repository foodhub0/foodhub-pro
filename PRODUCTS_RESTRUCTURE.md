# Proposta: Reestruturação do Sistema de Produtos

## Problema Atual

A estrutura atual não suporta adequadamente:
- ❌ Agrupamento de adicionais (ex: "Sabores", "Borda", "Extras")
- ❌ Ordem de exibição dos grupos
- ❌ Quantidade mínima obrigatória
- ❌ Configurações por grupo (obrigatório, múltipla seleção)

## Nova Estrutura Proposta

### Nível 1: Categoria (MANTÉM)
```
categories
- id
- restaurant_id
- name (Pizzas, Hambúrgueres, Bebidas, Sobremesas)
- description
- image_url
- display_order
- is_active
```

### Nível 2: Produto (AJUSTADO)
```
products
- id
- restaurant_id
- category_id
- name
- description
- image_url
- base_price (preço do menor tamanho ou único)
- is_active
- is_featured
- manage_stock
- stock_quantity
- preparation_time
- has_sizes (NOVO: boolean - indica se tem tamanhos)
```

### Nível 2.5: Tamanhos do Produto (RENOMEADO de product_variations)
```
product_sizes
- id
- product_id
- name (P, M, G, etc)
- price (preço final, não modifier)
- display_order
- is_available (NOVO)
```

### Nível 3: Grupos de Adicionais (NOVO)
```
product_addon_groups
- id
- restaurant_id
- name (Sabores, Borda, Bebida Adicional, Extras, etc)
- description
- is_active
```

### Nível 3.5: Itens dos Grupos (NOVO)
```
addon_group_items
- id
- addon_group_id
- name (Mussarela, Calabresa, Catupiry, etc)
- price (preço adicional)
- display_order
- is_available
```

### Vínculo: Produto ↔ Grupo de Adicionais (NOVO)
```
product_addon_group_links
- id
- product_id
- addon_group_id
- is_required (obrigatório selecionar ao menos um)
- min_quantity (quantidade mínima)
- max_quantity (quantidade máxima, NULL = ilimitado)
- allow_multiple (permite seleções múltiplas)
- display_order (ordem de exibição no produto)
```

## Fluxo do Cliente

### Exemplo: Pedindo uma Pizza

1. **Escolher Produto**: Pizza Mussarela
2. **Escolher Tamanho**: P (R$25), M (R$35), G (R$45)
3. **Adicional 1 - Sabores** (obrigatório, min: 1, max: 2)
   - ☑ Mussarela (+R$0)
   - ☐ Calabresa (+R$3)
   - ☐ Frango (+R$3)
4. **Adicional 2 - Borda** (opcional, max: 1)
   - ☐ Catupiry (+R$5)
   - ☐ Cheddar (+R$5)
5. **Adicional 3 - Extras** (opcional, múltiplos)
   - ☐ Azeitona (+R$2)
   - ☐ Orégano (+R$0)

## Migração de Dados

### Estratégia

1. **Criar novas tabelas**
2. **Migrar dados existentes**:
   - `product_variations` → `product_sizes` (converter price_modifier para price absoluto)
   - `additionals` → criar grupo "Adicionais Gerais" + `addon_group_items`
   - `product_additionals` → `product_addon_group_links`
3. **Manter tabelas antigas** por segurança (renomear com sufixo `_old`)
4. **Depois de validar, dropar tabelas antigas**

## Vantagens

✅ **Organização**: Adicionais agrupados logicamente
✅ **Flexibilidade**: Grupos configuráveis por produto
✅ **UX Melhor**: Cliente vê opções organizadas em etapas
✅ **Validação**: Min/max quantities garantem pedidos válidos
✅ **Ordem**: display_order em grupos e itens
✅ **Escalabilidade**: Fácil adicionar novos grupos

## Exemplos de Configuração

### Pizza com 3 Grupos

```
Produto: Pizza Mussarela (R$25 base)

Tamanhos:
- P: R$25
- M: R$35
- G: R$45

Grupos:
1. Sabores (ordem: 1, obrigatório, min: 1, max: 2)
   - Mussarela (R$0)
   - Calabresa (R$3)
   - Frango (R$3)

2. Borda (ordem: 2, opcional, max: 1)
   - Catupiry (R$5)
   - Cheddar (R$5)

3. Extras (ordem: 3, opcional, múltiplos)
   - Azeitona (R$2)
   - Orégano (R$0)
```

### Hambúrguer com 2 Grupos

```
Produto: X-Bacon (R$18 único tamanho)

Grupos:
1. Ponto da Carne (ordem: 1, obrigatório, min: 1, max: 1)
   - Mal passado (R$0)
   - Ao ponto (R$0)
   - Bem passado (R$0)

2. Extras (ordem: 2, opcional, múltiplos)
   - Bacon extra (R$3)
   - Queijo extra (R$2)
   - Cebola caramelizada (R$2)
```

## Próximos Passos

1. ✅ Aprovar estrutura
2. 🔧 Criar migration
3. 🔧 Atualizar RLS policies
4. 🔧 Refatorar componentes React
5. 🔧 Atualizar formulários de cadastro
6. 🔧 Atualizar preview/cardápio público
7. ✅ Testar fluxo completo
