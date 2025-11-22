// Script de Debug: Verificar e Corrigir Metadata do Owner
// Execute este código no Console do navegador (F12) no FoodHub Pro

console.log('🔍 INICIANDO DEBUG DO OWNER...\n');

// 1. Verificar usuário atual
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  console.error('❌ Nenhum usuário logado!');
  throw new Error('Faça login primeiro');
}

console.log('✅ Usuário logado:', user.email);
console.log('📋 Metadata atual:', user.user_metadata);

// 2. Verificar se tem role_name
const hasRoleName = !!user.user_metadata?.role_name;
const hasRoleId = !!user.user_metadata?.role_id;
const hasBrandId = !!user.user_metadata?.brand_id;

console.log('\n📊 STATUS:');
console.log('- role_name:', user.user_metadata?.role_name || '❌ NÃO DEFINIDO');
console.log('- role_id:', user.user_metadata?.role_id || '❌ NÃO DEFINIDO');
console.log('- brand_id:', user.user_metadata?.brand_id || '❌ NÃO DEFINIDO');

// 3. Buscar role de owner
console.log('\n🔎 Buscando role "owner"...');
const { data: ownerRole, error: roleError } = await supabase
  .from('roles')
  .select('*')
  .eq('name', 'owner')
  .single();

if (roleError || !ownerRole) {
  console.error('❌ Role "owner" não encontrado!');
  console.error('Execute a migração SQL primeiro!');
  throw new Error('Role owner não existe');
}

console.log('✅ Role owner encontrado:', ownerRole.id);

// 4. Buscar brand do usuário
console.log('\n🔎 Buscando brand do usuário...');
const { data: brands, error: brandError } = await supabase
  .from('brands')
  .select('*')
  .eq('owner_id', user.id);

console.log('Brands encontradas:', brands?.length || 0);

if (!brands || brands.length === 0) {
  console.error('❌ Nenhuma brand encontrada!');
  console.error('Você precisa ter criado um restaurante primeiro!');
  throw new Error('Sem brand');
}

const brand = brands[0];
console.log('✅ Brand encontrada:', brand.id, brand.name);

// 5. CORRIGIR METADATA
console.log('\n🔧 CORRIGINDO METADATA...');

const newMetadata = {
  ...user.user_metadata,
  role_name: 'owner',
  role_id: ownerRole.id,
  brand_id: brand.id,
  role_display_name: ownerRole.display_name,
  role_color: ownerRole.color,
};

console.log('Novo metadata:', newMetadata);

const { error: updateError } = await supabase.auth.updateUser({
  data: newMetadata
});

if (updateError) {
  console.error('❌ Erro ao atualizar metadata:', updateError);
  throw updateError;
}

console.log('✅ METADATA ATUALIZADO COM SUCESSO!\n');

// 6. Verificar novamente
const { data: { user: updatedUser } } = await supabase.auth.getUser();

console.log('📋 METADATA FINAL:');
console.log(JSON.stringify(updatedUser.user_metadata, null, 2));

console.log('\n✅ TUDO CERTO!');
console.log('📌 PRÓXIMOS PASSOS:');
console.log('1. Faça LOGOUT');
console.log('2. Faça LOGIN novamente');
console.log('3. Recarregue a página (F5)');
console.log('4. Tente criar um usuário novamente');
console.log('\n🎉 Deve funcionar agora!');
