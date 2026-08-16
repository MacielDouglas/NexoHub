---
name: Nexohub
description: Gerenciador de reuniões e escalas para congregações das Testemunhas de Jeová
colors:
  brand: "#ff6828"
  brand-foreground: "#2a1405"
  brand-muted: "#8a6a55"
  background-light: "#faf8f5"
  background-dark: "#161310"
  surface-elevated-light: "#ffffff"
  surface-elevated-dark: "#1d1a16"
  surface-subtle-light: "#e8e3db"
  surface-subtle-dark: "#23201b"
  border-light: "#e5ded3"
  border-dark: "rgb(255 255 255 / 0.12)"
  map-default: "#ef4444"
  map-selected: "#3b82f6"
  map-confirmed: "#22c55e"
  map-suggested: "#eab308"
  map-cancelled: "#9ca3af"
typography:
  display:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1.1
  title:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1
  micro:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.333
  mono:
    fontFamily: "Inconsolata, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  md: "0.625rem"
  lg: "0.75rem"
  xl: "1rem"
  2xl: "1.25rem"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-destructive:
    backgroundColor: "#d93535"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.brand-foreground}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  chip-status:
    backgroundColor: "#eee9e1"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  card-surface:
    backgroundColor: "{colors.surface-elevated-light}"
    rounded: "{rounded.xl}"
    padding: "16px"
  card-surface-dark:
    backgroundColor: "{colors.surface-elevated-dark}"
    rounded: "{rounded.xl}"
    padding: "16px"
---

# Design System: Nexohub

> **STATUS:** redesign concluído. Este documento descreve o **novo** mundo visual — paleta centrada em `#ff6828`, tema claro/escuro com neutros quentes e suporte i18n pt/es. Referências históricas ao sistema incumbente foram removidas.

## Overview

App **mobile-first** com estética de banco digital moderno (referência Nubank): superfícies planas e limpas, acento laranja vibrante como ação primária, muita respiração e tipografia clara (referência estapar.com.br). O alvo base é ~420 dpi (iPhone, Moto G, Galaxy S), com escalada confortável até desktop full-HD via breakpoints progressivos.

O laranja `#ff6828` é a cor de marca e de **ação primária** (botões principais, tab ativa, dia de hoje, badge do tipo). O tema claro usa fundo off-white quente (`#faf8f5`) e o escuro um quase-preto quente (`#161310`). Toda a UI é bilíngue (pt-BR / es) via dicionários em `lib/i18n`.

**Key Characteristics:**
- Acento laranja `#ff6828` como cor de ação, não de decoração — mas pintado com confiança nos pontos de conversão (botões, tab ativa, toggle).
- Neutros quentes (off-white / quase-preto), nunca cinza-azulado frio.
- Cards `rounded-2xl` com borda quente e `shadow-xs`; radius base `0.875rem`.
- Header claro com blur (`bg-background/80 backdrop-blur-md`), sem moldura escura fixa.
- Bottom tab bar fixa no mobile (`md:hidden`) com 5 rotas + i18n.
- Tipografia Outfit (única família de UI; mono Inconsolata só para dados técnicos).
- Fonte de inputs ≥ `16px` (anti-zoom iOS).
- Semântica de mapa preservada: vermelho padrão/pendente, azul seleção, verde confirmado, amarelo sugerido, cinza cancelado.

## Colors

Paleta dual-theme com neutros quentes e um acento de marca que também é a ação primária.

### Primary
- **Laranja Direcciones** (`#ff6828`): marca + ação primária. Usado em botões `default`, foco (`--ring`), tab bar ativa, dia "hoje" no calendário, badge de tipo, item admin do menu. **Foreground** em laranja é sempre `#2a1405` (marrom-escuro de alto contraste) — nunca `text-white`.

### Neutral
- **Off-white** (`#faf8f5`): fundo claro de página (`--background`).
- **Quase-preto quente** (`#161310`): fundo escuro de página.
- **Card claro** (`#ffffff`) / **Card escuro** (`#1f1b17`): superfícies elevadas.
- **Borda quente**: `#e5ded3` (claro) / `rgb(255 255 255 / 0.12)` (escuro).
- **Muted**: `#eee9e1` (claro) / `#2a2620` (escuro); texto `--muted-foreground` `#6b6357` / `#a49a8d`.
- **Destrutivo**: `#d93535` (claro) / `#f05b5b` (escuro).

### Named Rules
**The Warm Neutral Rule.** Fundos e bordas usam neutros quentes (amarelados/marrom-sujo), nunca cinzas frios ou azulados.

**The Orange Action Rule.** `#ff6828` é reservado para ações e estados ativos. Texto sobre laranja usa `--color-brand-foreground` (`#2a1405`); `text-white` sobre laranja é proibido por baixo contraste.

## Typography

**UI Font:** Outfit (pesos 400 / 500 / 600 / 700; fallback: ui-sans-serif, system-ui).
**Mono Font:** Inconsolata (fallback: ui-monospace) — apenas dados técnicos.

**Character:** sans geométrica amigável e neutra, com títulos em peso 600/700 e tracking levemente apertado (`tracking-tight`) para a leitura de títulos; corpo em 400.

### Hierarchy
- **Display** (600, 3rem, 1.1): títulos hero; logo do login.
- **Title** (600, 1.5rem, 1.25): títulos de página (`text-2xl font-semibold tracking-tight`).
- **Heading** (600/700, 1.25rem, 1.25): subtítulos e cabeçalhos de card.
- **Body** (400, 1rem, 1.5): texto principal.
- **Label** (500, 0.875rem, 1): rótulos de campo; tab bar em `text-xs`.
- **Micro** (500, 0.625rem, 1.333): micro-rótulos de resumo e rótulos de estado em caixa alta com `tracking-widest` (ex.: hero de saldo, agrupadores de filtro).
- **Mono** (400, 1rem, 1.5): dados técnicos.

## Layout

Mobile-first. Conteúdo centralizado em `max-w-5xl` (listagens) ou `max-w-md` (telas centrais), padding lateral `px-4` no mobile crescendo para `sm:px-6`/`lg:px-8`. Grids de listagem 1 coluna no mobile → 2+ em `sm`. Header `h-16` (mobile) → `h-20` (desktop). Respeita `safe-area-insets` (`env(safe-area-inset-*)`) em elementos fixos (bottom tab bar, drawer, footer).

Espaçamento rítmico base: `gap-4`/`space-y-4` entre blocos; cards internos `p-4`.

## Elevation & Depth

Sistema predominantemente plano; profundidade vem do contraste de superfícies e de sombras leves de estado.

### Shadow Vocabulary
- **Ambient-weak** (`shadow-xs`): repouso de cards e containers.
- **Hover** (`hover:shadow-md`): elevação no hover de cards interativos.
- **Drawer / Modal** (`shadow-2xl`): camadas flutuantes.
- **Marker** (`box-shadow: 0 2px 6px rgba(0,0,0,0.3)`): pins do mapa.

**The Flat-By-Default Rule.** Superfícies são planas em repouso; sombra aparece como resposta de estado (hover) ou em camadas flutuantes, nunca como decoração permanente.

## Shapes

Cantos generosos: radius base `0.875rem` (`--radius`). Botões e controles `rounded-md`, cards `rounded-2xl`, chips/badges/pills `rounded-full`. Pins do mapa são circulares (`border-radius: 50%`) com borda branca de 2px. Botões de destaque de entrada (login) usam `rounded-full` estilo app bancário.

## Components

### Buttons
- **Shape:** `rounded-md`, altura `h-9` (padrão); `rounded-full` nos CTAs de alta ênfase (login).
- **Primary (default):** `bg-primary text-primary-foreground` — laranja `#ff6828` com texto `#2a1405` (`hover:bg-primary/90`).
- **Destructive:** vermelho `--destructive`, texto branco.
- **Outline / Secondary / Ghost:** variantes utilitárias shadcn.
- **Focus:** `focus-visible:ring-[3px] focus-visible:ring-ring/50`.

### Chips / Badges
- **Style:** pílula `rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium`; variantes semânticas (verde confirmado/ativo, vermelho pendente/erro, âmbar sugerido).
- **State:** toggle ativo = `border-brand bg-brand text-brand-foreground shadow-md`.

### Cards / Containers
- **Corner Style:** `rounded-2xl` (1.25rem) padrão.
- **Background:** `bg-card` (`#ffffff` / `#1f1b17` no escuro).
- **Shadow Strategy:** `shadow-xs` repouso, `hover:shadow-md`; ver Elevation.
- **Border:** `border` com `--border` (quente).
- **Internal Padding:** `p-4` (16px) padrão.

### Inputs / Fields
- **Style:** `h-9 rounded-md border border-input bg-transparent px-3 py-1 shadow-xs`; fonte `16px` (anti-zoom iOS).
- **Focus:** ring laranja (`focus-visible:ring-ring/50`).
- **Error / Disabled:** `aria-invalid:border-destructive`; disabled com `opacity-50`.

### Navigation
- **Desktop header:** `bg-background/80 backdrop-blur-md`, logo "Direcciones" sem moldura, LanguageSelector + toggle de tema + botão de menu.
- **Mobile:** drawer deslizante (superfícies do tema) com itens `rounded-2xl`, LanguageSelector e LogoutButton; haptic + overlay `bg-black/60 backdrop-blur-sm`.
- **Bottom tab bar (mobile):** fixa na base, `bg-background/95 backdrop-blur-md`, 5 itens (home, my-cards, addresses, agenda, user); ativo `text-brand` com ícone `scale-110`.
- **Home menu:** tiles grandes `rounded-2xl p-4 pl-6 shadow-xs`; item admin em `bg-brand text-brand-foreground`, demais em `bg-card`.

### Signature Component — Card visual de endereço
Link-imagem em `aspect-video` com overlay gradiente `from-black/85 via-black/35 to-black/5`, tipo no canto superior em badge `bg-black/60 backdrop-blur-sm`, nome em `text-white` e endereço com `MapPin` em `text-white/90`, badges de status (confirmada/ativa). Hover: `scale-105` na imagem + overlay escurece.

## Do's and Don'ts

### Do:
- **Do** usar `#ff6828` como ação primária (botões default, tab ativa, toggle) e foco (`--ring`).
- **Do** usar `text-brand-foreground` (`#2a1405`) sobre laranja — nunca `text-white`.
- **Do** manter neutros quentes em fundos e bordas (Warm Neutral Rule).
- **Do** usar `rounded-2xl` para cards e `rounded-full` para chips/pins.
- **Do** usar `shadow-xs` em repouso e `hover:shadow-md` em interação.
- **Do** aplicar `font-size: 16px` em inputs para evitar zoom no iOS.
- **Do** respeitar safe-area-insets em elementos fixos.
- **Do** manter header claro/blur sem moldura escura fixa.

### Don't:
- **Don't** usar `text-white` sobre fundo laranja (contraste insuficiente).
- **Don't** usar o shell escuro `#0c232a` como moldura fixa de header/footer.
- **Don't** usar neutros frios/azulados em superfícies e bordas.
- **Don't** remover o ring de foco (`ring-[3px]`) dos controles.
- **Don't** usar sombras pesadas em repouso — profundidade vem de contraste de superfícies.
- **Don't** misturar texto espanhol e português na mesma UI — sempre via dicionários i18n.
