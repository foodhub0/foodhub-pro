// Edge Function: reset-user-password
// Permite owner/manager resetar a senha de qualquer usuário

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
    console.log('=== RESET USER PASSWORD REQUEST ===')

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
      throw new Error('Sem permissão para resetar senhas')
    }

    // Pegar dados do body
    const body = await req.json()
    const { user_id, new_password } = body

    if (!user_id || !new_password) {
      throw new Error('user_id e new_password são obrigatórios')
    }

    if (new_password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres')
    }

    console.log('Resetting password for user:', user_id)

    // Buscar usuário alvo
    const { data: { user: targetUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id)

    if (getUserError || !targetUser) {
      throw new Error('Usuário não encontrado')
    }

    // Verificar se o usuário alvo pertence à mesma brand
    const currentBrandId = currentUser.user_metadata?.brand_id
    const targetBrandId = targetUser.user_metadata?.brand_id

    if (currentBrandId !== targetBrandId) {
      throw new Error('Você só pode resetar senhas de usuários da sua marca')
    }

    // Atualizar senha usando Admin API
    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    )

    if (updateError) {
      throw new Error(`Erro ao atualizar senha: ${updateError.message}`)
    }

    console.log('Password reset successful for user:', user_id)

    // Criar log de auditoria
    if (currentBrandId) {
      try {
        await supabaseAdmin
          .from('audit_logs')
          .insert({
            user_id: currentUser.id,
            brand_id: currentBrandId,
            restaurant_id: currentUser.user_metadata?.restaurant_id || null,
            action: 'reset_password',
            resource_type: 'user',
            resource_id: user_id,
            new_value: {
              reset_by: currentUser.email,
              target_user: targetUser.email,
            },
          })
      } catch (auditError) {
        console.error('Error creating audit log (non-blocking):', auditError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Senha resetada com sucesso',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in reset-user-password:', error)

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
