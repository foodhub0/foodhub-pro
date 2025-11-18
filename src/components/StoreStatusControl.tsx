import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Store, Clock, Bike } from "lucide-react";
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
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setIsOpen(newIsOpen);
    toast({
      title: newIsOpen ? "Loja aberta!" : "Loja fechada",
      description: newIsOpen
        ? "Seu cardápio está disponível para pedidos"
        : "Novos pedidos estão bloqueados",
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
        title: "Erro ao atualizar prazo",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setDeliveryTime(minutes);
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
        title: "Erro ao atualizar prazo",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setPickupTime(minutes);
    setLoading(false);
  };

  if (!restaurantId) return null;

  return (
    <Card
      className={cn(
        "mx-3 my-3 p-3 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 shadow-sm",
        !sidebarOpen && "lg:mx-2 lg:p-2"
      )}
    >
      {sidebarOpen ? (
        <div className="space-y-3">
          {/* Status da Loja */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className={cn(
                "h-4 w-4",
                isOpen ? "text-green-600" : "text-gray-400"
              )} />
              <Label htmlFor="store-status" className="text-sm font-semibold text-gray-700 cursor-pointer">
                Loja {isOpen ? "Aberta" : "Fechada"}
              </Label>
            </div>
            <Switch
              id="store-status"
              checked={isOpen}
              onCheckedChange={updateStoreStatus}
              disabled={loading}
              className={cn(
                "data-[state=checked]:bg-green-600",
                loading && "opacity-50 cursor-not-allowed"
              )}
            />
          </div>

          {/* Prazo de Entrega */}
          <div className="space-y-1">
            <Label htmlFor="delivery-time" className="text-xs text-gray-600 flex items-center gap-1">
              <Bike className="h-3 w-3" />
              Entrega (min)
            </Label>
            <Input
              id="delivery-time"
              type="number"
              min="1"
              max="999"
              value={deliveryTime}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setDeliveryTime(value);
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 30;
                updateDeliveryTime(value);
              }}
              disabled={loading}
              className="h-8 text-sm bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>

          {/* Prazo de Retirada */}
          <div className="space-y-1">
            <Label htmlFor="pickup-time" className="text-xs text-gray-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Retirada (min)
            </Label>
            <Input
              id="pickup-time"
              type="number"
              min="1"
              max="999"
              value={pickupTime}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setPickupTime(value);
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 20;
                updatePickupTime(value);
              }}
              disabled={loading}
              className="h-8 text-sm bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>
        </div>
      ) : (
        // Versão compacta para sidebar fechada
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <Store className={cn(
              "h-5 w-5",
              isOpen ? "text-green-600" : "text-gray-400"
            )} />
            <div className={cn(
              "absolute -top-1 -right-1 h-2 w-2 rounded-full",
              isOpen ? "bg-green-600" : "bg-gray-400"
            )} />
          </div>
        </div>
      )}
    </Card>
  );
};

export default StoreStatusControl;
