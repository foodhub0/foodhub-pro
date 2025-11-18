import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, Package, TrendingUp, AlertCircle, ShoppingCart, Wine, Grid3x3 } from "lucide-react";

const CostsDashboard = () => {
  const { data: restaurant } = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("restaurants").select("*").eq("owner_id", user.id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: ingredientsStats } = useQuery({
    queryKey: ["ingredients_stats", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return { count: 0, total_value: 0, low_stock: 0 };

      const { data, error } = await supabase
        .from("ingredients")
        .select("cost_per_unit, current_stock, minimum_stock")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true);

      if (error) throw error;

      const count = data.length;
      const total_value = data.reduce((sum, item) => sum + (item.cost_per_unit * (item.current_stock || 0)), 0);
      const low_stock = data.filter(item =>
        item.current_stock && item.minimum_stock && item.current_stock < item.minimum_stock
      ).length;

      return { count, total_value, low_stock };
    },
    enabled: !!restaurant?.id,
  });

  const { data: beveragesStats } = useQuery({
    queryKey: ["beverages_stats", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return { count: 0, total_value: 0 };

      const { data, error } = await supabase
        .from("beverages")
        .select("cost_per_unit, current_stock")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true);

      if (error) throw error;

      const count = data.length;
      const total_value = data.reduce((sum, item) => sum + (item.cost_per_unit * (item.current_stock || 0)), 0);

      return { count, total_value };
    },
    enabled: !!restaurant?.id,
  });

  const { data: combosStats } = useQuery({
    queryKey: ["combos_stats", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return { count: 0, avg_discount: 0 };

      const { data, error } = await supabase
        .from("combos")
        .select("cost, price")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true);

      if (error) throw error;

      const count = data.length;
      const discounts = data.map(combo => ((combo.cost - combo.price) / combo.cost) * 100);
      const avg_discount = discounts.length > 0
        ? discounts.reduce((sum, d) => sum + d, 0) / discounts.length
        : 0;

      return { count, avg_discount: Math.abs(avg_discount) };
    },
    enabled: !!restaurant?.id,
  });

  const { data: recipesStats } = useQuery({
    queryKey: ["recipes_stats", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return { count: 0, avg_cost: 0 };

      const { data, error } = await supabase
        .from("recipe_ingredients")
        .select(`
          product_id,
          quantity_needed,
          ingredients (cost_per_unit)
        `);

      if (error) throw error;

      // Group by product
      const products = new Set(data.map(item => item.product_id));
      const count = products.size;

      // Calculate average recipe cost
      const recipeCosts: { [key: string]: number } = {};
      data.forEach((item: any) => {
        if (!recipeCosts[item.product_id]) {
          recipeCosts[item.product_id] = 0;
        }
        recipeCosts[item.product_id] += (item.ingredients?.cost_per_unit || 0) * item.quantity_needed;
      });

      const costs = Object.values(recipeCosts);
      const avg_cost = costs.length > 0 ? costs.reduce((sum, c) => sum + c, 0) / costs.length : 0;

      return { count, avg_cost };
    },
    enabled: !!restaurant?.id,
  });

  const { data: fixedCostsStats } = useQuery({
    queryKey: ["fixed_costs_stats", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return { total_monthly: 0 };

      const { data, error } = await supabase
        .from("fixed_costs")
        .select("amount, recurrence_period")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true);

      if (error) throw error;

      // Convert all to monthly
      const monthly_costs = data.map(cost => {
        if (cost.recurrence_period === 'daily') return cost.amount * 30;
        if (cost.recurrence_period === 'weekly') return cost.amount * 4;
        if (cost.recurrence_period === 'yearly') return cost.amount / 12;
        return cost.amount; // monthly
      });

      const total_monthly = monthly_costs.reduce((sum, c) => sum + c, 0);

      return { total_monthly };
    },
    enabled: !!restaurant?.id,
  });

  const { data: variableCostsStats } = useQuery({
    queryKey: ["variable_costs_stats", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return { total: 0 };

      const { data, error } = await supabase
        .from("variable_costs")
        .select("amount")
        .eq("restaurant_id", restaurant.id);

      if (error) throw error;

      const total = data.reduce((sum, cost) => sum + cost.amount, 0);

      return { total };
    },
    enabled: !!restaurant?.id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const statsCards = [
    {
      title: "Insumos Cadastrados",
      value: ingredientsStats?.count || 0,
      subtitle: `Estoque: ${formatCurrency(ingredientsStats?.total_value || 0)}`,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Bebidas Ativas",
      value: beveragesStats?.count || 0,
      subtitle: `Estoque: ${formatCurrency(beveragesStats?.total_value || 0)}`,
      icon: Wine,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Receitas Criadas",
      value: recipesStats?.count || 0,
      subtitle: `Custo médio: ${formatCurrency(recipesStats?.avg_cost || 0)}`,
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Combos Ativos",
      value: combosStats?.count || 0,
      subtitle: `Desconto médio: ${combosStats?.avg_discount.toFixed(1)}%`,
      icon: Grid3x3,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Custos Fixos Mensais",
      value: formatCurrency(fixedCostsStats?.total_monthly || 0),
      subtitle: "Total mensal estimado",
      icon: DollarSign,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Custos Variáveis",
      value: formatCurrency(variableCostsStats?.total || 0),
      subtitle: "Total acumulado",
      icon: TrendingUp,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard de Custos</h2>
        <p className="text-muted-foreground">
          Visão geral dos custos e métricas do seu negócio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat, index) => (
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
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {ingredientsStats && ingredientsStats.low_stock > 0 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-900">Alertas de Estoque</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-800">
              <strong>{ingredientsStats.low_stock}</strong> ingrediente{ingredientsStats.low_stock !== 1 ? 's' : ''} com estoque abaixo do mínimo.
              Verifique a aba de Insumos para reabastecer.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resumo Financeiro
            </CardTitle>
            <CardDescription>
              Análise dos custos totais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Custos Fixos (mensal)</span>
              <span className="font-bold text-red-600">
                {formatCurrency(fixedCostsStats?.total_monthly || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Custos Variáveis</span>
              <span className="font-bold text-orange-600">
                {formatCurrency(variableCostsStats?.total || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Estoque Insumos</span>
              <span className="font-bold text-blue-600">
                {formatCurrency(ingredientsStats?.total_value || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-semibold">Total Geral</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(
                  (fixedCostsStats?.total_monthly || 0) +
                  (variableCostsStats?.total || 0) +
                  (ingredientsStats?.total_value || 0)
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Insights e Recomendações
            </CardTitle>
            <CardDescription>
              Dicas para melhorar sua gestão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recipesStats || recipesStats.count === 0 ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Cadastre receitas para calcular o custo real dos seus produtos
                </p>
              </div>
            ) : null}

            {!combosStats || combosStats.count === 0 ? (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  💡 Crie combos promocionais para aumentar o ticket médio
                </p>
              </div>
            ) : null}

            {ingredientsStats && ingredientsStats.low_stock > 0 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Alguns insumos estão com estoque baixo
                </p>
              </div>
            ) : null}

            {recipesStats && recipesStats.avg_cost > 0 ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ Custo médio das receitas: {formatCurrency(recipesStats.avg_cost)}
                </p>
              </div>
            ) : null}

            {(!recipesStats || recipesStats.count === 0) &&
             (!combosStats || combosStats.count === 0) &&
             (!ingredientsStats || ingredientsStats.low_stock === 0) ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ Tudo certo! Continue gerenciando seus custos
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CostsDashboard;
