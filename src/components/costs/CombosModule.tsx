import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid3x3 } from "lucide-react";

const CombosModule = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5" />
          <div>
            <CardTitle>Combos e Promoções</CardTitle>
            <CardDescription>
              Crie combos promocionais com cálculo automático de custo e margem
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <Grid3x3 className="mx-auto h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">Módulo de Combos</p>
          <p className="text-sm">
            Monte combos inteligentes com produtos, bebidas e adicionais
          </p>
          <p className="text-xs mt-4">Em desenvolvimento...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CombosModule;
