import { useEffect, useState } from "react";
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
      .order("display_order");

    setCategories(categoriesData || []);

    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .eq("restaurant_id", restaurantData.id)
      .eq("is_available", true)
      .order("name");

    setProducts(productsData || []);
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

  const getRating = () => "5,0";
  const getTotalRatings = () => "10.000";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header com Banner */}
      <div className="relative h-64 bg-gradient-to-b from-gray-900 to-gray-800">
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
        <div className="bg-white rounded-3xl shadow-lg p-6 max-w-2xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {restaurant.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900">{getRating()}</span>
                  <span className="text-sm text-gray-500">
                    ({getTotalRatings()} avaliações)
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
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
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder={`Buscar em ${restaurant.name}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-100 border-0 rounded-full"
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

        {/* Tabs de Categorias */}
        <div className="overflow-x-auto scrollbar-hide border-t">
          <div className="flex gap-1 px-4 min-w-max">
            <Button
              variant="ghost"
              className={cn(
                "rounded-none border-b-2 px-4 py-3 font-medium transition-colors whitespace-nowrap",
                !selectedCategory
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              )}
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                className={cn(
                  "rounded-none border-b-2 px-4 py-3 font-medium transition-colors whitespace-nowrap",
                  selectedCategory === category.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                )}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Seção Destaques */}
        {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">DESTAQUES</h2>
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
                  <p className="font-semibold text-gray-900 mb-1">
                    {formatCurrency(product.price || product.base_price)}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-1">{product.name}</p>
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
            <div key={category.id} className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase">
                {category.name}
              </h2>
              <div className="space-y-4">
                {categoryProducts.map((product, index) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="flex items-center gap-4 bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      {index === 0 && (
                        <Badge className="mb-2 bg-purple-100 text-purple-700 hover:bg-purple-100">
                          O mais pedido!
                        </Badge>
                      )}
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <p className="font-semibold text-gray-900">
                        a partir de {formatCurrency(product.price || product.base_price)}
                      </p>
                    </div>

                    <div className="relative flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-gray-200">
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
            <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase">
              Outros Produtos
            </h2>
            <div className="space-y-4">
              {filteredProducts.filter(p => !p.category_id).map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="flex items-center gap-4 bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(product.price || product.base_price)}
                    </p>
                  </div>

                  <div className="relative flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-gray-200">
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
            <p className="text-gray-500">Nenhum produto encontrado</p>
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
