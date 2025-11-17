# 🚨 CARDÁPIO DÁ 404? LEIA ISTO!

## ⚡ SOLUÇÃO RÁPIDA (2 minutos)

### **PASSO 1: Qual é o slug do seu restaurante?**

Execute no terminal:
```bash
node check-slug.js
```

Isso vai te mostrar:
- ✅ Todos os restaurantes cadastrados
- ✅ O slug correto de cada um
- ✅ A URL completa para acessar

**OU**

Acesse a página de diagnóstico:
```
http://localhost:8080/diagnostic/qualquer-slug
```

Ela vai listar todos os slugs disponíveis.

---

### **PASSO 2: Executou o SQL no Supabase?**

**Se você ainda NÃO executou**, faça agora:

1. Abra: https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql

2. Cole este SQL:
```sql
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;
CREATE POLICY "Public can view all restaurants" ON restaurants FOR SELECT USING (true);
```

3. Clique em **RUN**

4. Deve aparecer: "Success. No rows returned"

**✅ Pronto! O 404 está corrigido.**

---

### **PASSO 3: Acesse o cardápio**

Agora acesse com o slug correto:
```
http://localhost:8080/m/SEU-SLUG-AQUI
```

**Exemplo:**
```
http://localhost:8080/m/meu-restaurante
```

---

## 🔍 Ainda não funciona?

### **Use a página de diagnóstico:**

```
http://localhost:8080/diagnostic/SEU-SLUG
```

Ela vai te mostrar:
- ✅ Se o restaurante existe
- ✅ Se o SQL foi executado
- ✅ Qual é o erro exato
- ✅ Todos os slugs disponíveis

**Tire um print e me envie!**

---

## 📋 Checklist Rápido

Marque o que você já fez:

```
[ ] Executei o SQL no Supabase
[ ] Sei qual é o slug do meu restaurante
[ ] Acessei http://localhost:8080/m/MEU-SLUG
[ ] Verifiquei a página de diagnóstico
[ ] O servidor está rodando (npm run dev)
```

---

## 🎯 Resumo dos Comandos

| O que fazer | Comando/Link |
|---|---|
| Ver slugs disponíveis | `node check-slug.js` |
| Diagnóstico visual | `http://localhost:8080/diagnostic/slug` |
| SQL do Supabase | [Clique aqui](https://supabase.com/dashboard/project/wisikawnpzrrfzqutatl/sql) |
| Cardápio | `http://localhost:8080/m/slug` |
| Criar restaurante | `http://localhost:8080/setup` |

---

## 💡 Dicas

**1. O slug é case-sensitive?**
Não! Use sempre minúsculas: `meu-restaurante`

**2. Posso ter espaços no slug?**
Não! Use hífen: `meu-restaurante` ✅ (não `meu restaurante` ❌)

**3. Como mudar o slug?**
Vá em: `http://localhost:8080/restaurant` (Configurações)

**4. Posso ter múltiplos restaurantes?**
Sim! Cada um terá um slug diferente.

---

## 🆘 Precisa de Ajuda?

**Me envie:**

1. Print da página de diagnóstico
2. URL que você está tentando acessar
3. Mensagem de erro completa

**Vou te ajudar a resolver!** 🚀
