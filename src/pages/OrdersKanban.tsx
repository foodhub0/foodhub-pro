import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Layout from '@/components/Layout';
import {
  Clock,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  CheckCircle2,
  Truck,
  ChefHat,
  Package,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  delivery_number: string | null;
  delivery_neighborhood: string | null;
  order_type: 'delivery' | 'pickup' | 'dine_in';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total: number;
  created_at: string;
  items?: OrderItem[];
}

const ORDER_STATUSES = [
  {
    id: 'pending',
    label: 'Novo',
    icon: AlertCircle,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    iconColor: 'text-yellow-600',
  },
  {
    id: 'preparing',
    label: 'Preparando',
    icon: ChefHat,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    iconColor: 'text-blue-600',
  },
  {
    id: 'ready',
    label: 'Aguardando Entregador',
    icon: Package,
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    iconColor: 'text-purple-600',
  },
  {
    id: 'out_for_delivery',
    label: 'Saiu para Entrega',
    icon: Truck,
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    iconColor: 'text-orange-600',
  },
  {
    id: 'delivered',
    label: 'Entregue',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800 border-green-300',
    iconColor: 'text-green-600',
  },
] as const;

const OrdersKanban = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    setupRealtimeSubscription();

    // Atualizar a cada 1 minuto para arquivar pedidos antigos
    const interval = setInterval(() => {
      archiveOldOrders();
    }, 60000); // 1 minuto

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadOrders = async () => {
    try {
      // Buscar restaurante do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!restaurant) {
        toast({
          title: 'Restaurante não encontrado',
          description: 'Configure seu restaurante primeiro',
          variant: 'destructive',
        });
        return;
      }

      setRestaurantId(restaurant.id);

      // Buscar pedidos (filtrando is_archived se existir, ou todos se não existir)
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .or('is_archived.is.null,is_archived.eq.false')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Erro ao carregar pedidos',
        description: 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const archiveOldOrders = async () => {
    try {
      const { data, error } = await supabase.rpc('archive_old_delivered_orders');
      if (error) throw error;
      if (data > 0) {
        loadOrders();
      }
    } catch (error) {
      console.error('Error archiving old orders:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Status atualizado!',
        description: `Pedido movido para: ${ORDER_STATUSES.find(s => s.id === newStatus)?.label}`,
      });

      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  const handleDragStart = (orderId: string) => {
    setDraggedOrder(orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (newStatus: string) => {
    if (draggedOrder) {
      updateOrderStatus(draggedOrder, newStatus);
      setDraggedOrder(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeElapsed = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005BFF]"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedidos em Andamento</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie todos os pedidos do seu restaurante
            </p>
          </div>
          <Button
            onClick={loadOrders}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {ORDER_STATUSES.map((statusConfig) => {
          const statusOrders = getOrdersByStatus(statusConfig.id);
          const Icon = statusConfig.icon;

          return (
            <div key={statusConfig.id} className="flex flex-col">
              {/* Column Header */}
              <div className={cn(
                'rounded-t-lg p-4 border-2',
                statusConfig.color
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-5 w-5', statusConfig.iconColor)} />
                    <h2 className="font-semibold text-sm">{statusConfig.label}</h2>
                  </div>
                  <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                    {statusOrders.length}
                  </Badge>
                </div>
              </div>

              {/* Column Content */}
              <ScrollArea
                className="flex-1 min-h-[600px] bg-gray-100 rounded-b-lg border-2 border-t-0 border-gray-200 p-2"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(statusConfig.id)}
              >
                <div className="space-y-3">
                  {statusOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Nenhum pedido
                    </div>
                  ) : (
                    statusOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onDragStart={handleDragStart}
                        isDragging={draggedOrder === order.id}
                        formatCurrency={formatCurrency}
                        formatTime={formatTime}
                        getTimeElapsed={getTimeElapsed}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
      </div>
    </Layout>
  );
};

interface OrderCardProps {
  order: Order;
  onDragStart: (orderId: string) => void;
  isDragging: boolean;
  formatCurrency: (value: number) => string;
  formatTime: (date: string) => string;
  getTimeElapsed: (createdAt: string) => string;
}

const OrderCard = ({
  order,
  onDragStart,
  isDragging,
  formatCurrency,
  formatTime,
  getTimeElapsed,
}: OrderCardProps) => {
  const timeElapsed = getTimeElapsed(order.created_at);
  const isUrgent = new Date(order.created_at).getTime() < Date.now() - 30 * 60000; // Mais de 30 minutos

  return (
    <Card
      draggable
      onDragStart={() => onDragStart(order.id)}
      className={cn(
        'p-4 cursor-move hover:shadow-lg transition-all duration-200',
        isDragging && 'opacity-50',
        isUrgent && 'border-2 border-red-400 shadow-red-100'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-semibold text-sm text-gray-900">
              {order.customer_name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone className="h-3 w-3" />
            <span>{order.customer_phone}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            isUrgent ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
          )}>
            {timeElapsed}
          </div>
          <div className="text-xs text-gray-500 mt-1">{formatTime(order.created_at)}</div>
        </div>
      </div>

      {/* Endereço (se for delivery) */}
      {order.order_type === 'delivery' && order.delivery_address && (
        <div className="flex items-start gap-2 mb-3 p-2 bg-blue-50 rounded-md">
          <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-blue-900">
            {order.delivery_address}, {order.delivery_number}
            {order.delivery_neighborhood && ` - ${order.delivery_neighborhood}`}
          </span>
        </div>
      )}

      {/* Tipo de pedido */}
      <div className="mb-3">
        <Badge variant="outline" className="text-xs">
          {order.order_type === 'delivery' ? '🛵 Delivery' : '🏪 Retirada'}
        </Badge>
      </div>

      {/* Itens */}
      {order.items && order.items.length > 0 && (
        <div className="mb-3 space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <ShoppingBag className="h-3 w-3" />
            <span>{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</span>
          </div>
          {order.items.slice(0, 2).map((item) => (
            <div key={item.id} className="text-xs text-gray-700">
              {item.quantity}x {item.product_name}
            </div>
          ))}
          {order.items.length > 2 && (
            <div className="text-xs text-gray-500">
              +{order.items.length - 2} {order.items.length - 2 === 1 ? 'outro' : 'outros'}
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="pt-3 border-t flex items-center justify-between">
        <span className="text-xs text-gray-500">Total</span>
        <span className="text-base font-bold text-[#005BFF]">
          {formatCurrency(order.total)}
        </span>
      </div>
    </Card>
  );
};

export default OrdersKanban;
