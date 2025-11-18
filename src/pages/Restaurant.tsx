import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Moon, Sun, Download, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import ImageUpload from "@/components/ImageUpload";
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Restaurant = () => {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importPlatform, setImportPlatform] = useState<"ifood" | "anotaai" | "instadelivery">("ifood");
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
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    setSaving(true);
    const { error } = await supabase
      .from("restaurants")
      .update({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        logo_url: formData.logo_url || null,
        cover_url: formData.cover_url || null,
        delivery_fee: parseFloat(formData.delivery_fee),
        delivery_time_estimate: parseInt(formData.delivery_time_estimate),
      })
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

  const handleImportMenu = async () => {
    if (!importUrl.trim()) {
      toast({
        title: "URL necessária",
        description: "Por favor, insira o link da sua loja na plataforma",
        variant: "destructive",
      });
      return;
    }

    if (!restaurantId) return;

    setImporting(true);

    try {
      // Nota: Esta é uma implementação demonstrativa
      // As APIs públicas dessas plataformas não estão disponíveis sem credenciais
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: `A importação direta de cardápios do ${importPlatform.toUpperCase()} requer integração com suas APIs oficiais. Entre em contato com o suporte para configurar esta funcionalidade.`,
        variant: "default",
      });

      // TODO: Implementar integração com APIs quando credenciais estiverem disponíveis
      // Exemplo de fluxo:
      // 1. Validar URL e extrair ID da loja
      // 2. Fazer requisição para API da plataforma (requer autenticação)
      // 3. Processar resposta e importar categorias e produtos
      // 4. Salvar no banco de dados

    } catch (error: any) {
      toast({
        title: "Erro ao importar",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_fee">Taxa de Entrega (R$)</Label>
                  <Input
                    id="delivery_fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.delivery_fee}
                    onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_time_estimate">Tempo de Entrega (min)</Label>
                  <Input
                    id="delivery_time_estimate"
                    type="number"
                    min="0"
                    value={formData.delivery_time_estimate}
                    onChange={(e) => setFormData({ ...formData, delivery_time_estimate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Importar Cardápio</CardTitle>
              <CardDescription>
                Importe seu cardápio diretamente de plataformas de delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={importPlatform} onValueChange={(value) => setImportPlatform(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ifood">iFood</TabsTrigger>
                  <TabsTrigger value="anotaai">Anota AI</TabsTrigger>
                  <TabsTrigger value="instadelivery">InstaDelivery</TabsTrigger>
                </TabsList>

                <TabsContent value="ifood" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ifood-url">Link da sua loja no iFood</Label>
                    <Input
                      id="ifood-url"
                      placeholder="https://www.ifood.com.br/delivery/..."
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole o link público da sua loja no iFood
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleImportMenu}
                    disabled={importing}
                    className="w-full"
                  >
                    {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Download className="mr-2 h-4 w-4" />
                    Importar do iFood
                  </Button>
                </TabsContent>

                <TabsContent value="anotaai" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="anotaai-url">Link da sua loja no Anota AI</Label>
                    <Input
                      id="anotaai-url"
                      placeholder="https://anotaai.com/..."
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole o link público da sua loja no Anota AI
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleImportMenu}
                    disabled={importing}
                    className="w-full"
                  >
                    {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Download className="mr-2 h-4 w-4" />
                    Importar do Anota AI
                  </Button>
                </TabsContent>

                <TabsContent value="instadelivery" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="instadelivery-url">Link da sua loja no InstaDelivery</Label>
                    <Input
                      id="instadelivery-url"
                      placeholder="https://instadelivery.com.br/..."
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole o link público da sua loja no InstaDelivery
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleImportMenu}
                    disabled={importing}
                    className="w-full"
                  >
                    {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Download className="mr-2 h-4 w-4" />
                    Importar do InstaDelivery
                  </Button>
                </TabsContent>
              </Tabs>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold">Como funciona:</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Cole o link público da sua loja na plataforma</li>
                  <li>Clique em "Importar"</li>
                  <li>Aguarde enquanto importamos seus produtos e categorias</li>
                  <li>Revise e ajuste conforme necessário</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Nota:</strong> A importação requer credenciais de API das plataformas. Entre em contato com o suporte para configurar esta integração.
                </p>
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
