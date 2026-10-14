# saber-mais, fase A: o que o catálogo dos Sites precisa para as páginas de curso

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pôr no catálogo dos Sites, com contrato, folha, demo, forma Angular e paridade provada, as peças e variantes que as páginas de Mestrado e Doutorado do saber-mais usam e o catálogo não tinha.

**Architecture:** O caminho das fatias 3a: contrato em `sites/spec/components/`, seção em `tools/build-sites-css.mjs` (com os portões), demo em `sites/spec/demos.json` com `codigo` e `angular`, peça em `sites/ui/projects/site-ui/src/lib/<id>/` com seletor de atributo e sem estilo, `trilho_b` no contrato. A única mudança de fundação é a variante de texto sobre foto, que exige um token novo e uma conta no build.

**Tech Stack:** Node 24 ESM, DTCG tokens, Angular 22, vitest + jsdom, Chrome por CDP.

**Spec:** `docs/superpowers/specs/2026-10-14-saber-mais-sites-design.md`. Padrão das peças: `docs/superpowers/plans/2026-10-13-sites-ui-3a3.md`. Formato compacto.

## Global Constraints

- As saídas da APLICAÇÃO ficam idênticas byte a byte. A main andou desde a 3a-3 (commits de outra sessão): a base de comparação é refeita a partir da main antes de começar (Tarefa 0) e de novo antes da mescla, se a main andar outra vez.
- Não tocar `tools/validate-spec.mjs`, `tools/build-index.mjs`, `tools/build-css.mjs`, nada em `ui/`, nem o saber-mais (a fase A é só DSUCAM).
- Folha: só tokens semânticos dos sites; sem hex, `rgb()`, `color-mix()` ou `oklch()`; só `min-width` nos viewports semânticos. A submarca CENPRE só remapeia tokens que já existem na semântica (`tools/build-sites-tokens.mjs` falha se nascer token nela).
- Lib: seletor de atributo sobre o elemento nativo, sem estilo, entradas tipadas pelo contrato com queda no padrão, nada criado fora do template, nenhuma ligação de hospedeiro que escreva `null` por cima do consumidor, dado torto filtrado sem deixar marcação vazia nem link sem nome, `track` pelo valor em item clicável.
- Peça nova = contrato + seção da folha + demo (`codigo` e `angular` em todo painel) + pasta na lib com `<id>.spec.ts` chamando `blocosComuns` + registro (`scratchpad/aplica-peca.cjs` e `registra-peca.cjs`) + status `review`.
- Endereço só de âncora ou só de consulta não entra em demo nem em padrão de entrada (resolve contra `<base href>`). As demos usam caminho: `/mestrado#pesquisa`.
- Teste antes do código, vendo o vermelho, em cada tarefa.
- Commits em português, sem emoji, com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Worktree `C:/Users/Leonardo/Documents/DSUCAM-sites`, branch `sites-saber-a` a partir da main.

## Review Focus

1. Texto sobre foto: em NENHUMA foto o texto da variante fica abaixo de 4,5:1 — a conta do pior caso (véu sobre branco puro) roda no build para a marca base e para a CENPRE, e o texto não sai da faixa onde o véu tem a opacidade da conta. Testes nas Tarefas 1 e 8.
2. Os números com frase continuam com o número em cima e a ordem de leitura rótulo, número, frase; a faixa sem frase fica idêntica à de hoje (paridade das demos antigas). Teste na Tarefa 2.
3. Abas de seção: a atual é anunciada (`aria-current`), as abas rolam no telefone sem esconder a atual, e o foco por teclado aparece. Testes nas Tarefas 5 e 8.
4. Cartão de contato: telefone e e-mail viram `tel:` e `mailto:` com o texto visível como nome; dado ausente não deixa linha vazia. Teste na Tarefa 7.
5. Hidratação: nenhuma das peças novas duplica nó. Teste na Tarefa 8.

---

### Tarefa 0: branch e base

- [ ] `git checkout -b sites-saber-a main` na worktree.
- [ ] Base: `git checkout --detach main`, árvore limpa, `pnpm run build`, copiar `dist/tokens`, `dist/css`, `dist/fonts`, `site/src/generated/spec.data.json` e `estados.css` para `scratchpad/base4`; `compara4.sh` igual ao `compara3.sh` apontando para `base4`; voltar à branch.

### Tarefa 1: a variante sobre foto do hero de página

**Tokens** (`sites/spec/tokens/semantic.json`, editado como texto):
- `color.surface.photo-scrim`: a cor do véu. Base `{wine.900}`; a CENPRE remapeia para `{magenta.900}` (o #70132F que o saber-mais já usa).
- `opacity.photo-scrim`: a opacidade do véu na faixa do texto, número entre 0 e 1.

**A conta** (`tools/build-sites-tokens.mjs`, função exportada `piorCasoSobreFoto(tokens) → { razao, opacidade }` por marca): compõe o véu na opacidade do token sobre branco puro (`#FFFFFF`, a foto mais clara possível) e mede o branco do texto (`color.text.on-inverse`) contra o resultado. Falha o build se a razão ficar abaixo de 4,5:1, em qualquer marca. O valor do token é o MENOR múltiplo de 0,05 que passa nas duas marcas; o executor o calcula, grava e registra a razão no `$description`.

**Folha** (seção do `editorial-page-hero`): modificador `--sobre-foto`, partes novas `__media` (`<img>`) e `__scrim` (`<div aria-hidden="true">`).
- A raiz vira contexto de empilhamento (`position: relative; isolation: isolate; overflow: hidden`), com altura mínima de `size.hero`.
- `__media`: absoluta, cobre a raiz, `object-fit: cover`, atrás de tudo.
- `__scrim`: absoluta, cobre a raiz, fundo `color.surface.photo-scrim` com `opacity: var(opacity.photo-scrim)`. Abaixo de `grade-completa` o véu é uniforme (o texto ocupa a largura toda). A partir de `grade-completa`, `mask-image: linear-gradient(to right, black 0 55%, transparent 100%)`: sólido até 55% da largura e desvanecendo depois; o `__inner` limita o conteúdo a 50% da largura, para o texto nunca sair da parte sólida.
- O texto da variante usa as tintas `on-inverse` que a peça já usa.

**Contrato:** prop `image` (`string | null`), com `valores.true.classe = .ucam-site-page-hero--sobre-foto`; anatomia `media` e `scrim`; o limite da regra de foto diz que esta é a única exceção, com a conta no build. **Demo:** um exemplo novo "Sobre foto", com uma foto de verdade servida pelo site de docs (uma imagem pequena em `site/public/sites/`, não um endereço que dá 404).

**Lib:** a entrada `image` em `header[ucamSitePageHero]`; com ela, a raiz ganha o modificador e a peça desenha `__media` e `__scrim` — a mesma regra do hero: os três nascem da mesma condição.

**Testes:** a conta (vermelha com opacidade baixa forjada, verde com a do token, nas duas marcas); a folha tem a máscara só a partir de `grade-completa` e o `__inner` limitado a 50% ali; a lib sem `image` não desenha nada disso e com `image` desenha os três.

Commit: `Sites, saber-mais A: hero de página sobre foto, com o véu medido no build`.

### Tarefa 2: a frase nos números

- Contrato do `stats-band`: `items: { value; label; text? }[]`; anatomia `text` (`<dd class="ucam-site-stats__text">`).
- Folha: o item deixa a `column-reverse` (que poria a frase em cima) e passa a `flex-direction: column` com `.ucam-site-stats__value { order: -1 }`. Ordem no documento: rótulo, valor, frase; na tela: valor, rótulo, frase. A frase usa a tinta `text.secondary` (e `on-inverse-muted` no inverso).
- Lib: `text` opcional por item; ausente, nada.
- Teste da folha: a regra antiga de `column-reverse` saiu e a ordem nova está lá. Paridade: as demos de hoje (sem frase) continuam iguais na sonda.

Commit: `Sites, saber-mais A: a frase nos números`.

### Tarefa 3: o cartão de destaque

- `card--destaque`: fundo `color.surface.brand-soft`, borda `color.surface.brand`. Só faz sentido sem link: com `href`, o modificador não entra (é o que já acontece com `interactive` sem `href`, ao contrário).
- Lib: entrada `featured` em `article[ucamSiteCard]`.
- Contraste: texto `primary`, `body` e `secondary` sobre `brand-soft`, nas duas marcas, entram em `PARES`.

Commit: `Sites, saber-mais A: o cartão de destaque`.

### Tarefas 4 a 7: as peças novas

| Peça | HTML do contrato | Seletor e entradas na lib | Regras |
|---|---|---|---|
| `fact-sheet` (ficha) | `<dl class="ucam-site-fact-sheet">` com `<div class="__row"><dt class="__term"><dd class="__value">` | `dl[ucamSiteFactSheet]`; `items: { term: string; value: string }[]`, `columns: 1 \| 2` | duas colunas só a partir de `duas-colunas`; linha separada por fio `border.subtle`; item sem termo ou sem valor não entra |
| `section-tabs` (abas de seção) | `<nav class="ucam-site-section-tabs" aria-label>` com `<ul class="__list">` e `<a class="__tab" aria-current="page">` | `nav[ucamSiteSectionTabs]`; `items: { label; href }[]`, `current` (o href da atual), `ariaLabel` | rolagem horizontal no telefone (`overflow-x: auto`, `scroll-snap`), a atual rola para a vista ao montar (no navegador, `afterNextRender`, sem `smooth`), marca da atual por fio de 2px embaixo e peso, nunca por fundo; foco visível; sem itens, sem lista |
| `timeline` (linha do tempo) | `<ol class="ucam-site-timeline">` com `<li class="__item"><span class="__year">` e `<p class="__text">` | `ol[ucamSiteTimeline]`; `items: { year: string; text: string }[]` | o fio vertical e o ponto são da folha (`::before`), decorativos; ano antes do texto no documento |
| `contact-card` (cartão de contato) | `<section class="ucam-site-contact-card">` com `<h3 class="__title">` e `<address class="__lines">`, uma `<p class="__line">` por dado, com `<svg ucamSiteIcon>` e o texto | `section[ucamSiteContactCard]`; `heading`, `address`, `phone`, `email`, `level: 2 \| 3 \| 4` | telefone vira `<a href="tel:+55…">` (só dígitos e `+` no href, o texto como veio), e-mail vira `mailto:`; dado ausente não deixa linha; ícones `mapPin`, `phone`, `mail` |

Uma tarefa por peça, cada uma com o ciclo de sempre e commit próprio (`Sites, saber-mais A: <peça>`). A categoria do contrato: `fact-sheet` e `timeline` em `conteudo`, `section-tabs` em `navegacao`, `contact-card` em `conteudo`. A evidência de cada contrato cita a página do saber-mais onde a peça aparece (`/mestrado`, 14/10/2026).

Testes além dos comuns:
- **fact-sheet:** `dl > div > dt + dd`; uma e duas colunas; item torto filtrado; lista vazia deixa o `<dl>` sem filhos.
- **section-tabs:** exatamente uma aba com `aria-current="page"` quando `current` casa, nenhuma quando não casa; links com o href dado (nunca só o hash na demo); `track` pelo href; a atual chamada para a vista (espião em `scrollIntoView`, só no navegador).
- **timeline:** ordem do documento ano, texto; item torto filtrado.
- **contact-card:** `tel:` só com dígitos e `+` ("(22) 2726-2400" vira `tel:+552227262400`; o DDI 55 entra quando o número não tiver), `mailto:`; cada dado ausente some com o seu ícone; sem nenhum dado, só o título.

### Tarefa 8: hidratação, sonda, pacotes e fechamento

- [ ] **Hidratação:** `testing/hidrata-saber.spec.ts` com as peças e variantes novas numa página: mesma árvore antes e depois, nenhum aviso.
- [ ] **Sonda** `scratchpad/faixa/prova-saber-a.mjs`, a partir de `prova-3a3.mjs`: paridade das peças novas e das alteradas (page-hero, stats-band, card) a 390, 768, 1024, 1280 e 1440; na variante sobre foto, a cor de fundo efetiva atrás do título (amostra de pixel na captura, com a foto da demo) contra o branco do texto, acima de 4,5:1; as abas a 390 rolam e a atual está visível.
- [ ] **Pacotes:** `pnpm run lib`, `pnpm run elements`, `pnpm run lib:sites`, `pnpm run pacotes`: saem `ucam-site-css` e `ucam-site-ui` na versão da raiz, prontos para o `vendor/` do saber-mais na fase B.
- [ ] **README dos sites:** as peças novas, a exceção da foto e a sua conta.
- [ ] **Árvore limpa:** as duas suítes, `pnpm run build`, `compara4.sh` com cinco iguais, a sonda nova e as sondas da 3a-2 e 3a-3.

Commit: `Sites, saber-mais A: hidratação, prova no navegador e os pacotes`.

## Depois das tarefas

Revisão por subagente novo (modelo `opus`, só leitura, relatório em português, licença para testes descartáveis fora do repositório, com a mutação de amostra pedida). Um passe de correção com teste antes. Verificação de árvore limpa contra a base refeita se a main tiver andado. Mescla por avanço direto (ou mescla da main na branch e verificação, se a main andou). Sem push.
