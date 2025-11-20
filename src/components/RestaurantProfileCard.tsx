import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Copy, ChevronDown, Truck, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

interface RestaurantProfileCardProps {
  restaurantId: string | null;
  sidebarOpen: boolean;
}

export const RestaurantProfileCard = ({
  restaurantId,
  sidebarOpen,
}: RestaurantProfileCardProps) => {
  const { toast } = useToast();
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Restaurant data
  const [name, setName] = useState("Seu Restaurante");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState(30);
  const [pickupTime, setPickupTime] = useState(20);

  useEffect(() => {
    if (restaurantId) {
      loadRestaurantData();
    }
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    if (!restaurantId) return;

    const { data, error } = await supabase
      .from("restaurants")
      .select("name, slug, logo_url, is_open, delivery_time_estimate, pickup_time_estimate")
      .eq("id", restaurantId)
      .single();

    if (error) {
      console.error("Error loading restaurant:", error);
      return;
    }

    if (data) {
      setName(data.name || "Seu Restaurante");
      setSlug(data.slug || "");
      setLogoUrl(data.logo_url);
      setIsOpen(data.is_open ?? true);
      setDeliveryTime(data.delivery_time_estimate ?? 30);
      setPickupTime(data.pickup_time_estimate ?? 20);
    }
  };

  const menuLink = slug ? `${window.location.origin}/m/${slug}` : "";

  const copyLink = () => {
    if (!menuLink) {
      toast({
        title: "Erro",
        description: "Configure o slug do restaurante primeiro",
        variant: "destructive",
      });
      return;
    }

    navigator.clipboard.writeText(menuLink);
    toast({
      title: "Link copiado!",
      description: "O link do cardápio foi copiado",
    });
  };

  const handleToggleStatus = async (checked: boolean) => {
    if (!restaurantId || loading) return;

    setLoading(true);
    const { error } = await supabase
      .from("restaurants")
      .update({ is_open: checked })
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

    setIsOpen(checked);
    toast({
      title: checked ? "Loja aberta" : "Loja fechada",
      description: checked
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

  // Versão compacta para sidebar fechada
  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center gap-2 py-3 px-2">
        <div
          className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white overflow-hidden"
          style={{ fontFamily: "'Kaushan Script', cursive" }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs leading-tight text-center">
              Sua
              <br />
              Marca
            </span>
          )}
        </div>
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"
          )}
        ></div>
        <div className="text-[10px] font-medium text-gray-600 text-center">
          <div>{deliveryTime}'</div>
          <div>{pickupTime}'</div>
        </div>
      </div>
    );
  }

  // Versão completa
  return (
    <Card className="mx-3 my-3 rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-4">
      {/* Header: Logo e Informações */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-3">
          {/* Logo */}
          <div
            className="w-[60px] h-[60px] bg-primary rounded-full flex items-center justify-center text-white shrink-0 overflow-hidden"
            style={{ fontFamily: "'Kaushan Script', cursive" }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-base leading-tight text-center">
                Sua
                <br />
                Marca
              </span>
            )}
          </div>

          {/* Nome e Link */}
          <div className="flex flex-col justify-center">
            <h1 className="text-gray-800 text-base font-medium mb-1 line-clamp-1">
              {name}
            </h1>

            <button
              onClick={copyLink}
              disabled={!slug}
              className="group flex items-center gap-1.5 text-primary text-xs hover:opacity-80 transition-opacity w-fit disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy className="w-3 h-3" />
              <span className="font-medium">Copiar link</span>
            </button>
          </div>
        </div>

        {/* Toggle Ativado/Desativado */}
        <div className="flex flex-col items-end gap-1">
          <div className="relative inline-block w-11 align-middle select-none transition duration-200 ease-in">
            <input
              type="checkbox"
              id="status-toggle"
              checked={isOpen}
              onChange={(e) => handleToggleStatus(e.target.checked)}
              disabled={loading}
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 ease-in-out top-0 left-0 border-gray-300 checked:left-5 checked:border-green-500 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label
              htmlFor="status-toggle"
              className={cn(
                "block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300",
                isOpen ? "bg-green-500" : "bg-gray-300",
                loading && "opacity-50"
              )}
            ></label>
          </div>
          <span
            className={cn(
              "text-xs mt-1",
              isOpen ? "text-gray-500" : "text-red-500"
            )}
          >
            {isOpen ? "Aberto" : "Fechado"}
          </span>
        </div>
      </div>

      {/* Secção de Status e Prazos */}
      <div className="bg-gray-50 rounded-xl p-3 space-y-3">
        {/* Cabeçalho da Secção */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"
              )}
            ></div>
            <span
              className={cn(
                "text-xs font-medium",
                isOpen ? "text-green-600" : "text-red-600"
              )}
            >
              {isOpen ? "Aberto agora" : "Fechado"}
            </span>
          </div>

          <button
            onClick={() => setHoursExpanded(!hoursExpanded)}
            className="flex items-center gap-1 text-primary text-xs font-medium hover:opacity-80"
          >
            <span>{hoursExpanded ? "Fechar" : "Ver horários"}</span>
            <ChevronDown
              className={cn(
                "w-3 h-3 transition-transform duration-300",
                hoursExpanded ? "rotate-180" : "rotate-0"
              )}
            />
          </button>
        </div>

        {/* Prazos */}
        <div className="space-y-2">
          {/* Entrega */}
          <div className="flex items-center gap-2">
            <Truck className="h-3 w-3 text-gray-600 flex-shrink-0" />
            <span className="text-xs text-gray-600 flex-1">Entrega</span>
            <Input
              type="number"
              min="1"
              max="999"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(parseInt(e.target.value) || 0)}
              onBlur={(e) => updateDeliveryTime(parseInt(e.target.value) || 30)}
              disabled={loading}
              className="w-14 h-6 text-center text-xs"
            />
            <span className="text-xs text-gray-500">min</span>
          </div>

          {/* Retirada */}
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-gray-600 flex-shrink-0" />
            <span className="text-xs text-gray-600 flex-1">Retirada</span>
            <Input
              type="number"
              min="1"
              max="999"
              value={pickupTime}
              onChange={(e) => setPickupTime(parseInt(e.target.value) || 0)}
              onBlur={(e) => updatePickupTime(parseInt(e.target.value) || 20)}
              disabled={loading}
              className="w-14 h-6 text-center text-xs"
            />
            <span className="text-xs text-gray-500">min</span>
          </div>
        </div>

        {/* Conteúdo dos Horários */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            hoursExpanded ? "max-h-[200px] opacity-100 mt-3 pt-3 border-t" : "max-h-0 opacity-0"
          )}
        >
          <h3 className="text-gray-700 font-medium text-xs mb-2">
            Horários de funcionamento
          </h3>

          <div className="space-y-2 text-gray-600 text-xs">
            <div>
              <p className="text-gray-800 mb-0.5 font-medium">Segunda a Sábado</p>
              <p>00:00 às 23:59</p>
            </div>
            <div>
              <p className="text-gray-800 mb-0.5 font-medium">Domingo</p>
              <p>00:00 às 23:59</p>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Kaushan+Script&display=swap');
        `}
      </style>
    </Card>
  );
};
