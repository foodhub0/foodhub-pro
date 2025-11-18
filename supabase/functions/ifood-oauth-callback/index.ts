// Edge Function para completar o fluxo OAuth do iFood
// Endpoint: POST /ifood-oauth-callback

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CallbackRequest {
  restaurantId: string;
  authorizationCode: string;
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
    const { restaurantId, authorizationCode }: CallbackRequest = await req.json();

    if (!restaurantId || !authorizationCode) {
      throw new Error('Missing required fields: restaurantId, authorizationCode');
    }

    // Buscar integração existente
    const { data: integration, error: integrationError } = await supabaseClient
      .from('ifood_integrations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .single();

    if (integrationError || !integration) {
      throw new Error('Integration not found. Please start the OAuth flow first.');
    }

    // Verificar se o userCode ainda é válido
    if (new Date(integration.user_code_expires_at) < new Date()) {
      throw new Error('User code has expired. Please start the OAuth flow again.');
    }

    // Trocar authorization code por access token
    const tokenRequestBody = new URLSearchParams({
      grantType: 'authorization_code',
      clientId: integration.client_id,
      clientSecret: integration.client_secret,
      authorizationCode: authorizationCode,
      authorizationCodeVerifier: integration.authorization_code_verifier,
    });

    const tokenResponse = await fetch(
      'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenRequestBody,
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`iFood API error: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

    // Calcular quando o token expira
    const tokenExpiresAt = new Date(Date.now() + tokenData.expiresIn * 1000);

    // Atualizar integração com os tokens
    const { error: updateError } = await supabaseClient
      .from('ifood_integrations')
      .update({
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        authorization_code: authorizationCode,
        is_active: true,
        is_authorized: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    if (updateError) {
      console.error('Error updating integration:', updateError);
      throw new Error('Failed to save access token');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: 'OAuth flow completed successfully',
          expiresIn: tokenData.expiresIn,
          expiresAt: tokenExpiresAt.toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in ifood-oauth-callback:', error);
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
