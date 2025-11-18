import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Grid3x3, Package, Wine } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Combo {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  margin: number;
  is_active: boolean;
}

interface ComboItem {
  id: string;
  combo_id: string;
  item_type: 'product' | 'beverage' | 'additional';
  item_id: string;
  quantity: number;
  item_name?: string;
  item_price?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

const CombosModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "0",
    discount_percentage: "10",
  });
  const [comboItems, setComboItems] = useState<Array<{
    item_type: 'product' | 'beverage' | 'additional';
    item_id: string;
    quantity: number;
  }>>([]);

  const { data: restaurant } = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("restaurants").select("*").eq("owner_id", user.id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: combos = [], isLoading } = useQuery({
    queryKey: ["combos", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const { data, error } = await supabase
        .from("combos")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("name");
      if (error) throw error;
      return data as Combo[];
    },
    enabled: !!restaurant?.id,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price")
        .eq("restaurant_id", restaurant.id)
        .eq("is_available", true)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!restaurant?.id,
  });

  const { data: beverages = [] } = useQuery({
    queryKey: ["beverages", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const { data, error } = await supabase
        .from("beverages")
        .select("id, name, sell_price")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data.map(b => ({ id: b.id, name: b.name, price: b.sell_price }));
    },
    enabled: !!restaurant?.id,
  });

  const { data: additionals = [] } = useQuery({
    queryKey: ["additionals", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const { data, error } = await supabase
        .from("additionals")
        .select("id, name, price")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!restaurant?.id,
  });

  const calculateComboPrice = () => {
    let totalCost = 0;
    comboItems.forEach(item => {
      let itemPrice = 0;
      if (item.item_type === 'product') {
        const product = products.find(p => p.id === item.item_id);
        itemPrice = product?.price || 0;
      } else if (item.item_type === 'beverage') {
        const beverage = beverages.find(b => b.id === item.item_id);
        itemPrice = beverage?.price || 0;
      } else if (item.item_type === 'additional') {
        const additional = additionals.find(a => a.id === item.item_id);
        itemPrice = additional?.price || 0;
      }
      totalCost += itemPrice * item.quantity;
    });

    const discountPercentage = parseFloat(formData.discount_percentage) || 0;
    const discountedPrice = totalCost * (1 - discountPercentage / 100);
    return { totalCost, discountedPrice };
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!restaurant?.id) throw new Error("Restaurant not found");

      const { totalCost, discountedPrice } = calculateComboPrice();
      const margin = totalCost > 0 ? ((discountedPrice - totalCost) / totalCost) * 100 : 0;

      const comboData = {
        restaurant_id: restaurant.id,
        name: data.name,
        description: data.description || null,
        price: discountedPrice,
        cost: totalCost,
        margin: margin,
        is_active: true,
      };

      if (editingCombo) {
        const { error } = await supabase.from("combos").update(comboData).eq("id", editingCombo.id);
        if (error) throw error;

        // Delete old items and insert new ones
        await supabase.from("combo_items").delete().eq("combo_id", editingCombo.id);

        if (comboItems.length > 0) {
          const items = comboItems.map(item => ({
            combo_id: editingCombo.id,
            item_type: item.item_type,
            item_id: item.item_id,
            quantity: item.quantity,
          }));
          const { error: itemsError } = await supabase.from("combo_items").insert(items);
          if (itemsError) throw itemsError;
        }
      } else {
        const { data: newCombo, error } = await supabase.from("combos").insert(comboData).select().single();
        if (error) throw error;

        if (comboItems.length > 0) {
          const items = comboItems.map(item => ({
            combo_id: newCombo.id,
            item_type: item.item_type,
            item_id: item.item_id,
            quantity: item.quantity,
          }));
          const { error: itemsError } = await supabase.from("combo_items").insert(items);
          if (itemsError) throw itemsError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combos"] });
      toast({ title: editingCombo ? "Combo atualizado!" : "Combo criado!" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar combo", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("combo_items").delete().eq("combo_id", id);
      const { error } = await supabase.from("combos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["combos"] });
      toast({ title: "Combo excluído!" });
    },
  });

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingCombo(null);
    setFormData({ name: "", description: "", price: "0", discount_percentage: "10" });
    setComboItems([]);
  };

  const handleEdit = async (combo: Combo) => {
    setEditingCombo(combo);
    setFormData({
      name: combo.name,
      description: combo.description || "",
      price: combo.price.toString(),
      discount_percentage: "10",
    });

    // Load combo items
    const { data: items } = await supabase
      .from("combo_items")
      .select("*")
      .eq("combo_id", combo.id);

    if (items) {
      setComboItems(items.map(item => ({
        item_type: item.item_type as 'product' | 'beverage' | 'additional',
        item_id: item.item_id,
        quantity: item.quantity,
      })));
    }

    setIsAddDialogOpen(true);
  };

  const addComboItem = () => {
    setComboItems([...comboItems, { item_type: 'product', item_id: '', quantity: 1 }]);
  };

  const removeComboItem = (index: number) => {
    setComboItems(comboItems.filter((_, i) => i !== index));
  };

  const updateComboItem = (index: number, field: string, value: any) => {
    const updated = [...comboItems];
    updated[index] = { ...updated[index], [field]: value };
    setComboItems(updated);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const { totalCost, discountedPrice } = calculateComboPrice();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5" />
            <div>
              <CardTitle>Combos e Promoções</CardTitle>
              <CardDescription>
                Crie combos promocionais com cálculo automático de custo e margem
              </CardDescription>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCombo(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Combo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCombo ? "Editar" : "Novo"} Combo</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Combo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Combo Família, Combo Executivo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do combo"
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base">Itens do Combo</Label>
                    <Button onClick={addComboItem} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </div>

                  {comboItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-3 p-3 bg-muted/50 rounded-lg">
                      <div className="col-span-4">
                        <Label className="text-xs">Tipo</Label>
                        <Select
                          value={item.item_type}
                          onValueChange={(value) => updateComboItem(index, 'item_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product">
                              <div className="flex items-center">
                                <Package className="h-4 w-4 mr-2" />
                                Produto
                              </div>
                            </SelectItem>
                            <SelectItem value="beverage">
                              <div className="flex items-center">
                                <Wine className="h-4 w-4 mr-2" />
                                Bebida
                              </div>
                            </SelectItem>
                            <SelectItem value="additional">
                              <div className="flex items-center">
                                <Plus className="h-4 w-4 mr-2" />
                                Adicional
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-5">
                        <Label className="text-xs">Item</Label>
                        <Select
                          value={item.item_id}
                          onValueChange={(value) => updateComboItem(index, 'item_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.item_type === 'product' && products.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} - {formatCurrency(p.price)}
                              </SelectItem>
                            ))}
                            {item.item_type === 'beverage' && beverages.map(b => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name} - {formatCurrency(b.price)}
                              </SelectItem>
                            ))}
                            {item.item_type === 'additional' && additionals.map(a => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name} - {formatCurrency(a.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Qtd</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateComboItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-1 flex items-end">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeComboItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="discount">Desconto (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    />
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Custo Total dos Itens:</span>
                    <span className="font-semibold">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Desconto ({formData.discount_percentage}%):</span>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(totalCost - discountedPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Preço do Combo:</span>
                    <span className="text-primary">{formatCurrency(discountedPrice)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Economia de {((1 - discountedPrice / totalCost) * 100).toFixed(1)}% para o cliente
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                <Button onClick={() => saveMutation.mutate(formData)} disabled={!formData.name || comboItems.length === 0}>
                  {editingCombo ? "Atualizar" : "Criar"} Combo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : combos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Grid3x3 className="mx-auto h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">Nenhum combo cadastrado</p>
            <p className="text-sm mb-4">
              Crie combos promocionais para aumentar suas vendas
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Economia</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combos.map((combo) => (
                <TableRow key={combo.id}>
                  <TableCell className="font-medium">{combo.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {combo.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(combo.cost)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(combo.price)}</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {((1 - combo.price / combo.cost) * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      combo.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {combo.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(combo)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este combo?")) {
                            deleteMutation.mutate(combo.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CombosModule;
