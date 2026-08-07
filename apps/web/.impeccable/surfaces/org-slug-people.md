---
version: 1
slug: "org-slug-people"
primary_target: "org/[slug]/people"
related_targets: []
---

# Surface: Pessoas

- **Scope / modo de visitante:** `/org/[slug]/people` — Operate. Gerenciamento de cadastro de pessoas da congregação (owner/admin) e leitura para membros.
- **Público / tarefa:** Anciãos e administradores mantêm o rol da congregação — criar/editar/remover pessoas, agrupar por família, vincular usuários.
- **Prova / conteúdo:** stats de resumo (total, ativas, famílias, homens, mulheres, privilégio), busca por nome/família, agrupamento por família + "sem família".
- **Restrições:** i18n obrigatório (pt/es), `canManage = owner|admin`, manter busca, agrupamento, diálogos de criar/editar e confirmação de remoção, integração com usuário vinculado, acessibilidade.
- **Direção escolhida:** mundo bancário Itaú atual — tinta `#0c0c12` + laranja `#ec7000`, **global** (tokens em `:root`). Hero "saldo" com total + 5 células de extrato, busca pill, linhas por família.
- **Decisões em aberto:** validação visual aguardando revisão do usuário no browser; DESIGN.md/documentação escritos in-thread (sem `impeccable-documenter`).
