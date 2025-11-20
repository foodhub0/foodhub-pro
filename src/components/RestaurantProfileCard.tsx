import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Copy, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RestaurantProfileCardProps {
  name: string;
  slug: string;
  logoUrl?: string | null;
  isOpen: boolean;
  openingHours?: {
    weekdays?: string;
    weekend?: string;
  };
  onToggleStatus?: (status: boolean) => void;
}

export const RestaurantProfileCard = ({
  name,
  slug,
  logoUrl,
  isOpen,
  openingHours = {
    weekdays: "00:00 às 23:59",
    weekend: "00:00 às 23:59",
  },
  onToggleStatus,
}: RestaurantProfileCardProps) => {
  const { toast } = useToast();
  const [hoursExpanded, setHoursExpanded] = useState(true);
  const [restaurantStatus, setRestaurantStatus] = useState(isOpen);

  const menuLink = `${window.location.origin}/m/${slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(menuLink);
    toast({
      title: "Link copiado!",
      description: "O link do cardápio foi copiado para a área de transferência",
    });
  };

  const handleToggleStatus = (checked: boolean) => {
    setRestaurantStatus(checked);
    onToggleStatus?.(checked);
  };

  return (
    <Card className="w-full max-w-[400px] rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-5">
      {/* Header: Logo e Informações */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex gap-4">
          {/* Logo */}
          <div
            className="w-[72px] h-[72px] bg-primary rounded-full flex items-center justify-center text-white shrink-0 overflow-hidden"
            style={{
              fontFamily: "'Kaushan Script', cursive",
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl leading-tight text-center">
                Sua
                <br />
                Marca
              </span>
            )}
          </div>

          {/* Nome e Link */}
          <div className="flex flex-col pt-1">
            <h1 className="text-gray-800 text-lg font-medium mb-1">{name}</h1>

            <button
              onClick={copyLink}
              className="group flex items-center gap-1.5 text-primary text-sm hover:opacity-80 transition-opacity w-fit"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="font-medium">Copiar link</span>
            </button>
          </div>
        </div>

        {/* Toggle Ativado/Desativado */}
        <div className="flex flex-col items-end gap-1">
          <div className="relative inline-block w-11 mr-2 align-middle select-none transition duration-200 ease-in">
            <input
              type="checkbox"
              id="status-toggle"
              checked={restaurantStatus}
              onChange={(e) => handleToggleStatus(e.target.checked)}
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 ease-in-out top-0 left-0 border-gray-300 checked:left-5 checked:border-green-500 z-10"
            />
            <label
              htmlFor="status-toggle"
              className={cn(
                "block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300",
                restaurantStatus ? "bg-green-500" : "bg-gray-300"
              )}
            ></label>
          </div>
          <span
            className={cn(
              "text-xs mr-2 mt-1",
              restaurantStatus ? "text-gray-500" : "text-red-500"
            )}
          >
            {restaurantStatus ? "Ativado" : "Desativado"}
          </span>
        </div>
      </div>

      {/* Secção de Horários */}
      <div className="bg-gray-50 rounded-xl p-4 transition-all duration-300">
        {/* Cabeçalho da Secção */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                restaurantStatus ? "bg-green-500 animate-pulse" : "bg-red-500"
              )}
            ></div>
            <span
              className={cn(
                "text-sm font-medium",
                restaurantStatus ? "text-green-600" : "text-red-600"
              )}
            >
              {restaurantStatus ? "Aberto agora" : "Fechado"}
            </span>
          </div>

          <button
            onClick={() => setHoursExpanded(!hoursExpanded)}
            className="flex items-center gap-1 text-primary text-sm font-medium hover:opacity-80"
          >
            <span>{hoursExpanded ? "Fechar" : "Ver horários"}</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-300",
                hoursExpanded ? "rotate-180" : "rotate-0"
              )}
            />
          </button>
        </div>

        {/* Conteúdo dos Horários */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            hoursExpanded ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <h3 className="text-gray-700 font-medium mb-3">
            Horários de funcionamento
          </h3>

          <div className="space-y-3 text-gray-600 text-[15px]">
            <div>
              <p className="text-gray-800 mb-0.5">Segunda a Sábado</p>
              <p>{openingHours.weekdays}</p>
            </div>
            <div>
              <p className="text-gray-800 mb-0.5">Domingo</p>
              <p>{openingHours.weekend}</p>
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
