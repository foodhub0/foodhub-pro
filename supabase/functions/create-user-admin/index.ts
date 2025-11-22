// Edge Function: create-user-admin
// Cria novos usuários usando Supabase Admin API (não desconecta o owner)

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
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Sem autorização')
    }

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verificar se o usuário atual está autenticado
    const { data: { user: currentUser }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !currentUser) {
      throw new Error('Usuário não autenticado')
    }

    // Verificar se o usuário atual é owner ou manager
    const currentUserRole = currentUser.user_metadata?.role_name
    if (currentUserRole !== 'owner' && currentUserRole !== 'manager') {
      throw new Error('Sem permissão para criar usuários')
    }

    // Pegar dados do body
    const { user_email, user_password, user_metadata, send_email } = await req.json()

    console.log('Creating user:', user_email, 'by:', currentUser.email)

    // Validações
    if (!user_email || !user_password) {
      throw new Error('Email e senha são obrigatórios')
    }

    if (!user_metadata || !user_metadata.role_name) {
      throw new Error('role_name é obrigatório no metadata')
    }

    // Criar usuário usando Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: user_email,
      password: user_password,
      email_confirm: !send_email, // Se send_email = false, auto-confirmar
      user_metadata: {
        ...user_metadata,
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
      },
    })

    if (createError) {
      console.error('Error creating user:', createError)
      throw createError
    }

    console.log('User created successfully:', newUser.user?.id)

    // Criar log de auditoria
    if (user_metadata.brand_id) {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: currentUser.id,
          brand_id: user_metadata.brand_id,
          restaurant_id: user_metadata.restaurant_id,
          action: 'create_user',
          resource_type: 'user',
          resource_id: newUser.user?.id,
          new_value: {
            email: user_email,
            role_name: user_metadata.role_name,
            created_by: currentUser.email,
          },
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user?.id,
          email: newUser.user?.email,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in create-user-admin:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
