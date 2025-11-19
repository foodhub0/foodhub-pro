import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrand } from "@/contexts/BrandContext";
import { Building2, Store, Users, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BrandDashboard = () => {
  const { brand, restaurants } = useBrand();

  // Mock de dados consolidados
  const consolidated = {
    totalRevenue: 45890.50,
    totalOrders: 1243,
    totalUsers: 24,
    averageTicket: 36.92,
  };

  if (!brand) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Carregando dados da marca...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">{brand.name}</h1>
            </div>
            <p className="text-muted-foreground">
              Visão consolidada de todas as unidades
            </p>
          </div>
          <Badge className="text-lg px-4 py-2">
            {restaurants.length} {restaurants.length === 1 ? 'Unidade' : 'Unidades'}
          </Badge>
        </div>

        {/* KPIs Consolidados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(consolidated.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consolidated.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Todas as unidades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consolidated.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Em {restaurants.length} unidades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(consolidated.averageTicket)}
              </div>
              <p className="text-xs text-muted-foreground">
                Média consolidada
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resumo por Unidade */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Unidade</CardTitle>
            <CardDescription>Resumo individual de cada restaurante</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {restaurants.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum restaurante cadastrado</p>
                </div>
              ) : (
                restaurants.map((restaurant, index) => (
                  <div
                    key={restaurant.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                        {restaurant.restaurant_index}
                      </div>
                      <div>
                        <h3 className="font-semibold">{restaurant.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {restaurant.is_open ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Aberto
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600 border-gray-600">
                              Fechado
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Receita (mock)</p>
                      <p className="font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Math.random() * 20000 + 10000)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BrandDashboard;
