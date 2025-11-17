import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Star, Clock, MapPin, Phone, ShoppingCart } from "lucide-react";
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
        <div className="bg-amber-50 border-b border-amber-200 py-2 px-4 text-center">
          <span className="text-sm text-amber-800">⚠️ Este restaurante está temporariamente fechado</span>
        </div>
      )}

      {/* Header Estilo iFood - Minimalista */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo + Nome + Info (Estilo iFood) */}
            <div className="flex items-center gap-3 flex-1">
              {restaurant.logo_url && (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                />
              )}
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-[#003A75]">{restaurant.name}</h1>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  {restaurant.delivery_time_estimate && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {restaurant.delivery_time_estimate} min
                    </span>
                  )}
                  {restaurant.delivery_fee !== null && (
                    <span className="flex items-center gap-1">
                      <span>🛵</span>
                      {restaurant.delivery_fee === 0 ? 'Grátis' : formatCurrency(restaurant.delivery_fee)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
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
              className="relative h-12 w-12 rounded-full hover:bg-gray-100"
            >
              <ShoppingCart className="h-5 w-5 text-[#005BFF]" />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#005BFF] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
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
        <div className="py-4 space-y-4">
          {/* Info Rápida */}
          {(restaurant.phone || restaurant.address) && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {restaurant.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-[#3DA5F4]" />
                  {restaurant.address}
                </span>
              )}
              {restaurant.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-[#3DA5F4]" />
                  {restaurant.phone}
                </span>
              )}
            </div>
          )}

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar no cardápio"
              className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categorias - Chips Estilo iFood */}
        {categories.length > 0 && (
          <div className="sticky top-[73px] z-40 bg-white -mx-4 px-4 pb-3 border-b border-gray-100">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                  !selectedCategory
                    ? "bg-[#005BFF] text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
                )}
              >
                Todos os produtos
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                    selectedCategory === category.id
                      ? "bg-[#005BFF] text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Produtos - Estilo iFood */}
        <div className="mt-6 space-y-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">
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
                  <h2 className="text-xl font-bold text-[#003A75] flex items-center gap-2">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    Destaques
                  </h2>
                  <div className="space-y-3">
                    {products.filter(p => p.is_featured).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onClick={handleProductClick}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Cardápio Completo */}
              <section className="space-y-3">
                {(!selectedCategory && !searchQuery) && (
                  <h2 className="text-xl font-bold text-[#003A75]">
                    Cardápio
                  </h2>
                )}
                <div className="space-y-3">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={handleProductClick}
                      formatCurrency={formatCurrency}
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

// Product Card - Estilo iFood
interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  formatCurrency: (value: number) => string;
}

const ProductCard = ({ product, onClick, formatCurrency }: ProductCardProps) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={() => onClick(product)}
      className="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Conteúdo à Esquerda */}
      <div className="flex-1 min-w-0 flex flex-col">
        <h3 className="text-base font-semibold text-[#003A75] mb-1 line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        <div className="mt-auto">
          <span className="text-lg font-bold text-[#005BFF]">
            {formatCurrency(product.base_price)}
          </span>
        </div>
      </div>

      {/* Imagem à Direita - Estilo iFood */}
      <div className="flex-shrink-0 relative">
        {product.image_url && !imageError ? (
          <div className="relative">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-32 h-32 object-cover rounded-xl"
              onError={() => setImageError(true)}
              loading="lazy"
            />
            {product.is_featured && (
              <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                ★ Destaque
              </div>
            )}
          </div>
        ) : (
          <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center">
            <span className="text-xs text-gray-400">Sem imagem</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicMenu;
