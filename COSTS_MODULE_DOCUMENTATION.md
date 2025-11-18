# Módulo de Custos - FoodHub Pro

## Visão Geral

O Módulo de Custos é um sistema inteligente e adaptativo de gestão financeira para estabelecimentos gastronômicos. Ele se adapta automaticamente ao tipo de negócio (pizzaria, hamburgueria, cafeteria, sorveteria, restaurante, etc.) e oferece ferramentas completas para controle de custos e precificação.

## Características Principais

### 🤖 Inteligência Adaptativa

- **Configuração Automática por IA**: O sistema detecta o tipo de negócio e configura automaticamente:
  - Categorias de insumos apropriadas
  - Tipos de tamanhos/unidades (P/M/G para pizzaria, gramaturas para hamburgueria, etc.)
  - Templates de produtos comuns
  - Categorias de custos fixos e variáveis
  - Unidades de medida adequadas

### 📊 Módulos Implementados

#### 1. Insumos / Matéria-Prima ✅ **IMPLEMENTADO**
- Cadastro completo de ingredientes e materiais
- Organização por categorias
- Controle de estoque (mínimo e atual)
- Rastreamento de fornecedores
- Custo por unidade
- Exportação para CSV
- Interface intuitiva com CRUD completo

**Campos disponíveis:**
- Nome e descrição
- Categoria
- Unidade de medida (g, kg, ml, L, un, cx, pct)
- Custo por unidade
- Estoque mínimo e atual
- Fornecedor e contato

#### 2. Tamanhos / Unidades 🚧 **EM DESENVOLVIMENTO**
- Gerenciamento de variações de tamanho
- Adaptável ao nicho do negócio:
  - Pizzaria: P, M, G, GG (com fatores multiplicadores)
  - Hamburgueria: Gramaturas (120g, 180g, 240g, 360g)
  - Cafeteria: Tamanhos de copo (240ml, 350ml, 480ml)
  - Sorveteria/Açaiteria: Copos/potes (300ml, 500ml, 700ml, 1L)
  - Restaurante: Porções (Pequena, Média, Grande)

#### 3. Receitas / Fichas Técnicas 🚧 **EM DESENVOLVIMENTO**
- Vinculação de produtos com insumos
- Cálculo automático de custo de produção
- Quantidades por tamanho/variação
- Gestão de receitas

#### 4. Adicionais 🚧 **EM DESENVOLVIMENTO**
- Cadastro de extras e complementos
- Exemplos por nicho:
  - Pizzaria: bordas recheadas
  - Hamburgueria: bacon, queijos extras, molhos
  - Açaiteria: granolas, frutas, coberturas
  - Restaurante: acompanhamentos

#### 5. Bebidas 🚧 **EM DESENVOLVIMENTO**
- Cardápio de bebidas separado
- Controle de custos e preços
- Categorização (refrigerantes, sucos, cervejas, etc.)

#### 6. Combos 🚧 **EM DESENVOLVIMENTO**
- Montagem de combos promocionais
- Cálculo automático de custo total
- Margem de lucro em combos
- Sugestões automáticas por IA

#### 7. Custos Fixos 🚧 **EM DESENVOLVIMENTO**
- Gerenciamento de despesas recorrentes
- Categorias típicas:
  - Aluguel
  - Salários e encargos
  - Energia elétrica
  - Água
  - Gás
  - Internet
  - Contador
  - Seguros

#### 8. Custos Variáveis 🚧 **EM DESENVOLVIMENTO**
- Registro de despesas não recorrentes
- Categorias típicas:
  - Embalagens
  - Taxas de delivery
  - Taxas de plataformas (iFood, Rappi, Uber Eats)
  - Taxa de cartão/maquininha
  - Gasolina para entregas
  - Marketing e publicidade

#### 9. Calculadora de Preço 🚧 **EM DESENVOLVIMENTO**
Sistema avançado de precificação com:
- **Custo real do item**: Soma de todos os ingredientes + adicionais
- **Margem de lucro**: Percentual desejado sobre o custo
- **Markup**: Multiplicador de preço
- **Ponto de equilíbrio**: Quantas unidades vender para cobrir custos fixos
- **Custos fixos rateados**: Distribuição proporcional dos custos fixos
- **Lucro líquido estimado**: Projeção de lucro por item
- **Sugestão de preço por IA**: Análise de mercado e competitividade

## Estrutura do Banco de Dados

### Tabelas Criadas

1. **ingredient_categories** - Categorias de insumos
2. **ingredients** - Insumos/matéria-prima
3. **recipe_ingredients** - Receitas (liga produtos com insumos)
4. **beverage_categories** - Categorias de bebidas
5. **beverages** - Bebidas
6. **combos** - Combos promocionais
7. **combo_items** - Itens dos combos
8. **fixed_costs** - Custos fixos/recorrentes
9. **variable_costs** - Custos variáveis
10. **cost_calculator_settings** - Configurações da calculadora
11. **ai_business_templates** - Templates de IA por nicho

### Campos Adicionados em Tabelas Existentes

**restaurants:**
- `business_type`: Categoria principal do negócio
- `business_niche`: Nicho específico (pizzaria, hamburgueria, etc.)
- `ai_configured`: Se a IA já configurou o restaurante
- `ai_config`: Configurações geradas pela IA (JSONB)

**product_variations:**
- `size_type`: Tipo de variação (pizza_size, burger_weight, cup_size, etc.)
- `size_metadata`: Metadados adicionais (peso, volume, multiplicadores)
- `is_ai_generated`: Se foi gerado automaticamente pela IA

## Templates de IA Pré-configurados

### 1. Pizzaria
- **Categorias de insumos**: Massas, Molhos, Queijos, Carnes, Vegetais, Temperos, Embalagens
- **Tamanhos**: Broto (4 fatias), P (6), M (8), G (10), GG (12)
- **Produtos comuns**: Margherita, Calabresa, Portuguesa, 4 Queijos, Frango
- **Combos**: Pizza + Refrigerante, 2 Pizzas + Refrigerante 2L

### 2. Hamburgueria
- **Categorias de insumos**: Carnes/Blends, Pães, Queijos, Vegetais, Molhos, Batatas, Embalagens
- **Tamanhos**: 120g, 180g, 240g, 360g
- **Produtos comuns**: Clássico, Cheeseburger, Bacon Burger, Veggie Burger
- **Combos**: Burger + Batata + Refrigerante

### 3. Cafeteria
- **Categorias de insumos**: Cafés, Leites, Açúcares, Xaropes, Pós, Copos/Embalagens
- **Tamanhos**: Pequeno (240ml), Médio (350ml), Grande (480ml)
- **Produtos comuns**: Espresso, Cappuccino, Latte, Mocha, Americano
- **Combos**: Café + Pão de Queijo, Café + Brownie

### 4. Sorveteria / Açaiteria
- **Categorias de insumos**: Sorvetes/Açaí Base, Frutas, Granolas, Caldas, Complementos, Embalagens
- **Tamanhos**: 300ml, 500ml, 700ml, 1L
- **Produtos comuns**: Açaí, Sorvete, Picolé, Milkshake
- **Combos**: Açaí + Suco

### 5. Restaurante / Marmitaria
- **Categorias de insumos**: Carnes, Grãos, Vegetais, Temperos, Óleos, Embalagens
- **Tamanhos**: Pequena (300g), Média (500g), Grande (800g)
- **Produtos comuns**: Marmita Executiva, Prato Feito, À la Carte
- **Combos**: Marmita + Refrigerante, PF + Suco

## Funcionalidades de Importação/Exportação

### Exportação para CSV ✅ **DISPONÍVEL**
- Botão de exportação em cada módulo
- Formato CSV compatível com Excel
- Inclui todos os dados cadastrados
- Nome do arquivo com data automática

### Importação de Excel 🚧 **EM DESENVOLVIMENTO**
- Upload de arquivo XLSX
- Download de template pré-formatado
- Validação de dados
- Inserção em lote

## Como Usar

### Configuração Inicial

1. **Primeiro acesso**: O sistema detectará que o restaurante não está configurado
2. **Onboarding**: Será exibida uma tela solicitando o tipo de negócio
3. **Configuração Automática**: A IA criará automaticamente:
   - Categorias de insumos
   - Tamanhos/variações padrão
   - Templates de produtos
   - Categorias de custos

### Fluxo de Trabalho Recomendado

1. **Cadastrar Insumos**
   - Acesse a aba "Insumos"
   - Adicione todos os ingredientes e materiais que você usa
   - Organize por categorias
   - Defina custos e fornecedores

2. **Configurar Tamanhos** (Em desenvolvimento)
   - Acesse a aba "Tamanhos"
   - Revise os tamanhos pré-configurados pela IA
   - Adicione ou ajuste conforme necessário

3. **Montar Receitas** (Em desenvolvimento)
   - Acesse a aba "Receitas"
   - Para cada produto, vincule os insumos necessários
   - Defina as quantidades
   - O custo será calculado automaticamente

4. **Configurar Adicionais** (Em desenvolvimento)
   - Cadastre extras e complementos
   - Defina custos e preços

5. **Cadastrar Bebidas** (Em desenvolvimento)
   - Monte o cardápio de bebidas
   - Defina custos e preços

6. **Criar Combos** (Em desenvolvimento)
   - Monte combos promocionais
   - O sistema calculará o custo total automaticamente

7. **Registrar Custos Fixos** (Em desenvolvimento)
   - Cadastre todas as despesas recorrentes
   - O sistema usará isso na calculadora de preços

8. **Registrar Custos Variáveis** (Em desenvolvimento)
   - Registre despesas não recorrentes
   - Mantenha histórico para análise

9. **Usar a Calculadora** (Em desenvolvimento)
   - Selecione um produto
   - Veja o custo total (ingredientes + custos fixos rateados)
   - Defina a margem de lucro desejada
   - Receba sugestão de preço

## Segurança e Permissões

- **Row Level Security (RLS)**: Habilitado em todas as tabelas
- **Isolamento de dados**: Cada restaurante vê apenas seus próprios dados
- **Autenticação**: Vinculado ao sistema de autenticação do Supabase
- **Validações**: Campos obrigatórios e tipos validados

## Próximos Passos de Desenvolvimento

### Fase 1 - Completar Módulos Core ⏳
- [ ] Implementar módulo de Tamanhos/Unidades
- [ ] Implementar módulo de Receitas
- [ ] Implementar módulo de Adicionais
- [ ] Implementar módulo de Bebidas
- [ ] Implementar módulo de Combos

### Fase 2 - Custos e Calculadora ⏳
- [ ] Implementar módulo de Custos Fixos
- [ ] Implementar módulo de Custos Variáveis
- [ ] Implementar Calculadora de Preço completa

### Fase 3 - IA e Automação ⏳
- [ ] Sistema de onboarding com detecção de nicho
- [ ] Configuração automática por IA
- [ ] Sugestões de preço por IA
- [ ] Análise de competitividade

### Fase 4 - Importação/Exportação ⏳
- [ ] Sistema de importação Excel (XLSX)
- [ ] Templates de importação por nicho
- [ ] Validações avançadas
- [ ] Exportação em múltiplos formatos

### Fase 5 - Relatórios e Dashboards ⏳
- [ ] Dashboard de custos
- [ ] Gráficos de evolução de custos
- [ ] Análise de margem de lucro
- [ ] Relatórios customizáveis
- [ ] Exportação de relatórios PDF

## Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## Suporte

Para dúvidas ou problemas:
1. Consulte esta documentação
2. Verifique os templates de IA disponíveis
3. Use o sistema de ajuda integrado (em desenvolvimento)

## Changelog

### v1.0.0 - 2025-01-18
- ✅ Criação da estrutura completa do banco de dados
- ✅ Implementação do módulo de Insumos
- ✅ Sistema de exportação CSV
- ✅ Interface com navegação por abas
- ✅ Templates de IA para 5 nichos (pizzaria, hamburgueria, cafeteria, sorveteria, restaurante)
- 🚧 Outros módulos em desenvolvimento

---

**Desenvolvido com ❤️ para a comunidade gastronômica**
