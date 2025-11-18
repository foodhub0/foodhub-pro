# FoodHub - Integração com Impressora Térmica

## Visão Geral

Sistema de webhook para enviar pedidos automaticamente para impressoras térmicas ESC/POS (Epson, Bematech, Elgin, etc).

---

## Como Funciona

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│   Cliente   │ ──────> │   FoodHub    │ ──────> │ Impressora │
│   (App/Web) │  Pedido │   (Backend)  │ Webhook │  Térmica   │
└─────────────┘         └──────────────┘         └────────────┘
```

1. Cliente realiza pedido no cardápio
2. FoodHub salva o pedido no banco de dados
3. FoodHub envia webhook para servidor da impressora
4. Servidor da impressora recebe e imprime automaticamente

---

## Configuração

### 1. Configurar URL do Webhook

No painel admin do FoodHub, configure a URL da sua impressora:

```http
PATCH /restaurants/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "webhook_url": "http://192.168.1.100:3000/print",
  "webhook_secret": "sua-chave-secreta-aqui"
}
```

### 2. Servidor Local da Impressora

Crie um servidor local (Node.js, Python, etc) que receberá os webhooks:

#### Exemplo Node.js

```javascript
const express = require('express');
const escpos = require('escpos');
const escposUSB = require('escpos-usb');

const app = express();
app.use(express.json());

// Endpoint para receber webhooks
app.post('/print', async (req, res) => {
  try {
    const { data } = req.body;
    const order = data.order;

    // Conectar com impressora USB
    const device = new escposUSB();
    const printer = new escpos.Printer(device);

    device.open(function(error){
      if(error) {
        console.error('Erro ao abrir impressora:', error);
        return res.status(500).json({ error: 'Printer error' });
      }

      // Imprimir pedido
      printer
        .font('a')
        .align('ct')
        .style('bu')
        .size(1, 1)
        .text('MEU RESTAURANTE')
        .text('========================================')
        .style('normal')
        .text(`Pedido: #${order.order_number}`)
        .text(`Data: ${formatDate(order.created_at)}`)
        .text('----------------------------------------')
        .align('lt')
        .text('CLIENTE')
        .text('----------------------------------------')
        .text(`Nome: ${order.customer.name}`)
        .text(`Tel: ${formatPhone(order.customer.phone)}`)
        .text('')
        .text('----------------------------------------')
        .text('ENTREGA')
        .text('----------------------------------------')
        .text(`${order.delivery.address}, ${order.delivery.number}`)
        .text(`${order.delivery.neighborhood}`)
        .text(`${order.delivery.city} - ${order.delivery.state}`)
        .text(`CEP: ${formatCEP(order.delivery.zipcode)}`)
        .text('')
        .text('----------------------------------------')
        .text('ITENS')
        .text('----------------------------------------');

      // Itens do pedido
      order.items.forEach(item => {
        printer
          .text(`${item.quantity}x ${item.product_name}`)
          .text(`                      R$ ${item.total_price.toFixed(2)}`);
        if(item.notes) {
          printer.text(`   Obs: ${item.notes}`);
        }
      });

      // Total
      printer
        .text('----------------------------------------')
        .text('VALORES')
        .text('----------------------------------------')
        .text(`Subtotal:             R$ ${order.values.subtotal.toFixed(2)}`)
        .text(`Taxa de entrega:      R$ ${order.values.delivery_fee.toFixed(2)}`)
        .text(`Desconto:             R$ ${order.values.discount.toFixed(2)}`)
        .text('----------------------------------------')
        .size(2, 2)
        .text(`TOTAL:   R$ ${order.values.total.toFixed(2)}`)
        .size(1, 1)
        .text('========================================')
        .text('')
        .text(`Pagamento: ${getPaymentMethod(order.payment.method)}`)
        .text('')
        .feed(3)
        .cut()
        .close();

      res.json({
        received: true,
        printed: true,
        printer_id: 'USB_PRINTER_001'
      });
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Funções auxiliares
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR');
}

function formatPhone(phone) {
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

function formatCEP(cep) {
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
}

function getPaymentMethod(method) {
  const methods = {
    'pix': 'PIX',
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito',
    'cash': 'Dinheiro'
  };
  return methods[method] || method;
}

app.listen(3000, () => {
  console.log('Servidor de impressão rodando na porta 3000');
});
```

#### Exemplo Python (Flask)

```python
from flask import Flask, request, jsonify
from escpos.printer import Usb
from datetime import datetime

app = Flask(__name__)

@app.route('/print', methods=['POST'])
def print_order():
    try:
        data = request.json['data']
        order = data['order']

        # Conectar impressora USB (ajustar vendor_id e product_id)
        p = Usb(0x04b8, 0x0202)

        # Cabeçalho
        p.set(align='center', text_type='B')
        p.text('MEU RESTAURANTE\n')
        p.text('=' * 40 + '\n')
        p.set(align='left', text_type='normal')
        p.text(f"Pedido: #{order['order_number']}\n")
        p.text(f"Data: {format_date(order['created_at'])}\n\n")

        # Cliente
        p.text('-' * 40 + '\n')
        p.text('CLIENTE\n')
        p.text('-' * 40 + '\n')
        p.text(f"Nome: {order['customer']['name']}\n")
        p.text(f"Tel: {format_phone(order['customer']['phone'])}\n\n")

        # Entrega
        p.text('-' * 40 + '\n')
        p.text('ENTREGA\n')
        p.text('-' * 40 + '\n')
        delivery = order['delivery']
        p.text(f"{delivery['address']}, {delivery['number']}\n")
        p.text(f"{delivery['neighborhood']}\n")
        p.text(f"{delivery['city']} - {delivery['state']}\n")
        p.text(f"CEP: {format_cep(delivery['zipcode'])}\n\n")

        # Itens
        p.text('-' * 40 + '\n')
        p.text('ITENS\n')
        p.text('-' * 40 + '\n')
        for item in order['items']:
            p.text(f"{item['quantity']}x {item['product_name']}\n")
            p.text(f"                  R$ {item['total_price']:.2f}\n")
            if item.get('notes'):
                p.text(f"   Obs: {item['notes']}\n")

        # Total
        p.text('-' * 40 + '\n')
        p.text('VALORES\n')
        p.text('-' * 40 + '\n')
        values = order['values']
        p.text(f"Subtotal:          R$ {values['subtotal']:.2f}\n")
        p.text(f"Taxa de entrega:   R$ {values['delivery_fee']:.2f}\n")
        p.text(f"Desconto:          R$ {values['discount']:.2f}\n")
        p.text('-' * 40 + '\n')
        p.set(width=2, height=2)
        p.text(f"TOTAL: R$ {values['total']:.2f}\n")
        p.set(width=1, height=1)
        p.text('=' * 40 + '\n\n')

        # Pagamento
        payment_method = get_payment_method(order['payment']['method'])
        p.text(f"Pagamento: {payment_method}\n\n")

        # Finalizar
        p.cut()
        p.close()

        return jsonify({
            'received': True,
            'printed': True,
            'printer_id': 'USB_PRINTER_001'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def format_date(date_str):
    dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    return dt.strftime('%d/%m/%Y %H:%M')

def format_phone(phone):
    return f"({phone[:2]}) {phone[2:7]}-{phone[7:]}"

def format_cep(cep):
    return f"{cep[:5]}-{cep[5:]}"

def get_payment_method(method):
    methods = {
        'pix': 'PIX',
        'credit_card': 'Cartão de Crédito',
        'debit_card': 'Cartão de Débito',
        'cash': 'Dinheiro'
    }
    return methods.get(method, method)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
```

---

## Payload do Webhook

```json
{
  "event": "order.created",
  "timestamp": "2025-11-18T14:30:00Z",
  "data": {
    "order": {
      "id": "uuid",
      "order_number": "202511180001",
      "restaurant": {
        "name": "Meu Restaurante",
        "phone": "11988888888"
      },
      "customer": {
        "name": "João Silva",
        "phone": "11999999999",
        "email": "joao@email.com"
      },
      "delivery": {
        "address": "Rua A",
        "number": "123",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zipcode": "01234567",
        "instructions": "Portão azul"
      },
      "order_type": "delivery",
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
          "notes": "Sem cebola"
        }
      ],
      "notes": "Cliente preferencial",
      "created_at": "2025-11-18T14:30:00Z"
    }
  }
}
```

---

## Segurança

### Validar Assinatura

Valide a assinatura HMAC para garantir que o webhook veio do FoodHub:

```javascript
const crypto = require('crypto');

function validateSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return `sha256=${hash}` === signature;
}

app.post('/print', (req, res) => {
  const signature = req.headers['x-foodhub-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!validateSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Processar pedido...
});
```

---

## Modelos de Impressora Compatíveis

### ESC/POS (Padrão)
- Epson TM-T20, TM-T81, TM-T88
- Bematech MP-4200 TH
- Elgin i9
- Daruma DR-800
- Sweda SI-300

### Configuração USB

#### Linux
```bash
# Verificar impressora conectada
lsusb

# Dar permissão
sudo chmod 666 /dev/usb/lp0
```

#### Windows
- Instalar driver da impressora
- Usar biblioteca `escpos-usb` ou `node-thermal-printer`

#### macOS
```bash
# Verificar impressora
system_profiler SPUSBDataType
```

---

## Troubleshooting

### Impressora não detectada
```bash
# Linux - verificar dispositivos USB
lsusb

# Ver logs
dmesg | grep usb
```

### Erro de permissão
```bash
# Adicionar usuário ao grupo
sudo usermod -a -G lp $USER

# Recarregar grupos
newgrp lp
```

### Teste de impressão
```javascript
const escpos = require('escpos');
const escposUSB = require('escpos-usb');

const device = new escposUSB();
const printer = new escpos.Printer(device);

device.open(function(){
  printer
    .text('Teste de impressão')
    .text('FoodHub Printer System')
    .cut()
    .close();
});
```

---

## Recursos Adicionais

### Bibliotecas Recomendadas

**Node.js**:
- `escpos` - ESC/POS printer driver
- `node-thermal-printer` - Thermal printer library
- `escpos-usb` - USB adapter

**Python**:
- `python-escpos` - ESC/POS printer library
- `pyusb` - USB access

**Instalação**:
```bash
# Node.js
npm install escpos escpos-usb express

# Python
pip install python-escpos pyusb
```

---

## Suporte

Dúvidas ou problemas:
- Email: suporte@foodhub.com
- GitHub: https://github.com/foodhub/printer-integration
- Documentação: https://docs.foodhub.com/printer
