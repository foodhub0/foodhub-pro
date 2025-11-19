import { ReactNode } from 'react';
import { usePermissions } from '@/contexts/PermissionsContext';

interface PermissionGuardProps {
  children: ReactNode;
  action: string;
  resource: string;
  fallback?: ReactNode;
}

export const PermissionGuard = ({ children, action, resource, fallback }: PermissionGuardProps) => {
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  const hasPermission = can(action, resource);

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
};

// Componente auxiliar para verificar múltiplas permissões (qualquer uma)
interface PermissionAnyGuardProps {
  children: ReactNode;
  actions: string[];
  resource: string;
  fallback?: ReactNode;
}

export const PermissionAnyGuard = ({ children, actions, resource, fallback }: PermissionAnyGuardProps) => {
  const { canAny, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  const hasPermission = canAny(actions, resource);

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
};

// Componente auxiliar para verificar múltiplas permissões (todas)
interface PermissionAllGuardProps {
  children: ReactNode;
  actions: string[];
  resource: string;
  fallback?: ReactNode;
}

export const PermissionAllGuard = ({ children, actions, resource, fallback }: PermissionAllGuardProps) => {
  const { canAll, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  const hasPermission = canAll(actions, resource);

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
};

export default PermissionGuard;
