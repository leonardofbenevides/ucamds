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

## O que existe (fatia 2a, 09/10/2026)

- `sites/spec/components/` — button, tag, icon-chip, section-heading.
- `sites/spec/demos.json` — preview e código (o mesmo HTML) por peça.
- `tools/validate-sites-spec.mjs`, `tools/build-sites-css.mjs`, `tools/build-sites-index.mjs`.
- `dist/sites/css/ucam-site.css`; `/sites` e `/sites/<id>` no site de docs; pacote `@ucam/site-css`.

    pnpm run sites        tokens, fontes, folha, espelho de estados, validação e índice
    pnpm run test:tools   prepara dist/sites e roda a suíte da ferramenta

## Pendências

- Fatia 2b: avatar, accordion, pagination, input, newsletter-form, breadcrumb, page-shell, site-header, site-footer.
- Fatia 2c: hero, editorial-page-hero, hero-pill, editorial-cta, stats-band, logo-marquee, card, doc-card, step-card, course-card, testimonial, prose.
- Subprojeto 3: `@ucam/site-ui` (Angular 22) e o MCP servindo os sites.
- A página de componente dos sites é cópia da do catálogo; extrair o que é comum é dívida registrada na spec.
