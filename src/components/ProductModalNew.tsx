import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type {
  ProductComplete,
  ProductSize,
  AddonGroupItem,
  CartAddonGroup,
  CartAddonItem,
  validateAddonSelections,
} from '@/types/products';

interface ProductModalNewProps {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SelectedAddon {
  groupId: string;
  itemId: string;
  item: AddonGroupItem;
  quantity: number;
}

export const ProductModalNew = ({
  productId,
  open,
  onOpenChange,
}: ProductModalNewProps) => {
  const [product, setProduct] = useState<ProductComplete | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(
    new Map()
  );

  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (productId && open) {
      loadProduct();
    } else {
      resetState();
    }
  }, [productId, open]);

  const resetState = () => {
    setProduct(null);
    setQuantity(1);
    setNotes('');
    setSelectedSize(null);
    setSelectedAddons([]);
    setValidationErrors(new Map());
  };

  const loadProduct = async () => {
    if (!productId) return;

    setLoading(true);
    try {
      // Buscar produto com todos os relacionamentos
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(
          `
          *,
          categories(id, name, display_order),
          product_sizes(*, order:display_order.asc),
          product_addon_group_links(
            *,
            product_addon_groups(
              *,
              addon_group_items(*,order:display_order.asc)
            ),
            order:display_order.asc
          )
        `
        )
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      if (productData) {
        // Transformar para ProductComplete
        const productComplete: ProductComplete = {
          ...productData,
          sizes: productData.product_sizes || [],
          addonGroups:
            productData.product_addon_group_links?.map((link: any) => ({
              groupId: link.addon_group_id,
              groupName: link.product_addon_groups?.name || '',
              groupDescription: link.product_addon_groups?.description || null,
              isRequired: link.is_required,
              minQuantity: link.min_quantity,
              maxQuantity: link.max_quantity,
              allowMultiple: link.allow_multiple,
              displayOrder: link.display_order,
              items: link.product_addon_groups?.addon_group_items || [],
            })) || [],
        };

        setProduct(productComplete);

        // Se tem tamanhos, pré-selecionar o primeiro disponível
        if (productComplete.has_sizes && productComplete.sizes.length > 0) {
          const firstAvailable = productComplete.sizes.find((s) => s.is_available);
          if (firstAvailable) {
            setSelectedSize(firstAvailable);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast({
        title: 'Erro ao carregar produto',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS DE SELEÇÃO
  // ============================================================================

  const handleSizeChange = (sizeId: string) => {
    const size = product?.sizes.find((s) => s.id === sizeId);
    if (size) {
      setSelectedSize(size);
    }
  };

  const handleAddonToggle = (
    groupId: string,
    item: AddonGroupItem,
    checked: boolean
  ) => {
    const group = product?.addonGroups.find((g) => g.groupId === groupId);
    if (!group) return;

    setSelectedAddons((prev) => {
      let newSelection = [...prev];

      if (checked) {
        // Se não permite múltiplos, remover outras seleções do mesmo grupo
        if (!group.allowMultiple) {
          newSelection = newSelection.filter((s) => s.groupId !== groupId);
        }

        // Verificar max_quantity
        const currentCount = newSelection
          .filter((s) => s.groupId === groupId)
          .reduce((sum, s) => sum + s.quantity, 0);

        if (group.maxQuantity !== null && currentCount >= group.maxQuantity) {
          toast({
            title: 'Limite atingido',
            description: `Máximo de ${group.maxQuantity} ${
              group.maxQuantity === 1 ? 'item' : 'itens'
            }`,
            variant: 'destructive',
          });
          return prev;
        }

        newSelection.push({
          groupId,
          itemId: item.id,
          item,
          quantity: 1,
        });
      } else {
        newSelection = newSelection.filter((s) => s.itemId !== item.id);
      }

      return newSelection;
    });

    // Limpar erro de validação do grupo
    setValidationErrors((prev) => {
      const newErrors = new Map(prev);
      newErrors.delete(groupId);
      return newErrors;
    });
  };

  const handleAddonQuantityChange = (itemId: string, delta: number) => {
    setSelectedAddons((prev) => {
      return prev.map((addon) => {
        if (addon.itemId === itemId) {
          const newQuantity = Math.max(1, addon.quantity + delta);

          // Verificar max_quantity do grupo
          const group = product?.addonGroups.find(
            (g) => g.groupId === addon.groupId
          );
          if (group?.maxQuantity !== null) {
            const totalInGroup = prev
              .filter((s) => s.groupId === addon.groupId)
              .reduce(
                (sum, s) =>
                  sum + (s.itemId === itemId ? newQuantity : s.quantity),
                0
              );

            if (totalInGroup > group.maxQuantity) {
              toast({
                title: 'Limite atingido',
                description: `Máximo de ${group.maxQuantity} itens neste grupo`,
                variant: 'destructive',
              });
              return addon;
            }
          }

          return { ...addon, quantity: newQuantity };
        }
        return addon;
      });
    });
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  // ============================================================================
  // VALIDAÇÕES E CÁLCULOS
  // ============================================================================

  const validateSelections = (): boolean => {
    const errors = new Map<string, string>();

    // Validar tamanho (se necessário)
    if (product?.has_sizes && !selectedSize) {
      toast({
        title: 'Selecione um tamanho',
        description: 'Você precisa escolher um tamanho para este produto',
        variant: 'destructive',
      });
      return false;
    }

    // Validar grupos de adicionais
    product?.addonGroups.forEach((group) => {
      const selectedInGroup = selectedAddons.filter(
        (s) => s.groupId === group.groupId
      );
      const totalQuantity = selectedInGroup.reduce(
        (sum, s) => sum + s.quantity,
        0
      );

      // Validar mínimo (obrigatório)
      if (group.isRequired && totalQuantity < group.minQuantity) {
        errors.set(
          group.groupId,
          `Selecione pelo menos ${group.minQuantity} ${
            group.minQuantity === 1 ? 'item' : 'itens'
          }`
        );
      }

      // Validar máximo
      if (group.maxQuantity !== null && totalQuantity > group.maxQuantity) {
        errors.set(
          group.groupId,
          `Máximo de ${group.maxQuantity} ${
            group.maxQuantity === 1 ? 'item' : 'itens'
          }`
        );
      }
    });

    setValidationErrors(errors);

    if (errors.size > 0) {
      toast({
        title: 'Seleção incompleta',
        description: 'Verifique os itens obrigatórios destacados',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const calculateTotal = (): number => {
    if (!product) return 0;

    // Preço base (tamanho ou base_price)
    const basePrice = selectedSize?.price ?? product.base_price;

    // Soma dos adicionais
    const addonsPrice = selectedAddons.reduce(
      (sum, addon) => sum + addon.item.price * addon.quantity,
      0
    );

    return (basePrice + addonsPrice) * quantity;
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Validar seleções
    if (!validateSelections()) return;

    try {
      // Agrupar adicionais por grupo
      const addonGroups: CartAddonGroup[] = product.addonGroups
        .map((group) => {
          const items: CartAddonItem[] = selectedAddons
            .filter((s) => s.groupId === group.groupId)
            .map((s) => ({
              id: s.item.id,
              name: s.item.name,
              price: s.item.price,
              quantity: s.quantity,
            }));

          if (items.length === 0) return null;

          return {
            groupId: group.groupId,
            groupName: group.groupName,
            items,
          };
        })
        .filter((g): g is CartAddonGroup => g !== null);

      addItem({
        productId: product.id,
        productName: product.name,
        productImage: product.image_url,
        size: selectedSize
          ? {
              id: selectedSize.id,
              name: selectedSize.name,
              price: selectedSize.price,
            }
          : undefined,
        addonGroups,
        quantity,
        notes,
        restaurantId: product.restaurant_id,
      });

      toast({
        title: 'Adicionado ao carrinho!',
        description: `${quantity}x ${product.name}${
          selectedSize ? ` (${selectedSize.name})` : ''
        }`,
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

  const isAddonSelected = (itemId: string): boolean => {
    return selectedAddons.some((s) => s.itemId === itemId);
  };

  const getAddonQuantity = (itemId: string): number => {
    return selectedAddons.find((s) => s.itemId === itemId)?.quantity || 0;
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Imagem do Produto */}
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

        {/* Conteúdo */}
        <div className="p-6 space-y-5">
          {/* Header sem imagem */}
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

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Preço Base (se não tem tamanhos) */}
            {!product.has_sizes && (
              <div className="pt-2">
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(product.base_price)}
                </span>
              </div>
            )}
          </div>

          {/* PASSO 1: Tamanhos (se tiver) */}
          {product.has_sizes && product.sizes.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-bold text-foreground">
                  Escolha o tamanho
                </Label>
                <Badge variant="secondary" className="text-xs">
                  Obrigatório
                </Badge>
              </div>
              <RadioGroup
                value={selectedSize?.id}
                onValueChange={handleSizeChange}
                className="space-y-2"
              >
                {product.sizes
                  .filter((size) => size.is_available)
                  .map((size) => (
                    <div
                      key={size.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
                        selectedSize?.id === size.id
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                      )}
                      onClick={() => handleSizeChange(size.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={size.id} id={size.id} />
                        <label
                          htmlFor={size.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {size.name}
                        </label>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(size.price)}
                      </span>
                    </div>
                  ))}
              </RadioGroup>
            </div>
          )}

          {/* PASSO 2: Grupos de Adicionais */}
          {product.addonGroups.map((group) => {
            const hasError = validationErrors.has(group.groupId);
            const selectedCount = selectedAddons
              .filter((s) => s.groupId === group.groupId)
              .reduce((sum, s) => sum + s.quantity, 0);

            return (
              <div
                key={group.groupId}
                className={cn(
                  'space-y-3 border-t pt-4',
                  hasError && 'border-destructive'
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-bold text-foreground">
                      {group.groupName}
                    </Label>
                    {group.isRequired && (
                      <Badge variant="secondary" className="text-xs">
                        Obrigatório
                      </Badge>
                    )}
                  </div>

                  {group.groupDescription && (
                    <p className="text-xs text-muted-foreground">
                      {group.groupDescription}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {group.isRequired && (
                      <span>Mínimo: {group.minQuantity}</span>
                    )}
                    {group.maxQuantity !== null && (
                      <span>Máximo: {group.maxQuantity}</span>
                    )}
                    {selectedCount > 0 && (
                      <span className="font-semibold text-primary">
                        ({selectedCount} selecionado{selectedCount !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>

                  {hasError && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>{validationErrors.get(group.groupId)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {group.items
                    .filter((item) => item.is_available)
                    .map((item) => {
                      const selected = isAddonSelected(item.id);
                      const itemQuantity = getAddonQuantity(item.id);

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg transition-colors',
                            selected
                              ? 'bg-primary/10 border border-primary'
                              : 'bg-muted hover:bg-muted/80'
                          )}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <Checkbox
                              id={item.id}
                              checked={selected}
                              onCheckedChange={(checked) =>
                                handleAddonToggle(
                                  group.groupId,
                                  item,
                                  checked as boolean
                                )
                              }
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <label
                              htmlFor={item.id}
                              className="text-sm font-medium cursor-pointer flex-1"
                            >
                              {item.name}
                            </label>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Quantidade (se permitir múltiplos) */}
                            {selected && group.allowMultiple && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    handleAddonQuantityChange(item.id, -1)
                                  }
                                  disabled={itemQuantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-xs font-bold w-4 text-center">
                                  {itemQuantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    handleAddonQuantityChange(item.id, 1)
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            )}

                            <span className="text-sm font-semibold text-foreground min-w-[60px] text-right">
                              {item.price > 0 ? '+' : ''}
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}

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

        {/* Footer Fixo */}
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
                className="h-9 w-9 rounded-full border-primary text-primary hover:bg-primary/10"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-base font-bold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 99}
                className="h-9 w-9 rounded-full border-primary text-primary hover:bg-primary/10"
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
