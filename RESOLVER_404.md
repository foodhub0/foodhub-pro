# 🔴 CARDÁPIO AINDA DÁ 404? VEJA AQUI!

## 🎯 Passo a Passo Para Resolver AGORA

### **OPÇÃO 1: Use a Página de Diagnóstico** (Mais Rápido)

1. **Acesse esta URL no navegador:**
   ```
   http://localhost:8080/diagnostic/SEU-SLUG
   ```

   Exemplo: `http://localhost:8080/diagnostic/meu-restaurante`

2. **A página vai te mostrar:**
   - ✅ Se o slug existe no banco
   - ✅ Qual é o erro exato
   - ✅ Todos os slugs disponíveis
   - ✅ Se precisa executar SQL

3. **Tire um print** e me envie se precisar de ajuda

---

### **OPÇÃO 2: Execute o SQL Manualmente**

Se você ainda **NÃO EXECUTOU** o SQL no Supabase:

#### **Link direto do SQL Editor:**
```
https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql
```

#### **Cole este SQL e clique em RUN:**

```sql
-- CORREÇÃO DO 404
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;
CREATE POLICY "Public can view all restaurants" ON restaurants FOR SELECT USING (true);

-- Verificar se funcionou
SELECT id, name, slug, is_open FROM restaurants;
```

Se aparecer a lista de restaurantes, **está funcionando!**

---

### **OPÇÃO 3: Verificar o Slug Correto**

#### **No terminal, execute:**

```bash
# Abrir console do Supabase
# Este comando vai te mostrar qual é o slug do seu restaurante
```

Ou acesse:
```
http://localhost:8080/dashboard
```

Vá em **Configurações do Restaurante** e veja qual é o **slug**.

---

## 🐛 Problemas Comuns

### **1. "O slug não existe"**

**Solução:** Você precisa criar um restaurante primeiro!

1. Acesse: `http://localhost:8080/setup`
2. Ou: `http://localhost:8080/dashboard`
3. Crie seu restaurante
4. Anote o **slug** gerado

---

### **2. "Row level security policy violated"**

**Solução:** Execute o SQL acima no Supabase.

O problema é que a política RLS está bloqueando acesso público.

---

### **3. "404 - Not Found"**

**Possíveis causas:**

a) **Slug errado na URL**
   - Verifique se digitou o slug correto
   - Não use espaços ou caracteres especiais
   - Use apenas letras minúsculas, números e hífens

b) **Servidor não está rodando**
   - Rode: `npm run dev`
   - Acesse: `http://localhost:8080`

c) **Política RLS não foi corrigida**
   - Execute o SQL acima

---

## 🧪 Como Testar se Está Funcionando

### **Teste 1: Página de Diagnóstico**
```
http://localhost:8080/diagnostic/SEU-SLUG
```

Deve mostrar dados do restaurante.

### **Teste 2: Cardápio Direto**
```
http://localhost:8080/m/SEU-SLUG
```

Deve abrir o cardápio sem erro 404.

### **Teste 3: Console do Navegador**

1. Abra `http://localhost:8080/m/SEU-SLUG`
2. Pressione F12
3. Vá na aba **Console**
4. Me envie os erros que aparecerem (se houver)

---

## 📋 Checklist de Verificação

Marque o que você já fez:

- [ ] Executei o SQL no Supabase SQL Editor
- [ ] Criei um restaurante no painel
- [ ] Copiei o slug correto do restaurante
- [ ] O servidor está rodando (`npm run dev`)
- [ ] Acessei a URL com o slug correto
- [ ] Verifiquei a página de diagnóstico

---

## 🆘 Se Ainda Não Funcionar

**Me envie as seguintes informações:**

1. **Print da página de diagnóstico:**
   - Acesse: `http://localhost:8080/diagnostic/SEU-SLUG`
   - Tire print da tela inteira

2. **Qual URL você está tentando acessar:**
   - Exemplo: `http://localhost:8080/m/meu-restaurante`

3. **Erro que aparece:**
   - Print do erro
   - Ou mensagem completa

4. **Console do navegador:**
   - Pressione F12
   - Aba Console
   - Print dos erros (se houver)

---

## ✅ Depois que Funcionar

Quando o cardápio abrir corretamente:

1. ✅ Clique em um produto
2. ✅ Modal abre com detalhes
3. ✅ Adicione ao carrinho
4. ✅ Clique no ícone do carrinho
5. ✅ Finalize o pedido

**Tudo deve funcionar perfeitamente!** 🎉

---

## 📞 Links Úteis

- **Painel Admin:** http://localhost:8080/dashboard
- **Setup Inicial:** http://localhost:8080/setup
- **Supabase SQL:** https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql
- **Diagnóstico:** http://localhost:8080/diagnostic/SEU-SLUG

---

**💡 Dica:** Use sempre a página de diagnóstico primeiro! Ela te mostra exatamente qual é o problema.
