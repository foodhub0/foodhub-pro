import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useBrand } from '@/contexts/BrandContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RestaurantGuardProps {
  children: ReactNode;
  requireRestaurant?: boolean; // Se true, força ter um restaurante selecionado
  fallback?: ReactNode;
}

export const RestaurantGuard = ({
  children,
  requireRestaurant = true,
  fallback
}: RestaurantGuardProps) => {
  const { currentRestaurant, isLoading, getAllRestaurantsView } = useBrand();
  const { isOwner } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se está na visão de "Todas as Unidades" e não é owner, bloquear
  if (getAllRestaurantsView && !isOwner()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se requer restaurante selecionado e não tem
  if (requireRestaurant && !currentRestaurant && !getAllRestaurantsView) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-yellow-100 p-3 mb-4">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Restaurante Não Selecionado</h2>
              <p className="text-muted-foreground mb-6">
                Você precisa selecionar um restaurante para acessar esta página.
              </p>
              <Button onClick={() => window.history.back()}>
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default RestaurantGuard;
