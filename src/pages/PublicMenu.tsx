import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Star, Clock, MapPin, Phone, ShoppingCart, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
}

const PublicMenu = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

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
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredProducts = products.filter((product) => product.is_featured);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: restaurant?.name || "Cardápio",
          text: `Confira o cardápio de ${restaurant?.name}!`,
          url: url,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copiado!",
        description: "O link do cardápio foi copiado para a área de transferência",
      });
    }
  };

  const handleAddToCart = (product: Product) => {
    setCartCount(cartCount + 1);
    toast({
      title: "Adicionado ao carrinho!",
      description: `${product.name} foi adicionado ao seu pedido`,
    });
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurante não encontrado</h1>
        <p className="text-gray-600">O cardápio que você está procurando não existe.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Fixo */}
      <header className="sticky top-0 z-50 bg-white shadow-sm" role="banner">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo e Nome */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {restaurant.logo_url && (
                <img
                  src={restaurant.logo_url}
                  alt={`${restaurant.name} logo`}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  loading="eager"
                />
              )}
              <div className="min-w-0">
                <h1 className="font-bold text-lg leading-tight truncate">{restaurant.name}</h1>
                {restaurant.delivery_time_estimate && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>{restaurant.delivery_time_estimate} min</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ações do Header */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="rounded-full"
                aria-label="Compartilhar cardápio"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full relative"
                aria-label="Ver carrinho"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Perfil do usuário"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {restaurant.cover_url && (
        <div className="relative h-48 sm:h-64 overflow-hidden" role="img" aria-label="Imagem de capa do restaurante">
          <img
            src={restaurant.cover_url}
            alt={`${restaurant.name} capa`}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden="true" />
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 -mt-8 relative z-10 pb-8" role="main">
        {/* Restaurant Info Card */}
        <Card className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="p-5">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {restaurant.name}
              </h2>
              {restaurant.description && (
                <p className="text-gray-600 leading-relaxed">
                  {restaurant.description}
                </p>
              )}
            </div>

            {/* Info Tags */}
            <div className="flex flex-wrap gap-4 mb-4">
              {restaurant.delivery_time_estimate && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium">{restaurant.delivery_time_estimate} min</p>
                    <p className="text-xs text-gray-500">Tempo de entrega</p>
                  </div>
                </div>
              )}
              {restaurant.delivery_fee !== null && restaurant.delivery_fee !== undefined && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <span className="text-lg" aria-hidden="true">🛵</span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {restaurant.delivery_fee === 0
                        ? "Grátis"
                        : formatCurrency(restaurant.delivery_fee)}
                    </p>
                    <p className="text-xs text-gray-500">Taxa de entrega</p>
                  </div>
                </div>
              )}
              {restaurant.address && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{restaurant.address}</p>
                    <p className="text-xs text-gray-500">Localização</p>
                  </div>
                </div>
              )}
              {restaurant.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-warning" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium">{restaurant.phone}</p>
                    <p className="text-xs text-gray-500">Telefone</p>
                  </div>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
              <Input
                placeholder="Buscar no cardápio..."
                className="pl-12 h-12 bg-gray-50 border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar produtos no cardápio"
              />
            </div>
          </div>
        </Card>

        {/* Categories Filters */}
        {categories.length > 0 && (
          <nav className="-mx-4 px-4 mb-6 overflow-x-auto scrollbar-hide" aria-label="Filtros de categoria">
            <div className="flex gap-2 pb-2 min-w-max">
              <Badge
                variant={!selectedCategory ? "default" : "outline"}
                className={cn(
                  "cursor-pointer whitespace-nowrap px-5 py-2.5 text-sm font-medium rounded-full transition-all hover:scale-105",
                  !selectedCategory
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                )}
                onClick={() => setSelectedCategory(null)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelectedCategory(null)}
              >
                Todos os produtos
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer whitespace-nowrap px-5 py-2.5 text-sm font-medium rounded-full transition-all hover:scale-105",
                    selectedCategory === category.id
                      ? "bg-primary text-white shadow-md"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  )}
                  onClick={() => setSelectedCategory(category.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedCategory(category.id)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </nav>
        )}

        {/* Featured Products */}
        {!selectedCategory && !searchQuery && featuredProducts.length > 0 && (
          <section className="mb-8" aria-labelledby="featured-heading">
            <h3 id="featured-heading" className="text-xl font-bold text-gray-900 mb-4 px-1 flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
              Destaques
            </h3>
            <div className="grid gap-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  isFeatured
                />
              ))}
            </div>
          </section>
        )}

        {/* Products Grid */}
        <section aria-labelledby="products-heading">
          {(!selectedCategory && !searchQuery) && (
            <h3 id="products-heading" className="text-xl font-bold text-gray-900 mb-4 px-1">
              Cardápio Completo
            </h3>
          )}

          {filteredProducts.length === 0 ? (
            <Card className="p-16 text-center bg-white shadow-sm">
              <p className="text-gray-500" role="status">
                {searchQuery
                  ? "Nenhum produto encontrado para sua busca"
                  : "Nenhum produto disponível nesta categoria"}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12" role="contentinfo">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Sobre {restaurant.name}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {restaurant.description || "Experiência gastronômica única com ingredientes selecionados e atendimento de qualidade."}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Contato</h4>
              <div className="space-y-2 text-sm text-gray-600">
                {restaurant.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {restaurant.phone}
                  </p>
                )}
                {restaurant.address && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {restaurant.address}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-3">Informações</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Termos de Uso</li>
                <li>Política de Privacidade</li>
                <li>Política de Entrega</li>
                <li>Formas de Pagamento</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} {restaurant.name}. Todos os direitos reservados.</p>
            <p className="mt-1">Powered by FoodHub</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Product Card Component with Lazy Loading
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isFeatured?: boolean;
}

const ProductCard = ({ product, onAddToCart, isFeatured = false }: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card
      className={cn(
        "overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-white border-0 shadow-md",
        isFeatured && "ring-2 ring-amber-400 ring-offset-2"
      )}
      role="article"
      aria-label={`${product.name} - ${formatCurrency(product.base_price)}`}
    >
      <div className="flex gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 text-base flex-1 line-clamp-2 leading-snug">
              {product.name}
            </h4>
            {product.is_featured && (
              <Star className="h-5 w-5 fill-amber-400 text-amber-400 flex-shrink-0" aria-label="Produto em destaque" />
            )}
          </div>
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xl font-bold text-primary">
              {formatCurrency(product.base_price)}
            </span>
            <Button
              size="sm"
              className="rounded-full h-9 px-5 text-sm font-medium shadow-md hover:shadow-lg transition-all"
              onClick={() => onAddToCart(product)}
              aria-label={`Adicionar ${product.name} ao carrinho`}
            >
              Adicionar
            </Button>
          </div>
        </div>
        {product.image_url ? (
          <div className="flex-shrink-0 relative w-32 h-32">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gray-200 rounded-xl animate-pulse" />
            )}
            {!imageError ? (
              <img
                src={product.image_url}
                alt={product.name}
                className={cn(
                  "w-32 h-32 object-cover rounded-xl transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center">
                <span className="text-xs text-gray-400">Sem foto</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-gray-400">Sem foto</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PublicMenu;
