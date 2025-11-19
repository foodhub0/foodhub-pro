import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FacebookPixelProps {
  restaurantId: string;
}

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const FacebookPixel = ({ restaurantId }: FacebookPixelProps) => {
  useEffect(() => {
    const initPixel = async () => {
      try {
        // Buscar configuração do pixel
        const { data: pixelConfig } = await supabase
          .from('facebook_pixel_config')
          .select('pixel_id, is_active')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .single();

        if (!pixelConfig || !pixelConfig.pixel_id) {
          return;
        }

        // Verificar se já foi inicializado
        if (window.fbq) {
          return;
        }

        // Inicializar Facebook Pixel
        (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return;
          n = f.fbq = function() {
            n.callMethod
              ? n.callMethod.apply(n, arguments)
              : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = '2.0';
          n.queue = [];
          t = b.createElement(e);
          t.async = !0;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(
          window,
          document,
          'script',
          'https://connect.facebook.net/en_US/fbevents.js'
        );

        window.fbq('init', pixelConfig.pixel_id);
        window.fbq('track', 'PageView');

        console.log('✅ Facebook Pixel inicializado:', pixelConfig.pixel_id);
      } catch (error) {
        console.error('Erro ao inicializar Facebook Pixel:', error);
      }
    };

    initPixel();
  }, [restaurantId]);

  return null; // Componente invisível
};

export default FacebookPixel;
