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
import { Plus, Pencil, Trash2, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VariableCost {
  id: string;
  name: string;
  category: string;
  amount: number;
  cost_date: string;
}

const VariableCostsModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<VariableCost | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "embalagens",
    amount: "0",
    cost_date: new Date().toISOString().split('T')[0],
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

  const { data: variableCosts = [], isLoading } = useQuery({
    queryKey: ["variable_costs", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const { data, error } = await supabase.from("variable_costs").select("*").eq("restaurant_id", restaurant.id).order("cost_date", { ascending: false });
      if (error) throw error;
      return data as VariableCost[];
    },
    enabled: !!restaurant?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!restaurant?.id) throw new Error("Restaurant not found");
      const costData = {
        restaurant_id: restaurant.id,
        name: data.name,
        category: data.category,
        amount: parseFloat(data.amount),
        cost_date: data.cost_date,
        is_percentage: false,
      };
      if (editingCost) {
        const { error } = await supabase.from("variable_costs").update(costData).eq("id", editingCost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("variable_costs").insert(costData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variable_costs"] });
      toast({ title: editingCost ? "Custo atualizado!" : "Custo adicionado!" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar custo", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("variable_costs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variable_costs"] });
      toast({ title: "Custo excluído!" });
    },
  });

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingCost(null);
    setFormData({ name: "", category: "embalagens", amount: "0", cost_date: new Date().toISOString().split('T')[0] });
  };

  const handleEdit = (cost: VariableCost) => {
    setEditingCost(cost);
    setFormData({ name: cost.name, category: cost.category, amount: cost.amount.toString(), cost_date: cost.cost_date });
    setIsAddDialogOpen(true);
  };

  const total = variableCosts.reduce((sum, cost) => sum + cost.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Custos Variáveis</CardTitle>
            <CardDescription>Registre custos variáveis como embalagens, delivery e taxas</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Adicionar Custo Variável</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCost ? "Editar Custo Variável" : "Adicionar Novo Custo Variável"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: Embalagens" />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="embalagens">Embalagens</SelectItem>
                          <SelectItem value="taxa_delivery">Taxa Delivery</SelectItem>
                          <SelectItem value="taxa_plataforma">Taxa Plataforma</SelectItem>
                          <SelectItem value="taxa_cartao">Taxa Cartão</SelectItem>
                          <SelectItem value="gasolina">Gasolina</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
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
                      <Label>Data *</Label>
                      <Input type="date" value={formData.cost_date} onChange={(e) => setFormData({ ...formData, cost_date: e.target.value })} required />
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
        <div className="mb-4 p-4 bg-secondary/10 rounded-lg">
          <p className="text-sm font-medium">Total: <span className="text-lg font-bold">R$ {total.toFixed(2)}</span></p>
        </div>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : variableCosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>Nenhum custo variável cadastrado ainda.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variableCosts.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">{cost.name}</TableCell>
                    <TableCell className="capitalize">{cost.category.replace("_", " ")}</TableCell>
                    <TableCell>{new Date(cost.cost_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">R$ {cost.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cost)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir?")) deleteMutation.mutate(cost.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default VariableCostsModule;
