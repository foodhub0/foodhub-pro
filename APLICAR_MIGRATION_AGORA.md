# 🚀 APLICAR MIGRATION AGORA - PASSO A PASSO

## Método 1: Via Dashboard (RECOMENDADO - 2 minutos)

### Passo 1: Acesse o SQL Editor
```
https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql/new
```

### Passo 2: Cole o SQL

Abra o arquivo:
```
supabase/migrations/20251119_restructure_products_system.sql
```

**CTRL+A** → **CTRL+C** (copiar TUDO)

### Passo 3: Execute

No SQL Editor do Supabase:
1. Cole o SQL copiado
2. Clique em **RUN** (ou **CTRL+ENTER**)
3. Aguarde 5-10 segundos

### Passo 4: Verifique

Execute este SQL para confirmar:
```sql
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

Deve retornar **4 tabelas**.

---

## Método 2: Via CLI (se tiver Supabase CLI instalado)

```bash
cd /home/user/foodhub-pro
supabase db push
```

---

## Método 3: Via psql (linha de comando)

```bash
cd /home/user/foodhub-pro

PGPASSWORD='QByHs8P5MMfKBUsH' psql \
  "postgresql://postgres.wisikawnpzrrfzqutatl:QByHs8P5MMfKBUsH@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -f supabase/migrations/20251119_restructure_products_system.sql
```

---

## ✅ Após Aplicar a Migration

Você verá:
- ✅ 4 novas tabelas criadas
- ✅ Dados migrados automaticamente de `product_variations` → `product_sizes`
- ✅ Tabelas antigas renomeadas para `*_old` (backup)
- ✅ RLS policies aplicadas
- ✅ Índices criados

---

## 🧪 Testar se Funcionou

No SQL Editor, execute:

```sql
-- Ver tamanhos migrados
SELECT * FROM product_sizes LIMIT 5;

-- Ver grupos de adicionais
SELECT * FROM product_addon_groups LIMIT 5;

-- Ver itens dos grupos
SELECT * FROM addon_group_items LIMIT 5;

-- Ver produtos com novo campo
SELECT id, name, has_sizes, base_price FROM products LIMIT 5;
```

---

## ⚠️ Em Caso de Erro

Se der erro de "tabela já existe":

```sql
-- Dropar tabelas
DROP TABLE IF EXISTS product_addon_group_links CASCADE;
DROP TABLE IF EXISTS addon_group_items CASCADE;
DROP TABLE IF EXISTS product_addon_groups CASCADE;
DROP TABLE IF EXISTS product_sizes CASCADE;

-- Depois execute a migration novamente
```

---

## 📞 Me Avise!

Depois de aplicar, me diga:
- ✅ "Migration aplicada com sucesso"
ou
- ❌ "Deu erro: [copie a mensagem de erro]"

Aí eu continuo com os próximos componentes! 🚀
