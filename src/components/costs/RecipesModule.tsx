import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";

const RecipesModule = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5" />
          <div>
            <CardTitle>Receitas / Fichas Técnicas</CardTitle>
            <CardDescription>
              Monte as receitas dos seus produtos vinculando insumos e calculando custos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <UtensilsCrossed className="mx-auto h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">Módulo de Receitas</p>
          <p className="text-sm">
            Vincule ingredientes aos seus produtos e calcule o custo real de produção
          </p>
          <p className="text-xs mt-4">Em desenvolvimento...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipesModule;
