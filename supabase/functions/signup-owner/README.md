# Signup Owner Edge Function

Esta Edge Function gerencia o cadastro do primeiro usuário do sistema como Owner (proprietário).

## Funcionalidade

### Sistema de Cadastro Inteligente

1. **Primeiro Usuário → Owner**
   - O primeiro usuário que se cadastra vira **Owner** automaticamente
   - Cria uma **Brand** (marca) automaticamente
   - Cria um **Restaurante** (Unidade 1) automaticamente
   - Configura role_id, brand_id e restaurant_id no user_metadata
   - Todas as permissões são atribuídas

2. **Usuários Subsequentes → Bloqueados**
   - Segundo usuário em diante **não pode** usar signup público
   - Deve ser criado por Owner ou Manager via `/users/new`
   - Retorna erro claro explicando a situação

### Validação

A função valida se é o primeiro usuário verificando:
- Se existem brands cadastradas no sistema
- Se não houver brands = primeiro usuário = vira Owner
- Se houver brands = já tem Owner = bloqueia signup

## Request

```json
POST /functions/v1/signup-owner
{
  "email": "dono@restaurant.com",
  "password": "senha123",
  "name": "João Silva",
  "restaurant_name": "Restaurante do João" // opcional
}
```

## Response

### Sucesso (Primeiro Usuário)

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "dono@restaurant.com"
  },
  "brand": {
    "id": "uuid",
    "name": "João Silva"
  },
  "restaurant": {
    "id": "uuid",
    "name": "Restaurante do João - Unidade 1"
  },
  "message": "Conta criada com sucesso! Você é o proprietário do sistema."
}
```

### Erro (Já Existe Owner)

```json
{
  "success": false,
  "error": "Já existe um proprietário cadastrado. Entre em contato com o administrador para criar sua conta."
}
```

## Rollback Automático

Se algo falhar durante a criação, a função faz rollback:
- ✅ Falhou ao criar Brand → Deleta usuário
- ✅ Falhou ao criar Restaurante → Deleta Brand e Usuário
- ✅ Falhou ao atualizar metadata → Log de erro (usuário mantido)

## Estrutura Criada

Quando bem-sucedido, cria:

1. **Usuário**
   ```
   - email: email fornecido
   - password: senha fornecida
   - user_metadata:
     - name: nome ou email
     - role_id: ID do role owner
     - role_name: "owner"
     - role_color: cor do badge
     - brand_id: ID da brand criada
     - restaurant_id: ID do restaurante criado
     - is_active: true
   ```

2. **Brand**
   ```
   - name: nome do usuário
   - slug: versão URL-friendly do nome
   - owner_id: ID do usuário
   ```

3. **Restaurante**
   ```
   - name: nome fornecido ou "Brand - Unidade 1"
   - slug: versão URL-friendly
   - owner_id: ID do usuário
   - brand_id: ID da brand
   - restaurant_index: 1
   - is_open: false (para configurar depois)
   ```

4. **Audit Log**
   ```
   - action: "signup"
   - resource_type: "user"
   - new_value: dados do signup
   ```

## Segurança

- ✅ Usa Service Role Key (permissões de admin)
- ✅ Valida se é realmente o primeiro usuário
- ✅ Não permite criar múltiplos owners via signup
- ✅ Email confirmado automaticamente (sem email de confirmação)
- ✅ Logs de auditoria

## Deploy

```bash
supabase functions deploy signup-owner
```

## Fluxo de Uso

1. **Primeiro Acesso:**
   - Usuário acessa `/auth`
   - Clica em "Criar Conta"
   - Preenche email e senha
   - ✅ Vira Owner automaticamente

2. **Próximos Usuários:**
   - Owner acessa `/users/new`
   - Cria usuários com roles específicos
   - (Manager, Garçom, Recepção, etc.)

## Observações

- Apenas o **primeiro usuário** vira Owner
- Não requer chaves externas (apenas Supabase)
- Totalmente automático e seguro
- Rollback em caso de erro
