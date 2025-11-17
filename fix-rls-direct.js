const SUPABASE_URL = 'https://wisikawnpzrrfzqutatl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpc2lrYXducHpycmZ6cXV0YXRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIzMTcwOSwiZXhwIjoyMDc4ODA3NzA5fQ.Qk5NS5IIhJl3kpeu6db4kW9i3xtIK4I2hKwgQWjiHDY';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpc2lrYXducHpycmZ6cXV0YXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzE3MDksImV4cCI6MjA3ODgwNzcwOX0.WHiwj3ALHXe4tFIby8EvCadi9vWFEP_2QmII9Zydm2A';

async function fixRLS() {
  console.log('🔧 Corrigindo política RLS no Supabase...\n');

  try {
    // 1. Verificar restaurantes existentes (com service_role)
    console.log('📊 Verificando restaurantes...');
    const restaurantsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/restaurants?select=id,name,slug,is_open`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      }
    );

    const restaurants = await restaurantsResponse.json();

    if (Array.isArray(restaurants)) {
      console.log(`✅ Encontrados ${restaurants.length} restaurantes:`);
      restaurants.forEach(r => {
        console.log(`   - ${r.name} (slug: ${r.slug}, is_open: ${r.is_open})`);
      });
    } else {
      console.error('❌ Erro ao buscar restaurantes:', restaurants);
    }

    // 2. Executar SQL para corrigir RLS
    console.log('\n🔄 Aplicando correção da política RLS via SQL...\n');

    const sqlCommands = `
      -- Remover política restritiva
      DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;

      -- Criar nova política permissiva
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'restaurants'
          AND policyname = 'Public can view all restaurants'
        ) THEN
          CREATE POLICY "Public can view all restaurants" ON restaurants
            FOR SELECT USING (true);
        END IF;
      END $$;
    `;

    const sqlResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: sqlCommands })
      }
    );

    const sqlResult = await sqlResponse.text();

    if (!sqlResponse.ok) {
      console.log('⚠️  RPC não disponível, mas podemos testar o acesso público...');
    } else {
      console.log('✅ SQL executado!');
    }

    // 3. Testar acesso público (sem service_role, usando anon key)
    console.log('\n🧪 Testando acesso público ao restaurante pepperspizza...');

    const publicResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/restaurants?slug=eq.pepperspizza&select=id,name,slug,is_open`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      }
    );

    const publicResult = await publicResponse.json();

    if (!publicResponse.ok || publicResult.code) {
      console.error('❌ Erro no acesso público:', publicResult);
      console.log('\n⚠️  A política RLS ainda está bloqueando!');
      console.log('\n📝 VOCÊ PRECISA EXECUTAR ESTE SQL MANUALMENTE:');
      console.log('─'.repeat(70));
      console.log(sqlCommands);
      console.log('─'.repeat(70));
      console.log('\n🔗 Link do SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql');
      console.log('\nCole o SQL acima e clique em RUN.');
    } else if (Array.isArray(publicResult) && publicResult.length > 0) {
      console.log('✅ Acesso público funcionando!');
      console.log(`   Restaurante: ${publicResult[0].name}`);
      console.log(`   Slug: ${publicResult[0].slug}`);
      console.log(`   Aberto: ${publicResult[0].is_open}`);
      console.log('\n🎉 SUCESSO! O cardápio está acessível em:');
      console.log(`   https://foodhub-idsb2hnel-marcelos-projects-1cb1a1ac.vercel.app/m/${publicResult[0].slug}`);
    } else {
      console.log('⚠️  Restaurante não encontrado ou acesso bloqueado.');
      console.log('   Resposta:', publicResult);
    }

  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
  }
}

fixRLS();
