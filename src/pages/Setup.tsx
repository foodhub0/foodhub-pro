import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Setup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setUserId(user.id);

    // Check if user already has a restaurant
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (restaurant) {
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);

    const { error } = await supabase.from("restaurants").insert({
      owner_id: userId,
      name: formData.name,
      slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: formData.description,
      phone: formData.phone,
      email: formData.email,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao criar restaurante",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Restaurante criado!",
        description: "Seu restaurante foi configurado com sucesso.",
      });
      navigate("/dashboard");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === 'name' && !formData.slug) {
      const slug = value.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Configure seu Restaurante</CardTitle>
          <CardDescription>
            Preencha as informações básicas do seu restaurante para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Restaurante *</Label>
              <Input
                id="name"
                placeholder="Ex: Pizzaria do João"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Personalizada *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">foodhub.app/</span>
                <Input
                  id="slug"
                  placeholder="pizzaria-do-joao"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números e hífens
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Conte um pouco sobre seu restaurante..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contato@restaurante.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Restaurante
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;
