// Edge Function: create-user-admin (MELHORADO)
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
    console.log('=== CREATE USER REQUEST ===')

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
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

    if (authError) {
      console.error('Auth error:', authError)
      throw new Error(`Erro de autenticação: ${authError.message}`)
    }

    if (!currentUser) {
      console.error('No current user')
      throw new Error('Usuário não autenticado')
    }

    console.log('Current user:', currentUser.email)
    console.log('Current user metadata:', currentUser.user_metadata)

    // Verificar se o usuário atual é owner ou manager
    const currentUserRole = currentUser.user_metadata?.role_name
    console.log('Current user role:', currentUserRole)

    if (currentUserRole !== 'owner' && currentUserRole !== 'manager') {
      throw new Error(`Sem permissão para criar usuários. Seu role atual: ${currentUserRole || 'não definido'}. Apenas owner e manager podem criar usuários.`)
    }

    // Pegar dados do body
    const body = await req.json()
    const { user_email, user_password, user_metadata, send_email } = body

    console.log('Request body:', { user_email, has_password: !!user_password, user_metadata, send_email })

    // Validações
    if (!user_email || !user_password) {
      throw new Error('Email e senha são obrigatórios')
    }

    if (!user_metadata) {
      throw new Error('user_metadata é obrigatório')
    }

    if (!user_metadata.role_name) {
      throw new Error('role_name é obrigatório no metadata')
    }

    console.log('Creating user:', user_email, 'with role:', user_metadata.role_name)

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
      throw new Error(`Erro ao criar usuário: ${createError.message}`)
    }

    if (!newUser.user) {
      throw new Error('Usuário criado mas dados não retornados')
    }

    console.log('User created successfully:', newUser.user.id)

    // Criar log de auditoria (opcional, não bloqueia se falhar)
    if (user_metadata.brand_id) {
      try {
        await supabaseAdmin
          .from('audit_logs')
          .insert({
            user_id: currentUser.id,
            brand_id: user_metadata.brand_id,
            restaurant_id: user_metadata.restaurant_id || null,
            action: 'create_user',
            resource_type: 'user',
            resource_id: newUser.user.id,
            new_value: {
              email: user_email,
              role_name: user_metadata.role_name,
              created_by: currentUser.email,
            },
          })
        console.log('Audit log created')
      } catch (auditError) {
        console.error('Error creating audit log (non-blocking):', auditError)
      }
    }

    console.log('=== SUCCESS ===')

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('=== ERROR ===')
    console.error('Error in create-user-admin:', error)

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
