# Como Aplicar a Migration Manualmente

## Opção 1: Via Supabase Dashboard (Mais Fácil)

1. Acesse: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**
4. Abra o arquivo `supabase/migrations/20251119_restructure_products_system.sql`
5. Copie TODO o conteúdo
6. Cole no SQL Editor
7. Clique em **Run** (ou Ctrl+Enter)
8. Aguarde a execução (pode demorar alguns segundos)
9. Verifique se aparecem mensagens de sucesso

## Opção 2: Via CLI do Supabase

```bash
# No terminal, no diretório do projeto:
supabase db push
```

## Opção 3: Via psql (Terminal)

```bash
# Substitua com sua senha do banco
PGPASSWORD='QByHs8P5MMfKBUsH' psql \
  -h db.wisikawnpzrrfzqutatl.supabase.co \
  -U postgres \
  -d postgres \
  -p 5432 \
  -f supabase/migrations/20251119_restructure_products_system.sql
```

## Como Verificar se Funcionou

Após aplicar a migration, execute no SQL Editor:

```sql
-- Verificar se as novas tabelas foram criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'product_sizes',
  'product_addon_groups',
  'addon_group_items',
  'product_addon_group_links'
);
```

Deve retornar 4 tabelas.

## Verificar Dados Migrados

```sql
-- Ver se dados foram migrados
SELECT COUNT(*) as total_sizes FROM product_sizes;
SELECT COUNT(*) as total_groups FROM product_addon_groups;
SELECT COUNT(*) as total_items FROM addon_group_items;
```

## Em Caso de Erro

Se der erro sobre tabelas já existentes:
```sql
-- Dropar as tabelas e tentar novamente
DROP TABLE IF EXISTS product_addon_group_links CASCADE;
DROP TABLE IF EXISTS addon_group_items CASCADE;
DROP TABLE IF EXISTS product_addon_groups CASCADE;
DROP TABLE IF EXISTS product_sizes CASCADE;
```

Depois execute a migration novamente.

## Backup das Tabelas Antigas

A migration renomeia automaticamente as tabelas antigas para:
- `product_variations_old`
- `additionals_old`
- `product_additionals_old`

Se quiser reverter a migration:
```sql
-- Dropar novas tabelas
DROP TABLE IF EXISTS product_addon_group_links CASCADE;
DROP TABLE IF EXISTS addon_group_items CASCADE;
DROP TABLE IF EXISTS product_addon_groups CASCADE;
DROP TABLE IF EXISTS product_sizes CASCADE;

-- Renomear antigas de volta
ALTER TABLE product_variations_old RENAME TO product_variations;
ALTER TABLE additionals_old RENAME TO additionals;
ALTER TABLE product_additionals_old RENAME TO product_additionals;

-- Remover campo has_sizes
ALTER TABLE products DROP COLUMN IF EXISTS has_sizes;
```

## Me avise quando terminar!

Depois de aplicar a migration, me avise para eu continuar com a implementação dos componentes.
