---
name: Nexohub
description: Gerenciador de reuniões e congregação
colors:
  primary: "#ec7000"
  secondary: "#3a3f4d"
  neutral-bg: "#0c0c12"
  neutral-card: "#15161d"
  neutral-muted: "#1d1f28"
  neutral-muted-foreground: "#9aa1ad"
  neutral-border: "#242733"
  bank-ink: "#0c0c12"
  bank-card: "#15161d"
  bank-muted: "#1d1f28"
  bank-muted-foreground: "#9aa1ad"
  bank-border: "#242733"
  bank-orange: "#ec7000"
  bank-destructive: "#ff5d6c"
  light-primary: "#2563eb"
  light-secondary: "#7c3aed"
typography:
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1.05rem"
  xxl: "1.5rem"
  full: "9999px"
spacing:
  xs: "0.375rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.bank-orange}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    height: "2.5rem"
    padding: "0 1.25rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.bank-muted-foreground}"
    rounded: "{rounded.md}"
    height: "1.75rem"
  badge-destructive:
    backgroundColor: "rgb(255 93 108 / 0.1)"
    textColor: "{colors.bank-destructive}"
    rounded: "{rounded.full}"
  badge-outline:
    backgroundColor: "transparent"
    textColor: "{colors.bank-muted-foreground}"
    rounded: "{rounded.full}"
    height: "1.25rem"
  badge-privilege:
    backgroundColor: "{colors.bank-orange}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    height: "1.25rem"
  input-search:
    backgroundColor: "{colors.bank-card}"
    textColor: "{colors.bank-muted-foreground}"
    rounded: "{rounded.full}"
    height: "2.5rem"
    padding: "0 1.25rem 0 2.5rem"
  card-row:
    backgroundColor: "{colors.bank-card}"
    textColor: "#f5f6f8"
    rounded: "{rounded.xl}"
---

# Design System: Nexohub

## Overview

**Creative North Star: "O Balcão da Congregação"**

O produto inteiro é um banco digital para a congregação. O mundo Itaú — tinta `#0c0c12` + laranja `#ec7000` — foi **promovido ao `:root` global** e veste todo o app: auth (login, welcome, create-org), o shell da organização (sidebar, drawer, painel arredondado) e todas as páginas `/org/*` (overview, Pessoas, meeting-content, settings) e admin.

O painel arredondado (`rounded-3xl`, ring branco a 10%) é o "app dentro do app": envolve o conteúdo de todas as rotas `/org/*` via layout. Números usam `tabular-nums` e peso semibold para escanear como valores. Cards têm cantos generosos, ring sutis no lugar de sombras, e um único glow laranja no hero como momento de assinatura.

**Key Characteristics:**
- Mundo global escuro Itaú em todo o app (sem ilhas claras).
- Laranja `#ec7000` como único acento do mundo escuro.
- Profundidade por camadas tonais (card sobre ink, muted sobre card) + ring 1px, não por sombras duras.
- Números tabulares e pesos fortes para leitura de métricas/valores.
- Cantos: `rounded-3xl` no painel, `rounded-2xl` no hero/linhas, `rounded-full` em buscas e CTA.

## Colors

O `:root` carrega a **paleta Itaú escura** como padrão global — não há escopo claro reverso.

### Primary (global)
- **Laranja Itaú** (#ec7000): único acento do mundo escuro — CTAs, total do hero, sidebar ativa, ícones de destaque, ring de foco.

### Secondary (global)
- **Slate Escuro** (#3a3f4d): acento secundário sobre tinta — badges "Chefe", superfícies secundárias.

### Neutral (global, sobre tinta)
- **Tinta** (#0c0c12): fundo global do app.
- **Cartão Escuro** (#15161d): cards sobre a tinta.
- **Mist Escuro** (#1d1f28): células compactas e áreas muted.
- **Cinza Pálido** (#9aa1ad): texto secundário sobre fundo escuro (≥4.5:1).
- **Vermelho Saldo** (#ff5d6c): estados destrutivos (badge "Inativo", remoção) sobre fundo escuro.
- **Borda Escura** (#242733): hairlines sobre a tinta.

### Named Rules
**A Regra da Raridade Laranja.** No mundo escuro, o laranja `#ec7000` aparece em poucos pontos — CTA, total, glow do hero — e sua raridade é o que o faz parecer uma assinatura, não um tema.

**Trade-off de contraste (decisão de marca).** Texto branco sobre `#ec7000` mede ≈2.8:1 (abaixo do WCAG AA 4.5:1 para texto normal). Este é o laranja da marca Itaú, pinado pelo usuário, e o CTA é usado com weight semibold em tamanho `text-sm`+ com pill amplo. Registro aqui que é um compromisso consciente da identidade; se a acessibilidade estrita for exigida, escurece-se a superfície de texto para `#d35a00` (≈4.6:1) mantendo `#ec7000` para totais e glows.

**A Regra das Duas Ilhas.** O mundo escuro Itaú é o padrão global; a dashboard é uma ilha clara isolada por `.light-world`. Nenhum token do mundo escuro vaza para a ilha clara, e nenhum token claro vaza para o resto do app — cada um confinado ao seu escopo.

## Typography

**Display Font:** Geist (com fallback system-ui/sans-serif)
**Body Font:** Geist (com fallback system-ui/sans-serif)
**Label/Mono Font:** Nenhum — `tabular-nums` aplicado a valores numéricos.

**Character:** Geist é um sans geométrico neutro de propósito UI. Ele se comporta como a tipografia de um banco: clara, calma e sem personalidade própria — a personalidade vem do laranja e da hierarquia de números.

### Hierarchy
- **Display** (semibold 600, 3rem/5xl, leading 1.05, tracking -0.02em): o total de pessoas no hero, lido como saldo.
- **Headline** (semibold 600, 1.5rem/2xl, leading 1.25): títulos de página ("Pessoas").
- **Title** (semibold 600, 1.25rem/2xl, leading 1.25): valores das células de estatística.
- **Body** (regular 400, 0.875rem, leading 1.5): nomes, subtítulos, descrições.
- **Label** (medium 500, 0.75rem, tracking widder): rótulos de família. Rótulos de métricas secundárias usam `text-xs font-medium` sem uppercase, e o rótulo do hero total usa `text-sm text-muted-foreground`.

### Named Rules
**A Regra do Número Forte.** Valores numéricos usam semibold + `tabular-nums`; o número nunca compete com o acento — o peso carrega a hierarquia, não o gradiente.

## Layout

- Shell: grid `280px 1fr` com sidebar sticky; conteúdo em container `max-w-7xl` com padding `p-4 md:p-6`.
- O painel do org é um bloco `rounded-3xl` de tinta com `ring-1 ring-white/10`, vivendo no layout `/org/[slug]` e envolvendo o conteúdo de todas as rotas `*` (overview, Pessoas, meeting-content, settings) via `<main>`.
- Espaçamento vertical interno do painel: `space-y-6` (grupos) com `space-y-2` dentro das famílias; mais espaço acima do cabeçalho de grupo do que abaixo.
- Hero: grid de 1 coluna no mobile, células de estatística `grid-cols-2 → sm:grid-cols-3 → lg:grid-cols-5`.
- Busca: `max-w-md`, pill full.

## Elevation & Depth

O sistema é **plano por camadas tonais**: profundidade vem de stacking de superfícies (ink → card → muted) e de rings de 1px, não de sombras. A única sombra com offset real é o glow do CTA do hero (`shadow-lg shadow-primary/30`) e o halo do ícone de total (`shadow-lg shadow-primary/30`).

### Named Rules
**A Regra Flat-por-Default.** Superfícies são planas; um ring de 1px define a borda. Sombra aparece apenas como resposta de destaque no hero.

## Shapes

- Linguagem de cantos generosos: painel `rounded-3xl`, hero e linhas `rounded-2xl`, células `rounded-xl`, chips/busca/CTA `rounded-full`.
- Sem clipping, sem bordas coloridas laterais. Ring sutis `white/5`–`white/10` nas superfícies.
- Avatar de sexo: círculo cheio com ícone (MALE = `bg-primary/15 text-primary`, FEMALE = `bg-white/10`).

## Components

### Buttons
- **Shape:** `rounded-full` no CTA primário; `rounded-md` nos ghost de ação.
- **Primary (Nova pessoa):** laranja `#ec7000`, texto branco, `h-10 px-5`, hover `bg-primary/80`.
- **Ghost (editar/remover):** transparente, `text-muted-foreground`, hover `bg-white/10 text-foreground`; o de remover hover `bg-destructive/10 text-destructive`. Linhas de família em hover `bg-muted/30 ring-primary/40`.
- **Hover / Focus:** transição de cor 150ms; focus ring laranja no mundo escuro.

### Chips (badges)
- **Style:** pills `rounded-full h-5 text-xs` sobre o cartão da linha.
- **Inativo:** `bg-destructive/10 text-destructive`.
- **Jovem / Batizado / Casado(a):** `outline` (`border-border text-foreground`).
- **Priv. serviço:** sólido laranja (`bg-primary text-primary-foreground`) — o mais importante.
- **Chefe:** `secondary` (slate `#3a3f4d`).
- **Usuário vinculado:** `outline` com ícone de link e nome.

### Cards / Containers
- **Corner Style:** painel `rounded-3xl`, hero/linhas `rounded-2xl`, células `rounded-xl`.
- **Background:** card `#15161d` sobre ink `#0c0c12`.
- **Border:** `ring-1 ring-white/10` (linhas e células `white/10` e `white/5`).
- **Internal Padding:** `p-3 sm:p-4` (linhas), `p-5 sm:p-6` (hero).

### Inputs / Fields
- **Style:** pill `rounded-full`, `h-10`, fundo card, ícone de busca absoluto à esquerda.
- **Focus:** `border-ring`/`ring-primary/50` (laranja no mundo escuro).

### Navigation
- Shell global escuro com sidebar (links ativos `bg-primary text-primary-foreground`), shared por todas as rotas `/org/*`.
- SideNav interno (settings/meeting-content) e BottomNav mobile usam os mesmos tokens escuros.

### Hero "Saldo" (componente de assinatura)
- Card `rounded-2xl bg-card ring-white/10` com glow radial laranja no canto superior direito (`.bank-hero-glow`).
- Rótulo "Total de pessoas" em label uppercase; número em display semibold tabular.
- Ícone `FaUsers` em `rounded-2xl bg-primary` com sombra laranja.
- Células de estatística `rounded-xl bg-muted/40 p-3 ring-white/5`: ícone + rótulo truncado + valor `text-2xl tabular-nums`.

## Do's and Don'ts

### Do:
- **Do** usar `tabular-nums` + semibold em todo número que representa métrica.
- **Do** manter o laranja `#ec7000` como o acento único do mundo escuro global.
- **Do** definir superfícies com rings de 1px (`white/10`, `white/5`) em vez de sombras.
- **Do** manter i18n: todas as strings novas/alteradas via `t()` em pt.json/es.json.
- **Do** usar `rounded-full` para CTA e busca, `rounded-2xl`/`rounded-xl` para cards.

### Don't:
- **Don't** usar gradientes de texto para destaque — peso e tamanho bastam.
- **Don't** adicionar cores além do laranja no mundo escuro (sem verde/rosa/ciano como acentos).
- **Don't** usar sombras duras com offset zero como default — o sistema é flat com rings.
