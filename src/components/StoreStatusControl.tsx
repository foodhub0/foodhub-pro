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
      title: newIsOpen ? "🟢 Loja Aberta!" : "🔴 Loja Fechada",
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
    toast({
      title: "✓ Prazo de entrega atualizado",
      description: `Agora é ${minutes} minutos`,
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
        title: "Erro ao atualizar prazo",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setPickupTime(minutes);
    toast({
      title: "✓ Prazo de retirada atualizado",
      description: `Agora é ${minutes} minutos`,
    });
    setLoading(false);
  };

  if (!restaurantId) return null;

  return (
    <Card
      className={cn(
        "mx-3 my-3 border-2 shadow-md transition-all duration-300",
        !sidebarOpen && "lg:mx-2",
        isOpen
          ? "bg-gradient-to-br from-emerald-50 via-green-50 to-white border-emerald-200"
          : "bg-gradient-to-br from-gray-50 via-slate-50 to-white border-gray-300"
      )}
    >
      {sidebarOpen ? (
        <div className="p-4 space-y-4">
          {/* Status da Loja - Destaque */}
          <div className={cn(
            "rounded-xl p-4 transition-all duration-300",
            isOpen
              ? "bg-white/80 border-2 border-emerald-200 shadow-sm"
              : "bg-white/60 border-2 border-gray-200"
          )}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2.5 rounded-xl transition-all duration-300",
                  isOpen
                    ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                    : "bg-gray-400 shadow-md"
                )}>
                  <Store className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Label htmlFor="store-status" className="text-sm font-bold text-gray-900 cursor-pointer block">
                    Status da Loja
                  </Label>
                  <p className={cn(
                    "text-xs font-semibold transition-colors",
                    isOpen ? "text-emerald-600" : "text-gray-500"
                  )}>
                    {isOpen ? "● Aberta" : "● Fechada"}
                  </p>
                </div>
              </div>
              <Switch
                id="store-status"
                checked={isOpen}
                onCheckedChange={updateStoreStatus}
                disabled={loading}
                className={cn(
                  "data-[state=checked]:bg-emerald-500",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {isOpen
                ? "Clientes podem fazer pedidos normalmente"
                : "Pedidos estão bloqueados no cardápio"}
            </p>
          </div>

          {/* Prazos */}
          <div className="grid grid-cols-2 gap-3">
            {/* Prazo de Entrega */}
            <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
              <Label htmlFor="delivery-time" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                <div className="p-1 bg-blue-100 rounded">
                  <Bike className="h-3 w-3 text-blue-600" />
                </div>
                Entrega
              </Label>
              <div className="flex items-center gap-1">
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
                  className="h-9 text-center font-bold text-blue-600 bg-blue-50 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                />
                <span className="text-xs font-medium text-gray-500">min</span>
              </div>
            </div>

            {/* Prazo de Retirada */}
            <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
              <Label htmlFor="pickup-time" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                <div className="p-1 bg-purple-100 rounded">
                  <Clock className="h-3 w-3 text-purple-600" />
                </div>
                Retirada
              </Label>
              <div className="flex items-center gap-1">
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
                  className="h-9 text-center font-bold text-purple-600 bg-purple-50 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                />
                <span className="text-xs font-medium text-gray-500">min</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Versão compacta para sidebar fechada
        <div className="flex flex-col items-center gap-3 py-3">
          <div className="relative">
            <div className={cn(
              "p-2 rounded-lg transition-all duration-300",
              isOpen
                ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                : "bg-gray-400 shadow-md"
            )}>
              <Store className="h-5 w-5 text-white" />
            </div>
            <div className={cn(
              "absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white",
              isOpen ? "bg-emerald-500" : "bg-gray-400"
            )} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-0.5 bg-blue-100 rounded px-1.5 py-1">
              <Bike className="h-3 w-3 text-blue-600" />
              <span className="text-[10px] font-bold text-blue-600">{deliveryTime}</span>
            </div>
            <div className="flex items-center gap-0.5 bg-purple-100 rounded px-1.5 py-1">
              <Clock className="h-3 w-3 text-purple-600" />
              <span className="text-[10px] font-bold text-purple-600">{pickupTime}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default StoreStatusControl;
