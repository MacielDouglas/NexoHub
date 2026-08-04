# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Administradores e anciãos de congregação (papéis `owner`/`admin`) gerenciam o cadastro de pessoas, famílias e escalas; membros regulares têm acesso de visualização. Operam em desktop (sidebar) e mobile (drawer).

## Product Purpose

NexoHub é o app de administração de congregação: centraliza o cadastro de pessoas, famílias, designações de reunião, privilégios de serviço, escalas de limpeza e o vínculo entre usuários da plataforma e pessoas cadastradas.

## Positioning

Cadastro de congregação com modelagem rica de privilégios e designações (serviço, reuniões, famílias) e vínculo direto entre usuário da plataforma e pessoa cadastrada — diferente de um simples rol de membros.

## Operating Context

Interface web multi-tenant (Next.js 16, Tailwind v4, shadcn/ui sobre Base UI, Prisma 7, react-i18next). Organizações por `slug`; idiomas pt-BR (padrão) e es. Página Pessoas em `/org/[slug]/people` dentro do shell da organização (sidebar/drawer fixos).

## Capabilities and Constraints

- Página Pessoas: busca por nome/família, agrupamento por família (e grupo "sem família"), seis métricas de resumo, criar/editar/remover pessoa (apenas owner/admin), vínculo opcional a usuário da plataforma.
- i18n obrigatório via `react-i18next` (pt.json / es.json); nenhum texto hardcoded.
- Permissão `canManage = owner | admin`.
- Modelo `Person` com flags extensos (batizado, jovem, privilégio de serviço, chefe de família, designações de reunião, etc.).
- Rota server component em `src/app/org/[slug]/people/page.tsx`; client em `src/features/people/`.

## Brand Commitments

Direção visual pinada pelo usuário: app bancário **Itaú atual** — fundo escuro (ink), laranja assinatura `#EC7000` como acento dominante, cards escuros, números em destaque (linguagem de saldo). O redesenho se limita à página Pessoas; sidebar, layout e shell da organização permanecem intactos.

## Evidence on Hand

Implementação vigente em `src/features/people/` (`people-client.tsx`, `person-dialog.tsx`, `types.ts`), rota `src/app/org/[slug]/people/page.tsx` (+ `loading.tsx`), traduções em `src/i18n/locales/{pt,es}.json`.

## Product Principles

- Operar primeiro: a tarefa, o estado e o conteúdo permanecem sempre legíveis; a expressão nunca obscurece a função.
- Números e métricas em destaque, com hierarquia de "saldo" bancário.
- Fidelidade ao mundo Itaú: laranja `#EC7000` sobre ink escuro, cantos arredondados, sem brilho excessivo.
- Preservar funcionalidade, i18n e acessibilidade existentes.
- Modo da superfície: **Operate**.

## Accessibility & Inclusion

Preservar keyboard focus, aria-labels e os estados existentes (loading, empty, error, disabled, permissões).
