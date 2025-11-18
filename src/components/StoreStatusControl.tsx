import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Store, Clock, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoreStatusControlProps {
  restaurantId: string | null;
  sidebarOpen: boolean;
}

const StoreStatusControl = ({ restaurantId, sidebarOpen }: StoreStatusControlProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState(30);
  const [pickupTime, setPickupTime] = useState(20);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      loadStoreStatus();
    }
  }, [restaurantId]);

  const loadStoreStatus = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from("restaurants")
      .select("is_open, delivery_time_estimate, pickup_time_estimate")
      .eq("id", restaurantId)
      .single();

    if (error) {
      console.error("Error loading store status:", error);
      return;
    }

    if (data) {
      setIsOpen(data.is_open ?? true);
      setDeliveryTime(data.delivery_time_estimate ?? 30);
      setPickupTime(data.pickup_time_estimate ?? 20);
    }
  };

  const updateStoreStatus = async (newIsOpen: boolean) => {
    if (!restaurantId || loading) return;

    setLoading(true);
    const { error } = await supabase
      .from("restaurants")
      .update({ is_open: newIsOpen })
      .eq("id", restaurantId);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setIsOpen(newIsOpen);
    toast({
      title: newIsOpen ? "Loja aberta" : "Loja fechada",
      description: newIsOpen
        ? "Cardápio disponível para pedidos"
        : "Pedidos bloqueados",
    });
    setLoading(false);
  };

  const updateDeliveryTime = async (minutes: number) => {
    if (!restaurantId || loading || minutes < 1 || minutes > 999) return;

    setLoading(true);
    const { error } = await supabase
      .from("restaurants")
      .update({ delivery_time_estimate: minutes })
      .eq("id", restaurantId);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setDeliveryTime(minutes);
    toast({
      title: "Atualizado",
      description: `Prazo de entrega: ${minutes} min`,
    });
    setLoading(false);
  };

  const updatePickupTime = async (minutes: number) => {
    if (!restaurantId || loading || minutes < 1 || minutes > 999) return;

    setLoading(true);
    const { error } = await supabase
      .from("restaurants")
      .update({ pickup_time_estimate: minutes })
      .eq("id", restaurantId);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setPickupTime(minutes);
    toast({
      title: "Atualizado",
      description: `Prazo de retirada: ${minutes} min`,
    });
    setLoading(false);
  };

  if (!restaurantId) return null;

  return (
    <Card
      className={cn(
        "mx-3 my-3 border shadow-sm transition-all duration-200",
        !sidebarOpen && "lg:mx-2",
        isOpen
          ? "bg-white border-slate-200"
          : "bg-slate-50 border-slate-300"
      )}
    >
      {sidebarOpen ? (
        <div className="p-4 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "p-1.5 rounded-md",
                isOpen ? "bg-slate-900" : "bg-slate-400"
              )}>
                <Store className="h-4 w-4 text-white" />
              </div>
              <div>
                <Label htmlFor="store-status" className="text-sm font-medium text-slate-900 cursor-pointer">
                  Status
                </Label>
                <p className="text-xs text-slate-500">
                  {isOpen ? "Aberta" : "Fechada"}
                </p>
              </div>
            </div>
            <Switch
              id="store-status"
              checked={isOpen}
              onCheckedChange={updateStoreStatus}
              disabled={loading}
              className="data-[state=checked]:bg-slate-900"
            />
          </div>

          {/* Prazos */}
          <div className="pt-3 border-t space-y-3">
            {/* Entrega */}
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 text-slate-600 flex-shrink-0" />
              <div className="flex-1">
                <Label htmlFor="delivery-time" className="text-xs text-slate-600">
                  Entrega (min)
                </Label>
              </div>
              <Input
                id="delivery-time"
                type="number"
                min="1"
                max="999"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(parseInt(e.target.value) || 0)}
                onBlur={(e) => updateDeliveryTime(parseInt(e.target.value) || 30)}
                disabled={loading}
                className="w-16 h-8 text-center text-sm"
              />
            </div>

            {/* Retirada */}
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-slate-600 flex-shrink-0" />
              <div className="flex-1">
                <Label htmlFor="pickup-time" className="text-xs text-slate-600">
                  Retirada (min)
                </Label>
              </div>
              <Input
                id="pickup-time"
                type="number"
                min="1"
                max="999"
                value={pickupTime}
                onChange={(e) => setPickupTime(parseInt(e.target.value) || 0)}
                onBlur={(e) => updatePickupTime(parseInt(e.target.value) || 20)}
                disabled={loading}
                className="w-16 h-8 text-center text-sm"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Versão compacta */
        <div className="flex flex-col items-center gap-2 py-3">
          <div className={cn(
            "p-1.5 rounded-md",
            isOpen ? "bg-slate-900" : "bg-slate-400"
          )}>
            <Store className="h-4 w-4 text-white" />
          </div>
          <div className="text-[10px] font-medium text-slate-600">
            <div>{deliveryTime}'</div>
            <div>{pickupTime}'</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default StoreStatusControl;
