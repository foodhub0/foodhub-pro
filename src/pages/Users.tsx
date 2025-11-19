import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useBrand } from "@/contexts/BrandContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  raw_user_meta_data: {
    name?: string;
    role_name?: string;
    role_display_name?: string;
    role_color?: string;
    is_active?: boolean;
    restaurant_id?: string;
  };
  created_at: string;
}

const Users = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { can } = usePermissions();
  const { brand, restaurants, currentRestaurant } = useBrand();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (brand) {
      loadUsers();
    }
  }, [brand, currentRestaurant]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Buscar usuários via função RPC ou API admin
      // Por enquanto, mock de dados
      const mockUsers: User[] = [
        {
          id: "1",
          email: "owner@foodhub.com",
          raw_user_meta_data: {
            name: "Proprietário",
            role_name: "owner",
            role_display_name: "Dono",
            role_color: "#8b5cf6",
            is_active: true,
          },
          created_at: new Date().toISOString(),
        },
      ];

      setUsers(mockUsers);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const name = user.raw_user_meta_data?.name || "";
    const email = user.email || "";
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });

  const getRoleBadgeColor = (color?: string) => {
    return color || "#6b7280";
  };

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie a equipe do seu restaurante
            </p>
          </div>
          {can('create', 'users') && (
            <Button onClick={() => navigate("/users/new")}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          )}
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle>Equipe ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Todos os usuários {currentRestaurant ? `de ${currentRestaurant.name}` : 'da marca'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {user.raw_user_meta_data?.name || "Sem nome"}
                          </h3>
                          <Badge
                            style={{
                              backgroundColor: `${getRoleBadgeColor(user.raw_user_meta_data?.role_color)}20`,
                              color: getRoleBadgeColor(user.raw_user_meta_data?.role_color),
                              borderColor: getRoleBadgeColor(user.raw_user_meta_data?.role_color),
                            }}
                            variant="outline"
                          >
                            {user.raw_user_meta_data?.role_display_name || "Sem perfil"}
                          </Badge>
                          {user.raw_user_meta_data?.is_active === false && (
                            <Badge variant="destructive">Inativo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    {can('update', 'users') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/users/${user.id}`)}>
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/users/${user.id}/edit`)}>
                            Editar
                          </DropdownMenuItem>
                          {can('execute', 'users') && (
                            <DropdownMenuItem onClick={() => navigate(`/users/${user.id}/permissions`)}>
                              Permissões
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Users;
