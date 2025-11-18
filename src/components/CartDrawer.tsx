import { useCart } from '@/contexts/CartContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Trash2, ShoppingBag, Tag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantSlug?: string;
}

export const CartDrawer = ({ open, onOpenChange, restaurantSlug }: CartDrawerProps) => {
  const { items, getTotal, getItemTotal, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleApplyCoupon = () => {
    // Simulação de validação de cupom
    if (couponCode.toUpperCase() === 'FOODHUB10') {
      setAppliedCoupon({ code: couponCode, discount: 0.10 });
      setShowCouponInput(false);
      setCouponCode('');
    } else if (couponCode.toUpperCase() === 'PRIMEIRACOMPRA') {
      setAppliedCoupon({ code: couponCode, discount: 0.15 });
      setShowCouponInput(false);
      setCouponCode('');
    } else {
      setAppliedCoupon(null);
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

  const getFinalTotal = () => {
    return getTotal() - getDiscountAmount();
  };

  const handleCheckout = () => {
    if (restaurantSlug) {
      navigate(`/m/${restaurantSlug}/checkout`);
      onOpenChange(false);
    }
  };

  if (items.length === 0) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg bg-gray-50">
          <SheetHeader className="border-b bg-white -mx-6 px-6 pb-4">
            <SheetTitle className="text-lg font-bold">Carrinho</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <ShoppingBag className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Sua sacola está vazia
            </h3>
            <p className="text-sm text-gray-500">
              Adicione itens para começar
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col bg-gray-50">
        <SheetHeader className="border-b bg-white -mx-6 px-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">Carrinho ({items.length})</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Limpar
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 my-4">
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg p-3 shadow-sm"
              >
                {/* Header do Item */}
                <div className="flex gap-3 mb-3">
                  {/* Imagem */}
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-gray-400">Sem foto</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.basePrice)}
                    </p>

                    {/* Variações */}
                    {item.variations.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {item.variations.map((variation) => (
                          <div
                            key={variation.id}
                            className="text-[11px] text-gray-500 flex justify-between"
                          >
                            <span>+ {variation.name}</span>
                            <span>
                              {variation.price > 0 ? formatCurrency(variation.price) : 'Grátis'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Observações */}
                    {item.notes && (
                      <div className="mt-1.5 text-[11px] text-gray-500 bg-gray-50 p-1.5 rounded">
                        <strong>Obs:</strong> {item.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer do Item */}
                <div className="flex items-center justify-between pt-2.5 border-t">
                  {/* Controle de Quantidade */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full border-[#005BFF] text-[#005BFF] hover:bg-blue-50"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full border-[#005BFF] text-[#005BFF] hover:bg-blue-50"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Subtotal do Item */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">
                      {formatCurrency(getItemTotal(item))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <SheetFooter className="flex-col gap-3 border-t pt-4 bg-white -mx-6 px-6">
          {/* Cupom de Desconto - Estilo iFood */}
          {!appliedCoupon ? (
            <div className="mb-2">
              {!showCouponInput ? (
                <Button
                  variant="ghost"
                  onClick={() => setShowCouponInput(true)}
                  className="w-full justify-start text-[#005BFF] hover:bg-blue-50 h-10 px-3"
                >
                  <Tag className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Adicionar cupom de desconto</span>
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="h-10 text-sm uppercase"
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      size="sm"
                      className="bg-[#005BFF] hover:bg-[#0047CC] h-10 px-4"
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
                    className="text-xs text-gray-500 hover:text-gray-700 h-6"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-2 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-green-800">
                      Cupom aplicado: {appliedCoupon.code}
                    </span>
                    <span className="text-xs text-green-600">
                      -{(appliedCoupon.discount * 100).toFixed(0)}% de desconto
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeCoupon}
                  className="h-6 w-6 text-green-600 hover:text-green-800 hover:bg-green-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Resumo de Valores - Estilo iFood */}
          <div className="space-y-2 pb-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{formatCurrency(getTotal())}</span>
            </div>

            {appliedCoupon && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600">Desconto ({appliedCoupon.code})</span>
                <span className="text-green-600">-{formatCurrency(getDiscountAmount())}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-[#005BFF]">
                {formatCurrency(getFinalTotal())}
              </span>
            </div>
          </div>

          {/* Botão de Finalizar */}
          <Button
            onClick={handleCheckout}
            className="w-full h-12 text-base font-bold bg-[#005BFF] hover:bg-[#0047CC] shadow-md"
            size="lg"
          >
            Finalizar Pedido
          </Button>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-[#005BFF] hover:bg-blue-50"
          >
            Continuar Comprando
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
