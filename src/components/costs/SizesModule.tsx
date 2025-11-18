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
import { Plus, Pencil, Trash2, Ruler, Package } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductVariation {
  id: string;
  product_id: string;
  name: string;
  price: number;
  size_type?: string;
  size_value?: number;
  size_unit?: string;
  is_available: boolean;
  product_name?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

const SizesModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState<ProductVariation | null>(null);
  const [formData, setFormData] = useState({
    product_id: "",
    name: "",
    size_type: "P",
    size_value: "1",
    size_unit: "un",
    price: "0",
  });

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

  const { data: products = [] } = useQuery({
    queryKey: ["products", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price")
        .eq("restaurant_id", restaurant.id)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!restaurant?.id,
  });

  const { data: variations = [], isLoading } = useQuery({
    queryKey: ["product_variations", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const { data, error } = await supabase
        .from("product_variations")
        .select(`
          *,
          products (name)
        `)
        .order("product_id")
        .order("price");

      if (error) throw error;

      return data.map(v => ({
        ...v,
        product_name: v.products?.name
      })) as ProductVariation[];
    },
    enabled: !!restaurant?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.product_id) throw new Error("Selecione um produto");

      const variationData = {
        product_id: data.product_id,
        name: data.name,
        price: parseFloat(data.price),
        size_type: data.size_type,
        size_value: parseFloat(data.size_value),
        size_unit: data.size_unit,
        is_available: true,
      };

      if (editingVariation) {
        const { error } = await supabase
          .from("product_variations")
          .update(variationData)
          .eq("id", editingVariation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("product_variations")
          .insert(variationData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_variations"] });
      toast({ title: editingVariation ? "Tamanho atualizado!" : "Tamanho adicionado!" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar tamanho", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_variations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_variations"] });
      toast({ title: "Tamanho excluído!" });
    },
  });

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingVariation(null);
    setFormData({
      product_id: "",
      name: "",
      size_type: "P",
      size_value: "1",
      size_unit: "un",
      price: "0",
    });
  };

  const handleEdit = (variation: ProductVariation) => {
    setEditingVariation(variation);
    setFormData({
      product_id: variation.product_id,
      name: variation.name,
      size_type: variation.size_type || "P",
      size_value: variation.size_value?.toString() || "1",
      size_unit: variation.size_unit || "un",
      price: variation.price.toString(),
    });
    setIsAddDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const sizeTypes = [
    { value: "P", label: "P (Pequeno)" },
    { value: "M", label: "M (Médio)" },
    { value: "G", label: "G (Grande)" },
    { value: "GG", label: "GG (Extra Grande)" },
    { value: "Broto", label: "Broto" },
    { value: "Família", label: "Família" },
    { value: "Individual", label: "Individual" },
    { value: "Porção", label: "Porção" },
    { value: "Custom", label: "Personalizado" },
  ];

  const units = [
    { value: "un", label: "Unidade" },
    { value: "g", label: "Gramas (g)" },
    { value: "kg", label: "Quilogramas (kg)" },
    { value: "ml", label: "Mililitros (ml)" },
    { value: "L", label: "Litros (L)" },
    { value: "cm", label: "Centímetros (cm)" },
    { value: "fatia", label: "Fatia" },
    { value: "pedaço", label: "Pedaço" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            <div>
              <CardTitle>Tamanhos / Variações</CardTitle>
              <CardDescription>
                Gerencie os tamanhos e variações dos seus produtos
              </CardDescription>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingVariation(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Tamanho
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingVariation ? "Editar" : "Novo"} Tamanho/Variação</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="product">Produto</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2" />
                            {product.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="size_type">Tipo de Tamanho</Label>
                    <Select
                      value={formData.size_type}
                      onValueChange={(value) => setFormData({ ...formData, size_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome da Variação</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Pizza Média, Açaí 500ml"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="size_value">Valor</Label>
                    <Input
                      id="size_value"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.size_value}
                      onChange={(e) => setFormData({ ...formData, size_value: e.target.value })}
                      placeholder="Ex: 500"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="size_unit">Unidade</Label>
                    <Select
                      value={formData.size_unit}
                      onValueChange={(value) => setFormData({ ...formData, size_unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <p className="text-sm text-blue-800">
                    <strong>Exemplo:</strong> Pizza Média com {formData.size_value} {formData.size_unit} por {formatCurrency(parseFloat(formData.price) || 0)}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                <Button
                  onClick={() => saveMutation.mutate(formData)}
                  disabled={!formData.product_id || !formData.name}
                >
                  {editingVariation ? "Atualizar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : variations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Ruler className="mx-auto h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">Nenhum tamanho cadastrado</p>
            <p className="text-sm mb-4">
              Adicione variações de tamanho para seus produtos (P, M, G, etc.)
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Nome da Variação</TableHead>
                <TableHead className="text-right">Valor/Unidade</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variations.map((variation) => (
                <TableRow key={variation.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {variation.product_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {variation.size_type}
                    </span>
                  </TableCell>
                  <TableCell>{variation.name}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {variation.size_value} {variation.size_unit}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(variation.price)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      variation.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {variation.is_available ? 'Disponível' : 'Indisponível'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(variation)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este tamanho?")) {
                            deleteMutation.mutate(variation.id);
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

export default SizesModule;
