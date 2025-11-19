import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBrand } from '@/contexts/BrandContext';

interface LogAuditParams {
  action: string;
  resource_type?: string;
  resource_id?: string;
  old_value?: any;
  new_value?: any;
  metadata?: Record<string, any>;
}

export const useAudit = () => {
  const { brand, currentRestaurant } = useBrand();

  const logAudit = useCallback(async (params: LogAuditParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('Cannot log audit: no user');
        return;
      }

      const auditLog = {
        user_id: user.id,
        brand_id: brand?.id || null,
        restaurant_id: currentRestaurant?.id || null,
        action: params.action,
        resource_type: params.resource_type || null,
        resource_id: params.resource_id || null,
        old_value: params.old_value ? JSON.stringify(params.old_value) : null,
        new_value: params.new_value ? JSON.stringify(params.new_value) : null,
        ip_address: null, // TODO: capturar IP do cliente
        user_agent: navigator.userAgent,
        metadata: params.metadata || {},
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditLog);

      if (error) {
        console.error('Error logging audit:', error);
      }
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }, [brand, currentRestaurant]);

  const logLogin = useCallback(async () => {
    await logAudit({ action: 'login' });
  }, [logAudit]);

  const logLogout = useCallback(async () => {
    await logAudit({ action: 'logout' });
  }, [logAudit]);

  const logCreate = useCallback(async (resourceType: string, resourceId: string, data: any) => {
    await logAudit({
      action: 'create',
      resource_type: resourceType,
      resource_id: resourceId,
      new_value: data,
    });
  }, [logAudit]);

  const logUpdate = useCallback(async (
    resourceType: string,
    resourceId: string,
    oldData: any,
    newData: any
  ) => {
    await logAudit({
      action: 'update',
      resource_type: resourceType,
      resource_id: resourceId,
      old_value: oldData,
      new_value: newData,
    });
  }, [logAudit]);

  const logDelete = useCallback(async (resourceType: string, resourceId: string, data: any) => {
    await logAudit({
      action: 'delete',
      resource_type: resourceType,
      resource_id: resourceId,
      old_value: data,
    });
  }, [logAudit]);

  const logAction = useCallback(async (
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ) => {
    await logAudit({
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
    });
  }, [logAudit]);

  return {
    logAudit,
    logLogin,
    logLogout,
    logCreate,
    logUpdate,
    logDelete,
    logAction,
  };
};

export default useAudit;
