# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

- **Monorepo:** Turborepo + Bun
- **Mobile:** Expo SDK 57 (React Native 0.86, Expo Router) — _mobile-first_
- **Web:** Next.js 16 (App Router, React 19, Tailwind CSS v4) — _segue o design mobile_
- **Linguagem:** TypeScript strict
- **Lint/Format:** Biome

## Users

- **Anciãos** — usuários primários. Gerenciam pessoas, importam configurações de reuniões e atribuem tarefas.
- **Publicadores** — podem ter ou não usuário cadastrado. Recebem designações para cumprir nas reuniões.

## Product Purpose

Nexohub é um gerenciador de reuniões para congregações das Testemunhas de Jeová. Ele permite criar e gerenciar pessoas (cada uma podendo ter um usuário vinculado, mas nunca um usuário sem pessoa), importar arquivos `.jwpub` com a programação oficial das reuniões, e atribuir tarefas e designações aos usuários cadastrados.

## Positioning

Substituto digital do fluxo manual de escalas e designações de reuniões congregacionais. Centraliza pessoas, programação de reuniões (importada de fonte oficial) e atribuição de tarefas em um único sistema multiplataforma.

## Operating Context

- Uso por anciãos em dispositivos móveis (prioritário) e web (complementar).
- Importação de arquivos `.jwpub` obtidos do site oficial jw.org.
- As reuniões seguem o calendário da organização (semanas, meses, anos de serviço).
- Cada congregação opera com seu próprio conjunto de pessoas e escalas.

## Capabilities and Constraints

**Confirmado:**
- CRUD de pessoas (nome, contato, etc.)
- Usuário opcional vinculado a pessoa (nunca órfão)
- Importação de `.jwpub` para extrair programação de reuniões
- Atribuição de tarefas/designações a usuários

**Por definir:**
- Modelo de dados das tarefas e designações
- Fluxo de autenticação/autorização
- Sincronização entre dispositivos
- Histórico de designações
- Múltiplas congregações ou apenas uma instância

## Brand Commitments

- Nome: **Nexohub**
- Nenhum asset de marca (logo, cores, tipografia) definido ainda
- Domínio: Testemunhas de Jeová (termos: ancião, publicador, congregação, reunião, designação, escala)

## Evidence on Hand

- Arquivo `.jwpub` de exemplo em `apps/jwpub/mwb_S_202611.jwpub` (Guía de Actividades 2026, espanhol, nov/dez)
- Estrutura do `.jwpub`: ZIP contendo `manifest.json` (metadados da publicação + imagens) e `contents` (formato z-a)

## Product Principles

1. **Pessoa primeiro** — Toda entidade no sistema é uma pessoa; usuário é um atributo opcional.
2. **Mobile-first** — A experiência primária é mobile; web replica o design.
3. **Fidelidade ao domínio** — Terminologia e fluxos seguem o contexto congregacional TJ.
4. **Importação como configuração** — A programação das reuniões vem de fonte oficial via `.jwpub`; não é editada manualmente.
5. **Offline-minded** — Uso congregacional pode ocorrer em locais com conectividade limitada.

## Accessibility & Inclusion

Por definir. O produto deve considerar usuários com diferentes níveis de familiaridade tecnológica.
