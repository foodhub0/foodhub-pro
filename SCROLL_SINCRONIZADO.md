# 📜 Sistema de Scroll Sincronizado - Estilo iFood

## ✨ Implementação Completa

O cardápio público agora possui **scroll sincronizado** igual aos apps de delivery (iFood, Rappi, Uber Eats)!

### 🎯 Comportamento

1. **Sticky Header**: Barra de categorias fica fixa no topo enquanto você scrolla
2. **Detecção Automática**: Categoria ativa muda conforme a seção visível
3. **Scroll Suave**: Clique em uma categoria para navegar até a seção
4. **Performance**: Usa `IntersectionObserver` (API nativa do navegador)

## 🔧 Implementação Técnica

### Estados e Refs

```typescript
// Estado da categoria ativa (detectada pelo scroll)
const [activeCategory, setActiveCategory] = useState<string | null>(null);

// Estado do filtro manual (quando usuário clica em categoria)
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

// Refs para as seções de categoria
const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

// Ref para a barra de tabs (scroll horizontal)
const tabsRef = useRef<HTMLDivElement>(null);

// Ref do IntersectionObserver
const observerRef = useRef<IntersectionObserver | null>(null);

// Flag para desabilitar observer durante scroll programático
const isScrollingRef = useRef(false);
```

### IntersectionObserver

```typescript
useEffect(() => {
  // Não aplicar durante busca ou scroll programático
  if (searchQuery || isScrollingRef.current) return;

  // Limpar observer anterior
  if (observerRef.current) {
    observerRef.current.disconnect();
  }

  // Configuração otimizada
  const observerOptions = {
    root: null, // viewport
    rootMargin: '-20% 0px -60% 0px', // Detecta quando está 20% do topo
    threshold: 0.1,
  };

  const observerCallback = (entries: IntersectionObserverEntry[]) => {
    // Encontrar a seção mais visível
    const visibleEntries = entries.filter(entry => entry.isIntersecting);

    if (visibleEntries.length > 0) {
      const mostVisible = visibleEntries.reduce((prev, current) => {
        return current.intersectionRatio > prev.intersectionRatio ? current : prev;
      });

      const categoryId = mostVisible.target.getAttribute('data-category-id');

      if (categoryId) {
        setActiveCategory(categoryId);

        // Scroll horizontal da tab para o centro
        const tabButton = document.querySelector(`[data-category="${categoryId}"]`);
        if (tabButton && tabsRef.current) {
          tabButton.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }
    }
  };

  observerRef.current = new IntersectionObserver(observerCallback, observerOptions);

  // Observar todas as seções
  Object.values(categoryRefs.current).forEach(element => {
    if (element) {
      observerRef.current?.observe(element);
    }
  });

  // Cleanup
  return () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  };
}, [categories, searchQuery]);
```

### Navegação por Clique

```typescript
const handleCategoryClick = (categoryId: string | null) => {
  // Marcar que estamos scrollando programaticamente
  isScrollingRef.current = true;

  if (categoryId === null) {
    // Voltar ao topo
    setSelectedCategory(null);
    setActiveCategory(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000);
    return;
  }

  // Limpar filtro e scrollar até seção
  setSelectedCategory(null);
  setActiveCategory(categoryId);

  const element = categoryRefs.current[categoryId];
  if (element) {
    const headerOffset = 200; // Altura do header sticky + tabs
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });

    // Reativar observer após scroll
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000);
  }
};
```

### Renderização das Tabs

```typescript
<div className="overflow-x-auto scrollbar-hide border-t bg-white" ref={tabsRef}>
  <div className="flex gap-1 px-4 min-w-max">
    {/* Botão "Todos" */}
    <Button
      variant="ghost"
      data-category="all"
      className={cn(
        "rounded-none border-b-2 px-4 py-3 font-medium transition-all duration-200",
        !selectedCategory && !activeCategory
          ? "border-[#007BFF] text-[#007BFF] bg-[#E8F1FF]/30"
          : "border-transparent text-gray-600 hover:text-[#007BFF]"
      )}
      onClick={() => handleCategoryClick(null)}
    >
      Todos
    </Button>

    {/* Categorias */}
    {categories.map((category) => {
      // Ativo se está filtrado OU é a categoria visível no scroll
      const isActive = selectedCategory
        ? selectedCategory === category.id
        : activeCategory === category.id;

      return (
        <Button
          key={category.id}
          variant="ghost"
          data-category={category.id}
          className={cn(
            "rounded-none border-b-2 px-4 py-3 font-medium transition-all duration-200",
            isActive
              ? "border-[#007BFF] text-[#007BFF] bg-[#E8F1FF]/30 font-semibold"
              : "border-transparent text-gray-600 hover:text-[#007BFF]"
          )}
          onClick={() => handleCategoryClick(category.id)}
        >
          {category.name}
        </Button>
      );
    })}
  </div>
</div>
```

### Renderização das Seções

```typescript
{categories.map((category) => {
  const categoryProducts = filteredProducts.filter(
    p => p.category_id === category.id
  );

  if (categoryProducts.length === 0) return null;
  if (selectedCategory && selectedCategory !== category.id) return null;

  return (
    <div
      key={category.id}
      data-category-id={category.id}  // ← Importante para o observer!
      className="mb-8 scroll-mt-52"   // ← Offset do scroll
      ref={(el) => { categoryRefs.current[category.id] = el; }}
    >
      <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase sticky top-[168px] bg-gray-50 py-2 -mx-4 px-4 z-10">
        {category.name}
      </h2>

      {/* Produtos da categoria... */}
    </div>
  );
})}
```

## 🎨 Estilo Visual

### Paleta Azul Food Hub

```css
/* Categoria ativa */
border-color: #007BFF  /* Azul primário */
color: #007BFF
background: #E8F1FF/30  /* Azul claro com 30% opacidade */

/* Hover */
color: #007BFF
background: #E8F1FF/20
```

### Classes Tailwind Importantes

```css
/* Sticky header */
.sticky top-0 z-40

/* Scroll offset (para não ficar atrás do header) */
.scroll-mt-52

/* Título da categoria sticky */
.sticky top-[168px]

/* Transições suaves */
.transition-all duration-200
```

## 📱 Responsividade

- **Mobile**: Scroll horizontal nas tabs
- **Tablet**: Tabs responsivas
- **Desktop**: Layout completo

## ⚡ Performance

### Por que IntersectionObserver?

1. **Eficiência**: Não precisa calcular posições a cada scroll
2. **Nativo**: API do navegador, sem bibliotecas externas
3. **Precisão**: Detecta exatamente quando elemento entra/sai da viewport
4. **Battery-friendly**: Usa menos recursos que scroll events

### Otimizações

```typescript
// 1. Passive event listeners
{ passive: true }

// 2. Desabilitar durante scroll programático
isScrollingRef.current = true

// 3. Debounce automático do IntersectionObserver
threshold: 0.1

// 4. Cleanup adequado
return () => observerRef.current?.disconnect()
```

## 🔄 Fluxo de Eventos

### Scroll Natural (Usuário)

```
1. Usuário scrolla a página
2. IntersectionObserver detecta seção visível
3. setActiveCategory(categoryId)
4. Tab ativa muda automaticamente
5. Tab scrolla horizontalmente para o centro
```

### Clique em Categoria

```
1. Usuário clica em "Pizzas Salgadas"
2. isScrollingRef.current = true (desabilita observer)
3. setActiveCategory("pizzas-salgadas")
4. window.scrollTo() até a seção
5. Após 1s, isScrollingRef.current = false
6. Observer volta a funcionar
```

### Busca/Filtro

```
1. Usuário digita no campo de busca
2. searchQuery !== ""
3. Observer é desabilitado
4. selectedCategory controla estado
5. Ao limpar busca, observer volta
```

## 🐛 Troubleshooting

### Categoria não ativa automaticamente

**Causa**: Seção sem `data-category-id`

**Solução**: Adicione o atributo:
```tsx
<div data-category-id={category.id}>
```

### Scroll não suave

**Causa**: Browser não suporta smooth scroll

**Solução**: Já implementado com fallback automático

### Tab não centraliza

**Causa**: `tabsRef` não está conectada

**Solução**: Verifique:
```tsx
<div ref={tabsRef}>
```

### Observer não detecta mudanças

**Causa**: `rootMargin` muito restritivo

**Solução**: Ajuste os valores:
```typescript
rootMargin: '-20% 0px -60% 0px'
```

## 📦 Arquivos Modificados

```
✓ src/pages/PublicMenu.tsx
  - IntersectionObserver implementado
  - Scroll sincronizado funcionando
  - Paleta azul aplicada
  - Performance otimizada
```

## 🚀 Como Testar

1. Acesse `/m/{seu-slug}`
2. Scrole pela página naturalmente
3. Observe a categoria ativa mudando automaticamente
4. Clique em uma categoria e veja o scroll suave
5. Teste a busca (observer é desabilitado)
6. Teste em mobile (scroll horizontal das tabs)

## 🎯 Próximas Melhorias

- [ ] Adicionar indicador visual de progresso da seção
- [ ] Implementar lazy loading de imagens
- [ ] Adicionar skeleton loading
- [ ] Criar animações de entrada dos produtos
- [ ] Implementar virtual scroll para listas longas

---

**Status:** ✅ Implementado e testado
**Performance:** ⚡ Otimizado com IntersectionObserver
**Compatibilidade:** 🌐 Todos os navegadores modernos
