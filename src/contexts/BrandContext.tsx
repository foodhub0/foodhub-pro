import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
}

interface Restaurant {
  id: string;
  name: string;
  brand_id: string;
  restaurant_index: number;
  slug: string;
  is_open: boolean;
}

interface BrandContextType {
  brand: Brand | null;
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  isLoading: boolean;
  switchRestaurant: (restaurantId: string | null) => void;
  refreshBrand: () => Promise<void>;
  getAllRestaurantsView: boolean;
  setAllRestaurantsView: (value: boolean) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};

interface BrandProviderProps {
  children: ReactNode;
}

export const BrandProvider = ({ children }: BrandProviderProps) => {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allRestaurantsView, setAllRestaurantsView] = useState(false);

  // Carregar marca e restaurantes do usuário atual
  const loadBrandData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const metadata = user.user_metadata || {};
      const brandId = metadata.brand_id;
      const roleName = metadata.role_name;

      if (!brandId) {
        // Usuário sem marca ainda - pode ser novo
        setIsLoading(false);
        return;
      }

      // Carregar dados da marca
      const { data: brandData } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single();

      if (brandData) {
        setBrand(brandData);
      }

      // Carregar restaurantes da marca
      const { data: restaurantsData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('brand_id', brandId)
        .order('restaurant_index');

      if (restaurantsData) {
        setRestaurants(restaurantsData);

        // Se for owner, permitir visão de todas as unidades
        if (roleName === 'owner') {
          // Restaurar seleção anterior do localStorage
          const savedRestaurantId = localStorage.getItem(`foodhub_selected_restaurant_${brandId}`);
          const savedViewAll = localStorage.getItem(`foodhub_view_all_${brandId}`) === 'true';

          if (savedViewAll) {
            setAllRestaurantsView(true);
            setCurrentRestaurant(null);
          } else if (savedRestaurantId) {
            const found = restaurantsData.find(r => r.id === savedRestaurantId);
            setCurrentRestaurant(found || restaurantsData[0]);
          } else {
            setCurrentRestaurant(restaurantsData[0]);
          }
        } else {
          // Outros roles: apenas seu restaurante vinculado
          const restaurantId = metadata.restaurant_id;
          const found = restaurantsData.find(r => r.id === restaurantId);
          setCurrentRestaurant(found || null);
        }
      }
    } catch (error) {
      console.error('Error loading brand data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrandData();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadBrandData();
      } else if (event === 'SIGNED_OUT') {
        setBrand(null);
        setRestaurants([]);
        setCurrentRestaurant(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const switchRestaurant = (restaurantId: string | null) => {
    if (!brand) return;

    if (restaurantId === null) {
      // Visão de todas as unidades
      setAllRestaurantsView(true);
      setCurrentRestaurant(null);
      localStorage.setItem(`foodhub_view_all_${brand.id}`, 'true');
      localStorage.removeItem(`foodhub_selected_restaurant_${brand.id}`);
    } else {
      const found = restaurants.find(r => r.id === restaurantId);
      if (found) {
        setCurrentRestaurant(found);
        setAllRestaurantsView(false);
        localStorage.setItem(`foodhub_selected_restaurant_${brand.id}`, restaurantId);
        localStorage.setItem(`foodhub_view_all_${brand.id}`, 'false');
      }
    }
  };

  const refreshBrand = async () => {
    await loadBrandData();
  };

  return (
    <BrandContext.Provider
      value={{
        brand,
        restaurants,
        currentRestaurant,
        isLoading,
        switchRestaurant,
        refreshBrand,
        getAllRestaurantsView: allRestaurantsView,
        setAllRestaurantsView,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};

export default BrandProvider;
