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
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Additional {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
}

const AdditionalsModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAdditional, setEditingAdditional] = useState<Additional | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", price: "0" });

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

  const { data: additionals = [], isLoading } = useQuery({
    queryKey: ["additionals", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const { data, error } = await supabase.from("additionals").select("*").eq("restaurant_id", restaurant.id).order("name");
      if (error) throw error;
      return data as Additional[];
    },
    enabled: !!restaurant?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!restaurant?.id) throw new Error("Restaurant not found");
      const additionalData = {
        restaurant_id: restaurant.id,
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        is_active: true,
      };
      if (editingAdditional) {
        const { error } = await supabase.from("additionals").update(additionalData).eq("id", editingAdditional.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("additionals").insert(additionalData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["additionals"] });
      toast({ title: editingAdditional ? "Adicional atualizado!" : "Adicional adicionado!" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar adicional", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("additionals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["additionals"] });
      toast({ title: "Adicional excluído!" });
    },
  });

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingAdditional(null);
    setFormData({ name: "", description: "", price: "0" });
  };

  const handleEdit = (additional: Additional) => {
    setEditingAdditional(additional);
    setFormData({ name: additional.name, description: additional.description || "", price: additional.price.toString() });
    setIsAddDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Adicionais</CardTitle>
            <CardDescription>Configure adicionais, extras e complementos com preços</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Adicionar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAdditional ? "Editar Adicional" : "Novo Adicional"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: Borda recheada, Bacon extra" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição opcional" />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço (R$) *</Label>
                    <Input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
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
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : additionals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Plus className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>Nenhum adicional cadastrado ainda.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {additionals.map((additional) => (
                  <TableRow key={additional.id}>
                    <TableCell className="font-medium">{additional.name}</TableCell>
                    <TableCell>{additional.description || "-"}</TableCell>
                    <TableCell className="text-right">R$ {additional.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(additional)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Excluir?")) deleteMutation.mutate(additional.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default AdditionalsModule;
