import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Star, ArrowLeft, Clock, MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  is_featured: boolean;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Restaurant {
  name: string;
  description: string | null;
  cover_url: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  delivery_time_estimate: number | null;
  delivery_fee: number | null;
}

const MenuPreview = () => {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: restaurantData } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (!restaurantData) return;

    setRestaurant(restaurantData);

    const { data: categoriesData } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantData.id)
      .eq("is_active", true)
      .order("display_order");

    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .eq("restaurant_id", restaurantData.id)
      .eq("is_active", true)
      .order("name");

    setCategories(categoriesData || []);
    setProducts(productsData || []);
    setLoading(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredProducts = products.filter((product) => product.is_featured);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Fixo */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-bold text-lg leading-tight">{restaurant?.name}</h1>
              <p className="text-xs text-muted-foreground">Preview do Cardápio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {restaurant?.cover_url && (
        <div className="relative h-44 sm:h-56 overflow-hidden">
          <img
            src={restaurant.cover_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      )}

      {/* Restaurant Info Card */}
      <div className="container mx-auto px-4 -mt-8 relative z-10 pb-4">
        <Card className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4">
            <div className="flex gap-4">
              {restaurant?.logo_url && (
                <div className="flex-shrink-0">
                  <img
                    src={restaurant.logo_url}
                    alt={restaurant.name}
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {restaurant?.name}
                </h2>
                {restaurant?.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {restaurant.description}
                  </p>
                )}

                {/* Info Tags */}
                <div className="flex flex-wrap gap-3 mt-3">
                  {restaurant?.delivery_time_estimate && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{restaurant.delivery_time_estimate} min</span>
                    </div>
                  )}
                  {restaurant?.delivery_fee !== null && restaurant?.delivery_fee !== undefined && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Info className="h-4 w-4" />
                      <span>
                        {restaurant.delivery_fee === 0
                          ? "Entrega grátis"
                          : `Entrega ${formatCurrency(restaurant.delivery_fee)}`}
                      </span>
                    </div>
                  )}
                  {restaurant?.address && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate max-w-[200px]">{restaurant.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar no cardápio..."
                className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Categories Tabs */}
        {categories.length > 0 && (
          <div className="mt-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2 min-w-max">
              <Badge
                variant={!selectedCategory ? "default" : "outline"}
                className={cn(
                  "cursor-pointer whitespace-nowrap px-5 py-2.5 text-sm font-medium rounded-full transition-all",
                  !selectedCategory
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                )}
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer whitespace-nowrap px-5 py-2.5 text-sm font-medium rounded-full transition-all",
                    selectedCategory === category.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  )}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Featured Products */}
        {!selectedCategory && !searchQuery && featuredProducts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 px-1">
              ⭐ Destaques
            </h3>
            <div className="grid gap-3">
              {featuredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-md transition-all cursor-pointer bg-white border-0 shadow-sm"
                >
                  <div className="flex gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-base mb-1 line-clamp-1">
                        {product.name}
                      </h4>
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(product.base_price)}
                        </span>
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                    {product.image_url ? (
                      <div className="flex-shrink-0">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-28 h-28 object-cover rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className="w-28 h-28 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-gray-400">Sem foto</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="mt-6 pb-8">
          {(!selectedCategory && !searchQuery) && (
            <h3 className="text-lg font-bold text-gray-900 mb-3 px-1">
              Cardápio Completo
            </h3>
          )}

          {filteredProducts.length === 0 ? (
            <Card className="p-16 text-center bg-white shadow-sm">
              <p className="text-gray-500">
                {searchQuery
                  ? "Nenhum produto encontrado"
                  : "Nenhum produto disponível nesta categoria"}
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-md transition-all cursor-pointer bg-white border-0 shadow-sm"
                >
                  <div className="flex gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h4 className="font-semibold text-gray-900 text-base flex-1 line-clamp-1">
                          {product.name}
                        </h4>
                        {product.is_featured && (
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1 mb-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(product.base_price)}
                        </span>
                        <Button
                          size="sm"
                          className="rounded-full h-8 px-4 text-xs font-medium shadow-sm"
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                    {product.image_url ? (
                      <div className="flex-shrink-0">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-28 h-28 object-cover rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className="w-28 h-28 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-gray-400">Sem foto</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPreview;
