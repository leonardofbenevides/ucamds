# UCAMDS Sites, subprojeto 3: a lib Angular `@ucam/site-ui`

Data: 10/10/2026. Segue `2026-10-08-ds-dos-sites-design.md` (a spec-mãe) e
`2026-10-08-sites-catalogo-design.md` (o catálogo, fechado em 09/10 com 25
peças em CSS puro).

## O que se quer

O dev do CENPRE escreve Angular 22. Hoje ele tem duas opções ruins: manter o
`cenpre-ui-kit` (18 peças, SCSS próprio, hex e tokens do kit) ou copiar HTML
com classes `.ucam-site-*` à mão. O subprojeto 3 dá a terceira: importar
`@ucam/site-ui` e escrever `<ucam-site-accordion>`, com o mesmo resultado
visual do catálogo e com o comportamento que CSS puro não entrega.

Sucesso é: as 25 peças têm forma Angular, cada uma renderiza o MESMO DOM e as
MESMAS classes da demo do catálogo (medido), e o que os contratos hoje listam
como "não entrega" passa a ser entregue pela lib.

O que o Leonardo disse: "seguir" no roteiro. O resto abaixo é recomendação
minha, e as decisões abertas estão no fim.

## O subprojeto 3 são três, e esta spec cobre o primeiro

A spec-mãe pôs numa linha só "lib Angular e a prova no CENPRE". São três
trabalhos com riscos diferentes:

| Parte | O que é | Onde | Estado |
|---|---|---|---|
| 3a | A lib `@ucam/site-ui` | este repositório, `sites/ui/` | **esta spec** |
| 3b | O kit de agentes servindo os sites (MCP, CLI, skills) | este repositório, `tools/agentes/` | desenho curto abaixo; plano próprio depois da primeira fatia da 3a |
| 3c | A prova no CENPRE | **outro repositório**, com dono e constitution próprios | spec própria, só depois de a lib existir e de o Leonardo dizer como falar com o dev |

A 3c não começa por inércia: mexe em código de outra pessoa e em um site no
ar.

## Abordagem

Três caminhos:

1. **Casca fina sobre a folha (recomendado).** A lib não tem estilo próprio.
   Cada peça Angular monta o DOM do contrato e aplica as classes de
   `@ucam/site-css`. A aparência tem uma fonte só, a folha gerada da spec. A
   lib acrescenta entradas tipadas, composição e comportamento.
2. **Componentes com SCSS encapsulado**, como o `cenpre-ui-kit` faz hoje. Cada
   peça carrega o seu estilo. É o que o dev já conhece, mas duplica a folha em
   25 arquivos, e as duas cópias divergem na primeira correção.
3. **Web components.** Serviriam também ao WordPress de Campos, mas lá o CSS
   já basta, e no CENPRE custariam SSR e formulários.

Vai a 1. É a mesma relação que o Trilho B da aplicação deveria ter com o
Trilho A, sem a camada de Tailwind no meio, que a constitution do CENPRE
proíbe.

## Arquitetura

- **Lugar:** `sites/ui/`, um workspace Angular como `ui/`, com ng-packagr.
  Entra em `pnpm-workspace.yaml` pelo mesmo motivo do `ui/`.
- **Pacote:** `@ucam/site-ui`. Dependências de par: `@angular/core` e
  `@angular/common`, na 22 (corrigido na fatia 3a-2: sem `@angular/forms`, e a
  lib declara a versão que testa). Sem CDK, sem Tailwind, sem
  biblioteca de ícones, sem `@angular/router`.
- **Estilo:** nenhum arquivo de estilo na lib. O consumidor importa
  `@ucam/site-css/css/ucam-site.css` uma vez. A lib declara `@ucam/site-css`
  como dependência de par, na mesma versão.
- **Toda peça:** standalone, `OnPush`, entradas por `input()`, saídas por
  `output()`, `ViewEncapsulation.None` e sem `styles`.
- **SSR e SSG:** nada toca `window` ou `document` na construção. O
  comportamento liga em `afterNextRender`. O HTML que sai do servidor já é o
  do contrato, e funciona sem script porque a folha foi feita assim
  (`<details>`, link esticado).
- **Links:** a lib não importa o roteador. Onde a peça tem link, o consumidor
  projeta o seu `<a routerLink>` ou passa `href`. Site estático precisa de
  `<a href>` de verdade.
- **Ícones:** `<ucam-site-icon name="arrowRight">` desenha
  `<svg class="ic"><use href="…#i-arrowRight">`. O endereço do sprite vem de
  um provedor (`provideUcamSite({ sprite: '/icons/sprite.svg' })`), com o
  sprite em linha como padrão.

### Diretiva ou componente

**Corrigido na fatia 3a-1 (10/10/2026): toda peça tem seletor de ATRIBUTO sobre o elemento nativo do contrato**, inclusive as que têm template (`header[ucamSiteSectionHeading]`, não `<ucam-site-section-heading>`). Um elemento hospedeiro próprio seria uma caixa a mais no DOM: quebraria a paridade exata e tiraria a semântica de `header`, `nav` e `footer`. O que segue vale com essa correção: onde se lê "componente" com nome de elemento, leia-se componente de seletor de atributo.

A regra é do DOM, não do gosto:

- **Diretiva de atributo** quando a peça é UM elemento que o consumidor
  escolhe: `a[ucamSiteButton]` e `button[ucamSiteButton]`, `[ucamSiteTag]`,
  `[ucamSiteIconChip]`, `[ucamSiteAvatar]`, `[ucamSiteHeroPill]`,
  `[ucamSiteProse]`, `input[ucamSiteInput]`. É o que o kit do CENPRE já faz
  com `appButton`, e mantém `routerLink`, `type` e `disabled` nativos.
- **Componente** quando a peça é uma estrutura: accordion e item, pagination,
  field, newsletter-form, breadcrumb, section-heading, page-shell,
  site-header, site-footer, hero, page-hero, cta, stats, marquee, card,
  course-card, doc-card, steps e step, testimonial.

O campo `selector` de cada contrato passa a dizer a forma real
(`[ucamSiteButton]` ou `ucam-site-accordion`), como no catálogo da aplicação.

### O que a lib entrega além do CSS

Só o que os contratos já listam como "não entrega" ou "limite":

| Peça | Comportamento |
|---|---|
| site-header | Esc fecha o menu e devolve o foco ao botão; fecha ao navegar e ao clicar fora |
| accordion | `open` e `openChange` por item (`[(open)]`). **Corrigido na fatia 3a-2:** a animação de altura é da folha, por `interpolate-size`, onde o navegador entrega; vale também para o HTML puro |
| field e input | Liga rótulo, apoio e erro por `id` e `aria-describedby`. **Corrigido na fatia 3a-2:** sem `@angular/forms`. Importar `NgControl` obrigaria todo consumidor a instalar o pacote; o erro tem uma fonte só, a entrada `error`, e com texto o campo fica inválido |
| newsletter-form | Estados enviando, sucesso e erro, anunciados em região viva |
| logo-marquee | Recebe a lista uma vez e duplica sozinho, com a segunda cópia inerte; pausa por `<button aria-pressed>` no lugar da caixa |
| pagination | Calcula a janela de páginas com reticências; `hrefDe(pagina)` para link real e `pageChange` para quem pagina em memória |
| breadcrumb | Recebe a trilha como dado e marca a página atual |

Fora: carrossel, mega-menu, busca de curso (são do `www`), validação de regra
de negócio, e qualquer peça que não esteja no catálogo.

A folha pode ganhar classes novas quando a lib precisa de um gancho que o CSS
puro não tinha (o botão de pausa, por exemplo). Cada uma entra no contrato da
peça.

## O portão de paridade

É o que impede a lib de virar uma segunda verdade. Três camadas:

1. **Teste de unidade (vitest, como `ui/`):** cada peça renderizada com as
   entradas da demo do catálogo produz, depois de normalizado, a mesma árvore
   de elementos e classes do `preview` em `sites/spec/demos.json`. A
   comparação ignora comentários do Angular, atributos `_ng*` e a ordem das
   classes. Onde a lib diverge de propósito (o botão de pausa), o contrato
   declara a divergência e o teste a lê de lá.
2. **Validador:** `tools/validate-sites-spec.mjs` passa a exigir
   `implementacao.trilho_b` (arquivo, seletor, entradas) nas peças que a lib
   cobre, e confere que o arquivo existe e exporta o seletor. Peça com
   `trilho_b` sobe de `draft` para `review`.
3. **Navegador:** a página `/sites/<id>` mostra a peça Angular ao lado da
   peça em HTML, e uma sonda por CDP compara caixa e estilo computado das
   duas em 390, 768, 1024, 1280 e 1440. Tolerância zero em caixa.

A demo de cada peça ganha a forma Angular no campo **`angular`**, ao lado de
`codigo` (corrigido na fatia 3a-1: `codigo` continua sendo o HTML, porque o
validador cobra as classes nele), e o painel de demo ganha a aba Angular.
`implementacao.trilho_b` é TEXTO, como o schema compartilhado define, no
formato `<arquivo> — <seletor>. Entradas: a, b.`

## Ferramenta e saídas

- `pnpm run lib:sites` constrói `sites/ui/dist`. O `dist` da publicação o
  chama depois de `sites`.
- `tools/build-pacotes.mjs` ganha `siteUi()`, ao lado de `siteCss()`.
- O site de docs resolve `@ucam/site-ui` para o fonte, como já faz com
  `@ucam/ui`.
- **Restrição de sempre:** as saídas da aplicação (`dist/tokens`, `dist/css`,
  `dist/fonts`, `spec.data.json`, `estados.css`) continuam idênticas byte a
  byte. `@ucam/site-css` só muda onde esta spec diz.

## Fatias

Cada uma com plano próprio, revisão por subagente e mescla, como no catálogo.

| Fatia | Conteúdo |
|---|---|
| 3a-1 | Workspace, pacote, provedor, ícone, o portão de paridade (as três camadas) e as cinco peças de base: button, tag, icon-chip, avatar, section-heading. Docs com o alternador HTML / Angular |
| 3a-2 | As peças com comportamento: accordion, pagination, field e input, newsletter-form, breadcrumb, page-shell, site-header, site-footer |
| 3a-3 | As doze da fatia 2c: hero, page-hero, hero-pill, cta, stats, marquee, card, course-card, doc-card, steps, testimonial, prose |

A 3a-1 é a que prova a abordagem. Se a paridade por árvore de DOM se mostrar
frágil nas cinco primeiras peças, a spec volta antes de as outras vinte
entrarem.

## 3b em uma página: o kit de agentes

`tools/agentes/nucleo.mjs` crava `spec/`, o prefixo `ucam-` e os dois trilhos.
A recomendação é **um servidor só**, com o sistema como parâmetro: as
ferramentas de componente (listar, obter, buscar, validar HTML) ganham
`sistema: 'app' | 'sites'`, com `'app'` como padrão, e leem
`site/src/generated/sites.data.json` para os sites. Padrões de tela e telas de
referência continuam só da aplicação. Um servidor porque quem trabalha no
CENPRE configura um MCP, não dois. O plano vem depois da 3a-1, quando o
`trilho_b` dos contratos existir para ser servido.

## Testes

- Unidade: classes aplicadas por entrada, paridade de árvore com a demo, e
  cada comportamento da tabela acima (Esc, foco devolvido, `aria-invalid`,
  janela da paginação, segunda cópia inerte).
- Render no servidor: cada peça passa por `renderToString` sem tocar o
  navegador, e o HTML que sai já tem as classes.
- Ferramenta: validador com e sem `trilho_b`, pacote com os arquivos certos.
- Navegador: a sonda de paridade.

## Decisões abertas para o Leonardo

1. **Um seletor por peça ou compatível com o kit?** Recomendo nomes novos
   (`ucamSiteButton`, `ucam-site-header`) e uma tabela de troca no adaptador.
   Manter `appButton` daria migração sem tocar em template, mas prende a lib
   ao nome de um projeto.
2. **A 3c é feita por mim ou pelo dev do CENPRE?** Recomendo um pull request
   de prova numa página só (Orientações de estágio), para o dev avaliar, em
   vez de migrar o site inteiro.
3. **Publicação do pacote.** Hoje `@ucam/site-css` sai pelo mesmo caminho dos
   outros (`pnpm dist`). A lib segue igual, sem registro npm, a menos que você
   diga o contrário.

## Fora de escopo

- O `www` (subprojeto 4) e as peças que só ele pede.
- Tema escuro nos sites.
- Trocar o `cenpre-ui-kit` (é a 3c).
- Extrair o que é comum entre `sites/[id].page.ts` e a página do catálogo,
  dívida já registrada.
