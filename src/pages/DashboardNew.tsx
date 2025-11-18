import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Clock,
  Bike,
  UtensilsCrossed,
  ShoppingCart,
  Camera,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  averageTicket: number;
  pendingOrders: number;
  last7DaysOrders: number;
  last7DaysSales: number;
}

interface OrderMethod {
  method: string;
  count: number;
  percentage: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

const DashboardNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageTicket: 0,
    pendingOrders: 0,
    last7DaysOrders: 0,
    last7DaysSales: 0,
  });
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [orderMethods, setOrderMethods] = useState<OrderMethod[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

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

    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (error || !restaurant) {
      toast({
        title: "Nenhum restaurante encontrado",
        description: "Você precisa criar um restaurante primeiro.",
        variant: "destructive",
      });
      navigate("/setup");
      return;
    }

    setRestaurantId(restaurant.id);
  };

  const loadStats = async () => {
    if (!restaurantId) return;

    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all time stats
    const { data: allOrders } = await supabase
      .from("orders")
      .select("total_amount, status, created_at, delivery_method, customer_id")
      .eq("restaurant_id", restaurantId);

    // Get today's orders
    const { data: todayOrders } = await supabase
      .from("orders")
      .select("total_amount, status")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", today.toISOString());

    // Get last 7 days orders
    const { data: last7Days } = await supabase
      .from("orders")
      .select("total_amount, created_at")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", sevenDaysAgo.toISOString());

    // Get customers count
    const { data: customers } = await supabase
      .from("customers")
      .select("id")
      .eq("restaurant_id", restaurantId);

    // Get top products
    const { data: orderItems } = await supabase
      .from("order_items")
      .select(`
        quantity,
        price,
        products (name)
      `)
      .limit(1000);

    const totalSales = todayOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
    const totalOrders = todayOrders?.length || 0;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    const pendingOrders = todayOrders?.filter(o => o.status === 'pending').length || 0;

    const last7DaysSales = last7Days?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
    const last7DaysOrders = last7Days?.length || 0;

    setStats({
      totalSales,
      totalOrders,
      totalCustomers: customers?.length || 0,
      averageTicket,
      pendingOrders,
      last7DaysOrders,
      last7DaysSales,
    });

    // Process weekly data
    const dailyStats: { [key: string]: { sales: number; orders: number } } = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      dailyStats[dateStr] = { sales: 0, orders: 0 };
    }

    last7Days?.forEach(order => {
      const date = new Date(order.created_at);
      const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].sales += Number(order.total_amount);
        dailyStats[dateStr].orders += 1;
      }
    });

    setWeeklyData(
      Object.entries(dailyStats).map(([day, data]) => ({
        day,
        vendas: data.sales,
        pedidos: data.orders,
      }))
    );

    // Process order methods
    const methods: { [key: string]: number } = {
      'Delivery': 0,
      'Mesas': 0,
      'Retirada': 0,
    };

    allOrders?.forEach(order => {
      const method = order.delivery_method === 'delivery' ? 'Delivery'
                   : order.delivery_method === 'dine_in' ? 'Mesas'
                   : 'Retirada';
      methods[method] = (methods[method] || 0) + 1;
    });

    const total = Object.values(methods).reduce((sum, count) => sum + count, 0);
    setOrderMethods(
      Object.entries(methods)
        .map(([method, count]) => ({
          method,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
    );

    // Process top products
    const productStats: { [key: string]: { quantity: number; revenue: number } } = {};
    orderItems?.forEach((item: any) => {
      const name = item.products?.name || 'Unknown';
      if (!productStats[name]) {
        productStats[name] = { quantity: 0, revenue: 0 };
      }
      productStats[name].quantity += item.quantity;
      productStats[name].revenue += item.price * item.quantity;
    });

    setTopProducts(
      Object.entries(productStats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
    );

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const COLORS = ['#0066FF', '#003F99', '#0088FF', '#005ACC'];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066FF]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Food Hub</h1>
            <p className="text-gray-600">Visão geral do seu negócio em tempo real</p>
          </div>

          {/* Main Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Receita Total */}
            <Card className="bg-white border-none shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Receita Total (Hoje)
                </CardTitle>
                <div className="p-2 rounded-lg bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatCurrency(stats.totalSales)}
                </div>
                <div className="flex items-center text-xs text-green-600">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  <span>Atualizado agora</span>
                </div>
              </CardContent>
            </Card>

            {/* Total de Pedidos */}
            <Card className="bg-white border-none shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Pedidos (Hoje)
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-100">
                  <ShoppingBag className="h-5 w-5 text-[#0066FF]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.totalOrders}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <span>7 dias: {stats.last7DaysOrders} pedidos</span>
                </div>
              </CardContent>
            </Card>

            {/* Clientes Totais */}
            <Card className="bg-white border-none shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Clientes Totais
                </CardTitle>
                <div className="p-2 rounded-lg bg-purple-100">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.totalCustomers}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <span>Base de clientes</span>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Médio */}
            <Card className="bg-white border-none shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Ticket Médio
                </CardTitle>
                <div className="p-2 rounded-lg bg-orange-100">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatCurrency(stats.averageTicket)}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <span>Por pedido hoje</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Journey Card + Quick Tip */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Illustration Central */}
            <Card className="md:col-span-2 bg-gradient-to-br from-[#0066FF] to-[#003F99] border-none shadow-md text-white">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
                <div className="bg-white/10 p-4 rounded-full mb-4">
                  <ShoppingCart className="h-16 w-16" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Sua jornada começa aqui</h2>
                <p className="text-blue-100 max-w-md text-lg">
                  Gerencie seu negócio de forma inteligente com o Food Hub
                </p>
              </CardContent>
            </Card>

            {/* Dica Rápida */}
            <Card className="bg-white border-none shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-[#E7F1FF]">
                    <Camera className="h-5 w-5 text-[#0066FF]" />
                  </div>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    Dica rápida para vender mais
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Ative fotos profissionais e aumente sua taxa de conversão em até 38%.
                </p>
                <div className="mt-4 flex items-center text-xs text-[#0066FF] font-medium">
                  <span>Saiba mais →</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pedidos - 7 dias */}
            <Card className="bg-white border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-[#0066FF]" />
                  Pedidos - 7 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                      formatter={(value) => [`${value} pedidos`, 'Pedidos']}
                    />
                    <Bar dataKey="pedidos" fill="#0066FF" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Receita - 7 dias */}
            <Card className="bg-white border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Receita - 7 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                      formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
                    />
                    <Line type="monotone" dataKey="vendas" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Formas Mais Pedidas */}
            <Card className="bg-white border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Bike className="h-5 w-5 text-[#0066FF]" />
                  Formas mais pedidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderMethods.map((method, index) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center`}
                             style={{ backgroundColor: COLORS[index] + '20' }}>
                          {method.method === 'Delivery' && <Bike className="h-5 w-5" style={{ color: COLORS[index] }} />}
                          {method.method === 'Mesas' && <UtensilsCrossed className="h-5 w-5" style={{ color: COLORS[index] }} />}
                          {method.method === 'Retirada' && <ShoppingCart className="h-5 w-5" style={{ color: COLORS[index] }} />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{method.method}</div>
                          <div className="text-xs text-gray-500">{method.count} pedidos</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{method.percentage.toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Produtos Mais Vendidos */}
            <Card className="bg-white border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Produtos mais vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhum produto vendido ainda</p>
                  ) : (
                    topProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E7F1FF] flex items-center justify-center">
                            <span className="text-xs font-bold text-[#0066FF]">{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.quantity} vendidos</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(product.revenue)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pedidos em Andamento */}
            <Card className="bg-white border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Pedidos em andamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-5xl font-bold text-[#0066FF] mb-2">
                    {stats.pendingOrders}
                  </div>
                  <p className="text-sm text-gray-600">
                    Pedidos aguardando processamento
                  </p>
                  {stats.pendingOrders > 0 && (
                    <button
                      onClick={() => navigate('/orders')}
                      className="mt-4 text-sm text-[#0066FF] font-medium hover:underline"
                    >
                      Ver todos os pedidos →
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardNew;
