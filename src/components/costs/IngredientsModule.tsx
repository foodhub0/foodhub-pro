import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, Download, FileSpreadsheet } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Ingredient {
  id: string;
  name: string;
  description?: string;
  unit_type: string;
  cost_per_unit: number;
  minimum_stock?: number;
  current_stock?: number;
  supplier_name?: string;
  supplier_contact?: string;
  category_id?: string;
  is_active: boolean;
}

interface IngredientCategory {
  id: string;
  name: string;
  description?: string;
}

const IngredientsModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit_type: "un",
    cost_per_unit: "0",
    minimum_stock: "0",
    current_stock: "0",
    supplier_name: "",
    supplier_contact: "",
    category_id: "",
  });

  // Get restaurant ID
  const { data: restaurant } = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["ingredient_categories", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];

      const { data, error } = await supabase
        .from("ingredient_categories")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("display_order");

      if (error) throw error;
      return data as IngredientCategory[];
    },
    enabled: !!restaurant?.id,
  });

  // Fetch ingredients
  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ["ingredients", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];

      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("name");

      if (error) throw error;
      return data as Ingredient[];
    },
    enabled: !!restaurant?.id,
  });

  // Add/Update ingredient mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!restaurant?.id) throw new Error("Restaurant not found");

      const ingredientData = {
        restaurant_id: restaurant.id,
        name: data.name,
        description: data.description || null,
        unit_type: data.unit_type,
        cost_per_unit: parseFloat(data.cost_per_unit),
        minimum_stock: parseFloat(data.minimum_stock) || 0,
        current_stock: parseFloat(data.current_stock) || 0,
        supplier_name: data.supplier_name || null,
        supplier_contact: data.supplier_contact || null,
        category_id: data.category_id || null,
        is_active: true,
      };

      if (editingIngredient) {
        const { error } = await supabase
          .from("ingredients")
          .update(ingredientData)
          .eq("id", editingIngredient.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ingredients")
          .insert(ingredientData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      toast({
        title: editingIngredient ? "Insumo atualizado!" : "Insumo adicionado!",
        description: "As alterações foram salvas com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar insumo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ingredients")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      toast({
        title: "Insumo excluído!",
        description: "O insumo foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir insumo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingIngredient(null);
    setFormData({
      name: "",
      description: "",
      unit_type: "un",
      cost_per_unit: "0",
      minimum_stock: "0",
      current_stock: "0",
      supplier_name: "",
      supplier_contact: "",
      category_id: "",
    });
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      description: ingredient.description || "",
      unit_type: ingredient.unit_type,
      cost_per_unit: ingredient.cost_per_unit.toString(),
      minimum_stock: (ingredient.minimum_stock || 0).toString(),
      current_stock: (ingredient.current_stock || 0).toString(),
      supplier_name: ingredient.supplier_name || "",
      supplier_contact: ingredient.supplier_contact || "",
      category_id: ingredient.category_id || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Nome", "Descrição", "Unidade", "Custo por Unidade", "Estoque Mínimo", "Estoque Atual", "Fornecedor", "Contato"],
      ...ingredients.map(ing => [
        ing.name,
        ing.description || "",
        ing.unit_type,
        ing.cost_per_unit.toString(),
        (ing.minimum_stock || 0).toString(),
        (ing.current_stock || 0).toString(),
        ing.supplier_name || "",
        ing.supplier_contact || "",
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `insumos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({
      title: "Exportado com sucesso!",
      description: "Os insumos foram exportados para CSV.",
    });
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "-";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "-";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Insumos / Matéria-Prima</CardTitle>
            <CardDescription>
              Cadastre e gerencie todos os ingredientes e materiais utilizados na produção
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV} disabled={ingredients.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Insumo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingIngredient ? "Editar Insumo" : "Adicionar Novo Insumo"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as informações do insumo abaixo
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Ex: Farinha de Trigo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Select
                          value={formData.category_id}
                          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={categories.length === 0 ? "Nenhuma categoria criada" : "Selecione uma categoria"} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                Nenhuma categoria disponível
                              </div>
                            ) : (
                              categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {categories.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Categorias serão criadas automaticamente no primeiro uso.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descrição opcional do insumo"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unit_type">Unidade *</Label>
                        <Select
                          value={formData.unit_type}
                          onValueChange={(value) => setFormData({ ...formData, unit_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="g">Gramas (g)</SelectItem>
                            <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                            <SelectItem value="ml">Mililitros (ml)</SelectItem>
                            <SelectItem value="L">Litros (L)</SelectItem>
                            <SelectItem value="un">Unidade (un)</SelectItem>
                            <SelectItem value="cx">Caixa (cx)</SelectItem>
                            <SelectItem value="pct">Pacote (pct)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cost_per_unit">Custo por Unidade (R$) *</Label>
                        <Input
                          id="cost_per_unit"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.cost_per_unit}
                          onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minimum_stock">Estoque Mínimo</Label>
                        <Input
                          id="minimum_stock"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.minimum_stock}
                          onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="current_stock">Estoque Atual</Label>
                        <Input
                          id="current_stock"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.current_stock}
                          onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplier_name">Fornecedor</Label>
                        <Input
                          id="supplier_name"
                          value={formData.supplier_name}
                          onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                          placeholder="Nome do fornecedor"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier_contact">Contato</Label>
                        <Input
                          id="supplier_contact"
                          value={formData.supplier_contact}
                          onChange={(e) => setFormData({ ...formData, supplier_contact: e.target.value })}
                          placeholder="Telefone/Email"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : ingredients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>Nenhum insumo cadastrado ainda.</p>
            <p className="text-sm">Clique em "Adicionar Insumo" para começar.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Custo/Un.</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>{getCategoryName(ingredient.category_id)}</TableCell>
                    <TableCell>{ingredient.unit_type}</TableCell>
                    <TableCell className="text-right">
                      R$ {ingredient.cost_per_unit.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(ingredient.current_stock || 0).toFixed(2)}
                      {ingredient.minimum_stock && ingredient.current_stock && ingredient.current_stock < ingredient.minimum_stock && (
                        <span className="ml-2 text-xs text-destructive">⚠</span>
                      )}
                    </TableCell>
                    <TableCell>{ingredient.supplier_name || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(ingredient)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir este insumo?")) {
                              deleteMutation.mutate(ingredient.id);
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IngredientsModule;
