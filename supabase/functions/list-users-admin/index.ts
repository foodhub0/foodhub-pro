// Edge Function: list-users-admin
// Lista todos os usuários da marca do owner/manager

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== LIST USERS REQUEST ===')

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Sem autorização')
    }

    const token = authHeader.replace('Bearer ', '')

    // Criar cliente Supabase com service role (admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Criar cliente normal para verificar quem está chamando
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Verificar usuário atual
    const { data: { user: currentUser }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !currentUser) {
      throw new Error('Usuário não autenticado')
    }

    console.log('Current user:', currentUser.email)

    // Verificar se é owner ou manager
    const currentUserRole = currentUser.user_metadata?.role_name
    if (currentUserRole !== 'owner' && currentUserRole !== 'manager') {
      throw new Error('Sem permissão para listar usuários')
    }

    const brandId = currentUser.user_metadata?.brand_id
    if (!brandId) {
      throw new Error('Brand ID não encontrado no usuário')
    }

    console.log('Listing users for brand:', brandId)

    // Listar todos os usuários (Admin API)
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      throw new Error(`Erro ao listar usuários: ${listError.message}`)
    }

    // Filtrar apenas usuários da mesma brand
    const filteredUsers = users.filter(user =>
      user.user_metadata?.brand_id === brandId
    )

    console.log(`Found ${filteredUsers.length} users for brand ${brandId}`)

    // Formatar dados para retorno
    const formattedUsers = filteredUsers.map(user => ({
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      raw_user_meta_data: user.user_metadata,
    }))

    return new Response(
      JSON.stringify({
        success: true,
        users: formattedUsers,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in list-users-admin:', error)

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
