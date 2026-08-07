# Nexohub — Web

Painel web e API do Nexohub: plataforma mobile-first para organizar reuniões, pessoas e designações de uma congregação. Aqui você gerencia o cadastro de participantes, configura e edita os programas de reunião, gera automaticamente as designações das reuniões e da limpeza (com rotação entre os irmãos) e emite PDFs prontos para impressão. Suporte multilíngue (PT-BR e ES).

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict)
- **UI:** Tailwind CSS v4 · componentes `shadcn` (`src/components/ui`) · tema claro/escuro
- **Banco:** PostgreSQL · Prisma 7 com migrations versionadas · cliente gerado em `src/generated/prisma`
- **Auth:** Better Auth · login Google · organizações com RBAC (`owner`, `admin`, `member`) · convites por código/token
- **i18n:** i18next + react-i18next · `pt` (padrão) e `es` · idioma persistido por usuário
- **Qualidade:** Biome (format/lint) · Zod (validação) · `tsc --noEmit`
- **Extras:** jsPDF + jspdf-autotable (geração de PDF) · react-day-picker (calendários) · sonner (toasts)

## Estrutura do projeto

| Diretório | Descrição |
| --- | --- |
| `src/app` | Rotas do App Router: páginas (`/org/[slug]/...`) e API routes (`/api/...`) |
| `src/features` | Clientes de UI por módulo: `meetings`, `people`, `cleaning`, `designacoes`, `discursos`, `sub-org`, `meeting-content`, `settings` |
| `src/lib` | Lógica de domínio: motores de designação e limpeza, validação, schemas Zod, helpers de data, `auth.ts`, `prisma.ts` |
| `src/components` | Componentes compartilhados e `ui/` (shadcn) |
| `src/i18n/locales` | Traduções `pt.json` e `es.json` (sem strings hardcoded) |
| `src/generated/prisma` | Prisma Client gerado |
| `prisma/migrations` | Migrations versionadas do banco |

## Funcionalidades

- **Autenticação e organizações:** login com Google; a primeira conta de uma organização assume o papel de `owner`; convites por e-mail e por código (`/api/tokens/redeem`); múltiplas organizações por usuário
- **Pessoas e famílias:** cadastro com sexo, estado ativo, jovem/batizado, família e privilégios de serviço e de designação (som, vídeo, palco, microfone volante, indicador, leituras, discursos, oração, etc.); associação opcional a uma conta de usuário
- **Reuniões:** configurações recorrentes (meio de semana e fim de semana — dia, horário, partes ordenadas), programa semanal editável com designações, eventos especiais (congresso, assembleia, visita do superintendente, memorial) e PDF colorido do programa por intervalo de datas
- **Designações das reuniões:** geração automática com rotação (quem foi designado há mais tempo é priorizado), respeitando privilégios e restrições por cargo (dirigente/presidente e condutor/leitor não acumulam funções conflitantes no mesmo dia); período escolhido em calendário; setores ativáveis/desativáveis por programa (som, vídeo, palco, microfone volante, indicador); setor por indicador; semanas de eventos especiais e dias já ocupados são ignorados com justificativa; revisão/edição antes de salvar; PDF em A4 vertical com apenas os setores ativos
- **Designação de limpeza:** setores de reunião, semanais e gerais, com regras próprias (gênero, jovens, quantidade de pessoas); geração automática por período e PDF
- **Discursos:** roteiros e partes de discurso vinculados a pessoas e datas, com filtro por congregação e oradores de sub-organizações
- **Sub-organizações:** grupos com pessoas próprias que também podem receber designações (ex.: discursos de outra congregação)
- **Conteúdo das reuniões:** gestão e importação de conteúdo (apostila, Sentinela, discursos, cânticos)
- **Multi-idioma:** PT-BR e ES com detecção/preferência por usuário

## API

REST em `/api` (App Router), protegida por sessão e por papel. Principais grupos:

- `/api/auth/[...all]` — autenticação Better Auth
- `/api/orgs`, `/api/members`, `/api/tokens`, `/api/invite-*` — organizações, membros e convites
- `/api/people`, `/api/families`, `/api/sub-orgs`, `/api/sub-org-people` — cadastros
- `/api/meeting-configs`, `/api/meeting-parts`, `/api/meetings`, `/api/special-events` — reuniões
- `/api/cleaning`, `/api/cleaning-schedules`, `/api/cleaning/sectors` — limpeza
- `/api/designation-config`, `/api/designation-programs` — designações das reuniões
- `/api/meeting-content`, `/api/meeting-content/import` — conteúdo das reuniões
- `/api/person-talks`, `/api/talk-dates` — discursos e datas

## Modelo de dados

Modelos principais em `prisma/schema.prisma`: `User`, `Organization`, `Member`, `Invitation`, `InviteToken`, `Person`, `Family`, `MeetingConfig`, `MeetingPart`, `Meeting`, `MeetingAssignment`, `SpecialEvent`, `MeetingContent`, `MeetingContentItem`, `CleaningConfig`, `CleaningSector`, `CleaningSchedule`, `CleaningAssignment`, `DesignationConfig`, `DesignationProgram`, `DesignationAssignment`, `PersonTalk`, `TalkDate`, `SubOrganization`, `SubOrgPerson`.

## Scripts

| Comando | Descrição |
| --- | --- |
| `bun run dev` | Servidor de desenvolvimento (http://localhost:3000) |
| `bun run build` | Build de produção (Next.js/Turbopack) |
| `bun run start` | Servidor de produção |
| `bun run format` | Formatação com Biome (`--write`) |
| `bun run lint` | Lint com Biome |
| `bun run typecheck` | Typecheck com `tsc --noEmit` |
| `bun run check` | Lint + typecheck |
| `bun run verify` | Format + check |

## Primeiros passos

Pré-requisitos: [Bun](https://bun.com) ≥ 1.x, Node.js ≥ 20 e um banco PostgreSQL.

```bash
bun install
cp .env.example .env   # preencha as variáveis
bunx prisma migrate deploy   # ou bunx prisma migrate dev para desenvolvimento
bun run dev   # http://localhost:3000
```

Variáveis de ambiente (`.env`):

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | Connection string do PostgreSQL |
| `BETTER_AUTH_SECRET` | Segredo usado para assinar sessões |
| `BETTER_AUTH_URL` | URL pública do painel web |
| `GOOGLE_CLIENT_ID` | Credenciais OAuth do Google |
| `GOOGLE_CLIENT_SECRET` | Credenciais OAuth do Google |

O fluxo OAuth do Google exige que as URLs de redirecionamento autorizadas estejam configuradas no Google Cloud Console.

## Verificação

```bash
bun run format
bun run check
bun run build
```

## Convenções

- TypeScript em modo estrito
- Formatação e lint via Biome
- Migrations de banco versionadas em `prisma/migrations` (sempre via `prisma migrate dev`/`deploy`)
- Validação de entrada com Zod em `src/lib/schemas.ts`
- Texto da UI centralizado em `src/i18n/locales/{pt,es}.json`, sem strings hardcoded
- PDFs gerados com jsPDF + jspdf-autotable em `src/features/<modulo>/`

## Segurança

- Arquivos `.env` e variantes são ignorados pelo `.gitignore`; use `.env.example` para documentar novas variáveis
- Nunca commite segredos ou dados de produção
