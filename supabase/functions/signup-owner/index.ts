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

    // Parsear dados do body
    const { email, password, name, restaurant_name } = await req.json();

    // Validações
    if (!email || !password) {
      throw new Error("Email e senha são obrigatórios");
    }

    // Verificar se já existem usuários no sistema
    const { data: existingUsers, error: countError } = await supabaseAdmin
      .from("auth.users")
      .select("id", { count: "exact", head: true });

    // Como não podemos acessar auth.users diretamente, vamos verificar se existe alguma brand
    const { data: existingBrands, error: brandsError } = await supabaseAdmin
      .from("brands")
      .select("id")
      .limit(1);

    if (brandsError) {
      console.error("Error checking brands:", brandsError);
    }

    // Se já existem brands, significa que já existe um owner
    if (existingBrands && existingBrands.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Já existe um proprietário cadastrado. Entre em contato com o administrador para criar sua conta.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Buscar role de owner
    const { data: ownerRole, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("*")
      .eq("name", "owner")
      .single();

    if (roleError || !ownerRole) {
      throw new Error("Role de owner não encontrado");
    }

    // Criar usuário como owner
    const { data: newUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: name || email.split("@")[0],
          role_id: ownerRole.id,
          role_name: "owner",
          role_color: ownerRole.color,
          is_active: true,
        },
      });

    if (createUserError || !newUser.user) {
      throw new Error(createUserError?.message || "Erro ao criar usuário");
    }

    // Criar brand
    const brandName = name || email.split("@")[0];
    const brandSlug = brandName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: newBrand, error: brandError } = await supabaseAdmin
      .from("brands")
      .insert({
        name: brandName,
        slug: brandSlug,
        owner_id: newUser.user.id,
      })
      .select()
      .single();

    if (brandError) {
      // Se falhar ao criar brand, deletar usuário
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error("Erro ao criar marca: " + brandError.message);
    }

    // Criar restaurante
    const restaurantName = restaurant_name || `${brandName} - Unidade 1`;
    const restaurantSlug = restaurantName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: newRestaurant, error: restaurantError } = await supabaseAdmin
      .from("restaurants")
      .insert({
        name: restaurantName,
        slug: restaurantSlug,
        owner_id: newUser.user.id,
        brand_id: newBrand.id,
        restaurant_index: 1,
        is_open: false,
      })
      .select()
      .single();

    if (restaurantError) {
      // Se falhar ao criar restaurante, deletar brand e usuário
      await supabaseAdmin.from("brands").delete().eq("id", newBrand.id);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error("Erro ao criar restaurante: " + restaurantError.message);
    }

    // Atualizar metadata do usuário com brand_id e restaurant_id
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      newUser.user.id,
      {
        user_metadata: {
          name: name || email.split("@")[0],
          role_id: ownerRole.id,
          role_name: "owner",
          role_color: ownerRole.color,
          brand_id: newBrand.id,
          restaurant_id: newRestaurant.id,
          is_active: true,
        },
      }
    );

    if (updateError) {
      console.error("Error updating user metadata:", updateError);
    }

    // Criar log de auditoria
    await supabaseAdmin.from("audit_logs").insert({
      user_id: newUser.user.id,
      brand_id: newBrand.id,
      restaurant_id: newRestaurant.id,
      action: "signup",
      resource_type: "user",
      resource_id: newUser.user.id,
      new_value: {
        email: email,
        role: "owner",
      },
    });

    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
        },
        brand: {
          id: newBrand.id,
          name: newBrand.name,
        },
        restaurant: {
          id: newRestaurant.id,
          name: newRestaurant.name,
        },
        message: "Conta criada com sucesso! Você é o proprietário do sistema.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in signup-owner:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro ao criar conta",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
