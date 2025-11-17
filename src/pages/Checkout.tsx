import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Smartphone, Wallet, DollarSign, Tag, X, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Restaurant {
  id: string;
  name: string;
  delivery_fee: number | null;
}

const Checkout = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { items, getTotal, getItemTotal, clearCart } = useCart();
  const { toast } = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dados do cliente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Tipo de pedido
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');

  // Endereço de entrega
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'cash'>('pix');
  const [changeFor, setChangeFor] = useState('');

  // Cupom de desconto
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate(`/m/${slug}`);
      return;
    }

    loadRestaurant();
  }, [slug]);

  const loadRestaurant = async () => {
    const { data } = await supabase
      .from('restaurants')
      .select('id, name, delivery_fee')
      .eq('slug', slug)
      .single();

    if (data) {
      setRestaurant(data);
    }
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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

  const formatZipcode = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{5})(\d)/, '$1-$2');
  };

  const calculateDeliveryFee = () => {
    if (orderType === 'pickup') return 0;
    return restaurant?.delivery_fee || 0;
  };

  const handleApplyCoupon = () => {
    // Simulação de validação de cupom
    if (couponCode.toUpperCase() === 'FOODHUB10') {
      setAppliedCoupon({ code: couponCode, discount: 0.10 });
      setShowCouponInput(false);
      setCouponCode('');
      toast({
        title: 'Cupom aplicado!',
        description: '10% de desconto no seu pedido',
      });
    } else if (couponCode.toUpperCase() === 'PRIMEIRACOMPRA') {
      setAppliedCoupon({ code: couponCode, discount: 0.15 });
      setShowCouponInput(false);
      setCouponCode('');
      toast({
        title: 'Cupom aplicado!',
        description: '15% de desconto no seu pedido',
      });
    } else {
      setAppliedCoupon(null);
      toast({
        title: 'Cupom inválido',
        description: 'O cupom informado não é válido',
        variant: 'destructive',
      });
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    return getTotal() * appliedCoupon.discount;
  };

  const calculateTotal = () => {
    return getTotal() + calculateDeliveryFee() - getDiscountAmount();
  };

  const validateForm = () => {
    if (!customerName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe seu nome',
        variant: 'destructive',
      });
      return false;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      toast({
        title: 'Telefone inválido',
        description: 'Por favor, informe um telefone válido',
        variant: 'destructive',
      });
      return false;
    }

    if (orderType === 'delivery') {
      if (!address.trim() || !addressNumber.trim() || !neighborhood.trim() || !city.trim()) {
        toast({
          title: 'Endereço incompleto',
          description: 'Por favor, preencha todos os campos do endereço',
          variant: 'destructive',
        });
        return false;
      }
    }

    if (paymentMethod === 'cash' && !changeFor.trim()) {
      toast({
        title: 'Troco obrigatório',
        description: 'Informe para quanto você precisa de troco',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !restaurant) return;

    setSubmitting(true);

    try {
      // 1. Criar cliente
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: customerName,
          phone: customerPhone.replace(/\D/g, ''),
          email: customerEmail || null,
          address: orderType === 'delivery' ? address : null,
          address_number: orderType === 'delivery' ? addressNumber : null,
          address_complement: orderType === 'delivery' ? complement : null,
          neighborhood: orderType === 'delivery' ? neighborhood : null,
          city: orderType === 'delivery' ? city : null,
          zipcode: orderType === 'delivery' ? zipcode.replace(/\D/g, '') : null,
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // 2. Criar pedido
      const subtotal = getTotal();
      const deliveryFee = calculateDeliveryFee();
      const total = subtotal + deliveryFee;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          customer_id: customerData.id,
          customer_name: customerName,
          customer_phone: customerPhone.replace(/\D/g, ''),
          customer_email: customerEmail || null,
          delivery_address: orderType === 'delivery' ? address : null,
          delivery_number: orderType === 'delivery' ? addressNumber : null,
          delivery_complement: orderType === 'delivery' ? complement : null,
          delivery_neighborhood: orderType === 'delivery' ? neighborhood : null,
          delivery_city: orderType === 'delivery' ? city : null,
          delivery_zipcode: orderType === 'delivery' ? zipcode.replace(/\D/g, '') : null,
          delivery_instructions: orderType === 'delivery' ? deliveryInstructions : null,
          order_type: orderType,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          payment_method: paymentMethod,
          notes: paymentMethod === 'cash' ? `Troco para: R$ ${changeFor}` : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Criar itens do pedido
      for (const item of items) {
        const itemTotal = getItemTotal(item);

        const { data: orderItemData, error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderData.id,
            product_id: item.productId,
            product_name: item.productName,
            product_image_url: item.productImage,
            quantity: item.quantity,
            unit_price: item.basePrice,
            total_price: itemTotal,
            notes: item.notes || null,
          })
          .select()
          .single();

        if (itemError) throw itemError;

        // 4. Criar variações do item
        if (item.variations.length > 0) {
          const variationsToInsert = item.variations.map(variation => ({
            order_item_id: orderItemData.id,
            variation_id: variation.id,
            variation_name: variation.name,
            variation_price: variation.price,
          }));

          const { error: variationsError } = await supabase
            .from('order_item_variations')
            .insert(variationsToInsert);

          if (variationsError) throw variationsError;
        }
      }

      // 5. Limpar carrinho e redirecionar
      clearCart();

      toast({
        title: 'Pedido realizado com sucesso!',
        description: `Seu pedido #${orderData.id.slice(0, 8)} foi enviado para o restaurante`,
      });

      // Redirecionar para página de confirmação
      navigate(`/m/${slug}/order/${orderData.id}`);

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Erro ao finalizar pedido',
        description: 'Tente novamente ou entre em contato com o restaurante',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/m/${slug}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">Finalizar Pedido</h1>
              <p className="text-sm text-gray-600">{restaurant?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Tipo de Pedido */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Tipo de Pedido</h2>
          <RadioGroup value={orderType} onValueChange={(value: any) => setOrderType(value)}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="delivery" id="delivery" />
              <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                <span className="font-medium">Entrega</span>
                <p className="text-sm text-gray-500">
                  Receba em casa - {formatCurrency(restaurant?.delivery_fee || 0)}
                </p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                <span className="font-medium">Retirada</span>
                <p className="text-sm text-gray-500">Retire no local - Sem taxa</p>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Dados do Cliente */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Seus Dados</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="Seu nome"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                maxLength={15}
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Endereço de Entrega */}
        {orderType === 'delivery' && (
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4">Endereço de Entrega</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="zipcode">CEP</Label>
                <Input
                  id="zipcode"
                  placeholder="00000-000"
                  value={zipcode}
                  onChange={(e) => setZipcode(formatZipcode(e.target.value))}
                  maxLength={9}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="address">Rua *</Label>
                  <Input
                    id="address"
                    placeholder="Nome da rua"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    placeholder="123"
                    value={addressNumber}
                    onChange={(e) => setAddressNumber(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  placeholder="Apto, bloco, etc"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Bairro"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    placeholder="Cidade"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="instructions">Instruções de Entrega</Label>
                <Textarea
                  id="instructions"
                  placeholder="Ponto de referência, portão, etc"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Forma de Pagamento */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Forma de Pagamento</h2>
          <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  PIX
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="credit_card" id="credit_card" />
                <Label htmlFor="credit_card" className="flex-1 cursor-pointer flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Cartão de Crédito
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="debit_card" id="debit_card" />
                <Label htmlFor="debit_card" className="flex-1 cursor-pointer flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Cartão de Débito
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex-1 cursor-pointer flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Dinheiro
                </Label>
              </div>
            </div>
          </RadioGroup>

          {paymentMethod === 'cash' && (
            <div className="mt-4">
              <Label htmlFor="change">Troco para quanto?</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="change"
                  placeholder="100,00"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Itens do Pedido - Estilo iFood */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Itens do Pedido ({items.length})
          </h2>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 pb-3 border-b last:border-0">
                {item.productImage && (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.quantity}x {item.productName}
                      </p>
                      {item.variations.length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.variations.map(v => v.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(getItemTotal(item))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Cupom de Desconto - Estilo iFood */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Cupom de Desconto</h2>
          {!appliedCoupon ? (
            <div>
              {!showCouponInput ? (
                <Button
                  variant="outline"
                  onClick={() => setShowCouponInput(true)}
                  className="w-full justify-start text-[#005BFF] border-[#005BFF] hover:bg-blue-50 h-11"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  <span className="font-medium">Adicionar cupom de desconto</span>
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="h-11 uppercase"
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      className="bg-[#005BFF] hover:bg-[#0047CC] h-11 px-6"
                    >
                      Aplicar
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCouponInput(false);
                      setCouponCode('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </Button>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800 font-medium mb-1">Cupons disponíveis:</p>
                    <p className="text-xs text-blue-700">• FOODHUB10 - 10% de desconto</p>
                    <p className="text-xs text-blue-700">• PRIMEIRACOMPRA - 15% de desconto</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <Tag className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-green-800">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-xs text-green-600">
                      {(appliedCoupon.discount * 100).toFixed(0)}% de desconto aplicado
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeCoupon}
                  className="h-8 w-8 text-green-600 hover:text-green-800 hover:bg-green-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Resumo do Pedido */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100">
          <h2 className="font-semibold text-lg mb-4">Resumo do Pedido</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
              <span className="font-medium text-gray-900">{formatCurrency(getTotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxa de entrega</span>
              <span className="font-medium text-gray-900">
                {calculateDeliveryFee() === 0 ? 'Grátis' : formatCurrency(calculateDeliveryFee())}
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">Desconto ({appliedCoupon.code})</span>
                <span className="text-green-600 font-semibold">-{formatCurrency(getDiscountAmount())}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl pt-3 border-t-2 border-blue-200">
              <span className="text-gray-900">Total</span>
              <span className="text-[#005BFF]">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </Card>

        {/* Botão Finalizar */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          {submitting ? 'Finalizando...' : `Finalizar Pedido - ${formatCurrency(calculateTotal())}`}
        </Button>
      </div>
    </div>
  );
};

export default Checkout;
