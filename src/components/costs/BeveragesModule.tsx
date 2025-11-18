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
import { Plus, Pencil, Trash2, Download, Wine } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Beverage {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  size?: string;
  volume_ml?: number;
  cost: number;
  price: number;
  image_url?: string;
  is_active: boolean;
}

interface BeverageCategory {
  id: string;
  name: string;
}

const BeveragesModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBeverage, setEditingBeverage] = useState<Beverage | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    size: "",
    volume_ml: "",
    cost: "0",
    price: "0",
    image_url: "",
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
    queryKey: ["beverage_categories", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];

      const { data, error } = await supabase
        .from("beverage_categories")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("display_order");

      if (error) throw error;
      return data as BeverageCategory[];
    },
    enabled: !!restaurant?.id,
  });

  // Fetch beverages
  const { data: beverages = [], isLoading } = useQuery({
    queryKey: ["beverages", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];

      const { data, error } = await supabase
        .from("beverages")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("name");

      if (error) throw error;
      return data as Beverage[];
    },
    enabled: !!restaurant?.id,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!restaurant?.id) throw new Error("Restaurant not found");

      const beverageData = {
        restaurant_id: restaurant.id,
        name: data.name,
        description: data.description || null,
        category_id: data.category_id || null,
        size: data.size || null,
        volume_ml: data.volume_ml ? parseInt(data.volume_ml) : null,
        cost: parseFloat(data.cost),
        price: parseFloat(data.price),
        image_url: data.image_url || null,
        is_active: true,
      };

      if (editingBeverage) {
        const { error } = await supabase
          .from("beverages")
          .update(beverageData)
          .eq("id", editingBeverage.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("beverages")
          .insert(beverageData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beverages"] });
      toast({
        title: editingBeverage ? "Bebida atualizada!" : "Bebida adicionada!",
        description: "As alterações foram salvas com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar bebida",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("beverages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beverages"] });
      toast({
        title: "Bebida excluída!",
        description: "A bebida foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir bebida",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingBeverage(null);
    setFormData({
      name: "",
      description: "",
      category_id: "",
      size: "",
      volume_ml: "",
      cost: "0",
      price: "0",
      image_url: "",
    });
  };

  const handleEdit = (beverage: Beverage) => {
    setEditingBeverage(beverage);
    setFormData({
      name: beverage.name,
      description: beverage.description || "",
      category_id: beverage.category_id || "",
      size: beverage.size || "",
      volume_ml: beverage.volume_ml?.toString() || "",
      cost: beverage.cost.toString(),
      price: beverage.price.toString(),
      image_url: beverage.image_url || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Nome", "Descrição", "Categoria", "Tamanho", "Volume (ml)", "Custo", "Preço"],
      ...beverages.map(bev => [
        bev.name,
        bev.description || "",
        getCategoryName(bev.category_id),
        bev.size || "",
        bev.volume_ml?.toString() || "",
        bev.cost.toString(),
        bev.price.toString(),
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bebidas_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({
      title: "Exportado com sucesso!",
      description: "As bebidas foram exportadas para CSV.",
    });
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "-";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "-";
  };

  const calculateMargin = (cost: number, price: number) => {
    if (price === 0) return 0;
    return (((price - cost) / price) * 100).toFixed(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bebidas</CardTitle>
            <CardDescription>
              Gerencie o cardápio de bebidas com custos e preços
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV} disabled={beverages.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Bebida
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingBeverage ? "Editar Bebida" : "Adicionar Nova Bebida"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as informações da bebida abaixo
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
                          placeholder="Ex: Coca-Cola 350ml"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Select
                          value={formData.category_id}
                          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descrição opcional da bebida"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="size">Tamanho</Label>
                        <Input
                          id="size"
                          value={formData.size}
                          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                          placeholder="Ex: 350ml, 1L, 2L"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="volume_ml">Volume (ml)</Label>
                        <Input
                          id="volume_ml"
                          type="number"
                          value={formData.volume_ml}
                          onChange={(e) => setFormData({ ...formData, volume_ml: e.target.value })}
                          placeholder="350"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cost">Custo (R$) *</Label>
                        <Input
                          id="cost"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.cost}
                          onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Preço de Venda (R$) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {parseFloat(formData.price) > 0 && (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium">
                          Margem de Lucro: {calculateMargin(parseFloat(formData.cost), parseFloat(formData.price))}%
                        </p>
                      </div>
                    )}
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
        ) : beverages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wine className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>Nenhuma bebida cadastrada ainda.</p>
            <p className="text-sm">Clique em "Adicionar Bebida" para começar.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beverages.map((beverage) => (
                  <TableRow key={beverage.id}>
                    <TableCell className="font-medium">{beverage.name}</TableCell>
                    <TableCell>{getCategoryName(beverage.category_id)}</TableCell>
                    <TableCell>{beverage.size || "-"}</TableCell>
                    <TableCell className="text-right">
                      R$ {beverage.cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {beverage.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={beverage.price > beverage.cost ? "text-green-600" : "text-red-600"}>
                        {calculateMargin(beverage.cost, beverage.price)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(beverage)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir esta bebida?")) {
                              deleteMutation.mutate(beverage.id);
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

export default BeveragesModule;
