import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  TableIcon,
  ShoppingBag,
  Printer,
  Phone,
  Mail,
  MapPin,
  Plus,
  CheckCircle2,
  Clock,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableData {
  id: string;
  table_number: number;
  capacity: number;
  is_available: boolean;
  qr_code: string | null;
}

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string | null;
  order_type: string;
  status: string;
  total: number;
  created_at: string;
  table_number?: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
}

const Reception = () => {
  const { toast } = useToast();
  const [tables, setTables] = useState<TableData[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tables');
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado',
          variant: 'destructive',
        });
        return;
      }

      const metadata = user.user_metadata || {};
      const resId = metadata.restaurant_id;

      if (!resId) {
        toast({
          title: 'Erro',
          description: 'Restaurante não encontrado',
          variant: 'destructive',
        });
        return;
      }

      setRestaurantId(resId);

      // Carregar mesas
      await loadTables(resId);

      // Carregar pedidos
      await loadOrders(resId);

      // Carregar clientes
      await loadCustomers(resId);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async (resId: string) => {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', resId)
      .order('table_number');

    if (error) throw error;
    setTables(data || []);
  };

  const loadOrders = async (resId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        customer_phone,
        order_type,
        status,
        total,
        created_at,
        tables (
          table_number
        )
      `)
      .eq('restaurant_id', resId)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const formattedOrders = (data || []).map((order: any) => ({
      id: order.id,
      order_number: order.order_number || 0,
      customer_name: order.customer_name || 'Cliente',
      customer_phone: order.customer_phone,
      order_type: order.order_type,
      status: order.status,
      total: order.total || 0,
      created_at: order.created_at,
      table_number: order.tables?.table_number,
    }));

    setOrders(formattedOrders);
  };

  const loadCustomers = async (resId: string) => {
    // Buscar clientes que fizeram pedidos neste restaurante
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('last_order_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Erro ao carregar clientes:', error);
      return;
    }

    setCustomers(data || []);
  };

  const handleToggleTableAvailability = async (table: TableData) => {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ is_available: !table.is_available })
        .eq('id', table.id);

      if (error) throw error;

      setTables(tables.map(t =>
        t.id === table.id
          ? { ...t, is_available: !t.is_available }
          : t
      ));

      toast({
        title: 'Sucesso',
        description: `Mesa ${table.table_number} ${!table.is_available ? 'disponibilizada' : 'ocupada'}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar mesa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status da mesa',
        variant: 'destructive',
      });
    }
  };

  const handlePrintOrder = (orderId: string) => {
    // Implementar integração com impressora
    toast({
      title: 'Impressão',
      description: 'Pedido enviado para impressão',
    });
    console.log('Imprimir pedido:', orderId);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast({
        title: 'Erro',
        description: 'Preencha nome e telefone do cliente',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCustomers([data, ...customers]);
      setShowNewCustomerDialog(false);
      setNewCustomer({ name: '', phone: '', email: '' });

      toast({
        title: 'Sucesso',
        description: 'Cliente cadastrado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao cadastrar cliente',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Novo', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmado', className: 'bg-blue-100 text-blue-800' },
      preparing: { label: 'Preparando', className: 'bg-purple-100 text-purple-800' },
      ready: { label: 'Pronto', className: 'bg-green-100 text-green-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getOrderTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; className: string }> = {
      dine_in: { label: 'Mesa', className: 'bg-blue-100 text-blue-800' },
      delivery: { label: 'Delivery', className: 'bg-orange-100 text-orange-800' },
      pickup: { label: 'Retirada', className: 'bg-purple-100 text-purple-800' },
    };

    const config = typeConfig[type] || { label: type, className: 'bg-gray-100 text-gray-800' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Recepção</h1>
          <p className="text-muted-foreground">
            Gerencie mesas, pedidos, clientes e impressões
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mesas Disponíveis</p>
                  <p className="text-2xl font-bold">
                    {tables.filter(t => t.is_available).length}/{tables.length}
                  </p>
                </div>
                <TableIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pedidos Ativos</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Clientes</p>
                  <p className="text-2xl font-bold">{customers.length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pedidos Prontos</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'ready').length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tables">
              <TableIcon className="mr-2 h-4 w-4" />
              Mesas
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="customers">
              <Users className="mr-2 h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="prints">
              <Printer className="mr-2 h-4 w-4" />
              Impressões
            </TabsTrigger>
          </TabsList>

          {/* Mesas Tab */}
          <TabsContent value="tables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Mesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {tables.map((table) => (
                    <Button
                      key={table.id}
                      variant="outline"
                      className={cn(
                        'h-32 flex flex-col items-center justify-center gap-2',
                        table.is_available
                          ? 'border-green-300 bg-green-50 hover:bg-green-100'
                          : 'border-red-300 bg-red-50 hover:bg-red-100'
                      )}
                      onClick={() => handleToggleTableAvailability(table)}
                    >
                      <TableIcon className={cn(
                        'h-8 w-8',
                        table.is_available ? 'text-green-600' : 'text-red-600'
                      )} />
                      <div className="text-center">
                        <p className="font-bold text-lg">Mesa {table.table_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {table.capacity} pessoas
                        </p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'mt-1',
                            table.is_available
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          )}
                        >
                          {table.is_available ? 'Disponível' : 'Ocupada'}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pedidos Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Mesa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.order_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customer_name}</p>
                            {order.customer_phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {order.customer_phone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getOrderTypeBadge(order.order_type)}</TableCell>
                        <TableCell>
                          {order.table_number ? `Mesa ${order.table_number}` : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="font-bold">
                          R$ {order.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(order.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintOrder(order.id)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clientes Tab */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Clientes Cadastrados</CardTitle>
                <Button onClick={() => setShowNewCustomerDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Total Pedidos</TableHead>
                      <TableHead>Total Gasto</TableHead>
                      <TableHead>Último Pedido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{customer.total_orders || 0}</TableCell>
                        <TableCell className="font-bold">
                          R$ {(customer.total_spent || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {customer.last_order_at ? formatDate(customer.last_order_at) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Impressões Tab */}
          <TabsContent value="prints" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fila de Impressão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Printer className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Fila de impressão vazia</p>
                  <p className="text-sm">
                    Os pedidos prontos para impressão aparecerão aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Novo Cliente */}
        <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
              <DialogDescription>
                Adicione um novo cliente ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nome *</Label>
                <Input
                  id="customerName"
                  placeholder="Nome completo"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Telefone *</Label>
                <Input
                  id="customerPhone"
                  placeholder="(00) 00000-0000"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email (opcional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewCustomerDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCustomer}>
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Reception;
