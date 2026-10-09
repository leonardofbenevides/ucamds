# sites/ — UCAMDS Sites

O segundo sistema do UCAMDS: o dos sites públicos (institucional, CENPRE,
Campos). Desenho em `docs/superpowers/specs/2026-10-08-ds-dos-sites-design.md`,
decisão na ADR-067.

Lê o primitivo compartilhado (`spec/tokens/primitive.json`) e só acrescenta a
ele (`sites/spec/tokens/primitive.json`). A semântica é própria
(`sites/spec/tokens/semantic.json`): papéis de site, sem tema escuro, com
superfície inversa. Cada submarca é uma camada 3 (`marca.<id>.json`) que só
sobrescreve semânticos — a primeira é o CENPRE (ADR-068).

    pnpm run sites        tokens + fontes → dist/sites/
    pnpm run test:tools   os testes da ferramenta

Prefixos: CSS `--ucam-site-*`, SCSS `$ucam-site-*`. O que ainda não existe
aqui (contratos de componente, catálogo, lib Angular) é dos subprojetos 2 e 3
da spec.

## O que existe (catálogo completo: fatias 2a, 2b e 2c, 09/10/2026)

- `sites/spec/components/`, vinte e cinco peças. Base e moldura: accordion, avatar, breadcrumb, button, icon-chip, input, newsletter-form, page-shell, pagination, section-heading, site-footer, site-header e tag. Hero, seções, cartões e prosa: hero, editorial-page-hero, hero-pill, editorial-cta, stats-band, logo-marquee, card, course-card, doc-card, step-card, testimonial e prose.
- `sites/spec/demos.json`: preview e código (o mesmo HTML) por peça.
- `tools/validate-sites-spec.mjs`, `tools/build-sites-css.mjs`, `tools/build-sites-index.mjs`.
- `dist/sites/css/ucam-site.css`; `/sites` e `/sites/<id>` no site de docs; pacote `@ucam/site-css`.
- Tudo CSS puro. Acordeão e menu do cabeçalho são `<details>`; a pausa do desfile de logos é uma caixa de seleção. O que o CSS não entrega está dito no contrato de cada peça.
- Texto nunca assenta sobre foto: no hero e na CTA a imagem só aparece com o modificador `--com-foto`, a partir de 1024px, na metade sem texto.

    pnpm run sites        tokens, fontes, folha, espelho de estados, validação e índice
    pnpm run test:tools   prepara dist/sites e roda a suíte da ferramenta

## Pendências

- Subprojeto 3: `@ucam/site-ui` (Angular 22) e o MCP servindo os sites. É ele que entrega o que o CSS puro não entrega: fechar o menu por Esc, animar o acordeão, validar o campo.
- A página de componente dos sites é cópia da do catálogo; extrair o que é comum é dívida registrada na spec.
- Só foi provado no Chrome. Falta conferir no Safari o campo de busca, o `<summary>` em flex e se a lista de passos (`role="list"`) é anunciada como lista no VoiceOver.
- Menores que a revisão da 2c deixou: a prosa não cobre h4, tabela, código nem lista aninhada; peça do sistema dentro da prosa herda o estilo de link; a foto escondida do hero ainda é baixada no telefone (falta `<picture>` com `media`); o cartão sobre seção escura não troca o anel de foco.
