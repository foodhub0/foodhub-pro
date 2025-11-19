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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table as TableIcon,
  Plus,
  ShoppingCart,
  Check,
  Users,
  Utensils,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  is_available: boolean;
}

interface Product {
  id: string;
  name: string;
  base_price: number;
  category_id: string;
  image_url: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

interface ActiveOrder {
  id: string;
  table_number: number;
  total: number;
  status: string;
  created_at: string;
  items_count: number;
}

const WaiterOrders = () => {
  const { toast } = useToast();
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [showNewTableDialog, setShowNewTableDialog] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

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
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', resId)
        .order('table_number');

      if (tablesError) throw tablesError;
      setTables(tablesData || []);

      // Carregar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', resId)
        .eq('is_active', true)
        .order('display_order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Carregar produtos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', resId)
        .eq('is_active', true);

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Carregar pedidos ativos
      await loadActiveOrders(resId);
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

  const loadActiveOrders = async (resId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          status,
          created_at,
          tables!inner (
            table_number
          ),
          order_items (
            id
          )
        `)
        .eq('restaurant_id', resId)
        .eq('order_type', 'dine_in')
        .in('status', ['pending', 'confirmed', 'preparing'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders: ActiveOrder[] = (data || []).map((order: any) => ({
        id: order.id,
        table_number: order.tables?.table_number || 0,
        total: order.total || 0,
        status: order.status,
        created_at: order.created_at,
        items_count: order.order_items?.length || 0,
      }));

      setActiveOrders(formattedOrders);
    } catch (error) {
      console.error('Erro ao carregar pedidos ativos:', error);
    }
  };

  const handleCreateTable = async () => {
    if (!restaurantId || !newTableNumber) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tables')
        .insert({
          restaurant_id: restaurantId,
          table_number: parseInt(newTableNumber),
          capacity: parseInt(newTableCapacity),
          is_available: true,
        })
        .select()
        .single();

      if (error) throw error;

      setTables([...tables, data]);
      setShowNewTableDialog(false);
      setNewTableNumber('');
      setNewTableCapacity('4');

      toast({
        title: 'Sucesso',
        description: 'Mesa criada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao criar mesa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar mesa',
        variant: 'destructive',
      });
    }
  };

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }

    toast({
      title: 'Adicionado',
      description: `${product.name} adicionado ao pedido`,
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const handleCreateOrder = async () => {
    if (!restaurantId || !selectedTable || cart.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione uma mesa e adicione itens ao pedido',
        variant: 'destructive',
      });
      return;
    }

    if (!customerName) {
      toast({
        title: 'Erro',
        description: 'Digite o nome do cliente',
        variant: 'destructive',
      });
      return;
    }

    try {
      const subtotal = cart.reduce((sum, item) => sum + (item.product.base_price * item.quantity), 0);

      // Criar pedido
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          table_id: selectedTable.id,
          order_type: 'dine_in',
          status: 'pending',
          customer_name: customerName,
          customer_phone: customerPhone || null,
          subtotal,
          total: subtotal,
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar itens do pedido
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.base_price,
        total_price: item.product.base_price * item.quantity,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: 'Sucesso',
        description: 'Pedido criado com sucesso',
      });

      // Limpar carrinho e recarregar dados
      setCart([]);
      setSelectedTable(null);
      setCustomerName('');
      setCustomerPhone('');
      loadActiveOrders(restaurantId);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar pedido',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Novo', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmado', className: 'bg-blue-100 text-blue-800' },
      preparing: { label: 'Preparando', className: 'bg-purple-100 text-purple-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: '' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category_id === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.base_price * item.quantity), 0);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pedidos - Garçom</h1>
            <p className="text-muted-foreground">Gerencie pedidos de mesa facilmente</p>
          </div>
          <Button onClick={() => setShowNewTableDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Mesa
          </Button>
        </div>

        {/* Active Orders Summary */}
        {activeOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Pedidos Ativos ({activeOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                        <TableIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Mesa {order.table_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items_count} {order.items_count === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <p className="text-sm font-medium mt-1">
                        R$ {order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seleção de Mesa */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TableIcon className="h-5 w-5" />
                Selecione a Mesa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-2">
                  {tables.map((table) => {
                    const hasActiveOrder = activeOrders.some(o => o.table_number === table.table_number);
                    return (
                      <Button
                        key={table.id}
                        variant={selectedTable?.id === table.id ? 'default' : 'outline'}
                        className={cn(
                          'w-full justify-start h-auto py-3',
                          hasActiveOrder && 'border-orange-300 bg-orange-50 hover:bg-orange-100'
                        )}
                        onClick={() => handleSelectTable(table)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex items-center justify-center w-10 h-10 rounded-full',
                              selectedTable?.id === table.id
                                ? 'bg-primary-foreground/20'
                                : 'bg-muted'
                            )}>
                              <TableIcon className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">Mesa {table.table_number}</p>
                              <p className="text-xs opacity-70 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {table.capacity} pessoas
                              </p>
                            </div>
                          </div>
                          {hasActiveOrder && (
                            <Badge variant="secondary" className="bg-orange-500 text-white">
                              Ativo
                            </Badge>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Produtos */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Cardápio
                </CardTitle>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <Button
                      key={product.id}
                      variant="outline"
                      className="h-auto p-3 justify-start"
                      onClick={() => handleAddToCart(product)}
                      disabled={!selectedTable}
                    >
                      <div className="flex items-center gap-3 w-full">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                            <Utensils className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-primary font-semibold">
                            R$ {product.base_price.toFixed(2)}
                          </p>
                        </div>
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Carrinho */}
        {selectedTable && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Pedido - Mesa {selectedTable.table_number}
                </span>
                <span className="text-2xl font-bold text-primary">
                  R$ {cartTotal.toFixed(2)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informações do Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nome do Cliente *</Label>
                  <Input
                    id="customerName"
                    placeholder="Digite o nome"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Telefone (opcional)</Label>
                  <Input
                    id="customerPhone"
                    placeholder="(00) 00000-0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Itens do Carrinho */}
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm">Selecione produtos do cardápio</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {item.product.base_price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 border rounded-lg">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <p className="font-bold w-24 text-right">
                          R$ {(item.product.base_price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botão Finalizar */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleCreateOrder}
                disabled={cart.length === 0 || !customerName}
              >
                <Check className="mr-2 h-5 w-5" />
                Enviar Pedido para Cozinha
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialog Nova Mesa */}
        <Dialog open={showNewTableDialog} onOpenChange={setShowNewTableDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Mesa</DialogTitle>
              <DialogDescription>
                Adicione uma nova mesa ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Número da Mesa *</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  placeholder="Ex: 10"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade (pessoas) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="Ex: 4"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTableDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTable}>
                Criar Mesa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default WaiterOrders;
