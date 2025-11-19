/**
 * Tipos TypeScript para a Nova Estrutura de Produtos
 * Corresponde às tabelas criadas em: 20251119_restructure_products_system.sql
 */

// ============================================================================
// PRODUCT SIZES (Tamanhos de Produtos)
// ============================================================================

export interface ProductSize {
  id: string;
  product_id: string;
  name: string; // P, M, G, 300ml, 500ml, etc
  price: number; // Preço absoluto (não modifier)
  display_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductSizeInsert {
  id?: string;
  product_id: string;
  name: string;
  price: number;
  display_order?: number;
  is_available?: boolean;
}

export interface ProductSizeUpdate {
  name?: string;
  price?: number;
  display_order?: number;
  is_available?: boolean;
}

// ============================================================================
// ADDON GROUPS (Grupos de Adicionais)
// ============================================================================

export interface ProductAddonGroup {
  id: string;
  restaurant_id: string;
  name: string; // Sabores, Borda, Extras, etc
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAddonGroupInsert {
  id?: string;
  restaurant_id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface ProductAddonGroupUpdate {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

// ============================================================================
// ADDON GROUP ITEMS (Itens dentro dos Grupos)
// ============================================================================

export interface AddonGroupItem {
  id: string;
  addon_group_id: string;
  name: string; // Mussarela, Calabresa, Catupiry, etc
  price: number; // Preço adicional
  display_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddonGroupItemInsert {
  id?: string;
  addon_group_id: string;
  name: string;
  price: number;
  display_order?: number;
  is_available?: boolean;
}

export interface AddonGroupItemUpdate {
  name?: string;
  price?: number;
  display_order?: number;
  is_available?: boolean;
}

// ============================================================================
// PRODUCT ↔ ADDON GROUP LINKS (Vínculos com Configurações)
// ============================================================================

export interface ProductAddonGroupLink {
  id: string;
  product_id: string;
  addon_group_id: string;
  is_required: boolean; // Cliente DEVE selecionar ao menos min_quantity
  min_quantity: number; // Quantidade mínima a selecionar
  max_quantity: number | null; // Quantidade máxima (NULL = ilimitado)
  allow_multiple: boolean; // Permite seleções múltiplas do mesmo item
  display_order: number; // Ordem de exibição no produto
  created_at: string;
  updated_at: string;
}

export interface ProductAddonGroupLinkInsert {
  id?: string;
  product_id: string;
  addon_group_id: string;
  is_required?: boolean;
  min_quantity?: number;
  max_quantity?: number | null;
  allow_multiple?: boolean;
  display_order?: number;
}

export interface ProductAddonGroupLinkUpdate {
  is_required?: boolean;
  min_quantity?: number;
  max_quantity?: number | null;
  allow_multiple?: boolean;
  display_order?: number;
}

// ============================================================================
// PRODUCT (Atualizado)
// ============================================================================

export interface Product {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number; // Usado se has_sizes = false
  has_sizes: boolean; // NOVO: Indica se produto tem tamanhos
  is_active: boolean;
  is_featured: boolean;
  manage_stock: boolean;
  stock_quantity: number;
  preparation_time: number;
  created_at: string;
  updated_at: string;

  // Relações opcionais (para queries com join)
  categories?: {
    id: string;
    name: string;
    display_order: number;
  };
  product_sizes?: ProductSize[];
  product_addon_group_links?: (ProductAddonGroupLink & {
    product_addon_groups?: ProductAddonGroup & {
      addon_group_items?: AddonGroupItem[];
    };
  })[];
}

export interface ProductInsert {
  id?: string;
  restaurant_id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  image_url?: string | null;
  base_price: number;
  has_sizes?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  manage_stock?: boolean;
  stock_quantity?: number;
  preparation_time?: number;
}

export interface ProductUpdate {
  category_id?: string | null;
  name?: string;
  description?: string | null;
  image_url?: string | null;
  base_price?: number;
  has_sizes?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  manage_stock?: boolean;
  stock_quantity?: number;
  preparation_time?: number;
}

// ============================================================================
// TYPES PARA VIEWS (Queries Complexas)
// ============================================================================

/**
 * Produto com todos os seus tamanhos
 */
export interface ProductWithSizes extends Product {
  sizes: ProductSize[];
}

/**
 * Grupo de Adicionais com seus itens
 */
export interface AddonGroupWithItems extends ProductAddonGroup {
  items: AddonGroupItem[];
}

/**
 * Vínculo completo: Produto → Grupo → Itens + Configurações
 */
export interface ProductAddonGroupLinkComplete extends ProductAddonGroupLink {
  group: AddonGroupWithItems;
}

/**
 * Produto Completo (para exibição ao cliente)
 */
export interface ProductComplete extends Product {
  sizes: ProductSize[]; // Se has_sizes = true
  addonGroups: Array<{
    groupId: string;
    groupName: string;
    groupDescription: string | null;
    isRequired: boolean;
    minQuantity: number;
    maxQuantity: number | null;
    allowMultiple: boolean;
    displayOrder: number;
    items: AddonGroupItem[];
  }>;
}

// ============================================================================
// CART TYPES (Atualizado para nova estrutura)
// ============================================================================

/**
 * Item selecionado de um grupo de adicionais
 */
export interface CartAddonItem {
  id: string;
  name: string;
  price: number;
  quantity: number; // Quantas vezes foi selecionado
}

/**
 * Grupo de adicionais no carrinho
 */
export interface CartAddonGroup {
  groupId: string;
  groupName: string;
  items: CartAddonItem[];
}

/**
 * Item no carrinho (atualizado)
 */
export interface CartItem {
  id: string; // ID único do item no carrinho
  productId: string;
  productName: string;
  productImage: string | null;

  // Tamanho selecionado (se has_sizes = true)
  size?: {
    id: string;
    name: string;
    price: number;
  };

  // Grupos de adicionais selecionados
  addonGroups: CartAddonGroup[];

  // Quantidade do produto
  quantity: number;

  // Observações opcionais
  notes?: string;

  // Identificação
  restaurantId: string;
}

/**
 * Helper para calcular preço total de um item do carrinho
 */
export function calculateCartItemTotal(item: CartItem, product: Product): number {
  // Preço base (tamanho ou base_price)
  const basePrice = item.size?.price ?? product.base_price;

  // Soma dos adicionais
  const addonsPrice = item.addonGroups.reduce(
    (sum, group) =>
      sum +
      group.items.reduce((s, item) => s + item.price * item.quantity, 0),
    0
  );

  // Total = (base + adicionais) × quantidade
  return (basePrice + addonsPrice) * item.quantity;
}

/**
 * Validação de seleção de adicionais
 */
export interface AddonGroupValidation {
  groupId: string;
  groupName: string;
  isRequired: boolean;
  minQuantity: number;
  maxQuantity: number | null;
  selectedQuantity: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Helper para validar seleções de adicionais
 */
export function validateAddonSelections(
  link: ProductAddonGroupLink,
  selectedItems: CartAddonItem[],
  groupName: string
): AddonGroupValidation {
  const selectedQuantity = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  let isValid = true;
  let errorMessage: string | undefined;

  // Validar obrigatório + mínimo
  if (link.is_required && selectedQuantity < link.min_quantity) {
    isValid = false;
    errorMessage = `Selecione pelo menos ${link.min_quantity} ${
      link.min_quantity === 1 ? 'item' : 'itens'
    }`;
  }

  // Validar máximo
  if (link.max_quantity !== null && selectedQuantity > link.max_quantity) {
    isValid = false;
    errorMessage = `Máximo de ${link.max_quantity} ${
      link.max_quantity === 1 ? 'item' : 'itens'
    }`;
  }

  return {
    groupId: link.addon_group_id,
    groupName,
    isRequired: link.is_required,
    minQuantity: link.min_quantity,
    maxQuantity: link.max_quantity,
    selectedQuantity,
    isValid,
    errorMessage,
  };
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Query para buscar produto completo com sizes e addon groups
 */
export const PRODUCT_COMPLETE_SELECT = `
  *,
  categories(id, name, display_order),
  product_sizes(*, order:display_order.asc),
  product_addon_group_links(
    *,
    product_addon_groups(
      *,
      addon_group_items(*,order:display_order.asc)
    ),
    order:display_order.asc
  )
`;

/**
 * Query para buscar grupo de adicionais com itens
 */
export const ADDON_GROUP_WITH_ITEMS_SELECT = `
  *,
  addon_group_items(*,order:display_order.asc)
`;
