import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, QrCode, Edit2, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Table {
  id: string;
  table_number: string;
  capacity: number;
  is_available: boolean;
  qr_code: string | null;
}

const Tables = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<Table[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    table_number: "",
    capacity: "4",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!restaurant) return;

    setRestaurantId(restaurant.id);
    await loadTables(restaurant.id);
    setLoading(false);
  };

  const loadTables = async (restaurantId: string) => {
    const { data } = await supabase
      .from("tables")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("table_number");

    setTables(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    const tableData = {
      restaurant_id: restaurantId,
      table_number: formData.table_number,
      capacity: parseInt(formData.capacity),
      is_available: true,
    };

    if (editingTable) {
      const { error } = await supabase
        .from("tables")
        .update(tableData)
        .eq("id", editingTable.id);

      if (error) {
        toast({
          title: "Erro ao atualizar mesa",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Mesa atualizada com sucesso!" });
        await loadTables(restaurantId);
        resetForm();
      }
    } else {
      const { error } = await supabase.from("tables").insert(tableData);

      if (error) {
        toast({
          title: "Erro ao criar mesa",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Mesa criada com sucesso!" });
        await loadTables(restaurantId);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta mesa?")) return;

    const { error } = await supabase.from("tables").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir mesa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Mesa excluída com sucesso!" });
      if (restaurantId) await loadTables(restaurantId);
    }
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity.toString(),
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ table_number: "", capacity: "4" });
    setEditingTable(null);
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mesas</h1>
            <p className="text-muted-foreground">
              Gerencie as mesas do seu restaurante
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Mesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTable ? "Editar Mesa" : "Nova Mesa"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="table_number">Número da Mesa *</Label>
                  <Input
                    id="table_number"
                    value={formData.table_number}
                    onChange={(e) =>
                      setFormData({ ...formData, table_number: e.target.value })
                    }
                    placeholder="Ex: 1, A1, VIP-1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacidade (pessoas) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingTable ? "Atualizar" : "Criar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {tables.length === 0 ? (
          <Card className="p-16 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhuma mesa cadastrada ainda
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Mesa
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table) => (
              <Card key={table.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        Mesa {table.table_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Capacidade: {table.capacity} pessoas
                      </p>
                    </div>
                    <Badge variant={table.is_available ? "default" : "secondary"}>
                      {table.is_available ? "Disponível" : "Ocupada"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(table)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        toast({
                          title: "QR Code",
                          description: "Funcionalidade em desenvolvimento",
                        });
                      }}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDelete(table.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tables;
