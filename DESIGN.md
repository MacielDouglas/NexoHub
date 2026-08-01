---
name: Nexohub
description: Gerenciador de reuniões e escalas para congregações das Testemunhas de Jeová
colors:
  primary: "#2563EB"
  secondary: "#7C3AED"
  background: "#f8fafd"
  surface: "#ffffff"
  surface-selected: "#f1f5fb"
  text: "#1F2937"
  text-secondary: "#64748B"
  border: "#e5eaf2"
  danger: "#DC2626"
  success: "#16A34A"
  warning: "#D97706"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: "52px"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "44px"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "28px"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "24px"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  xxl: "18px"
spacing:
  half: "2px"
  one: "4px"
  two: "8px"
  three: "16px"
  four: "24px"
  five: "32px"
  six: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "32px"
    opacity: 0.85
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "32px"
    border: "1px solid {colors.border}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "4px 10px"
    height: "32px"
    border: "1px solid {colors.border}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "16px"
    border: "1px solid rgba(15,23,42,0.08)"
---

# Design System: Nexohub

## Overview

**Creative North Star: "A Sala do Reino Digital"**

O Nexohub se apresenta como o quadro de avisos da congregação digitalizado: organizado, sereno e digno de confiança. A metáfora governa tudo — é um lugar onde anciãos consultam o que vem a seguir na semana, conferem escalas e encontram a programação oficial da reunião sem esforço. Não é um dashboard frio de empresa; é um espaço institucional calmo que trata a informação da congregação com o respeito que ela merece.

A superfície é clara (`#f8fafd`), os cards são brancos (`#ffffff`) em camadas tonais, e uma única cor de ação — o **Azul Congregacional** (`#2563EB`) — guia o olho para "o que fazer agora". O **Roxo Cerimonial** (`#7C3AED`) reserva-se para o sagrado e o administrativo: o header do login, o badge de acesso admin. A densidade é alta mas sem ruído: listas, cards compactos e navegação por abas nativas mantêm cada tela escaneável em segundos.

A tipografia é Geist no web (sistema nos apps nativos), pesos médios (500–700), quase sem versaletes. A atmosfera é de **clareza institucional**: cada elemento existe para responder a uma pergunta do ancião — quando é a próxima reunião, quem é o membro, o que está programado.

**Key Characteristics:**
- Um acento de ação (azul) + um acento cerimonial (roxo); todo o resto é neutro.
- Camadas tonais claras com sombra azulada reservada a um único destaque (o hero "próxima reunião").
- Cards brancos de cantos generosos (10–18px) separados por ritmo de 8/16px.
- Botões compactos (32px) e inputs da mesma altura — aparato operacional discreto.
- Navegação nativa por abas no mobile; links de texto no web, sempre com o item ativo em azul.
- Dark mode apenas no web; o mobile é um tema claro único.

## Colors

A paleta é de clareza operacional: um azul de ação, um roxo cerimonial, e uma família neutra fria com leve matiz azulado que mantém a calma institucional.

### Primary
- **Azul Congregacional** (#2563EB): a única cor de ação. Botões primários, links, números e destaques de item, o item ativo da navegação, o texto de "editar/ver". É o tom de "o que você deve fazer a seguir".
- **Azul Congregacional / 85%** (hover): o mesmo azul com 85% de opacidade em hover, mais calmo que um escurecimento.

### Secondary
- **Roxo Cerimonial** (#7C3AED): reservado ao cerimonial e administrativo — header do login, badge de super-user no web, acentos da marca. Nunca compete com o azul na mesma tela.

### Neutral
- **Fundo da Sala** (#f8fafd): o background global. Branco quase-puro com matiz azulado que evita o cinza frio.
- **Superfície** (#ffffff): cards, painéis, nav. É o nível acima do fundo.
- **Superfície Selecionada** (#f1f5fb): aba ativa dos tabs e áreas de seleção — um passo entre o card e o fundo.
- **Tinta** (#1F2937): texto principal e títulos.
- **Tinta Secundária** (#64748B): metadados, descrições, datas, legendas.
- **Divisa** (#e5eaf2): bordas de inputs, separadores, ring de cards. Leve, nunca escura.
- **Sinal Vermelho** (#DC2626): erro, exclusão, perigo — sempre em textos de ação destrutiva ou mensagens.
- **Sinal Verde** (#16A34A): confirmação/sucesso (mobile).
- **Sinal Âmbar** (#D97706): aviso (mobile).

### Named Rules
**A Regra do Acento Único.** O azul aparece em no máximo uma ação por contexto — nunca dois botões primários na mesma área de ação. Sua raridade é o que o torna direcional.

**A Regra do Roxo Cerimonial.** Roxo é para o sagrado e o institucional (login, admin). Em telas de trabalho ele não aparece; dezenas de acentos roxos matariam a hierarquia que o azul constrói.

## Typography

**Display Font:** Geist (web) / system-ui (mobile) — com fallback `system-ui, sans-serif`
**Body Font:** Geist (web) / system-ui (mobile)
**Label/Mono Font:** Geist Mono (web), ui-monospace (mobile) — apenas para código/valores técnicos

**Character:** A tipografia é utilitária e confiante: pesos médios (500) para corpo, 600–700 para títulos, quase sem caixa-alta. Nada de display exuberante — a informação da congregação fala por si.

### Hierarchy
- **Display** (600, 48px, 52px): somente a marca ("Nexohub") na tela de login.
- **Headline** (600, 32px, 44px): subtítulos de seção no login e o número de estatística no dashboard (24px no card).
- **Title** (600, 18px, 28px): títulos de card, nomes de membros, tipos de reunião.
- **Body** (500, 16px, 24px): conteúdo padrão, listas, labels de item.
- **Label** (500, 14px, 20px): metadados, descrições, botões de texto, data/hora.
- **Micro** (500, 11–12px): notas de rodapé e metadados de eventos (mobile).

### Named Rules
**A Regra do Peso de Tarefa.** Corpo nunca abaixo de 500; títulos nunca acima de 700. O peso carrega hierarquia, não o tamanho.

## Layout

O conteúdo vive em uma coluna central com largura máxima de 800px (`MaxContentWidth`), tanto no web quanto no mobile — no web `max-w-5xl`, no mobile um container centralizado com `justify-content: center`.

O ritmo é uma escala de 4px: `half=2, one=4, two=8, three=16, four=24, five=32, six=64`. A densidade operacional usa 8px para gaps internos de card (`Spacing.two`) e 16px entre cards (`Spacing.three`). Títulos de seção usam 16px de margem inferior; seções grandes separam por 24px.

No mobile, o conteúdo respeita as safe areas do sistema e o inset do bottom tab (`BottomTabInset`: 50 iOS, 80 Android). No dashboard, uma grelha de estatísticas de 3 colunas (`flexDirection: row`) quebra em cards empilhados; listas de reunião são linhas com rótulo à direita.

## Elevation & Depth

O sistema usa **camadas tonais** como profundidade principal e **sombra como exceção cerimonial**. Em repouso, a hierarquia vem do tom (fundo claro → card branco → seleção `#f1f5fb`), nunca de sombras.

### Shadow Vocabulary
- **Sombras de Destaque** (`shadowColor: #2563EB, offset 0 6, opacity 0.30, radius 12, elevation 6`): aplicadas ao hero card "próxima reunião" e ao botão primário do login. A sombra é **azulada** — ela prolonga o acento, não cria profundidade neutra.
- **Logo** (`shadowColor: #000, offset 0 6, opacity 0.30, radius 12, elevation 8`): exclusiva do logotipo no login.

### Named Rules
**A Regra da Sombra Cerimonial.** Sombras aparecem apenas onde a marca precisa se destacar (hero, login, logo). Em telas de trabalho, superfícies são planas; a profundidade é tonal.

## Shapes

A linguagem de formas é **suavemente arredondada e consistente**: cada nível de elevação tem seu próprio raio. Cards usam 10px (web `rounded-xl`) a 18px (`rounded-2xl`); em mobile, cards usam 16px (`Spacing.three`), com o hero card em 24px (`Spacing.four`).

- **Botões:** 8px (`rounded-md` / `Spacing.two`).
- **Inputs:** 8px, mesma altura dos botões (32px).
- **Cards padrão:** 10–18px, dependendo do nível de destaque.
- **Hero card:** 24px — o único card com raio máximo e sombra.
- **Header do login:** 32px nos cantos inferiores — a maior forma do sistema, transmitindo o espaço cerimonial.
- **Logotipo:** 24px de raio em um quadrado de 80px.

Bordas são sempre leves (`#e5eaf2` ou `ring-foreground/10`); o sistema nunca recorre a contornos fortes ou cortes agudos.

## Components

### Buttons
- **Shape:** cantos suavemente arredondados (8px), compactos.
- **Primary:** fundo Azul Congregacional, texto branco, altura 32px, padding 8×12px. Hover: 85% de opacidade. Usado para a ação principal de cada tela (importar, salvar, entrar, adicionar item).
- **Hover / Focus:** transição de opacidade `transition-opacity`; foco com ring azul (`focus-visible:ring-ring/50`). No mobile, `opacity 0.7–0.8` quando pressionado.
- **Outline / Secondary:** fundo claro, borda de input, texto normal — para ações secundárias (criar vazio, assinar saída).
- **Destructive / Ghost:** o destrutivo é texto vermelho sobre fundo claro; o ghost é apenas texto que ganha fundo muted no hover.
- **Link:** texto azul com underline no hover, para ações inline (editar, ver, excluir).

### Cards / Containers
- **Corner Style:** cantos generosos — 10px (web), 16px (mobile), 24px (hero).
- **Background:** branco (`#ffffff`) sobre fundo `#f8fafd`; áreas internas usam `bg-muted/50` (web) ou `background` (mobile).
- **Shadow Strategy:** planos por padrão (ver Elevation); apenas o hero usa sombra azulada.
- **Border:** ring de 1px `foreground/10` no web; nenhuma borda no mobile.
- **Internal Padding:** 16px padrão; cards compactos 8–12px.

### Inputs / Fields
- **Style:** sem fundo próprio (transparente sobre o card), borda 1px `#e5eaf2`, raio 8px, altura 32px.
- **Focus:** borda azul + ring de foco azul translúcido (`focus-visible:border-ring ring-3 ring-ring/50`).
- **Error / Disabled:** borda/ring vermelha em `aria-invalid`; desabilitado a 50% de opacidade com fundo muted.

### Navigation
- **Mobile:** bottom tabs nativas (Expo NativeTabs) com 4 destinos — Início, Membros, Conteúdo, Ajustes — ícones PNG template monocolor e label, item ativo em azul.
- **Web:** links de texto no topo; o item ativo em Azul Congregacional com `font-medium`, os demais em cinza secundário que escurece no hover.

## Do's and Don'ts

### Do:
- **Do** usar o Azul Congregacional para uma única ação primária por área; o resto fica outline ou ghost.
- **Do** manter os cards planos em telas de trabalho; a sombra azulada é só para o hero e o login.
- **Do** usar a escala de espaçamento de 4px (8/16/24) para manter o ritmo consistente.
- **Do** dar ao item de navegação ativo o azul primário — é o único indicador de estado da nav.
- **Do** usar o roxo apenas em superfícies cerimoniais/institucionais (login, admin).

### Don't:
- **Don't** empilhar dois botões primários na mesma área de ação.
- **Don't** adicionar sombras genéricas pretas em cards de lista; use tom de fundo para hierarquia.
- **Don't** introduzir uma segunda cor de ação no conteúdo de trabalho — o roxo não compete com o azul em telas operacionais.
- **Don't** quebrar o raio de 8px nos controles de formulário; a consistência das formas é o que dá a calma institucional.
- **Don't** usar caixa-alta para títulos ou labels — a hierarquia vem de peso e tamanho, não de versalete.
