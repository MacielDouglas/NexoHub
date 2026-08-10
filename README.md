<div align="center">

# Nexohub

**Gerenciador mobile-first de reuniões, pessoas e designações para congregações.**

Plataforma completa para planejar e acompanhar a vida congregacional: agenda de reuniões
(meio da semana e fim de semana), programações de partes, discursos, designações de
palco/som/vídeo/limpeza, cadastro de pessoas e famílias, e controle de acesso por
organização com papéis hierárquicos.

[Site](https://nexohub.vercel.app) · [Demo](https://nexohub.vercel.app/demo) · [Documentação](#-documentação) · [Contribuir](#-contribuir)

</div>

---

## 📌 Índice

- [Nexohub](#nexohub)
  - [📌 Índice](#-índice)
  - [🔭 Sobre o projeto](#-sobre-o-projeto)
    - [Como funciona](#como-funciona)
  - [✨ Funcionalidades](#-funcionalidades)
  - [🏗 Arquitetura](#-arquitetura)
  - [🧰 Stack](#-stack)
    - [Web (`apps/web`)](#web-appsweb)
    - [Mobile (`apps/mobile`)](#mobile-appsmobile)
  - [🗂 Estrutura do monorepo](#-estrutura-do-monorepo)
  - [🧬 Modelo de dados](#-modelo-de-dados)
  - [🚀 Primeiros passos](#-primeiros-passos)
    - [Pré-requisitos](#pré-requisitos)
    - [Instalação](#instalação)
    - [Web](#web)
    - [Mobile](#mobile)
  - [🔐 Variáveis de ambiente](#-variáveis-de-ambiente)
    - [Web (`apps/web/.env`)](#web-appswebenv)
    - [Mobile (`apps/mobile/.env`)](#mobile-appsmobileenv)
  - [🔑 Autenticação e RBAC](#-autenticação-e-rbac)
    - [Papéis globais](#papéis-globais)
    - [Papéis por organização](#papéis-por-organização)
  - [🌐 i18n](#-i18n)
  - [📏 Convenções de código](#-convenções-de-código)
  - [✅ Verificação](#-verificação)
  - [🛡 Segurança](#-segurança)
  - [❓ FAQ](#-faq)
  - [🤝 Contribuir](#-contribuir)
  - [📄 Licença](#-licença)

---

## 🔭 Sobre o projeto

O **Nexohub** nasce para resolver a organização de uma congregação em um único lugar:
substituir planilhas e listas manuais por um fluxo claro de cadastro, planejamento e
atribuição. O acesso é baseado em **organizações** (congregações), onde cada usuário tem
um papel com permissões granulares.

### Como funciona

1. **Login com Google** — o primeiro usuário a acessar o app assume o papel de
   `super_user` (administrador global) e pode criar sua congregação.
2. **Organizações** — cada congregação é um espaço isolado com seus próprios membros,
   reuniões e designações. Novos usuários entram por convite.
3. **Planejamento** — configure as reuniões (meio da semana / fim de semana), partes,
   horários, discursos e designações. A agenda semanal é gerada automaticamente.
4. **Execução** — acompanhe a visão geral da semana, próximos eventos e o histórico do
   mês, tudo em interface mobile-first com tema escuro.

> 💡 Quer conhecer o produto sem criar conta? Acesse a **[demo pública](https://nexohub.vercel.app/demo)**.

---

## ✨ Funcionalidades

| Área | Descrição |
| --- | --- |
| **Autenticação** | Login com Google OAuth (web e mobile), sessões seguras via Better Auth |
| **Organizações** | Multi-tenant com RBAC: `super_user`, `owner`, `admin`, `member` |
| **Reuniões** | Configuração de reuniões recorrentes: tipo, dia, horário, duração e partes ordenadas |
| **Programações** | Conteúdo das reuniões (meio da semana / fim de semana) com itens e temas |
| **Discursos** | Catálogo de discursos, atribuição a pessoas e acompanhamento de datas/notas |
| **Designações** | Som, vídeo, micro, palco, limpeza — com setores, programas e escala |
| **Pessoas & famílias** | Cadastro com dados congregacionais (batismo, privilégios), famílias e sub-organizações |
| **Visão geral** | Agenda semanal, próximos eventos e histórico do mês |
| **Demo pública** | `/demo` para explorar o produto sem autenticação |
| **i18n** | Português (padrão) e Espanhol, com detecção do idioma do dispositivo |
| **UI** | Mobile-first, tema escuro, animações suaves e Design System próprio |

---

## 🏗 Arquitetura

O Nexohub é um **monorepo** com aplicação web (Next.js) e aplicativo nativo (Expo), ambos
consumindo o mesmo backend REST exposto pela aplicação web.

```
┌────────────────────┐      ┌────────────────────┐
│   Web (Next.js)    │      │  Mobile (Expo)     │
│  App Router + API  │      │  React Native      │
└─────────┬──────────┘      └─────────┬──────────┘
          │            REST           │
          └────────────┬──────────────┘
                       ▼
              ┌────────────────────┐
              │  PostgreSQL        │
              │  Prisma ORM        │
              └────────────────────┘
```

- **Server-side**: páginas autenticadas são Server Components (App Router) que consultam o
  banco via Prisma e protegem dados com verificação de sessão e papel.
- **API REST**: rotas `/api/*` para operações de dados usadas pelos clientes.
- **Mobile**: aplicativo nativo Expo consumindo a mesma API.

---

## 🧰 Stack

### Web (`apps/web`)

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript (strict)
- **UI:** Tailwind CSS v4 · shadcn/ui · Radix UI · lucide-react
- **Dados:** Prisma ORM · PostgreSQL · migrations versionadas
- **Auth:** Better Auth · Google OAuth · RBAC por organização
- **i18n:** i18next · `pt` (padrão) e `es`
- **Qualidade:** Biome (lint + format) · `tsc --noEmit`
- **Deploy:** Vercel (configurado neste repositório)

### Mobile (`apps/mobile`)

- **Framework:** Expo SDK 57 · React Native 0.86 · Expo Router
- **Qualidade:** ESLint · `tsc --noEmit`

---

## 🗂 Estrutura do monorepo

```
nexohub/
├── apps/
│   ├── web/                  # Painel web + API (Next.js)
│   │   ├── prisma/           # Schema e migrations do banco
│   │   └── src/
│   │       ├── app/          # App Router (rotas, layouts, API)
│   │       ├── components/   # Componentes React (UI + feature)
│   │       ├── features/     # Lógica de domínio por feature
│   │       ├── i18n/         # Traduções (pt/es)
│   │       ├── lib/          # Bibliotecas e utilitários
│   │       └── generated/    # Tipos gerados pelo Prisma
│   └── mobile/               # Aplicativo nativo (Expo)
└── package.json              # Orquestração do monorepo (turbo)
```

---

## 🧬 Modelo de dados

Principais modelos em `apps/web/prisma/schema.prisma`:

| Modelo | Finalidade |
| --- | --- |
| `User`, `Session`, `Account`, `Verification` | Identidade e autenticação (Better Auth) |
| `Organization`, `Member`, `Invitation`, `InviteToken` | Multi-tenant, papéis e convites |
| `MeetingConfig`, `MeetingPart`, `Meeting`, `MeetingAssignment` | Configuração de reuniões |
| `MeetingContent`, `MeetingContentItem` | Conteúdo/programações das reuniões |
| `PersonTalk`, `TalkDate` | Discursos e datas |
| `CleaningConfig`, `CleaningSector`, `CleaningSchedule`, `CleaningAssignment` | Limpeza |
| `DesignationConfig`, `DesignationProgram`, `DesignationAssignment` | Designações |
| `SpecialEvent` | Eventos especiais |
| `Family`, `Person`, `SubOrganization`, `SubOrgPerson`, `SubOrgPersonTalk` | Pessoas e grupos |

---

## 🚀 Primeiros passos

### Pré-requisitos

- [Bun](https://bun.com) ≥ 1.x
- Node.js ≥ 20
- PostgreSQL (local ou hospedado)

### Instalação

```bash
# Clonar e instalar dependências (na raiz do monorepo)
git clone https://github.com/MacielDouglas/NexoHub.git
cd nexohub
bun install
```

### Web

```bash
cd apps/web

# Copiar variáveis de ambiente
cp .env.example .env

# Aplicar migrations e iniciar
bunx prisma migrate deploy
bun run dev   # http://localhost:3000
```

> O fluxo OAuth do Google exige que as URLs de redirecionamento autorizadas estejam
> cadastradas no Google Cloud Console (ex.: `http://localhost:3000/api/auth/callback/google`).

### Mobile

```bash
cd apps/mobile
cp .env.example .env
bunx expo start   # escolha iOS, Android ou web
```

---

## 🔐 Variáveis de ambiente

### Web (`apps/web/.env`)

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Connection string do PostgreSQL |
| `BETTER_AUTH_SECRET` | ✅ | Segredo usado para assinar sessões |
| `BETTER_AUTH_URL` | ✅ | URL pública do painel web |
| `GOOGLE_CLIENT_ID` | ✅ | Client ID OAuth do Google |
| `GOOGLE_CLIENT_SECRET` | ✅ | Client Secret OAuth do Google |
| `NEXT_PUBLIC_APP_URL` | ⬜ | URL pública usada em metadata/sitemap (fallback: `https://nexohub.vercel.app`) |

### Mobile (`apps/mobile/.env`)

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | ✅ | URL da API (ex.: `http://localhost:3000`) |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | ✅ | Client ID OAuth do Google usado no login |

---

## 🔑 Autenticação e RBAC

O controle de acesso é feito pelo **Better Auth** com o provedor **Google OAuth**.

### Papéis globais

- **`super_user`** — administrador global; primeiro usuário a acessar. Acessa `/admin`.

### Papéis por organização

- **`owner`** — proprietário da congregação; cria a organização e gerencia tudo.
- **`admin`** — administra membros, reuniões, discursos e designações.
- **`member`** — visualiza sua agenda e informações da congregação.

As permissões são verificadas tanto nas páginas (server-side) quanto nas rotas de API,
mantendo os dados isolados por organização (multi-tenant).

---

## 🌐 i18n

- Textos centralizados em `apps/web/src/i18n/locales/{pt,es}.json` — **sem strings hardcoded**.
- Idioma padrão: **Português (Brasil)**; detecção automática do idioma do dispositivo.
- O usuário pode alternar o idioma no login e no app; a preferência é persistida por usuário.

---

## 📏 Convenções de código

- TypeScript em **modo estrito** (`strict: true`).
- Formatação e lint via **Biome** (web) e **ESLint** (mobile).
- Migrations versionadas em `apps/web/prisma/migrations`.
- Componentes: shadcn/ui em `src/components/ui/`; features em `src/features/`.
- Server Components para páginas autenticadas; `"use client"` apenas onde há interatividade.
- Acessibilidade: alvos de toque ≥ 44px (`touch-target`), ARIA labels e foco visível.

---

## ✅ Verificação

```bash
# Web — formatação + lint (Biome) + typecheck (tsc)
cd apps/web && bun run verify

# Mobile — typecheck + lint
cd apps/mobile && bunx tsc --noEmit && bunx expo lint
```

---

## 🛡 Segurança

- Arquivos `.env` e variantes são ignorados pelo `.gitignore`; `!*.env.example` documenta as variáveis.
- Nunca commite segredos ou dados de produção.
- Headers de segurança aplicados no `next.config.ts`: **CSP**, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `Permissions-Policy`.
- Rotas autenticadas usam `robots: noindex` (e `/robots.txt` bloqueia `/org`, `/admin`, `/api`).
- Rate limiting aplicado a rotas sensíveis de API.

---

## ❓ FAQ

**Preciso de um banco PostgreSQL?**
Sim. Local (via Docker ou nativo) ou hospedado (Neon, Supabase, Vercel Postgres).

**Como o primeiro usuário vira `super_user`?**
O primeiro cadastro com sucesso assume esse papel automaticamente e pode criar a
congregação (tornando-se `owner` da organização).

**Posso usar sem cadastro?**
Sim, a [demo pública](https://nexohub.vercel.app/demo) permite explorar o produto.

---

## 🤝 Contribuir

1. Fork o projeto.
2. Crie uma branch: `git checkout -b feat/minha-feature`.
3. Faça suas alterações seguindo as [convenções](#-convenções-de-código).
4. Rode a [verificação](#-verificação) e garanta que passe.
5. Envie um Pull Request.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo `LICENSE` para mais detalhes.

---

<div align="center">

Feito por [Douglas Maciel](https://github.com/MacielDouglas) com 💙.

</div>
