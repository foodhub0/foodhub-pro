# FoodHub API Documentation

## Visão Geral

API REST para gerenciamento de restaurantes, pedidos, produtos e cardápios digitais.

**Base URL**: `https://your-supabase-project.supabase.co/rest/v1`
**Autenticação**: Bearer Token (JWT)
**Formato**: JSON

---

## Autenticação

### Login
```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Resposta**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "email": "usuario@email.com"
  }
}
```

### Headers para requests autenticados
```http
Authorization: Bearer {access_token}
apikey: {supabase_anon_key}
```

---

## Endpoints

### 1. Restaurantes

#### Obter restaurante
```http
GET /restaurants?owner_id=eq.{user_id}
Authorization: Bearer {token}
```

**Resposta**:
```json
{
  "id": "uuid",
  "name": "Meu Restaurante",
  "slug": "meu-restaurante",
  "phone": "11999999999",
  "email": "contato@restaurante.com",
  "logo_url": "https://...",
  "cover_url": "https://...",
  "address": "Rua Example, 123",
  "city": "São Paulo",
  "state": "SP",
  "zip_code": "01234-567",
  "delivery_fee": 5.00,
  "delivery_time_estimate": 30,
  "pickup_time_estimate": 20,
  "is_open": true,
  "created_at": "2025-11-18T10:00:00Z"
}
```

#### Atualizar status da loja
```http
PATCH /restaurants?id=eq.{restaurant_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_open": false
}
```

#### Atualizar prazos
```http
PATCH /restaurants?id=eq.{restaurant_id}
Content-Type: application/json

{
  "delivery_time_estimate": 45,
  "pickup_time_estimate": 25
}
```

---

### 2. Produtos

#### Listar produtos
```http
GET /products?restaurant_id=eq.{restaurant_id}&is_active=eq.true
```

**Resposta**:
```json
[
  {
    "id": "uuid",
    "restaurant_id": "uuid",
    "category_id": "uuid",
    "name": "Pizza Margherita",
    "description": "Molho de tomate, mussarela e manjericão",
    "image_url": "https://...",
    "base_price": 35.00,
    "price": 35.00,
    "is_active": true,
    "is_featured": true,
    "created_at": "2025-11-18T10:00:00Z"
  }
]
```

#### Criar produto
```http
POST /products
Content-Type: application/json

{
  "restaurant_id": "uuid",
  "category_id": "uuid",
  "name": "Pizza Calabresa",
  "description": "Molho, mussarela e calabresa",
  "base_price": 32.00,
  "is_active": true
}
```

---

### 3. Categorias

#### Listar categorias
```http
GET /categories?restaurant_id=eq.{restaurant_id}&is_active=eq.true&order=display_order.asc
```

**Resposta**:
```json
[
  {
    "id": "uuid",
    "restaurant_id": "uuid",
    "name": "Pizzas",
    "description": "Pizzas tradicionais",
    "display_order": 1,
    "is_active": true,
    "image_url": null
  }
]
```

---

### 4. Pedidos

#### Listar pedidos
```http
GET /orders?restaurant_id=eq.{restaurant_id}&order=created_at.desc&limit=50
```

**Resposta**:
```json
[
  {
    "id": "uuid",
    "restaurant_id": "uuid",
    "customer_id": "uuid",
    "order_number": "202511180001",
    "order_type": "delivery",
    "status": "pending",
    "customer_name": "João Silva",
    "customer_phone": "11999999999",
    "customer_email": "joao@email.com",
    "delivery_address": "Rua A, 123",
    "delivery_number": "123",
    "delivery_neighborhood": "Centro",
    "delivery_city": "São Paulo",
    "delivery_state": "SP",
    "delivery_zipcode": "01234567",
    "subtotal": 35.00,
    "delivery_fee": 5.00,
    "discount": 0.00,
    "total_amount": 40.00,
    "payment_method": "pix",
    "payment_status": "pending",
    "notes": "Sem cebola",
    "created_at": "2025-11-18T14:30:00Z"
  }
]
```

#### Criar pedido
```http
POST /orders
Content-Type: application/json

{
  "restaurant_id": "uuid",
  "customer_name": "João Silva",
  "customer_phone": "11999999999",
  "order_type": "delivery",
  "delivery_address": "Rua A, 123",
  "delivery_city": "São Paulo",
  "subtotal": 35.00,
  "delivery_fee": 5.00,
  "total_amount": 40.00,
  "payment_method": "pix",
  "notes": "Sem cebola"
}
```

#### Atualizar status do pedido
```http
PATCH /orders?id=eq.{order_id}
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Status possíveis**:
- `pending` - Aguardando confirmação
- `confirmed` - Confirmado
- `preparing` - Em preparação
- `ready` - Pronto
- `out_for_delivery` - Saiu para entrega
- `delivered` - Entregue
- `cancelled` - Cancelado

---

### 5. Itens do Pedido

#### Adicionar itens ao pedido
```http
POST /order_items
Content-Type: application/json

{
  "order_id": "uuid",
  "product_id": "uuid",
  "product_name": "Pizza Margherita",
  "quantity": 2,
  "unit_price": 35.00,
  "total_price": 70.00,
  "notes": "Borda recheada"
}
```

---

### 6. Clientes

#### Listar clientes
```http
GET /customers?order=created_at.desc
```

**Resposta**:
```json
[
  {
    "id": "uuid",
    "name": "João Silva",
    "phone": "11999999999",
    "email": "joao@email.com",
    "address": "Rua A, 123",
    "city": "São Paulo",
    "total_orders": 5,
    "total_spent": 250.00,
    "last_order_at": "2025-11-18T14:30:00Z",
    "created_at": "2025-10-01T10:00:00Z"
  }
]
```

---

### 7. Cardápio Público

#### Obter restaurante por slug (sem autenticação)
```http
GET /restaurants?slug=eq.{slug}
```

#### Obter produtos do cardápio (sem autenticação)
```http
GET /products?restaurant_id=eq.{restaurant_id}&is_active=eq.true
```

#### Obter categorias (sem autenticação)
```http
GET /categories?restaurant_id=eq.{restaurant_id}&is_active=eq.true
```

---

## Webhooks

### Webhook de Novo Pedido (Impressora)

Quando um novo pedido é criado, o sistema pode enviar um webhook para sua impressora.

#### Configuração
Configure a URL do webhook nas settings do restaurante:

```http
PATCH /restaurants?id=eq.{restaurant_id}
Content-Type: application/json

{
  "webhook_url": "https://sua-impressora.local/webhook"
}
```

#### Payload enviado ao webhook
```http
POST https://sua-impressora.local/webhook
Content-Type: application/json
X-FoodHub-Event: order.created
X-FoodHub-Signature: sha256=...

{
  "event": "order.created",
  "timestamp": "2025-11-18T14:30:00Z",
  "data": {
    "order": {
      "id": "uuid",
      "order_number": "202511180001",
      "restaurant": {
        "name": "Meu Restaurante",
        "phone": "11988888888",
        "address": "Rua Restaurant, 456"
      },
      "customer": {
        "name": "João Silva",
        "phone": "11999999999",
        "email": "joao@email.com"
      },
      "delivery": {
        "address": "Rua A, 123",
        "number": "123",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zipcode": "01234567",
        "instructions": "Portão azul"
      },
      "order_type": "delivery",
      "status": "pending",
      "payment": {
        "method": "pix",
        "status": "pending"
      },
      "values": {
        "subtotal": 35.00,
        "delivery_fee": 5.00,
        "discount": 0.00,
        "total": 40.00
      },
      "items": [
        {
          "id": "uuid",
          "product_name": "Pizza Margherita",
          "quantity": 1,
          "unit_price": 35.00,
          "total_price": 35.00,
          "notes": "Sem cebola",
          "variations": []
        }
      ],
      "notes": "Cliente preferencial",
      "created_at": "2025-11-18T14:30:00Z"
    }
  }
}
```

#### Formato para impressão
Exemplo de como formatar para impressão térmica (58mm):

```
========================================
        MEU RESTAURANTE
========================================
Pedido: #202511180001
Data: 18/11/2025 14:30

----------------------------------------
CLIENTE
----------------------------------------
Nome: João Silva
Tel: (11) 99999-9999
Email: joao@email.com

----------------------------------------
ENTREGA
----------------------------------------
Rua A, 123 - Centro
São Paulo - SP
CEP: 01234-567
Obs: Portão azul

----------------------------------------
ITENS
----------------------------------------
1x Pizza Margherita        R$ 35,00
   Obs: Sem cebola

----------------------------------------
VALORES
----------------------------------------
Subtotal:               R$ 35,00
Taxa de entrega:        R$  5,00
Desconto:               R$  0,00
----------------------------------------
TOTAL:                  R$ 40,00
========================================

Pagamento: PIX (Pendente)

Obs: Cliente preferencial

========================================
```

#### Resposta esperada
```json
{
  "received": true,
  "printed": true,
  "printer_id": "EPSON_TM_T20",
  "timestamp": "2025-11-18T14:30:05Z"
}
```

#### Eventos disponíveis
- `order.created` - Novo pedido criado
- `order.confirmed` - Pedido confirmado
- `order.cancelled` - Pedido cancelado
- `order.status_changed` - Status alterado

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 422 | Dados inválidos |
| 500 | Erro interno |

**Formato de erro**:
```json
{
  "error": "Descrição do erro",
  "details": "Detalhes adicionais",
  "code": "ERROR_CODE"
}
```

---

## Rate Limiting

- **Autenticado**: 100 requests/minuto
- **Público**: 30 requests/minuto

---

## Suporte

Para dúvidas ou suporte:
- Email: suporte@foodhub.com
- Documentação: https://docs.foodhub.com
- GitHub: https://github.com/foodhub/api
