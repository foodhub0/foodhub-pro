import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCart, CartVariation } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  restaurant_id: string;
}

interface ProductVariation {
  id: string;
  name: string;
  price_modifier: number;
  is_available: boolean;
}

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal = ({ product, isOpen, onClose }: ProductModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedVariations, setSelectedVariations] = useState<CartVariation[]>([]);
  const [availableVariations, setAvailableVariations] = useState<ProductVariation[]>([]);
  const [loading, setLoading] = useState(false);

  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (product && isOpen) {
      loadVariations();
      // Reset state
      setQuantity(1);
      setNotes('');
      setSelectedVariations([]);
    }
  }, [product, isOpen]);

  const loadVariations = async () => {
    if (!product) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('product_variations')
      .select('*')
      .eq('product_id', product.id)
      .eq('is_available', true)
      .order('name');

    if (!error && data) {
      setAvailableVariations(data);
    }
    setLoading(false);
  };

  const handleVariationToggle = (variation: ProductVariation, checked: boolean) => {
    if (checked) {
      setSelectedVariations(prev => [
        ...prev,
        {
          id: variation.id,
          name: variation.name,
          price: variation.price_modifier,
        },
      ]);
    } else {
      setSelectedVariations(prev =>
        prev.filter(v => v.id !== variation.id)
      );
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const calculateTotal = () => {
    if (!product) return 0;

    const variationsTotal = selectedVariations.reduce(
      (sum, variation) => sum + variation.price,
      0
    );

    return (product.base_price + variationsTotal) * quantity;
  };

  const handleAddToCart = () => {
    if (!product) return;

    try {
      addItem({
        productId: product.id,
        productName: product.name,
        productImage: product.image_url,
        basePrice: product.base_price,
        quantity,
        variations: selectedVariations,
        notes,
        restaurantId: product.restaurant_id,
      });

      toast({
        title: 'Adicionado ao carrinho!',
        description: `${quantity}x ${product.name}`,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao adicionar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-left pr-8">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Imagem do Produto */}
          {product.image_url && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Descrição */}
          {product.description && (
            <div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Preço Base */}
          <div className="flex items-center justify-between py-2 border-t border-b">
            <span className="font-medium">Preço base</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(product.base_price)}
            </span>
          </div>

          {/* Variações/Adicionais */}
          {availableVariations.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Adicionais</Label>
              {availableVariations.map(variation => (
                <div
                  key={variation.id}
                  className="flex items-center justify-between space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <Checkbox
                      id={variation.id}
                      checked={selectedVariations.some(v => v.id === variation.id)}
                      onCheckedChange={(checked) =>
                        handleVariationToggle(variation, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={variation.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {variation.name}
                    </label>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {variation.price_modifier > 0 ? '+' : ''}
                    {formatCurrency(variation.price_modifier)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Sem cebola, ponto da carne, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, Math.min(99, value)));
                }}
                className="text-center w-20"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 99}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddToCart}
            className="w-full sm:flex-1 bg-primary text-white hover:bg-primary/90"
            disabled={loading}
          >
            <span className="flex items-center justify-between w-full">
              <span>Adicionar ao carrinho</span>
              <span className="font-bold">{formatCurrency(calculateTotal())}</span>
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
