# ⚠️ CORRIJA O ERRO "column status does not exist" AGORA!

## 🎯 Problema

Você está vendo este erro ao tentar usar o sistema de pedidos:

```
Error: Failed to run sql query: ERROR: 42703: column "status" does not exist
```

OU

```
Erro ao carregar pedidos
```

## ✅ Solução (3 PASSOS SIMPLES)

### PASSO 1: Acesse o Supabase SQL Editor

1. Vá para: https://app.supabase.com/
2. Abra seu projeto do FoodHub
3. Clique em **SQL Editor** no menu lateral
4. Clique em **New Query**

### PASSO 2: Execute o Script de Correção

1. Abra o arquivo **`FIX_ORDERS_DEFINITIVO.sql`** deste repositório
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. **Cole no SQL Editor** do Supabase
4. Clique em **RUN** (ou pressione Ctrl+Enter)
5. **Aguarde 10-30 segundos**

### PASSO 3: Verifique se Funcionou

Você verá uma mensagem assim no final:

```
✅ FIX DEFINITIVO CONCLUÍDO COM SUCESSO!

📋 Verificações:
   ✓ Tabela orders: ✅ Criada
   ✓ Coluna status: ✅ Existe
   ✓ Coluna total_amount: ✅ Existe
   ✓ Coluna order_number: ✅ Existe
   ✓ Índice idx_orders_status: ✅ Criado
```

Se você viu isso, **FUNCIONOU!** 🎉

---

## 🧪 Teste Agora

1. Acesse o FoodHub
2. Faça login
3. Vá na aba **Pedidos**
4. Se não aparecer mais "Erro ao carregar pedidos", está funcionando! ✅

---

## ❓ O Que Este Script Faz?

Este script SQL **definitivo**:

✅ **Dropa e recria** as tabelas de pedidos do zero (sem conflitos)
✅ **Corrige** a coluna `status` (agora existe!)
✅ **Corrige** a coluna `total_amount` (nome correto)
✅ **Adiciona** geração automática de número de pedido
✅ **Configura** auto-criação de clientes
✅ **Habilita** atualização automática de estatísticas
✅ **Configura** RLS Policies corretas
✅ **Habilita** Realtime para pedidos

---

## 📊 Tabelas Recriadas

O script recria estas tabelas:

- ✅ `customers` - Clientes do restaurante
- ✅ `orders` - Pedidos (CORRIGIDO com `status` e `total_amount`)
- ✅ `order_items` - Itens dos pedidos
- ✅ `order_item_variations` - Variações dos itens (tamanhos)
- ✅ `order_item_additionals` - Adicionais dos itens

---

## ⚠️ IMPORTANTE

**ATENÇÃO:** Este script **DROPA** (deleta) as tabelas de pedidos existentes e recria do zero.

Se você tiver pedidos reais no banco que não pode perder, **FAÇA BACKUP ANTES!**

Para fazer backup:
1. Vá em **Table Editor** no Supabase
2. Abra a tabela `orders`
3. Clique em **Export** → **CSV**
4. Salve o arquivo

---

## 🔧 Recursos Automáticos Configurados

Após executar o script, você terá:

1. **Número de Pedido Automático**
   Formato: `YYYYMMDD0001` (20251118001, 20251118002...)

2. **Auto-Criação de Clientes**
   Ao criar um pedido, se o cliente não existir, é criado automaticamente

3. **Estatísticas Automáticas**
   Total de pedidos, valor gasto e ticket médio atualizados em tempo real

4. **Timestamps Automáticos**
   `updated_at` atualizado automaticamente em cada mudança

---

## 🆘 Ainda Com Problemas?

Se ainda der erro após executar o script:

1. **Tire um print da mensagem de erro**
2. **Copie o erro completo do console**
3. **Abra um issue no GitHub** com:
   - Print do erro
   - Mensagem de erro completa
   - Qual passo você estava fazendo

---

## 📞 Suporte

- **GitHub Issues**: [Reportar Problema](https://github.com/iamoreiramarcelo-cyber/foodhub-pro/issues)
- **Documentação**: Veja os outros arquivos `.md` neste repositório

---

**Desenvolvido com 💙 para FoodHub Pro**

Última atualização: 2025-11-18
