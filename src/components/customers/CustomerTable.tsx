import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MoreVertical, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastOrder: string;
  totalOrders: number;
  totalSpent: number;
  status: 'new' | 'recurring' | 'at_risk' | 'inactive';
}

interface CustomerTableProps {
  customers: Customer[];
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
  onViewOrders?: (customer: Customer) => void;
}

export const CustomerTable = ({ customers, onEdit, onDelete, onViewOrders }: CustomerTableProps) => {
  const [sortColumn, setSortColumn] = useState<keyof Customer>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof Customer) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * multiplier;
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * multiplier;
    }
    return 0;
  });

  const getStatusBadge = (status: Customer['status']) => {
    const statusConfig = {
      new: { label: 'Novo', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
      recurring: { label: 'Recorrente', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
      at_risk: { label: 'Em risco', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
      inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
    };

    const config = statusConfig[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <Users className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum cliente encontrado</h3>
        <p className="text-sm text-gray-500 text-center max-w-md">
          Não há clientes cadastrados ou nenhum resultado corresponde aos filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F7F9FC] border-b border-gray-200">
            <TableHead
              className="font-semibold text-[#4F4F4F] cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('name')}
            >
              Cliente {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead className="font-semibold text-[#4F4F4F]">Contato</TableHead>
            <TableHead className="font-semibold text-[#4F4F4F]">Status</TableHead>
            <TableHead
              className="font-semibold text-[#4F4F4F] cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('lastOrder')}
            >
              Última Compra {sortColumn === 'lastOrder' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="font-semibold text-[#4F4F4F] cursor-pointer hover:bg-gray-100 transition-colors text-center"
              onClick={() => handleSort('totalOrders')}
            >
              Pedidos {sortColumn === 'totalOrders' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead
              className="font-semibold text-[#4F4F4F] cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSort('totalSpent')}
            >
              Total Gasto {sortColumn === 'totalSpent' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCustomers.map((customer) => (
            <TableRow
              key={customer.id}
              className="hover:bg-[#F7F9FC] transition-colors border-b border-gray-100 last:border-0"
            >
              <TableCell className="font-medium text-gray-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8F1FF] flex items-center justify-center">
                    <span className="text-[#007BFF] font-semibold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{customer.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-3 w-3" />
                    {customer.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-3 w-3" />
                    {customer.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(customer.status)}</TableCell>
              <TableCell className="text-gray-700">{formatDate(customer.lastOrder)}</TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="bg-[#E8F1FF] text-[#007BFF] border-[#007BFF] font-semibold">
                  {customer.totalOrders}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold text-gray-900">
                {formatCurrency(customer.totalSpent)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onViewOrders && (
                      <DropdownMenuItem onClick={() => onViewOrders(customer)}>
                        Ver Pedidos
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(customer)}>
                        Editar
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(customer)}
                        className="text-red-600 focus:text-red-600"
                      >
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
