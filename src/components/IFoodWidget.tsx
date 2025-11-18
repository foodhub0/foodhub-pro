import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface IFoodWidgetProps {
  restaurantId: string;
}

export default function IFoodWidget({ restaurantId }: IFoodWidgetProps) {
  const [merchantIds, setMerchantIds] = useState<string[]>([]);
  const [widgetId, setWidgetId] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      fetchWidgetConfig();
    }
  }, [restaurantId]);

  useEffect(() => {
    if (merchantIds.length > 0 && widgetId && !isLoaded) {
      loadWidget();
    }
  }, [merchantIds, widgetId, isLoaded]);

  const fetchWidgetConfig = async () => {
    try {
      // Buscar merchants configurados para este restaurante
      const { data: merchants, error } = await supabase
        .from('ifood_merchants')
        .select('merchant_id, widget_id')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      if (error) throw error;

      if (merchants && merchants.length > 0) {
        const ids = merchants.map(m => m.merchant_id).filter(Boolean);
        const widget = merchants.find(m => m.widget_id)?.widget_id;

        if (ids.length > 0 && widget) {
          setMerchantIds(ids);
          setWidgetId(widget);
        }
      }
    } catch (error) {
      console.error('Error fetching widget config:', error);
    }
  };

  const loadWidget = () => {
    // Verificar se o script já foi carregado
    if (document.getElementById('ifood-widget-script')) {
      initializeWidget();
      return;
    }

    // Criar e carregar o script do widget
    const script = document.createElement('script');
    script.id = 'ifood-widget-script';
    script.src = 'https://widgets.ifood.com.br/widget.js';
    script.async = true;

    script.onload = () => {
      initializeWidget();
    };

    script.onerror = () => {
      console.error('Failed to load iFood widget script');
    };

    document.head.appendChild(script);
  };

  const initializeWidget = () => {
    // @ts-ignore - iFood widget global object
    if (window.iFoodWidget) {
      try {
        // @ts-ignore
        window.iFoodWidget.init({
          merchantIds: merchantIds,
          widgetId: widgetId,
          autoShow: true,
        });
        setIsLoaded(true);
      } catch (error) {
        console.error('Error initializing iFood widget:', error);
      }
    } else {
      console.error('iFood widget not available');
    }
  };

  // Não renderizar nada visualmente - o widget injeta seu próprio UI
  return null;
}
