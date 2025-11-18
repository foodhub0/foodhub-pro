import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ruler } from "lucide-react";

const SizesModule = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
          <div>
            <CardTitle>Tamanhos / Unidades</CardTitle>
            <CardDescription>
              Gerencie os tamanhos e variações dos seus produtos (P, M, G, etc.)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <Ruler className="mx-auto h-16 w-16 mb-4 opacity-20" />
          <p className="text-lg font-medium mb-2">Módulo de Tamanhos</p>
          <p className="text-sm">
            Este módulo será adaptado automaticamente ao tipo do seu negócio
          </p>
          <p className="text-xs mt-4">Em desenvolvimento...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SizesModule;
