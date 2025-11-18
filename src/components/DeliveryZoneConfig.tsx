import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface DeliveryZone {
  id: string;
  radius: number; // em km
  fee: number; // taxa em R$
}

interface DeliveryZoneConfigProps {
  zones: DeliveryZone[];
  onChange: (zones: DeliveryZone[]) => void;
  restaurantAddress?: string;
}

export const DeliveryZoneConfig = ({ zones, onChange, restaurantAddress }: DeliveryZoneConfigProps) => {
  const { toast } = useToast();
  const [newZone, setNewZone] = useState({ radius: '', fee: '' });

  const handleAddZone = () => {
    const radius = parseFloat(newZone.radius);
    const fee = parseFloat(newZone.fee);

    if (!radius || radius <= 0) {
      toast({
        title: 'Raio inválido',
        description: 'Por favor, insira um raio válido em km',
        variant: 'destructive',
      });
      return;
    }

    if (fee < 0) {
      toast({
        title: 'Taxa inválida',
        description: 'Por favor, insira uma taxa válida',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se já existe uma zona com o mesmo raio
    if (zones.some(z => z.radius === radius)) {
      toast({
        title: 'Zona duplicada',
        description: 'Já existe uma zona com este raio',
        variant: 'destructive',
      });
      return;
    }

    const updatedZones = [...zones, {
      id: Date.now().toString(),
      radius,
      fee,
    }].sort((a, b) => a.radius - b.radius); // Ordenar por raio

    onChange(updatedZones);
    setNewZone({ radius: '', fee: '' });

    toast({
      title: 'Zona adicionada!',
      description: `Zona de ${radius}km com taxa de R$ ${fee.toFixed(2)}`,
    });
  };

  const handleRemoveZone = (id: string) => {
    onChange(zones.filter(z => z.id !== id));
    toast({
      title: 'Zona removida',
      description: 'A zona de entrega foi removida',
    });
  };

  return (
    <div className="space-y-4">
      {/* Info sobre localização */}
      {restaurantAddress && (
        <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
          <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Endereço de origem</p>
            <p className="text-sm text-muted-foreground">{restaurantAddress}</p>
            <p className="text-xs text-muted-foreground mt-1">
              As zonas de entrega serão calculadas a partir deste endereço
            </p>
          </div>
        </div>
      )}

      {/* Lista de zonas existentes */}
      {zones.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Zonas de Entrega Configuradas</Label>
          <div className="space-y-2">
            {zones.map((zone) => (
              <Card key={zone.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-primary/10 rounded-full p-2">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Até {zone.radius} km
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Taxa de entrega: R$ {zone.fee.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveZone(zone.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Adicionar nova zona */}
      <div className="space-y-3 border-t pt-4">
        <Label className="text-sm font-semibold">Adicionar Nova Zona</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="zone-radius" className="text-xs">
              Raio (km)
            </Label>
            <Input
              id="zone-radius"
              type="number"
              step="0.5"
              min="0.5"
              placeholder="Ex: 3"
              value={newZone.radius}
              onChange={(e) => setNewZone({ ...newZone, radius: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zone-fee" className="text-xs">
              Taxa (R$)
            </Label>
            <Input
              id="zone-fee"
              type="number"
              step="0.50"
              min="0"
              placeholder="Ex: 5.00"
              value={newZone.fee}
              onChange={(e) => setNewZone({ ...newZone, fee: e.target.value })}
              className="h-9"
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={handleAddZone}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Zona
        </Button>
      </div>

      {/* Exemplos e explicação */}
      <div className="bg-muted p-3 rounded-lg space-y-2">
        <p className="text-xs font-semibold text-foreground">Como funciona:</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Configure múltiplas zonas com diferentes raios e taxas</li>
          <li>Ex: Até 3km = R$ 5,00 | De 3km a 5km = R$ 8,00</li>
          <li>A taxa será calculada automaticamente com base na distância do cliente</li>
          <li>As zonas devem estar em ordem crescente de distância</li>
        </ul>
      </div>
    </div>
  );
};
