import { useCart } from '@/contexts/CartContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantSlug?: string;
}

export const CartDrawer = ({ isOpen, onClose, restaurantSlug }: CartDrawerProps) => {
  const { items, getTotal, getItemTotal, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleCheckout = () => {
    if (restaurantSlug) {
      navigate(`/m/${restaurantSlug}/checkout`);
      onClose();
    }
  };

  if (items.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
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
    <Sheet open={isOpen} onOpenChange={onClose}>
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
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(getTotal())}
            </span>
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
            onClick={onClose}
            className="w-full text-[#005BFF] hover:bg-blue-50"
          >
            Continuar Comprando
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
