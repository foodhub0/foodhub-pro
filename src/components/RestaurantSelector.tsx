import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBrand } from "@/contexts/BrandContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { Store, Building2 } from "lucide-react";

export const RestaurantSelector = () => {
  const { restaurants, currentRestaurant, switchRestaurant, getAllRestaurantsView } = useBrand();
  const { isOwner } = usePermissions();

  // Se não for owner, não mostrar seletor
  if (!isOwner()) {
    if (currentRestaurant) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md text-sm">
          <Store className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{currentRestaurant.name}</span>
          <span className="text-xs text-muted-foreground">
            (Unidade {currentRestaurant.restaurant_index})
          </span>
        </div>
      );
    }
    return null;
  }

  // Owner sem restaurantes
  if (restaurants.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
        <Store className="h-4 w-4" />
        <span>Nenhum restaurante</span>
      </div>
    );
  }

  // Owner com apenas 1 restaurante - não precisa mostrar seletor
  if (restaurants.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md text-sm">
        <Store className="h-4 w-4 text-primary" />
        <span className="font-medium">{restaurants[0].name}</span>
      </div>
    );
  }

  const handleChange = (value: string) => {
    if (value === '__all__') {
      switchRestaurant(null);
    } else {
      switchRestaurant(value);
    }
  };

  const currentValue = getAllRestaurantsView
    ? '__all__'
    : currentRestaurant?.id || restaurants[0]?.id;

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className="w-[280px] bg-card">
        <div className="flex items-center gap-2">
          {getAllRestaurantsView ? (
            <Building2 className="h-4 w-4 text-primary" />
          ) : (
            <Store className="h-4 w-4 text-primary" />
          )}
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Visualização</SelectLabel>
          <SelectItem value="__all__">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="font-semibold">Todas as Unidades</span>
            </div>
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Restaurantes ({restaurants.length})</SelectLabel>
          {restaurants.map((restaurant) => (
            <SelectItem key={restaurant.id} value={restaurant.id}>
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span>{restaurant.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  Unidade {restaurant.restaurant_index}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default RestaurantSelector;
