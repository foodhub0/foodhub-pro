import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Bike } from "lucide-react";
import Layout from "@/components/Layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string | null;
  license_plate: string | null;
  status: "available" | "busy" | "offline";
  total_deliveries: number;
  rating: number | null;
}

const Couriers = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    vehicle_type: "bike",
    license_plate: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!restaurant) return;

    setRestaurantId(restaurant.id);
    await loadCouriers(restaurant.id);
    setLoading(false);
  };

  const loadCouriers = async (restaurantId: string) => {
    const { data } = await supabase
      .from("couriers")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("name");

    setCouriers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    const courierData = {
      restaurant_id: restaurantId,
      name: formData.name,
      phone: formData.phone,
      vehicle_type: formData.vehicle_type,
      license_plate: formData.license_plate || null,
      status: "offline" as const,
      total_deliveries: 0,
    };

    if (editingCourier) {
      const { error } = await supabase
        .from("couriers")
        .update(courierData)
        .eq("id", editingCourier.id);

      if (error) {
        toast({
          title: "Erro ao atualizar entregador",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Entregador atualizado com sucesso!" });
        await loadCouriers(restaurantId);
        resetForm();
      }
    } else {
      const { error } = await supabase.from("couriers").insert(courierData);

      if (error) {
        toast({
          title: "Erro ao criar entregador",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Entregador criado com sucesso!" });
        await loadCouriers(restaurantId);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este entregador?")) return;

    const { error } = await supabase.from("couriers").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir entregador",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Entregador excluído com sucesso!" });
      if (restaurantId) await loadCouriers(restaurantId);
    }
  };

  const handleEdit = (courier: Courier) => {
    setEditingCourier(courier);
    setFormData({
      name: courier.name,
      phone: courier.phone,
      vehicle_type: courier.vehicle_type || "bike",
      license_plate: courier.license_plate || "",
    });
    setDialogOpen(true);
  };

  const updateStatus = async (id: string, newStatus: "available" | "busy" | "offline") => {
    const { error } = await supabase
      .from("couriers")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Status atualizado!" });
      if (restaurantId) await loadCouriers(restaurantId);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      vehicle_type: "bike",
      license_plate: "",
    });
    setEditingCourier(null);
    setDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      available: { label: "Disponível", variant: "default" },
      busy: { label: "Ocupado", variant: "secondary" },
      offline: { label: "Offline", variant: "outline" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getVehicleLabel = (vehicle: string | null) => {
    const vehicleMap: Record<string, string> = {
      bike: "Bicicleta",
      motorcycle: "Moto",
      car: "Carro",
    };
    return vehicle ? vehicleMap[vehicle] || vehicle : "N/A";
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
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Entregadores</h1>
            <p className="text-muted-foreground">
              Gerencie os entregadores do seu restaurante
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Entregador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCourier ? "Editar Entregador" : "Novo Entregador"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Tipo de Veículo</Label>
                  <Select
                    value={formData.vehicle_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, vehicle_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bike">Bicicleta</SelectItem>
                      <SelectItem value="motorcycle">Moto</SelectItem>
                      <SelectItem value="car">Carro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_plate">Placa do Veículo</Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate}
                    onChange={(e) =>
                      setFormData({ ...formData, license_plate: e.target.value })
                    }
                    placeholder="ABC-1234"
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingCourier ? "Atualizar" : "Criar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {couriers.length === 0 ? (
          <Card className="p-16 text-center">
            <Bike className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum entregador cadastrado ainda
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Entregador
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {couriers.map((courier) => (
              <Card key={courier.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{courier.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {courier.phone}
                      </p>
                    </div>
                    {getStatusBadge(courier.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Veículo</p>
                      <p className="font-medium">{getVehicleLabel(courier.vehicle_type)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Entregas</p>
                      <p className="font-medium">{courier.total_deliveries}</p>
                    </div>
                  </div>

                  {courier.license_plate && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Placa</p>
                      <p className="font-medium">{courier.license_plate}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Select
                      value={courier.status}
                      onValueChange={(value: any) => updateStatus(courier.id, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponível</SelectItem>
                        <SelectItem value="busy">Ocupado</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(courier)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(courier.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Couriers;
