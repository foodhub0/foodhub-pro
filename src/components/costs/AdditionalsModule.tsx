import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

const AdditionalsModule = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          <div>
            <CardTitle>Adicionais</CardTitle>
            <CardDescription>
              Configure adicionais, extras e complementos com custos e preços
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <Plus className="mx-auto h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">Módulo de Adicionais</p>
          <p className="text-sm">
            Gerencie bordas, coberturas, extras e outros adicionais do seu negócio
          </p>
          <p className="text-xs mt-4">Em desenvolvimento...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdditionalsModule;
