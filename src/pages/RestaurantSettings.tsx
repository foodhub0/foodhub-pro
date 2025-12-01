import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBrand } from "@/contexts/BrandContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { Loader2, Save, Upload, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";

interface RestaurantSettings {
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  delivery_time_estimate: number | null;
  pickup_time_estimate: number | null;
  delivery_fee: number | null;
  minimum_order: number | null;
  delivery_radius_km: number | null;
  logo_url: string | null;
  cover_url: string | null;
  is_open: boolean;
}

const RestaurantSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentRestaurant, refreshBrand } = useBrand();
  const { isOwner } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<RestaurantSettings>({
    name: "",
    slug: "",
    description: null,
    phone: null,
    address: null,
    delivery_time_estimate: null,
    pickup_time_estimate: null,
    delivery_fee: null,
    minimum_order: null,
    delivery_radius_km: null,
    logo_url: null,
    cover_url: null,
    is_open: true,
  });

  useEffect(() => {
    if (!isOwner()) {
      toast({
        title: "Acesso negado",
        description: "Apenas donos podem acessar as configurações",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    if (currentRestaurant) {
      setSettings({
        name: currentRestaurant.name,
        slug: currentRestaurant.slug,
        description: currentRestaurant.description,
        phone: currentRestaurant.phone,
        address: currentRestaurant.address,
        delivery_time_estimate: currentRestaurant.delivery_time_estimate,
        pickup_time_estimate: currentRestaurant.pickup_time_estimate,
        delivery_fee: currentRestaurant.delivery_fee,
        minimum_order: currentRestaurant.minimum_order,
        delivery_radius_km: currentRestaurant.delivery_radius_km,
        logo_url: currentRestaurant.logo_url,
        cover_url: currentRestaurant.cover_url,
        is_open: currentRestaurant.is_open,
      });
    }
  }, [currentRestaurant, isOwner, navigate, toast]);

  const handleSave = async () => {
    if (!currentRestaurant) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          name: settings.name,
          description: settings.description,
          phone: settings.phone,
          address: settings.address,
          delivery_time_estimate: settings.delivery_time_estimate,
          pickup_time_estimate: settings.pickup_time_estimate,
          delivery_fee: settings.delivery_fee,
          minimum_order: settings.minimum_order,
          delivery_radius_km: settings.delivery_radius_km,
          is_open: settings.is_open,
        })
        .eq("id", currentRestaurant.id);

      if (error) throw error;

      await refreshBrand();

      toast({
        title: "Configurações salvas",
        description: "As configurações do restaurante foram atualizadas com sucesso",
      });
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'cover') => {
    if (!currentRestaurant) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentRestaurant.id}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `restaurants/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-images')
        .getPublicUrl(filePath);

      const updateField = type === 'logo' ? 'logo_url' : 'cover_url';

      const { error: updateError } = await supabase
        .from("restaurants")
        .update({ [updateField]: publicUrl })
        .eq("id", currentRestaurant.id);

      if (updateError) throw updateError;

      setSettings(prev => ({ ...prev, [updateField]: publicUrl }));
      await refreshBrand();

      toast({
        title: "Imagem atualizada",
        description: `${type === 'logo' ? 'Logotipo' : 'Banner'} atualizado com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da imagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Configurações do Restaurante</h1>
            <p className="text-muted-foreground">Configure as informações exibidas no cardápio público</p>
          </div>
        </div>

        {/* Informações Básicas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Nome, descrição e contato do seu restaurante</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Restaurante *</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  placeholder="Ex: Lanches Bom Gosto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input
                  id="slug"
                  value={settings.slug}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  URL: /menu/{settings.slug}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={settings.description || ""}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                placeholder="Descreva seu restaurante em poucas palavras"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={settings.address || ""}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Rua, número, bairro"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery e Tempos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Delivery e Tempos</CardTitle>
            <CardDescription>Configure prazos e taxas de entrega</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_time">Tempo de Entrega (min)</Label>
                <Input
                  id="delivery_time"
                  type="number"
                  value={settings.delivery_time_estimate || ""}
                  onChange={(e) => setSettings({ ...settings, delivery_time_estimate: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Ex: 45"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup_time">Tempo de Retirada (min)</Label>
                <Input
                  id="pickup_time"
                  type="number"
                  value={settings.pickup_time_estimate || ""}
                  onChange={(e) => setSettings({ ...settings, pickup_time_estimate: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Ex: 20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_fee">Taxa de Entrega (R$)</Label>
                <Input
                  id="delivery_fee"
                  type="number"
                  step="0.01"
                  value={settings.delivery_fee || ""}
                  onChange={(e) => setSettings({ ...settings, delivery_fee: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Ex: 5.00 (0 = grátis)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimum_order">Pedido Mínimo (R$)</Label>
                <Input
                  id="minimum_order"
                  type="number"
                  step="0.01"
                  value={settings.minimum_order || ""}
                  onChange={(e) => setSettings({ ...settings, minimum_order: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Ex: 15.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_radius">Raio de Entrega (km)</Label>
                <Input
                  id="delivery_radius"
                  type="number"
                  step="0.1"
                  value={settings.delivery_radius_km || ""}
                  onChange={(e) => setSettings({ ...settings, delivery_radius_km: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Ex: 5.0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Imagens */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Imagens</CardTitle>
            <CardDescription>Logotipo e banner do restaurante</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Logotipo</Label>
                <div className="flex items-center gap-4">
                  {settings.logo_url && (
                    <img src={settings.logo_url} alt="Logo" className="w-16 h-16 rounded-full object-cover" />
                  )}
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('logo-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Fazer Upload
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'logo');
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Banner</Label>
                <div className="flex items-center gap-4">
                  {settings.cover_url && (
                    <img src={settings.cover_url} alt="Banner" className="w-24 h-16 rounded object-cover" />
                  )}
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('cover-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Fazer Upload
                  </Button>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'cover');
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Status do Restaurante</CardTitle>
            <CardDescription>Controle se o restaurante está aceitando pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Restaurante Aberto</Label>
                <p className="text-sm text-muted-foreground">
                  {settings.is_open ? "Aceitando pedidos" : "Não aceitando pedidos"}
                </p>
              </div>
              <Button
                variant={settings.is_open ? "default" : "secondary"}
                onClick={() => setSettings({ ...settings, is_open: !settings.is_open })}
              >
                {settings.is_open ? "Aberto" : "Fechado"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default RestaurantSettings;
