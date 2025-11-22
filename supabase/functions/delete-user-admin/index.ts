// Edge Function: delete-user-admin
// Permite owner/manager deletar usuários

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
    console.log('=== DELETE USER REQUEST ===')

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
      throw new Error('Sem permissão para deletar usuários')
    }

    // Pegar dados do body
    const body = await req.json()
    const { user_id } = body

    if (!user_id) {
      throw new Error('user_id é obrigatório')
    }

    // Impedir que usuário delete a si mesmo
    if (user_id === currentUser.id) {
      throw new Error('Você não pode deletar seu próprio usuário')
    }

    console.log('Deleting user:', user_id)

    // Buscar usuário alvo
    const { data: { user: targetUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id)

    if (getUserError || !targetUser) {
      throw new Error('Usuário não encontrado')
    }

    // Verificar se o usuário alvo pertence à mesma brand
    const currentBrandId = currentUser.user_metadata?.brand_id
    const targetBrandId = targetUser.user_metadata?.brand_id

    if (currentBrandId !== targetBrandId) {
      throw new Error('Você só pode deletar usuários da sua marca')
    }

    // Impedir que manager delete owner
    if (currentUserRole === 'manager' && targetUser.user_metadata?.role_name === 'owner') {
      throw new Error('Managers não podem deletar owners')
    }

    // Criar log de auditoria ANTES de deletar
    if (currentBrandId) {
      try {
        await supabaseAdmin
          .from('audit_logs')
          .insert({
            user_id: currentUser.id,
            brand_id: currentBrandId,
            restaurant_id: currentUser.user_metadata?.restaurant_id || null,
            action: 'delete_user',
            resource_type: 'user',
            resource_id: user_id,
            old_value: {
              email: targetUser.email,
              role_name: targetUser.user_metadata?.role_name,
              name: targetUser.user_metadata?.name,
            },
            new_value: {
              deleted_by: currentUser.email,
            },
          })
      } catch (auditError) {
        console.error('Error creating audit log (non-blocking):', auditError)
      }
    }

    // Deletar usuário usando Admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (deleteError) {
      throw new Error(`Erro ao deletar usuário: ${deleteError.message}`)
    }

    console.log('User deleted successfully:', user_id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário deletado com sucesso',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in delete-user-admin:', error)

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
