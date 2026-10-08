# A lib `ucam-design-system` e o UCAMDS: diagnóstico e proposta

Lido em 05/10/2026 no commit `14d2329` (01/10) de `universidade-candido-mendes/lib-ucam-workspace`
e na documentação publicada em `universidade-candido-mendes.github.io/lib-ucam-workspace`.
Nada foi alterado no repositório.

## Resumo

A lib já usa a marcação e as classes do UCAMDS, e a moldura (faixa, navegação, grade da página)
funciona. O que não funciona vem de um ponto só: o CSS do DS foi **copiado e fatiado dentro dos
componentes**. Isso deixa a tabela sem estilo, o texto sem a fonte, e obriga a refazer a cópia a
cada mudança do DS. A proposta é carregar a folha inteira uma vez, do pacote, e deixar os
componentes só com o template.

## O que foi medido

Na documentação publicada, a 1280px, com o Chrome por CDP:

| Medida | Valor | Esperado pelo DS |
|---|---|---|
| Regras de CSS de componente presentes na página | 980 | |
| Regras que casam com algum elemento | 98 (10%) | |
| `th` dentro de `<ucam-table>`: recuo, alinhamento, fio | 1px, centrado, sem fio | recuo do token, à esquerda, com fio |
| Atributo `_ngcontent` no `th` projetado | nenhum | |
| Fonte do `body` | Times New Roman | Geist |
| Fontes carregadas (`document.fonts`) | nenhuma | Geist Variable |
| Elemento com a classe `.ucam` | não existe | raiz do escopo |
| Grade do shell, faixa, navegação | corretas | |
| Itens na navegação | 0 (a doc não chama `setMenuConfig`) | |

Duas causas:

1. **Encapsulamento.** `table.component.scss` leva as regras de `.ucam-table th`, mas o Angular
   as reescreve para `.ucam-table[_ngcontent-x] th[_ngcontent-x]`. O `<thead>` que o app projeta
   por `<ng-content>` não recebe esse atributo, então nenhuma regra de célula casa. Vale para
   qualquer componente que recebe conteúdo: `ucam-table`, `ucam-card`, `ucam-page`. Só o
   `description-list` escapa, porque já usa `ViewEncapsulation.None`.
2. **Escopo.** A folha do DS é escopada sob `.ucam` (`.ucam { font-family… }`), para conviver com
   Material e Bootstrap sem reset global. A lib não põe `.ucam` em lugar nenhum, então a família,
   a cor do texto e o `box-sizing` não se aplicam.

## O custo da cópia

`vcss.css` é uma foto do `ucam.css` de 01/10. Comparada regra a regra com a folha de 05/10:

- 1706 seletores na foto, 1681 hoje; 1627 idênticos.
- 8 mudaram (tabela 4, anexo, cartão, shell, lista de descrição).
- 71 só existem na foto e 46 só existem hoje, quase todos no shell (a regra de subpaleta por
  sistema foi reescrita).

Quatro dias, e a cópia já diverge em tabela e shell, justamente as peças fatiadas. O fatiamento por
regex (`split-css.js`) também separa regras que o DS escreve juntas: a lista de seletores que
dimensiona os ícones (`.ucam-table .ic, .ucam-btn .ic, …`) foi inteira para `table.component.scss`
e só vale onde a tabela estiver.

Outros pontos da mesma origem:

- Fontes por link direto para `ucam-ds.vercel.app/fonts/…`: o app de produção passa a depender do
  site de documentação estar no ar.
- O sprite de ícones (`icons.svg`) foi extraído de uma página por `extract-svg.js`, que lê um
  caminho da máquina do autor. É o mesmo arquivo que o DS publica em `/icons/sprite.svg`.
- `navbar.component.html` tem "SigFin", o ícone de carteira e `ucam-icon-tile--financeiro` no
  template. Outro sistema que use a lib sai com a marca do financeiro.
- Na raiz do repositório ficaram os intermediários: `vcss.css` (660 KB), `global.css`,
  `tokens.css`, `appbar.css`, `card.css`, `nav.css`, `shell.css`, `stat.css`, `table.css`,
  `desc.css`, `ucam-tokens.css` (vazio).

## Proposta

### 1. Uma folha, uma vez, do pacote

O DS empacota `@ucam/css` com tudo o que a lib hoje copia: `css/ucam.css`, `tokens/ucam-tokens.css`,
`css/ucam-fonts.css`, `fonts/*.woff2`, `icons/sprite.svg` e `tokens/_ucam-tokens.scss`.

- A lib declara `@ucam/css` como dependência e o app o carrega em `styles` do `angular.json`
  (ou a lib o reexporta como asset no `ng-package.json`).
- Os `.scss` dos componentes ficam vazios ou só com o que for da lib. Saem `vcss.css`,
  `split-css.js`, `global.css`, `_tokens.scss`, `ucam-global.scss` e os intermediários da raiz.
- `ucam-page` põe `class="ucam"` na raiz do template.

Com isso a tabela e a fonte se corrigem sem tocar em regra nenhuma, e atualizar o DS vira trocar a
versão do pacote.

### 2. Ícones e fontes de dentro do app

O sprite vem do pacote e é injetado uma vez (pelo `ucam-page` ou no `index.html` do app). As
fontes saem de `ucam-fonts.css`, que aponta para os `.woff2` do próprio pacote. Nenhum pedido a
`ucam-ds.vercel.app` em produção.

### 3. Marca do sistema por configuração

`AppConfig` já tem `title` e `subtitle`. Faltam o ícone e a categoria (`financeiro`, `academico`,
`gestao`…), que no DS decidem a subpaleta pelo atributo `data-sistema` do shell. A navbar passa a
ler os quatro de `MenuConfig.app`.

### 4. Nomes que colidem com `@ucam/ui`

O DS tem a sua lib Angular, `@ucam/ui` (Angular 21 e 22), com 45 componentes. Quatro seletores
existem nas duas: `ucam-card`, `ucam-description-list`, `ucam-select` e `ucam-stat`. Um mesmo
componente não pode importar os dois. É decisão do time, e há três saídas:

- a lib do time fica com moldura, sessão, perfil, troca de unidade, máscara e toast (o que é da
  casa) e reexporta de `@ucam/ui` as peças de interface;
- a lib do time continua dona de tudo e o DS entra só como CSS (item 1);
- as duas convivem com prefixos diferentes.

A primeira evita manter dois conjuntos de componentes para as mesmas classes.

## O que o UCAMDS precisa entregar para isso

- Publicar `@ucam/css` e `@ucam/ui` no GitHub Packages da organização. Hoje os tarballs 0.1.3
  existem só no repositório do DS e nada está em registro.
- Atualizar o site: o deploy está em 02/10, e `css/ucam-comportamento.js` (o script que dá vida a
  menu de coluna, filtro, gaveta e abas fora do Angular) ainda responde 404 lá.

## Conserto imediato, se a mudança maior esperar

`encapsulation: ViewEncapsulation.None` em `table`, `card`, `page`, `navbar` e `sidemenu`, e
`class="ucam"` na raiz do `ucam-page`. Resolve a tabela e a fonte hoje, mas mantém a cópia.

## Como repetir as medidas

```sh
# regra a regra, foto contra a folha de hoje (postcss)
node diffcss.cjs lib-ucam-workspace/vcss.css DSUCAM/dist/css/ucam.css

# documentação publicada: estilos computados, regras que casam, fontes e captura
node livedoc.mjs https://universidade-candido-mendes.github.io/lib-ucam-workspace/ saida.png 1280
```
