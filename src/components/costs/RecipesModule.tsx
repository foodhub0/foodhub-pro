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
import { Plus, Pencil, Trash2, UtensilsCrossed, Package, ChefHat } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface RecipeIngredient {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantity_needed: number;
  ingredient_name?: string;
  ingredient_unit?: string;
  ingredient_cost?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Ingredient {
  id: string;
  name: string;
  unit_type: string;
  cost_per_unit: number;
}

interface ProductRecipe {
  product_id: string;
  product_name: string;
  ingredients: RecipeIngredient[];
  total_cost: number;
}

const RecipesModule = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<Array<{
    ingredient_id: string;
    quantity_needed: number;
  }>>([]);

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

  const { data: ingredients = [] } = useQuery({
    queryKey: ["ingredients", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const { data, error } = await supabase
        .from("ingredients")
        .select("id, name, unit_type, cost_per_unit")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Ingredient[];
    },
    enabled: !!restaurant?.id,
  });

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipe_ingredients", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];

      const { data, error } = await supabase
        .from("recipe_ingredients")
        .select(`
          *,
          products (name, price),
          ingredients (name, unit_type, cost_per_unit)
        `)
        .order("product_id");

      if (error) throw error;

      // Group by product
      const grouped: { [key: string]: ProductRecipe } = {};

      data.forEach((item: any) => {
        if (!grouped[item.product_id]) {
          grouped[item.product_id] = {
            product_id: item.product_id,
            product_name: item.products?.name || 'Unknown',
            ingredients: [],
            total_cost: 0,
          };
        }

        const ingredientCost = (item.ingredients?.cost_per_unit || 0) * item.quantity_needed;

        grouped[item.product_id].ingredients.push({
          id: item.id,
          product_id: item.product_id,
          ingredient_id: item.ingredient_id,
          quantity_needed: item.quantity_needed,
          ingredient_name: item.ingredients?.name,
          ingredient_unit: item.ingredients?.unit_type,
          ingredient_cost: ingredientCost,
        });

        grouped[item.product_id].total_cost += ingredientCost;
      });

      return Object.values(grouped);
    },
    enabled: !!restaurant?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("Selecione um produto");
      if (recipeIngredients.length === 0) throw new Error("Adicione pelo menos um ingrediente");

      // Delete existing recipe for this product
      await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("product_id", selectedProduct);

      // Insert new recipe ingredients
      const ingredientsData = recipeIngredients
        .filter(item => item.ingredient_id && item.quantity_needed > 0)
        .map(item => ({
          product_id: selectedProduct,
          ingredient_id: item.ingredient_id,
          quantity_needed: item.quantity_needed,
        }));

      if (ingredientsData.length > 0) {
        const { error } = await supabase
          .from("recipe_ingredients")
          .insert(ingredientsData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe_ingredients"] });
      toast({ title: "Receita salva com sucesso!" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar receita", description: error.message, variant: "destructive" });
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("product_id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe_ingredients"] });
      toast({ title: "Receita excluída!" });
    },
  });

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setSelectedProduct(null);
    setRecipeIngredients([]);
  };

  const handleEditRecipe = async (recipe: ProductRecipe) => {
    setSelectedProduct(recipe.product_id);
    setRecipeIngredients(
      recipe.ingredients.map(ing => ({
        ingredient_id: ing.ingredient_id,
        quantity_needed: ing.quantity_needed,
      }))
    );
    setIsAddDialogOpen(true);
  };

  const addIngredientToRecipe = () => {
    setRecipeIngredients([...recipeIngredients, { ingredient_id: '', quantity_needed: 0 }]);
  };

  const removeIngredientFromRecipe = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const updateRecipeIngredient = (index: number, field: string, value: any) => {
    const updated = [...recipeIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeIngredients(updated);
  };

  const calculateRecipeCost = () => {
    let total = 0;
    recipeIngredients.forEach(item => {
      if (item.ingredient_id && item.quantity_needed > 0) {
        const ingredient = ingredients.find(ing => ing.id === item.ingredient_id);
        if (ingredient) {
          total += ingredient.cost_per_unit * item.quantity_needed;
        }
      }
    });
    return total;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const recipeCost = calculateRecipeCost();
  const selectedProductData = products.find(p => p.id === selectedProduct);
  const margin = selectedProductData && recipeCost > 0
    ? ((selectedProductData.price - recipeCost) / recipeCost) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            <div>
              <CardTitle>Receitas / Fichas Técnicas</CardTitle>
              <CardDescription>
                Vincule ingredientes aos produtos e calcule custos de produção
              </CardDescription>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedProduct(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Receita
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    {selectedProduct ? "Editar" : "Nova"} Receita
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="product">Produto</Label>
                  <Select
                    value={selectedProduct || ""}
                    onValueChange={setSelectedProduct}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-2" />
                              {product.name}
                            </div>
                            <span className="text-xs text-muted-foreground ml-4">
                              {formatCurrency(product.price)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base">Ingredientes da Receita</Label>
                    <Button onClick={addIngredientToRecipe} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Ingrediente
                    </Button>
                  </div>

                  {recipeIngredients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                      <p className="text-sm">Nenhum ingrediente adicionado</p>
                      <p className="text-xs mt-1">Clique em "Adicionar Ingrediente" para começar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recipeIngredients.map((item, index) => {
                        const ingredient = ingredients.find(ing => ing.id === item.ingredient_id);
                        const itemCost = ingredient ? ingredient.cost_per_unit * item.quantity_needed : 0;

                        return (
                          <div key={index} className="grid grid-cols-12 gap-3 p-3 bg-muted/50 rounded-lg items-end">
                            <div className="col-span-6">
                              <Label className="text-xs">Ingrediente</Label>
                              <Select
                                value={item.ingredient_id}
                                onValueChange={(value) => updateRecipeIngredient(index, 'ingredient_id', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ingredients.map(ing => (
                                    <SelectItem key={ing.id} value={ing.id}>
                                      {ing.name} ({ing.unit_type}) - {formatCurrency(ing.cost_per_unit)}/{ing.unit_type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Quantidade</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.quantity_needed}
                                onChange={(e) => updateRecipeIngredient(index, 'quantity_needed', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Unidade</Label>
                              <Input
                                value={ingredient?.unit_type || '-'}
                                disabled
                                className="bg-muted"
                              />
                            </div>
                            <div className="col-span-1">
                              <Label className="text-xs">Custo</Label>
                              <div className="text-xs font-semibold px-2 py-2 bg-green-50 text-green-700 rounded border border-green-200">
                                {formatCurrency(itemCost)}
                              </div>
                            </div>
                            <div className="col-span-1">
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => removeIngredientFromRecipe(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedProductData && recipeIngredients.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg space-y-3 mt-4">
                    <h3 className="font-semibold text-sm text-blue-900">Análise de Custos</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-blue-700 mb-1">Custo Total da Receita</p>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(recipeCost)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-700 mb-1">Preço de Venda</p>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(selectedProductData.price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-700 mb-1">Margem de Lucro</p>
                        <p className={`text-2xl font-bold ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {margin.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-700 mb-1">Lucro por Unidade</p>
                        <p className={`text-2xl font-bold ${(selectedProductData.price - recipeCost) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(selectedProductData.price - recipeCost)}
                        </p>
                      </div>
                    </div>
                    {margin < 30 && (
                      <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mt-2">
                        <p className="text-xs text-yellow-800">
                          ⚠️ Atenção: Margem abaixo do recomendado (mínimo 30%)
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={!selectedProduct || recipeIngredients.length === 0}
                >
                  Salvar Receita
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UtensilsCrossed className="mx-auto h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">Nenhuma receita cadastrada</p>
            <p className="text-sm mb-4">
              Crie fichas técnicas vinculando ingredientes aos seus produtos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recipes.map((recipe) => {
              const product = products.find(p => p.id === recipe.product_id);
              const margin = product && recipe.total_cost > 0
                ? ((product.price - recipe.total_cost) / recipe.total_cost) * 100
                : 0;

              return (
                <Card key={recipe.product_id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <ChefHat className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{recipe.product_name}</CardTitle>
                          <div className="flex gap-3 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {recipe.ingredients.length} ingrediente{recipe.ingredients.length !== 1 ? 's' : ''}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Custo: <strong className="text-foreground">{formatCurrency(recipe.total_cost)}</strong>
                            </span>
                            {product && (
                              <>
                                <span className="text-sm text-muted-foreground">
                                  Venda: <strong className="text-foreground">{formatCurrency(product.price)}</strong>
                                </span>
                                <span className={`text-sm font-semibold ${margin > 30 ? 'text-green-600' : margin > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  Margem: {margin.toFixed(1)}%
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditRecipe(recipe)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir esta receita?")) {
                              deleteRecipeMutation.mutate(recipe.product_id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingrediente</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                          <TableHead className="text-right">Unidade</TableHead>
                          <TableHead className="text-right">Custo Unit.</TableHead>
                          <TableHead className="text-right">Custo Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipe.ingredients.map((ing) => (
                          <TableRow key={ing.id}>
                            <TableCell>{ing.ingredient_name}</TableCell>
                            <TableCell className="text-right font-medium">{ing.quantity_needed}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{ing.ingredient_unit}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {formatCurrency((ing.ingredient_cost || 0) / ing.quantity_needed)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(ing.ingredient_cost || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell colSpan={4} className="text-right">Total da Receita:</TableCell>
                          <TableCell className="text-right text-lg">{formatCurrency(recipe.total_cost)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecipesModule;
