# 🔍 VERIFICAR SE O DEPLOY ESTÁ CORRETO

## ⚠️ O problema persiste? Vamos verificar o Vercel

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### **1. Verificar se o deploy terminou**

Acesse: https://vercel.com/dashboard

- [ ] O deploy está com status "Ready"?
- [ ] Não há erros no build log?
- [ ] O domínio está correto?

---

### **2. Verificar configuração do projeto no Vercel**

No dashboard do Vercel, vá em **Settings** do projeto:

#### **Build & Development Settings:**
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

#### **Environment Variables:**
Verifique se estão configuradas:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

---

### **3. Forçar novo deploy**

Se tudo estiver correto mas ainda der 404:

**Opção A: Via Dashboard**
1. Vá em **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Clique em **Redeploy**
4. Marque "Use existing Build Cache" = **OFF**
5. Clique em **Redeploy**

**Opção B: Via Git**
```bash
git commit --allow-empty -m "Forçar redeploy no Vercel"
git push
```

---

### **4. Verificar logs do build**

No Vercel, vá em:
1. **Deployments** → Último deploy
2. Clique em **Building**
3. Procure por erros

**Erros comuns:**
- ❌ `Module not found`
- ❌ `Build failed`
- ❌ `Out of memory`

---

### **5. Testar URLs alternativas**

Teste se OUTRAS rotas funcionam:

- Home: `https://seu-dominio.vercel.app/`
- Auth: `https://seu-dominio.vercel.app/auth`
- Dashboard: `https://seu-dominio.vercel.app/dashboard`

Se NENHUMA rota funcionar → problema no build
Se só `/m/pepperspizza` der 404 → problema de roteamento

---

## 🔧 SOLUÇÕES ALTERNATIVAS

### **SOLUÇÃO 1: Reconfigurar projeto no Vercel**

1. **Delete o projeto** no Vercel (não se preocupe, o código está no GitHub)
2. **Reimporte** do GitHub
3. **Configure:**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Adicione as env vars** do Supabase
5. **Deploy**

---

### **SOLUÇÃO 2: Usar Netlify em vez do Vercel**

Se o Vercel continuar dando problema:

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

O arquivo `public/_redirects` já está configurado para Netlify!

---

### **SOLUÇÃO 3: Testar build local**

Antes de fazer deploy, teste localmente:

```bash
# Fazer build
npm run build

# Servir o build
npm run preview

# Testar
# http://localhost:4173/m/pepperspizza
```

Se funcionar localmente mas não no Vercel → problema de configuração do Vercel

---

## 🐛 DEBUG AVANÇADO

### **Ver o que o Vercel está servindo:**

Acesse:
```
https://seu-dominio.vercel.app/_logs
```

Ou veja os logs em tempo real:
```bash
vercel logs seu-dominio.vercel.app
```

---

### **Verificar se index.html está sendo servido:**

Abra o DevTools (F12) e vá na aba **Network**

Acesse: `https://seu-dominio.vercel.app/m/pepperspizza`

Veja:
- ✅ Se carregou `index.html` (status 200)
- ❌ Se tentou buscar `/m/pepperspizza` como arquivo (404)

---

## 💡 CONFIGURAÇÃO CORRETA DO VERCEL.JSON

O arquivo `vercel.json` deve ter:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/m/:slug", "destination": "/index.html" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**✅ Já está configurado assim!**

---

## 🆘 ÚLTIMA SOLUÇÃO

Se NADA funcionar, há um problema específico com seu projeto no Vercel.

**Faça isto:**

1. **Crie um novo projeto no Vercel** (não delete o atual)
2. **Conecte ao MESMO repositório GitHub**
3. **Use uma branch diferente** ou um nome diferente
4. **Configure do zero**
5. **Teste**

Se funcionar → delete o projeto antigo e use o novo
Se não funcionar → o problema é no código/build

---

## 📞 INFORMAÇÕES PARA DEBUG

Se precisar de ajuda, me envie:

1. **URL do projeto no Vercel**
2. **Screenshot do build log** (última parte)
3. **Screenshot do erro 404** (com DevTools aberto)
4. **Configurações do projeto** (Settings > General)

---

**Aguarde o deploy terminar (1-3 minutos) e teste novamente!**
