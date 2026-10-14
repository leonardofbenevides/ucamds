# UCAMDS Sites no saber-mais: a prova num site de verdade

Data: 14/10/2026. Segue `2026-10-10-sites-ui-design.md` (a lib `@ucam/site-ui`, completa desde 13/10 com as 25
peças do catálogo). Ocupa o lugar da "3c" daquela spec: em vez do CENPRE, a primeira prova é o saber-mais.

## O que se quer

O saber-mais (`Documents/Nova pasta/saber-mais`, Angular 22, no ar em `saber-mais-nu.vercel.app/mestrado` e
`/doutorado`) são as páginas do Mestrado e do Doutorado em Planejamento Regional e Gestão da Cidade, de
Campos. Hoje são feitas com o design system da APLICAÇÃO (`@ucam/ui` com Tailwind, empacotado na 0.1.3) e
com uns doze componentes próprios que redesenham, à mão, o que os Sites já têm: cabeçalho, topo do curso,
título de seção, acordeão, cartões de notícia, chamada, rodapé.

O Leonardo quer as duas páginas montadas com as peças dos Sites. Sucesso é:

- as páginas `/mestrado` e `/doutorado` renderizadas com `@ucam/site-ui` e `@ucam/site-css`, com o mesmo
  conteúdo e a mesma ordem de leitura de hoje;
- o que a página tem e o catálogo não tinha vira peça do catálogo, com contrato, folha, demo e forma
  Angular, e não componente local;
- as guardas e os testes do saber-mais continuam verdes, e o código do projeto deixa de ter cor e medida
  escritas à mão nas partes trocadas.

## Decisões tomadas (14/10/2026, "seguir" sobre a recomendação)

1. **Texto sobre foto vira variante, com véu de opacidade mínima fixa.** A regra dos Sites era "texto nunca
   sobre foto", porque o contraste dependeria da foto. O topo do saber-mais põe o título sobre a foto de
   Campos com um véu vinho, e fica melhor assim. A variante só existe com o véu que garante o contraste
   CONTRA QUALQUER FOTO: a opacidade do véu, na faixa onde há texto, é a mínima que mantém o texto a
   4,5:1 mesmo sobre uma foto toda branca. A conta é do build (pior caso: véu sobre branco puro), não de
   olho, e entra na lista de pares medidos.
2. **A cor da ação é a da submarca CENPRE dos Sites** (magenta.800, #922243), não o #B4365B que a página usa
   hoje: o #B4365B se confunde com o vermelho de erro para quem tem daltonismo (ADR-068). O #B4365B segue
   como cor de marca (superfície e link).

## O que entra no catálogo dos Sites

Só o que a página precisa, na ordem em que precisa:

| Peça | O que é | Na página |
|---|---|---|
| variante `--sobre-foto` de `editorial-page-hero` | foto de fundo inteira, véu da conta acima, texto à esquerda | o topo do curso |
| `fact-sheet` (ficha) | lista de chave e valor (`dl`), em uma ou duas colunas | "Ficha do Mestrado" e os números da turma |
| `section-tabs` (abas de seção) | navegação entre as partes de uma página longa, em abas que são links (`aria-current`), com rolagem horizontal no telefone | Apresentação, Pesquisa, Docentes, Estrutura, Produções, Processo seletivo |
| `timeline` (linha do tempo) | marcos com ano e texto, em lista ordenada | "A trajetória do programa" |
| `contact-card` (cartão de contato) | título, endereço, telefone e e-mail, com ícone e link de verdade (`tel:`, `mailto:`) | "Contato" |
| frase em `stats-band` | `items[].text`, opcional: o número, o rótulo e uma frase | "Por que fazer o Mestrado" |
| modificador `--destaque` em `card` | o cartão tinto, sem link, para a informação que a página quer que se veja primeiro | o cartão da Turma 2026.2 |

Cada uma passa pelo caminho de sempre: contrato, seção na folha (com os portões), demo em HTML, forma
Angular na lib com o portão de paridade, e a página `/sites/<id>` no site de docs.

Fica de fora desta spec, para quando a página de notícias e a de processos seletivos migrarem: select,
estado vazio e esqueleto de carregamento (`pagina-acervo.ts` usa `UcamSelect`, `UcamEmptyState`,
`UcamSkeleton` da aplicação).

## Como o saber-mais passa a usar os Sites

- **Pacotes.** O saber-mais consome os tarballs em `vendor/` (é como já recebe o `@ucam/ui`). Entram
  `ucam-site-css-<versão>.tgz` e `ucam-site-ui-<versão>.tgz`, gerados por `pnpm run pacotes` no DSUCAM.
- **Folha.** `@ucam/site-css/ucam-site.css` e as fontes entram em `src/styles.css`, com `data-marca="cenpre"`
  na raiz do documento. A folha da aplicação (`@ucam/css`, `@ucam/ui`) continua carregada enquanto as páginas
  de notícias e de processos a usarem; as duas não colidem (prefixos `ucam-` e `ucam-site-`, variáveis
  `--ucam-*` e `--ucam-site-*`), e o que uma delas fizer no `body` é conferido na captura.
- **Troca por componente, não por página.** Cada componente próprio é trocado pela peça dos Sites dentro do
  componente que o usa, um por vez, com a captura antes e depois. A camada de dados (`conteudo/`), as rotas
  e os testes de conteúdo não mudam. Componente local que vira só um embrulho da peça é apagado.
- **O que fica local.** O que for regra do programa e não da interface: a situação do edital, a síntese das
  publicações, a busca. A vitrine de publicações fica local até haver peça de grade com filtro.
- **Instruções do projeto.** O `AGENTS.ucam.md` do saber-mais passa a dizer que a interface pública segue o
  UCAMDS Sites, e que o MCP dos sites (3b) é a fonte quando existir.

## Fases

| Fase | Onde | Entrega |
|---|---|---|
| A | DSUCAM | a variante sobre foto, as quatro peças novas, a frase dos números e o cartão de destaque, cada um com contrato, folha, demo, forma Angular e prova de paridade; pacotes refeitos |
| B | saber-mais, branch `ucamds-sites` | as páginas de curso com as peças: cabeçalho, topo, turma, números, abas, título de seção, tópicos, acordeão, linha do tempo, notícias, contato, chamada, rodapé |
| C | saber-mais | notícias e processos seletivos, depois de select, estado vazio e esqueleto entrarem no catálogo; com isso, sai o `@ucam/ui` |

Cada fase tem plano próprio. A A vem primeiro porque a B depende das peças.

## Restrições

- **Nada é publicado.** O saber-mais tem `pnpm publicar` (deploy na Vercel): não é rodado. O projeto não tem
  remoto; os commits ficam na branch local. O DSUCAM segue sem push.
- As saídas da aplicação no DSUCAM continuam idênticas byte a byte (comparação contra a base refeita da
  main, `scratchpad/base3`).
- As guardas do saber-mais (`pnpm guardas`: um `h1` por página, nada de `style` em linha, cor crua só em
  `tema-site.css` e `casca/`) e o `pnpm conferir` passam em todo commit da fase B. A meta é a pasta `casca/`
  deixar de precisar da exceção de cor.

## Como se prova

- **Fase A:** o mesmo das fatias da lib — testes, validador, paridade HTML × Angular no navegador. Para a
  variante sobre foto, o teste da conta do véu (pior caso sobre branco) e a captura com fotos clara e escura.
- **Fase B:** captura das duas páginas antes e depois, a 390, 768, 1280 e 1440, lado a lado, pela mesma
  sonda de CDP; o texto da página (a sequência de títulos, parágrafos e links) igual antes e depois, por
  comparação automática; nenhuma rolagem horizontal; foco por teclado visível do cabeçalho ao rodapé.

## Riscos

- **Duas folhas no mesmo documento** durante as fases B e C. A da aplicação estiliza `body` e alguns
  elementos nus; a captura de cada troca pega o que vazar.
- **A cor da ação muda** (#B4365B para #922243) em todos os botões. É mudança visível, decidida acima.
- **O topo sobre foto é a primeira exceção à regra de foto.** Fica restrito a `editorial-page-hero`, com a
  conta no build; o `hero` da home continua com a foto ao lado.

## Fora de escopo

- Publicar o saber-mais, ou o DSUCAM.
- O CENPRE (fica para depois desta prova).
- Conteúdo: nenhum texto da página muda.
