# Nexohub

Plataforma mobile-first para organizar reuniões, pessoas e designações: cadastro de participantes, definição de programações de reunião (configurações, partes e horários) e atribuição de responsáveis. Dividido em um aplicativo nativo (Expo) e um painel web (Next.js), com autenticação, grupos com papéis e suporte multilíngue (PT-BR e ES).

## Estrutura do monorepo

| Diretório | Descrição |
| --- | --- |
| `apps/web` | Painel web e API. Next.js (App Router), Prisma + PostgreSQL, Better Auth |
| `apps/mobile` | Aplicativo nativo. Expo SDK 57, Expo Router |
| `apps/jwpub` | Utilitário e arquivo de exemplo para importação de programação de reuniões (`.jwpub`) |

## Stack

- **Web:** Next.js 16 · React 19 · Tailwind CSS v4 · TypeScript (strict) · Biome
- **Mobile:** Expo SDK 57 · React Native 0.86 · Expo Router
- **Banco:** PostgreSQL · Prisma com migrations versionadas
- **Auth:** Better Auth · Google OAuth · organizações com RBAC (`owner`, `admin`, `member`) · access control
- **i18n:** i18next · `pt` (padrão) e `es` · detecção de idioma do dispositivo

## Funcionalidades

- Login com conta Google (web e mobile)
- O primeiro usuário cadastrado assume o papel de `super_user`; os demais entram por convite para uma organização
- Autorização com papéis e permissões granulares por organização
- Configuração de reuniões recorrentes: tipo, dia da semana, horário, duração e partes ordenadas
- API REST de configurações de reunião e partes (`/api/meeting-configs`, `/api/meeting-parts`, ...)
- Preferência de idioma por usuário, persistida e sincronizada entre sessões
- UI mobile-first com tema claro/escuro e telas de Início, Explorar e Configurações

## Modelo de dados

Modelos principais em `apps/web/prisma/schema.prisma`: `User`, `Session`, `Account`, `Verification`, `Organization`, `Member`, `Invitation`, `MeetingConfig`, `MeetingPart`.

## Primeiros passos

Pré-requisitos: [Bun](https://bun.com) ≥ 1.x, Node.js ≥ 20 e um banco PostgreSQL.

```bash
bun install
```

### Web

```bash
cd apps/web
bunx prisma migrate deploy
bun run dev   # http://localhost:3000
```

Crie um arquivo `apps/web/.env` com as variáveis abaixo:

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | Connection string do PostgreSQL |
| `BETTER_AUTH_SECRET` | Segredo usado para assinar sessões |
| `BETTER_AUTH_URL` | URL pública do painel web |
| `GOOGLE_CLIENT_ID` | Credenciais OAuth do Google |
| `GOOGLE_CLIENT_SECRET` | Credenciais OAuth do Google |

O fluxo OAuth do Google exige que as URLs de redirecionamento autorizadas estejam configuradas no Google Cloud Console.

### Mobile

```bash
cd apps/mobile
bunx expo start   # escolha iOS, Android ou web
```

Crie um arquivo `apps/mobile/.env` com as variáveis abaixo:

| Variável | Descrição |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | URL da API (ex.: `http://localhost:3000`) |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Client ID OAuth do Google usado no login |

### Verificação

```bash
# Web — lint (Biome) + typecheck (tsc)
cd apps/web && bun run check

# Mobile — typecheck + lint
cd apps/mobile && bunx tsc --noEmit && bunx expo lint
```

## Convenções

- TypeScript em modo estrito
- Formatação e lint via Biome (web) e ESLint (mobile)
- Migrations de banco versionadas em `apps/web/prisma/migrations`
- Texto da UI centralizado em `apps/*/src/i18n/locales/{pt,es}.json`, sem strings hardcoded

## Segurança

- Arquivos `.env` e variantes são ignorados pelo `.gitignore`; referencie `.env.example` para documentar novas variáveis
- Nunca commite segredos ou dados de produção
