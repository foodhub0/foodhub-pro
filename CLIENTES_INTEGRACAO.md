# Página de Gestão de Clientes - Guia de Integração

## 📦 Arquivos Criados

### Componentes
```
src/components/customers/
├── StatsCard.tsx              # Cards de métricas com variantes
├── FilterTags.tsx             # Filtros por categoria
├── CustomerTable.tsx          # Tabela de clientes
├── ImportCustomersModal.tsx   # Modal de importação CSV
└── NewCustomerModal.tsx       # Modal de novo cliente
```

### Página
```
src/pages/Customers.tsx        # Página principal de clientes
```

## 🎨 Paleta de Cores

A página usa a paleta azul do Food Hub:

```css
Azul primário:    #007BFF
Azul escuro:      #0056D2
Azul claro:       #E8F1FF
Cinza textos:     #4F4F4F
Cinza fundo:      #F7F9FC
```

## 📊 Estrutura de Dados

### Interface Customer
```typescript
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastOrder: string;         // ISO date
  totalOrders: number;
  totalSpent: number;
  status: 'new' | 'recurring' | 'at_risk' | 'inactive';
}
```

### Interface NewCustomerData
```typescript
interface NewCustomerData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  zipCode?: string;
}
```

## 🔌 Integração com Backend

### 1. Carregar Clientes

No arquivo `src/pages/Customers.tsx`, substitua o mock data:

```typescript
// REMOVER:
const [customers] = useState<Customer[]>(mockCustomers);

// ADICIONAR:
const [customers, setCustomers] = useState<Customer[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadCustomers();
}, []);

const loadCustomers = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transformar dados do Supabase para o formato Customer
    const formattedCustomers = data.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      lastOrder: customer.last_order_date,
      totalOrders: customer.total_orders || 0,
      totalSpent: customer.total_spent || 0,
      status: calculateCustomerStatus(customer),
    }));

    setCustomers(formattedCustomers);
  } catch (error) {
    console.error('Error loading customers:', error);
  } finally {
    setLoading(false);
  }
};

// Função para calcular status do cliente
const calculateCustomerStatus = (customer: any): Customer['status'] => {
  const daysSinceLastOrder = customer.last_order_date
    ? Math.floor((Date.now() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  if (customer.total_orders === 1) return 'new';
  if (daysSinceLastOrder > 60) return 'inactive';
  if (daysSinceLastOrder > 30) return 'at_risk';
  return 'recurring';
};
```

### 2. Criar Novo Cliente

```typescript
const handleNewCustomer = async (data: NewCustomerData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!restaurant) throw new Error('Restaurante não encontrado');

    const { error } = await supabase
      .from('customers')
      .insert({
        restaurant_id: restaurant.id,
        name: data.name,
        email: data.email,
        phone: data.phone.replace(/\D/g, ''),
        address: data.address,
        city: data.city,
        zipcode: data.zipCode?.replace(/\D/g, ''),
      });

    if (error) throw error;

    // Recarregar lista de clientes
    await loadCustomers();
  } catch (error) {
    throw error;
  }
};
```

### 3. Importar Clientes via CSV

```typescript
const handleImport = async (file: File) => {
  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    // Ignorar cabeçalho
    const dataLines = lines.slice(1);

    const customers = dataLines.map(line => {
      const [name, email, phone] = line.split(',').map(s => s.trim());
      return { name, email, phone: phone.replace(/\D/g, '') };
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!restaurant) throw new Error('Restaurante não encontrado');

    const customersWithRestaurant = customers.map(c => ({
      ...c,
      restaurant_id: restaurant.id,
    }));

    const { error } = await supabase
      .from('customers')
      .insert(customersWithRestaurant);

    if (error) throw error;

    // Recarregar lista de clientes
    await loadCustomers();
  } catch (error) {
    throw error;
  }
};
```

### 4. Editar Cliente

```typescript
const handleEdit = async (customer: Customer) => {
  // Implementar modal de edição ou navegar para página de edição
  // Por enquanto, abre o modal de novo cliente com dados pré-preenchidos
  setEditingCustomer(customer);
  setIsNewCustomerModalOpen(true);
};
```

### 5. Excluir Cliente

```typescript
const handleDelete = async (customer: Customer) => {
  if (!confirm(`Deseja realmente excluir ${customer.name}?`)) return;

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

    // Recarregar lista
    await loadCustomers();
  } catch (error) {
    toast({
      title: 'Erro ao excluir',
      description: 'Tente novamente',
      variant: 'destructive',
    });
  }
};
```

## 🗄️ Schema do Banco de Dados

Crie a tabela `customers` no Supabase:

```sql
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  email varchar(255),
  phone varchar(20) NOT NULL,
  address text,
  city varchar(100),
  zipcode varchar(10),
  last_order_date timestamptz,
  total_orders integer DEFAULT 0,
  total_spent decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_customers_restaurant_id ON customers(restaurant_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurantes veem apenas seus clientes
CREATE POLICY "Restaurants can view their customers"
  ON customers FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurants can insert their customers"
  ON customers FOR INSERT
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurants can update their customers"
  ON customers FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurants can delete their customers"
  ON customers FOR DELETE
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();
```

## 🔄 Atualizar Estatísticas Automaticamente

Crie uma função para atualizar as estatísticas dos clientes:

```sql
-- Função para atualizar estatísticas do cliente após um pedido
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET
    last_order_date = NEW.created_at,
    total_orders = (
      SELECT COUNT(*) FROM orders WHERE customer_id = NEW.customer_id
    ),
    total_spent = (
      SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = NEW.customer_id
    )
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas após inserir pedido
CREATE TRIGGER update_customer_stats_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();
```

## 📱 Responsividade

A página é totalmente responsiva:

- **Mobile**: Cards em coluna única, menu colapsável
- **Tablet**: Cards em 2 colunas, filtros adaptáveis
- **Desktop**: Cards em 4 colunas, layout completo

## 🎯 Próximos Passos

1. Criar migration do banco de dados
2. Implementar as funções de integração
3. Testar importação CSV
4. Adicionar validações extras
5. Implementar exportação de dados
6. Criar relatórios de clientes
7. Adicionar gráficos de evolução

## 🐛 Debug

Para testar com dados mockados, mantenha a implementação atual. Para produção:

1. Remova `mockCustomers` de `Customers.tsx`
2. Implemente as funções de integração acima
3. Teste cada funcionalidade individualmente
4. Verifique as permissões RLS no Supabase

## 📞 Suporte

Em caso de dúvidas sobre a integração, verifique:
- Logs do Supabase (erros de RLS)
- Console do navegador (erros de API)
- Network tab (requisições falhando)
