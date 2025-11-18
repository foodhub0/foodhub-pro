import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp } from "lucide-react";

const PriceCalculator = () => {
  const [ingredientCost, setIngredientCost] = useState("0");
  const [targetMargin, setTargetMargin] = useState("60");
  const [markup, setMarkup] = useState("2.5");

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

  const { data: fixedCosts = [] } = useQuery({
    queryKey: ["fixed_costs", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const { data, error } = await supabase.from("fixed_costs").select("*").eq("restaurant_id", restaurant.id);
      if (error) throw error;
      return data;
    },
    enabled: !!restaurant?.id,
  });

  const totalFixedCosts = fixedCosts.reduce((sum: number, cost: any) => {
    if (cost.recurring_period === "monthly") return sum + cost.amount;
    if (cost.recurring_period === "yearly") return sum + (cost.amount / 12);
    return sum;
  }, 0);

  const cost = parseFloat(ingredientCost) || 0;
  const margin = parseFloat(targetMargin) || 0;
  const markupValue = parseFloat(markup) || 0;

  const priceByMargin = cost / (1 - margin / 100);
  const priceByMarkup = cost * markupValue;
  const calculatedMargin = priceByMarkup > 0 ? ((priceByMarkup - cost) / priceByMarkup) * 100 : 0;
  const grossProfit = priceByMarkup - cost;

  const estimatedMonthlySales = 300;
  const fixedCostPerItem = totalFixedCosts / estimatedMonthlySales;
  const totalCostWithFixed = cost + fixedCostPerItem;
  const suggestedPrice = totalCostWithFixed / (1 - 0.60);
  const netProfit = suggestedPrice - totalCostWithFixed;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <div>
              <CardTitle>Calculadora de Preço</CardTitle>
              <CardDescription>Calcule o preço ideal com base em custos, margem e markup</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Custo do Produto (R$)</Label>
                <Input type="number" step="0.01" min="0" value={ingredientCost} onChange={(e) => setIngredientCost(e.target.value)} placeholder="0.00" />
                <p className="text-xs text-muted-foreground mt-1">Soma de todos os ingredientes e insumos</p>
              </div>

              <div>
                <Label>Margem de Lucro Desejada (%)</Label>
                <Input type="number" step="1" min="0" max="100" value={targetMargin} onChange={(e) => setTargetMargin(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Percentual sobre o preço de venda</p>
              </div>

              <div>
                <Label>Markup (Multiplicador)</Label>
                <Input type="number" step="0.1" min="1" value={markup} onChange={(e) => setMarkup(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Quanto multiplicar o custo (ex: 2.5x)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <h3 className="font-semibold mb-3">Cálculo por Margem</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Custo:</span>
                    <span className="font-medium">R$ {cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Margem alvo:</span>
                    <span className="font-medium">{margin.toFixed(0)}%</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Preço sugerido:</span>
                      <span className="text-lg font-bold text-primary">R$ {priceByMargin.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-secondary/10 rounded-lg">
                <h3 className="font-semibold mb-3">Cálculo por Markup</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Custo:</span>
                    <span className="font-medium">R$ {cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Markup:</span>
                    <span className="font-medium">{markupValue}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Margem efetiva:</span>
                    <span className="font-medium">{calculatedMargin.toFixed(1)}%</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Preço sugerido:</span>
                      <span className="text-lg font-bold text-primary">R$ {priceByMarkup.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Lucro bruto:</span>
                    <span>R$ {grossProfit.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <div>
              <CardTitle>Análise Completa com Custos Fixos</CardTitle>
              <CardDescription>Inclui rateio de custos fixos mensais</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Custo variável (ingredientes):</span>
                <span className="font-medium">R$ {cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Custos fixos mensais:</span>
                <span className="font-medium">R$ {totalFixedCosts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Vendas estimadas/mês:</span>
                <span className="font-medium">{estimatedMonthlySales} unidades</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span className="text-sm">Custo fixo por unidade:</span>
                <span className="font-medium">R$ {fixedCostPerItem.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Custo total por unidade:</span>
                  <span>R$ {totalCostWithFixed.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
              <h3 className="font-semibold mb-3">Preço Final Sugerido</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Custo total:</span>
                  <span>R$ {totalCostWithFixed.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Margem alvo:</span>
                  <span>60%</span>
                </div>
                <div className="border-t border-primary/30 pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg">Preço ideal:</span>
                    <span className="text-2xl font-bold text-primary">R$ {suggestedPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Lucro líquido:</span>
                    <span>R$ {netProfit.toFixed(2)}</span>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    <p>• Inclui todos os custos (fixos + variáveis)</p>
                    <p>• Margem de 60% sobre o preço de venda</p>
                    <p>• Lucro suficiente para cobrir operação</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparativo de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Método</th>
                  <th className="text-right p-2">Preço</th>
                  <th className="text-right p-2">Margem</th>
                  <th className="text-right p-2">Lucro</th>
                  <th className="text-left p-2">Recomendação</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">Por Margem ({margin}%)</td>
                  <td className="text-right p-2">R$ {priceByMargin.toFixed(2)}</td>
                  <td className="text-right p-2">{margin}%</td>
                  <td className="text-right p-2 text-green-600">R$ {(priceByMargin - cost).toFixed(2)}</td>
                  <td className="p-2 text-xs text-muted-foreground">Simples, não inclui fixos</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Por Markup ({markupValue}x)</td>
                  <td className="text-right p-2">R$ {priceByMarkup.toFixed(2)}</td>
                  <td className="text-right p-2">{calculatedMargin.toFixed(1)}%</td>
                  <td className="text-right p-2 text-green-600">R$ {grossProfit.toFixed(2)}</td>
                  <td className="p-2 text-xs text-muted-foreground">Fácil de calcular</td>
                </tr>
                <tr className="bg-primary/10">
                  <td className="p-2 font-bold">Com Custos Fixos</td>
                  <td className="text-right p-2 font-bold">R$ {suggestedPrice.toFixed(2)}</td>
                  <td className="text-right p-2">60%</td>
                  <td className="text-right p-2 text-green-600 font-bold">R$ {netProfit.toFixed(2)}</td>
                  <td className="p-2 text-xs font-semibold text-primary">✓ RECOMENDADO</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceCalculator;
