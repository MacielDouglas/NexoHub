---
target: impeccable critique (Conteúdo das Reuniões)
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-01T21-10-49Z
slug: apps-web-src-components-meeting-content-client-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Saves/deletes/imports complete silently; no success feedback, no item count in flat lists |
| 2 | Match System / Real World | 3 | Domain vocabulary excellent, but "Criar vazio" and raw `YYYYMMDD-YYYYMMDD` dateRange are jargon |
| 3 | User Control and Freedom | 2 | Web delete has no confirm, nothing is undoable, no cancel mid-import |
| 4 | Consistency and Standards | 2 | Web/mobile delete-confirm asymmetry; hardcoded hex vs tokens; window.confirm vs branded Alert; two redundant views |
| 5 | Error Prevention | 2 | Destructive actions styled as innocuous text links; unvalidated numeric fields |
| 6 | Recognition Rather Than Recall | 3 | Song-title resolver is a gem; but no search in flat lists, machine-format date input |
| 7 | Flexibility and Efficiency | 2 | No search/filter, keyboard shortcuts, bulk edit, insertion point, or reorder |
| 8 | Aesthetic and Minimalist Design | 2 | Clean tokens but dual views, emoji tabs, issue-code hierarchy inversion, 3-way text-link crowding |
| 9 | Error Recovery | 2 | Item-save errors silent; deletes irreversible with no undo/trash |
| 10 | Help and Documentation | 1 | No help, tooltips, or empty-state guidance; "Criar vazio" unexplained |
| **Total** | | **22/40** | **Acceptable** |

## Design Specificity Verdict

**Partial — semantic layer is domain-grounded; composition is category-interchangeable.**

The data model and copy are deeply specific to a JW congregation manager (mwb/w/sjj/S-34 codes, meeting-week ranges, cântico inicial/meio/final, `.jwpub` import with duplicate-replace). But the composition — segmented emoji tabs, white `ring-1` cards, blue primary button, small red text-link destructive actions, accordion-plus-detail redundancy — is a generic CRUD scaffold that a competent admin template would produce 90% of unchanged. It delivers the tokens but not the tone of DESIGN.md's north star "A Sala do Reino Digital": emoji tabs (consumer language, not the monocolor-icon vocabulary), browser `window.confirm` chrome, and a loud blue issue code outranking the publication title.

**Deterministic scan**: CLEAN. The bundled detector returned `[]` (exit 0) on `meeting-content-client.tsx`, `meeting-content-editors.tsx`, and `meeting-content-types.ts`. No rule fired, no false positives, no suppressed config. Detector is functional (55-rule registry verified; control scans of `apps/web/src` and `components/` also clean). The detector does not catch Tailwind arbitrary-value hex literals (`#2563EB` ×15+) because its color rules target CSS-authored forms — those are LLM-identified drift, not detector findings.

**Visual overlays**: Browser automation is unavailable in this harness — no reliable user-visible overlay. The web target is viewable via dev server only.

## Overall Impression

Solid, token-correct CRUD with excellent domain fidelity and genuine care in the details (role gating, song-title recognition, pt-BR week formatting). But it's a scaffold in an institutional suit: the two most dangerous actions — deleting a publication and removing all items — are the least protected on web (silent, unconfirmed), and the two redundant content destinations ("Ver conteúdo" accordion + "Editar" view) double the surface's complexity without earning it. The single biggest opportunity: one canonical detail path plus confirmation-with-dignity on every destructive action.

## What's Working

1. **Domain fidelity.** The data model and copy speak the organization's real language — `mwb26.06` issue codes, meeting-week ranges, "cântico do meio", `.jwpub` duplicate-replace. This could not serve an unrelated product.
2. **Role gating done right.** `canManage` cleanly gates every mutating control on both platforms, and tab switches reset `selected` state, preventing stale-content confusion.
3. **Cross-platform parity + recognition over recall.** Web/mobile share types, i18n, and view composition; the song-title resolver spares elders from cross-checking the songbook.

## Priority Issues

1. **[P0] Web deletes a publication with no confirmation and no undo** — `meeting-content-client.tsx:209-217`. A whole imported issue disappears in one tap, silently. Mobile wraps the same action in a branded Alert (`mobile meeting-content.tsx:244-264`) — the team knows the right pattern and didn't ship it on web. *Why it matters*: the highest-stakes action on the surface is the least protected. *Fix*: port the branded confirm (title + destructive action + item count) to web; add undo if feasible. *Suggested command*: /impeccable harden.
2. **[P1] Flat lists (Cânticos/Discursos) are unusable at scale** — hundreds of rows in one unvirtualized `<ul>` with no search, filter, or jump-to-number (`meeting-content-client.tsx:833-882`; mobile FlatView). *Why it matters*: finding "Cântico 45" means scrolling ~200 rows one-handed. *Fix*: search/filter field, grouped index, or virtualization. *Suggested command*: /impeccable clarify + /impeccable layout.
3. **[P1] Editor cognitive overload + unvalidated machine-format input** — ApostilaEditor's dateRange is a raw `20260706-20260712` string (`meeting-content-editors.tsx:370-377`) with no picker/validation; 6 unvalidated fields per *parte*; mobile has no placeholder. *Why it matters*: elders think in meeting weeks, not ISO strings; fat-fingered data silently saves. *Fix*: meeting-week picker, collapsible sections, field-level validation. *Suggested command*: /impeccable harden.
4. **[P2] Two redundant content destinations; members see "Editar"** — inline accordion "Ver conteúdo" (`:581-586`) and full "Editar" → SelectedView (`:587-593`) both reveal the same items; members (who can't edit) are shown "Editar". *Fix*: one canonical detail view, labeled "Ver"/"Abrir" for members. *Suggested command*: /impeccable distill.
5. **[P2] Destructive actions as subtle red text links + inconsistent dialogs** — Excluir/Remover todos/Substituir all low-affordance; web uses `window.confirm`, mobile branded Alerts. *Fix*: branded confirmation both platforms, larger hit targets. *Suggested command*: /impeccable harden.
6. **[P3] Token drift** — `#2563EB` hardcoded ~15× instead of the `primary` token; `text-red-500` (`#ef4444`, ~3.1:1, fails WCAG AA) vs design's `#DC2626`; hover 90% vs spec 85%. *Suggested command*: /impeccable audit.

## Persona Red Flags

**Riley (stress tester)**: Taps "Excluir" on a publication → web deletes instantly, no confirm, no undo (`client:209-217`). Then "Remover todos" → generic `window.confirm` (`:220`). Both catastrophic outcomes are two taps from a misclick on tightly-spaced text links. Silent save failures (`:252`) mean stress edits silently don't persist.

**Casey (distracted mobile)**: Finding "Cântico 45" in ~200 rows with no search; must then hit a ~13px "Editar" text link with 16px gaps. Tapping "Editar" reflows the row inline and the editor anchor is lost on scroll. Emoji tab labels share one line with `numberOfLines={1}` — "Discursos" risks truncation on narrow screens.

**Sam (accessibility/keyboard)**: Text-link actions are `text-sm` with hover-only underline affordance and no visible focus indication; accordion expand state never announced (no `aria-expanded`). Web delete text at `#ef4444` fails AA contrast (`#DC2626` would pass). No `aria-live` on upload errors.

## Minor Observations

- Web flat list shows no count header while card view shows "X itens" — inconsistent at-a-glance status.
- `addFlatItem` silently creates a hidden empty content container — invisible architecture.
- Song-title resolver returns "—" until Cânticos are imported first — fragile cross-tab dependency.
- Empty states are a single grey line with no icon, guidance, or CTA — a lonely first-run for a "digital notice board".
- No success feedback anywhere (no toast, no count-change summary).

## Questions to Consider

1. Why do "Ver conteúdo" and "Editar" both exist as destinations for the same object? What breaks if the card opens one canonical detail view and the accordion disappears?
2. If Cânticos legitimately holds hundreds of official items, why is an infinite scroll the only affordance — what would "jump to cântico 45" look like (search + grouped index)?
3. Is the raw dateRange string the right model, or should elders pick from an actual meeting-week calendar?
4. Members open this surface to do what, exactly? If it's "preview the program," shouldn't there be a quick "next meeting" view instead of a CRUD list with a misleading "Editar" button?
5. What would a two-step confirm plus undo do for the trust this surface needs as the congregation's digital notice board?
