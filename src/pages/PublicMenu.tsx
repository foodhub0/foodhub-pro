import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Star, Clock, ArrowLeft, ShoppingCart, Plus, Menu as MenuIcon, Bike, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { ProductModal } from "@/components/ProductModal";
import { CartDrawer } from "@/components/CartDrawer";

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
  delivery_fee: number | null;
  is_open: boolean;
}

const PublicMenu = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getItemCount } = useCart();
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

  // IntersectionObserver para detectar categoria visível (estilo iFood)
  useEffect(() => {
    // Não aplicar durante busca ou quando usuário clicou em uma categoria
    if (searchQuery || isScrollingRef.current) return;

    // Limpar observer anterior
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Configurar IntersectionObserver
    const observerOptions = {
      root: null, // viewport
      rootMargin: '-20% 0px -60% 0px', // Detecta quando está 20% do topo
      threshold: 0.1,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Encontrar a seção mais visível
      const visibleEntries = entries.filter(entry => entry.isIntersecting);

      if (visibleEntries.length > 0) {
        // Pegar a primeira seção visível
        const mostVisible = visibleEntries.reduce((prev, current) => {
          return current.intersectionRatio > prev.intersectionRatio ? current : prev;
        });

        const categoryId = mostVisible.target.getAttribute('data-category-id');

        if (categoryId) {
          setActiveCategory(categoryId);

          // Scroll suave da tab para o centro
          const tabButton = document.querySelector(`[data-category="${categoryId}"]`);
          if (tabButton && tabsRef.current) {
            tabButton.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center'
            });
          }
        }
      }
    };

    observerRef.current = new IntersectionObserver(observerCallback, observerOptions);

    // Observar todas as seções de categoria
    Object.values(categoryRefs.current).forEach(element => {
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [categories, searchQuery]);

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

    setProducts(productsData || []);

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

  const handleCategoryClick = (categoryId: string | null) => {
    // Marcar que estamos scrollando programaticamente
    isScrollingRef.current = true;

    // Se clicou em "Todos", limpa filtro e volta ao topo
    if (categoryId === null) {
      setSelectedCategory(null);
      setActiveCategory(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Reativar observer após scroll
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
      return;
    }

    // Se estava filtrando, limpa o filtro
    setSelectedCategory(null);
    setActiveCategory(categoryId);

    // Scroll suave até a seção
    const element = categoryRefs.current[categoryId];
    if (element) {
      const headerOffset = 200; // Altura do header sticky + tabs
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });

      // Reativar observer após o scroll completar
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
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
    <div className="min-h-screen bg-background">
      {/* Header com Banner */}
      <div className="relative h-64 bg-gradient-to-b from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900">
        {restaurant.cover_url && (
          <img
            src={restaurant.cover_url}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-60"
          />
        )}

        {/* Logo Circular Sobreposto */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover bg-white"
            />
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-red-600 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {restaurant.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card de Informações Flutuante */}
      <div className="relative -mt-20 px-4 pb-4">
        <div className="bg-card rounded-3xl shadow-lg p-6 max-w-2xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {restaurant.name}
              </h1>

              {/* Rating */}
              {totalRatings > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({totalRatings} {totalRatings === 1 ? 'avaliação' : 'avaliações'})
                    </span>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Padrão</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{restaurant.delivery_time_estimate || "30-40"} min</span>
                </div>
                {restaurant.delivery_fee !== null && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Bike className="h-4 w-4" />
                      <span>
                        {restaurant.delivery_fee === 0
                          ? "Grátis"
                          : formatCurrency(restaurant.delivery_fee)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Navegação Fixa */}
      <div className="sticky top-0 z-40 bg-card border-b shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Buscar em ${restaurant.name}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted border-0 rounded-full"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs de Categorias - Sticky com Scroll Sincronizado */}
        <div className="overflow-x-auto scrollbar-hide border-t bg-card" ref={tabsRef}>
          <div className="flex gap-1 px-4 min-w-max">
            <Button
              variant="ghost"
              data-category="all"
              className={cn(
                "rounded-none border-b-2 px-4 py-3 font-medium transition-all duration-200 whitespace-nowrap",
                !selectedCategory && !activeCategory
                  ? "border-primary text-primary bg-primary/10"
                  : "border-transparent text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
              onClick={() => handleCategoryClick(null)}
            >
              Todos
            </Button>
            {categories.map((category) => {
              // Ativo se está selecionado (filtro) OU é a categoria atual do scroll
              const isActive = selectedCategory
                ? selectedCategory === category.id
                : activeCategory === category.id;

              return (
                <Button
                  key={category.id}
                  variant="ghost"
                  data-category={category.id}
                  className={cn(
                    "rounded-none border-b-2 px-4 py-3 font-medium transition-all duration-200 whitespace-nowrap",
                    isActive
                      ? "border-primary text-primary bg-primary/10 font-semibold"
                      : "border-transparent text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Seção Destaques */}
        {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">DESTAQUES</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="cursor-pointer group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-gray-200">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <span className="text-4xl text-gray-400">🍕</span>
                      </div>
                    )}
                  </div>
                  <p className="font-semibold text-foreground mb-1">
                    {formatCurrency(product.price || product.base_price)}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{product.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Produtos por Categoria */}
        {categories.map((category) => {
          const categoryProducts = filteredProducts.filter(
            p => p.category_id === category.id
          );

          if (categoryProducts.length === 0) return null;
          if (selectedCategory && selectedCategory !== category.id) return null;

          return (
            <div
              key={category.id}
              data-category-id={category.id}
              className="mb-8 scroll-mt-52"
              ref={(el) => { categoryRefs.current[category.id] = el; }}
            >
              <h2 className="text-lg font-bold text-foreground mb-4 uppercase sticky top-[168px] bg-background py-2 -mx-4 px-4 z-10">
                {category.name}
              </h2>
              <div className="space-y-4">
                {categoryProducts.map((product, index) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="flex items-center gap-4 bg-card rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      {index === 0 && (
                        <Badge className="mb-2 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-100">
                          O mais pedido!
                        </Badge>
                      )}
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <p className="font-semibold text-foreground">
                        a partir de {formatCurrency(product.price || product.base_price)}
                      </p>
                    </div>

                    <div className="relative flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-muted">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                          <span className="text-3xl">🍕</span>
                        </div>
                      )}
                      <Button
                        size="icon"
                        className="absolute bottom-2 right-2 rounded-full h-8 w-8 shadow-lg bg-white hover:bg-gray-50 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Produtos sem categoria */}
        {filteredProducts.filter(p => !p.category_id).length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4 uppercase">
              Outros Produtos
            </h2>
            <div className="space-y-4">
              {filteredProducts.filter(p => !p.category_id).map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="flex items-center gap-4 bg-card rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <p className="font-semibold text-foreground">
                      {formatCurrency(product.price || product.base_price)}
                    </p>
                  </div>

                  <div className="relative flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <span className="text-3xl">🍕</span>
                      </div>
                    )}
                    <Button
                      size="icon"
                      className="absolute bottom-2 right-2 rounded-full h-8 w-8 shadow-lg bg-white hover:bg-gray-50 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(product);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Botão Carrinho Flutuante */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsCartDrawerOpen(true)}
            className="h-14 px-6 rounded-full shadow-2xl bg-primary hover:bg-primary/90 flex items-center gap-3"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold">Ver carrinho ({getItemCount()})</span>
          </Button>
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
    </div>
  );
};

export default PublicMenu;
