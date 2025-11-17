# Instruções para Corrigir o Erro 404 no Cardápio Público

## Problema Identificado

O erro 404 ao acessar o cardápio público (`/m/:slug`) ocorre devido a uma política RLS (Row Level Security) muito restritiva no Supabase.

### Causa Raiz

A política atual no banco de dados:

```sql
CREATE POLICY "Public can view active restaurants" ON restaurants
  FOR SELECT USING (is_open = true);
```

Esta política bloqueia o acesso a restaurantes que tenham `is_open = false`, fazendo com que a consulta retorne vazio e exiba erro 404.

## Solução Implementada

### 1. Código da Aplicação (✅ Já Implementado)

- Adicionado campo `is_open` na interface `Restaurant`
- Adicionado banner de aviso quando o restaurante está fechado
- Agora o cardápio é exibido mesmo com restaurante fechado, mas com aviso visual

### 2. Migração do Banco de Dados (⚠️ REQUER AÇÃO MANUAL)

A migração SQL foi criada em: `supabase/migrations/20251117_fix_public_menu_access_v2.sql`

**Você precisa aplicar esta migração manualmente no painel do Supabase:**

#### Opção A: Via Painel do Supabase

1. Acesse o [Painel do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral)
4. Clique em **New Query**
5. Cole o seguinte código SQL:

```sql
-- Drop the restrictive policy that requires is_open = true
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;

-- Create a new policy that allows public viewing of any restaurant
CREATE POLICY "Public can view all restaurants" ON restaurants
  FOR SELECT USING (true);
```

6. Clique em **Run** para executar

#### Opção B: Via Supabase CLI (se disponível)

Se você tiver o Supabase CLI instalado localmente:

```bash
supabase db push
```

## Verificação

Após aplicar a migração:

1. Acesse o cardápio público: `{seu-dominio}/m/{slug-do-restaurante}`
2. O cardápio deve carregar normalmente
3. Se `is_open = false`, você verá um banner amarelo: "⚠️ Este restaurante está temporariamente fechado"
4. Se `is_open = true`, o cardápio aparece normalmente

## Alternativa Temporária

Se não puder aplicar a migração imediatamente, você pode:

1. Ir para **Configurações do Restaurante** no painel admin
2. Marcar o restaurante como "Aberto" (is_open = true)
3. Isso permitirá o acesso temporário ao cardápio

## Arquivos Modificados

- `src/pages/PublicMenu.tsx` - Adicionado suporte para is_open e banner de aviso
- `supabase/migrations/20251117_fix_public_menu_access_v2.sql` - Nova migração SQL

## Segurança

A nova política RLS ainda é segura porque:
- Apenas permite leitura (SELECT) pública
- Não permite modificação dos dados
- As políticas de INSERT/UPDATE/DELETE permanecem restritas aos proprietários
