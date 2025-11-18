import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Utensils,
  FolderOpen,
  Table2,
  ShoppingBag,
  Users,
  Ticket,
  Settings,
  LogOut,
  Menu,
  X,
  Eye,
  Store,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AIChat from "@/components/AIChat";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [restaurantName, setRestaurantName] = useState("FoodHub");
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null);

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("name, logo_url")
      .eq("owner_id", user.id)
      .single();

    if (restaurant) {
      setRestaurantName(restaurant.name);
      setRestaurantLogo(restaurant.logo_url);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Store, label: "Meu Restaurante", path: "/restaurant" },
    { icon: FolderOpen, label: "Categorias", path: "/categories" },
    { icon: Utensils, label: "Produtos", path: "/products" },
    { icon: Table2, label: "Mesas", path: "/tables" },
    { icon: ShoppingBag, label: "Pedidos", path: "/orders" },
    { icon: Calculator, label: "Custos", path: "/costs" },
    { icon: Users, label: "Entregadores", path: "/couriers" },
    { icon: Ticket, label: "Cupons", path: "/coupons" },
    { icon: Eye, label: "Ver Cardápio", path: "/menu-preview" },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0 lg:w-20"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              {restaurantLogo ? (
                <img
                  src={restaurantLogo}
                  alt={restaurantName}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="hidden lg:block">
                <p className="font-bold text-foreground truncate max-w-[140px]">
                  {restaurantName}
                </p>
                <p className="text-xs text-muted-foreground">Painel Admin</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  !sidebarOpen && "lg:justify-center lg:px-2"
                )}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="truncate">{item.label}</span>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3",
              !sidebarOpen && "lg:justify-center lg:px-2"
            )}
            onClick={() => navigate("/settings")}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>Configurações</span>}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-destructive hover:text-destructive",
              !sidebarOpen && "lg:justify-center lg:px-2"
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 border-b bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold">{restaurantName}</span>
          <div className="w-10" />
        </div>

        {children}
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* AI Chat Flutuante */}
      <AIChat />
    </div>
  );
};

export default Layout;
