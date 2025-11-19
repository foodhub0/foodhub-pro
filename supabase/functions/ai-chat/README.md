# AI Chat Edge Function

Esta Edge Function integra o FoodHub Pro com a API da OpenAI para fornecer assistência inteligente aos usuários.

## Configuração

### 1. Obter chave da OpenAI

Você precisa de uma chave de API da OpenAI. Se ainda não tem, obtenha em: https://platform.openai.com/api-keys

**IMPORTANTE:** A chave da OpenAI não deve ser versionada no Git por questões de segurança. Ela será fornecida separadamente.

### 2. Configurar no Supabase

#### Opção A: Via Supabase CLI (Recomendado)

```bash
# Configurar secret (substitua pela chave real fornecida)
supabase secrets set OPENAI_API_KEY=sua-chave-openai-aqui
```

#### Opção B: Via Dashboard Supabase

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/edge-functions
2. Clique em "Edge Functions Secrets"
3. Adicione uma nova secret:
   - Nome: `OPENAI_API_KEY`
   - Valor: A chave da OpenAI fornecida

### 3. Deploy da Function

```bash
# Deploy
supabase functions deploy ai-chat
```

## Uso

A função é chamada automaticamente pelo componente `AIChat.tsx` no frontend.

### Request

```json
POST /functions/v1/ai-chat
{
  "messages": [
    {
      "role": "user",
      "content": "Como posso reduzir meus custos?"
    }
  ]
}
```

### Response

```json
{
  "message": "Para reduzir custos no seu delivery, aqui estão algumas estratégias..."
}
```

## Modelo

Utiliza o modelo `gpt-4o-mini` da OpenAI, especializado em:
- Análise de custos e precificação
- Estratégias para aumentar vendas
- Otimização de operações de delivery
- Gestão de estoque e ingredientes
- Criação de combos e promoções
- Análise de métricas e KPIs
- Dicas de marketing para delivery
- Gestão de cardápio

## Segurança

- ✅ Chave da API armazenada no servidor (não exposta no frontend)
- ✅ CORS configurado para aceitar apenas requisições autorizadas
- ✅ Validação de mensagens antes do envio
- ✅ Tratamento de erros adequado
