import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator,
  Package,
  Ruler,
  UtensilsCrossed,
  Plus,
  Wine,
  Grid3x3,
  DollarSign,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import Layout from "@/components/Layout";
import IngredientsModule from "@/components/costs/IngredientsModule";
import SizesModule from "@/components/costs/SizesModule";
import RecipesModule from "@/components/costs/RecipesModule";
import AdditionalsModule from "@/components/costs/AdditionalsModule";
import BeveragesModule from "@/components/costs/BeveragesModule";
import CombosModule from "@/components/costs/CombosModule";
import FixedCostsModule from "@/components/costs/FixedCostsModule";
import VariableCostsModule from "@/components/costs/VariableCostsModule";
import PriceCalculator from "@/components/costs/PriceCalculator";
import CostsDashboard from "@/components/costs/CostsDashboard";

const Costs = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Central de Custos</h1>
        <p className="text-muted-foreground">
          Gerencie insumos, receitas, preços e análise de custos do seu negócio
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-10 gap-2 h-auto p-2 bg-muted/50">
          <TabsTrigger value="dashboard" className="flex flex-col items-center gap-1 py-3">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">Dashboard</span>
          </TabsTrigger>

          <TabsTrigger value="ingredients" className="flex flex-col items-center gap-1 py-3">
            <Package className="h-4 w-4" />
            <span className="text-xs">Insumos</span>
          </TabsTrigger>

          <TabsTrigger value="sizes" className="flex flex-col items-center gap-1 py-3">
            <Ruler className="h-4 w-4" />
            <span className="text-xs">Tamanhos</span>
          </TabsTrigger>

          <TabsTrigger value="recipes" className="flex flex-col items-center gap-1 py-3">
            <UtensilsCrossed className="h-4 w-4" />
            <span className="text-xs">Receitas</span>
          </TabsTrigger>

          <TabsTrigger value="additionals" className="flex flex-col items-center gap-1 py-3">
            <Plus className="h-4 w-4" />
            <span className="text-xs">Adicionais</span>
          </TabsTrigger>

          <TabsTrigger value="beverages" className="flex flex-col items-center gap-1 py-3">
            <Wine className="h-4 w-4" />
            <span className="text-xs">Bebidas</span>
          </TabsTrigger>

          <TabsTrigger value="combos" className="flex flex-col items-center gap-1 py-3">
            <Grid3x3 className="h-4 w-4" />
            <span className="text-xs">Combos</span>
          </TabsTrigger>

          <TabsTrigger value="fixed-costs" className="flex flex-col items-center gap-1 py-3">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Custos Fixos</span>
          </TabsTrigger>

          <TabsTrigger value="variable-costs" className="flex flex-col items-center gap-1 py-3">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Custos Variáveis</span>
          </TabsTrigger>

          <TabsTrigger value="calculator" className="flex flex-col items-center gap-1 py-3">
            <Calculator className="h-4 w-4" />
            <span className="text-xs">Calculadora</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="dashboard" className="space-y-4">
            <CostsDashboard />
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-4">
            <IngredientsModule />
          </TabsContent>

          <TabsContent value="sizes" className="space-y-4">
            <SizesModule />
          </TabsContent>

          <TabsContent value="recipes" className="space-y-4">
            <RecipesModule />
          </TabsContent>

          <TabsContent value="additionals" className="space-y-4">
            <AdditionalsModule />
          </TabsContent>

          <TabsContent value="beverages" className="space-y-4">
            <BeveragesModule />
          </TabsContent>

          <TabsContent value="combos" className="space-y-4">
            <CombosModule />
          </TabsContent>

          <TabsContent value="fixed-costs" className="space-y-4">
            <FixedCostsModule />
          </TabsContent>

          <TabsContent value="variable-costs" className="space-y-4">
            <VariableCostsModule />
          </TabsContent>

          <TabsContent value="calculator" className="space-y-4">
            <PriceCalculator />
          </TabsContent>
        </div>
      </Tabs>
      </div>
    </Layout>
  );
};

export default Costs;
