/**
 * Utilitário para envio de notificações de pedidos
 *
 * IMPORTANTE: Este é um exemplo básico. Em produção, você deve integrar com:
 * - WhatsApp Business API (para envio de mensagens)
 * - SendGrid/AWS SES (para envio de emails)
 * - Firebase Cloud Messaging (para notificações push)
 */

export interface OrderNotification {
  orderId: string;
  customerPhone: string;
  customerEmail?: string;
  status: string;
  message: string;
}

/**
 * Envia notificação via WhatsApp
 * Em produção, integrar com WhatsApp Business API
 */
export const sendWhatsAppNotification = async (notification: OrderNotification) => {
  console.log('📱 WhatsApp Notification:', {
    to: notification.customerPhone,
    message: notification.message,
  });

  // TODO: Integrar com WhatsApp Business API
  // Exemplo: https://developers.facebook.com/docs/whatsapp/cloud-api

  return { success: true, channel: 'whatsapp' };
};

/**
 * Envia notificação via Email
 * Em produção, integrar com SendGrid, AWS SES, ou similar
 */
export const sendEmailNotification = async (notification: OrderNotification) => {
  if (!notification.customerEmail) {
    return { success: false, error: 'No email provided' };
  }

  console.log('📧 Email Notification:', {
    to: notification.customerEmail,
    subject: `Atualização do seu pedido - ${notification.status}`,
    message: notification.message,
  });

  // TODO: Integrar com serviço de email
  // Exemplo SendGrid: https://sendgrid.com/docs/API_Reference/Web_API_v3/Mail/index.html
  // Exemplo AWS SES: https://docs.aws.amazon.com/ses/latest/dg/send-email-api.html

  return { success: true, channel: 'email' };
};

/**
 * Envia notificação push (para app mobile)
 * Em produção, integrar com Firebase Cloud Messaging
 */
export const sendPushNotification = async (notification: OrderNotification) => {
  console.log('🔔 Push Notification:', {
    title: 'Atualização do Pedido',
    body: notification.message,
  });

  // TODO: Integrar com Firebase Cloud Messaging
  // https://firebase.google.com/docs/cloud-messaging

  return { success: true, channel: 'push' };
};

/**
 * Envia todas as notificações disponíveis
 */
export const sendOrderNotifications = async (notification: OrderNotification) => {
  const results = await Promise.allSettled([
    sendWhatsAppNotification(notification),
    sendEmailNotification(notification),
    sendPushNotification(notification),
  ]);

  return {
    sent: results.filter(r => r.status === 'fulfilled'),
    failed: results.filter(r => r.status === 'rejected'),
  };
};

/**
 * Mensagens padrão por status
 */
export const getStatusMessage = (status: string, orderNumber?: string): string => {
  const messages: Record<string, string> = {
    pending: `🔔 Novo pedido recebido${orderNumber ? ` #${orderNumber}` : ''}! Aguardando confirmação.`,
    confirmed: `✅ Seu pedido foi confirmado e está sendo preparado com carinho!`,
    preparing: `👨‍🍳 Seu pedido está sendo preparado agora! Em breve estará pronto.`,
    ready: `📦 Seu pedido está pronto! Aguardando o entregador...`,
    out_for_delivery: `🛵 Seu pedido saiu para entrega! Logo chegará até você.`,
    delivered: `🎉 Seu pedido foi entregue! Bom apetite!`,
    cancelled: `❌ Seu pedido foi cancelado. Entre em contato para mais informações.`,
  };

  return messages[status] || `📱 Atualização do pedido: ${status}`;
};
