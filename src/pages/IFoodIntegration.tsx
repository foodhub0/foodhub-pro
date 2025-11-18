import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Store,
  ExternalLink,
  Unplug,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function IFoodIntegration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'connect';

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string>('');

  // Integration State
  const [integration, setIntegration] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);

  // Merchant State
  const [merchantId, setMerchantId] = useState('');
  const [widgetId, setWidgetId] = useState('');
  const [showMerchantForm, setShowMerchantForm] = useState(false);

  useEffect(() => {
    fetchRestaurantId();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      fetchIntegration();
      fetchSyncLogs();
    }
  }, [restaurantId]);

  const fetchRestaurantId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;
      if (restaurant) {
        setRestaurantId(restaurant.id);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Erro ao buscar restaurante');
    }
  };

  const fetchIntegration = async () => {
    try {
      const { data, error } = await supabase
        .from('ifood_integrations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setIntegration(data);
        setIsAuthorized(data.is_authorized);

        // Buscar merchants vinculados
        const { data: merchants } = await supabase
          .from('ifood_merchants')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .single();

        if (merchants) {
          setMerchantId(merchants.merchant_id);
          setWidgetId(merchants.widget_id || '');
        }
      }
    } catch (error) {
      console.error('Error fetching integration:', error);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('ifood_sync_logs')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    }
  };

  const handleConnectIFood = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Você precisa estar autenticado. Por favor, faça login novamente.');
      }

      // Validar que temos restaurantId
      if (!restaurantId) {
        throw new Error('Restaurante não encontrado. Por favor, recarregue a página.');
      }

      console.log('Iniciando conexão com iFood...', {
        restaurantId,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      });

      // Chamar Edge Function que retorna URL de autorização
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ifood-oauth-start`;
      console.log('Calling Edge Function:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(
          `Erro na comunicação com o servidor (${response.status}). ` +
          `Por favor, verifique se as credenciais do iFood estão configuradas no Supabase.`
        );
      }

      const result = await response.json();
      console.log('Result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido ao iniciar integração');
      }

      if (!result.data?.authorizationUrl) {
        throw new Error('URL de autorização não foi retornada pelo servidor');
      }

      console.log('Redirecting to:', result.data.authorizationUrl);

      // Redirecionar para URL de autorização do iFood
      window.location.href = result.data.authorizationUrl;
    } catch (error: any) {
      console.error('Error connecting to iFood:', error);

      let errorMessage = 'Erro ao conectar com iFood';

      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique:\n' +
          '1. Se as Edge Functions foram deployed\n' +
          '2. Se as variáveis IFOOD_CLIENT_ID e IFOOD_CLIENT_SECRET estão configuradas\n' +
          '3. Se a URL do Supabase está correta';
      } else {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        duration: 10000,
      });
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar do iFood?')) return;

    try {
      const { error } = await supabase
        .from('ifood_integrations')
        .update({
          is_active: false,
          is_authorized: false,
          access_token: null,
          refresh_token: null,
        })
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      setIsAuthorized(false);
      setIntegration(null);
      toast.success('Desconectado do iFood com sucesso');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar do iFood');
    }
  };

  const handleSyncCatalog = async () => {
    if (!merchantId) {
      toast.error('Por favor, configure o Merchant ID primeiro');
      return;
    }

    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ifood-sync-catalog`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            restaurantId,
            merchantId,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(
        `Cardápio sincronizado! ${result.data.itemsCreated} criados, ${result.data.itemsUpdated} atualizados`
      );
      fetchSyncLogs();
    } catch (error: any) {
      console.error('Error syncing catalog:', error);
      toast.error(error.message || 'Erro ao sincronizar cardápio');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveMerchant = async () => {
    if (!merchantId) {
      toast.error('Por favor, insira o Merchant ID');
      return;
    }

    try {
      const { error } = await supabase
        .from('ifood_merchants')
        .upsert({
          restaurant_id: restaurantId,
          ifood_integration_id: integration.id,
          merchant_id: merchantId,
          widget_id: widgetId || null,
          is_active: true,
        }, {
          onConflict: 'restaurant_id,merchant_id',
        });

      if (error) throw error;
      toast.success('Configuração salva com sucesso!');
      setShowMerchantForm(false);
      fetchIntegration();
    } catch (error) {
      console.error('Error saving merchant:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Integração iFood</h1>
          <p className="text-muted-foreground">
            Conecte sua conta do iFood em poucos cliques
          </p>
        </div>

        {!isAuthorized ? (
          // Tela de Conexão
          <div className="grid gap-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-orange-500" />
                  Conectar com iFood
                </CardTitle>
                <CardDescription>
                  Conecte sua conta do iFood para sincronizar cardápios e gerenciar pedidos automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-6 py-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center shadow-lg">
                    <Store className="w-16 h-16 text-orange-600" />
                  </div>
                  <div className="text-center max-w-md">
                    <h3 className="text-2xl font-bold mb-3">Conecte sua conta do iFood</h3>
                    <p className="text-muted-foreground">
                      Você será redirecionado para fazer login no iFood e autorizar o FoodHub Pro a acessar seus dados.
                      Leva apenas alguns segundos!
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleConnectIFood}
                    disabled={loading}
                    className="gap-2 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-5 w-5" />
                        Conectar com iFood
                      </>
                    )}
                  </Button>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>Seguro e criptografado</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefícios */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Sincronização Automática</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Mantenha seu cardápio sempre atualizado automaticamente
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Gestão Centralizada</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Gerencie pedidos do iFood direto no seu painel
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Widget Integrado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Chat, notificações e rastreamento em tempo real
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Tela Conectada
          <Tabs value={activeTab} onValueChange={(v) => navigate(`/ifood-integration?tab=${v}`)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connect">Conexão</TabsTrigger>
              <TabsTrigger value="sync">Sincronização</TabsTrigger>
              <TabsTrigger value="config">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="connect" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Conectado ao iFood
                    </span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Ativo
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Sua integração está ativa e funcionando
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {integration && integration.last_sync_at && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Última sincronização:</span>
                        <span>{new Date(integration.last_sync_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    className="w-full gap-2"
                  >
                    <Unplug className="h-4 w-4" />
                    Desconectar do iFood
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sync" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sincronizar Cardápio</CardTitle>
                  <CardDescription>
                    Importe produtos e categorias do iFood para seu sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!merchantId ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Configure o Merchant ID na aba "Configurações" primeiro
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <Button onClick={handleSyncCatalog} disabled={syncing} size="lg" className="w-full gap-2">
                        {syncing && <Loader2 className="h-4 w-4 animate-spin" />}
                        {!syncing && <RefreshCw className="h-4 w-4" />}
                        Sincronizar Agora
                      </Button>

                      {syncLogs.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-sm font-semibold mb-3">Histórico de Sincronizações</h3>
                          <div className="space-y-2">
                            {syncLogs.map((log) => (
                              <div
                                key={log.id}
                                className="p-3 border rounded-lg flex justify-between items-center"
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {log.sync_type === 'catalog' ? 'Cardápio' : log.sync_type}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(log.created_at).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm">
                                    {log.status === 'success' ? (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        Sucesso
                                      </Badge>
                                    ) : log.status === 'error' ? (
                                      <Badge variant="destructive">Erro</Badge>
                                    ) : (
                                      <Badge variant="secondary">Processando</Badge>
                                    )}
                                  </p>
                                  {log.items_synced > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {log.items_created} criados, {log.items_updated} atualizados
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Merchant</CardTitle>
                  <CardDescription>
                    Configure os IDs do seu restaurante no iFood
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showMerchantForm && merchantId ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Merchant ID:</span>
                          <span className="font-mono">{merchantId}</span>
                        </div>
                        {widgetId && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Widget ID:</span>
                            <span className="font-mono">{widgetId}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowMerchantForm(true)}
                        className="w-full"
                      >
                        Editar Configuração
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="merchantId">Merchant ID (UUID)</Label>
                        <Input
                          id="merchantId"
                          value={merchantId}
                          onChange={(e) => setMerchantId(e.target.value)}
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        />
                        <p className="text-xs text-muted-foreground">
                          Encontre no Portal do Parceiro iFood
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="widgetId">Widget ID (opcional)</Label>
                        <Input
                          id="widgetId"
                          value={widgetId}
                          onChange={(e) => setWidgetId(e.target.value)}
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        />
                      </div>
                      <div className="flex gap-2">
                        {showMerchantForm && (
                          <Button
                            variant="outline"
                            onClick={() => setShowMerchantForm(false)}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        )}
                        <Button onClick={handleSaveMerchant} className="flex-1">
                          Salvar Configuração
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
