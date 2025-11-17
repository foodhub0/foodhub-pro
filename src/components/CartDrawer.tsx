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
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Seu Carrinho</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Seu carrinho está vazio
            </h3>
            <p className="text-sm text-gray-500">
              Adicione itens do cardápio para começar seu pedido
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Seu Carrinho ({items.length})</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 my-4">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border p-4 space-y-3"
              >
                {/* Header do Item */}
                <div className="flex gap-3">
                  {/* Imagem */}
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-gray-400">Sem foto</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {item.productName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(item.basePrice)}
                    </p>

                    {/* Variações */}
                    {item.variations.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.variations.map((variation) => (
                          <div
                            key={variation.id}
                            className="text-xs text-gray-500 flex justify-between"
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
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <strong>Obs:</strong> {item.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer do Item */}
                <div className="flex items-center justify-between pt-3 border-t">
                  {/* Controle de Quantidade */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Subtotal do Item */}
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary">
                      {formatCurrency(getItemTotal(item))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <SheetFooter className="flex-col gap-4 border-t pt-4">
          {/* Total */}
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary text-2xl">
              {formatCurrency(getTotal())}
            </span>
          </div>

          {/* Botão de Finalizar */}
          <Button
            onClick={handleCheckout}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
            size="lg"
          >
            Finalizar Pedido
          </Button>

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Continuar Comprando
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
