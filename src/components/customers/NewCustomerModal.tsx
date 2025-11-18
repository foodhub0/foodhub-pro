import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface NewCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: NewCustomerData) => Promise<void>;
}

export interface NewCustomerData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  zipCode?: string;
}

export const NewCustomerModal = ({ open, onOpenChange, onSave }: NewCustomerModalProps) => {
  const [formData, setFormData] = useState<NewCustomerData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleChange = (field: keyof NewCustomerData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{5})(\d)/, '$1-$2');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome do cliente',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, informe um email válido',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
      toast({
        title: 'Telefone inválido',
        description: 'Por favor, informe um telefone válido',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await onSave(formData);
      toast({
        title: 'Cliente cadastrado!',
        description: 'O cliente foi adicionado com sucesso',
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro ao cadastrar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Novo Cliente
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do novo cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg border-b pb-2">
              Informações Básicas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Nome Completo *
                </Label>
                <Input
                  id="name"
                  placeholder="João da Silva"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="mt-1 border-gray-300 focus:border-[#007BFF] focus:ring-[#007BFF]"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="mt-1 border-gray-300 focus:border-[#007BFF] focus:ring-[#007BFF]"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                  Telefone *
                </Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                  maxLength={15}
                  className="mt-1 border-gray-300 focus:border-[#007BFF] focus:ring-[#007BFF]"
                />
              </div>
            </div>
          </div>

          {/* Endereço (Opcional) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg border-b pb-2">
              Endereço (Opcional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                  Endereço
                </Label>
                <Input
                  id="address"
                  placeholder="Rua, Número, Complemento"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="mt-1 border-gray-300 focus:border-[#007BFF] focus:ring-[#007BFF]"
                />
              </div>

              <div>
                <Label htmlFor="zipCode" className="text-sm font-semibold text-gray-700">
                  CEP
                </Label>
                <Input
                  id="zipCode"
                  placeholder="12345-678"
                  value={formData.zipCode}
                  onChange={(e) => handleChange('zipCode', formatZipCode(e.target.value))}
                  maxLength={9}
                  className="mt-1 border-gray-300 focus:border-[#007BFF] focus:ring-[#007BFF]"
                />
              </div>

              <div className="md:col-span-3">
                <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
                  Cidade
                </Label>
                <Input
                  id="city"
                  placeholder="São Paulo - SP"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="mt-1 border-gray-300 focus:border-[#007BFF] focus:ring-[#007BFF]"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#007BFF] hover:bg-[#0056D2]"
          >
            {saving ? 'Salvando...' : 'Cadastrar Cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
