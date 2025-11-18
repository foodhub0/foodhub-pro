import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

const FixedCostsModule = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          <div>
            <CardTitle>Custos Fixos</CardTitle>
            <CardDescription>
              Gerencie despesas fixas mensais como aluguel, salários e contas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <DollarSign className="mx-auto h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">Módulo de Custos Fixos</p>
          <p className="text-sm">
            Controle aluguel, salários, energia, água e outros custos recorrentes
          </p>
          <p className="text-xs mt-4">Em desenvolvimento...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FixedCostsModule;
