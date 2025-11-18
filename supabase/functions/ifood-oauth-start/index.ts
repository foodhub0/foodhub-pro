// Edge Function para iniciar o fluxo OAuth do iFood com redirecionamento automático
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

// Função para gerar code_verifier e code_challenge (PKCE)
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
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

    // Gerar PKCE code_verifier e code_challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // URL de callback (ajuste conforme seu domínio)
    const callbackUrl = `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/ifood-callback`;

    // Salvar code_verifier e credenciais no banco (temporário até completar OAuth)
    const { data: integration, error: integrationError } = await supabaseClient
      .from('ifood_integrations')
      .upsert({
        restaurant_id: restaurantId,
        client_id: clientId,
        client_secret: clientSecret,
        authorization_code_verifier: codeVerifier,
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

    // Construir URL de autorização do iFood
    const authUrl = new URL('https://merchant-api.ifood.com.br/authentication/v1.0/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', restaurantId); // Para identificar o restaurante no callback

    // Retornar URL de autorização
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          authorizationUrl: authUrl.toString(),
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
