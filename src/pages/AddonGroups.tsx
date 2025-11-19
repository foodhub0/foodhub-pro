import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Package,
} from "lucide-react";
import Layout from "@/components/Layout";
import { cn } from "@/lib/utils";
import type {
  ProductAddonGroup,
  AddonGroupItem,
  ProductAddonGroupInsert,
  AddonGroupItemInsert,
} from "@/types/products";

interface AddonGroupWithItems extends ProductAddonGroup {
  addon_group_items: AddonGroupItem[];
}

const AddonGroups = () => {
  const { toast } = useToast();
  const [groups, setGroups] = useState<AddonGroupWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProductAddonGroup | null>(null);
  const [editingItem, setEditingItem] = useState<AddonGroupItem | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const [itemForm, setItemForm] = useState({
    name: "",
    price: "",
    is_available: true,
  });

  useEffect(() => {
    loadRestaurant();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      loadGroups();
    }
  }, [restaurantId]);

  const loadRestaurant = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const metadata = user.user_metadata || {};
    const brandId = metadata.brand_id;
    const resId = metadata.restaurant_id;

    if (resId) {
      setRestaurantId(resId);
    } else if (brandId) {
      // Se não tem restaurant_id específico, pegar primeiro restaurante da marca
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("brand_id", brandId)
        .single();

      if (restaurant) {
        setRestaurantId(restaurant.id);
      }
    }
  };

  const loadGroups = async () => {
    if (!restaurantId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("product_addon_groups")
      .select(
        `
        *,
        addon_group_items (
          *,
          order: display_order.asc
        )
      `
      )
      .eq("restaurant_id", restaurantId)
      .order("name");

    if (error) {
      toast({
        title: "Erro ao carregar grupos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setGroups(data || []);
    }
    setLoading(false);
  };

  // ============================================================================
  // GRUPOS - CRUD
  // ============================================================================

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    const groupData: ProductAddonGroupInsert = {
      name: groupForm.name,
      description: groupForm.description || null,
      is_active: groupForm.is_active,
      restaurant_id: restaurantId,
    };

    let error;
    if (editingGroup) {
      ({ error } = await supabase
        .from("product_addon_groups")
        .update(groupData)
        .eq("id", editingGroup.id));
    } else {
      ({ error } = await supabase.from("product_addon_groups").insert(groupData));
    }

    if (error) {
      toast({
        title: "Erro ao salvar grupo",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: editingGroup ? "Grupo atualizado!" : "Grupo criado!",
      });
      setGroupDialogOpen(false);
      resetGroupForm();
      loadGroups();
    }
  };

  const handleEditGroup = (group: ProductAddonGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || "",
      is_active: group.is_active,
    });
    setGroupDialogOpen(true);
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este grupo? Todos os itens serão removidos."))
      return;

    const { error } = await supabase.from("product_addon_groups").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir grupo",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Grupo excluído!" });
      loadGroups();
    }
  };

  const resetGroupForm = () => {
    setEditingGroup(null);
    setGroupForm({
      name: "",
      description: "",
      is_active: true,
    });
  };

  // ============================================================================
  // ITENS - CRUD
  // ============================================================================

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) return;

    // Buscar o último display_order
    const currentGroup = groups.find((g) => g.id === selectedGroupId);
    const maxOrder =
      currentGroup?.addon_group_items.reduce(
        (max, item) => Math.max(max, item.display_order),
        0
      ) ?? 0;

    const itemData: AddonGroupItemInsert = {
      addon_group_id: selectedGroupId,
      name: itemForm.name,
      price: parseFloat(itemForm.price),
      is_available: itemForm.is_available,
      display_order: editingItem ? editingItem.display_order : maxOrder + 1,
    };

    let error;
    if (editingItem) {
      ({ error } = await supabase
        .from("addon_group_items")
        .update(itemData)
        .eq("id", editingItem.id));
    } else {
      ({ error } = await supabase.from("addon_group_items").insert(itemData));
    }

    if (error) {
      toast({
        title: "Erro ao salvar item",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: editingItem ? "Item atualizado!" : "Item criado!",
      });
      setItemDialogOpen(false);
      resetItemForm();
      loadGroups();
    }
  };

  const handleEditItem = (groupId: string, item: AddonGroupItem) => {
    setSelectedGroupId(groupId);
    setEditingItem(item);
    setItemForm({
      name: item.name,
      price: item.price.toString(),
      is_available: item.is_available,
    });
    setItemDialogOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    const { error } = await supabase.from("addon_group_items").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir item",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Item excluído!" });
      loadGroups();
    }
  };

  const handleMoveItem = async (item: AddonGroupItem, direction: "up" | "down") => {
    const group = groups.find((g) =>
      g.addon_group_items.some((i) => i.id === item.id)
    );
    if (!group) return;

    const items = [...group.addon_group_items].sort(
      (a, b) => a.display_order - b.display_order
    );
    const currentIndex = items.findIndex((i) => i.id === item.id);

    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === items.length - 1) return;

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const currentItem = items[currentIndex];
    const swapItem = items[swapIndex];

    // Trocar display_order
    const { error: error1 } = await supabase
      .from("addon_group_items")
      .update({ display_order: swapItem.display_order })
      .eq("id", currentItem.id);

    const { error: error2 } = await supabase
      .from("addon_group_items")
      .update({ display_order: currentItem.display_order })
      .eq("id", swapItem.id);

    if (error1 || error2) {
      toast({
        title: "Erro ao reordenar",
        variant: "destructive",
      });
    } else {
      loadGroups();
    }
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setSelectedGroupId(null);
    setItemForm({
      name: "",
      price: "",
      is_available: true,
    });
  };

  const openAddItemDialog = (groupId: string) => {
    setSelectedGroupId(groupId);
    resetItemForm();
    setItemDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Grupos de Adicionais</h1>
            <p className="text-muted-foreground">
              Organize adicionais em grupos (Sabores, Borda, Extras, etc)
            </p>
          </div>

          <Dialog
            open={groupDialogOpen}
            onOpenChange={(open) => {
              setGroupDialogOpen(open);
              if (!open) resetGroupForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Grupo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingGroup ? "Editar Grupo" : "Novo Grupo"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitGroup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Nome *</Label>
                  <Input
                    id="group-name"
                    value={groupForm.name}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, name: e.target.value })
                    }
                    placeholder="Ex: Sabores, Borda, Extras"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-description">Descrição</Label>
                  <Textarea
                    id="group-description"
                    value={groupForm.description}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, description: e.target.value })
                    }
                    placeholder="Descrição opcional do grupo"
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="group-active">Grupo ativo</Label>
                  <Switch
                    id="group-active"
                    checked={groupForm.is_active}
                    onCheckedChange={(checked) =>
                      setGroupForm({ ...groupForm, is_active: checked })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingGroup ? "Atualizar" : "Criar"} Grupo
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Grupos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Layers className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Nenhum grupo cadastrado
              </p>
              <p className="text-muted-foreground mb-4">
                Comece criando grupos para organizar seus adicionais
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {groups.map((group) => (
              <Card key={group.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{group.name}</CardTitle>
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded",
                            group.is_active
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {group.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {group.addon_group_items?.length || 0}{" "}
                        {group.addon_group_items?.length === 1 ? "item" : "itens"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditGroup(group)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* Botão Adicionar Item */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mb-3"
                    onClick={() => openAddItemDialog(group.id)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Adicionar Item
                  </Button>

                  {/* Lista de Itens */}
                  {group.addon_group_items && group.addon_group_items.length > 0 ? (
                    <div className="space-y-2">
                      {[...group.addon_group_items]
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((item, index, array) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            {/* Botões de Ordem */}
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMoveItem(item, "up")}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMoveItem(item, "down")}
                                disabled={index === array.length - 1}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Info do Item */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {item.name}
                                </span>
                                {!item.is_available && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                    Indisponível
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-primary">
                                {formatCurrency(item.price)}
                              </span>
                            </div>

                            {/* Ações */}
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditItem(group.id, item)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum item neste grupo
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog Adicionar/Editar Item */}
        <Dialog
          open={itemDialogOpen}
          onOpenChange={(open) => {
            setItemDialogOpen(open);
            if (!open) resetItemForm();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitItem} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Nome *</Label>
                <Input
                  id="item-name"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="Ex: Mussarela, Catupiry, Orégano"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-price">Preço Adicional *</Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use R$ 0,00 para itens sem custo adicional
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="item-available">Item disponível</Label>
                <Switch
                  id="item-available"
                  checked={itemForm.is_available}
                  onCheckedChange={(checked) =>
                    setItemForm({ ...itemForm, is_available: checked })
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                {editingItem ? "Atualizar" : "Criar"} Item
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AddonGroups;
