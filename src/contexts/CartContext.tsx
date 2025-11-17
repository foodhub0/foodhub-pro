import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartVariation {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // ID único do item no carrinho (não é o product_id)
  productId: string;
  productName: string;
  productImage: string | null;
  basePrice: number;
  quantity: number;
  variations: CartVariation[];
  notes: string;
  restaurantId: string;
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
        setItems(JSON.parse(savedCart));
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

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    // Se o carrinho está vazio ou é do mesmo restaurante, adicionar
    if (!restaurantId || restaurantId === newItem.restaurantId) {
      const itemId = `${newItem.productId}-${Date.now()}-${Math.random()}`;
      const cartItem: CartItem = {
        ...newItem,
        id: itemId,
      };

      setItems(prev => [...prev, cartItem]);
      setRestaurantId(newItem.restaurantId);
    } else {
      // Carrinho de outro restaurante - avisar o usuário
      throw new Error('Você já tem itens de outro restaurante no carrinho');
    }
  };

  const removeItem = (itemId: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== itemId);

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

    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    localStorage.removeItem('cart');
    localStorage.removeItem('cartRestaurantId');
  };

  const getItemTotal = (item: CartItem) => {
    const variationsTotal = item.variations.reduce(
      (sum, variation) => sum + variation.price,
      0
    );
    return (item.basePrice + variationsTotal) * item.quantity;
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
