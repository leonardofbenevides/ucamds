# UCAMDS Sites — um segundo sistema para os sites, sobre as mesmas fundações

Design de 08/10/2026. Pergunta: "a gente consegue separar uma parte para fazer
do UCAMDS uma parte pros sites, ou é melhor fazer outro DS?" Resposta dada em
conversa e aprovada com "seguir": **nem um pedaço do UCAMDS, nem um DS do
zero**. Um segundo sistema, o dos sites, que consome as fundações e a
ferramenta do UCAMDS e tem semântica, tipografia e componentes próprios.

Esta spec registra o desenho. O plano de implementação vem depois dela, e
cobre só o primeiro subprojeto (a fundação compartilhada). Os outros três
ficam descritos aqui para que o primeiro não feche portas.

## De onde vem

Três alvos, medidos em 08/10/2026:

| Alvo | Stack | O que carrega hoje |
|---|---|---|
| `www.candidomendes.edu.br` | Angular 18 com prerender, CMS headless em `api-site` | Três paletas ao mesmo tempo: Angular Material 3 com o azul de fábrica (`#005cbb`), Bootstrap 5 inteiro (`#0d6efd`, `#dc3545`…) e os tons do CENPRE (`#b4365b`, `#3c4b57`). O bordô da marca aparece uma vez por folha. Roboto, Inter e Work Sans; Font Awesome e cinco variantes de Material Icons. |
| `cenpre.candidomendes.edu.br` | Angular 22 com prerender, CMS headless em `api-cenpre-site` | Uma paleta só: magenta `#b4365b`, charcoal `#303e49`, ash `#e2e6e9`. Work Sans e Inter, com Poppins e Nunito Sans sobrando de outro template. |
| `www.ucam-campos.br` | WordPress | Não medido; só consome CSS. |

O repositório `cenpre-ui-angular-scss` (em `Documents\CENPRE`, último commit
01/10/2026) é a melhor matéria-prima: uma lib Angular instalável
(`cenpre-ui-kit`) com 18 peças de site, tokens em SCSS extraídos do Figma
"UCAM SITE", mobile-first, SSR, Vitest e Cypress. A *constitution* do dev do
projeto proíbe framework utilitário e exige SCSS puro — o que **exclui o
Trilho B** (ZardUI sobre Tailwind) para os sites.

## Por que não é "uma parte do UCAMDS"

O UCAMDS é um sistema de aplicação, e isso está gravado nele, não só nos
componentes:

- `spec/tokens/primitive.json` diz que o raio foi "calibrado para aplicação
  de dados, não para template".
- `spec/density.json` diz que "o sistema tem UMA densidade".
- O corpo é 14px em Geist, a escala de tamanho para no `3xl`, o controle tem
  36px.
- Os portões recusam mais de um primário por tela, exigem piso de tabela,
  conferem a faixa de marca e a obrigatoriedade de campo.
- Os 52 contratos vão de `data-table` a `compositor` e `app-shell`.

Um site precisa de hero com carrossel, cartão de curso, faixa de números,
depoimento, marquee de logos, mega-menu, newsletter, prosa editorial e um
título em `clamp()` que chega a 68px. Nada disso cabe num portão que exige
piso de tabela. Enfiar no catálogo é escolher entre reprovar o site ou
afrouxar o que protege os sistemas.

## Por que não é "outro DS"

O que é compartilhável já existe e já foi auditado, e não é pouco:

- **A marca.** O site institucional usa o mesmo bordô (`logo-bordo-ucam.svg`),
  e a âncora `#6C1E2B` da spec veio do arquivo de marca "UCAM-SITE". A rampa
  `wine` em OKLCH com matiz constante serve aos dois sistemas.
- **Os neutros.** A rampa `neutral` do UCAMDS é fria (248° a 266°). O
  charcoal do CENPRE (`#303e49`) está em 242°, L 35,6 — é a mesma família.
  Não há dois cinzas, há um cinza com dois nomes.
- **Feedback, foco, movimento, alpha, sombra.** Reaproveitados como estão.
- **Ícones, escrita, acessibilidade.** `spec/icons.json`, `spec/writing.json`
  e as regras de a11y dos contratos.
- **A ferramenta.** `build-tokens`, `check-daltonismo`,
  `check-marca-vs-destrutivo`, `validate-spec` (schema, referências, hex
  cru, ponteiros), `build-icons`, `build-fonts`, `check-crases`,
  `check-lede`, o site gerado da spec e o kit para agentes.

## O achado sobre o CENPRE

O CENPRE não é outra marca. Medido em OKLCH:

| Cor | L | Croma | Matiz |
|---|---|---|---|
| `wine.700` (UCAM, `#6C1E2B`) | 36 | 0,110 | 15° |
| `magenta.700` (CENPRE, `#b4365b`) | 53 | 0,163 | 7° |
| `magenta.900` (CENPRE, `#70132f`) | 36 | 0,127 | 9° |

O `magenta.900` do CENPRE é, na prática, o bordô institucional. O que o CENPRE
usa como primário é a mesma família, dezesseis pontos mais clara e mais
saturada. Cabe na arquitetura de três camadas, que foi preparada para
multimarca em 28/08/2026 e nunca usada: o CENPRE é a **primeira submarca**.

**Decisão em aberto nº 1 (é de marca, não de arquitetura):** o CENPRE segue
com o magenta como submarca, ou adota o bordô? Esta spec assume **magenta
como submarca**, porque é o que o site no ar e o Figma de registro fazem, e
porque é o caso de uso que valida a camada 3. Se a resposta for bordô, o
único arquivo que muda é `sites/spec/tokens/marca.cenpre.json`, que deixa de
existir.

## Em que base o trabalho entra

Repositório `Documents/DSUCAM`, `main` em `07ec58b`, árvore limpa, quatro
worktrees de outras sessões (`deploy`, `escala`, `isencao`, `texto`). Pela
prática do projeto, o trabalho entra numa worktree nova, `DSUCAM-sites`,
branch `sites-fundacao`, criada a partir da `main`. Nenhuma das quatro
worktrees toca `tools/build-tokens.mjs` ou `tools/validate-spec.mjs` num
ponto que esta spec precise mudar; a junção é por `git merge`, não por edição
cruzada.

## Nome e lugar

| O quê | Decisão |
|---|---|
| Nome | **UCAMDS Sites**. Diz o que cobre (os sites) e de onde vem (o UCAMDS). |
| Diretório | `sites/` na raiz do monorepo, irmão de `spec/`, `ui/`, `elements/`. |
| Spec | `sites/spec/`: `tokens/`, `components/`, `density.json`, `layouts.json`, `decisions/` **não** — as ADRs ficam na sequência única de `spec/decisions/adr.json`. |
| Saídas | `dist/sites/tokens/`, `dist/sites/css/`, `sites/ui/dist/`. |
| Pacotes | `@ucam/site-css` (folha, para quem não tem build: WordPress e o `www` enquanto for Angular 18) e `@ucam/site-ui` (lib Angular 22). |
| Prefixos | CSS `.ucam-site-*`; variáveis `--ucam-site-*` para a semântica dos sites; seletor Angular `<ucam-site-*>`. |
| Catálogo | Seção `/sites` no site de docs, gerada de `sites/spec/`. |

Por que `sites/` e não `web/` ou `institucional/`: "site" é a palavra que a
conversa, o inventário (`APPSUCAM/inventario.md`) e o próprio UCAMDS
(`migracao.json`: "a aplicação tem passo de build?") já usam para o que não é
aplicação. O diretório `site/` que existe é o site de **docs**, e continua
com esse nome; o plural distingue.

## Arquitetura dos tokens

Três camadas, como no UCAMDS. A diferença é **de onde cada camada lê**.

```
spec/tokens/primitive.json          ← camada 1, COMPARTILHADA (uma fonte da marca)
sites/spec/tokens/primitive.json    ← camada 1, EXTENSÃO: só chaves novas
sites/spec/tokens/semantic.json     ← camada 2 dos sites (a única pública)
sites/spec/tokens/marca.cenpre.json ← camada 3: submarca, sobrescreve semânticos
```

Regras, cobradas por portão:

1. A extensão **não pode redefinir** chave que exista no primitivo
   compartilhado. Se `wine.600` mudar, muda para os dois sistemas, e é
   decisão de marca. O portão lista a colisão e falha.
2. A semântica dos sites referencia qualquer primitivo, do compartilhado ou
   da extensão, pela mesma sintaxe `{wine.600}`. Hex cru é erro, como já é.
3. A camada 3 só sobrescreve semânticos, nunca cria. `marca.cenpre.json`
   troca `color.action.primary.*`, `color.surface.brand*`, `color.realce` e o
   que mais a submarca precisar; o resto herda.
4. Os portões de contraste e daltonismo rodam na semântica dos sites **e** em
   cada submarca, com os mesmos pisos do UCAMDS (4,5:1 texto, 3:1 objeto
   gráfico, ΔL ≥ 10 entre marca e destrutivo da ADR-026).

O que entra na extensão primitiva, vindo de `_tokens.scss` do CENPRE e
confirmado no site institucional:

| Grupo | Degraus | Observação |
|---|---|---|
| `magenta` | 100 a 1000 | Submarca CENPRE. Mantidos os hex do Figma; o portão mede. |
| `fontSize` display | `hero`, `page`, `section`, `section-sm` | Em `clamp()`, como o CENPRE já faz. O UCAMDS não tem escala display. |
| `space` | 40, 48, 56, 64, 80, 96 | O UCAMDS para no 16 (64px). Seção de site respira mais. |
| `container` | 1440, 1296, 820 e o gutter de 72 | Faixa, miolo, prosa. |
| `radius` | nenhum novo | `chip` 8 = `radius.md`, `card` 16 = `radius.2xl`, `pill` = `radius.full`. Mapeia, não cria. |
| `shadow` | `card-hover`, `popover`, `modal` | O UCAMDS tem `xs` a `lg`; conferir se os do Figma coincidem antes de criar. |
| `fontFamily` | `display` (Work Sans), `body` (Inter) | Ver decisão nº 2. |

O que **não** entra: um `neutral` próprio. Cada ash e charcoal do CENPRE é
mapeado para o degrau mais próximo do `neutral` do UCAMDS, e o mapa fica no
adaptador (abaixo). Se um degrau não tiver equivalente a menos de 2 pontos de
L, ele entra na extensão com o nome do papel, não da cor.

## Semântica dos sites

Os papéis que a aplicação tem e o site não, e vice-versa:

- **Superfície inversa.** O site tem seções escuras (hero, rodapé, CTA em
  charcoal). A aplicação não tem. Entra `color.surface.inverse` com os pares
  `text.on-inverse`, `border.on-inverse` e o **anel de foco sobre inverso**.
  O anel segue a ADR-048 (cinza, estado de interação, não marca); sobre
  fundo escuro o cinza é outro degrau, medido, não o mesmo.
- **Sem tema escuro.** Os sites não têm e o inventário registra que o CENPRE
  não quer. Não existe `theme.dark.json` nos sites. Se vier, é spec nova.
- **Sem subpaleta por app** (ADR-037). Isso é coisa de módulo de sistema. A
  submarca é a camada 3, que é outro mecanismo.
- **Sem `chart`, `categoria`, `notificacao`, `realce de busca`.** Papéis de
  aplicação. Não entram até um site precisar.
- **Tipografia** com dois eixos: `display` (Work Sans, pesos 600/700,
  entrelinha 1,03 a 1,12) e `body` (Inter, 400 a 600, 1,5). Corpo em 15px,
  que é o que o CENPRE usa e o que a ADR-056 adotou para as telas.

## Tipografia — decisão em aberto nº 2

Esta spec assume **Work Sans para display e Inter para corpo**, auto-hospedadas
em `dist/sites/fonts/` pelo mesmo `build-fonts` (a regra "sem CDN" vale
também aqui). Motivos: é o que o Figma "UCAM SITE" especifica, é o que os
dois sites já carregam, e um site tem voz editorial que a Geist, escolhida
para densidade de aplicação, não tem.

A alternativa é Geist nos dois sistemas, por unidade institucional. O custo é
redesenhar a escala display do Figma numa fonte que não foi desenhada para
ela. Se for essa a escolha, muda `fontFamily` na extensão e os pesos; a
escala em `clamp()` fica.

## Componentes

Contratos em `sites/spec/components/`, no **mesmo
`spec/schema/component.schema.json`** — é isso que faz o catálogo, o MCP e o
`validate-spec` servirem aos dois sem fork. O que o schema exige e um
componente de site não tem (mapa de migração do legado, por exemplo) recebe
o valor que o schema já aceita para "não se aplica".

A v1 porta as 18 peças do `cenpre-ui-kit` e acrescenta as quatro que a home
institucional precisa e o CENPRE não tem:

| Grupo | Componentes | Origem |
|---|---|---|
| Moldura | `page-shell`, `site-header`, `site-footer`, `breadcrumb` | cenpre-ui-kit |
| Hero | `hero`, `editorial-page-hero`, `hero-pill` | cenpre-ui-kit; o carrossel é comportamento do `hero`, não peça |
| Seção | `section-heading`, `editorial-cta`, `stats-band`, `logo-marquee` | cenpre-ui-kit; `stats-band` era seção de página e vira peça porque o `www` também tem |
| Cartão | `card`, `doc-card`, `step-card`, `course-card`, `testimonial` | os dois últimos são do `www` |
| Peça | `button`, `tag`, `icon-chip`, `avatar`, `accordion`, `pagination`, `input`, `newsletter-form` | `newsletter-form` é do `www` |
| Texto | `prose` | artigo do CENPRE; largura `container.prose` |

Fora da v1, registrados como lacuna: `mega-menu` (só o `www`), `course-finder`
(busca de curso com filtros), `carousel` genérico. Entram quando o `www`
entrar.

O `button` dos sites é **outro contrato** do `button` da aplicação, com os
mesmos nomes de variante (`primary`, `secondary`, `ghost`) e tamanhos
próprios (`md` 44px, `lg` 52px). Não compartilham CSS; compartilham o
vocabulário, que é o que o dev lembra.

## Saídas

| Pacote | Conteúdo | Quem consome |
|---|---|---|
| `@ucam/site-css` | `ucam-site-tokens.css` (variáveis), `_ucam-site-tokens.scss` (mapa, para a constitution do dev), `ucam-site.css` (classes `.ucam-site-*`), `marca-cenpre.css` (camada 3, opcional), fontes | WordPress de Campos; `www` enquanto Angular 18; qualquer página sem build |
| `@ucam/site-ui` | Lib Angular 22, standalone, OnPush, SCSS puro, SSR-safe, sem Tailwind | CENPRE hoje; `www` quando subir de versão |

A lib é construída em `sites/ui/` pelo mesmo caminho que `ui/` usa, e entra
no `pnpm-workspace.yaml` pelo mesmo motivo que `ui/` entrou (o `pnpm dist`
da Vercel). O site de docs passa a mostrar `/sites` como mostra `/catalogo`.

## O que muda na ferramenta

Pouco, e é o que torna a abordagem barata:

1. `build-tokens.mjs`, `validate-spec.mjs`, `check-daltonismo.mjs`,
   `check-marca-vs-destrutivo.mjs`, `build-fonts.mjs` e `build-index.mjs`
   passam a aceitar **a raiz da spec como argumento** (`--spec sites/spec`),
   com `spec/` como padrão. Hoje `const SPEC = join(ROOT, 'spec')` está
   cravado em cada um.
2. `build-tokens` aprende a ler um primitivo compartilhado **mais** uma
   extensão, e a aplicar camadas 3 nomeadas (hoje só conhece `theme.dark`).
3. Um portão novo: colisão entre extensão e primitivo compartilhado.
4. Os portões de aplicação (`check-faixa`, `check-obrigatoriedade`,
   `check-regra-anexo`, `check-subpaleta`, `build-templates`) **não** rodam
   para `sites/`. Não são parametrizados; simplesmente não são chamados.
5. `package.json` ganha `sites` (valida, gera tokens, CSS e lib dos sites)
   e o `build` chama `sites` depois de `agentes` e antes de `site`.

Nada no `pnpm run build` atual muda de resultado. Esse é o primeiro critério
de aceite.

## Adaptador do CENPRE

`sites/spec/adapters/cenpre-ui-kit.json`, no `adapter.schema.json` existente:
cada `$color-*`, `$fs-*`, `$space-*`, `$radius-*`, `$shadow-*` do
`_tokens.scss` do CENPRE aponta para o token dos sites que o substitui. É o
mapa que o dev do CENPRE segue para trocar o `_tokens.scss` dele pelo
`_ucam-site-tokens.scss`, e é a prova de que nada ficou sem lugar: o
`validate-spec` falha se um nome do kit não tiver destino.

## ADRs

Na sequência única, depois da ADR-066:

- **ADR-067** — Um segundo sistema para os sites, sobre as mesmas fundações.
  O porquê desta spec, em uma página.
- **ADR-068** — CENPRE é submarca: primeira camada 3 de marca. Registra a
  medida em OKLCH e a decisão nº 1, qualquer que seja.
- **ADR-069** — Tipografia dos sites. Registra a decisão nº 2.

## Subprojetos e ordem

| # | Subprojeto | Entrega | Critério de aceite |
|---|---|---|---|
| 1 | **Fundação compartilhada** | Ferramenta parametrizada, `sites/spec/tokens/`, extensão, submarca CENPRE, portões, `dist/sites/tokens/`, ADR-067/068/069 | `pnpm run build` do UCAMDS com o mesmo resultado; `pnpm run sites` passa daltonismo, contraste, hex cru e colisão; cada token do CENPRE tem destino no adaptador |
| 2 | Componentes v1 e `@ucam/site-css` | 22 contratos, CSS gerado, seção `/sites` no docs | Cada contrato passa o schema; o catálogo mostra os 22 com miniatura |
| 3 | `@ucam/site-ui` e a prova no CENPRE | Lib Angular 22; o `cenpre-ui-angular-scss` consome tokens e lib com zero hex cru no kit | Site do CENPRE no ar renderizando igual, medido por captura, Cypress verde |
| 4 | O `www` | Adaptador Bootstrap/M3 → tokens; mega-menu, course-finder, carousel | Fica para spec própria quando houver acesso ao repositório do `www` |

O plano de implementação que segue esta spec cobre o **subprojeto 1**. O 2
ganha plano próprio quando o 1 fechar, porque a lista de componentes depende
de a semântica estar estável.

## Testes

- **Portões**, que são os testes da spec: schema, referências, hex cru,
  contraste, daltonismo, marca × destrutivo, colisão de extensão, destino do
  adaptador.
- **Regressão do UCAMDS**: `dist/` antes e depois do subprojeto 1 comparados
  byte a byte; qualquer diferença é bug.
- **Captura** (subprojeto 3): as dez páginas do CENPRE antes e depois, pelo
  mesmo CDP que o DSUCAM usa, com o comparador de pixel.

## Fora de escopo

- Tema escuro nos sites.
- Trilho B (ZardUI) para sites.
- Subpaleta por app (ADR-037) nos sites.
- Mexer no `www` antes de ter o repositório.
- Mudar qualquer valor do primitivo compartilhado. Se o site pedir um bordô
  diferente, é decisão de marca, e passa pela ADR.

## O que o Leonardo decide antes do plano

1. CENPRE segue magenta como submarca (assumido) ou adota o bordô?
2. Work Sans + Inter (assumido) ou Geist nos dois sistemas?
3. O nome `UCAMDS Sites`, o diretório `sites/` e os prefixos `ucam-site-`.
