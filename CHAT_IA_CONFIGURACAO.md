# 🤖 Configuração do Chat de IA - Food Hub Pro

## Visão Geral

O Food Hub Pro agora inclui um **Assistente de IA Flutuante** integrado, especializado em gestão de delivery e restaurantes. O chat utiliza o modelo GPT-4o-mini da OpenAI para fornecer insights, responder dúvidas e ajudar na tomada de decisões.

## ✨ Funcionalidades

O assistente pode ajudar com:

- **Análise de Custos e Precificação**: Calcular margens, sugerir preços ideais
- **Estratégias de Vendas**: Dicas para aumentar conversões e ticket médio
- **Otimização Operacional**: Melhorar processos de delivery e produção
- **Gestão de Estoque**: Orientações sobre controle de ingredientes
- **Criação de Combos**: Sugestões de combos promocionais
- **Análise de Métricas**: Interpretação de KPIs e indicadores
- **Marketing para Delivery**: Estratégias específicas para delivery
- **Gestão de Cardápio**: Otimização de produtos e categorias

## 🔧 Configuração (Desenvolvimento Local)

### 1. Obter API Key da OpenAI

1. Acesse [platform.openai.com](https://platform.openai.com/)
2. Crie uma conta ou faça login
3. Navegue até **API Keys** no menu
4. Clique em **Create new secret key**
5. Copie a chave gerada (comece com `sk-proj-...`)

### 2. Configurar Localmente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# .env.local
VITE_OPENAI_API_KEY=sua-api-key-aqui
```

**IMPORTANTE**: O arquivo `.env.local` já está no `.gitignore` e **NUNCA** deve ser commitado ao repositório.

### 3. Executar o Projeto

```bash
npm install
npm run dev
```

O chat de IA aparecerá como um botão flutuante azul no canto inferior direito.

## 🚀 Configuração (Produção/Deploy)

### Vercel, Netlify, ou Similar

1. Acesse o painel de configuração do seu projeto
2. Navegue até **Environment Variables** ou **Variáveis de Ambiente**
3. Adicione a variável:
   - **Nome**: `VITE_OPENAI_API_KEY`
   - **Valor**: Sua API key da OpenAI
4. Faça o redeploy do projeto

### Variáveis de Ambiente por Plataforma

**Vercel**:
```
Settings → Environment Variables → Add
```

**Netlify**:
```
Site settings → Build & deploy → Environment → Environment variables
```

**Render**:
```
Environment → Add Environment Variable
```

## 💡 Como Usar

1. **Abrir o Chat**: Clique no botão azul flutuante no canto inferior direito
2. **Fazer Perguntas**: Digite sua pergunta ou dúvida sobre gestão do delivery
3. **Receber Insights**: A IA responderá com orientações práticas e específicas

### Exemplos de Perguntas

```
"Como calcular a margem ideal para pizzas?"
"Sugestões de combos para aumentar ticket médio"
"Como reduzir custos com ingredientes?"
"Qual o melhor horário para fazer promoções?"
"Como interpretar minha taxa de conversão?"
"Dicas para melhorar tempo de entrega"
```

## 🎨 Design e UX

- **Cor Primária**: Azul Food Hub (#0066FF)
- **Posição**: Canto inferior direito, fixo
- **Responsivo**: Funciona em desktop e mobile
- **Não Intrusivo**: Pode ser minimizado a qualquer momento
- **Animações**: Suaves e profissionais

## 💰 Custos da API

O modelo **GPT-4o-mini** é o mais econômico da OpenAI:

- **Input**: ~$0.15 por 1 milhão de tokens
- **Output**: ~$0.60 por 1 milhão de tokens

**Estimativa**: Com uso moderado (100-200 mensagens/dia), o custo mensal fica entre $5-15 USD.

### Controle de Custos

- Mensagens limitadas a 500 tokens de resposta
- Histórico mantido apenas durante a sessão
- Sem armazenamento de conversas antigas

## 🔒 Segurança

- ✅ API key armazenada em variável de ambiente
- ✅ Nunca exposta no código fonte
- ✅ `.env.local` no `.gitignore`
- ✅ Comunicação direta com OpenAI (HTTPS)
- ✅ Sem armazenamento de conversas no backend

## ⚙️ Personalização

Para alterar o comportamento do assistente, edite o prompt do sistema em:

```typescript
// src/components/AIChat.tsx

{
  role: "system",
  content: `Você é um assistente especializado em...`
}
```

## 🐛 Troubleshooting

### Chat não aparece
- Verifique se a variável `VITE_OPENAI_API_KEY` está configurada
- Reinicie o servidor de desenvolvimento

### Erro "API key não configurada"
- Certifique-se de que o arquivo `.env.local` existe na raiz
- Verifique se a variável começa com `VITE_`

### Erro 401 (Unauthorized)
- API key inválida ou expirada
- Gere uma nova chave no painel da OpenAI

### Erro 429 (Rate Limit)
- Limite de requisições atingido
- Aguarde alguns minutos ou aumente o limite no painel OpenAI

## 📝 Notas

- O chat **não** acessa dados do banco de dados do usuário
- Todas as respostas são baseadas em conhecimento geral da OpenAI
- Para análises específicas de dados, o assistente fornece orientações sobre como interpretar métricas
- O histórico de conversas é limpo ao recarregar a página

## 🔄 Atualizações Futuras

Planejado:
- [ ] Integração com métricas reais do dashboard
- [ ] Análise de dados específicos do restaurante
- [ ] Sugestões personalizadas baseadas em histórico
- [ ] Modo de análise de cardápio com IA
- [ ] Geração automática de descrições de produtos

---

**Desenvolvido com ❤️ para Food Hub Pro**
