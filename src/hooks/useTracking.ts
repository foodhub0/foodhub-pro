import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Gerar ou recuperar session ID do localStorage
const getSessionId = () => {
  let sessionId = localStorage.getItem('tracking_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('tracking_session_id', sessionId);
  }
  return sessionId;
};

// Capturar UTM params e outros metadados
const getMetadata = () => {
  const params = new URLSearchParams(window.location.search);
  const metadata: Record<string, any> = {
    url: window.location.href,
    referrer: document.referrer,
    user_agent: navigator.userAgent,
  };

  // Capturar UTM params
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
    const value = params.get(param);
    if (value) {
      metadata[param] = value;
    }
  });

  return metadata;
};

export interface TrackEventParams {
  restaurantId: string;
  eventName: 'page_view' | 'view_content' | 'add_to_cart' | 'initiate_checkout' | 'purchase';
  productId?: string;
  orderId?: string;
  eventValue?: number;
  currency?: string;
  customMetadata?: Record<string, any>;
}

export const useTracking = () => {
  const trackEvent = useCallback(async (params: TrackEventParams) => {
    try {
      const sessionId = getSessionId();
      const metadata = getMetadata();

      // Mesclar metadata customizado
      const finalMetadata = {
        ...metadata,
        ...params.customMetadata,
      };

      // Inserir evento no banco
      const { error } = await supabase.from('tracking_events').insert({
        restaurant_id: params.restaurantId,
        event_name: params.eventName,
        session_id: sessionId,
        product_id: params.productId || null,
        order_id: params.orderId || null,
        event_value: params.eventValue || null,
        currency: params.currency || 'BRL',
        metadata: finalMetadata,
      });

      if (error) {
        console.error('Erro ao rastrear evento:', error);
        return;
      }

      // Disparar evento no Facebook Pixel se disponível
      if (window.fbq) {
        switch (params.eventName) {
          case 'page_view':
            window.fbq('track', 'PageView');
            break;
          case 'view_content':
            window.fbq('track', 'ViewContent', {
              content_ids: params.productId ? [params.productId] : [],
              content_type: 'product',
              value: params.eventValue || 0,
              currency: params.currency || 'BRL',
            });
            break;
          case 'add_to_cart':
            window.fbq('track', 'AddToCart', {
              content_ids: params.productId ? [params.productId] : [],
              content_type: 'product',
              value: params.eventValue || 0,
              currency: params.currency || 'BRL',
            });
            break;
          case 'initiate_checkout':
            window.fbq('track', 'InitiateCheckout', {
              value: params.eventValue || 0,
              currency: params.currency || 'BRL',
            });
            break;
          case 'purchase':
            window.fbq('track', 'Purchase', {
              value: params.eventValue || 0,
              currency: params.currency || 'BRL',
              order_id: params.orderId,
            });
            break;
        }
      }

      console.log('📊 Evento rastreado:', params.eventName, params);
    } catch (error) {
      console.error('Erro ao rastrear evento:', error);
    }
  }, []);

  return { trackEvent };
};
