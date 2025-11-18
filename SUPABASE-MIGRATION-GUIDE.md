# 🗄️ Guia de Migração do Banco de Dados - Food Hub

## 📋 Visão Geral

Este documento explica as mudanças necessárias no banco de dados Supabase para conectar corretamente as tabelas de **Pedidos** e **Clientes**, além de implementar novas funcionalidades como **Taxa de Entrega por Raio**.

---

## 🎯 Problema Identificado

### ❌ Estrutura Antiga (Incorreta)

```
customers
├── user_id (FK → auth.users) ❌ ERRADO
├── name
├── phone
└── ...

orders
├── customer_id (FK → customers)
├── restaurant_id (FK → restaurants)
└── ...
```

**Problema:** Clientes estavam associados a `auth.users` (usuários autenticados do sistema), mas na verdade são **pessoas fazendo pedidos** que não precisam de conta no sistema.

### ✅ Estrutura Nova (Correta)

```
customers
├── restaurant_id (FK → restaurants) ✅ CORRETO
├── user_id (nullable, para uso futuro)
├── name
├── phone
└── ...

orders
├── customer_id (FK → customers)
├── restaurant_id (FK → restaurants)
└── ...
```

**Solução:** Clientes agora pertencem a **restaurantes** e são criados automaticamente quando fazem pedidos.

---

## 🚀 Como Aplicar a Migração

### Passo 1: Backup do Banco de Dados

⚠️ **IMPORTANTE:** Sempre faça backup antes de executar migrações!

```bash
# No painel do Supabase:
# Settings → Database → Backup → Create Backup
```

### Passo 2: Executar o SQL

1. Acesse o **SQL Editor** no Supabase
2. Cole todo o conteúdo do arquivo `supabase-schema-fixes.sql`
3. Clique em **Run** (ou pressione Ctrl+Enter)
4. Aguarde a execução completa
5. Verifique as mensagens de log no final

### Passo 3: Verificar Resultados

Ao final da execução, você verá uma mensagem como:

```
============================================================================
VERIFICAÇÃO FINAL DA MIGRAÇÃO
============================================================================
Clientes sem restaurant_id: 0
Pedidos sem customer_id: 0
STATUS: ✓ Migração concluída com sucesso!
============================================================================
```

---

## 📦 O Que Foi Alterado

### 1. **Tabela `customers`**

#### ➕ Colunas Adicionadas:
- `restaurant_id` (uuid, NOT NULL) - Associa cliente ao restaurante
- `addresses` (jsonb) - Array de endereços do cliente

#### 🔧 Colunas Modificadas:
- `user_id` - Agora é **nullable** (opcional)

#### 🔑 Constraints Adicionadas:
- `customers_restaurant_id_fkey` - Foreign key para `restaurants(id)`
- `customers_restaurant_phone_unique` - Um cliente por telefone/restaurante

#### 📊 Índices Criados:
- `idx_customers_restaurant_id` - Busca por restaurante
- `idx_customers_phone` - Busca por telefone
- `idx_customers_last_order` - Ordenação por último pedido
- `idx_customers_search` - Busca full-text (nome, telefone, email)

---

### 2. **Tabela `restaurants`**

#### ➕ Colunas Adicionadas:
- `delivery_zones` (jsonb) - Array de zonas de entrega
  ```json
  [
    {"id": "1", "radius": 3, "fee": 5.00},
    {"id": "2", "radius": 5, "fee": 8.00},
    {"id": "3", "radius": 10, "fee": 12.00}
  ]
  ```

- `delivery_mode` (text) - Modo de cálculo: `'fixed'` ou `'zones'`

---

### 3. **Triggers Automáticos**

#### 🤖 `trigger_auto_create_customer`
**Quando:** Antes de inserir um novo pedido
**Faz:**
1. Verifica se já existe cliente com o telefone informado no restaurante
2. Se não existe, cria automaticamente um novo registro em `customers`
3. Associa o pedido ao cliente (preenche `customer_id`)

**Resultado:** Você não precisa mais criar clientes manualmente!

---

#### 📈 `trigger_update_customer_stats`
**Quando:** Depois de inserir ou atualizar um pedido
**Faz:**
1. Atualiza `total_orders` (quantidade de pedidos)
2. Atualiza `total_spent` (valor total gasto)
3. Atualiza `average_ticket` (ticket médio)
4. Atualiza `last_order_at` (data do último pedido)

**Resultado:** Estatísticas sempre atualizadas automaticamente!

---

### 4. **Políticas RLS (Row Level Security)**

Novas policies criadas para segurança:

| Policy | Operação | Regra |
|--------|----------|-------|
| `Restaurants can view their customers` | SELECT | Restaurante vê apenas seus clientes |
| `Restaurants can insert customers` | INSERT | Restaurante pode criar clientes |
| `Restaurants can update their customers` | UPDATE | Restaurante pode atualizar seus clientes |
| `Restaurants can delete their customers` | DELETE | Restaurante pode deletar seus clientes |

**Todas as policies verificam:** `owner_id = auth.uid()`

---

### 5. **View: `customer_stats`**

Nova view para análise de clientes:

```sql
SELECT * FROM customer_stats;
```

**Colunas adicionais:**
- `customer_tier` - Classificação: `'Novo'`, `'Regular'`, `'Frequente'`, `'VIP'`
- `days_since_last_order` - Dias desde o último pedido
- `customer_status` - Status: `'Ativo'`, `'Inativo'`, `'Perdido'`

**Classificação:**
- **Novo:** 1 pedido
- **Regular:** 2-4 pedidos
- **Frequente:** 5-9 pedidos
- **VIP:** 10+ pedidos

**Status:**
- **Ativo:** Pediu nos últimos 30 dias
- **Inativo:** Pediu entre 30-90 dias atrás
- **Perdido:** Não pede há mais de 90 dias

---

## 💡 Como Usar

### Criar um Novo Pedido (Cliente Automático)

Basta inserir o pedido normalmente. O trigger criará o cliente automaticamente:

```sql
INSERT INTO orders (
    restaurant_id,
    customer_name,
    customer_phone,
    order_type,
    total,
    status
) VALUES (
    'uuid-do-restaurante',
    'João Silva',
    '11999998888',
    'delivery',
    45.90,
    'pending'
);
```

O sistema irá:
1. ✅ Verificar se já existe cliente com telefone `11999998888`
2. ✅ Criar novo cliente se não existir
3. ✅ Associar o pedido ao cliente
4. ✅ Atualizar estatísticas do cliente

---

### Configurar Zonas de Entrega

```sql
UPDATE restaurants
SET
    delivery_mode = 'zones',
    delivery_zones = '[
        {"id": "1", "radius": 3, "fee": 5.00},
        {"id": "2", "radius": 5, "fee": 8.00},
        {"id": "3", "radius": 10, "fee": 12.00}
    ]'::jsonb
WHERE id = 'uuid-do-restaurante';
```

---

### Consultar Estatísticas de Clientes

```sql
-- Clientes VIP do restaurante
SELECT *
FROM customer_stats
WHERE restaurant_id = 'uuid-do-restaurante'
  AND customer_tier = 'VIP'
ORDER BY total_spent DESC;

-- Clientes inativos (não pedem há 30-90 dias)
SELECT *
FROM customer_stats
WHERE restaurant_id = 'uuid-do-restaurante'
  AND customer_status = 'Inativo'
ORDER BY days_since_last_order DESC;

-- Top 10 clientes que mais gastaram
SELECT name, phone, total_spent, total_orders, average_ticket
FROM customer_stats
WHERE restaurant_id = 'uuid-do-restaurante'
ORDER BY total_spent DESC
LIMIT 10;
```

---

## 🔍 Verificações Pós-Migração

Execute estas queries para validar a migração:

### 1. Verificar se todos os clientes têm `restaurant_id`

```sql
SELECT COUNT(*) as clientes_sem_restaurante
FROM customers
WHERE restaurant_id IS NULL;
```

**Esperado:** `0`

---

### 2. Verificar se todos os pedidos têm `customer_id`

```sql
SELECT COUNT(*) as pedidos_sem_cliente
FROM orders
WHERE customer_id IS NULL;
```

**Esperado:** `0`

---

### 3. Validar constraints e foreign keys

```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'customers'
    AND tc.constraint_type = 'FOREIGN KEY';
```

**Esperado:** Deve mostrar `customers_restaurant_id_fkey`

---

### 4. Testar triggers

```sql
-- Inserir pedido de teste
INSERT INTO orders (
    restaurant_id,
    customer_name,
    customer_phone,
    order_type,
    total,
    status
) VALUES (
    (SELECT id FROM restaurants LIMIT 1),
    'Teste Trigger',
    '11000000000',
    'delivery',
    50.00,
    'pending'
) RETURNING id, customer_id;
```

**Esperado:** Deve retornar `customer_id` preenchido automaticamente

---

## 🐛 Troubleshooting

### Erro: "column restaurant_id does not exist"

**Causa:** Trigger executou antes da coluna ser criada
**Solução:** Execute o script completo novamente (é idempotente)

---

### Erro: "violates foreign key constraint"

**Causa:** Dados inconsistentes (pedidos com `restaurant_id` inválido)
**Solução:**
```sql
-- Identificar pedidos com restaurante inválido
SELECT o.* FROM orders o
LEFT JOIN restaurants r ON o.restaurant_id = r.id
WHERE r.id IS NULL;

-- Corrigir manualmente ou deletar
```

---

### Clientes duplicados após migração

**Causa:** Mesmo telefone usado em pedidos diferentes
**Solução:** A constraint `customers_restaurant_phone_unique` previne isso. Para dados antigos:

```sql
-- Encontrar duplicatas
SELECT restaurant_id, phone, COUNT(*)
FROM customers
GROUP BY restaurant_id, phone
HAVING COUNT(*) > 1;

-- Mesclar clientes duplicados (executar para cada par encontrado)
WITH merged AS (
    SELECT
        MIN(id) as keep_id,
        ARRAY_AGG(id) as all_ids
    FROM customers
    WHERE restaurant_id = 'uuid-restaurante'
      AND phone = '11999998888'
    GROUP BY restaurant_id, phone
)
UPDATE orders
SET customer_id = merged.keep_id
FROM merged
WHERE customer_id = ANY(merged.all_ids);

-- Deletar duplicatas
DELETE FROM customers
WHERE id IN (
    SELECT id FROM customers
    WHERE restaurant_id = 'uuid-restaurante'
      AND phone = '11999998888'
      AND id NOT IN (
          SELECT MIN(id) FROM customers
          WHERE restaurant_id = 'uuid-restaurante'
            AND phone = '11999998888'
      )
);
```

---

## 📚 Arquivos Relacionados

- `supabase-schema-fixes.sql` - Script de migração completo
- `src/components/DeliveryZoneConfig.tsx` - Componente React para gerenciar zonas
- `src/pages/Restaurant.tsx` - Página com configuração de delivery
- `src/pages/OrdersKanban.tsx` - Página de gestão de pedidos
- `src/pages/Customers.tsx` - Página de clientes (caso exista)

---

## ✅ Checklist Final

- [ ] Backup do banco criado
- [ ] SQL executado sem erros
- [ ] Verificação pós-migração passou (0 registros órfãos)
- [ ] Triggers testados e funcionando
- [ ] RLS policies aplicadas
- [ ] Frontend testado com novas zonas de entrega
- [ ] Clientes sendo criados automaticamente em novos pedidos

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do SQL Editor no Supabase
2. Execute as queries de verificação acima
3. Revise as mensagens de `RAISE NOTICE` no final do script
4. Consulte a documentação do Supabase: https://supabase.com/docs

---

**Data da migração:** 2025-11-18
**Versão do schema:** 2.0
**Compatibilidade:** Supabase PostgreSQL 15+
