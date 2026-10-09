# UCAMDS Sites — Fatia 2c: hero, seções, cartões e prosa

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** As doze peças que fecham o catálogo dos sites — hero, editorial-page-hero, hero-pill, editorial-cta, stats-band, logo-marquee, card, doc-card, step-card, course-card, testimonial e prose —, cada uma com contrato, demo e seção na folha.

**Architecture:** A da fatia 2b: nada de ferramenta nova. Contrato em `sites/spec/components/`, demo em `sites/spec/demos.json`, seção em `tools/build-sites-css.mjs`. CSS puro.

**Spec:** `docs/superpowers/specs/2026-10-08-sites-catalogo-design.md` (linha 2c da divisão em fatias).

**Forma deste plano:** compacta, como a 2b. Traz as decisões por peça; o JSON dos contratos sai na execução e quem o julga é `validate-sites-spec`.

## Global Constraints

- As das fatias 2a e 2b, todas: byte a byte das saídas da aplicação; só `min-width` e só os viewports da semântica; só token semântico dos sites; sem `color-mix`, `oklch()` nem hex; `semantic.json` editado como texto.
- **Texto nunca assenta sobre foto.** Onde há imagem de fundo (hero, CTA), a foto ocupa a metade que não tem texto e só a partir de `grade-completa`; abaixo disso a superfície é a inversa, lisa. É o que mantém o contraste medido: sobre foto ele dependeria de qual foto.
- Sem cor crua em degradê: o véu entre texto e foto é da superfície inversa (token) para `transparent`.
- Movimento que não para sozinho (o desfile de logos) tem parada por ponteiro e por foco, e some com `prefers-reduced-motion`.
- Toda peça se prova no navegador com o MÁXIMO que o contrato promete, em 390, 768, 1024, 1280 e 1440.
- Contraste que o contrato diz "medido" está em `PARES` de `tools/build-sites-tokens.mjs`.
- Worktree `../DSUCAM-sites`, branch `sites-2c` a partir da `main`.

## Review Focus

1. Em nenhuma largura há texto do hero ou da CTA sobre a foto, nem rolagem horizontal.
2. O desfile de logos para sob o ponteiro e sob foco, e não anima com `prefers-reduced-motion`; a segunda cópia dos logos não é lida duas vezes.
3. O cartão inteiro é clicável por um link só (link esticado), sem link dentro de link, e o foco aparece no cartão.
4. A prosa só estiliza o que está dentro de `.ucam-site-prose`, e a linha não passa da largura de prosa.
5. Os números da faixa de estatísticas são uma lista de definição (`dl`), com o rótulo ligado ao valor.

## As doze peças

| Peça | Categoria | Raiz | Partes e variantes | Evidência |
|---|---|---|---|---|
| hero | layout | `.ucam-site-hero` | `__media`, `__scrim`, `__inner`, `__content`, `__eyebrow`, `__title` (h1), `__lede`, `__pills`, `__actions` | hero das duas homes; o do CENPRE é carrossel de 5 slides |
| editorial-page-hero | layout | `.ucam-site-page-hero` | `__inner`, `__eyebrow`, `__title` (h1), `__lede`, `__pills`, `__actions`; `--prosa` | hero das subpáginas e do artigo do CENPRE |
| hero-pill | conteudo | `.ucam-site-hero-pill` | ícone opcional | pílulas do hero do CENPRE |
| editorial-cta | layout | `.ucam-site-cta` | `__media`, `__scrim`, `__content`, `__eyebrow`, `__title`, `__text`, `__actions` | CTA final de toda página do CENPRE |
| stats-band | layout | `.ucam-site-stats` | `__item`, `__value`, `__label`; `--inverse` | "O CENPRE em números"; "120+ anos, 500+ empresas, 85%" no `www` |
| logo-marquee | layout | `.ucam-site-marquee` | `__viewport`, `__track`, `__group`, `__item`; `--parado` | faixa de empresas parceiras do CENPRE |
| card | conteudo | `.ucam-site-card` | `__media`, `__body`, `__title`, `__text`, `__meta`, `__link`; `--interativo` | cartões de conteúdo e de vaga |
| doc-card | conteudo | `.ucam-site-doc-card` | `__header`, `__label`, `__list`, `__item` | documentos do estágio, no CENPRE |
| step-card | conteudo | `.ucam-site-step-card` | `__number`, `__body`, `__title`, `__text`, `__link` | "Como começar" e "Como funciona o cadastro" |
| course-card | conteudo | `.ucam-site-course-card` | `__media`, `__body`, `__tags`, `__title`, `__meta`, `__link` | cartões de curso do `www` |
| testimonial | conteudo | `.ucam-site-testimonial` | `__quote`, `__autor`, `__nome`, `__papel`; `--inverse` | depoimentos das duas homes |
| prose | conteudo | `.ucam-site-prose` | elementos nus dentro da raiz: h2, h3, p, ul, ol, a, blockquote, figure, img, hr | página de artigo do CENPRE |

Decisões que valem para várias:

- **Hero não é carrossel.** A spec dizia que o carrossel seria comportamento do hero; em CSS puro não há carrossel acessível. O contrato diz "não entrega", e fica para a lib do subprojeto 3. Um hero, uma mensagem.
- **Sem estrelas no depoimento.** O `www` põe cinco estrelas em todo depoimento; nota que é sempre máxima não informa nada.
- **Sem brilho nem granulado** no hero e na CTA do kit: são cor crua e imagem embutida, fora do que o portão mede.
- **Três tokens novos:** `size.hero` (altura mínima do hero na grade completa), `size.logo-parceiro` (48px, a altura de um logo no desfile) e `motion.duration.desfile` (38s, a volta inteira).
- **`vs`:** hero × editorial-page-hero; hero-pill × tag; card × doc-card; card × course-card.
- **Composição:** hero usa button e hero-pill; editorial-page-hero usa breadcrumb, hero-pill e button; editorial-cta usa button; doc-card usa icon-chip; course-card usa tag; testimonial usa avatar.

## Tasks

- [ ] **Task 0 — branch e linha de base.**
- [ ] **Task 1 — tokens** (três, como texto).
- [ ] **Task 2 — testes que falham** (`tools/test/sites-2c.test.mjs`): classes de cada peça; foto e véu só a partir de 64rem; desfile com `animation-play-state: paused` em `:hover` e `:focus-within` e `animation: none` em `prefers-reduced-motion`; link esticado do cartão; nenhum seletor de elemento nu fora de `.ucam-site-prose`; 25 contratos válidos; 25 no índice.
- [ ] **Task 3 — a folha**, doze seções.
- [ ] **Task 4 — contratos e demos**, por script de objetos; arestas de `vs` e composição nos contratos das fatias anteriores.
- [ ] **Task 5 — build e captura**: página de máximo fora do docs, nas cinco larguras; desfile sob foco e com movimento reduzido.
- [ ] **Task 6 — revisão, correção e mescla.**
