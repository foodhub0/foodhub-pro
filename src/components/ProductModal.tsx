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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductModal = ({ product, open, onOpenChange }: ProductModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedVariations, setSelectedVariations] = useState<CartVariation[]>([]);
  const [availableVariations, setAvailableVariations] = useState<ProductVariation[]>([]);
  const [loading, setLoading] = useState(false);

  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (product && open) {
      loadVariations();
      // Reset state
      setQuantity(1);
      setNotes('');
      setSelectedVariations([]);
    }
  }, [product, open]);

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

      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Imagem do Produto - Full Width */}
        {product.image_url && (
          <div className="relative w-full h-56 bg-muted">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 bg-white/90 dark:bg-black/60 hover:bg-white dark:hover:bg-black/80 rounded-full shadow-md"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Conteúdo com Padding */}
        <div className="p-6 space-y-5">
          {/* Header - Sem imagem */}
          {!product.image_url && (
            <DialogHeader className="pb-0">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-left pr-8 text-xl font-bold">
                {product.name}
              </DialogTitle>
            </DialogHeader>
          )}

          {/* Nome e Descrição */}
          <div className="space-y-2">
            {product.image_url && (
              <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
            )}

            {/* Descrição */}
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Preço Base */}
            <div className="pt-2">
              <span className="text-xl font-bold text-foreground">
                {formatCurrency(product.base_price)}
              </span>
            </div>
          </div>

          {/* Variações/Adicionais */}
          {availableVariations.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-base font-bold text-foreground">Adicionais</Label>
              <div className="space-y-2">
                {availableVariations.map(variation => (
                  <div
                    key={variation.id}
                    className="flex items-center justify-between space-x-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox
                        id={variation.id}
                        checked={selectedVariations.some(v => v.id === variation.id)}
                        onCheckedChange={(checked) =>
                          handleVariationToggle(variation, checked as boolean)
                        }
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <label
                        htmlFor={variation.id}
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {variation.name}
                      </label>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {variation.price_modifier > 0 ? '+' : ''}
                      {formatCurrency(variation.price_modifier)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="notes" className="text-sm font-semibold text-foreground">
              Alguma observação?
            </Label>
            <Textarea
              id="notes"
              placeholder="Ex: Sem cebola, ponto da carne..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Footer Fixo - Estilo iFood */}
        <div className="sticky bottom-0 bg-card border-t p-4 space-y-3">
          {/* Quantidade */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Quantidade</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="h-9 w-9 rounded-full border-primary text-primary hover:bg-primary/10 disabled:opacity-50"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-base font-bold">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 99}
                className="h-9 w-9 rounded-full border-primary text-primary hover:bg-primary/10 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Botão Adicionar */}
          <Button
            onClick={handleAddToCart}
            className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-base shadow-md"
            disabled={loading}
          >
            <span className="flex items-center justify-between w-full">
              <span>Adicionar</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
