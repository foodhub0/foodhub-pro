import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Utensils,
  FolderOpen,
  Layers,
  Package,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Layout from "@/components/Layout";
import ImageUpload from "@/components/ImageUpload";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  is_active: boolean;
  is_featured: boolean;
  category_id: string | null;
  categories?: { name: string };
}

interface AddonGroup {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  addon_group_items?: AddonGroupItem[];
}

interface AddonGroupItem {
  id: string;
  addon_group_id: string;
  name: string;
  price: number;
  display_order: number;
  is_available: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ProductsManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    image_url: "",
    is_active: true,
  });

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    image_url: "",
    base_price: "",
    category_id: "",
    is_active: true,
    is_featured: false,
  });

  // Addon Groups State
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AddonGroup | null>(null);
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

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadRestaurant();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      loadAllData();
    }
  }, [restaurantId]);

  // ============================================================================
  // LOAD DATA
  // ============================================================================

  const loadRestaurant = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (restaurant) {
      setRestaurantId(restaurant.id);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadCategories(),
      loadProducts(),
      loadAddonGroups(),
    ]);
    setLoading(false);
  };

  const loadCategories = async () => {
    if (!restaurantId) return;

    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("display_order");

    setCategories(data || []);
  };

  const loadProducts = async () => {
    if (!restaurantId) return;

    const { data } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("restaurant_id", restaurantId)
      .order("name");

    setProducts(data || []);
  };

  const loadAddonGroups = async () => {
    if (!restaurantId) return;

    const { data } = await supabase
      .from("product_addon_groups")
      .select(`
        *,
        addon_group_items (
          *,
          order: display_order.asc
        )
      `)
      .eq("restaurant_id", restaurantId)
      .order("name");

    setAddonGroups(data || []);
  };

  // ============================================================================
  // CATEGORIES CRUD
  // ============================================================================

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    const categoryData = {
      ...categoryForm,
      restaurant_id: restaurantId,
      display_order: categories.length,
    };

    let error;
    if (editingCategory) {
      ({ error } = await supabase
        .from("categories")
        .update(categoryData)
        .eq("id", editingCategory.id));
    } else {
      ({ error } = await supabase.from("categories").insert(categoryData));
    }

    if (error) {
      toast({
        title: "Erro ao salvar categoria",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: editingCategory ? "Categoria atualizada!" : "Categoria criada!",
      });
      setCategoryDialogOpen(false);
      resetCategoryForm();
      loadCategories();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir categoria",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Categoria excluída!" });
      loadCategories();
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: category.is_active,
    });
    setCategoryDialogOpen(true);
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      description: "",
      image_url: "",
      is_active: true,
    });
  };

  // ============================================================================
  // PRODUCTS CRUD
  // ============================================================================

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    const productData = {
      name: productForm.name,
      description: productForm.description || null,
      image_url: productForm.image_url || null,
      base_price: parseFloat(productForm.base_price),
      category_id: productForm.category_id || null,
      is_active: productForm.is_active,
      is_featured: productForm.is_featured,
      restaurant_id: restaurantId,
    };

    let error;
    if (editingProduct) {
      ({ error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id));
    } else {
      ({ error } = await supabase.from("products").insert(productData));
    }

    if (error) {
      toast({
        title: "Erro ao salvar produto",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: editingProduct ? "Produto atualizado!" : "Produto criado!",
      });
      setProductDialogOpen(false);
      resetProductForm();
      loadProducts();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Produto excluído!" });
      loadProducts();
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      image_url: product.image_url || "",
      base_price: product.base_price.toString(),
      category_id: product.category_id || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setProductDialogOpen(true);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      image_url: "",
      base_price: "",
      category_id: "",
      is_active: true,
      is_featured: false,
    });
  };

  // ============================================================================
  // ADDON GROUPS CRUD
  // ============================================================================

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    const groupData = {
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
      loadAddonGroups();
    }
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
      loadAddonGroups();
    }
  };

  const handleEditGroup = (group: AddonGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || "",
      is_active: group.is_active,
    });
    setGroupDialogOpen(true);
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
  // ADDON ITEMS CRUD
  // ============================================================================

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) return;

    const currentGroup = addonGroups.find((g) => g.id === selectedGroupId);
    const maxOrder =
      currentGroup?.addon_group_items?.reduce(
        (max, item) => Math.max(max, item.display_order),
        0
      ) ?? 0;

    const itemData = {
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
      loadAddonGroups();
    }
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
      loadAddonGroups();
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

  const handleMoveItem = async (item: AddonGroupItem, direction: "up" | "down") => {
    const group = addonGroups.find((g) =>
      g.addon_group_items?.some((i) => i.id === item.id)
    );
    if (!group || !group.addon_group_items) return;

    const items = [...group.addon_group_items].sort(
      (a, b) => a.display_order - b.display_order
    );
    const currentIndex = items.findIndex((i) => i.id === item.id);

    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === items.length - 1) return;

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const currentItem = items[currentIndex];
    const swapItem = items[swapIndex];

    await Promise.all([
      supabase
        .from("addon_group_items")
        .update({ display_order: swapItem.display_order })
        .eq("id", currentItem.id),
      supabase
        .from("addon_group_items")
        .update({ display_order: currentItem.display_order })
        .eq("id", swapItem.id),
    ]);

    loadAddonGroups();
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

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie categorias, produtos e adicionais em um só lugar
          </p>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">
              <FolderOpen className="h-4 w-4 mr-2" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="products">
              <Utensils className="h-4 w-4 mr-2" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="addons">
              <Layers className="h-4 w-4 mr-2" />
              Adicionais
            </TabsTrigger>
          </TabsList>

          {/* ================================================================ */}
          {/* CATEGORIES TAB */}
          {/* ================================================================ */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {categories.length} {categories.length === 1 ? "categoria" : "categorias"}
              </p>
              <Dialog
                open={categoryDialogOpen}
                onOpenChange={(open) => {
                  setCategoryDialogOpen(open);
                  if (!open) resetCategoryForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitCategory} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cat-name">Nome *</Label>
                      <Input
                        id="cat-name"
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm({ ...categoryForm, name: e.target.value })
                        }
                        placeholder="Ex: Pizzas"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cat-description">Descrição</Label>
                      <Textarea
                        id="cat-description"
                        value={categoryForm.description}
                        onChange={(e) =>
                          setCategoryForm({ ...categoryForm, description: e.target.value })
                        }
                        placeholder="Descrição da categoria"
                        rows={3}
                      />
                    </div>
                    <ImageUpload
                      value={categoryForm.image_url}
                      onChange={(url) =>
                        setCategoryForm({ ...categoryForm, image_url: url || "" })
                      }
                      label="Imagem da Categoria"
                      folder="categorias"
                    />
                    <div className="flex items-center justify-between">
                      <Label htmlFor="cat-active">Categoria ativa</Label>
                      <Switch
                        id="cat-active"
                        checked={categoryForm.is_active}
                        onCheckedChange={(checked) =>
                          setCategoryForm({ ...categoryForm, is_active: checked })
                        }
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingCategory ? "Atualizar" : "Criar"} Categoria
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {categories.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">
                    Nenhuma categoria criada
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Comece criando sua primeira categoria
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {category.image_url && (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <p className="text-sm text-muted-foreground mb-2">
                        {category.description || "Sem descrição"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded",
                            category.is_active
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {category.is_active ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ================================================================ */}
          {/* PRODUCTS TAB */}
          {/* ================================================================ */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {products.length} {products.length === 1 ? "produto" : "produtos"}
              </p>
              <Dialog
                open={productDialogOpen}
                onOpenChange={(open) => {
                  setProductDialogOpen(open);
                  if (!open) resetProductForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? "Editar Produto" : "Novo Produto"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitProduct} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="prod-name">Nome *</Label>
                      <Input
                        id="prod-name"
                        value={productForm.name}
                        onChange={(e) =>
                          setProductForm({ ...productForm, name: e.target.value })
                        }
                        placeholder="Ex: Pizza Margherita"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prod-category">Categoria</Label>
                      <Select
                        value={productForm.category_id}
                        onValueChange={(value) =>
                          setProductForm({ ...productForm, category_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prod-description">Descrição</Label>
                      <Textarea
                        id="prod-description"
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm({ ...productForm, description: e.target.value })
                        }
                        placeholder="Descreva o produto"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prod-price">Preço *</Label>
                      <Input
                        id="prod-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={productForm.base_price}
                        onChange={(e) =>
                          setProductForm({ ...productForm, base_price: e.target.value })
                        }
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <ImageUpload
                      value={productForm.image_url}
                      onChange={(url) =>
                        setProductForm({ ...productForm, image_url: url || "" })
                      }
                      label="Imagem do Produto"
                      folder="produtos"
                    />
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prod-active">Produto ativo</Label>
                      <Switch
                        id="prod-active"
                        checked={productForm.is_active}
                        onCheckedChange={(checked) =>
                          setProductForm({ ...productForm, is_active: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prod-featured">Produto em destaque</Label>
                      <Switch
                        id="prod-featured"
                        checked={productForm.is_featured}
                        onCheckedChange={(checked) =>
                          setProductForm({ ...productForm, is_featured: checked })
                        }
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingProduct ? "Atualizar" : "Criar"} Produto
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {products.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Utensils className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">
                    Nenhum produto cadastrado
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Comece adicionando produtos ao seu cardápio
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {product.name}
                        </CardTitle>
                        {product.categories && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {product.categories.name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description || "Sem descrição"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(product.base_price)}
                        </span>
                        <div className="flex gap-2">
                          {product.is_featured && (
                            <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent">
                              Destaque
                            </span>
                          )}
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded",
                              product.is_active
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {product.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ================================================================ */}
          {/* ADDONS TAB */}
          {/* ================================================================ */}
          <TabsContent value="addons" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {addonGroups.length} {addonGroups.length === 1 ? "grupo" : "grupos"}
              </p>
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

            {addonGroups.length === 0 ? (
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
                {addonGroups.map((group) => (
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mb-3"
                        onClick={() => openAddItemDialog(group.id)}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Adicionar Item
                      </Button>

                      {group.addon_group_items && group.addon_group_items.length > 0 ? (
                        <div className="space-y-2">
                          {[...group.addon_group_items]
                            .sort((a, b) => a.display_order - b.display_order)
                            .map((item, index, array) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
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
          </TabsContent>
        </Tabs>

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

export default ProductsManagement;
