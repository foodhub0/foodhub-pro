# Configuração de Autenticação Google

Este documento descreve como configurar a autenticação via Google no FoodHub Pro usando Supabase.

## Funcionalidade Implementada

✅ Botão "Continuar com Google" na tela de login
✅ Botão "Continuar com Google" na tela de criar conta
✅ Criação automática de conta ao fazer login pela primeira vez
✅ Redirecionamento automático para o dashboard após autenticação

## Passos para Configurar no Supabase

### 1. Criar Credenciais OAuth no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure a tela de consentimento OAuth se solicitado
6. Escolha **Web application** como tipo de aplicação
7. Adicione os URIs de redirecionamento autorizados:
   - Para desenvolvimento: `https://wisikawnpzrrfzqutatl.supabase.co/auth/v1/callback`
   - Para produção: adicione também sua URL de produção
8. Copie o **Client ID** e **Client Secret**

### 2. Configurar no Painel do Supabase

1. Acesse o [painel do Supabase](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **Authentication** > **Providers**
4. Encontre **Google** na lista de provedores
5. Ative o provedor Google
6. Cole o **Client ID** e **Client Secret** obtidos do Google Cloud Console
7. Clique em **Save**

### 3. Configurar URLs de Redirecionamento

No painel do Supabase, vá em **Authentication** > **URL Configuration** e adicione:

- **Site URL**: URL do seu aplicativo em produção
- **Redirect URLs**:
  - `http://localhost:5173/dashboard` (desenvolvimento)
  - Sua URL de produção + `/dashboard`

### 4. Testar a Funcionalidade

1. Execute o projeto localmente: `npm run dev`
2. Acesse a página de login
3. Clique em "Continuar com Google"
4. Faça login com uma conta Google
5. Você deve ser redirecionado automaticamente para o dashboard

## Fluxo de Autenticação

1. **Usuário clica no botão Google** → `handleGoogleSignIn()` é chamado
2. **Redirecionamento para Google** → Usuário faz login no Google
3. **Google redireciona de volta** → Supabase processa a autenticação
4. **Criação/Login automático** → Se for a primeira vez, uma conta é criada automaticamente
5. **Redirecionamento final** → Usuário é levado ao dashboard

## Código Implementado

A implementação está no arquivo `/src/pages/Auth.tsx`:

```typescript
const handleGoogleSignIn = async () => {
  setLoading(true);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) {
    toast({
      title: "Erro ao fazer login com Google",
      description: error.message,
      variant: "destructive",
    });
    setLoading(false);
  }
};
```

## Segurança

- As credenciais OAuth são armazenadas de forma segura no Supabase
- O fluxo OAuth 2.0 garante que senhas do Google não são compartilhadas
- Tokens de acesso são gerenciados automaticamente pelo Supabase
- A sessão do usuário é persistida no localStorage com tokens seguros

## Troubleshooting

### Erro "Invalid OAuth credentials"
- Verifique se o Client ID e Client Secret estão corretos no Supabase
- Confirme que as URLs de redirecionamento estão configuradas corretamente no Google Cloud Console

### Erro de redirecionamento
- Verifique se a URL de redirecionamento no Supabase corresponde ao ambiente (dev/prod)
- Confirme que a URL está na lista de URLs autorizadas no Google Cloud Console

### Usuário não é redirecionado após login
- Verifique se o redirect URL está configurado corretamente em `handleGoogleSignIn`
- Confirme que não há erros no console do navegador

## Recursos Adicionais

- [Documentação do Supabase Auth](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
