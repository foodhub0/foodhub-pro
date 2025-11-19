import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase com permissões de admin (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar autenticação do usuário que está fazendo a requisição
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: requestingUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      throw new Error("Não autorizado");
    }

    // Verificar se o usuário tem permissão para criar usuários
    const metadata = requestingUser.user_metadata || {};
    const roleName = metadata.role_name;

    if (!["owner", "manager"].includes(roleName)) {
      throw new Error("Você não tem permissão para criar usuários");
    }

    // Parsear dados do body
    const { user_email, user_password, user_metadata, send_email } =
      await req.json();

    // Validações
    if (!user_email || !user_password || !user_metadata) {
      throw new Error("Dados incompletos");
    }

    // Criar usuário via Admin API
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: user_email,
        password: user_password,
        email_confirm: !send_email, // Se enviar email, não confirma automaticamente
        user_metadata: user_metadata,
      });

    if (createError) {
      throw createError;
    }

    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        user: newUser,
        message: "Usuário criado com sucesso",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
