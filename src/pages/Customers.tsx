import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { StatsCard } from '@/components/customers/StatsCard';
import { FilterTags, CustomerFilter } from '@/components/customers/FilterTags';
import { CustomerTable, Customer } from '@/components/customers/CustomerTable';
import { ImportCustomersModal } from '@/components/customers/ImportCustomersModal';
import { NewCustomerModal, NewCustomerData } from '@/components/customers/NewCustomerModal';
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

// Mock data - substituir por dados reais do backend
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    lastOrder: '2025-01-15',
    totalOrders: 12,
    totalSpent: 850.50,
    status: 'recurring',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@email.com',
    phone: '(11) 98888-8888',
    lastOrder: '2025-01-18',
    totalOrders: 1,
    totalSpent: 75.00,
    status: 'new',
  },
  {
    id: '3',
    name: 'Pedro Oliveira',
    email: 'pedro@email.com',
    phone: '(11) 97777-7777',
    lastOrder: '2024-12-10',
    totalOrders: 5,
    totalSpent: 320.00,
    status: 'at_risk',
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana@email.com',
    phone: '(11) 96666-6666',
    lastOrder: '2024-11-05',
    totalOrders: 8,
    totalSpent: 450.00,
    status: 'inactive',
  },
  {
    id: '5',
    name: 'Carlos Ferreira',
    email: 'carlos@email.com',
    phone: '(11) 95555-5555',
    lastOrder: '2025-01-16',
    totalOrders: 25,
    totalSpent: 1850.00,
    status: 'recurring',
  },
];

const Customers = () => {
  const { toast } = useToast();
  const [customers] = useState<Customer[]>(mockCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CustomerFilter>('all');
  const [period, setPeriod] = useState('month');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

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
    // Implementar lógica de importação
    console.log('Importing file:', file);
    // Simular delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const handleNewCustomer = async (data: NewCustomerData) => {
    // Implementar lógica de cadastro
    console.log('New customer:', data);
    // Simular delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleEdit = (customer: Customer) => {
    toast({
      title: 'Editar cliente',
      description: `Edição de ${customer.name} (Em desenvolvimento)`,
    });
  };

  const handleDelete = (customer: Customer) => {
    toast({
      title: 'Excluir cliente',
      description: `Exclusão de ${customer.name} (Em desenvolvimento)`,
      variant: 'destructive',
    });
  };

  const handleViewOrders = (customer: Customer) => {
    toast({
      title: 'Ver pedidos',
      description: `Visualizando pedidos de ${customer.name} (Em desenvolvimento)`,
    });
  };

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
          />
          <StatsCard
            title="Recorrentes"
            value={stats.recurring}
            icon={UserCheck}
            variant="primary"
          />
          <StatsCard
            title="Em Risco"
            value={stats.atRisk}
            icon={AlertTriangle}
            variant="warning"
          />
          <StatsCard
            title="Inativos"
            value={stats.inactive}
            icon={UserX}
            variant="danger"
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
      </div>
    </Layout>
  );
};

export default Customers;
