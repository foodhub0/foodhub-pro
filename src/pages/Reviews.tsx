import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBrand } from "@/contexts/BrandContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { Star, Trash2, Check, X, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";

interface Review {
  id: string;
  customer_name: string;
  customer_email: string | null;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
}

const Reviews = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentRestaurant } = useBrand();
  const { isOwner } = usePermissions();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avg: 0, total: 0 });

  useEffect(() => {
    if (!isOwner()) {
      toast({
        title: "Acesso negado",
        description: "Apenas donos podem gerenciar avaliações",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    loadReviews();
  }, [currentRestaurant]);

  const loadReviews = async () => {
    if (!currentRestaurant) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("restaurant_id", currentRestaurant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);

      // Calcular estatísticas
      const approved = (data || []).filter(r => r.is_approved);
      if (approved.length > 0) {
        const avg = approved.reduce((sum, r) => sum + r.rating, 0) / approved.length;
        setStats({ avg, total: approved.length });
      }
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as avaliações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved: approve })
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: approve ? "Avaliação aprovada" : "Avaliação rejeitada",
        description: approve ? "A avaliação agora aparece no cardápio público" : "A avaliação foi ocultada do cardápio público",
      });

      await loadReviews();
    } catch (error) {
      console.error("Erro ao atualizar avaliação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a avaliação",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta avaliação?")) return;

    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Avaliação excluída",
        description: "A avaliação foi removida permanentemente",
      });

      await loadReviews();
    } catch (error) {
      console.error("Erro ao excluir avaliação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a avaliação",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
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
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Avaliações</h1>
            <p className="text-muted-foreground">Gerencie as avaliações do seu restaurante</p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avg.toFixed(1)}</div>
              <div className="flex items-center gap-2 mt-2">
                {renderStars(Math.round(stats.avg))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground mt-2">Avaliações aprovadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reviews.filter(r => !r.is_approved).length}</div>
              <p className="text-sm text-muted-foreground mt-2">Aguardando aprovação</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Avaliações */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Avaliações</CardTitle>
            <CardDescription>Aprove, rejeite ou exclua avaliações</CardDescription>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold">{review.customer_name}</span>
                          {review.is_approved ? (
                            <Badge variant="default" className="bg-green-500">Aprovada</Badge>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                        </div>
                        {review.customer_email && (
                          <p className="text-sm text-muted-foreground">{review.customer_email}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(review.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!review.is_approved && (
                          <Button
                            size="icon"
                            variant="default"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleApprove(review.id, true)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {review.is_approved && (
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => handleApprove(review.id, false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDelete(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mb-3">
                      {renderStars(review.rating)}
                    </div>

                    {review.comment && (
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>
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

export default Reviews;
