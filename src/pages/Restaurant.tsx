import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Moon, Sun } from "lucide-react";
import Layout from "@/components/Layout";
import ImageUpload from "@/components/ImageUpload";
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliveryZoneConfig, DeliveryZone } from "@/components/DeliveryZoneConfig";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const Restaurant = () => {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<"fixed" | "zones">("fixed");
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    logo_url: "",
    cover_url: "",
    delivery_fee: "0",
    delivery_time_estimate: "30",
  });
  const [pixelConfig, setPixelConfig] = useState({
    pixel_id: "",
    is_active: true,
  });

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (restaurant) {
      setRestaurantId(restaurant.id);
      setFormData({
        name: restaurant.name || "",
        slug: restaurant.slug || "",
        description: restaurant.description || "",
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        address: restaurant.address || "",
        logo_url: restaurant.logo_url || "",
        cover_url: restaurant.cover_url || "",
        delivery_fee: restaurant.delivery_fee?.toString() || "0",
        delivery_time_estimate: restaurant.delivery_time_estimate?.toString() || "30",
      });

      // Carregar zonas de entrega se existir
      if (restaurant.delivery_zones && Array.isArray(restaurant.delivery_zones)) {
        setDeliveryZones(restaurant.delivery_zones);
        setDeliveryMode("zones");
      }

      // Carregar configuração do Facebook Pixel
      const { data: pixelData } = await supabase
        .from("facebook_pixel_config")
        .select("pixel_id, is_active")
        .eq("restaurant_id", restaurant.id)
        .single();

      if (pixelData) {
        setPixelConfig({
          pixel_id: pixelData.pixel_id || "",
          is_active: pixelData.is_active ?? true,
        });
      }
    }
    setLoading(false);
  };

  const handleSavePixelConfig = async () => {
    if (!restaurantId) return;

    setSaving(true);
    try {
      // Verificar se já existe configuração
      const { data: existing } = await supabase
        .from("facebook_pixel_config")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .single();

      if (existing) {
        // Atualizar existente
        const { error } = await supabase
          .from("facebook_pixel_config")
          .update({
            pixel_id: pixelConfig.pixel_id,
            is_active: pixelConfig.is_active,
          })
          .eq("restaurant_id", restaurantId);

        if (error) throw error;
      } else {
        // Criar novo
        const { error } = await supabase
          .from("facebook_pixel_config")
          .insert({
            restaurant_id: restaurantId,
            pixel_id: pixelConfig.pixel_id,
            is_active: pixelConfig.is_active,
          });

        if (error) throw error;
      }

      toast({
        title: "Configuração salva!",
        description: "Facebook Pixel configurado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    setSaving(true);
    const updateData: any = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      logo_url: formData.logo_url || null,
      cover_url: formData.cover_url || null,
      delivery_time_estimate: parseInt(formData.delivery_time_estimate),
    };

    // Adicionar taxa de entrega com base no modo selecionado
    if (deliveryMode === "fixed") {
      updateData.delivery_fee = parseFloat(formData.delivery_fee);
      updateData.delivery_zones = null;
    } else {
      updateData.delivery_fee = null;
      updateData.delivery_zones = deliveryZones;
    }

    const { error } = await supabase
      .from("restaurants")
      .update(updateData)
      .eq("id", restaurantId);

    setSaving(false);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Restaurante atualizado!",
        description: "As informações foram salvas com sucesso.",
      });
    }
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
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Meu Restaurante</h1>
          <p className="text-muted-foreground">
            Configure as informações do seu restaurante
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Restaurante *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Personalizada *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{window.location.origin}/m/</span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    required
                    placeholder="meu-restaurante"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Seu cardápio público ficará disponível em: {window.location.origin}/m/{formData.slug || "seu-link"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                value={formData.logo_url}
                onChange={(url) => setFormData({ ...formData, logo_url: url || "" })}
                label="Logo do Restaurante"
                folder="restaurante/logo"
              />

              <ImageUpload
                value={formData.cover_url}
                onChange={(url) => setFormData({ ...formData, cover_url: url || "" })}
                label="Imagem de Capa"
                folder="restaurante/cover"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações de Entrega</CardTitle>
              <CardDescription>
                Configure como será calculada a taxa de entrega dos pedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tempo de entrega */}
              <div className="space-y-2">
                <Label htmlFor="delivery_time_estimate">Tempo Estimado de Entrega (min)</Label>
                <Input
                  id="delivery_time_estimate"
                  type="number"
                  min="0"
                  value={formData.delivery_time_estimate}
                  onChange={(e) => setFormData({ ...formData, delivery_time_estimate: e.target.value })}
                  className="max-w-xs"
                />
              </div>

              {/* Modo de cálculo da taxa */}
              <div className="space-y-4">
                <Label className="text-base">Tipo de Taxa de Entrega</Label>
                <RadioGroup value={deliveryMode} onValueChange={(value: "fixed" | "zones") => setDeliveryMode(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="font-normal cursor-pointer">
                      Taxa Fixa - Mesmo valor para todos os pedidos
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="zones" id="zones" />
                    <Label htmlFor="zones" className="font-normal cursor-pointer">
                      Taxa por Raio - Valor varia conforme a distância do cliente
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Taxa fixa */}
              {deliveryMode === "fixed" && (
                <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                  <Label htmlFor="delivery_fee">Valor da Taxa de Entrega (R$)</Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.delivery_fee}
                    onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta taxa será aplicada para todos os pedidos com entrega
                  </p>
                </div>
              )}

              {/* Taxa por zonas */}
              {deliveryMode === "zones" && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <DeliveryZoneConfig
                    zones={deliveryZones}
                    onChange={setDeliveryZones}
                    restaurantAddress={formData.address}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Facebook Pixel</CardTitle>
              <CardDescription>
                Configure o Facebook Pixel para rastrear conversões e otimizar anúncios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Ativar Pixel</Label>
                  <p className="text-sm text-muted-foreground">
                    Rastrear visitantes e conversões
                  </p>
                </div>
                <Switch
                  checked={pixelConfig.is_active}
                  onCheckedChange={(checked) => setPixelConfig({...pixelConfig, is_active: checked})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pixel_id">ID do Pixel</Label>
                <Input
                  id="pixel_id"
                  placeholder="123456789012345"
                  value={pixelConfig.pixel_id}
                  onChange={(e) => setPixelConfig({...pixelConfig, pixel_id: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  Encontre seu Pixel ID no Gerenciador de Eventos do Facebook
                </p>
              </div>

              <Button
                type="button"
                onClick={handleSavePixelConfig}
                disabled={saving || !pixelConfig.pixel_id}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Configuração do Pixel
              </Button>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium mb-2">💡 Potencialize seu negócio com Tráfego Pago</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Nossos gestores especializados podem criar campanhas profissionais no Facebook e Instagram para aumentar suas vendas.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/boost-business'}
                >
                  Saiba Mais
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
              <CardDescription>
                Configure a aparência e outras preferências do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Tema</Label>
                  <p className="text-sm text-muted-foreground">
                    Alternar entre tema claro e escuro
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default Restaurant;
