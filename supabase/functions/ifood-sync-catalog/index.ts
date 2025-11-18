// Edge Function para sincronizar cardápio do iFood
// Endpoint: POST /ifood-sync-catalog

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncCatalogRequest {
  restaurantId: string;
  merchantId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar usuário autenticado
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse do body
    const { restaurantId, merchantId }: SyncCatalogRequest = await req.json();

    if (!restaurantId || !merchantId) {
      throw new Error('Missing required fields: restaurantId, merchantId');
    }

    // Buscar integração
    const { data: integration, error: integrationError } = await supabaseClient
      .from('ifood_integrations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .single();

    if (integrationError || !integration) {
      throw new Error('Integration not found');
    }

    if (!integration.is_authorized || !integration.access_token) {
      throw new Error('Integration not authorized. Please complete OAuth flow first.');
    }

    // Verificar se o token ainda é válido
    if (new Date(integration.token_expires_at) < new Date()) {
      throw new Error('Access token has expired. Please refresh the token.');
    }

    // Criar log de sincronização
    const { data: syncLog, error: syncLogError } = await supabaseClient
      .from('ifood_sync_logs')
      .insert({
        restaurant_id: restaurantId,
        ifood_integration_id: integration.id,
        sync_type: 'catalog',
        status: 'started',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (syncLogError) {
      throw new Error('Failed to create sync log');
    }

    try {
      // Buscar itens do cardápio do iFood
      const catalogResponse = await fetch(
        `https://merchant-api.ifood.com.br/catalog/v1.0/merchants/${merchantId}/catalogs/DEFAULT/sellableItems`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!catalogResponse.ok) {
        const errorText = await catalogResponse.text();
        throw new Error(`iFood Catalog API error: ${catalogResponse.status} - ${errorText}`);
      }

      const catalogData = await catalogResponse.json();

      let itemsCreated = 0;
      let itemsUpdated = 0;
      let itemsFailed = 0;

      // Processar cada item do cardápio
      if (catalogData && Array.isArray(catalogData)) {
        for (const item of catalogData) {
          try {
            // Verificar se categoria existe, se não, criar
            let categoryId;

            if (item.category) {
              const { data: existingCategory } = await supabaseClient
                .from('categories')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .eq('name', item.category)
                .single();

              if (existingCategory) {
                categoryId = existingCategory.id;
              } else {
                const { data: newCategory } = await supabaseClient
                  .from('categories')
                  .insert({
                    restaurant_id: restaurantId,
                    name: item.category,
                    is_active: true,
                  })
                  .select()
                  .single();

                categoryId = newCategory?.id;
              }
            }

            // Verificar se produto já existe (via mapping)
            const { data: existingMapping } = await supabaseClient
              .from('ifood_product_mappings')
              .select('local_product_id')
              .eq('restaurant_id', restaurantId)
              .eq('ifood_product_id', item.id)
              .single();

            if (existingMapping) {
              // Atualizar produto existente
              await supabaseClient
                .from('products')
                .update({
                  name: item.name,
                  description: item.description,
                  price: item.price / 100, // iFood retorna em centavos
                  is_available: item.available,
                  image_url: item.image,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingMapping.local_product_id);

              itemsUpdated++;
            } else {
              // Criar novo produto
              const { data: newProduct } = await supabaseClient
                .from('products')
                .insert({
                  restaurant_id: restaurantId,
                  category_id: categoryId,
                  name: item.name,
                  description: item.description,
                  price: item.price / 100,
                  is_available: item.available,
                  image_url: item.image,
                })
                .select()
                .single();

              if (newProduct) {
                // Criar mapeamento
                await supabaseClient
                  .from('ifood_product_mappings')
                  .insert({
                    restaurant_id: restaurantId,
                    local_product_id: newProduct.id,
                    ifood_product_id: item.id,
                    ifood_merchant_id: merchantId,
                    last_synced_at: new Date().toISOString(),
                  });

                itemsCreated++;
              }
            }
          } catch (itemError) {
            console.error('Error processing item:', item.id, itemError);
            itemsFailed++;
          }
        }
      }

      // Atualizar log de sincronização com sucesso
      await supabaseClient
        .from('ifood_sync_logs')
        .update({
          status: 'success',
          items_synced: catalogData.length || 0,
          items_created: itemsCreated,
          items_updated: itemsUpdated,
          items_failed: itemsFailed,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);

      // Atualizar timestamp de última sincronização
      await supabaseClient
        .from('ifood_integrations')
        .update({
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            itemsTotal: catalogData.length || 0,
            itemsCreated,
            itemsUpdated,
            itemsFailed,
            syncLogId: syncLog.id,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (syncError) {
      // Atualizar log de sincronização com erro
      await supabaseClient
        .from('ifood_sync_logs')
        .update({
          status: 'error',
          error_message: syncError.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);

      throw syncError;
    }
  } catch (error) {
    console.error('Error in ifood-sync-catalog:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
