# UCAMDS Sites — Subprojeto 2: contratos, folha de classes e catálogo

Design de 08/10/2026, escrito depois do subprojeto 1 entrar na `main`
(`695566e`). Continuação da spec `2026-10-08-ds-dos-sites-design.md`, que
continua sendo a autoridade sobre nome, lugar, camadas de token e a lista de
25 componentes. Esta spec decide **como** os contratos dos sites viram CSS,
catálogo e pacote — e descobre, medindo o pipeline, que a frase daquela spec
"`validate-spec` e `build-index` parametrizados por raiz" era o caminho errado.

## O que o pipeline de hoje é, medido em 08/10/2026

- Nenhum script recebe a raiz da spec. `validate-spec.mjs` (1186 linhas),
  `build-index.mjs` (1106), `build-css.mjs` (14.5 mil), `vite.config.ts` e o
  MCP (`tools/agentes/nucleo.mjs`) cravam `spec/`, o prefixo `ucam-` e o
  `ui/` do Angular.
- O CSS dos componentes é **escrito à mão** num único template literal
  (`const css = \`…\`` da linha 157 à 14495, 95 seções `/* --- botão --- */`).
  Os contratos aparecem só em comentários. Nada do CSS nasce do JSON.
- Os portões de `build-css` e de `validate-spec` só conhecem `ucam-tokens.css`
  e `ucam.css`: um `var(--ucam-site-…)` casa com a regex `--ucam-` e seria
  acusado como token inexistente; uma classe `.ucam-site-*` num preview seria
  reprovada por não existir em `ucam.css`.
- `validate-spec` cobra do contrato coisas que só a aplicação tem: `selector`
  exatamente `ucam-<id>`, wrapper do Trilho B em `ui/` para `review`/`stable`,
  presença em alguma tela de `templates.json`, ligações do `codigo` contra a
  API Angular.
- `build-index` deriva a matriz de trilhos lendo `ui/public-api.ts` e
  `elements/src/main.ts`, e mistura componentes com telas, padrões, layouts,
  migração e busca num `spec.data.json` só.
- O site de docs desenha a demo por `[innerHTML]` do `preview` dentro de
  `<div class="ucam …">`, sem iframe. A página de componente
  (`catalogo/[id].page.ts`, 1187 linhas) compõe `demo-painel`,
  `estados-grade`, `anatomia-diagrama`, `nesta-pagina`, `page-header` e
  `texto`, que são componentes de `site/src/app/docs/` reutilizáveis.
- O que é compartilhável sem tocar nos monólitos: `component.schema.json`,
  Ajv, `tools/lib/tokens.mjs`, `tools/lib/wcag.mjs`, `build-estados.mjs`
  (entrada e saída são duas constantes), os componentes de `docs/`, a
  enumeração de rotas do `vite.config.ts` e as listas `areas`/`secoes` do
  `app.component.ts`.

## Decisão: pipeline próprio e enxuto, reaproveitando as peças

Os sites **não** parametrizam `validate-spec`, `build-index` nem `build-css`.
Ganham três scripts pequenos que importam as mesmas libs e repetem os mesmos
portões com o prefixo `ucam-site-`. O custo de parametrizar os monólitos
seria atravessar 2.300 linhas acopladas a trilhos, telas e Angular para
servir a um sistema que não tem nada disso; o custo de um pipeline próprio é
três arquivos de 150 a 300 linhas e um portão duplicado por conta. O byte a
byte do UCAMDS continua sendo o critério: nenhum dos três monólitos muda.

| Script novo | Lê | Escreve | Portões |
|---|---|---|---|
| `tools/validate-sites-spec.mjs` | `sites/spec/components/*.json`, `sites/spec/demos.json`, `sites/spec/tokens/semantic.json`, `spec/decisions/adr.json`, `dist/sites/css/ucam-site.css` | nada | schema; `id` = nome do arquivo; `selector` = `ucam-site-<id>`; só token semântico dos sites (nunca primitivo, nunca `color.*` da aplicação que os sites não têm); ADR citada existe; `anatomia[].classe` e `implementacao.trilho_a.raiz` existem na folha; classes `ucam-site-*` do preview existem na folha; `vs` e `composicao` simétricos; demo tem `principal.preview` e `principal.codigo`; `conteudo` presente; perfil de contrato dos sites (abaixo) |
| `tools/build-sites-css.mjs` | `dist/sites/tokens/ucam-site-tokens.json` e `.css`, `sites/spec/tokens/semantic.json` (viewports) | `dist/sites/css/ucam-site.css` | todo `var(--ucam-site-x)` existe nos tokens dos sites; nenhum primitivo em componente; `@media` só com viewport emitido |
| `tools/build-sites-index.mjs` | `sites/spec/components`, `sites/spec/demos.json`, `dist/sites/tokens/*`, `dist/sites/css/*`, `spec/decisions/adr.json` | `site/src/generated/sites.data.json`, `site/src/generated/sites.css`, cópia de tokens e fontes em `site/src/assets/sites/` (servidos em `/sites/tokens/` e `/sites/fonts/`) | nenhum; só junta |

`build-estados.mjs` passa a aceitar entrada e saída por argumento
(`--entrada dist/sites/css/ucam-site.css --saida site/src/generated/sites-estados.css`),
com o padrão atual quando não há argumento. É a única mudança num script
existente, e a saída padrão continua byte a byte.

`pnpm run sites` passa a ser: tokens → fontes → css → estados → validate →
index. O `validate` vem **depois** do css porque confere classe contra a
folha, como o `subpaleta` da aplicação vem depois do `css` pelo mesmo motivo.

## O perfil de contrato dos sites

O schema é o mesmo `spec/schema/component.schema.json`, sem mudança: o
padrão do `selector` aceita `ucam-site-hero`, o de `anatomia[].classe` aceita
`ucam-site-hero__title`, o de `trilho_a.variaveis` aceita `--ucam-site-*`.
O que muda é o que o validador dos sites **exige além** do schema:

| Campo | Nos sites |
|---|---|
| `selector` | `ucam-site-<id>` (o validador da aplicação exigiria `ucam-<id>`; o dos sites exige este) |
| `category` | O enum do schema. Moldura e seção são `layout`; hero também. O catálogo dos sites agrupa por categoria com rótulos próprios (Ação, Formulário, Navegação, Moldura e seção, Conteúdo) |
| `status` | `draft` ao nascer; `review` quando tiver demo, evidência e dois exemplos. Não há `stable` sem o Trilho B (subprojeto 3) |
| `quando_usar`, `evidencia`, `limites`, `boas_praticas` (≥ 2), `conteudo` com `bom`/`ruim` | obrigatórios |
| `evidencia.origem` | o site no ar ou o `cenpre-ui-kit`, com URL ou caminho; `ocorrencias[].tela` é a página do site |
| `vs` | obrigatório quando há irmão confundível (card × doc-card × course-card; hero × editorial-page-hero; tag × hero-pill); simétrico |
| `implementacao.trilho_a` | obrigatório: `raiz`, `contrato`, `variaveis` (os `--ucam-site-*` que a peça lê) |
| `implementacao.trilho_b` | **ausente** até o subprojeto 3. O validador dos sites avisa se aparecer |
| `eventos` | ausente (é Angular) |
| `exemplos[].codigo` | **HTML do Trilho A**, com classes `ucam-site-*`. É o que o WordPress de Campos e o `www` em Angular 18 copiam |
| `migracao` | presente quando o `cenpre-ui-kit` tem a peça: `de: "cenpre-ui-kit"`, `mapa` de seletor/classe do kit → classe dos sites |
| `composicao` | só entre componentes dos sites; nunca cita `ucam-<x>` da aplicação |

Demos em `sites/spec/demos.json`, mesmo formato de `spec/demos.json`
(`principal.preview`, `principal.codigo`, `exemplos[]`, `miniatura?`). Até o
subprojeto 3, `preview` e `codigo` são o mesmo HTML; `instalacao` é
`<link rel="stylesheet" href="…/sites/css/ucam-site.css">` e `importacao` é
`@use '…/_ucam-site-tokens' as site;`.

## A folha de classes

`dist/sites/css/ucam-site.css`, escrita à mão em `build-sites-css.mjs` no
mesmo molde do `build-css.mjs`: um template literal, uma seção por
componente com o comentário "Contrato: sites/spec/components/x.json", helpers
`acima(viewport)` lendo os viewports da semântica dos sites.

- Começa com `@import "../tokens/ucam-site-tokens.css";` e uma raiz
  `.ucam-site` que assenta fonte, cor, fundo e `box-sizing`, como `.ucam` faz
  na aplicação. Tudo abaixo é `.ucam-site-<id>`, `.ucam-site-<id>__parte`,
  `.ucam-site-<id>--variante`.
- Submarca: a folha da camada 3 passa a aplicar-se por
  `:root[data-marca="cenpre"], [data-marca="cenpre"]`, e não só por `:root`.
  É o que deixa o catálogo mostrar bordô e CENPRE lado a lado num invólucro, e
  o que deixa uma página do `www` embutir um bloco do CENPRE. Muda a saída
  do subprojeto 1 em uma linha; o teste acompanha.
- Mobile-first, só `min-width`, pela constitution do dev do CENPRE. Os quatro
  viewports da semântica (`duas-colunas`, `nav-aberta`, `grade-completa`,
  `desktop-largo`) são os únicos `@media` admitidos.
- Sem `color-mix`, sem `oklch()` em tempo de execução: o que o portão não
  mede não entra (lição da subpaleta, ADR-037).
- Comportamento (acordeão abrindo, menu da gaveta, marquee pausando no hover)
  é CSS puro onde CSS basta (`<details>`, `:checked`, `animation-play-state`).
  O que CSS não desenha fica para o subprojeto 3 e o contrato diz "não
  entrega", a frase exata que o validador da aplicação já dispensa.

## O catálogo no site de docs

- **Área nova** na navegação: `sites` ("Sites", ícone `i-globe`), com a aba
  "Componentes" em `/sites`. Entra em `areas` depois de `catalogo`; o grupo
  da lateral sai de `sitesPorCategoria()`, a mesma função que a página chama,
  pela mesma regra que vale para o catálogo.
- `site/src/app/spec/sites.ts` importa `../../generated/sites.data.json` e
  exporta `sitesComponentes`, `sitesComponentePorId`, `sitesPorCategoria()`,
  `sitesMeta`.
- `pages/sites/index.page.ts`: abertura (o que é o sistema, a submarca, para
  quem é), um **alternador Bordô / CENPRE** que escreve `data-marca` no
  invólucro dos previews, e a grade por categoria com o preview de cada peça
  em `<div class="ucam-site palco-conteudo">`.
- `pages/sites/[id].page.ts`: **cópia enxuta** de `catalogo/[id].page.ts`,
  sem as seções que só a aplicação tem (matriz de trilhos, demo viva,
  instalação do Trilho B, migração do legado AngularJS). Mantém: exemplo,
  variações, variantes por prop, quando usar, boas práticas, qual dos dois,
  decisões, props, uso em código (HTML), composição, anatomia, estados
  (`estados-grade` sobre `sites-estados.css`), acessibilidade, conteúdo,
  evidência e migração do kit. Copiar em vez de extrair um componente comum
  é dívida registrada: extrair reestruturaria a página do catálogo da
  aplicação, e esta spec não mexe no que a aplicação já publica.
- `vite.config.ts` enumera `/sites/<id>` de `sites/spec/components`.
- `styles.css` importa `./generated/sites.css` e `./generated/sites-estados.css`.
  As duas folhas convivem com as da aplicação sem colisão: prefixos
  diferentes em classe e em variável.
- `check-ancoras` e `check-crases` cobrem as páginas novas sozinhos (varrem
  `site/src/app`); `check-lede` não lê `sites/spec/` e não precisa.

## Pacote

`build-pacotes.mjs` ganha `siteCss()` → `dist/pacotes/@ucam/site-css/` com
`tokens/`, `css/`, `fonts/` e um README, na mesma versão do monorepo. O
`@ucam/site-ui` é do subprojeto 3. O MCP continua servindo só a aplicação;
servir os sites é pendência registrada, não deste subprojeto.

## Divisão em fatias

25 contratos de 10 a 20 KB cada, mais uma seção de CSS e uma demo por peça,
não cabem num plano só com o pipeline. Três fatias, cada uma um plano:

| Fatia | Entrega | Componentes |
|---|---|---|
| **2a** | O pipeline inteiro, provado de ponta a ponta com quatro peças que exercitam variante, estado, ícone e tipografia display | `button`, `tag`, `icon-chip`, `section-heading` |
| 2b | O resto das peças e a moldura | `avatar`, `accordion`, `pagination`, `input`, `newsletter-form`, `breadcrumb`, `page-shell`, `site-header`, `site-footer` |
| 2c | Hero, seções, cartões e texto | `hero`, `editorial-page-hero`, `hero-pill`, `editorial-cta`, `stats-band`, `logo-marquee`, `card`, `doc-card`, `step-card`, `course-card`, `testimonial`, `prose` |

A 2a é pequena de propósito: quatro contratos são o bastante para o
validador, a folha, o índice, as duas páginas e o pacote existirem e serem
julgados. Se o molde estiver errado, erra em quatro, não em vinte e cinco.

## Critérios de aceite da 2a

- `pnpm run build` do UCAMDS: `dist/tokens`, `dist/css`, `dist/fonts`,
  `site/src/generated/spec.data.json` e `estados.css` byte a byte iguais.
- `pnpm run sites` verde, com `validate-sites-spec` reprovando: selector sem
  `site`, classe que não existe na folha, token primitivo citado, `vs` de mão
  única, demo sem preview, contrato sem `evidencia`.
- `/sites` e `/sites/button` no site de docs, prerenderizadas, com o
  alternador trocando bordô por CENPRE no preview.
- `dist/pacotes/@ucam/site-css/` com tokens, css e fontes.
- Os 31 testes de `test:tools` continuam, mais os do validador e dos portões
  da folha.

## Fora de escopo

- Trilho B dos sites (lib Angular), MCP para os sites, `www`.
- Extrair a página de componente num componente comum aos dois catálogos.
- Mega-menu, course-finder, carousel genérico (lacunas registradas na spec
  anterior).
