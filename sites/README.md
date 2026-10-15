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
- Texto nunca assenta sobre foto, salvo no hero de página `--sobre-foto` (14/10/2026). No hero da home e na CTA a imagem só aparece com `--com-foto`, a partir de 1024px, na metade sem texto. No hero de página sobre foto, o véu fica entre a foto e o texto, com a opacidade `opacity.photo-scrim` (0,7): a menor que deixa o texto a 4,5:1 sobre uma foto toda branca, nas duas marcas. A conta é do build (`piorCasoSobreFoto`).

    pnpm run sites           tokens, fontes, folha, espelho de estados, validação, índice e demos Angular
    pnpm run test:tools      prepara dist/sites e roda a suíte da ferramenta
    pnpm run test:sites-ui   roda os testes da lib Angular (vitest)
    pnpm run lib:sites       constrói @ucam/site-ui em sites/ui/dist

## A fase A do saber-mais (14/10/2026)

A primeira prova num site de verdade: as páginas de Mestrado e Doutorado do saber-mais. Spec em `docs/superpowers/specs/2026-10-14-saber-mais-sites-design.md`, plano em `docs/superpowers/plans/2026-10-14-saber-mais-fase-a.md`.

- Quatro peças novas, com contrato, folha, demo e forma Angular: `fact-sheet` (a ficha, uma `dl` em uma ou duas colunas), `section-tabs` (as abas de uma página longa, links com `aria-current`, que rolam de lado no telefone), `timeline` (ano, título e frase opcional) e `contact-card` (endereço, telefone em `tel:`, e-mail em `mailto:`).
- Três variantes: o hero de página sobre foto (`image`), a frase nos números (`items[].text`) e o cartão de destaque (`featured`, só sem link, com os pares de texto sobre a lavagem no portão).
- O ícone `phone` entrou no conjunto compartilhado.
- Sobre foto, todo texto do hero usa a tinta cheia (`on-inverse`), que é a que a conta do véu mede: a apagada dava 4,29:1 na base e 3,36:1 na CENPRE sobre foto branca. A pílula ganha o fundo opaco da cor do véu. A frase nos números usa a tinta de corpo, e não a de apoio que o plano dizia: é texto para ler, não legenda.
- As fotos das demos moram em `sites/spec/fotos/` e o site as serve em `/sites/fotos/`.

## A lib Angular (`sites/ui`, completa: fatias 3a-1, 3a-2 e 3a-3, 13/10/2026)

`@ucam/site-ui` é uma casca fina sobre a folha: nenhuma peça tem estilo próprio. Cada uma é uma diretiva ou um componente de seletor de ATRIBUTO sobre o elemento nativo do contrato, e só aplica as classes de `@ucam/site-css`.

    <a ucamSiteButton variant="secondary" href="/vagas">Ver todas</a>
    <header ucamSiteSectionHeading eyebrow="Carreiras" heading="Vagas e oportunidades"></header>

- As 29 peças do catálogo (25 até a 3a-3, mais as quatro da fase A do saber-mais: fact-sheet, section-tabs, timeline e contact-card). Base: button, tag, icon-chip, avatar e section-heading. Moldura e formulário: breadcrumb, page-shell, accordion, input (o campo), pagination, newsletter-form, site-header e site-footer. Hero, seções, cartões e prosa: hero, editorial-page-hero, hero-pill, editorial-cta, stats-band, logo-marquee, card, course-card, doc-card, step-card, testimonial e prose.
- **Dado ou conteúdo.** Texto curto e lista entram como entrada (`heading`, `items`, `logos`). O que é livre é conteúdo de quem usa, marcado por uma diretiva da parte: as pílulas e as ações do hero (`ucamSiteHeroPills`, `ucamSiteHeroActions`), as tags do cartão (`ucamSiteCardMeta`), o HTML da prosa. Cada conteúdo condicional vai no seu próprio `@if`: o Angular não projeta por `select` um `@if` com vários nós (ele cai no encaixe geral, no fim).
- **Foto e modificador juntos.** No hero e na CTA, a entrada `image` desenha a foto, o véu e o modificador que guarda a metade do texto.
- **Eventos no contrato.** As saídas (`openChange`, `pageChange`, `submitted`) estão no campo `eventos` dos contratos e na página de cada peça; o validador as confere contra o arquivo, nos dois sentidos. Mais `<svg ucamSiteIcon="nome">` e `provideUcamSite({ sprite })`.
- O que a lib faz além do CSS: o menu do cabeçalho fecha por Esc (devolvendo o foco), ao clicar fora e ao seguir um link; o acordeão tem `[(open)]`; o campo liga rótulo, apoio e erro por id; a paginação calcula a janela de páginas; a newsletter confere o e-mail, avisa por `submitted` e mostra o estado que recebe.
- **Sem `@angular/forms`.** O erro do campo tem uma fonte só, a entrada `error`. Com formulário reativo: `[error]="c.touched && c.invalid ? 'Informe o e-mail.' : null"`.
- **Contrato e lib falam os mesmos nomes.** O `trilho_b` diz o destino de cada prop: `Entradas` (as `input()`), `Nativos` (atributo do próprio elemento, como `href`) e `Conteúdo` (o que vai dentro). O validador cruza nos dois sentidos, e reprova entrada com nome de atributo nativo.
- **Ids pela ligação.** A demo aparece três vezes na página da peça; a forma Angular usa ids com `-ng`, o lado HTML do par ganha `h-`, e o portão compara para onde cada `for` e `aria-describedby` aponta, não o nome.
- A lib declara Angular 22, que é o que ela testa.
- O consumidor importa a folha uma vez (`@ucam/site-css/ucam-site.css`); a lib pede a folha na mesma versão.
- **Portão de paridade**, em três camadas. O teste compara a árvore de DOM da peça com a demo em HTML. O validador confere que `implementacao.trilho_b` aponta para arquivo, seletor e entradas que existem. A página `/sites/<id>` mostra as duas formas lado a lado, e uma sonda por CDP mede caixa e estilo.
- A forma Angular de cada demo vive em `sites/spec/demos.json`, no campo `angular`. Um gerador (`tools/build-sites-ui-demos.mjs`) a transforma nos componentes que o teste e o site usam: o código documentado é o código testado.
- **Peças em linha vão dentro de `.ucam-site-fileira`.** O Angular tira o espaço entre dois elementos ao compilar o template: dois botões irmãos ficavam encostados na lib e com 4px no HTML. A fileira separa por `gap`, e as duas formas saem iguais. As demos compilam como o template do consumidor.
- **O que não está no template não é hidratado.** O ícone criava o `<use>` por Renderer2 e o cliente o duplicava ao hidratar. Toda peça que desenha nó o faz no template; `testing/hidrata.spec.ts` renderiza no servidor, hidrata no cliente e conta os nós.
- As entradas são tipadas pelo contrato: `variant="outline"` não compila. Em tempo de execução, valor fora do contrato cai no padrão.
- O portão conta todo atributo, menos o andaime do Angular e as entradas da própria peça (lidas do `trilho_b`).

## Pendências

- 3b: o kit de agentes (MCP) servindo os sites. 3c: a prova no CENPRE, em spec própria.
- **Endereço só de consulta ou só de âncora não serve num app Angular.** `?pagina=2` e `#conteudo` resolvem contra o `<base href>`, e levam para a home. A paginação monta o endereço a partir do atual (ou de `hrefDe`), e o link de salto trata o clique.
- Do que a revisão da 3a-2 deixou, menor: `<select>` e `<textarea>` dentro do campo ficam com o rótulo apontando para um id que ninguém tem (falta aviso em modo de desenvolvimento); o botão da newsletter fica `disabled` durante o envio e pode perder o foco; a seta sem destino da paginação é um `<a>` sem papel com `aria-disabled` (vem do contrato em HTML); o título das colunas do rodapé é sempre `<h2>`; os exemplos dentro dos contratos não são conferidos contra as demos; o validador só reconhece `selector` entre aspas simples; nada foi rodado em Safari, Firefox nem com leitor de tela.
- Do que a 3a-2 deixou: a marca do cabeçalho e do rodapé é texto (falta a imagem, quando houver arquivo de marca dos sites); a página de cada peça repete ids entre o preview, a anatomia e a grade de estados, fora do par de paridade.
- **A foto do hero e da CTA é baixada no celular e nunca aparece.** A folha a esconde abaixo de 1024px, mas o navegador busca o arquivo. A saída é `<picture>` com `media`, mudando o contrato em HTML e a lib juntos; fica para uma revisão do contrato.
- Do que a revisão da 3a-3 deixou, menor: o número do passo é passado à mão (um contador na folha o dispensaria); `modality` do curso é união fechada no contrato e texto livre na lib; `heading` é só texto, sem ênfase nem quebra; conteúdo interativo posto dentro do cartão fica sob o link do título; as demos Angular usam `href="#"`, que num app com `<base href>` leva para a home.
- Do que a 3a-3 deixou: os logos das demos apontam para arquivos que o site de docs não tem (`/empresas/*.svg`), então o par mostra o quadro vazio (as fotos foram resolvidas na fase A do saber-mais); a pílula do hero não quebra linha e estoura numa coluna estreita; o título dos cartões de curso, de documentos e do passo é sempre `<h3>`.
- A página de componente dos sites é cópia da do catálogo; extrair o que é comum é dívida registrada na spec.
- Da fase A do saber-mais: a linha das abas de seção só rola até a atual na lib, o HTML puro começa no início; o peso da aba atual muda a largura dela ao trocar; o fio da linha do tempo é sutil (cor de borda padrão); a sonda mediu o véu com a foto de Campos e com branco puro, não com uma foto de céu claro inteiro.
- Da revisão da fase A, menor: o hero de página com `width="prosa"` e foto aperta o título a cerca de 21rem na grade completa; palavra longa sem quebra pode passar da metade do texto para a parte em que o véu desvanece; as abas não recusam href só com hash, a regra está só no contrato.
- Testes que dependem de tempo falham de vez em quando com a máquina carregada: os dois de toggle do acordeão (desde a 3a-1) falharam uma vez em 14/10/2026, sem reproduzir em seis rodadas seguidas.
- Só foi provado no Chrome. Falta conferir no Safari o campo de busca, o `<summary>` em flex e se a lista de passos (`role="list"`) é anunciada como lista no VoiceOver.
- Menores que a revisão da 2c deixou: a prosa não cobre h4, tabela, código nem lista aninhada; peça do sistema dentro da prosa herda o estilo de link; a foto escondida do hero ainda é baixada no telefone (falta `<picture>` com `media`); o cartão sobre seção escura não troca o anel de foco.
