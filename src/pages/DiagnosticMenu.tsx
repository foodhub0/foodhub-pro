import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

const DiagnosticMenu = () => {
  const { slug } = useParams<{ slug: string }>();
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, [slug]);

  const runDiagnostics = async () => {
    const results: any = {
      slug: slug,
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Testar conexão com Supabase
      results.supabaseConnection = "✅ Conectado";

      // 2. Buscar restaurante pelo slug (sem RLS)
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug);

      results.restaurantQuery = {
        success: !restaurantError,
        error: restaurantError?.message || null,
        rowCount: restaurantData?.length || 0,
        data: restaurantData || null,
      };

      // 3. Testar política RLS
      if (restaurantData && restaurantData.length > 0) {
        results.restaurantFound = "✅ Restaurante encontrado";
        results.restaurantData = restaurantData[0];

        // 4. Buscar categorias
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .eq("restaurant_id", restaurantData[0].id);

        results.categoriesQuery = {
          success: !categoriesError,
          error: categoriesError?.message || null,
          rowCount: categoriesData?.length || 0,
        };

        // 5. Buscar produtos
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("restaurant_id", restaurantData[0].id);

        results.productsQuery = {
          success: !productsError,
          error: productsError?.message || null,
          rowCount: productsData?.length || 0,
        };
      } else {
        results.restaurantFound = "❌ Restaurante NÃO encontrado";

        // Listar todos os restaurantes para debug
        const { data: allRestaurants } = await supabase
          .from("restaurants")
          .select("id, name, slug, is_open");

        results.allRestaurants = allRestaurants;
      }

      // 6. Verificar políticas RLS
      const { data: policies, error: policiesError } = await supabase
        .rpc('pg_policies')
        .select('*');

      results.policies = {
        success: !policiesError,
        error: policiesError?.message || "Não foi possível buscar políticas",
      };

    } catch (error: any) {
      results.criticalError = error.message;
    }

    setDiagnostics(results);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">🔍 Diagnóstico do Cardápio</h1>

        {/* Informações Básicas */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>Slug:</strong> {diagnostics.slug}</div>
            <div><strong>Timestamp:</strong> {diagnostics.timestamp}</div>
            <div><strong>Conexão Supabase:</strong> {diagnostics.supabaseConnection}</div>
          </div>
        </Card>

        {/* Query do Restaurante */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Query do Restaurante</h2>
          <div className="space-y-2">
            <div>
              <strong>Status:</strong>{" "}
              {diagnostics.restaurantQuery?.success ? "✅ Sucesso" : "❌ Erro"}
            </div>
            {diagnostics.restaurantQuery?.error && (
              <div className="bg-red-50 p-3 rounded text-red-700">
                <strong>Erro:</strong> {diagnostics.restaurantQuery.error}
              </div>
            )}
            <div>
              <strong>Registros encontrados:</strong>{" "}
              {diagnostics.restaurantQuery?.rowCount}
            </div>
          </div>
        </Card>

        {/* Dados do Restaurante */}
        {diagnostics.restaurantData && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Dados do Restaurante</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(diagnostics.restaurantData, null, 2)}
            </pre>
          </Card>
        )}

        {/* Todos os Restaurantes (se não encontrou) */}
        {diagnostics.allRestaurants && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              ⚠️ Todos os Restaurantes no Banco
            </h2>
            <div className="bg-yellow-50 p-3 rounded mb-4">
              <p className="text-sm">
                O slug <strong>"{diagnostics.slug}"</strong> não foi encontrado.
                Veja abaixo os slugs disponíveis:
              </p>
            </div>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(diagnostics.allRestaurants, null, 2)}
            </pre>
          </Card>
        )}

        {/* Categorias */}
        {diagnostics.categoriesQuery && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Categorias</h2>
            <div className="space-y-2">
              <div>
                <strong>Status:</strong>{" "}
                {diagnostics.categoriesQuery.success ? "✅ Sucesso" : "❌ Erro"}
              </div>
              {diagnostics.categoriesQuery.error && (
                <div className="bg-red-50 p-3 rounded text-red-700">
                  <strong>Erro:</strong> {diagnostics.categoriesQuery.error}
                </div>
              )}
              <div>
                <strong>Total:</strong> {diagnostics.categoriesQuery.rowCount}
              </div>
            </div>
          </Card>
        )}

        {/* Produtos */}
        {diagnostics.productsQuery && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Produtos</h2>
            <div className="space-y-2">
              <div>
                <strong>Status:</strong>{" "}
                {diagnostics.productsQuery.success ? "✅ Sucesso" : "❌ Erro"}
              </div>
              {diagnostics.productsQuery.error && (
                <div className="bg-red-50 p-3 rounded text-red-700">
                  <strong>Erro:</strong> {diagnostics.productsQuery.error}
                </div>
              )}
              <div>
                <strong>Total:</strong> {diagnostics.productsQuery.rowCount}
              </div>
            </div>
          </Card>
        )}

        {/* Diagnóstico Completo */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            📋 Diagnóstico Completo (JSON)
          </h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </Card>

        {/* Instruções */}
        <Card className="p-6 bg-blue-50">
          <h2 className="text-xl font-semibold mb-4">💡 O que fazer?</h2>
          <div className="space-y-3 text-sm">
            <div>
              <strong>1. Se o restaurante não foi encontrado:</strong>
              <ul className="list-disc ml-6 mt-2">
                <li>Verifique se o slug está correto na URL</li>
                <li>Confira os slugs disponíveis acima</li>
                <li>Crie um restaurante no painel admin se necessário</li>
              </ul>
            </div>
            <div>
              <strong>2. Se deu erro de permissão (RLS):</strong>
              <ul className="list-disc ml-6 mt-2">
                <li>Execute o SQL do arquivo FIX_MIGRATION_SAFE.sql</li>
                <li>
                  Link:{" "}
                  <a
                    href="https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql"
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    Supabase SQL Editor
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <strong>3. Copie este diagnóstico:</strong>
              <ul className="list-disc ml-6 mt-2">
                <li>Tire um print desta página</li>
                <li>Ou copie o JSON completo acima</li>
                <li>Me envie para eu te ajudar</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DiagnosticMenu;
