import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wisikawnpzrrfzqutatl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpc2lrYXducHpycmZ6cXV0YXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIzMTcwOSwiZXhwIjoyMDc4ODA3NzA5fQ.Qk5NS5IIhJl3kpeu6db4kW9i3xtIK4I2hKwgQWjiHDY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixRLS() {
  console.log('🔧 Corrigindo política RLS no Supabase...\n');

  try {
    // 1. Verificar restaurantes existentes
    console.log('📊 Verificando restaurantes...');
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name, slug, is_open');

    if (restaurantsError) {
      console.error('❌ Erro ao buscar restaurantes:', restaurantsError);
    } else {
      console.log(`✅ Encontrados ${restaurants?.length || 0} restaurantes:`);
      restaurants?.forEach(r => {
        console.log(`   - ${r.name} (slug: ${r.slug}, is_open: ${r.is_open})`);
      });
    }

    console.log('\n🔄 Aplicando correção da política RLS...\n');

    // 2. Remover política antiga e criar nova
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Remover política restritiva
        DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;

        -- Criar nova política permissiva
        CREATE POLICY "Public can view all restaurants" ON restaurants
          FOR SELECT USING (true);
      `
    });

    if (policyError) {
      console.log('⚠️  Não foi possível usar RPC, tentando via REST API...');

      // Tentar via SQL direto (service_role tem permissões)
      console.log('💡 Executando SQL direto...');

      const { error: sqlError } = await supabase
        .from('restaurants')
        .select('*')
        .limit(1);

      if (sqlError) {
        console.error('❌ Erro:', sqlError);
      } else {
        console.log('✅ Conexão funcionando!');
        console.log('\n📝 EXECUTE MANUALMENTE este SQL no Supabase Dashboard:');
        console.log('─'.repeat(70));
        console.log(`
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;

CREATE POLICY "Public can view all restaurants" ON restaurants
  FOR SELECT USING (true);
        `);
        console.log('─'.repeat(70));
        console.log('\nLink: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql');
      }
    } else {
      console.log('✅ Política RLS aplicada com sucesso!');
    }

    // 3. Testar acesso público
    console.log('\n🧪 Testando acesso público ao restaurante...');

    const publicSupabase = createClient(
      SUPABASE_URL,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpc2lrYXducHpycmZ6cXV0YXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzE3MDksImV4cCI6MjA3ODgwNzcwOX0.WHiwj3ALHXe4tFIby8EvCadi9vWFEP_2QmII9Zydm2A'
    );

    const { data: publicTest, error: publicError } = await publicSupabase
      .from('restaurants')
      .select('id, name, slug')
      .eq('slug', 'pepperspizza')
      .single();

    if (publicError) {
      console.error('❌ Erro no acesso público:', publicError.message);
      console.log('\n⚠️  A política RLS ainda está bloqueando!');
      console.log('💡 Você precisa executar o SQL manualmente no dashboard.');
    } else {
      console.log('✅ Acesso público funcionando!');
      console.log('\n🎉 SUCESSO! O cardápio está acessível em:');
      console.log(`   https://foodhub-idsb2hnel-marcelos-projects-1cb1a1ac.vercel.app/m/${publicTest.slug}`);
    }

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

fixRLS();
