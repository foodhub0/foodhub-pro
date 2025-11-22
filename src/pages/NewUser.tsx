import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useBrand } from "@/contexts/BrandContext";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  level: number;
  color: string | null;
}

const NewUser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { brand, restaurants } = useBrand();

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [sendInviteEmail, setSendInviteEmail] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("level", { ascending: false });

      if (error) throw error;

      if (data) {
        setRoles(data);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar perfis",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  const selectedRole = roles.find(r => r.id === roleId);
  const requiresRestaurant = selectedRole && selectedRole.name !== 'owner';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do usuário.",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, informe um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    if (!roleId) {
      toast({
        title: "Perfil obrigatório",
        description: "Por favor, selecione um perfil para o usuário.",
        variant: "destructive",
      });
      return;
    }

    if (requiresRestaurant && !restaurantId) {
      toast({
        title: "Restaurante obrigatório",
        description: "Este perfil requer que um restaurante seja selecionado.",
        variant: "destructive",
      });
      return;
    }

    if (!password || password.length < 6) {
      toast({
        title: "Senha fraca",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Preparar metadata do usuário
      const userMetadata = {
        name,
        role_id: roleId,
        role_name: selectedRole?.name,
        role_display_name: selectedRole?.display_name,
        role_color: selectedRole?.color,
        brand_id: brand?.id,
        restaurant_id: requiresRestaurant ? restaurantId : null,
        is_active: isActive,
      };

      // Chamar Edge Function para criar usuário via Admin API
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const { data, error } = await supabase.functions.invoke('create-user-admin', {
        body: {
          user_email: email,
          user_password: password,
          user_metadata: userMetadata,
          send_email: sendInviteEmail,
        },
      });

      if (error) {
        throw error;
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      toast({
        title: "✅ Usuário criado!",
        description: `${name} foi adicionado à equipe com sucesso.`,
      });

      navigate("/users");
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerar senha aleatória
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  if (loadingRoles) {
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
      <div className="container mx-auto p-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/users")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Novo Usuário</h1>
          <p className="text-muted-foreground mt-1">
            Adicione um novo membro à equipe
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Usuário</CardTitle>
              <CardDescription>
                Preencha os dados do novo colaborador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  placeholder="Ex: João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {/* Perfil */}
              <div className="space-y-2">
                <Label htmlFor="role">Perfil de Acesso *</Label>
                <Select value={roleId} onValueChange={setRoleId} disabled={loading}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecione o perfil..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color || '#6b7280' }}
                          />
                          <span>{role.display_name}</span>
                          {role.description && (
                            <span className="text-xs text-muted-foreground">
                              - {role.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Restaurante (condicional) */}
              {requiresRestaurant && (
                <div className="space-y-2">
                  <Label htmlFor="restaurant">Restaurante *</Label>
                  <Select
                    value={restaurantId}
                    onValueChange={setRestaurantId}
                    disabled={loading}
                  >
                    <SelectTrigger id="restaurant">
                      <SelectValue placeholder="Selecione o restaurante..." />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          {restaurant.name} - Unidade {restaurant.restaurant_index}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Este usuário terá acesso apenas a este restaurante
                  </p>
                </div>
              )}

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha Temporária *</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                    disabled={loading}
                  >
                    Gerar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  O usuário deverá alterar a senha no primeiro acesso
                </p>
              </div>

              {/* Enviar email de convite */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="send-email">Enviar E-mail de Boas-vindas</Label>
                  <p className="text-sm text-muted-foreground">
                    Por padrão o usuário é ativado imediatamente. Marque para enviar email de confirmação.
                  </p>
                </div>
                <Switch
                  id="send-email"
                  checked={sendInviteEmail}
                  onCheckedChange={setSendInviteEmail}
                  disabled={loading}
                />
              </div>

              {/* Status ativo */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is-active">Usuário Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Usuário pode fazer login imediatamente
                  </p>
                </div>
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/users")}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Usuário
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewUser;
