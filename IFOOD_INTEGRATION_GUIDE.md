# Guia de Integração com iFood

Este documento fornece instruções completas para configurar e usar a integração do iFood no FoodHub Pro.

## Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração Inicial](#configuração-inicial)
4. [Autenticação OAuth](#autenticação-oauth)
5. [Configuração do Merchant](#configuração-do-merchant)
6. [Sincronização de Cardápio](#sincronização-de-cardápio)
7. [Widget do iFood](#widget-do-ifood)
8. [Solução de Problemas](#solução-de-problemas)

---

## Visão Geral

A integração com o iFood permite que você:
- **Autentique** sua conta do iFood usando OAuth 2.0
- **Sincronize** automaticamente seu cardápio do iFood para o FoodHub Pro
- **Gerencie** pedidos do iFood diretamente no painel através do widget
- **Acompanhe** logs de sincronização e estatísticas

## Pré-requisitos

Antes de começar, você precisa:

1. **Conta no Portal de Desenvolvedores do iFood**
   - Acesse: https://developer.ifood.com.br
   - Faça o cadastro com seu CNPJ (contas pessoais/CPF não são aceitas)

2. **Credenciais de API**
   - Crie uma aplicação no Portal de Desenvolvedores
   - Obtenha seu **Client ID** e **Client Secret**
   - Anote o **Merchant ID** do seu restaurante

3. **Migração do Banco de Dados**
   - Execute a migração `20251118_create_ifood_integration.sql` no Supabase
   - Esta migração cria as tabelas necessárias para a integração

## Configuração Inicial

### 1. Executar Migração do Banco de Dados

No Supabase SQL Editor, execute:

```sql
-- Execute o arquivo: supabase/migrations/20251118_create_ifood_integration.sql
```

Isso criará as seguintes tabelas:
- `ifood_integrations` - Armazena tokens OAuth e configurações
- `ifood_merchants` - Armazena IDs de merchants vinculados
- `ifood_sync_logs` - Logs de sincronização
- `ifood_product_mappings` - Mapeamento de produtos

### 2. Implantar Edge Functions

As Edge Functions precisam ser implantadas no Supabase:

```bash
# Fazer deploy das Edge Functions
supabase functions deploy ifood-oauth-start
supabase functions deploy ifood-oauth-callback
supabase functions deploy ifood-sync-catalog
```

## Autenticação OAuth

### Passo 1: Acessar a Página de Integração

1. No painel do FoodHub Pro, clique em **"Integração iFood"** no menu lateral
2. Vá para a aba **"Autenticação"**

### Passo 2: Configurar Credenciais

1. Insira seu **Client ID** obtido no Portal de Desenvolvedores
2. Insira seu **Client Secret**
3. Clique em **"Gerar Código de Autorização"**

### Passo 3: Autorizar no Portal do iFood

1. Um código de 8 caracteres será exibido (formato: `XXXX-XXXX`)
2. Clique em **"Abrir Portal do iFood"** para acessar o Portal do Parceiro
3. Faça login com suas credenciais do iFood
4. Quando solicitado, insira o código de autorização
5. Autorize o acesso à aplicação

### Passo 4: Finalizar Autenticação

1. Após autorizar, você receberá um novo código de autorização
2. Copie este código
3. Volte para o FoodHub Pro
4. Cole o código no campo **"Código de Autorização"**
5. Clique em **"Concluir Autenticação"**

✅ **Pronto!** Sua integração está autenticada e ativa.

## Configuração do Merchant

### Configurar Merchant ID

1. Vá para a aba **"Merchant"**
2. Insira o **Merchant ID** (UUID do seu restaurante no iFood)
   - Encontre no Portal do Parceiro iFood
   - Formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
3. (Opcional) Insira o **Widget ID** se você tiver um
4. Clique em **"Salvar Configuração"**

## Sincronização de Cardápio

### Sincronizar Manualmente

1. Vá para a aba **"Sincronização"**
2. Clique em **"Sincronizar Agora"**
3. Aguarde o processo de sincronização

### O que é Sincronizado?

A sincronização importa do iFood:
- ✅ **Produtos** - Nome, descrição, preço, imagem
- ✅ **Categorias** - Organização do cardápio
- ✅ **Disponibilidade** - Status ativo/inativo dos produtos
- ✅ **Preços** - Valores atualizados

### Comportamento da Sincronização

- **Produtos Novos**: Criados automaticamente no FoodHub Pro
- **Produtos Existentes**: Atualizados com os dados mais recentes do iFood
- **Categorias**: Criadas automaticamente se não existirem
- **Mapeamento**: Um registro é criado em `ifood_product_mappings` para cada produto

### Logs de Sincronização

Os logs mostram:
- Data e hora da sincronização
- Status (Sucesso/Erro)
- Quantidade de itens sincronizados
- Itens criados vs. atualizados
- Itens com falha

## Widget do iFood

### Funcionalidades do Widget

O widget do iFood oferece:
- 💬 **Chat** - Comunicação direta com clientes
- 🔔 **Notificações** - Alertas de novos pedidos
- 📦 **Rastreamento** - Acompanhamento de entregas
- 🏪 **Status da Loja** - Indicador de status online/offline

### Ativação do Widget

1. Vá para a aba **"Widget"**
2. Certifique-se de ter configurado:
   - ✅ Autenticação OAuth completa
   - ✅ Merchant ID configurado
   - ✅ Widget ID configurado
3. O widget será carregado automaticamente na página de **Pedidos**

### Primeira Autorização do Widget

Na primeira vez que usar o widget:
1. Um código será gerado
2. Acesse o Portal do Parceiro iFood
3. Vá em **"Ativar aplicação via código"**
4. Insira o código
5. Autorize o acesso

O widget ficará disponível imediatamente após a autorização.

## Solução de Problemas

### Erro: "Integration not found"

**Causa**: Integração não foi criada ou foi deletada
**Solução**: Refaça o processo de autenticação OAuth desde o início

### Erro: "User code has expired"

**Causa**: O código de autorização expira em 10 minutos
**Solução**: Gere um novo código clicando em "Gerar Código de Autorização"

### Erro: "Access token has expired"

**Causa**: O token de acesso expira após algumas horas
**Solução**: Implemente refresh token (funcionalidade futura) ou reautentique

### Produtos não aparecem após sincronização

**Verificações**:
1. Confira os logs de sincronização na aba "Sincronização"
2. Verifique se há erros no log
3. Confirme que o Merchant ID está correto
4. Verifique se há produtos disponíveis no catálogo do iFood

### Widget não carrega

**Verificações**:
1. Confirme que está na página de **Pedidos**
2. Verifique se o Widget ID está configurado
3. Abra o Console do navegador (F12) e procure por erros JavaScript
4. Confirme que autorizou o widget no Portal do Parceiro

## Estrutura Técnica

### Edge Functions

1. **ifood-oauth-start**
   - Endpoint: `POST /functions/v1/ifood-oauth-start`
   - Gera userCode para autorização
   - Salva dados temporários de OAuth

2. **ifood-oauth-callback**
   - Endpoint: `POST /functions/v1/ifood-oauth-callback`
   - Troca authorization code por access token
   - Salva tokens no banco de dados

3. **ifood-sync-catalog**
   - Endpoint: `POST /functions/v1/ifood-sync-catalog`
   - Busca cardápio da API do iFood
   - Sincroniza produtos e categorias
   - Cria logs de sincronização

### Tabelas do Banco de Dados

```sql
-- Principais campos das tabelas

ifood_integrations:
  - id (UUID)
  - restaurant_id (FK)
  - client_id, client_secret
  - access_token, refresh_token
  - token_expires_at
  - is_active, is_authorized

ifood_merchants:
  - id (UUID)
  - restaurant_id (FK)
  - merchant_id (iFood merchant UUID)
  - widget_id

ifood_sync_logs:
  - id (UUID)
  - sync_type ('catalog', 'orders', 'full')
  - status ('started', 'success', 'error')
  - items_synced, items_created, items_updated

ifood_product_mappings:
  - local_product_id (FK to products)
  - ifood_product_id
  - auto_sync, sync_price, sync_availability
```

## Referências

- **API do iFood**: https://merchant-api.ifood.com.br
- **Portal de Desenvolvedores**: https://developer.ifood.com.br
- **Portal do Parceiro**: https://portal.ifood.com.br
- **Documentação OAuth**: https://developer.ifood.com.br/docs/guides/authentication/

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs de sincronização no painel
2. Consulte a documentação oficial do iFood
3. Entre em contato com o suporte técnico do FoodHub Pro

---

**Última atualização**: 2025-11-18
**Versão**: 1.0.0
