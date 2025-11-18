import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function IFoodCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando autenticação...');

  useEffect(() => {
    processCallback();
  }, []);

  const processCallback = async () => {
    try {
      // Obter parâmetros da URL
      const code = searchParams.get('code');
      const state = searchParams.get('state'); // restaurantId
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`Erro na autorização: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Parâmetros inválidos retornados pelo iFood');
      }

      const restaurantId = state;

      // Obter sessão do usuário
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      setMessage('Trocando código de autorização por token de acesso...');

      // Chamar Edge Function para trocar code por token
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
            authorizationCode: code,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao completar autenticação');
      }

      setStatus('success');
      setMessage('Integração com iFood concluída com sucesso!');

      // Redirecionar para a página de integração após 2 segundos
      setTimeout(() => {
        navigate('/ifood-integration?tab=sync');
      }, 2000);
    } catch (error: any) {
      console.error('Error processing callback:', error);
      setStatus('error');
      setMessage(error.message || 'Erro ao processar autenticação');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'processing' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            {status === 'error' && <AlertCircle className="h-6 w-6 text-red-600" />}
            {status === 'processing' && 'Conectando com iFood'}
            {status === 'success' && 'Conectado!'}
            {status === 'error' && 'Erro na Conexão'}
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Aguarde enquanto finalizamos a integração...'}
            {status === 'success' && 'Redirecionando para o painel...'}
            {status === 'error' && 'Ocorreu um problema durante a autenticação'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'processing' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/ifood-integration')}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={processCallback}
                >
                  Tentar Novamente
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
