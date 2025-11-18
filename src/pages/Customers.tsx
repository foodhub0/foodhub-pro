import { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/Layout';
import { StatsCard } from '@/components/customers/StatsCard';
import { FilterTags, CustomerFilter } from '@/components/customers/FilterTags';
import { CustomerTable, Customer } from '@/components/customers/CustomerTable';
import { ImportCustomersModal } from '@/components/customers/ImportCustomersModal';
import { NewCustomerModal, NewCustomerData } from '@/components/customers/NewCustomerModal';
import { EditCustomerModal, EditCustomerData } from '@/components/customers/EditCustomerModal';
import { CustomerOrdersModal } from '@/components/customers/CustomerOrdersModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  UserPlus,
  UserCheck,
  AlertTriangle,
  UserX,
  Search,
  Upload,
  Plus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Função para determinar o status do cliente baseado nos dados
const getCustomerStatus = (totalOrders: number, lastOrderDate: string | null): 'new' | 'recurring' | 'at_risk' | 'inactive' => {
  if (totalOrders === 0 || totalOrders === 1) return 'new';

  if (!lastOrderDate) return 'inactive';

  const lastOrder = new Date(lastOrderDate);
  const now = new Date();
  const daysSinceLastOrder = Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLastOrder > 60) return 'inactive';
  if (daysSinceLastOrder > 30) return 'at_risk';
  if (totalOrders >= 2) return 'recurring';

  return 'new';
};

const Customers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CustomerFilter>('all');
  const [period, setPeriod] = useState('month');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Carregar clientes do banco de dados
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar dados do banco para o formato esperado
      const formattedCustomers: Customer[] = (data || []).map((customer) => {
        const totalOrders = customer.total_orders || 0;
        const totalSpent = customer.total_spent || 0;
        const lastOrder = customer.last_order_at || null;
        const status = getCustomerStatus(totalOrders, lastOrder);

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email || '',
          phone: customer.phone ? formatPhoneDisplay(customer.phone) : '',
          lastOrder: lastOrder || '',
          totalOrders,
          totalSpent,
          status,
        };
      });

      setCustomers(formattedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Erro ao carregar clientes',
        description: 'Não foi possível carregar a lista de clientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    // Se já está formatado, retornar como está
    if (phone.includes('(') || phone.includes('-')) return phone;

    // Formatar telefone para exibição
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  // Filtrar e buscar clientes
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Filtro por categoria
      if (activeFilter !== 'all' && customer.status !== activeFilter) {
        return false;
      }

      // Busca por nome, email ou telefone
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          customer.phone.includes(query)
        );
      }

      return true;
    });
  }, [customers, activeFilter, searchQuery]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = customers.length;
    const newCustomers = customers.filter((c) => c.status === 'new').length;
    const recurring = customers.filter((c) => c.status === 'recurring').length;
    const atRisk = customers.filter((c) => c.status === 'at_risk').length;
    const inactive = customers.filter((c) => c.status === 'inactive').length;

    const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageTicket = total > 0 ? totalRevenue / totalOrders : 0;
    const averageRecurrence = total > 0 ? totalOrders / total : 0;

    return {
      total,
      newCustomers,
      recurring,
      atRisk,
      inactive,
      totalOrders,
      totalRevenue,
      averageTicket,
      averageRecurrence,
    };
  }, [customers]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      // Pular o cabeçalho (primeira linha)
      const dataLines = lines.slice(1);

      const customersToImport = dataLines.map(line => {
        const [name, email, phone] = line.split(',').map(item => item.trim());
        return {
          name,
          email: email || null,
          phone: phone.replace(/\D/g, ''),
        };
      });

      // Inserir todos os clientes
      const { error } = await supabase
        .from('customers')
        .insert(customersToImport);

      if (error) throw error;

      toast({
        title: 'Importação concluída!',
        description: `${customersToImport.length} clientes foram importados com sucesso`,
      });

      // Recarregar a lista de clientes
      loadCustomers();
    } catch (error) {
      console.error('Error importing customers:', error);
      toast({
        title: 'Erro na importação',
        description: 'Verifique o formato do arquivo e tente novamente',
        variant: 'destructive',
      });
    }
  };

  const handleNewCustomer = async (data: NewCustomerData) => {
    try {
      const { error } = await supabase
        .from('customers')
        .insert({
          name: data.name,
          email: data.email || null,
          phone: data.phone.replace(/\D/g, ''),
          address: data.address || null,
          city: data.city || null,
          zipcode: data.zipCode?.replace(/\D/g, '') || null,
        });

      if (error) throw error;

      toast({
        title: 'Cliente cadastrado!',
        description: 'O cliente foi adicionado com sucesso',
      });

      // Recarregar a lista de clientes
      loadCustomers();
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error; // Deixar o modal tratar o erro
    }
  };

  const handleEdit = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async (customerId: string, data: EditCustomerData) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: data.name,
          email: data.email || null,
          phone: data.phone.replace(/\D/g, ''),
          address: data.address || null,
          city: data.city || null,
          zipcode: data.zipCode?.replace(/\D/g, '') || null,
        })
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: 'Cliente atualizado!',
        description: 'Os dados do cliente foram atualizados com sucesso',
      });

      // Recarregar a lista de clientes
      loadCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const handleDelete = async (customer: Customer) => {
    // Confirmar antes de deletar
    if (!window.confirm(`Tem certeza que deseja excluir ${customer.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id);

      if (error) throw error;

      toast({
        title: 'Cliente excluído',
        description: `${customer.name} foi removido com sucesso`,
      });

      // Recarregar a lista de clientes
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Erro ao excluir cliente',
        description: 'Não foi possível excluir o cliente. Ele pode ter pedidos associados.',
        variant: 'destructive',
      });
    }
  };

  const handleViewOrders = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsOrdersModalOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando clientes...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6 bg-[#F7F9FC] min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Gestão de Clientes</h1>
            <p className="text-gray-600">Gerencie seus clientes e acompanhe o desempenho</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filtro de Período */}
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Neste mês</SelectItem>
                <SelectItem value="quarter">Neste trimestre</SelectItem>
                <SelectItem value="year">Neste ano</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
              className="border-gray-300 hover:bg-gray-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>

            <Button
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="bg-[#007BFF] hover:bg-[#0056D2]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total de Clientes"
            value={stats.total}
            icon={Users}
            variant="primary"
            trend={{ value: '+12%', isPositive: true }}
          />
          <StatsCard
            title="Total de Pedidos"
            value={stats.totalOrders}
            icon={ShoppingCart}
            variant="default"
          />
          <StatsCard
            title="Ticket Médio"
            value={formatCurrency(stats.averageTicket)}
            icon={DollarSign}
            variant="success"
            trend={{ value: '+8%', isPositive: true }}
          />
          <StatsCard
            title="Recorrência Média"
            value={`${stats.averageRecurrence.toFixed(1)}x`}
            icon={TrendingUp}
            variant="default"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Novos"
            value={stats.newCustomers}
            icon={UserPlus}
            variant="success"
            description="Primeira compra registrada"
          />
          <StatsCard
            title="Recorrentes"
            value={stats.recurring}
            icon={UserCheck}
            variant="primary"
            description={`Mais de uma compra no período. Recorrência média: ${stats.averageRecurrence.toFixed(1)}x`}
          />
          <StatsCard
            title="Em Risco"
            value={stats.atRisk}
            icon={AlertTriangle}
            variant="warning"
            description="Não compraram no período"
          />
          <StatsCard
            title="Inativos"
            value={stats.inactive}
            icon={UserX}
            variant="danger"
            description="Não compram há 2 meses"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <FilterTags
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={{
                all: customers.length,
                new: stats.newCustomers,
                recurring: stats.recurring,
                at_risk: stats.atRisk,
                inactive: stats.inactive,
              }}
            />

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar cliente, email ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#007BFF] focus:ring-[#007BFF]"
              />
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <CustomerTable
          customers={filteredCustomers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewOrders={handleViewOrders}
        />

        {/* Modals */}
        <ImportCustomersModal
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          onImport={handleImport}
        />

        <NewCustomerModal
          open={isNewCustomerModalOpen}
          onOpenChange={setIsNewCustomerModalOpen}
          onSave={handleNewCustomer}
        />

        <EditCustomerModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSave={handleUpdateCustomer}
          customer={selectedCustomer}
        />

        <CustomerOrdersModal
          open={isOrdersModalOpen}
          onOpenChange={setIsOrdersModalOpen}
          customer={selectedCustomer}
        />
      </div>
    </Layout>
  );
};

export default Customers;
