import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

const PriceCalculator = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <div>
            <CardTitle>Calculadora de Preço</CardTitle>
            <CardDescription>
              Calcule o preço ideal com base em custos, margem e markup desejado
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <Calculator className="mx-auto h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">Calculadora Inteligente de Preços</p>
          <p className="text-sm mb-4">
            Análise completa de custos com sugestão de preços baseada em:
          </p>
          <div className="text-xs space-y-1">
            <p>• Custo real de cada item (ingredientes + adicionais)</p>
            <p>• Margem de lucro desejada</p>
            <p>• Markup calculado automaticamente</p>
            <p>• Ponto de equilíbrio</p>
            <p>• Custos fixos rateados</p>
            <p>• Lucro líquido estimado</p>
            <p>• Sugestão de preço por IA</p>
          </div>
          <p className="text-xs mt-4">Em desenvolvimento...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceCalculator;
