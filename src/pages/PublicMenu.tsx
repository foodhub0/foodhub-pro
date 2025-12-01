import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Star, Clock, ArrowLeft, ShoppingCart, Plus, Menu as MenuIcon, Bike, DollarSign, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { ProductModal } from "@/components/ProductModal";
import { CartDrawer } from "@/components/CartDrawer";
import { FacebookPixel } from "@/components/FacebookPixel";
import { useTracking } from "@/hooks/useTracking";

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  price: number;
  is_featured: boolean;
  category_id: string | null;
  restaurant_id: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  delivery_time_estimate: number | null;
  pickup_time_estimate: number | null;
  delivery_fee: number | null;
  is_open: boolean;
}

const PublicMenu = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getItemCount, getTotal } = useCart();
  const { trackEvent } = useTracking();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const tabsRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (slug) {
      loadData();
    }
  }, [slug]);

  // Rastrear page view quando o cardápio carrega
  useEffect(() => {
    if (restaurant) {
      trackEvent({
        restaurantId: restaurant.id,
        eventName: 'page_view',
      });
    }
  }, [restaurant, trackEvent]);

  // IntersectionObserver para detectar categoria visível (estilo iFood)
  useEffect(() => {
    // Não aplicar durante busca ou quando usuário está clicando
    if (searchQuery || isScrollingRef.current || categories.length === 0) return;

    // Limpar observer anterior
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Configurar IntersectionObserver - detecta exatamente quando o título cruza o header
    const observerOptions = {
      root: null, // viewport
      rootMargin: '-128px 0px -70% 0px', // Linha logo abaixo do header fixo (search + tabs)
      threshold: 0, // Detecção instantânea ao cruzar
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Processar cada entrada
      entries.forEach(entry => {
        const categoryId = entry.target.getAttribute('data-category-id');

        if (entry.isIntersecting && categoryId) {
          // Quando a seção entra na zona de detecção, ativa no header
          setActiveCategory(categoryId);

          // Centraliza a tab no header
          const tabButton = document.querySelector(`[data-category="${categoryId}"]`);
          if (tabButton && tabsRef.current) {
            tabButton.scrollIntoView({
              behavior: 'auto',
              block: 'nearest',
              inline: 'center'
            });
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(observerCallback, observerOptions);

    // Aguardar renderização e observar todas as seções
    const timeoutId = setTimeout(() => {
      Object.values(categoryRefs.current).forEach(element => {
        if (element) {
          observerRef.current?.observe(element);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [categories, searchQuery, products]);

  const loadData = async () => {
    const { data: restaurantData } = await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!restaurantData) {
      setLoading(false);
      return;
    }

    setRestaurant(restaurantData);

    // Carregar categorias ativas
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantData.id)
      .eq("is_active", true)
      .order("display_order");

    setCategories(categoriesData || []);

    // Carregar produtos ativos
    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .eq("restaurant_id", restaurantData.id)
      .eq("is_active", true)
      .order("name");

    const loadedProducts = productsData || [];
    setProducts(loadedProducts);

    // Adicionar categoria "Destaques" se houver produtos featured
    const hasFeatured = loadedProducts.some(p => p.is_featured);
    if (hasFeatured) {
      setCategories([
        { id: 'destaques', name: 'Destaques', description: null, image_url: null, display_order: 0 },
        ...(categoriesData || [])
      ]);
    } else {
      setCategories(categoriesData || []);
    }

    // Carregar avaliações reais
    const { data: ratingsData } = await supabase
      .from("reviews")
      .select("rating")
      .eq("restaurant_id", restaurantData.id)
      .eq("is_approved", true);

    if (ratingsData && ratingsData.length > 0) {
      const avgRating = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length;
      setRating(avgRating);
      setTotalRatings(ratingsData.length);
    }

    setLoading(false);
  };

  const handleProductClick = (product: Product) => {
    if (!restaurant?.is_open) {
      toast({
        title: "Loja fechada",
        description: "No momento não estamos aceitando pedidos. Volte mais tarde!",
        variant: "destructive",
      });
      return;
    }

    // Rastrear visualização do produto
    if (restaurant) {
      trackEvent({
        restaurantId: restaurant.id,
        eventName: 'view_content',
        productId: product.id,
        eventValue: product.price || product.base_price,
      });
    }

    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredProducts = products.filter(p => p.is_featured).slice(0, 3);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleCategoryClick = (categoryId: string) => {
    // Marcar que estamos scrollando programaticamente
    isScrollingRef.current = true;

    // Atualizar categoria ativa
    setActiveCategory(categoryId);

    // Scroll suave até a seção
    const element = document.getElementById(`cat-${categoryId}`) || categoryRefs.current[categoryId];
    if (element) {
      const headerOffset = 128; // Altura do header sticky (search + tabs)
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });

      // Reativar observer após o scroll completar
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    } else {
      isScrollingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-lg text-gray-600">Restaurante não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Banner */}
      <div className="relative h-44 w-full">
        {restaurant.cover_url ? (
          <img
            src={restaurant.cover_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80" />
        )}
      </div>

      {/* Card de Informações */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-10 px-5 pb-2 border-b border-gray-100">
        {/* Logo Circular */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full p-1 bg-white shadow-md">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {restaurant.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="pt-12 text-center">
          <h1 className="text-xl font-bold text-gray-800">{restaurant.name}</h1>

          {restaurant.description && (
            <p className="text-xs text-gray-500 mt-1">{restaurant.description}</p>
          )}
        </div>

        {/* Rating */}
        {totalRatings > 0 && (
          <div className="mt-4 flex items-center justify-between py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-sm text-yellow-400">{rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-gray-500">({totalRatings} {totalRatings === 1 ? 'avaliação' : 'avaliações'})</span>
            </div>
          </div>
        )}

        {/* Delivery Info */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2 text-sm">
            {restaurant.delivery_time_estimate && (
              <>
                <span className="text-gray-700">{restaurant.delivery_time_estimate} min</span>
                <span className="text-gray-300">•</span>
              </>
            )}
            {restaurant.delivery_fee !== null && (
              <span className="text-[#00a296] font-medium">
                {restaurant.delivery_fee === 0 ? "Entrega Grátis" : formatCurrency(restaurant.delivery_fee)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Banner de Loja Fechada */}
      {!restaurant.is_open && (
        <div className="px-4 py-2 bg-yellow-50 border-y border-yellow-200">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800 font-medium">Loja fechada no momento</span>
          </div>
        </div>
      )}

      {/* Barra de Busca Fixa */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="flex items-center px-4 py-3 gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-primary"
          >
            <ArrowLeft size={24} />
          </button>

          <div className="flex-1 bg-gray-100 rounded-lg h-10 flex items-center px-3 gap-2">
            <Search className="text-primary" size={18} />
            <input
              type="text"
              placeholder={`Buscar em ${restaurant.name}`}
              className="bg-transparent w-full text-sm text-gray-700 placeholder:text-gray-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button className="text-gray-600">
            <MenuIcon size={24} />
          </button>
        </div>

        {/* Tabs de Categorias */}
        <div className="overflow-x-auto scrollbar-hide border-t border-gray-100" ref={tabsRef}>
          <div className="flex gap-6 px-4 min-w-max">
            {categories.map((category) => {
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  data-category={category.id}
                  className={cn(
                    "whitespace-nowrap text-sm font-medium py-3 border-b-2 transition-all",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500"
                  )}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="pb-24">
        {/* Seção Destaques - Scroll Horizontal */}
        {featuredProducts.length > 0 && !searchQuery && (
          <div className="pt-6 pb-4 pl-4 bg-white mb-2" id="cat-destaques" data-category-id="destaques">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Destaques</h3>
            <div className="flex overflow-x-auto gap-4 pr-4 scrollbar-hide pb-2">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="min-w-[280px] max-w-[280px] bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="h-32 w-full relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-4xl opacity-40">🍕</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-gray-800/80 text-white text-[10px] px-2 py-1 rounded font-medium backdrop-blur-sm">
                      Mais pedido
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary font-medium text-sm">
                        {formatCurrency(product.price || product.base_price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Produtos por Categoria */}
        <div className="bg-white px-4">
          {categories.map((category) => {
            const categoryProducts = filteredProducts.filter(
              p => p.category_id === category.id
            );

            if (categoryProducts.length === 0) return null;

            return (
              <div
                key={category.id}
                id={`cat-${category.id}`}
                data-category-id={category.id}
                className="py-4 scroll-mt-32"
                ref={(el) => { categoryRefs.current[category.id] = el; }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-gray-800">{category.name}</h3>
                </div>
                <div className="flex flex-col gap-6">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="flex justify-between cursor-pointer group"
                    >
                      <div className="flex-1 pr-3 flex flex-col justify-center">
                        <h3 className="text-gray-800 text-[15px] font-medium leading-tight mb-1">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-gray-600 text-xs leading-relaxed font-light line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-gray-800 text-sm font-medium">
                            {formatCurrency(product.price || product.base_price)}
                          </span>
                        </div>
                      </div>
                      <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden relative bg-gray-100">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                            <span className="text-2xl opacity-40">🍽️</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-b border-gray-100 mt-6"></div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Botão Carrinho Flutuante */}
      {getItemCount() > 0 && !isCartDrawerOpen && (
        <div className="fixed bottom-4 left-0 w-full px-4 z-30 max-w-md mx-auto right-0">
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="w-full bg-primary text-white rounded-lg p-3 flex justify-between items-center shadow-lg active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                {getItemCount()}
              </span>
              <span className="text-sm font-medium">Ver sacola</span>
            </div>
            <span className="text-sm font-bold">{formatCurrency(getTotal())}</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          open={isProductModalOpen}
          onOpenChange={setIsProductModalOpen}
        />
      )}

      <CartDrawer
        open={isCartDrawerOpen}
        onOpenChange={setIsCartDrawerOpen}
        restaurantSlug={slug || ""}
      />

      {/* Facebook Pixel Integration */}
      {restaurant && <FacebookPixel restaurantId={restaurant.id} />}
    </div>
  );
};

export default PublicMenu;
