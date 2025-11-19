import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  ShoppingCart,
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  RefreshCw
} from "lucide-react";

interface AnalyticsData {
  event_date: string;
  total_visitors: number;
  product_views: number;
  cart_additions: number;
  checkouts_initiated: number;
  purchases: number;
  total_revenue: number;
  conversion_rate: number;
}

const Analytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [period, setPeriod] = useState<string>("7");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [aggregatedData, setAggregatedData] = useState({
    totalVisitors: 0,
    totalViews: 0,
    totalCartAdditions: 0,
    totalCheckouts: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    avgConversionRate: 0,
  });

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      loadAnalytics();
    }
  }, [selectedRestaurant, period]);

  const loadRestaurants = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("restaurants")
      .select("id, name")
      .eq("user_id", user.id);

    setRestaurants(data || []);
    if (data && data.length > 0) {
      setSelectedRestaurant(data[0].id);
    }
    setLoading(false);
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Buscar dados da view materializada
      const { data, error } = await supabase
        .from("conversion_analytics")
        .select("*")
        .eq("restaurant_id", selectedRestaurant)
        .gte("event_date", startDate.toISOString().split('T')[0])
        .order("event_date", { ascending: false });

      if (error) throw error;

      setAnalyticsData(data || []);

      // Calcular agregados
      const aggregated = (data || []).reduce(
        (acc, curr) => ({
          totalVisitors: acc.totalVisitors + curr.total_visitors,
          totalViews: acc.totalViews + curr.product_views,
          totalCartAdditions: acc.totalCartAdditions + curr.cart_additions,
          totalCheckouts: acc.totalCheckouts + curr.checkouts_initiated,
          totalPurchases: acc.totalPurchases + curr.purchases,
          totalRevenue: acc.totalRevenue + parseFloat(curr.total_revenue.toString()),
          avgConversionRate: 0, // Calculado depois
        }),
        {
          totalVisitors: 0,
          totalViews: 0,
          totalCartAdditions: 0,
          totalCheckouts: 0,
          totalPurchases: 0,
          totalRevenue: 0,
          avgConversionRate: 0,
        }
      );

      // Calcular taxa de conversão média
      if (aggregated.totalVisitors > 0) {
        aggregated.avgConversionRate = (aggregated.totalPurchases / aggregated.totalVisitors) * 100;
      }

      setAggregatedData(aggregated);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshMaterializedView = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('refresh_conversion_analytics');
      if (error) throw error;

      toast({
        title: "Analytics atualizado!",
        description: "Os dados foram atualizados com sucesso.",
      });

      loadAnalytics();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading && restaurants.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics de Conversão</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe visitantes, visualizações e vendas do seu cardápio
          </p>
        </div>
        <Button onClick={refreshMaterializedView} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o restaurante" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedData.totalVisitors}</div>
            <p className="text-xs text-muted-foreground">
              Pessoas que acessaram o cardápio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedData.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Produtos visualizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adições ao Carrinho</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedData.totalCartAdditions}</div>
            <p className="text-xs text-muted-foreground">
              Produtos adicionados ao carrinho
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checkouts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedData.totalCheckouts}</div>
            <p className="text-xs text-muted-foreground">
              Processos de checkout iniciados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de conversão e receita */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedData.totalPurchases}</div>
            <p className="text-xs text-muted-foreground">
              Pedidos concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(aggregatedData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Faturamento no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedData.avgConversionRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              Visitantes que compraram
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de dados diários */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Diários</CardTitle>
          <CardDescription>Métricas detalhadas por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Data</th>
                  <th className="text-right p-2">Visitantes</th>
                  <th className="text-right p-2">Visualizações</th>
                  <th className="text-right p-2">Carrinho</th>
                  <th className="text-right p-2">Vendas</th>
                  <th className="text-right p-2">Receita</th>
                  <th className="text-right p-2">Conversão</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum dado disponível para o período selecionado
                    </td>
                  </tr>
                ) : (
                  analyticsData.map((row) => (
                    <tr key={row.event_date} className="border-b hover:bg-muted/50">
                      <td className="p-2">{new Date(row.event_date).toLocaleDateString('pt-BR')}</td>
                      <td className="text-right p-2">{row.total_visitors}</td>
                      <td className="text-right p-2">{row.product_views}</td>
                      <td className="text-right p-2">{row.cart_additions}</td>
                      <td className="text-right p-2">{row.purchases}</td>
                      <td className="text-right p-2">{formatCurrency(parseFloat(row.total_revenue.toString()))}</td>
                      <td className="text-right p-2">{row.conversion_rate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
