import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Download, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FixedCost {
  id: string;
  name: string;
  description?: string;
  category: string;
  amount: number;
  recurring_period: string;
  is_active: boolean;
}

const FixedCostsModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<FixedCost | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "aluguel",
    amount: "0",
    recurring_period: "monthly",
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

  const { data: fixedCosts = [], isLoading } = useQuery({
    queryKey: ["fixed_costs", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const { data, error } = await supabase.from("fixed_costs").select("*").eq("restaurant_id", restaurant.id).order("name");
      if (error) throw error;
      return data as FixedCost[];
    },
    enabled: !!restaurant?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!restaurant?.id) throw new Error("Restaurant not found");
      const costData = {
        restaurant_id: restaurant.id,
        name: data.name,
        description: data.description || null,
        category: data.category,
        amount: parseFloat(data.amount),
        recurring_period: data.recurring_period,
        is_recurring: true,
        is_active: true,
      };
      if (editingCost) {
        const { error } = await supabase.from("fixed_costs").update(costData).eq("id", editingCost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fixed_costs").insert(costData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed_costs"] });
      toast({
        title: editingCost ? "Custo atualizado!" : "Custo adicionado!",
        description: "As alterações foram salvas com sucesso.",
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar custo", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fixed_costs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed_costs"] });
      toast({ title: "Custo excluído!", description: "O custo foi removido com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir custo", description: error.message, variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingCost(null);
    setFormData({ name: "", description: "", category: "aluguel", amount: "0", recurring_period: "monthly" });
  };

  const handleEdit = (cost: FixedCost) => {
    setEditingCost(cost);
    setFormData({
      name: cost.name,
      description: cost.description || "",
      category: cost.category,
      amount: cost.amount.toString(),
      recurring_period: cost.recurring_period,
    });
    setIsAddDialogOpen(true);
  };

  const totalMonthly = fixedCosts.reduce((sum, cost) => {
    if (cost.recurring_period === "monthly") return sum + cost.amount;
    if (cost.recurring_period === "yearly") return sum + (cost.amount / 12);
    return sum;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Custos Fixos</CardTitle>
            <CardDescription>Gerencie despesas fixas mensais como aluguel, salários e contas</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Adicionar Custo Fixo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCost ? "Editar Custo Fixo" : "Adicionar Novo Custo Fixo"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: Aluguel" />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aluguel">Aluguel</SelectItem>
                          <SelectItem value="salarios">Salários</SelectItem>
                          <SelectItem value="energia">Energia</SelectItem>
                          <SelectItem value="agua">Água</SelectItem>
                          <SelectItem value="gas">Gás</SelectItem>
                          <SelectItem value="internet">Internet</SelectItem>
                          <SelectItem value="contador">Contador</SelectItem>
                          <SelectItem value="equipamentos">Equipamentos</SelectItem>
                          <SelectItem value="seguros">Seguros</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor (R$) *</Label>
                      <Input type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Período *</Label>
                      <Select value={formData.recurring_period} onValueChange={(value) => setFormData({ ...formData, recurring_period: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                  <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-primary/10 rounded-lg">
          <p className="text-sm font-medium">Total Mensal: <span className="text-lg font-bold">R$ {totalMonthly.toFixed(2)}</span></p>
        </div>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : fixedCosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>Nenhum custo fixo cadastrado ainda.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fixedCosts.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">{cost.name}</TableCell>
                    <TableCell className="capitalize">{cost.category}</TableCell>
                    <TableCell>{cost.recurring_period === "monthly" ? "Mensal" : "Anual"}</TableCell>
                    <TableCell className="text-right">R$ {cost.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cost)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir este custo?")) deleteMutation.mutate(cost.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default FixedCostsModule;
