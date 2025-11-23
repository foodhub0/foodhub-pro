import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useBrand } from "@/contexts/BrandContext";
import { Switch } from "@/components/ui/switch";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
  restaurant_index: number;
  is_open: boolean;
  created_at: string;
}

const Restaurants = () => {
  const { toast } = useToast();
  const { brand, restaurants, isLoading: brandLoading, refreshBrand } = useBrand();

  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [deletingRestaurant, setDeletingRestaurant] = useState<Restaurant | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const resetForm = () => {
    setName("");
    setSlug("");
    setIsOpen(true);
    setEditingRestaurant(null);
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setName(restaurant.name);
    setSlug(restaurant.slug);
    setIsOpen(restaurant.is_open);
    setDialogOpen(true);
  };

  const openDeleteDialog = (restaurant: Restaurant) => {
    setDeletingRestaurant(restaurant);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do restaurante.",
        variant: "destructive",
      });
      return;
    }

    if (!slug.trim()) {
      toast({
        title: "Slug obrigatório",
        description: "Por favor, informe o slug do restaurante.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      if (editingRestaurant) {
        // Atualizar restaurante existente
        const { error } = await supabase
          .from("restaurants")
          .update({
            name,
            slug,
            is_open: isOpen,
          })
          .eq("id", editingRestaurant.id);

        if (error) throw error;

        toast({
          title: "✅ Restaurante atualizado!",
          description: `${name} foi atualizado com sucesso.`,
        });
      } else {
        // Criar novo restaurante
        const nextIndex = Math.max(...restaurants.map(r => r.restaurant_index), 0) + 1;

        const { error } = await supabase
          .from("restaurants")
          .insert({
            name,
            slug,
            brand_id: brand!.id,
            restaurant_index: nextIndex,
            is_open: isOpen,
          });

        if (error) throw error;

        toast({
          title: "✅ Restaurante criado!",
          description: `${name} foi adicionado à rede com sucesso.`,
        });
      }

      setDialogOpen(false);
      resetForm();
      await refreshBrand();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar restaurante",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRestaurant) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from("restaurants")
        .delete()
        .eq("id", deletingRestaurant.id);

      if (error) throw error;

      toast({
        title: "✅ Restaurante excluído!",
        description: `${deletingRestaurant.name} foi removido da rede.`,
      });

      setDeleteDialogOpen(false);
      setDeletingRestaurant(null);
      await refreshBrand();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir restaurante",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editingRestaurant) {
      setSlug(generateSlug(value));
    }
  };

  if (brandLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!brand) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md p-6">
            <p className="text-center text-muted-foreground mb-4">
              Nenhuma marca encontrada. Por favor, configure sua marca primeiro.
            </p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Restaurantes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as unidades da sua rede
            </p>
          </div>
          <Button onClick={openNewDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Unidade
          </Button>
        </div>

        {/* Lista de Restaurantes */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                      <CardDescription>Unidade {restaurant.restaurant_index}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(restaurant)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(restaurant)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Slug:</span>
                    <span className="font-mono">{restaurant.slug}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={restaurant.is_open ? "default" : "secondary"}>
                      {restaurant.is_open ? "Aberto" : "Fechado"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {restaurants.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum restaurante cadastrado ainda.</p>
                <p className="text-sm mt-1">Clique em "Nova Unidade" para começar.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog Criar/Editar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRestaurant ? "Editar Restaurante" : "Nova Unidade"}
              </DialogTitle>
              <DialogDescription>
                {editingRestaurant
                  ? "Atualize as informações do restaurante"
                  : "Adicione uma nova unidade à sua rede"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Unidade Centro"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="unidade-centro"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: /m/{slug}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="is-open">Restaurante Aberto</Label>
                    <p className="text-sm text-muted-foreground">
                      Aceitar pedidos nesta unidade
                    </p>
                  </div>
                  <Switch
                    id="is-open"
                    checked={isOpen}
                    onCheckedChange={setIsOpen}
                    disabled={loading}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : editingRestaurant ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Deletar */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir <strong>{deletingRestaurant?.name}</strong>?
                <br />
                <br />
                Esta ação não pode ser desfeita. Todos os dados relacionados a este restaurante
                serão permanentemente removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading ? "Excluindo..." : "Excluir Restaurante"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Restaurants;
