import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Package, Truck, Home } from 'lucide-react';

interface Order {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
}

interface Restaurant {
  name: string;
  phone: string | null;
  slug: string;
}

const OrderConfirmation = () => {
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;

    // Buscar pedido
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderData) {
      setOrder(orderData);

      // Buscar restaurante
      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('name, phone, slug')
        .eq('id', orderData.restaurant_id)
        .single();

      if (restaurantData) {
        setRestaurant(restaurantData);
      }
    }

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          text: 'Aguardando Confirmação',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        };
      case 'confirmed':
        return {
          icon: CheckCircle2,
          text: 'Confirmado',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'preparing':
        return {
          icon: Package,
          text: 'Em Preparação',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'ready':
        return {
          icon: CheckCircle2,
          text: 'Pronto',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'out_for_delivery':
        return {
          icon: Truck,
          text: 'Saiu para Entrega',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        };
      default:
        return {
          icon: Clock,
          text: 'Processando',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const getPaymentMethodText = (method: string) => {
    const methods: Record<string, string> = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      cash: 'Dinheiro',
    };
    return methods[method] || method;
  };

  const getOrderTypeText = (type: string) => {
    const types: Record<string, string> = {
      delivery: 'Entrega',
      pickup: 'Retirada',
      dine_in: 'No Local',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order || !restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido não encontrado</h1>
        <Button onClick={() => navigate(`/m/${slug}`)}>
          Voltar ao Cardápio
        </Button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="font-bold text-lg">{restaurant.name}</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Success Message */}
        <div className="text-center space-y-4 py-8">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pedido Realizado!
            </h2>
            <p className="text-gray-600">
              Seu pedido foi enviado para o restaurante
            </p>
          </div>
        </div>

        {/* Order Info */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm text-gray-500 mb-1">Número do Pedido</h3>
              <p className="font-mono font-bold text-lg">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <div className={`flex items-center gap-3 p-4 rounded-lg ${statusInfo.bgColor}`}>
              <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
              <div>
                <p className={`font-semibold ${statusInfo.color}`}>
                  {statusInfo.text}
                </p>
                <p className="text-sm text-gray-600">
                  Pedido realizado em {new Date(order.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500 mb-1">Tipo</p>
                <p className="font-semibold">{getOrderTypeText(order.order_type)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Pagamento</p>
                <p className="font-semibold">{getPaymentMethodText(order.payment_method)}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Info */}
        {restaurant.phone && (
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Precisa de ajuda?</h3>
            <p className="text-sm text-gray-600 mb-3">
              Entre em contato com o restaurante:
            </p>
            <a
              href={`https://wa.me/55${restaurant.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              {restaurant.phone}
            </a>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate(`/m/${slug}`)}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Home className="h-4 w-4 mr-2" />
            Voltar ao Cardápio
          </Button>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-gray-500 space-y-2 pt-4">
          <p>Guarde o número do seu pedido para acompanhamento</p>
          <p>O restaurante confirmará seu pedido em breve</p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
