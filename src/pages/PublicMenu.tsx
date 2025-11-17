import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Star, Clock, MapPin, Phone, ShoppingCart, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  is_featured: boolean;
  category_id: string | null;
  restaurant_id: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
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

  useEffect(() => {
    if (slug) {
      loadData();
    }
  }, [slug]);

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

    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantData.id)
      .eq("is_active", true)
      .order("display_order");

    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, description, image_url, base_price, is_featured, category_id, restaurant_id")
      .eq("restaurant_id", restaurantData.id)
      .eq("is_active", true)
      .order("name");

    setCategories(categoriesData || []);
    setProducts(productsData || []);
    setLoading(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleOpenCart = () => {
    setIsCartDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005BFF]"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurante não encontrado</h1>
        <p className="text-gray-600">O cardápio que você está procurando não existe.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Banner de Restaurante Fechado */}
      {!restaurant.is_open && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-center">
          <span className="text-sm text-amber-800 font-medium">⚠️ Este restaurante está temporariamente fechado</span>
        </div>
      )}

      {/* Header Estilo iFood - Ultra Minimalista */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo + Nome + Info (Estilo iFood) */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {restaurant.logo_url && (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-sm"
                />
              )}
              <div className="flex flex-col min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate">{restaurant.name}</h1>
                <div className="flex items-center gap-2.5 text-xs text-gray-600">
                  {restaurant.delivery_time_estimate && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {restaurant.delivery_time_estimate} min
                    </span>
                  )}
                  {restaurant.delivery_fee !== null && (
                    <span className="flex items-center gap-1">
                      <span className="text-sm">🛵</span>
                      {restaurant.delivery_fee === 0 ? 'Grátis' : formatCurrency(restaurant.delivery_fee)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    4.8
                  </span>
                </div>
              </div>
            </div>

            {/* Carrinho */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenCart}
              className="relative h-11 w-11 rounded-full hover:bg-blue-50 transition-colors flex-shrink-0"
            >
              <ShoppingCart className="h-5 w-5 text-[#005BFF]" />
              {getItemCount() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#005BFF] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold shadow-md">
                  {getItemCount()}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Container Principal */}
      <main className="max-w-5xl mx-auto px-4 pb-8">
        {/* Informações e Busca - Estilo iFood Minimalista */}
        <div className="py-4 space-y-3">
          {/* Busca - Destaque Principal */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar no cardápio"
              className="pl-11 pr-4 h-12 bg-gray-50 border-0 rounded-lg text-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#005BFF] focus-visible:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Info Rápida - Compacta */}
          {(restaurant.phone || restaurant.address) && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {restaurant.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {restaurant.address}
                </span>
              )}
              {restaurant.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {restaurant.phone}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Categorias - Pills Estilo iFood */}
        {categories.length > 0 && (
          <div className="sticky top-[80px] z-40 bg-white -mx-4 px-4 py-3 shadow-sm">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                  !selectedCategory
                    ? "bg-[#005BFF] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                Todos
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                    selectedCategory === category.id
                      ? "bg-[#005BFF] text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Produtos - Estilo iFood */}
        <div className="mt-4 space-y-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm">
                {searchQuery
                  ? "Nenhum produto encontrado"
                  : "Nenhum produto disponível"}
              </p>
            </div>
          ) : (
            <>
              {/* Produtos em Destaque */}
              {!selectedCategory && !searchQuery && products.some(p => p.is_featured) && (
                <section className="space-y-3">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 px-1">
                    <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
                    Destaques
                  </h2>
                  <div className="space-y-2.5">
                    {products.filter(p => p.is_featured).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onClick={handleProductClick}
                        formatCurrency={formatCurrency}
                        restaurant={restaurant}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Cardápio Completo */}
              <section className="space-y-3">
                {(!selectedCategory && !searchQuery) && (
                  <h2 className="text-lg font-bold text-gray-900 px-1">
                    Cardápio
                  </h2>
                )}
                <div className="space-y-2.5">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={handleProductClick}
                      formatCurrency={formatCurrency}
                      restaurant={restaurant!}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
      />

      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        restaurantSlug={slug}
      />
    </div>
  );
};

// Product Card - Estilo iFood Refinado
interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  formatCurrency: (value: number) => string;
  restaurant: Restaurant;
}

const ProductCard = ({ product, onClick, formatCurrency, restaurant }: ProductCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [hasVariations, setHasVariations] = useState(false);
  const [loadingVariations, setLoadingVariations] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    checkVariations();
  }, [product.id]);

  const checkVariations = async () => {
    const { data } = await supabase
      .from('product_variations')
      .select('id')
      .eq('product_id', product.id)
      .eq('is_active', true);

    setHasVariations((data?.length || 0) > 0);
    setLoadingVariations(false);
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (hasVariations) {
      onClick(product);
      return;
    }

    setIsAdding(true);
    try {
      addItem({
        productId: product.id,
        productName: product.name,
        productImage: product.image_url,
        basePrice: product.base_price,
        quantity: 1,
        variations: [],
        notes: '',
        restaurantId: restaurant.id,
      });

      setJustAdded(true);
      toast({
        title: 'Adicionado ao carrinho!',
        description: product.name,
      });

      setTimeout(() => {
        setJustAdded(false);
      }, 2000);
    } catch (error) {
      toast({
        title: 'Erro ao adicionar',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      onClick={() => onClick(product)}
      className="flex gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group relative"
    >
      {/* Conteúdo à Esquerda */}
      <div className="flex-1 min-w-0 flex flex-col py-1">
        <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-[#005BFF] transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-base font-bold text-gray-900">
            {formatCurrency(product.base_price)}
          </span>

          {/* Botão Adicionar - Estilo iFood */}
          {!loadingVariations && (
            <Button
              onClick={handleQuickAdd}
              disabled={isAdding}
              size="sm"
              className={cn(
                "h-8 px-3 rounded-full font-semibold text-xs transition-all shadow-sm",
                justAdded
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-white border-2 border-[#005BFF] text-[#005BFF] hover:bg-[#005BFF] hover:text-white"
              )}
            >
              {justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Adicionado
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {hasVariations ? 'Ver opções' : 'Adicionar'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Imagem à Direita - Estilo iFood */}
      <div className="flex-shrink-0 relative">
        {product.image_url && !imageError ? (
          <div className="relative">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-28 h-28 object-cover rounded-lg shadow-sm"
              onError={() => setImageError(true)}
              loading="lazy"
            />
            {product.is_featured && (
              <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-amber-400 to-amber-500 text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-lg flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-white" />
                Destaque
              </div>
            )}
          </div>
        ) : (
          <div className="w-28 h-28 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-[10px] text-gray-400">Sem imagem</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicMenu;
