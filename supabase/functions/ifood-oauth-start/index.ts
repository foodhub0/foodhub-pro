// Edge Function para iniciar o fluxo OAuth do iFood
// Endpoint: POST /ifood-oauth-start

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StartOAuthRequest {
  restaurantId: string;
  clientId: string;
  clientSecret: string;
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
    const { restaurantId, clientId, clientSecret }: StartOAuthRequest = await req.json();

    if (!restaurantId || !clientId || !clientSecret) {
      throw new Error('Missing required fields: restaurantId, clientId, clientSecret');
    }

    // Verificar se o usuário é dono do restaurante
    const { data: restaurant, error: restaurantError } = await supabaseClient
      .from('restaurants')
      .select('id, owner_id')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      throw new Error('Restaurant not found');
    }

    if (restaurant.owner_id !== user.id) {
      throw new Error('Unauthorized: You are not the owner of this restaurant');
    }

    // Chamar API do iFood para gerar userCode
    const ifoodResponse = await fetch(
      `https://merchant-api.ifood.com.br/authentication/v1.0/oauth/userCode?clientId=${clientId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!ifoodResponse.ok) {
      const errorText = await ifoodResponse.text();
      throw new Error(`iFood API error: ${ifoodResponse.status} - ${errorText}`);
    }

    const ifoodData = await ifoodResponse.json();

    // Calcular quando o userCode expira
    const userCodeExpiresAt = new Date(Date.now() + (ifoodData.expiresIn || 600) * 1000);

    // Salvar ou atualizar integração no banco
    const { data: integration, error: integrationError } = await supabaseClient
      .from('ifood_integrations')
      .upsert({
        restaurant_id: restaurantId,
        client_id: clientId,
        client_secret: clientSecret,
        user_code: ifoodData.userCode,
        authorization_code_verifier: ifoodData.authorizationCodeVerifier,
        verification_url: ifoodData.verificationUrl,
        verification_url_complete: ifoodData.verificationUrlComplete,
        user_code_expires_at: userCodeExpiresAt.toISOString(),
        is_active: false,
        is_authorized: false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'restaurant_id',
      })
      .select()
      .single();

    if (integrationError) {
      console.error('Error saving integration:', integrationError);
      throw new Error('Failed to save integration data');
    }

    // Retornar dados para o frontend
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          userCode: ifoodData.userCode,
          verificationUrl: ifoodData.verificationUrl,
          verificationUrlComplete: ifoodData.verificationUrlComplete,
          expiresIn: ifoodData.expiresIn,
          integrationId: integration.id,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in ifood-oauth-start:', error);
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
