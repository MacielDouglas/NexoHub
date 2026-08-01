# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

- **Monorepo:** Turborepo + Bun
- **Mobile:** Expo SDK 57 (React Native 0.86, Expo Router, better-auth expo) — _mobile-first_
- **Web:** Next.js 16 (App Router, React 19, Tailwind CSS v4) — _segue o design mobile_
- **DB:** PostgreSQL (Neon) via Prisma
- **Auth:** better-auth + plugin organization (roles owner/admin/member, super_user global)
- **Linguagem:** TypeScript strict
- **Lint/Format:** Biome
- **i18n:** pt-BR e es, em ambos os apps

## Users

- **Anciãos** — usuários primários. Gerenciam membros, configuram reuniões e limpeza, importam `.jwpub` e administram a congregação. Roles: `owner` (controle total) e `admin`.
- **Publicadores** — membros da congregação (`member`). Recebem designações para cumprir nas reuniões.
- **Super User** — acesso administrativo global; visualiza/entra em qualquer congregação (o primeiro usuário registrado vira `super_user`).

## Product Purpose

Nexohub é um gerenciador de reuniões para congregações das Testemunhas de Jeová: cadastra membros com contas de usuário, importa a programação oficial das reuniões via arquivos `.jwpub`, configura as partes da reunião, agenda eventos especiais, e gerencia a escala de limpeza da congregação.

## Positioning

Substituto digital do fluxo manual de escalas, programação e limpeza congregacionais. Centraliza membros, programação de reuniões (importada de fonte oficial), configurações da reunião e limpeza em um único sistema multiplataforma, por congregação.

## Operating Context

- Uso por anciãos em dispositivos móveis (prioritário) e web (complementar).
- Importação de arquivos `.jwpub` obtidos do site oficial jw.org (4 tipos: apostila/mwb, sentinela/w, discursos/S-34, cânticos/sjj).
- As reuniões seguem o calendário da organização (semanas, meses, anos de serviço).
- Cada congregação (Organization) opera com seu próprio conjunto de membros, configs e escalas.
- Convites por e-mail (papel simulado, `console.log` com link de aceite) e tokens de convite com código para atribuir ownership.
- Sessões via cookie (web) e via expo plugin (mobile nativo).

## Capabilities and Constraints

**Confirmado:**
- Auth completo: e-mail/senha + Google OAuth, sessões web/mobile, roles por organização.
- Multi-congregação: usuário membro de uma organização; `super_user` acessa qualquer uma via admin.
- CRUD de membros: um `Member` vincula um `User` a uma `Organization` (usuário não é órfão; membro exige usuário).
- Importação `.jwpub` com extração real (apostila, sentinela, discursos, cânticos) + dedup com confirmação de substituição.
- Config de reuniões (`MeetingConfig`/`MeetingPart`): dias/horários e partes com duração.
- Eventos especiais: memorial, discurso especial, visita de circuito, convenção, assembleias, reunião especial.
- Escala de limpeza (`CleaningConfig`/`CleaningSector`): semanal e geral, com setores padronizados (unidade, público, gênero, jovens).
- i18n pt/es; tema claro/escuro.

**Por definir:**
- Modelo de designações/tarefas e atribuição a membros (ainda não implementado).
- Histórico de designações e escalas.
- Sincronização/offline real (princípio "offline-minded", mas sem implementação).
- Notificações (e-mail real, push).
- Convite por e-mail: envio simulado, ainda sem SMTP.

## Brand Commitments

- Nome: **Nexohub**
- Nenhum asset de marca (logo, cores, tipografia) definido ainda
- Domínio: Testemunhas de Jeová (termos: ancião, publicador, congregação, reunião, designação, escala, limpeza, evento especial)

## Evidence on Hand

- Arquivos `.jwpub` em `apps/jwpub/`: `mwb_S_202611.jwpub` (apostila es), `w_S_202609.jwpub` (sentinela es), `S-34_S (1).jwpub` (discursos), `sjj_S.jwpub` (cânticos).
- Estrutura do `.jwpub`: ZIP com `manifest.json` (metadados da publicação, `IssueTagNumber`, `issueProperties.symbol`) e `contents` (formato z-a); extração em `apps/web/src/lib/jwpub/extract.ts`.
- Schema Prisma completo em `apps/web/prisma/schema.prisma`.

## Product Principles

1. **Mobile-first** — A experiência primária é mobile; web replica o design.
2. **Fidelidade ao domínio** — Terminologia e fluxos seguem o contexto congregacional TJ.
3. **Importação como configuração** — A programação das reuniões vem de fonte oficial via `.jwpub`; conteúdo pode ser editado após import.
4. **Uma pessoa, um membro, uma conta** — Membro é usuário vinculado a uma congregação; nunca usuário órfão.
5. **Offline-minded** — Uso congregacional pode ocorrer em locais com conectividade limitada (intenção declarada, sem implementação).

## Accessibility & Inclusion

Por definir. O produto deve considerar usuários com diferentes níveis de familiaridade tecnológica.
