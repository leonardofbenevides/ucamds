# Trilho B real: as 15 telas montadas com componentes de verdade

Data: 12/09/2026. Estado: aprovado em conversa, aguardando revisão escrita.

## O problema

As 15 telas de `spec/templates.json` têm dois trilhos. O `preview` (Trilho A, HTML com
classes `ucam-*`) está completo: toda classe existe em `dist/css/ucam.css` e as telas
passam pelo validador. O `codigo` (Trilho B, Angular) é um esboço:

- usa `<ucam-page-header>` onde a tela real usa a barra de visão (`.ucam-viewbar`);
- omite abas, segmented, chips de filtro e menus que o preview tem;
- escreve classes cruas (`ucam-inbox`, `ucam-split`, `ucam-stats`, `ucam-aside`,
  `ucam-choice-grid`, `ucam-field__label`) no lugar de componentes;
- a tela Parâmetros dos setores não tem código nenhum;
- o site não mostra o `codigo` em página alguma, então a ligação tela → componente
  é invisível para quem migra.

Para o Angular ser real faltam quatro peças: `ucam-app-shell` tem contrato e nenhuma
implementação, embora toda tela dependa dele; o contrato de `page-header` declara a
variante `barra` e o Angular só desenha a variante `pagina`; `ucam-file-field` não tem
Angular; `ucam-citacao` aparece no `usa` do Requerimento em página sem contrato, e o
preview desenha a citação pegando emprestada a classe `ucam-timeline__corpo--mensagem`.

## Escopo desta rodada

1. Quatro componentes Angular: app-shell novo, page-header com variante barra,
   file-field novo, citacao novo (com contrato e CSS no Trilho A).
2. Os 15 `codigo` reescritos como a tela inteira, fiéis ao preview, só com `<ucam-*>` e
   blocos de layout declarados em `spec/layouts.json`.
3. Página de cada tela mostra o código Angular; demo viva dos quatro componentes.
4. Correções de UX no Trilho A, medidas por CDP antes e depois.

Fora do escopo: rodar as telas inteiras em Angular no site; arranjos `appbar`, `rail` e
`topo` do shell no Angular (ficam declarados como limite); multi-marca.

## Decisão 1: CSS de moldura chega ao Angular por geração (ADR-031)

O shell tem 93 classes e cerca de 3.000 linhas em `tools/build-css.mjs`, com container
queries e regras de sticky. Espelhar isso à mão num bloco `styles:` (como `ucam-tabs`
faz com 40 linhas) viola a regra do `spec/README.md`: informação em dois lugares, um
está errado. Exigir que o app Angular carregue `@ucam/css` quebra a promessa de que app
novo importa só `@ucam/ui`.

Mecanismo:

- `build-css.mjs` continua gerando `dist/css/ucam.css` inteiro. Depois de montar a
  string, recorta os blocos pelos marcadores de seção que já existem
  (`/* ===== SHELL === */`, `ARRANJO LATERAL`, `BARRA DE VISÃO`, mais os blocos novos
  de file-field e citação) e grava `dist/css/blocos/<nome>.css`. O recorte é por
  marcador, não por cópia: mexeu no bloco, muda nos dois destinos.
- `sync-ui.mjs` copia cada bloco para a lib como
  `ui/projects/ui/src/lib/ucam/<componente>/<componente>.generated.css`, do mesmo jeito
  que copia os tokens. Arquivo gerado não se edita; o cabeçalho diz de onde veio.
- O componente Angular usa `styleUrl` apontando para o gerado, com
  `ViewEncapsulation.None`, e escreve as MESMAS classes `ucam-*` do Trilho A no template.
  A paridade entre trilhos vira consequência, não prova.
- `ucam.css` não é escopado sob `.ucam` (só 9 seletores começam por `.ucam `), então o
  bloco copiado funciona sem classe de escopo no host.
- Bloco que não existe em `dist/css/blocos/` falha o `sync-ui`, com a mesma mensagem
  dos tokens ("rode pnpm run css").

Dentro do site, o `componentes.css` global já traz as mesmas regras; a duplicação é
idêntica e inofensiva. Num app consumidor só o gerado existe.

## Decisão 2: o arranjo lateral é o padrão do shell (ADR-030)

O contrato de `app-shell` diz `shellLayout` default `'appbar'` e, no mesmo campo,
descreve `lateral` como "o padrão para tela de trabalho densa". Catorze das quinze
telas usam `lateral`; a décima quinta (login) usa a moldura sem navegação. Um padrão
que nenhuma tela usa não é padrão. O default passa a `'lateral'`. O Angular implementa
`lateral`; `appbar`, `rail` e `topo` continuam existindo no Trilho A e ficam como limite
declarado do Trilho B, na seção `limites` do contrato.

## Seção 1: componentes Angular

### `ucam-app-shell` (novo)

Entradas que já estão no contrato: `systemName`, `context`, `contextLabel`,
`contextOptions`, `user`, `favorites`, `navMode`, `navSearchable`, `searchable`,
`searchShortcut`, `maxContentWidth`, `navWidth`, `navCollapsible`, `navCollapsed`,
`appbarAppearance`, `shellLayout`.

Entradas que o Trilho A já tem e o contrato não declara, e que entram nele:

| Entrada | Tipo | Para quê |
|---|---|---|
| `nav` | `UcamNavGroup[] \| null` | Grupos e itens da navegação. `null` suprime a coluna e a mobilebar: é o login. |
| `active` | `string \| null` | id do item ativo (pode ser subitem). |
| `navAction` | `{ label; icon?; href } \| null` | A ação primária no alto da coluna (Novo requerimento). |
| `navFooter` | `UcamNavItem[]` | Pé da coluna: configurações, ajuda. |
| `notifications` | `number \| null` | Contagem no sino; `null` não emite o sino. |
| `homeLink` | `string \| null` | Destino da marca. `null` vira `<span>`. |
| `searchGroups` | `UcamSearchGroup[]` | O que a busca global acha, além dos destinos do menu, que o shell deriva sozinho. |

Tipos: `UcamNavItem { id; label; icon?; href?; count?; items?: UcamNavItem[] }`,
`UcamNavGroup { id; label; items }`, `UcamSearchGroup { id; label; icon?; items: { label; meta?; icon?; href? }[] }`.

Saídas: `contextChange(string)`, `signOut()`, `unpin(UcamNavItem)`, `search(string)`.
Nenhum nome coincide com evento do DOM (ADR-018).

Comportamento, que é o que o CSS não entrega:

- abaixo de 64rem: botão da mobilebar abre a navegação (`data-nav="open"` na raiz),
  Esc fecha, foco fica dentro da coluna enquanto aberta e volta ao gatilho ao fechar,
  `aria-expanded` acompanha;
- recolher a coluna (`ucam-shell--nav-recolhida`), com a escolha persistida em
  `localStorage` sob a chave `ucam.nav.collapsed`, vencendo `navCollapsed` a partir da
  segunda visita, como o contrato descreve;
- menu da conta (avatar → nome, campus, Meus dados, Sair) com `signOut`;
- busca global: campo com atalho `/` quando `searchShortcut` é `'/'`, painel que filtra
  ao digitar sobre `searchGroups` mais os destinos do `nav`, emitindo `search`;
- skip-link como primeiro focável, apontando para `#conteudo`.

Conteúdo projetado: o filho padrão vai para `.ucam-main`. Slot `[rodape]` para
`.ucam-shell__footer`.

### `ucam-page-header`: variante barra

| Entrada | Tipo | Notas |
|---|---|---|
| `variant` | `'page' \| 'bar'` | Substitui `variante: 'pagina' \| 'barra'` do contrato. Todo prop da lib é em inglês; este era o único fora. |
| `meta` | `string \| null` | Texto após o título, esmaecido, separado por ponto: "· Revisão de nota". |
| `titleHidden` | `boolean` | Título só para leitor de tela. É a Caixa de entrada, cuja barra abre nas abas. |

Slots por `select`: `[ferramentas]` (terceira fileira: abas, segmented, botão de
filtros, menu) e `[filtros]` (fileira condicional dos chips aplicados; só é emitida
quando há conteúdo projetado). O conteúdo padrão continua sendo as ações à direita do
título. `breadcrumb`, `backLink`, `count`, `favorite` e `sticky` já existem e valem
nas duas variantes; na barra o sticky é sempre ligado, porque o contrato diz que a
barra gruda.

Na variante `bar` o template emite `.ucam-viewbar` com as fileiras
`ucam-viewbar__fileira--trilha`, a do título e `--filtros`, e o CSS vem do bloco gerado
BARRA DE VISÃO. Na variante `page` nada muda.

### `ucam-file-field` (novo)

Segue `spec/components/file-field.json` como está: `label`, `accept`, `maxSize`,
`multiple`, `max`, `hint`, `required`, `readonly`, `disabled`, `disabledReason`,
`files` (two-way), saídas `rejected`, `remove`. Valida formato, tamanho e quantidade no
cliente antes de emitir `filesChange`; o que não passa vai em `rejected` com motivo.
Estado de arrasto por `data-sobre-o-alvo` na raiz. Markup com as classes
`ucam-file-field*` do contrato e CSS do bloco gerado.

### `ucam-citacao` (novo, com contrato)

Bloco de texto citado: a mensagem de quem abriu o requerimento, lida fora da timeline.

- Contrato `spec/components/citacao.json`, categoria `conteudo`, status `draft`.
  Anatomia: `root (ucam-citacao)`, `texto`, `autor (ucam-citacao__autor)`,
  `meta (ucam-citacao__meta)`. Props: `author: string | null`, `meta: string | null`.
  Sem eventos. Evidência: Requerimento em página, onde o preview usa a classe da
  timeline para desenhar isto.
- Trilho A: bloco `.ucam-citacao` em `build-css.mjs` (blockquote em surface-subtle,
  filete à esquerda, sem raio, sem sombra). O preview do Requerimento em página passa a
  usá-lo. A timeline não muda.
- Demo em `demos.json`; demo viva no catálogo.

## Seção 2: spec e validação

- `app-shell.json`: props novos da tabela acima, saída `search`, `shellLayout` default
  `'lateral'`, `implementacao.trilho_b` preenchida, limite dos arranjos não
  implementados.
- `page-header.json`: `variante` → `variant` (`'page' | 'bar'`), `meta`, `titleHidden`;
  anatomia ganha `ferramentas` e `filtros` como slots com a classe do Trilho A.
- `citacao.json` novo. `demos.json` ganha `citacao` e um exemplo de barra em
  `page-header`.
- `adr.json`: ADR-030 e ADR-031.
- `templates.json`: os 15 `codigo` reescritos. Regras:
  - o código é a tela inteira, do `<ucam-app-shell>` ao rodapé, com os mesmos dados
    do preview;
  - só `<ucam-*>` com contrato; classe crua permitida só se for raiz de bloco de
    `layouts.json` (`ucam-stack`, `ucam-cluster`, `ucam-grid`, `ucam-split`,
    `ucam-section`, `ucam-content`, `ucam-inbox`, `ucam-stats`) ou modificador dela;
  - `usa` é exatamente o conjunto de seletores instanciados no `codigo` mais os que
    só o preview usa (o `usa` é a união dos trilhos, como o validador já documenta);
  - `ucam-citacao` entra no `usa` e no preview do Requerimento em página.
- `validate-spec.mjs`, seção 4c: toda `class="ucam-…"` no `codigo` que não é bloco de
  layout **falha**; seletor no `codigo` fora do `usa` passa de aviso a **falha**.
  Ambos testados por regressão provocada.

## Seção 3: site

- `telas/[projeto]/[id].page.ts`: seção "Código Angular" abaixo das decisões da tela,
  reaproveitando `ucam-demo-painel` com `{ codigo }` (sem preview, só a aba Código).
  `build-index.mjs` já repassa `codigo`; o tipo `Tela` já o declara.
- `demo-viva.component.ts`: casos `app-shell` (moldura reduzida com navegação de três
  grupos, conta e busca; botão que simula a largura estreita para provar abrir/fechar),
  `page-header` passa a mostrar as duas variantes, `file-field` (com um arquivo
  recusado por tamanho) e `citacao`. `TEM_DEMO_VIVA` atualizado.
- O guia de migração deriva a lista de contratos sem Angular; encolhe sozinho.

## Seção 4: UX do Trilho A

Medidas por CDP em claro e escuro, 1180 e 390, com captura antes e depois em
`scratchpad/`:

1. Cálculo de mensalidade: o interruptor Registrar boleto sai da linha do select
   Agência e vai para a própria fileira, acima do select que ele condiciona.
2. Naturezas: o checkbox do cabeçalho não mostra seleção parcial sem linha marcada.
   Se o preview quer mostrar a barra de lote, marca duas linhas visíveis; senão, o
   cabeçalho fica desmarcado.
3. Analytics: De/Até vira `fieldset` com legenda Período, no mesmo arranjo do
   Ingresso entre dos relatórios.
4. Parâmetros dos setores: medir em 1440 se o inspetor fica ao lado da tabela. Se sim,
   o empilhamento em 1180 é o piso da ADR-028 e fica; se não, é defeito e se corrige.
5. O que a varredura escura e estreita mostrar de quebrado, cada item registrado com
   a medida.

## Seção 5: verificação

- `pnpm run validate` passa com as regras novas; a regressão provocada de cada regra é
  registrada no cabeçalho da seção do validador.
- `pnpm --dir ui run build` compila; `ng test` roda os specs novos:
  app-shell (abrir/fechar abaixo de 64rem, Esc, foco, `aria-expanded`, persistência do
  recolher), page-header (variante `bar` emite as fileiras certas; `titleHidden` põe o
  título em `sr-only`; slot `[filtros]` vazio não emite fileira), file-field (recusa por
  formato, tamanho e quantidade; `max` desabilita o gatilho), citacao (renderiza autor e
  meta).
- `pnpm build` inteiro passa; `pnpm --dir site run build` publica.
- Prova por CDP, depois de hidratado: demo viva do app-shell abre e fecha a navegação;
  barra do page-header gruda ao rolar; paridade de tinta entre `.ucam-viewbar` do Trilho
  A e a barra Angular, pelo padrão de overlay descrito na memória de prova no navegador.
- Captura antes/depois de cada correção da Seção 4.

## Ordem de execução

1. Blocos gerados: `build-css.mjs` recorta, `sync-ui.mjs` copia, bloco de citação e
   marcadores novos.
2. Contratos, ADRs, demos.
3. Angular, cada um com teste antes: citacao, page-header barra, file-field, app-shell.
4. Demo viva e seção de código na página da tela.
5. Reescrita dos 15 códigos e regras novas do validador.
6. UX do Trilho A com medidas.
7. Build completo, provas por CDP, notas de memória.

## Riscos e como lidar

- **Sessões paralelas no mesmo repositório.** Outra sessão gerou `docs/t/` hoje às
  21:40. Toda edição por script lê e grava no mesmo instante; build quebrado é
  investigado antes de assumir que é nosso.
- **Hidratação do Analog.** Prova de interação só depois de ~2,5 s; medir antes lê o HTML
  pré-renderizado.
- **`forcePseudoState` não reavalia `:has()`.** Estado que casa no pai se prova com
  evento de ponteiro.
- **Sem git no repositório.** Não há commit; a spec e o plano ficam em
  `docs/superpowers/`.
