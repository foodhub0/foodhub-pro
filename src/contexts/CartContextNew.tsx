import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Função auxiliar para tracking
const trackAddToCart = async (
  restaurantId: string,
  productId: string,
  value: number
) => {
  try {
    let sessionId = localStorage.getItem('tracking_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('tracking_session_id', sessionId);
    }

    await supabase.from('tracking_events').insert({
      restaurant_id: restaurantId,
      event_name: 'add_to_cart',
      session_id: sessionId,
      product_id: productId,
      event_value: value,
      currency: 'BRL',
      metadata: {
        url: window.location.href,
        user_agent: navigator.userAgent,
      },
    });

    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_ids: [productId],
        content_type: 'product',
        value: value,
        currency: 'BRL',
      });
    }
  } catch (error) {
    console.error('Erro ao rastrear add_to_cart:', error);
  }
};

// ============================================================================
// TYPES - NOVA ESTRUTURA
// ============================================================================

export interface CartAddonItem {
  id: string;
  name: string;
  price: number;
  quantity: number; // Quantas vezes foi selecionado
}

export interface CartAddonGroup {
  groupId: string;
  groupName: string;
  items: CartAddonItem[];
}

export interface CartItem {
  id: string; // ID único do item no carrinho
  productId: string;
  productName: string;
  productImage: string | null;

  // Tamanho selecionado (se produto has_sizes = true)
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

  // Identificação do restaurante
  restaurantId: string;
}

// BACKWARD COMPATIBILITY - manter CartVariation para código antigo
export interface CartVariation {
  id: string;
  name: string;
  price: number;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getItemTotal: (item: CartItem) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Carregar carrinho do localStorage na inicialização
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedRestaurantId = localStorage.getItem('cartRestaurantId');

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Migrar estrutura antiga se necessário
        const migratedCart = parsedCart.map((item: any) => migrateOldCartItem(item));
        setItems(migratedCart);
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }

    if (savedRestaurantId) {
      setRestaurantId(savedRestaurantId);
    }
  }, []);

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
    if (restaurantId) {
      localStorage.setItem('cartRestaurantId', restaurantId);
    }
  }, [items, restaurantId]);

  // Migrar item antigo para nova estrutura
  const migrateOldCartItem = (item: any): CartItem => {
    // Se já está na nova estrutura, retornar como está
    if (item.addonGroups !== undefined) {
      return item as CartItem;
    }

    // Migrar de variations para addonGroups
    const addonGroups: CartAddonGroup[] = [];

    if (item.variations && item.variations.length > 0) {
      addonGroups.push({
        groupId: 'migrated',
        groupName: 'Adicionais',
        items: item.variations.map((v: CartVariation) => ({
          id: v.id,
          name: v.name,
          price: v.price,
          quantity: 1,
        })),
      });
    }

    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      size: item.size,
      addonGroups,
      quantity: item.quantity,
      notes: item.notes || '',
      restaurantId: item.restaurantId,
    };
  };

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    // Se o carrinho está vazio ou é do mesmo restaurante, adicionar
    if (!restaurantId || restaurantId === newItem.restaurantId) {
      const itemId = `${newItem.productId}-${Date.now()}-${Math.random()}`;
      const cartItem: CartItem = {
        ...newItem,
        id: itemId,
      };

      setItems((prev) => [...prev, cartItem]);
      setRestaurantId(newItem.restaurantId);

      // Rastrear evento add_to_cart
      const itemTotal = getItemTotalHelper(newItem);
      trackAddToCart(newItem.restaurantId, newItem.productId, itemTotal);
    } else {
      // Carrinho de outro restaurante - avisar o usuário
      throw new Error('Você já tem itens de outro restaurante no carrinho');
    }
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.id !== itemId);

      // Se o carrinho ficou vazio, limpar o restaurantId
      if (newItems.length === 0) {
        setRestaurantId(null);
        localStorage.removeItem('cartRestaurantId');
      }

      return newItems;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    localStorage.removeItem('cart');
    localStorage.removeItem('cartRestaurantId');
  };

  // Helper para calcular total de um item
  const getItemTotalHelper = (item: Partial<CartItem>): number => {
    // Preço base (size ou estimativa)
    const basePrice = item.size?.price ?? 0;

    // Soma dos adicionais
    const addonsPrice =
      item.addonGroups?.reduce(
        (sum, group) =>
          sum + group.items.reduce((s, item) => s + item.price * item.quantity, 0),
        0
      ) ?? 0;

    return (basePrice + addonsPrice) * (item.quantity ?? 1);
  };

  const getItemTotal = (item: CartItem): number => {
    return getItemTotalHelper(item);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + getItemTotal(item), 0);
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        getItemTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
