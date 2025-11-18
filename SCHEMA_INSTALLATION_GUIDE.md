# Guia de Instalação do Schema FoodHub Pro

## ⚠️ IMPORTANTE

Este schema é a versão **completa e limpa** do banco de dados FoodHub Pro. Execute-o no Supabase para resolver o erro de "Erro ao carregar pedidos" e ter uma base de dados 100% funcional.

---

## Passos para Instalação

### 1. Acesse o Supabase SQL Editor

1. Entre no seu projeto no [Supabase Dashboard](https://app.supabase.com/)
2. Navegue até a seção **SQL Editor** no menu lateral
3. Clique em **New Query**

### 2. Execute o Schema Completo

1. Abra o arquivo `COMPLETE_SCHEMA.sql`
2. **Copie TODO o conteúdo do arquivo**
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### 3. Aguarde a Execução

A execução pode levar de 10 a 30 segundos. Você verá uma mensagem de sucesso quando terminar.

---

## O que este Schema Faz?

### ✅ Cria todas as tabelas necessárias:

- **Restaurantes** (`restaurants`)
- **Categorias** (`categories`)
- **Produtos** (`products`)
- **Variações de Produtos** (`product_variations`)
- **Adicionais** (`additionals`)
- **Mesas** (`tables`)
- **Clientes** (`customers`)
- **Endereços de Entrega** (`delivery_addresses`)
- **Entregadores** (`couriers`)
- **Pedidos** (`orders`) ← **CORRIGIDO** com `order_number` e `total_amount`
- **Itens do Pedido** (`order_items`)
- **Adicionais do Item** (`order_item_additionals`)
- **Variações do Item** (`order_item_variations`)
- **Cupons** (`coupons`)
- **Movimentações de Estoque** (`inventory_movements`)
- **Avaliações** (`reviews`)

### ✅ Cria ENUMs:

- `order_status` (pending, confirmed, preparing, ready, out_for_delivery, delivered, cancelled)
- `order_type` (delivery, table, takeout)
- `payment_status` (pending, paid, refunded, failed)
- `courier_status` (available, busy, offline)

### ✅ Configura Índices:

Índices para melhorar a performance das consultas mais comuns.

### ✅ Configura RLS (Row Level Security):

Políticas de segurança para controlar quem pode ver/editar cada dado.

### ✅ Cria Triggers:

- **Geração automática de número de pedido** (formato: YYYYMMDD0001)
- **Atualização automática de timestamps** (`updated_at`)
- **Atualização automática de estatísticas de clientes**
- **Controle automático de estoque**

---

## Como Verificar se Funcionou?

### 1. Verificar Tabelas

No Supabase, vá em **Table Editor** e verifique se todas as tabelas foram criadas:

- restaurants
- categories
- products
- orders ← **Esta é a mais importante!**
- order_items
- customers
- etc.

### 2. Verificar Colunas da Tabela `orders`

Abra a tabela `orders` no Table Editor e confirme que existem as colunas:

- ✅ `id` (uuid)
- ✅ `order_number` (text)
- ✅ `order_type` (order_type enum)
- ✅ `status` (order_status enum)
- ✅ `total_amount` (numeric) ← **IMPORTANTE**
- ✅ `customer_name` (text)
- ✅ `created_at` (timestamptz)

### 3. Testar no App

1. Faça login no FoodHub
2. Acesse a aba **Pedidos**
3. Se não aparecer mais "Erro ao carregar pedidos", está funcionando! ✅

---

## Resolução de Problemas

### Erro: "relation already exists"

Se você receber erros dizendo que tabelas/funções já existem, não se preocupe! O schema usa `IF NOT EXISTS` e `DROP IF EXISTS` para evitar conflitos. Os erros podem ser ignorados.

### Erro: "permission denied"

Certifique-se de que você está executando o SQL como **admin** do projeto no Supabase.

### Pedidos ainda não carregam

1. Abra o **Console do navegador** (F12)
2. Vá na aba **Console**
3. Acesse a página de Pedidos
4. Veja se há erros específicos
5. Copie os erros e me envie para análise

---

## Próximos Passos

Após executar o schema com sucesso:

1. ✅ Erro de pedidos resolvido
2. ✅ Sistema de numeração automática de pedidos funcionando
3. ✅ Estatísticas de clientes atualizando automaticamente
4. ✅ Controle de estoque automático
5. ✅ Webhook para impressora configurável

---

## Suporte

Se encontrar qualquer problema:

1. Tire um print do erro
2. Copie a mensagem de erro completa
3. Me envie para análise

---

**Desenvolvido com 💙 para FoodHub Pro**
