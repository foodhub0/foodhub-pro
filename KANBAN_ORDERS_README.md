# Sistema de Kanban de Pedidos 📊

Sistema completo de gerenciamento de pedidos com kanban board, notificações automáticas e arquivamento inteligente.

## Funcionalidades Principais

### 🎯 Kanban Board
- **5 Colunas de Status**:
  1. **Novo** (`pending`) - Pedidos recém-chegados
  2. **Preparando** (`preparing`) - Pedidos em preparo na cozinha
  3. **Aguardando Entregador** (`ready`) - Pedidos prontos para entrega
  4. **Saiu para Entrega** (`out_for_delivery`) - Pedidos em rota de entrega
  5. **Entregue** (`delivered`) - Pedidos finalizados

- **Drag & Drop**: Arraste pedidos entre as colunas para mudar o status
- **Atualização em Tempo Real**: Novos pedidos aparecem automaticamente
- **Indicadores Visuais**:
  - ⚠️ Pedidos urgentes (mais de 30 minutos) destacados em vermelho
  - ⏱️ Tempo decorrido desde a criação do pedido
  - 🛵 Tipo de pedido (Delivery/Retirada)

### 📱 Sistema de Notificações

Toda vez que um pedido muda de status, o cliente recebe notificações automáticas via:
- WhatsApp (configurável)
- Email (configurável)
- Push Notifications (configurável)

**Mensagens Automáticas por Status**:
- ✅ **Confirmado**: "Seu pedido foi confirmado e está sendo preparado com carinho!"
- 👨‍🍳 **Preparando**: "Seu pedido está sendo preparado agora! Em breve estará pronto."
- 📦 **Pronto**: "Seu pedido está pronto! Aguardando o entregador..."
- 🛵 **Saiu para Entrega**: "Seu pedido saiu para entrega! Logo chegará até você."
- 🎉 **Entregue**: "Seu pedido foi entregue! Bom apetite!"

### 🗄️ Arquivamento Automático

- Pedidos entregues são **arquivados automaticamente após 30 minutos**
- Pedidos arquivados **não aparecem mais no kanban**
- Histórico completo mantido no banco de dados
- Possibilidade de consultar pedidos antigos

### 📊 Histórico de Mudanças

Toda mudança de status é registrada em `order_status_history`:
- Status anterior
- Novo status
- Quem alterou
- Data e hora da mudança
- Notas adicionais

## Estrutura do Banco de Dados

### Novas Tabelas Criadas

#### 1. `order_status_history`
```sql
- id: UUID
- order_id: UUID (referência para orders)
- old_status: TEXT
- new_status: TEXT
- changed_by: UUID (usuário que fez a mudança)
- notes: TEXT
- created_at: TIMESTAMP
```

#### 2. `order_notifications`
```sql
- id: UUID
- order_id: UUID
- customer_phone: TEXT
- customer_email: TEXT
- notification_type: TEXT
- status: TEXT
- message: TEXT
- sent_at: TIMESTAMP
- is_sent: BOOLEAN
- error: TEXT
```

#### 3. Colunas Adicionadas em `orders`
```sql
- is_archived: BOOLEAN (default: false)
- archived_at: TIMESTAMP
```

### Funções do Banco de Dados

#### `log_order_status_change()`
- Trigger automático ao atualizar pedido
- Registra histórico de mudanças
- Cria notificações para o cliente

#### `archive_old_delivered_orders()`
- Arquiva pedidos entregues há mais de 30 minutos
- Retorna quantidade de pedidos arquivados
- Executada automaticamente a cada minuto

## Como Usar

### 1. Aplicar Migration

Execute a migration no Supabase:
```bash
# Via Supabase CLI
supabase db push

# Ou execute manualmente no SQL Editor
# Arquivo: supabase/migrations/20251117_add_order_history_and_archive.sql
```

### 2. Acessar o Kanban

Acesse `/orders` no dashboard do restaurante.

### 3. Gerenciar Pedidos

- **Arrastar e Soltar**: Clique e arraste um pedido para outra coluna
- **Atualizar Manualmente**: Clique no botão "Atualizar" no topo da página
- **Ver Detalhes**: Card mostra nome, telefone, endereço, itens e valor total

### 4. Configurar Notificações (Produção)

#### WhatsApp Business API
```typescript
// src/utils/orderNotifications.ts
export const sendWhatsAppNotification = async (notification) => {
  const response = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_ID/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: notification.customerPhone,
      text: { body: notification.message },
    }),
  });
  return response.json();
};
```

#### Email via SendGrid
```typescript
export const sendEmailNotification = async (notification) => {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  await sgMail.send({
    to: notification.customerEmail,
    from: 'pedidos@seurestaurante.com',
    subject: `Atualização do Pedido #${notification.orderId}`,
    html: `<p>${notification.message}</p>`,
  });
};
```

## Funcionalidades Futuras

- [ ] Filtros por tipo de pedido, período, status
- [ ] Busca de pedidos por nome/telefone
- [ ] Relatórios de tempo médio por status
- [ ] Notificações desktop para restaurante
- [ ] Integração com impressora térmica
- [ ] Chat com cliente
- [ ] Rastreamento em tempo real (GPS)

## Troubleshooting

### Pedidos não aparecem no Kanban
- Verifique se a migration foi aplicada
- Confirme que `is_archived = false`
- Verifique as policies RLS no Supabase

### Notificações não estão sendo enviadas
- Verifique os logs no console do navegador
- Configure as credenciais das APIs (WhatsApp, SendGrid)
- Implemente as funções em `orderNotifications.ts`

### Arquivamento não funciona
- Verifique se a função `archive_old_delivered_orders()` existe
- Confirme que pedidos têm `completed_at` preenchido
- Verifique o interval de 1 minuto no componente

## Suporte

Para dúvidas ou problemas, consulte:
- Documentação do Supabase: https://supabase.com/docs
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- SendGrid: https://sendgrid.com/docs
