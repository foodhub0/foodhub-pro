-- Criação de tabelas para integração com iFood
-- Migration: 20251118_create_ifood_integration

-- Tabela para armazenar tokens OAuth e configurações do iFood
CREATE TABLE IF NOT EXISTS public.ifood_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,

  -- OAuth credentials
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,

  -- Tokens
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,

  -- User Code flow
  user_code TEXT,
  authorization_code TEXT,
  authorization_code_verifier TEXT,
  verification_url TEXT,
  verification_url_complete TEXT,
  user_code_expires_at TIMESTAMP WITH TIME ZONE,

  -- Status
  is_active BOOLEAN DEFAULT false,
  is_authorized BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(restaurant_id)
);

-- Tabela para armazenar merchants do iFood vinculados
CREATE TABLE IF NOT EXISTS public.ifood_merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  ifood_integration_id UUID NOT NULL REFERENCES public.ifood_integrations(id) ON DELETE CASCADE,

  -- iFood merchant data
  merchant_id UUID NOT NULL,
  merchant_name TEXT,

  -- Widget configuration
  widget_id TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(restaurant_id, merchant_id)
);

-- Tabela para logs de sincronização
CREATE TABLE IF NOT EXISTS public.ifood_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  ifood_integration_id UUID NOT NULL REFERENCES public.ifood_integrations(id) ON DELETE CASCADE,

  -- Sync info
  sync_type TEXT NOT NULL, -- 'catalog', 'orders', 'full'
  status TEXT NOT NULL, -- 'started', 'success', 'error'

  -- Stats
  items_synced INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para mapear produtos do iFood com produtos locais
CREATE TABLE IF NOT EXISTS public.ifood_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,

  -- Local product
  local_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- iFood product
  ifood_product_id TEXT NOT NULL,
  ifood_merchant_table_id UUID REFERENCES public.ifood_merchants(id) ON DELETE CASCADE,

  -- Sync settings
  auto_sync BOOLEAN DEFAULT true,
  sync_price BOOLEAN DEFAULT true,
  sync_availability BOOLEAN DEFAULT true,
  sync_description BOOLEAN DEFAULT true,

  -- Last sync
  last_synced_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(local_product_id, ifood_product_id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_ifood_integrations_restaurant ON public.ifood_integrations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ifood_integrations_active ON public.ifood_integrations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ifood_merchants_restaurant ON public.ifood_merchants(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ifood_merchants_integration ON public.ifood_merchants(ifood_integration_id);
CREATE INDEX IF NOT EXISTS idx_ifood_sync_logs_restaurant ON public.ifood_sync_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ifood_sync_logs_integration ON public.ifood_sync_logs(ifood_integration_id);
CREATE INDEX IF NOT EXISTS idx_ifood_sync_logs_created ON public.ifood_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ifood_product_mappings_local ON public.ifood_product_mappings(local_product_id);
CREATE INDEX IF NOT EXISTS idx_ifood_product_mappings_ifood ON public.ifood_product_mappings(ifood_product_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ifood_integrations_updated_at
  BEFORE UPDATE ON public.ifood_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ifood_merchants_updated_at
  BEFORE UPDATE ON public.ifood_merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ifood_product_mappings_updated_at
  BEFORE UPDATE ON public.ifood_product_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.ifood_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifood_merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifood_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifood_product_mappings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ifood_integrations
CREATE POLICY "Usuários podem ver integrações do próprio restaurante"
  ON public.ifood_integrations FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir integrações no próprio restaurante"
  ON public.ifood_integrations FOR INSERT
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar integrações do próprio restaurante"
  ON public.ifood_integrations FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar integrações do próprio restaurante"
  ON public.ifood_integrations FOR DELETE
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

-- Políticas RLS para ifood_merchants
CREATE POLICY "Usuários podem ver merchants do próprio restaurante"
  ON public.ifood_merchants FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir merchants no próprio restaurante"
  ON public.ifood_merchants FOR INSERT
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar merchants do próprio restaurante"
  ON public.ifood_merchants FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar merchants do próprio restaurante"
  ON public.ifood_merchants FOR DELETE
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

-- Políticas RLS para ifood_sync_logs
CREATE POLICY "Usuários podem ver logs do próprio restaurante"
  ON public.ifood_sync_logs FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir logs no próprio restaurante"
  ON public.ifood_sync_logs FOR INSERT
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

-- Políticas RLS para ifood_product_mappings
CREATE POLICY "Usuários podem ver mapeamentos do próprio restaurante"
  ON public.ifood_product_mappings FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir mapeamentos no próprio restaurante"
  ON public.ifood_product_mappings FOR INSERT
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar mapeamentos do próprio restaurante"
  ON public.ifood_product_mappings FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar mapeamentos do próprio restaurante"
  ON public.ifood_product_mappings FOR DELETE
  USING (
    restaurant_id IN (
      SELECT id FROM public.restaurants
      WHERE owner_id = auth.uid()
    )
  );

-- Comentários para documentação
COMMENT ON TABLE public.ifood_integrations IS 'Armazena tokens OAuth e configurações de integração com o iFood';
COMMENT ON TABLE public.ifood_merchants IS 'Armazena merchants do iFood vinculados aos restaurantes';
COMMENT ON TABLE public.ifood_sync_logs IS 'Logs de sincronização de dados com o iFood';
COMMENT ON TABLE public.ifood_product_mappings IS 'Mapeamento entre produtos locais e produtos do iFood';
COMMENT ON COLUMN public.ifood_product_mappings.ifood_merchant_table_id IS 'Referência ao ID da tabela ifood_merchants (não confundir com merchant_id do iFood)';
