import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, MoreVertical, Key, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  const { brand, restaurants, currentRestaurant, isLoading: brandLoading } = useBrand();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset Password Dialog
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // Delete Dialog
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!brandLoading) {
      if (brand) {
        loadUsers();
      } else {
        setLoading(false);
      }
    }
  }, [brandLoading, brand?.id, currentRestaurant?.id]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Buscar usuários via Edge Function
      const { data, error } = await supabase.functions.invoke('list-users-admin');

      if (error) {
        throw error;
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Erro ao carregar usuários');
      }

      if (data && data.users) {
        setUsers(data.users);
      }
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

  const handleResetPassword = async () => {
    if (!selectedUserForReset || !newPassword) return;

    try {
      setResetting(true);

      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          user_id: selectedUserForReset.id,
          new_password: newPassword,
        },
      });

      if (error) {
        throw error;
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Erro ao resetar senha');
      }

      toast({
        title: "✅ Senha resetada!",
        description: `A senha de ${selectedUserForReset.raw_user_meta_data?.name || selectedUserForReset.email} foi alterada com sucesso.`,
      });

      setResetPasswordDialog(false);
      setSelectedUserForReset(null);
      setNewPassword("");
    } catch (error: any) {
      toast({
        title: "Erro ao resetar senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserForDelete) return;

    try {
      setDeleting(true);

      const { data, error } = await supabase.functions.invoke('delete-user-admin', {
        body: {
          user_id: selectedUserForDelete.id,
        },
      });

      if (error) {
        throw error;
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Erro ao deletar usuário');
      }

      toast({
        title: "✅ Usuário deletado!",
        description: `${selectedUserForDelete.raw_user_meta_data?.name || selectedUserForDelete.email} foi removido com sucesso.`,
      });

      setDeleteDialog(false);
      setSelectedUserForDelete(null);

      // Recarregar lista
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar usuário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const openResetPasswordDialog = (user: User) => {
    setSelectedUserForReset(user);
    setNewPassword("");
    setResetPasswordDialog(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUserForDelete(user);
    setDeleteDialog(true);
  };

  if (brandLoading || loading) {
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
          <p className="text-muted-foreground">Marca não encontrada</p>
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                            <Key className="h-4 w-4 mr-2" />
                            Resetar Senha
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(user)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir Usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resetar Senha</DialogTitle>
              <DialogDescription>
                Defina uma nova senha para {selectedUserForReset?.raw_user_meta_data?.name || selectedUserForReset?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-password"
                    type="text"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={resetting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                    disabled={resetting}
                  >
                    Gerar
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setResetPasswordDialog(false)}
                disabled={resetting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={resetting || !newPassword || newPassword.length < 6}
              >
                {resetting ? "Resetando..." : "Resetar Senha"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o usuário <strong>{selectedUserForDelete?.raw_user_meta_data?.name || selectedUserForDelete?.email}</strong>?
                <br />
                <br />
                Esta ação não pode ser desfeita. O usuário será permanentemente removido do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Excluindo..." : "Excluir Usuário"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Users;
