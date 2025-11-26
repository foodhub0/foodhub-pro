import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { useBrand } from "@/contexts/BrandContext";
import { usePermissions } from "@/contexts/PermissionsContext";

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  pendingOrders: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentRestaurant, isLoading: brandLoading } = useBrand();
  const { isOwner } = usePermissions();
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    averageTicket: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [currentRestaurant, brandLoading]);

  useEffect(() => {
    if (restaurantId) {
      loadStats();
    }
  }, [restaurantId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate("/auth");
      return;
    }

    // Aguardar BrandContext carregar
    if (brandLoading) return;

    // Usar restaurante do BrandContext
    if (currentRestaurant) {
      setRestaurantId(currentRestaurant.id);
      return;
    }

    // Se não tem restaurante E é owner, redirecionar para setup
    if (isOwner()) {
      toast({
        title: "Nenhum restaurante encontrado",
        description: "Você precisa criar um restaurante primeiro.",
        variant: "destructive",
      });
      navigate("/setup");
      return;
    }

    // Se não é owner e não tem restaurante, algo está errado
    toast({
      title: "Erro de configuração",
      description: "Seu usuário não está vinculado a nenhum restaurante. Entre em contato com o administrador.",
      variant: "destructive",
    });
  };

  const loadStats = async () => {
    if (!restaurantId) return;

    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's orders
    const { data: orders, error } = await supabase
      .from("orders")
      .select("total_amount, status, created_at")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", today.toISOString());

    if (error) {
      console.error("Error loading stats:", error);
      setLoading(false);
      return;
    }

    const totalSales = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
    const totalOrders = orders?.length || 0;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

    setStats({
      totalSales,
      totalOrders,
      averageTicket,
      pendingOrders,
    });

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const statCards = [
    {
      title: "Vendas Hoje",
      value: formatCurrency(stats.totalSales),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Pedidos Hoje",
      value: stats.totalOrders.toString(),
      icon: ShoppingBag,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(stats.averageTicket),
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pedidos Pendentes",
      value: stats.pendingOrders.toString(),
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe as métricas do seu restaurante em tempo real
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao FoodHub</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Sistema completo de gestão para restaurantes. Comece configurando seu cardápio,
              criando mesas e gerenciando pedidos.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
