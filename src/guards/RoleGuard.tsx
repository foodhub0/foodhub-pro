import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoleGuardProps {
  children: ReactNode;
  roles: string[]; // Lista de roles permitidos: ['owner', 'manager']
  fallback?: ReactNode;
  redirectTo?: string;
}

export const RoleGuard = ({ children, roles, fallback, redirectTo = '/dashboard' }: RoleGuardProps) => {
  const { role, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/auth" replace />;
  }

  const hasAccess = roles.includes(role.name);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-red-100 p-3 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground mb-6">
                Você não tem permissão para acessar esta página.
                <br />
                Seu perfil atual: <strong>{role.display_name}</strong>
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

export default RoleGuard;
