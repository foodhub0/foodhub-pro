import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  level: number;
  color: string | null;
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  display_name: string;
  description: string | null;
  category: string | null;
}

interface RolePermission {
  permission_id: string;
  granted: boolean;
}

interface UserPermissionOverride {
  permission_id: string;
  granted: boolean;
}

interface PermissionsContextType {
  role: Role | null;
  permissions: string[]; // Array de "resource:action"
  isLoading: boolean;
  can: (action: string, resource: string) => boolean;
  canAny: (actions: string[], resource: string) => boolean;
  canAll: (actions: string[], resource: string) => boolean;
  isOwner: () => boolean;
  isManager: () => boolean;
  isFinancial: () => boolean;
  isMarketing: () => boolean;
  isWaiter: () => boolean;
  isReception: () => boolean;
  isCashier: () => boolean;
  isKitchen: () => boolean;
  hasRole: (roleName: string) => boolean;
  hasMinimumLevel: (level: number) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider = ({ children }: PermissionsProviderProps) => {
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      const metadata = user.user_metadata || {};
      let roleId = metadata.role_id;
      const roleName = metadata.role_name;

      console.log('[PermissionsContext] User metadata:', metadata);
      console.log('[PermissionsContext] role_id:', roleId, 'role_name:', roleName);

      // Se não tem role_id mas tem role_name, buscar role_id pelo nome
      if (!roleId && roleName) {
        console.log('[PermissionsContext] No role_id, fetching by role_name:', roleName);
        const { data: roleByName } = await supabase
          .from('roles')
          .select('id')
          .eq('name', roleName)
          .single();

        if (roleByName) {
          roleId = roleByName.id;
          console.log('[PermissionsContext] Found role_id:', roleId);

          // Atualizar metadata com role_id
          await supabase.auth.updateUser({
            data: {
              ...metadata,
              role_id: roleId,
            }
          });
        }
      }

      if (!roleId) {
        console.log('[PermissionsContext] No role found for user');
        setRole(null);
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      // Carregar role do usuário
      const { data: roleData } = await supabase
        .from('roles')
        .select('*')
        .eq('id', roleId)
        .single();

      if (roleData) {
        setRole(roleData);
      }

      // Carregar permissões do role
      const { data: rolePermissionsData } = await supabase
        .from('role_permissions')
        .select(`
          permission_id,
          granted,
          permissions (
            resource,
            action
          )
        `)
        .eq('role_id', roleId)
        .eq('granted', true);

      // Carregar overrides do usuário
      const { data: userOverridesData } = await supabase
        .from('user_permission_overrides')
        .select(`
          permission_id,
          granted,
          permissions (
            resource,
            action
          )
        `)
        .eq('user_id', user.id);

      // Montar lista de permissões
      const permissionsList: string[] = [];
      const overridesMap = new Map<string, boolean>();

      // Processar overrides
      if (userOverridesData) {
        userOverridesData.forEach((override: any) => {
          if (override.permissions) {
            const key = `${override.permissions.resource}:${override.permissions.action}`;
            overridesMap.set(override.permission_id, override.granted);

            if (override.granted) {
              permissionsList.push(key);
            }
          }
        });
      }

      // Processar permissões do role (se não tiver override)
      if (rolePermissionsData) {
        rolePermissionsData.forEach((rp: any) => {
          if (!overridesMap.has(rp.permission_id) && rp.permissions) {
            const key = `${rp.permissions.resource}:${rp.permissions.action}`;
            permissionsList.push(key);
          }
        });
      }

      setPermissions(permissionsList);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setRole(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadPermissions();
      } else if (event === 'SIGNED_OUT') {
        setRole(null);
        setPermissions([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Verificar se tem uma permissão específica
  const can = (action: string, resource: string): boolean => {
    const permissionKey = `${resource}:${action}`;
    return permissions.includes(permissionKey);
  };

  // Verificar se tem pelo menos uma das permissões
  const canAny = (actions: string[], resource: string): boolean => {
    return actions.some(action => can(action, resource));
  };

  // Verificar se tem todas as permissões
  const canAll = (actions: string[], resource: string): boolean => {
    return actions.every(action => can(action, resource));
  };

  // Helpers de role
  const isOwner = (): boolean => role?.name === 'owner';
  const isManager = (): boolean => role?.name === 'manager';
  const isFinancial = (): boolean => role?.name === 'financial';
  const isMarketing = (): boolean => role?.name === 'marketing';
  const isWaiter = (): boolean => role?.name === 'waiter';
  const isReception = (): boolean => role?.name === 'reception';
  const isCashier = (): boolean => role?.name === 'cashier';
  const isKitchen = (): boolean => role?.name === 'kitchen';

  const hasRole = (roleName: string): boolean => role?.name === roleName;

  const hasMinimumLevel = (level: number): boolean => {
    return role ? role.level >= level : false;
  };

  const refreshPermissions = async () => {
    await loadPermissions();
  };

  return (
    <PermissionsContext.Provider
      value={{
        role,
        permissions,
        isLoading,
        can,
        canAny,
        canAll,
        isOwner,
        isManager,
        isFinancial,
        isMarketing,
        isWaiter,
        isReception,
        isCashier,
        isKitchen,
        hasRole,
        hasMinimumLevel,
        refreshPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export default PermissionsProvider;
