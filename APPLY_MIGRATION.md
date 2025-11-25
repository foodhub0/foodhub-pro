# Como Aplicar a Migration de Correção RLS

## Problema Identificado

Usuários criados por owners não conseguem fazer login porque as políticas RLS (Row Level Security) das tabelas `brands` e `restaurants` só permitem acesso quando `owner_id = auth.uid()`.

Isso impede que usuários com role "manager" (ou outros roles) vejam os brands e restaurantes aos quais pertencem através do `brand_id` armazenado em seus metadados.

## Solução

Foi criada a migration `20251125_fix_brand_rls_for_non_owners.sql` que:

1. Remove as políticas RLS atuais que são muito restritivas
2. Cria novas políticas que permitem:
   - Owners ver seus próprios brands/restaurants (`owner_id = auth.uid()`)
   - Usuários não-owners ver brands/restaurants onde o `brand_id` corresponde ao armazenado em seus metadados

## Como Aplicar a Migration

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o dashboard do Supabase: https://app.supabase.com/project/wisikawnpzrrfzqutatl
2. Navegue até **SQL Editor** no menu lateral
3. Clique em **New query**
4. Copie todo o conteúdo do arquivo `supabase/migrations/20251125_fix_brand_rls_for_non_owners.sql`
5. Cole no editor SQL
6. Clique em **Run** ou pressione `Ctrl+Enter`
7. Verifique os logs de sucesso que aparecem na parte inferior

### Opção 2: Via Supabase CLI

Se você tiver o Supabase CLI configurado e autenticado:

```bash
npx supabase db push
```

## Verificação

Após aplicar a migration, você verá mensagens como:

```
========================================
   MIGRAÇÃO CONCLUÍDA COM SUCESSO
========================================
Políticas de brands criadas: 4
Políticas de restaurants criadas: 4

✓ Usuários não-owners agora podem acessar
  brands e restaurants através do brand_id
  armazenado em seus metadados
========================================
```

## Teste

1. Peça para o usuário que estava com problema tentar fazer login novamente
2. O usuário deve conseguir acessar normalmente o sistema
3. Verifique no console do navegador que não há mais erros de "Brand query result: Object null"

## Políticas Criadas

### Brands
- **brands_select_policy**: Permite SELECT para owners e usuários com brand_id no metadata
- **brands_insert_policy**: Permite INSERT apenas para owners
- **brands_update_policy**: Permite UPDATE apenas para owners
- **brands_delete_policy**: Permite DELETE apenas para owners

### Restaurants
- **restaurants_select_policy**: Permite SELECT para owners e usuários com brand_id correspondente
- **restaurants_insert_policy**: Permite INSERT apenas para owners
- **restaurants_update_policy**: Permite UPDATE apenas para owners
- **restaurants_delete_policy**: Permite DELETE apenas para owners
