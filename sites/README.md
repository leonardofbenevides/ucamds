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

    pnpm run sites           tokens, fontes, folha, espelho de estados, validação, índice e demos Angular
    pnpm run test:tools      prepara dist/sites e roda a suíte da ferramenta
    pnpm run test:sites-ui   roda os testes da lib Angular (vitest)
    pnpm run lib:sites       constrói @ucam/site-ui em sites/ui/dist

## A lib Angular (`sites/ui`, fatias 3a-1 e 3a-2, 13/10/2026)

`@ucam/site-ui` é uma casca fina sobre a folha: nenhuma peça tem estilo próprio. Cada uma é uma diretiva ou um componente de seletor de ATRIBUTO sobre o elemento nativo do contrato, e só aplica as classes de `@ucam/site-css`.

    <a ucamSiteButton variant="secondary" href="/vagas">Ver todas</a>
    <header ucamSiteSectionHeading eyebrow="Carreiras" heading="Vagas e oportunidades"></header>

- Treze peças até aqui. Base: button, tag, icon-chip, avatar e section-heading. Moldura e formulário: breadcrumb, page-shell, accordion, input (o campo), pagination, newsletter-form, site-header e site-footer. Mais `<svg ucamSiteIcon="nome">` e `provideUcamSite({ sprite })`.
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

- Fatia 3a-3 da lib: as doze peças que faltam (hero, seções, cartões e prosa).
- **Endereço só de consulta ou só de âncora não serve num app Angular.** `?pagina=2` e `#conteudo` resolvem contra o `<base href>`, e levam para a home. A paginação monta o endereço a partir do atual (ou de `hrefDe`), e o link de salto trata o clique.
- Do que a revisão da 3a-2 deixou, menor: `<select>` e `<textarea>` dentro do campo ficam com o rótulo apontando para um id que ninguém tem (falta aviso em modo de desenvolvimento); o botão da newsletter fica `disabled` durante o envio e pode perder o foco; a seta sem destino da paginação é um `<a>` sem papel com `aria-disabled` (vem do contrato em HTML); o título das colunas do rodapé é sempre `<h2>`; os exemplos dentro dos contratos não são conferidos contra as demos; o validador só reconhece `selector` entre aspas simples; nada foi rodado em Safari, Firefox nem com leitor de tela.
- Do que a 3a-2 deixou: a marca do cabeçalho e do rodapé é texto (falta a imagem, quando houver arquivo de marca dos sites); as saídas das peças (`openChange`, `pageChange`, `submitted`) não estão no campo `eventos` dos contratos, que o validador ainda barra; a página de cada peça repete ids entre o preview, a anatomia e a grade de estados, fora do par de paridade.
- 3b: o MCP servindo os sites. 3c: a prova no CENPRE, em spec própria.
- A página de componente dos sites é cópia da do catálogo; extrair o que é comum é dívida registrada na spec.
- Só foi provado no Chrome. Falta conferir no Safari o campo de busca, o `<summary>` em flex e se a lista de passos (`role="list"`) é anunciada como lista no VoiceOver.
- Menores que a revisão da 2c deixou: a prosa não cobre h4, tabela, código nem lista aninhada; peça do sistema dentro da prosa herda o estilo de link; a foto escondida do hero ainda é baixada no telefone (falta `<picture>` com `media`); o cartão sobre seção escura não troca o anel de foco.
