import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Copy, CheckCircle2, AlertCircle, RefreshCw, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function IFoodIntegration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string>('');

  // OAuth Flow State
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [userCode, setUserCode] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [authorizationCode, setAuthorizationCode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Merchant State
  const [merchantId, setMerchantId] = useState('');
  const [widgetId, setWidgetId] = useState('');

  // Integration State
  const [integration, setIntegration] = useState<any>(null);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);

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
        setClientId(data.client_id || '');

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

  const handleStartOAuth = async () => {
    if (!clientId || !clientSecret) {
      toast.error('Por favor, preencha Client ID e Client Secret');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ifood-oauth-start`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            restaurantId,
            clientId,
            clientSecret,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setUserCode(result.data.userCode);
      setVerificationUrl(result.data.verificationUrlComplete);

      toast.success('Código de autorização gerado com sucesso!');
    } catch (error: any) {
      console.error('Error starting OAuth:', error);
      toast.error(error.message || 'Erro ao iniciar autenticação');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOAuth = async () => {
    if (!authorizationCode) {
      toast.error('Por favor, insira o código de autorização');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ifood-oauth-callback`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            restaurantId,
            authorizationCode,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setIsAuthorized(true);
      toast.success('Autenticação concluída com sucesso!');
      fetchIntegration();
    } catch (error: any) {
      console.error('Error completing OAuth:', error);
      toast.error(error.message || 'Erro ao completar autenticação');
    } finally {
      setLoading(false);
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
      toast.success('Merchant ID salvo com sucesso!');
    } catch (error) {
      console.error('Error saving merchant:', error);
      toast.error('Erro ao salvar Merchant ID');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Integração iFood</h1>
          <p className="text-muted-foreground">
            Configure a integração com o iFood para sincronizar seu cardápio e gerenciar pedidos
          </p>
        </div>

        <Tabs defaultValue="oauth" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="oauth">Autenticação</TabsTrigger>
            <TabsTrigger value="merchant">Merchant</TabsTrigger>
            <TabsTrigger value="sync">Sincronização</TabsTrigger>
            <TabsTrigger value="widget">Widget</TabsTrigger>
          </TabsList>

          {/* Tab: OAuth Authentication */}
          <TabsContent value="oauth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>1. Configurar Credenciais</CardTitle>
                <CardDescription>
                  Insira suas credenciais obtidas no Portal de Desenvolvedores do iFood
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="seu-client-id"
                    disabled={isAuthorized}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="seu-client-secret"
                    disabled={isAuthorized}
                  />
                </div>
                {!userCode && !isAuthorized && (
                  <Button onClick={handleStartOAuth} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Gerar Código de Autorização
                  </Button>
                )}
              </CardContent>
            </Card>

            {userCode && !isAuthorized && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>2. Autorizar no Portal do iFood</CardTitle>
                    <CardDescription>
                      Use este código para autorizar a aplicação no Portal do Parceiro iFood
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-mono text-2xl font-bold my-3 flex items-center gap-2">
                          {userCode}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(userCode)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="mb-2">
                          1. Clique no botão abaixo para abrir o Portal do iFood
                        </p>
                        <p className="mb-2">
                          2. Faça login e insira o código acima quando solicitado
                        </p>
                        <p>
                          3. Após autorizar, você receberá um código de autorização
                        </p>
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={() => window.open(verificationUrl, '_blank')}
                      className="w-full"
                    >
                      Abrir Portal do iFood
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>3. Finalizar Autenticação</CardTitle>
                    <CardDescription>
                      Insira o código de autorização recebido após autorizar no portal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="authCode">Código de Autorização</Label>
                      <Input
                        id="authCode"
                        value={authorizationCode}
                        onChange={(e) => setAuthorizationCode(e.target.value)}
                        placeholder="XXXX-XXXX"
                      />
                    </div>
                    <Button onClick={handleCompleteOAuth} disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Concluir Autenticação
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}

            {isAuthorized && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Autenticação Concluída!</strong>
                  <br />
                  Sua integração com o iFood está ativa e pronta para uso.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Tab: Merchant Configuration */}
          <TabsContent value="merchant" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Merchant</CardTitle>
                <CardDescription>
                  Configure o ID do merchant do iFood para sincronizar dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="merchantId">Merchant ID (UUID)</Label>
                  <Input
                    id="merchantId"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                  <p className="text-sm text-muted-foreground">
                    Encontre seu Merchant ID no Portal do Parceiro iFood
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
                <Button onClick={handleSaveMerchant}>
                  <Store className="mr-2 h-4 w-4" />
                  Salvar Configuração
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Catalog Sync */}
          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sincronizar Cardápio</CardTitle>
                <CardDescription>
                  Importe produtos e categorias do iFood para seu sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAuthorized ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Você precisa completar a autenticação OAuth primeiro
                    </AlertDescription>
                  </Alert>
                ) : !merchantId ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Você precisa configurar o Merchant ID primeiro
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Button onClick={handleSyncCatalog} disabled={syncing} size="lg">
                      {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {!syncing && <RefreshCw className="mr-2 h-4 w-4" />}
                      Sincronizar Agora
                    </Button>

                    {syncLogs.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-3">Histórico de Sincronizações</h3>
                        <div className="space-y-2">
                          {syncLogs.map((log) => (
                            <div
                              key={log.id}
                              className="p-3 border rounded-lg flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium">
                                  {log.sync_type === 'catalog' ? 'Cardápio' : log.sync_type}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(log.created_at).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm">
                                  {log.status === 'success' ? (
                                    <span className="text-green-600">✓ Sucesso</span>
                                  ) : log.status === 'error' ? (
                                    <span className="text-red-600">✗ Erro</span>
                                  ) : (
                                    <span className="text-yellow-600">⋯ Em andamento</span>
                                  )}
                                </p>
                                {log.items_synced > 0 && (
                                  <p className="text-sm text-muted-foreground">
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

          {/* Tab: Widget Integration */}
          <TabsContent value="widget" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Widget do iFood</CardTitle>
                <CardDescription>
                  Integre o widget do iFood para gerenciar pedidos diretamente no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAuthorized || !merchantId || !widgetId ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Complete a autenticação e configure o Merchant ID e Widget ID para habilitar o widget
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        O widget do iFood será carregado automaticamente nas páginas de pedidos
                      </AlertDescription>
                    </Alert>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm mb-2">Configuração atual:</p>
                      <ul className="text-sm space-y-1">
                        <li><strong>Merchant ID:</strong> {merchantId}</li>
                        <li><strong>Widget ID:</strong> {widgetId}</li>
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
