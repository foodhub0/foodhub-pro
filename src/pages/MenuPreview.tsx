import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Star, ArrowLeft } from "lucide-react";
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
      .select("name, description, cover_url, logo_url, id")
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
    <div className="min-h-screen bg-background">
      {/* Header com botão voltar */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg">Preview do Cardápio</h1>
            <p className="text-xs text-muted-foreground">Visualização como cliente</p>
          </div>
        </div>
      </div>

      {/* Hero/Cover */}
      {restaurant?.cover_url ? (
        <div
          className="h-48 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${restaurant.cover_url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-primary to-accent" />
      )}

      {/* Restaurant Info */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-card rounded-2xl p-6 shadow-xl">
          <div className="flex items-start gap-4">
            {restaurant?.logo_url && (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-20 h-20 rounded-xl object-cover border-4 border-background shadow-lg"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">
                {restaurant?.name}
              </h2>
              {restaurant?.description && (
                <p className="text-muted-foreground mt-1">
                  {restaurant.description}
                </p>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              className="pl-10 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-min">
              <Badge
                variant={!selectedCategory ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap px-4 py-2 text-sm"
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap px-4 py-2 text-sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="mt-6 pb-8">
          {filteredProducts.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Nenhum produto encontrado"
                  : "Nenhum produto disponível"}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="relative">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">Sem imagem</span>
                      </div>
                    )}
                    {product.is_featured && (
                      <div className="absolute top-2 right-2 bg-accent text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
                        <Star className="h-3 w-3 fill-current" />
                        Destaque
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-lg text-foreground line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description || ""}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(product.base_price)}
                      </span>
                      <Button size="sm" className="rounded-full">
                        Adicionar
                      </Button>
                    </div>
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
