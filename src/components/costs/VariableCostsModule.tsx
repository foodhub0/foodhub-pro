import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const VariableCostsModule = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <div>
            <CardTitle>Custos Variáveis</CardTitle>
            <CardDescription>
              Registre custos variáveis como embalagens, delivery e taxas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="mx-auto h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">Módulo de Custos Variáveis</p>
          <p className="text-sm">
            Controle embalagens, taxas de plataforma, gasolina e outros custos variáveis
          </p>
          <p className="text-xs mt-4">Em desenvolvimento...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VariableCostsModule;
