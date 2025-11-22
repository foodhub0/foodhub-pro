import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Utensils,
  FolderOpen,
  Table2,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Eye,
  Store,
  Calculator,
  UserCircle,
  Bike,
  ChevronLeft,
  ChevronRight,
  Plug,
  BarChart3,
  Rocket,
  Building2,
  ClipboardList,
  DoorOpen,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AIChat from "@/components/AIChat";
import { RestaurantProfileCard } from "@/components/RestaurantProfileCard";
import { RestaurantSelector } from "@/components/RestaurantSelector";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useBrand } from "@/contexts/BrandContext";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isOwner, isWaiter, isReception, isFinancial, isMarketing, can, role } = usePermissions();
  const { brand, currentRestaurant } = useBrand();

  // Usar dados do BrandContext ao invés de buscar diretamente
  const restaurantName = currentRestaurant?.name || brand?.name || "FoodHub";
  const restaurantLogo = brand?.logo_url || null;
  const restaurantId = currentRestaurant?.id || null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Menu items dinâmicos baseados em permissões e roles
  const getMenuItems = () => {
    const items = [];

    // Início (Dashboard da Marca - apenas Owner)
    if (isOwner()) {
      items.push({ icon: Building2, label: "Início", path: "/brand-dashboard" });
    }

    // Dashboard (todos exceto Garçom)
    if (!isWaiter()) {
      items.push({ icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" });
    }

    // Pedidos do Garçom (apenas Garçom)
    if (isWaiter()) {
      items.push({ icon: ClipboardList, label: "Pedidos", path: "/waiter-orders" });
    }

    // Recepção (apenas Recepção)
    if (isReception()) {
      items.push({ icon: DoorOpen, label: "Recepção", path: "/reception" });
    }

    // Pedidos (todos exceto Garçom puro)
    if (!isWaiter() || can('update', 'orders')) {
      items.push({ icon: ShoppingBag, label: "Pedidos", path: "/orders" });
    }

    // Clientes
    if (can('read', 'customers')) {
      items.push({ icon: UserCircle, label: "Clientes", path: "/customers" });
    }

    // Meu Restaurante (Manager, Owner)
    if (can('read', 'settings')) {
      items.push({ icon: Store, label: "Meu Restaurante", path: "/restaurant" });
    }

    // Produtos (Manager, Owner)
    if (can('read', 'products')) {
      items.push({ icon: Utensils, label: "Produtos", path: "/products" });
    }

    // Mesas
    if (can('read', 'tables')) {
      items.push({ icon: Table2, label: "Mesas", path: "/tables" });
    }

    // Custos (Financial, Manager, Owner)
    if (can('read', 'costs')) {
      items.push({ icon: Calculator, label: "Custos", path: "/costs" });
    }

    // Entregadores (Manager, Owner)
    if (can('read', 'settings')) {
      items.push({ icon: Bike, label: "Entregadores", path: "/couriers" });
    }

    // Cardápio (Manager, Owner)
    if (can('read', 'products')) {
      items.push({ icon: Eye, label: "Cardápio", path: "/menu-preview" });
    }

    // Integração iFood (Manager, Owner)
    if (can('read', 'settings')) {
      items.push({ icon: Plug, label: "Integração iFood", path: "/ifood-integration" });
    }

    // Analytics (Financial, Marketing, Manager, Owner)
    if (can('read', 'analytics') || isFinancial() || isMarketing()) {
      items.push({ icon: BarChart3, label: "Analytics", path: "/analytics" });
    }

    // Potencializar Negócio (Marketing, Manager, Owner)
    if (isMarketing() || can('read', 'settings')) {
      items.push({ icon: Rocket, label: "Potencializar Negócio", path: "/boost-business" });
    }

    // Usuários (Manager, Owner)
    if (can('read', 'users')) {
      items.push({ icon: Users, label: "Usuários", path: "/users" });
    }

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0 lg:w-20"
        )}
      >
        {/* Mobile Header - Apenas o botão de menu */}
        <div className="flex h-16 items-center justify-end px-4 border-b lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Toggle Button Desktop - Fixo no topo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "hidden lg:flex absolute -right-3 top-6 z-50 h-8 w-8 rounded-full border-2 bg-background shadow-md hover:bg-accent",
            "transition-all duration-300"
          )}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {/* Restaurant Profile Card - Novo Design */}
        <RestaurantProfileCard restaurantId={restaurantId} sidebarOpen={sidebarOpen} />

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
            onClick={() => navigate("/restaurant")}
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
          <RestaurantSelector />
          <div className="w-10" />
        </div>

        {/* Desktop Header with Restaurant Selector */}
        <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b bg-card">
          <h2 className="text-lg font-semibold">Bem-vindo ao FoodHub Pro</h2>
          <RestaurantSelector />
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
