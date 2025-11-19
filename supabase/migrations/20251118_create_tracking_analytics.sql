-- Migration: Tracking e Analytics para Tráfego Pago
-- Criado em: 2025-11-18
-- Descrição: Tabelas para tracking de eventos, Facebook Pixel e analytics de conversão

-- Tabela de configuração do Facebook Pixel por restaurante
CREATE TABLE IF NOT EXISTS public.facebook_pixel_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  pixel_id TEXT NOT NULL,
  access_token TEXT, -- Token para Conversions API (opcional)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id)
);

-- Tabela de eventos de tracking
CREATE TABLE IF NOT EXISTS public.tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL, -- page_view, view_content, add_to_cart, initiate_checkout, purchase
  session_id TEXT, -- ID da sessão do usuário
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Se usuário estiver logado
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  event_value DECIMAL(10, 2), -- Valor monetário (para purchase, add_to_cart)
  currency TEXT DEFAULT 'BRL',
  metadata JSONB, -- Dados adicionais (UTM params, referrer, etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tracking_events_restaurant ON public.tracking_events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_name ON public.tracking_events(event_name);
CREATE INDEX IF NOT EXISTS idx_tracking_events_session ON public.tracking_events(session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON public.tracking_events(created_at);
CREATE INDEX IF NOT EXISTS idx_tracking_events_restaurant_date ON public.tracking_events(restaurant_id, DATE(created_at));

-- View materializada para analytics de conversão (atualizada a cada hora)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.conversion_analytics AS
SELECT
  restaurant_id,
  DATE(created_at) as event_date,
  COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id END) as total_visitors,
  COUNT(DISTINCT CASE WHEN event_name = 'view_content' THEN session_id END) as product_views,
  COUNT(DISTINCT CASE WHEN event_name = 'add_to_cart' THEN session_id END) as cart_additions,
  COUNT(DISTINCT CASE WHEN event_name = 'initiate_checkout' THEN session_id END) as checkouts_initiated,
  COUNT(DISTINCT CASE WHEN event_name = 'purchase' THEN session_id END) as purchases,
  COALESCE(SUM(CASE WHEN event_name = 'purchase' THEN event_value END), 0) as total_revenue,
  ROUND(
    (COUNT(DISTINCT CASE WHEN event_name = 'purchase' THEN session_id END)::DECIMAL /
    NULLIF(COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id END), 0) * 100),
    2
  ) as conversion_rate
FROM public.tracking_events
GROUP BY restaurant_id, DATE(created_at);

-- Índice para a view materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversion_analytics_restaurant_date
  ON public.conversion_analytics(restaurant_id, event_date);

-- Função para atualizar a view materializada (pode ser chamada via cron job)
CREATE OR REPLACE FUNCTION refresh_conversion_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.conversion_analytics;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies para facebook_pixel_config
ALTER TABLE public.facebook_pixel_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver pixel config dos próprios restaurantes"
  ON public.facebook_pixel_config
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir pixel config nos próprios restaurantes"
  ON public.facebook_pixel_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar pixel config dos próprios restaurantes"
  ON public.facebook_pixel_config
  FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

-- RLS Policies para tracking_events
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- Permitir inserção anônima (para tracking público)
CREATE POLICY "Qualquer um pode inserir eventos de tracking"
  ON public.tracking_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Apenas donos podem ver eventos dos seus restaurantes
CREATE POLICY "Usuários podem ver eventos dos próprios restaurantes"
  ON public.tracking_events
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants WHERE user_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE public.facebook_pixel_config IS 'Configuração do Facebook Pixel por restaurante';
COMMENT ON TABLE public.tracking_events IS 'Eventos de tracking para analytics e conversão';
COMMENT ON MATERIALIZED VIEW public.conversion_analytics IS 'Analytics agregado de conversão por restaurante e data';
