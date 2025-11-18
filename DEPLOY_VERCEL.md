# 🚀 Guia de Deploy no Vercel - Food Hub

## ✅ Problema Corrigido

**Erro encontrado:**
```
"Layout" is not exported by "src/components/Layout.tsx"
```

**Solução aplicada:**
Alterado o import de `Layout` de named export para default export em `Customers.tsx`:
```typescript
// ❌ ANTES (errado)
import { Layout } from '@/components/Layout';

// ✅ DEPOIS (correto)
import Layout from '@/components/Layout';
```

## 📋 Checklist de Deploy

### 1️⃣ Verificar Build Local

Antes de fazer deploy, confirme que o build funciona localmente:

```bash
npm install
npm run build
```

Se aparecer `✓ built in XX.XXs`, está tudo certo! ✅

### 2️⃣ Configurar Variáveis de Ambiente no Vercel

Você precisa adicionar estas **3 variáveis de ambiente** no painel do Vercel:

#### Como adicionar variáveis:

1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável abaixo:

```bash
# Nome da variável: VITE_SUPABASE_URL
# Valor:
https://wisikawnpzrrfzqutatl.supabase.co

# Nome da variável: VITE_SUPABASE_PUBLISHABLE_KEY
# Valor:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpc2lrYXducHpycmZ6cXV0YXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzE3MDksImV4cCI6MjA3ODgwNzcwOX0.WHiwj3ALHXe4tFIby8EvCadi9vWFEP_2QmII9Zydm2A

# Nome da variável: VITE_SUPABASE_PROJECT_ID
# Valor:
wisikawnpzrrfzqutatl
```

⚠️ **IMPORTANTE**: Marque as variáveis para todos os ambientes (Production, Preview, Development)

### 3️⃣ Configurações do Projeto no Vercel

Certifique-se que as configurações estão corretas:

**Framework Preset:** `Vite`

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```bash
npm install
```

**Node Version:** `18.x` ou superior

### 4️⃣ Arquivos Já Configurados ✅

Estes arquivos já estão prontos no repositório:

#### `vercel.json`
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
✅ Configurado para SPA routing (React Router)

#### `.vercelignore`
```
node_modules
.git
*.log
```
✅ Ignora arquivos desnecessários no deploy

## 🔄 Como Fazer o Deploy

### Opção 1: Deploy Automático (Recomendado)

1. **Conecte o repositório GitHub ao Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "Add New Project"
   - Importe o repositório `foodhub-pro`
   - Configure as variáveis de ambiente (passo 2 acima)
   - Clique em "Deploy"

2. **Deploys automáticos:**
   - Cada `git push` na branch principal fará deploy automático
   - Pull requests criam previews automáticos

### Opção 2: Deploy via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy de produção
vercel --prod

# Ou apenas para preview
vercel
```

## 🐛 Troubleshooting - Erros Comuns

### Erro: "Cannot find module"

**Causa:** Dependências não instaladas ou cache antigo

**Solução:**
```bash
# No Vercel Dashboard
Settings → General → Clear Build Cache
```

### Erro: "Environment variables not defined"

**Causa:** Variáveis de ambiente faltando

**Solução:**
- Verifique se TODAS as 3 variáveis foram adicionadas
- Confirme que estão marcadas para Production
- Faça redeploy após adicionar

### Erro: "404 on page refresh"

**Causa:** Configuração de rewrites faltando

**Solução:**
- Confirme que `vercel.json` existe na raiz
- Conteúdo deve ser:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Erro: Build timeout

**Causa:** Build muito lento ou memória insuficiente

**Solução:**
```bash
# Otimizar dependências
npm prune
npm dedupe

# Ou fazer upgrade do plano Vercel
```

## 📊 Monitoramento

Após o deploy bem-sucedido:

1. **URL de produção:** `https://foodhub-pro.vercel.app` (ou seu domínio customizado)
2. **Logs:** Vercel Dashboard → Deployments → Selecionar deploy → Ver logs
3. **Analytics:** Vercel Dashboard → Analytics

## 🔗 URLs Importantes

- **Dashboard Vercel:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com/project/wisikawnpzrrfzqutatl
- **Documentação Vercel:** https://vercel.com/docs

## ✨ Próximos Passos Após Deploy

1. ✅ Verificar se o site está no ar
2. ✅ Testar login/autenticação
3. ✅ Testar conexão com Supabase
4. ✅ Verificar rotas (Dashboard, Clientes, etc)
5. ✅ Testar responsividade mobile
6. ✅ Configurar domínio customizado (opcional)

## 🆘 Se Ainda Houver Erro

Me envie o erro completo do Vercel:

1. Vá em Vercel Dashboard → Deployments
2. Clique no deploy que falhou
3. Copie o log de erro completo
4. Me envie aqui

**Status atual:** ✅ Build local funcionando perfeitamente!

---

**Última atualização:** Commit `a4095a2` - Import do Layout corrigido
