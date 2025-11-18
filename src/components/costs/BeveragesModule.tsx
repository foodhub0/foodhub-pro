import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wine } from "lucide-react";

const BeveragesModule = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wine className="h-5 w-5" />
          <div>
            <CardTitle>Bebidas</CardTitle>
            <CardDescription>
              Gerencie o cardápio de bebidas com custos e preços
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <Wine className="mx-auto h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">Módulo de Bebidas</p>
          <p className="text-sm">
            Cadastre refrigerantes, sucos, cervejas e outras bebidas
          </p>
          <p className="text-xs mt-4">Em desenvolvimento...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BeveragesModule;
