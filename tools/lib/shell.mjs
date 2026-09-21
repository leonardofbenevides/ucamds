// O shell da aplicação, montado a partir do contrato — nunca escrito à mão.
//
// POR QUE ESTE ARQUIVO EXISTE
//
// As 7 telas de spec/templates.json escreviam cada uma o seu próprio shell.
// O resultado, medido no repositório antes desta mudança: sete faixas
// diferentes. Uma com chip de campus, outra sem; uma com o nome do usuário em
// <br>, outra em pilha flex; larguras de conteúdo em 72rem, 68rem, 48rem e
// nenhuma; `rgba(255,255,255,.16)` cravado em três delas, invisível para o
// tema escuro e proibido pela ADR-007. Nenhuma tinha skip-link, <main> ou
// navegação.
//
// Ou seja: o design system reproduzia, nos próprios exemplos, exatamente os
// defeitos que spec/components/app-shell.json condena — "três sistemas, três
// marcas". Um shell montado de um lugar só torna esse desvio impossível.
//
// A CONFIGURAÇÃO vem da spec (projeto.shell + template.shell); o MARKUP vem
// daqui; o ESTILO vem de dist/css/ucam.css. Três responsabilidades, três
// lugares — e a tela só descreve o que é dela.

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Sem parâmetro de tamanho: o degrau do ícone é do PAPEL e sai da folha
// (bloco "escala de ícone por papel" em tools/build-css.mjs). O antigo
// segundo argumento `sm` era a marcação escolhendo o tamanho — e é por isso
// que o mesmo chevron saía com dois tamanhos conforme a barra.
const ic = (nome) =>
  `<svg class="ic" aria-hidden="true"><use href="#i-${nome}"/></svg>`;

/**
 * O DESTINO de um item de navegação — e o que fazer quando não há nenhum.
 *
 * Todo item do shell nascia `href="#"`. Clicar em "Gerencial" recarregava a
 * mesma tela com um `#` a mais na barra de endereço: o protótipo desenhava a
 * navegação e não navegava. Quem abria a Caixa de entrada para conferir o
 * arranjo mestre-detalhe não tinha como chegar ao Painel gerencial sem voltar
 * ao site e clicar noutra tela — ou seja, a única coisa que o app-shell existe
 * para provar era justamente a que não dava para experimentar.
 *
 * Quem resolve o destino é build-templates.mjs, que conhece TODAS as telas
 * geradas; aqui só se lê `i.href`. O renderizador continua burro de propósito.
 *
 * Item SEM destino não vira link morto. Vira `<span>`/`<button>` com
 * `data-sem-tela`, que é a verdade: o item existe no contrato do sistema e a
 * tela de referência ainda não foi desenhada. É a mesma regra que este arquivo
 * já aplica ao chevron e ao ramo — não prometer o que não há —, aplicada agora
 * ao próprio `href`. Um `<a href="#">` promete página e entrega recarga.
 */
const semTela = ' data-sem-tela title="Sem tela de referência desenhada."';

/** `<a href>` quando há destino; `<span role=link aria-disabled>` quando não. */
const linkOuMarca = (destino, classe, atributos, dentro) =>
  destino
    ? `<a class="${classe}" href="${esc(destino)}"${atributos}>${dentro}</a>`
    : `<span class="${classe}" role="link" aria-disabled="true"${atributos}${semTela}>${dentro}</span>`;

/** O mesmo, para item de popover: o papel ali é `menuitem`, não `link`. */
const itemMenu = (i, icone = '') => {
  const dentro = icone + `<span>${esc(i.rotulo)}</span>`;
  const atual = i.ativo ? ' aria-current="page"' : '';
  return i.href
    ? `<a class="ucam-menu__item" role="menuitem" tabindex="-1" href="${esc(i.href)}"${atual}>${dentro}</a>`
    : `<span class="ucam-menu__item" role="menuitem" tabindex="-1" aria-disabled="true"${atual}${semTela}>${dentro}</span>`;
};

/** Iniciais para o avatar: primeira e última palavra do nome. */
function iniciais(nome = '') {
  const p = String(nome).trim().split(' ').filter(Boolean);
  if (!p.length) return '';
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

/**
 * Monta o shell inteiro em volta do conteúdo da tela.
 *
 * @param {object} cfg
 *   sistema      {string}  nome do sistema. NUNCA "Universidade Candido Mendes":
 *                          o logo já diz, e repetir é o defeito do SIGFIN.
 *   campus       {string=} unidade ativa. Vira o chip de contexto.
 *   usuario      {string=} nome de quem está logado.
 *   nav          {Array=}  [{ titulo, itens: [{ rotulo, icone?, contagem?, ativo? }] }]
 *   navBusca     {boolean} campo de busca no menu. Obrigatório acima de 20 itens.
 *   navId        {string=} id do <nav>, para o aria-controls do botão de menu.
 *   rodape       {string=} texto do rodapé. Ausente = sem rodapé.
 *   largura      {'padrao'|'larga'|'estreita'|'foco'}
 *                          foco = tarefa única (login, confirmação): 25rem,
 *                          a medida do formulário curto. estreita (48rem) é
 *                          largura de LEITURA e é larga demais para isso.
 *   centrado     {boolean} centraliza o conteúdo no eixo do bloco — login, erro.
 *   idConteudo   {string=} id do <main>, alvo do skip-link.
 *   logo         {boolean} logo institucional na faixa. A página hospedeira
 *                          precisa declarar --ucam-appbar-logo; sem isso o
 *                          elemento nasce sem largura e some.
 * @param {string} conteudo  HTML da tela, sem shell.
 */
export function renderShell(cfg = {}, conteudo = '') {
  const {
    sistema = 'Sistema',
    campus = null,
    campusOpcoes = null,
    usuario = null,
    nav = [],
    /* Coluna de módulos. Presente = moldura com rail e SEM faixa superior.
     * Com `topo` ou `railComoMenu`, os mesmos itens viram o menu de sistemas
     * — na testeira deitada num caso, na faixa de identidade no outro. */
    rail = null,
    /* A lista de módulos SEM a coluna de 72px: os mesmos itens viram o
     * lançador da faixa, e a lateral volta a ser a navegação do módulo.
     *
     * É o arranjo que a anatomia do app-shell descreve como padrão — faixa
     * obrigatória, navegação "fixa em desktop" — e que as duas molduras
     * anteriores negavam, cada uma por um lado: a de rail tirava a faixa, a
     * de topo tirava a lateral. Com o rail recolhido no lançador a largura
     * gasta em cromo cai de 390px (72 de rail + 318 de coluna) para 318, e a
     * troca de sistema continua a um clique — que é o que a coluna existia
     * para dar.
     *
     * Só tem efeito sem `topo`: lá o lançador já é da primeira fileira. */
    railComoMenu = false,
    /* A COLUNA CARREGA A IDENTIDADE E A FAIXA DEIXA DE EXISTIR.
     *
     * O quarto arranjo, e o único em que não há testeira nenhuma: marca, nome
     * do sistema, campus, busca global e conta descem todos para a lateral,
     * que passa a ir do topo ao pé da janela. O conteúdo fica com a largura
     * inteira e ganha a própria barra de visão — trilha, título e ferramentas
     * — em três fileiras rasas coladas no alto do painel.
     *
     * Por que ele existe: a faixa de 72px atravessava o campo de leitura em
     * TODA tela para carregar cinco papéis que a coluna já podia carregar de
     * graça — ela está ali de qualquer forma. O que a faixa devolvia em troca
     * da altura era presença de marca; e a marca continua presente, no alto
     * da coluna, onde o olho a procura ao abrir o sistema.
     *
     * Consequência que ele assume: abaixo de 64rem a navegação é painel
     * sobreposto e não há faixa para hospedar o botão que a abre. Por isso o
     * arranjo emite a .ucam-mobilebar — uma fileira rasa que só existe nessa
     * largura. Sem ela o sistema inteiro ficaria sem navegação no celular,
     * que é o defeito que o arranjo de rail já teve e corrigiu com o
     * .ucam-rail__menu. */
    lateral = false,
    /* Sem faixa, e SEM que isso implique o arranjo lateral.
     *
     * A tela de entrada precisava de uma coisa só — não emitir a testeira,
     * porque antes de entrar não há busca, campus nem conta para hospedar.
     * O que ela usava para conseguir isso era `lateral`, que suprime a faixa
     * como EFEITO COLATERAL e arrasta junto tudo o que o arranjo lateral
     * decide: painel de conteúdo sem margem, sem raio e sem sombra.
     *
     * O login não é o arranjo lateral. Ele não tem coluna de navegação para
     * arranjar. Pedir o efeito pelo nome é o que permite que a tela de
     * entrada volte a ter a moldura que todas as outras têm (ADR-021).
     */
    semFaixa = false,
    /* Testeira no topo e conteúdo em largura cheia. Ver blocoTopo, abaixo. */
    topo = false,
    /* Cor da FILEIRA DE IDENTIDADE da testeira: 'marca' | 'escura' | 'clara'.
     * Só a primeira fileira; a de seções fica sempre na superfície. Ver o
     * comentário de .ucam-topbar__identidade em build-css.mjs. */
    topoCor = 'marca',
    /* Símbolo da marca no topo do rail (caminho do SVG; entra por mask). */
    railMarca = null,
    navAcao = null,
    /* FAVORITOS: o que quem usa fixou — telas, filtros salvos, registros.
     * [{ rotulo, icone?, href?, ativo? }]. Vazio = o grupo não é emitido.
     * Ver o bloco "grupo Favoritos" abaixo. */
    favoritos = [],
    /* Rodapé da navegação: o que não é destino de trabalho — configuração,
     * ajuda. Ver o comentário do bloco, mais abaixo. */
    navRodape = [],
    navBusca = false,
    busca = null,
    buscaAtalho = null,
    /* O QUE A BUSCA GLOBAL ACHA. Grupos de resultado, na ordem em que a
     * aplicação quer que apareçam:
     *
     *   [{ id, titulo, icone?, itens: [{ rotulo, meta?, icone?, href?,
     *      tela?, nav?, recente? }] }]
     *
     * Vazio é uma declaração legítima e não um esquecimento: sem grupos a
     * busca continua achando os DESTINOS do próprio menu, que o shell deriva
     * sozinho, e nada mais. É a mesma regra que `busca` já segue — o shell
     * não presume que a aplicação tem registro para procurar. */
    buscaResultados = [],
    navId = 'nav-app',
    rodape = null,
    largura = 'padrao',
    centrado = false,
    idConteudo = 'conteudo',
    logo = true,
    /* A MARQUINHA DO MÓDULO na faixa (ADR-033): ícone e categoria do projeto.
     * Com logo=false a faixa abre com o ladrilho e o nome do sistema; o lockup
     * da universidade fica na gaveta e no rodapé. */
    moduloIcone = null,
    moduloCategoria = null,
    /* Destino da MARCA: o "início" do módulo. Sai de build-templates.mjs, que
     * sabe qual é a primeira tela do projeto. Sem ele a marca vira <span>, e
     * não um link que recarrega a mesma página — que é o defeito do parque. */
    inicio = null,
    /* Destino de "Meus dados", no menu da conta. Idem. */
    perfil = null,
    /* NOTIFICAÇÕES: número de não lidas, ou null para não emitir o sino.
     *
     * É número e não booleano porque sino sem contagem obriga a abrir para
     * saber se há algo — e o custo de abrir é a tela inteira mudando por uma
     * pergunta de um dígito. Zero é um valor legítimo e diferente de null:
     * com zero o sino aparece sem selo, dizendo "em dia"; com null a
     * aplicação declara que não tem notificação nenhuma e o sino não existe.
     * Botão que abre lista vazia é a mesma promessa falsa do lançador sem
     * rail. */
    notificacoes = null,
    notificacoesItens = [],
    saida = null,
  } = cfg;

  const temNav = Array.isArray(nav) && nav.length > 0;

  /* A COLUNA de 72px só existe quando o rail não virou menu. As três molduras
   * saem destas duas linhas, e não de `rail` cru espalhado por dez condições:
   *   railColuna    -> rail + lateral, sem faixa
   *   topo          -> testeira deitada, sem lateral
   *   railComoMenu  -> faixa + lateral, com a lista de módulos no lançador */
  const railColuna = Boolean(rail) && !topo && !railComoMenu && !lateral;
  /* O LANÇADOR de sistemas: a mesma lista do rail, recolhida num botão da
   * faixa. Existe nos dois arranjos que dispensam a coluna. */
  const temLancador = Boolean(rail?.itens?.length) && !railColuna;

  // O botão de menu só existe se houver menu. Botão que abre nada é pior que
  // botão ausente: promete navegação e entrega vazio.
  //
  // Sem cor cravada por style inline. Ela era var(--ucam-color-text-on-brand)
  // — branco — porque a faixa era sempre bordô; com a faixa clara como padrão
  // o ícone virava branco sobre branco. A cor vem da faixa, por herança.
  const botaoMenu = temNav
    ? `<button class="ucam-btn ucam-btn--icon ucam-btn--ghost ucam-appbar__menu" type="button" aria-label="Abrir navegação" aria-expanded="false" aria-controls="${esc(navId)}">${ic('menu')}</button>`
    : '';

  /* O BOTÃO DE RECOLHER A COLUNA, na CABEÇA DA FAIXA.
   *
   * Ele morava no pé da navegação, numa barra própria, e o argumento de então
   * era que lá ele ganhava vizinhos — configuração e ajuda — em vez de flutuar
   * sozinho no alto. O argumento não sobreviveu ao estado RECOLHIDO, que é o
   * estado em que o botão mais importa: recolhida, a coluna é uma tira de
   * ícones de 40px todos centrados, e o botão do pé continuava alinhado à
   * ESQUERDA por uma regra que o mandava encostar na prumada dos itens de
   * menu. Ele saía torto justamente quando era a única saída do estado.
   *
   * O defeito de fundo, porém, era outro: o controle que ABRE a navegação
   * ficava no fim dela. Para reabrir uma coluna recolhida a pessoa tinha de
   * varrer a tira inteira até o pé — e num menu que rola, o pé nem sempre está
   * onde se olha.
   *
   * Agora ele fica na PONTA da faixa, imediatamente acima da coluna que
   * governa, no mesmo slot em que o botão de menu vive abaixo de 64rem. Um
   * endereço só para "mostrar/esconder a navegação", nas duas larguras, e uma
   * posição que NÃO MUDA entre recolhido e aberto — que é o que faltava.
   *
   * Os dois nunca aparecem juntos: o de menu some a partir de 64rem, onde a
   * navegação vira coluna fixa; este só existe a partir de 64rem, porque
   * abaixo disso recolher não significa nada. */
  // O botão de recolher NÃO vive na faixa (ver barraRecolher, abaixo).

  // Busca global da faixa. Só existe quando a spec declara o que ela procura:
  // `busca` é o texto do placeholder, e placeholder genérico ("Buscar…") não
  // diz onde a busca vai olhar. Sem declaração, não há campo — o shell não
  // presume que a aplicação tem o que buscar.
  //
  // O rótulo é <label class="ucam-sr-only">, não placeholder: placeholder
  // some ao digitar e leva o nome do campo junto. O atalho vai em
  // aria-keyshortcuts (o que o leitor de tela anuncia) e a tecla desenhada
  // ao lado é aria-hidden — mesma informação, dois canais, sem duplicar na
  // leitura.
  const idBusca = `${navId}-busca`;
  /* O CAMPO, sem o contêiner. Os dois arranjos que hospedam a busca global —
   * a faixa e a coluna do arranjo lateral — querem o mesmo input, o mesmo
   * rótulo invisível e as mesmas teclas desenhadas; o que muda é só a caixa
   * em volta e, com ela, a classe. Emitir isto duas vezes era o caminho
   * conhecido para a coluna ganhar aria-keyshortcuts e a faixa não. */
  const idPainelBusca = `${idBusca}-painel`;
  const miolodBusca = () =>
    `<label class="ucam-sr-only" for="${esc(idBusca)}">${esc(busca)}</label>` +
    ic('search') +
    /* COMBOBOX, e não campo solto. O painel que abre é uma lista de opções
     * navegável pelas setas, e é isso que role/aria-expanded/aria-controls
     * dizem — sem eles o leitor de tela anuncia "campo de busca" e a lista
     * que aparece embaixo não existe para quem não a vê. O item corrente é
     * apontado por aria-activedescendant, que é como uma lista de resultados
     * se percorre sem tirar o foco de onde se digita.
     *
     * autocomplete="off" porque a sugestão do navegador abriria uma segunda
     * lista POR CIMA desta, com outros itens e outro comportamento de seta. */
    `<input id="${esc(idBusca)}" type="search" data-busca placeholder="${esc(busca)}"` +
    ` role="combobox" autocomplete="off" aria-autocomplete="list" aria-expanded="false"` +
    ` aria-controls="${esc(idPainelBusca)}"` +
    // aria-keyshortcuts tem sintaxe própria (Control+K, sem espaços e com o
    // nome da tecla por extenso). O que se DESENHA é "Ctrl", que é o que está
    // escrito no teclado de quem usa; o que se ANUNCIA é o formato que a
    // especificação define. Mesma tecla, duas grafias, cada uma no canal que
    // a entende.
    (buscaAtalho
      ? ` aria-keyshortcuts="${esc(buscaAtalho.replace(/\s*\+\s*/g, '+').replace(/\bCtrl\b/i, 'Control'))}"`
      : '') +
    `>` +
    (buscaAtalho
      ? buscaAtalho
          .split('+')
          .map((t) => `<kbd class="ucam-kbd" aria-hidden="true">${esc(t.trim())}</kbd>`)
          .join('')
      : '');

  /* ===================================================== A BUSCA GLOBAL ===
   *
   * O campo da faixa era um campo morto. Ele desenhava a tecla de atalho,
   * declarava aria-keyshortcuts e, cumprido o atalho, entregava um cursor
   * piscando: digitar não produzia nada, e não havia como produzir — não
   * existia nada do outro lado. O contrato do command já registrava o
   * defeito com todas as letras ("o sistema anuncia uma tecla que não faz
   * coisa alguma"), e a correção de então foi ligar o atalho ao FOCO. Focar
   * um campo que não acha nada é a mesma promessa, adiada um passo.
   *
   * Agora o campo abre um painel ancorado nele, que filtra ENQUANTO SE
   * DIGITA. Três decisões:
   *
   * 1. ANCORADO, não modal. A paleta de comando (command.json) é a caixa
   *    sobreposta que leva a TELAS e AÇÕES por Ctrl+K; esta procura
   *    REGISTRO, e registro se procura sem perder de vista a tela em que se
   *    está — o filtro aplicado, a fila aberta, o campus ativo. Duas
   *    superfícies diferentes porque são duas perguntas diferentes; é o que
   *    o próprio contrato da paleta manda ("a paleta leva a telas e ações; a
   *    busca da testeira procura registro").
   *
   * 2. ABRE VAZIA, e vazia já é útil. Sem termo ela mostra o que se marcou
   *    como RECENTE mais os destinos do menu — a mesma lista, sem digitar.
   *    Painel que só existe depois da terceira letra obriga a adivinhar se
   *    há algo do outro lado.
   *
   * 3. OS ESCOPOS SÃO DINÂMICOS. Cada grupo presente vira um filtro com a
   *    CONTAGEM do termo corrente, e o filtro sem resultado se desabilita em
   *    vez de sumir: chip que aparece e desaparece a cada tecla é a lista
   *    dançando debaixo do ponteiro.
   *
   * Os DESTINOS não vêm da spec: são derivados do menu que já está montado
   * — grupos, favoritos e rodapé —, com o mesmo rótulo, o mesmo ícone e o
   * mesmo href. Escrever a lista de novo na spec seria a segunda cópia que o
   * spec/README proíbe, e a primeira a desatualizar. */
  const itensDeDestino = () => {
    const vistos = new Set();
    const saida = [];
    const junta = (i, secao) => {
      if (!i?.href || vistos.has(i.href + i.rotulo)) return;
      vistos.add(i.href + i.rotulo);
      saida.push({ rotulo: i.rotulo, meta: secao, icone: i.icone, href: i.href });
    };
    for (const g of nav ?? []) {
      for (const i of g.itens ?? []) {
        junta(i, g.titulo);
        for (const f of i.itens ?? []) junta(f, i.rotulo);
      }
    }
    for (const f of favoritos ?? []) junta(f, 'Favoritos');
    for (const r of navRodape ?? []) junta(r, 'Sistema');
    return saida;
  };

  const gruposBusca = busca
    ? [
        ...(Array.isArray(buscaResultados) ? buscaResultados : []).filter(
          (g) => g?.itens?.length,
        ),
        { id: 'ir', titulo: 'Ir para', icone: 'arrowRight', itens: itensDeDestino() },
      ].filter((g) => g.itens.length)
    : [];

  /* A CHAVE DE BUSCA de um item é rótulo + apoio, sem acento e em caixa
   * baixa. Sem tirar o acento, "Analitico" não acha "Analytics" e — pior —
   * "Secretaria" não acha "Secretária": digitar o acento certo vira
   * requisito, e ninguém digita acento numa busca. */
  const chave = (t = '') =>
    String(t)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const itemBusca = (i, gid, n) => {
    const idOpcao = `${idPainelBusca}-o${n}`;
    const abre = i.href
      ? `<a class="ucam-busca__item" href="${esc(i.href)}"`
      : '<button class="ucam-busca__item" type="button"';
    return (
      abre +
      ` role="option" id="${esc(idOpcao)}" aria-selected="false" tabindex="-1"` +
      ` data-escopo="${esc(gid)}" data-chave="${esc(chave(`${i.rotulo} ${i.meta ?? ''}`))}"` +
      (i.recente ? ' data-recente' : '') +
      '>' +
      ic(i.icone ?? 'search') +
      `<span class="ucam-busca__rotulo" data-realcavel>${esc(i.rotulo)}</span>` +
      (i.meta ? `<span class="ucam-busca__meta" data-realcavel>${esc(i.meta)}</span>` : '') +
      (i.href ? '</a>' : '</button>')
    );
  };

  let nOpcao = 0;
  const painelBusca = gruposBusca.length
    ? `<div class="ucam-busca" id="${esc(idPainelBusca)}" hidden>` +
      /* Os escopos. "Tudo" primeiro e pressionado: um grupo de filtros sem
       * nenhum ativo não diz que está mostrando tudo, diz que está quebrado. */
      '<div class="ucam-busca__escopos" role="group" aria-label="Filtrar resultados por tipo">' +
      '<button class="ucam-busca__escopo" type="button" data-escopo="" aria-pressed="true">Tudo' +
      '<span class="ucam-busca__n" data-n="" aria-hidden="true"></span></button>' +
      gruposBusca
        .map(
          (g) =>
            `<button class="ucam-busca__escopo" type="button" data-escopo="${esc(g.id)}" aria-pressed="false">` +
            esc(g.titulo) +
            `<span class="ucam-busca__n" data-n="${esc(g.id)}" aria-hidden="true"></span></button>`,
        )
        .join('') +
      '</div>' +
      `<div class="ucam-busca__rolagem" role="listbox" aria-label="Resultados da busca">` +
      gruposBusca
        .map(
          (g) =>
            `<div class="ucam-busca__grupo" data-grupo="${esc(g.id)}">` +
            `<p class="ucam-busca__titulo">${esc(g.titulo)}</p>` +
            g.itens.map((i) => itemBusca(i, g.id, ++nOpcao)).join('') +
            '</div>',
        )
        .join('') +
      '</div>' +
      /* O VAZIO diz o termo de volta. "Nada encontrado" sozinho deixa a
       * dúvida de o quê — se do termo digitado ou do escopo escolhido. */
      '<p class="ucam-busca__vazio" hidden>Nada encontrado para ' +
      '<strong data-termo></strong>.</p>' +
      '<div class="ucam-busca__rodape">' +
      '<span><kbd class="ucam-kbd">&uarr;</kbd><kbd class="ucam-kbd">&darr;</kbd> navegar</span>' +
      '<span><kbd class="ucam-kbd">&crarr;</kbd> abrir</span>' +
      '<span><kbd class="ucam-kbd">esc</kbd> fechar</span>' +
      '<span class="ucam-busca__folga"></span>' +
      '<span data-contagem aria-live="polite"></span>' +
      '</div></div>'
    : '';

  const campoBusca = busca && !lateral
    ? `<div class="ucam-appbar__search" data-busca-caixa>` + miolodBusca() + painelBusca + `</div>`
    : '';

  /* A MESMA BUSCA, na coluna do arranjo lateral.
   *
   * Não é a nav-search: aquela peneira o MENU, esta procura no CONTEÚDO do
   * sistema. As duas podem coexistir e coexistem — o contrato do app-shell já
   * separa as duas —, e é por isso que esta carrega classe própria em vez de
   * herdar a da outra. */
  const buscaLateral = busca && lateral
    ? `<div class="ucam-nav__busca" data-busca-caixa>` + miolodBusca() + painelBusca + `</div>`
    : '';

  // O CAMPUS É UM SELECT (ADR-033). Contexto crítico — a mesma tela mostra
  // dados diferentes por campus —, e a peça que troca um valor entre opções já
  // existe no sistema: o select, com o mesmo gatilho, o mesmo chevron e a
  // mesma lista de todo formulário. Foi chip em pastilha com rótulo esmaecido e
  // menu de itens radio: um select que não se parecia com nenhum select.
  //
  // O rótulo "Campus" é do leitor de tela na faixa ("Campos" sozinho não diz
  // que é campus) e visível na coluna lateral, onde há largura. Sem
  // `campusOpcoes` não há o que escolher, e a peça é só texto — um gatilho que
  // abre uma lista de um item promete escolha e não tem.
  //
  // O mesmo seletor serve às três molduras; só uma delas é emitida por tela,
  // então o id não se repete.
  const idCampus = `${navId}-campus`;
  const opcoesCampus = Array.isArray(campusOpcoes) ? campusOpcoes.filter(Boolean) : [];
  const trocaCampus = campus && opcoesCampus.length > 1;

  const seletorCampus = (mod, rotuloVisivel) => {
    if (!campus) return '';
    const rotulo = rotuloVisivel ? 'ucam-campus__rotulo' : 'ucam-sr-only';
    return trocaCampus
      ? `<span class="ucam-campus ucam-campus--${mod}">` +
          `<label class="${rotulo}" for="${esc(idCampus)}">Campus</label>` +
          `<select class="ucam-select ucam-select--${mod}" id="${esc(idCampus)}" data-campus-select>` +
          opcoesCampus.map((c) => `<option${c === campus ? ' selected' : ''}>${esc(c)}</option>`).join('') +
          '</select></span>'
      : `<span class="ucam-campus ucam-campus--${mod}">` +
          `<span class="${rotulo}">Campus</span>` +
          `<span class="ucam-campus__valor">${esc(campus)}</span></span>`;
  };

  /* O SINO, entre o contexto e o lançador.
   *
   * A contagem fica FORA do aria-label e dentro do botão, num <span> que o
   * leitor de tela lê em sequência: "Notificações, 3 não lidas". Pôr o número
   * só no aria-label deixaria o selo visual sem equivalente quando ele muda —
   * e ele muda sozinho, que é o caso em que um rótulo escrito uma vez mente.
   *
   * Acima de 99 o selo mostra "99+" e o nome acessível mantém o número
   * exato: o selo tem 18px e não é onde se lê "1.204", mas quem ouve não tem
   * por que receber a aproximação. */
  /* A LISTA do sino, que faltava.
   *
   * Um aviso que não leva a lugar nenhum CONTINUA NA LISTA e só não vira link
   * — a mesma regra que o menu de navegação e a busca global já seguem para
   * destino não desenhado neste conjunto. Fingir o link seria pior que não
   * ter; tirar o aviso faria o selo contar o que a lista não mostra.
   *
   * "Marcar todas como lidas" some depois de agir: o que não tem mais efeito
   * não fica oferecido (é o que o "Remover ordenação" do menu da coluna já
   * faz). */
  const idSino = `${navId}-sino`;
  const idSinoMenu = `${navId}-sino-menu`;
  const plural = (n) => (n === 1 ? 'não lida' : 'não lidas');

  const avisoDaLista = (n) => {
    const miolo =
      ic(n.icone || 'bell') +
      '<span class="ucam-menu__identidade">' +
      `<span class="ucam-menu__nome">${esc(n.titulo)}</span>` +
      (n.quando ? `<span class="ucam-menu__meta">${esc(n.quando)}</span>` : '') +
      '</span>';
    return n.href
      ? `<a class="ucam-menu__item" role="menuitem" tabindex="-1" href="${esc(n.href)}" data-fluxo="a">${miolo}</a>`
      : `<span class="ucam-menu__item" role="menuitem" tabindex="-1">${miolo}</span>`;
  };

  const painelNotificacoes =
    `<div class="ucam-menu ucam-menu--lancador ucam-menu--notificacoes" id="${esc(idSinoMenu)}" role="menu" aria-labelledby="${esc(idSino)}" hidden>` +
    `<p class="ucam-menu__titulo" data-notificacoes-titulo>Notificações${notificacoes > 0 ? ` · ${notificacoes} ${plural(notificacoes)}` : ''}</p>` +
    (notificacoesItens.length
      ? notificacoesItens.map(avisoDaLista).join('') +
        '<div class="ucam-menu__sep" role="separator"></div>' +
        '<button class="ucam-menu__item" role="menuitem" tabindex="-1" type="button" data-fluxo="c" data-acao="marcar-lidas"' +
        (notificacoes > 0 ? '' : ' hidden') +
        `>${ic('check')}<span>Marcar todas como lidas</span></button>`
      : '<p class="ucam-menu__vazio">Nada por aqui. Você é avisado quando algum registro precisar de você.</p>') +
    '</div>';

  const sinoNotificacoes =
    notificacoes != null && !lateral
      ? '<div class="ucam-appbar__notificacoes">' +
        `<button class="ucam-appbar__lancador" type="button" id="${esc(idSino)}" data-menu aria-haspopup="menu" aria-expanded="false" aria-controls="${esc(idSinoMenu)}" aria-label="Notificações">` +
        ic('bell') +
        (notificacoes > 0
          ? `<span class="ucam-appbar__selo" aria-hidden="true">${notificacoes > 99 ? '99+' : notificacoes}</span>` +
            `<span class="ucam-sr-only">, ${notificacoes} ${plural(notificacoes)}</span>`
          : '<span class="ucam-sr-only">, nenhuma não lida</span>') +
        '</button>' +
        painelNotificacoes +
        '</div>'
      : '';

  const chipCampus = seletorCampus('faixa', false);

  // A CONTA, e não mais três peças soltas.
  //
  // A faixa emitia avatar + nome por extenso + botão "Sair" lado a lado, e os
  // três ocupavam a ponta direita em TODA tela de TODO sistema. O nome de quem
  // está logado é o dado que menos muda na aplicação — quem lê já sabe — e
  // sair é ação rara: nenhum dos dois compra rótulo permanente ao lado da
  // marca. Recolhidos no menu, sobra o avatar, que é o que o olho usa para
  // achar a conta.
  //
  // O chevron fica porque AQUI o popover existe. É a mesma regra que este
  // arquivo aplica ao botão de menu e ao chip de campus, na direção contrária:
  // lá o chevron sai por prometer o que não há; aqui ele entra por haver.
  //
  // Quem identifica é o .ucam-sr-only dentro do gatilho — o nome sai do
  // DESENHO, não da árvore de acessibilidade. O bloco de identidade repetido
  // dentro do menu é aria-hidden pelo mesmo motivo: para quem ouve ele seria
  // o nome dito duas vezes seguidas.
  // O menu em si é o MESMO nos dois arranjos — na faixa e no pé do rail. Ele
  // desce do avatar num caso e sobe dele no outro, e é só isso que muda: uma
  // classe de posicionamento. Duplicar o conteúdo do menu por arranjo era o
  // caminho para o Protocolo oferecer "Meus dados" e o SigFin não.
  const idConta = `${navId}-conta`;
  const idContaMenu = `${navId}-conta-menu`;
  const menuDaConta = (modificador = '') =>
    `<div class="ucam-menu${modificador}" id="${esc(idContaMenu)}" role="menu" aria-labelledby="${esc(idConta)}" hidden>` +
    '<div class="ucam-menu__conta" aria-hidden="true">' +
    `<span class="ucam-avatar ucam-avatar--sm">${esc(iniciais(usuario ?? ''))}</span>` +
    '<span class="ucam-menu__identidade">' +
    `<span class="ucam-menu__nome">${esc(usuario ?? '')}</span>` +
    (campus ? `<span class="ucam-menu__meta">Campus ${esc(campus)}</span>` : '') +
    '</span></div>' +
    '<div class="ucam-menu__sep" role="separator"></div>' +
    itemMenu({ rotulo: 'Meus dados', href: perfil }, ic('user')) +
    '<div class="ucam-menu__sep" role="separator"></div>' +
    // O TEMA mora na conta porque é preferência de quem usa, não da tela. Três
    // escolhas, e não um interruptor: "como o dispositivo" é o padrão e
    // precisa poder ser escolhido de volta depois de alguém fixar claro ou
    // escuro — um interruptor de dois estados não tem como voltar a ele. O
    // aria-checked real sai do temaScript no carregamento; aqui nasce o
    // padrão.
    `<div role="group" aria-labelledby="${esc(idContaMenu)}-tema">` +
    `<p class="ucam-menu__titulo" id="${esc(idContaMenu)}-tema">Tema</p>` +
    [
      ['light', 'sun', 'Claro'],
      ['dark', 'moon', 'Escuro'],
      ['auto', 'monitor', 'Como o dispositivo'],
    ]
      .map(
        ([v, i, r]) =>
          `<button class="ucam-menu__item" role="menuitemradio" aria-checked="${v === 'auto'}" tabindex="-1" type="button" data-tema="${v}">${ic(i)}<span>${r}</span></button>`,
      )
      .join('') +
    '</div>' +
    '<div class="ucam-menu__sep" role="separator"></div>' +
    (saida
      ? `<a class="ucam-menu__item" role="menuitem" tabindex="-1" href="${esc(saida)}" data-fluxo="a">${ic('logOut')}<span>Sair</span></a>`
      : `<button class="ucam-menu__item" role="menuitem" tabindex="-1" type="button">${ic('logOut')}<span>Sair</span></button>`) +
    '</div>';

  const menuConta = usuario
    ? '<div class="ucam-appbar__account">' +
      `<button class="ucam-appbar__user" type="button" id="${esc(idConta)}" aria-haspopup="menu" aria-expanded="false" aria-controls="${esc(idContaMenu)}" data-conta>` +
      `<span class="ucam-appbar__avatar" aria-hidden="true">${esc(iniciais(usuario))}</span>` +
      `<span class="ucam-sr-only">Conta de ${esc(usuario)}</span>` +
      `<svg class="ic ucam-appbar__chevron" aria-hidden="true"><use href="#i-chevronDown"/></svg>` +
      '</button>' +
      menuDaConta() +
      '</div>'
    : '';

  // A COLUNA DE MÓDULOS. Cada item é um sistema do parque, não uma seção
  // deste sistema — é o que permite trocar de módulo sem voltar ao Portal.
  // Só ícone: 72px não comportam rótulo, e o nome acessível vai no aria-label.
  const itensRail = (rail?.itens ?? [])
    .map((i) =>
      linkOuMarca(
        i.href,
        'ucam-rail__item',
        ` aria-label="${esc(i.rotulo)}"` + (i.ativo ? ' aria-current="page"' : ''),
        ic(i.icone ?? 'layoutGrid'),
      ),
    )
    .join('');

  // O GATILHO DA NAVEGAÇÃO, no rail.
  //
  // A moldura com rail não emite faixa, e a faixa é onde mora o botão de menu.
  // Abaixo de 64rem a navegação do módulo é painel sobreposto — ou seja, ela
  // sai da tela e espera alguém abrir. Sem este botão ninguém abria: no
  // celular o sistema inteiro se reduzia à coluna de ícones do rail, com os
  // rótulos e o submenu inalcançáveis por toque E por teclado. O contrato do
  // app-shell promete navegação sobreposta abaixo de 64rem; sem gatilho a
  // promessa é a mesma mentira que o chevron sem popover que este arquivo já
  // recusa em dois outros lugares.
  //
  // Primeiro filho de propósito: quem navega por teclado encontra "abrir
  // navegação" antes da lista de módulos, que é a ordem em que a decisão
  // acontece — ver este menu ou trocar de sistema.
  const botaoMenuRail =
    railColuna && temNav
      ? `<button class="ucam-rail__item ucam-rail__menu" type="button" aria-label="Abrir navegação" aria-expanded="false" aria-controls="${esc(navId)}">${ic('menu')}</button>`
      : '';

  const blocoRail = railColuna
    ? '<nav class="ucam-rail" aria-label="Módulos">' +
      (railMarca ? '<span class="ucam-rail__marca" aria-hidden="true"></span>' : '') +
      botaoMenuRail +
      itensRail +
      (usuario
        ? '<div class="ucam-rail__conta">' +
          `<button class="ucam-rail__usuario" type="button" id="${esc(idConta)}" aria-haspopup="menu" aria-expanded="false" aria-controls="${esc(idContaMenu)}" data-conta>` +
          `<span class="ucam-avatar" aria-hidden="true">${esc(iniciais(usuario))}</span>` +
          `<span class="ucam-sr-only">Conta de ${esc(usuario)}</span>` +
          '</button>' +
          menuDaConta(' ucam-menu--rail') +
          '</div>'
        : '') +
      '</nav>'
    : '';

  // O SELETOR DE SISTEMA. Sem faixa superior, o nome do sistema precisa de
  // lugar — e o lugar é o alto da navegação que ele governa, não uma testeira
  // que atravessa a tela. Enquanto a troca não existir é um <span> e não um
  // <button>: a mesma regra que este arquivo já aplica ao botão de menu e ao
  // chip de campus — chevron que promete popover inexistente é mentira.
  //
  // O BOTÃO DE RECOLHER acompanha o nome do sistema. É <button> com
  // aria-expanded apontando a própria navegação: o estado da coluna é o
  // mesmo que o leitor de tela ouve, então não há como o visual e o anúncio
  // divergirem. O rótulo é sempre "Recolher navegação" — quem inverte a
  // frase conforme o estado obriga quem usa leitor de tela a reler o botão
  // para saber o que ele faz agora; aria-expanded já carrega o estado.
  /* COM FAIXA, esta fileira NÃO EXISTE. O nome do sistema já está na marca da
   * faixa, a 60px de distância vertical, e repeti-lo numa fileira própria de
   * 3.75rem é o defeito que o SIGFIN comete ao escrever "Universidade Candido
   * Mendes" duas vezes na mesma tela. O botão de recolher, que morava aqui por
   * carona, desce para o pé da coluna — ver barraRecolher. */
  const seletorSistema =
    railColuna && sistema
      ? '<div class="ucam-nav__sistema">' +
        '<span class="ucam-icon-tile ucam-icon-tile--marca" aria-hidden="true">' +
        ic(rail.icone ?? 'clipboardList') +
        '</span><span class="ucam-nav__sistema-nome">' +
        esc(sistema) +
        '</span>' +
        `<button class="ucam-nav__recolher" type="button" data-recolher aria-controls="${esc(navId)}" aria-expanded="true" aria-label="Recolher navegação">` +
        '<svg class="ic " aria-hidden="true"><use href="#i-menu"/></svg>' +
        '</button></div>'
      : '';

  // Um item de menu, em duas formas.
  //
  // FOLHA: <a> com aria-current. É a forma de sempre.
  //
  // RAMO: item que traz `itens` dentro. Vira <button aria-expanded> mais uma
  // lista recuada por um FILETE VERTICAL — o desenho do sidebar-menu-sub da
  // ZardUI (`border-l border-sidebar-border`). O filete não é enfeite: recuo
  // sozinho não diz de quem o subitem depende, e quando o pai rola para fora
  // do campo de visão a lista apenas indentada perde o dono. A linha é o que
  // ainda liga os dois.
  //
  // Ramo NÃO é destino: é <button>, não <a>. Um <a href="#"> que só abre a
  // lista promete uma página e não entrega nenhuma — a mesma regra do chevron,
  // aplicada ao elemento em vez da seta.
  const item = (i, idPai) => {
    const icone = i.icone ? ic(i.icone) : '';
    const contagem =
      i.contagem != null
        ? `<span class="ucam-nav__count">${esc(i.contagem)}</span>`
        : '';
    const filhos = Array.isArray(i.itens) ? i.itens : [];

    if (!filhos.length) {
      // aria-current NÃO é enfeite: é o seletor de que sai o destaque
      // visual. Quem esquecer o atributo vê o item ativo sumir.
      const atual = i.ativo ? ' aria-current="page"' : '';
      return linkOuMarca(
        i.href,
        'ucam-nav__item',
        atual,
        `${icone}<span>${esc(i.rotulo)}</span>${contagem}`,
      );
    }

    // O ramo nasce ABERTO quando guarda o item ativo: menu que esconde a tela
    // em que se está obriga a caçar de onde se veio.
    const aberto = filhos.some((f) => f.ativo);
    const idSub = `${idPai}-${esc(i.id ?? String(i.rotulo).toLowerCase().replace(/\W+/g, '-'))}`;
    const subitens = filhos
      .map((f) =>
        linkOuMarca(
          f.href,
          'ucam-nav__subitem',
          f.ativo ? ' aria-current="page"' : '',
          `<span>${esc(f.rotulo)}</span>` +
            (f.contagem != null ? `<span class="ucam-nav__count">${esc(f.contagem)}</span>` : ''),
        ),
      )
      .join('');

    return (
      '<div class="ucam-nav__branch">' +
      `<button class="ucam-nav__item ucam-nav__item--ramo" type="button" aria-expanded="${aberto}" aria-controls="${idSub}" data-ramo>` +
      icone +
      `<span>${esc(i.rotulo)}</span>` +
      contagem +
      '<svg class="ic ucam-nav__chevron" aria-hidden="true"><use href="#i-chevronDown"/></svg>' +
      '</button>' +
      `<div class="ucam-nav__sub" id="${idSub}"${aberto ? '' : ' hidden'}>${subitens}</div>` +
      '</div>'
    );
  };

  // O GRUPO FAVORITOS — o que quem usa fixou, antes dos grupos do sistema.
  //
  // Num sistema de vinte destinos, os três que uma pessoa abre todo dia não
  // são os três de outra, e a ordem fixa do menu não serve às duas. O Portal
  // já tinha "Acessos frequentes" como PÁGINA; isto é a versão que mora na
  // coluna, sem trocar de tela. Attio, Notion e Linear têm o mesmo grupo no
  // mesmo lugar, pelo mesmo motivo.
  //
  // O título é <button aria-expanded>, não <p>: o grupo recolhe, pelo mesmo
  // script dos ramos (data-ramo). Vazio, ele não é emitido — um título
  // "Favoritos" sobre nada é convite a um recurso que a tela não explicou.
  //
  // Cada item é o <a> de sempre com um <button> de desfixar AO LADO — nunca
  // dentro, que é alvo aninhado e HTML inválido. O botão senta sobre a ponta
  // direita do item por posição e só aparece sob o ponteiro ou com foco. É
  // interruptor de ícone com aria-pressed=true: a estrela cheia diz "está
  // fixado", e o nome acessível diz o que o clique faz.
  const idFavoritos = `${navId}-favoritos`;
  const grupoFavoritos = (favoritos || []).length
    ? '<div class="ucam-nav__group">' +
      `<button class="ucam-nav__group-title ucam-nav__group-title--recolhivel" type="button" aria-expanded="true" aria-controls="${esc(idFavoritos)}" data-ramo>` +
      '<span>Favoritos</span>' +
      '<svg class="ic ucam-nav__chevron" aria-hidden="true"><use href="#i-chevronDown"/></svg>' +
      '</button>' +
      `<div class="ucam-nav__fixados" id="${esc(idFavoritos)}">` +
      favoritos
        .map(
          (i) =>
            '<div class="ucam-nav__fixado">' +
            linkOuMarca(
              i.href,
              'ucam-nav__item',
              i.ativo ? ' aria-current="page"' : '',
              (i.icone ? ic(i.icone) : '') + `<span>${esc(i.rotulo)}</span>`,
            ) +
            `<button class="ucam-btn ucam-btn--ghost ucam-btn--icon ucam-btn--sm ucam-nav__desfixar" type="button" aria-pressed="true" aria-label="Remover ${esc(i.rotulo)} dos favoritos">` +
            '<svg class="ic" aria-hidden="true"><use href="#i-star"/></svg>' +
            '</button></div>',
        )
        .join('') +
      '</div></div>'
    : '';

  const grupos = grupoFavoritos + (nav || [])
    .map((g) => {
      const itens = (g.itens || []).map((i) => item(i, navId)).join('');
      const titulo = g.titulo
        ? `<p class="ucam-nav__group-title">${esc(g.titulo)}</p>`
        : '';
      return `<div class="ucam-nav__group">${titulo}${itens}</div>`;
    })
    .join('');

  // A AÇÃO PRIMÁRIA do módulo, no topo da navegação e fora da rolagem.
  //
  // Vem do shell do PROJETO, não da tela: "criar requerimento" é fato do
  // Protocolo inteiro, não de uma tela dele. Fica fora do .ucam-nav__scroll de
  // propósito — a ação de criar não pode depender de onde o menu foi rolado.
  //
  // <button> ENQUANTO não houver para onde ir; <a> quando houver.
  //
  // O argumento antigo — "quem cria abre um formulário dentro da aplicação, e
  // um link prometeria clique do meio e abrir-em-nova-aba que a tela não
  // entrega" — valia enquanto a ação não tinha destino nenhum. No conjunto de
  // telas de referência ela TEM: "Novo requerimento" é a tela
  // protocolo-novo-requerimento, um documento próprio. Aqui o link entrega
  // exatamente o que promete, inclusive o clique do meio.
  // Uma por módulo — a segunda seria navegação disfarçada de ação.
  const acaoNav = navAcao
    ? '<div class="ucam-nav__cta">' +
      (navAcao.href
        ? `<a class="ucam-btn ucam-btn--primary" href="${esc(navAcao.href)}">`
        : '<button class="ucam-btn ucam-btn--primary" type="button">') +
      (navAcao.icone ? ic(navAcao.icone) : '') +
      `<span>${esc(navAcao.rotulo)}</span>` +
      (navAcao.href ? '</a>' : '</button>') +
      '</div>'
    : '';

  const buscaNav = navBusca
    ? `<div class="ucam-nav__search"><div class="ucam-field"><label class="ucam-sr-only" for="${esc(navId)}-b">Buscar no menu</label><input class="ucam-input" id="${esc(navId)}-b" type="search" placeholder="Buscar no menu"></div></div>`
    : '';

  // O RODAPÉ DA NAVEGAÇÃO — o SidebarFooter da ZardUI.
  //
  // Configuração e ajuda ou estavam misturadas aos destinos de trabalho, ou
  // não estavam em lugar nenhum. Não são a mesma coisa: "Análise" é onde o dia
  // acontece; "Configurações" é onde se vai duas vezes por ano. Somadas à
  // lista, disputam com o trabalho a mesma varredura vertical; no pé da
  // coluna ficam onde o olho já as procura — e FORA da rolagem, que é o ponto:
  // o menu do SigFin tem mais de cem itens, e a ajuda não pode morar depois de
  // todos eles.
  const rodapeNav = (navRodape ?? []).length
    ? '<div class="ucam-nav__footer">' +
      navRodape
        .map((i) =>
          linkOuMarca(
            i.href,
            'ucam-nav__item',
            i.ativo ? ' aria-current="page"' : '',
            (i.icone ? ic(i.icone) : '') + `<span>${esc(i.rotulo)}</span>`,
          ),
        )
        .join('') +
      '</div>'
    : '';

  /* O BOTÃO DE RECOLHER, no pé da coluna quando não há fileira de sistema.
   *
   * Sozinho no alto ele era um chevron solto sobre o vazio: nada à esquerda,
   * nada abaixo até a ação primária, e a única marca gráfica acima do botão
   * bordô mais pesado da tela. No pé ele ganha vizinhos — configuração e
   * ajuda —, sai da frente da ação que se usa todo dia e fica onde o olho já
   * procura o que é da MOLDURA e não do trabalho.
   *
   * Fora do .ucam-nav__scroll, como o resto do rodapé: recolher não pode
   * depender de onde o menu foi rolado. */
  /* O LANÇADOR DE SISTEMAS — o rail recolhido num botão.
   *
   * Vive aqui, acima da faixa, porque as DUAS molduras sem coluna o usam: a
   * de topo, na primeira fileira da testeira, e a de faixa + lateral, ao lado
   * do botão de menu. Um por arranjo seriam duas listas de módulos para
   * manter em dia — e é assim que um sistema ganha "Acadêmico" no menu e o
   * outro não. */
  const idSistemas = `${navId}-sistemas`;
  const idSistemasMenu = `${navId}-sistemas-menu`;

  /* A CAIXA é do arranjo; a LISTA é do parque.
   *
   * A faixa hospeda o lançador num canto e a coluna do arranjo lateral o
   * hospeda no alto — mas os itens, o popover e o rótulo são os mesmos nos
   * dois. Parametrizar a classe do contêiner e do botão é o que impede a
   * segunda cópia da lista, que é como um sistema ganha "Acadêmico" no menu e
   * o outro não. Só um dos dois é emitido por tela, então os ids não colidem. */
  const lancadorSistemas = (classeCaixa, classeBotao) => temLancador
      ? `<div class="${classeCaixa}">` +
        `<button class="${classeBotao}" type="button" id="${esc(idSistemas)}" aria-haspopup="menu" aria-expanded="false" aria-controls="${esc(idSistemasMenu)}" data-menu aria-label="Trocar de sistema">` +
        ic('layoutGrid') +
        '</button>' +
        `<div class="ucam-menu ucam-menu--lancador" id="${esc(idSistemasMenu)}" role="menu" aria-labelledby="${esc(idSistemas)}" hidden>` +
        '<p class="ucam-menu__titulo" aria-hidden="true">Sistemas</p>' +
        rail.itens
          .map((i) => itemMenu(i, ic(i.icone ?? 'layoutGrid')))
          .join('') +
        '</div></div>'
      : '';

  const menuSistemas = lancadorSistemas('ucam-appbar__sistemas', 'ucam-appbar__lancador');

  /* ======================================================= ARRANJO LATERAL ===
   *
   * Tudo o que a faixa carregava, na coluna. A ordem da lateral não é a da
   * faixa deitada de pé: é a ordem em que se procura cada coisa.
   *
   *   marca + sistema     quem eu sou           (uma vez, ao chegar)
   *   campus              QUAIS dados eu vejo   (confere-se sempre)
   *   ação primária       o que eu crio         (todo dia)
   *   busca global        o que eu procuro      (todo dia)
   *   destinos            para onde eu vou      (todo dia, e rola)
   *   ajuste e ajuda      moldura               (duas vezes por ano)
   *   conta               quem está logado      (raro, e é onde se sai)
   *
   * As três últimas ficam FORA da rolagem, no pé: um menu de cem itens não
   * pode enterrar o "Sair" depois de todos eles. */

  /* O botão de recolher vive na fileira da marca — o canto onde as referências
   * de sistema denso o põem, e onde ele tem vizinho. Nos arranjos com faixa ele
   * mora na .ucam-nav__recolher-barra, no TOPO da coluna.
   *
   * HAMBÚRGUER, e não mais o par de setas (11/09/2026). A seta "«" girava
   * 180° conforme o estado e pedia para ser lida a cada vez; o hambúrguer é o
   * desenho que todo mundo já reconhece como "a navegação abre e fecha aqui",
   * e não muda de forma — quem diz o estado é o aria-expanded e a própria
   * largura da coluna. */
  const recolherLateral = temNav
    ? `<button class="ucam-nav__recolher" type="button" data-recolher aria-controls="${esc(navId)}" aria-expanded="true" aria-label="Recolher navegação">` +
      '<svg class="ic " aria-hidden="true"><use href="#i-menu"/></svg></button>'
    : '';

  /* O CAMPUS, em fileira própria e de largura cheia.
   *
   * Na faixa ele era um chip espremido entre a busca e o avatar. Aqui é uma
   * fileira inteira logo abaixo da marca, que é o peso que a evidência do
   * app-shell pede: "é informação crítica: a mesma tela mostra dados diferentes
   * por campus". O seletor é o MESMO da faixa — mesmo id, mesma lista —,
   * porque só um dos dois arranjos é emitido; aqui o rótulo fica visível. */
  const campusLateral = campus && lateral
    ? '<div class="ucam-nav__contexto">' + seletorCampus('nav', true) + '</div>'
    : '';

  /* A MARCA no alto da coluna. Ver o comentário da opção `lateral`. */
  const navTopo = lateral
    ? '<div class="ucam-nav__topo">' +
      '<div class="ucam-nav__marca">' +
      lancadorSistemas('ucam-nav__sistemas', 'ucam-nav__lancador') +
      linkOuMarca(
        inicio,
        'ucam-nav__brand',
        '',
        // Mesma regra da faixa: a logo é decorativa porque o nome do sistema ao
        // lado, dentro do mesmo link, já dá o nome acessível.
        (logo ? '<span class="ucam-nav__logo" aria-hidden="true"></span>' : '') +
          `<span class="ucam-nav__brand-nome">${esc(sistema)}</span>`,
      ) +
      recolherLateral +
      '</div>' +
      campusLateral +
      '</div>'
    : '';

  /* A CONTA no pé da coluna, e com NOME VISÍVEL.
   *
   * Na faixa sobrava só o avatar, e estava certo: ali o nome custava largura ao
   * lado da marca. No pé de uma coluna de 318px ele não disputa com nada — a
   * linha está vazia de qualquer forma — e responde de graça a pergunta que um
   * avatar de duas letras faz o usuário adivinhar. O menu é o mesmo da faixa; o
   * que muda é a direção em que ele abre. */
  const contaLateral = usuario && lateral
    ? '<div class="ucam-nav__conta">' +
      `<button class="ucam-nav__conta-gatilho" type="button" id="${esc(idConta)}" aria-haspopup="menu" aria-expanded="false" aria-controls="${esc(idContaMenu)}" data-conta>` +
      `<span class="ucam-avatar ucam-avatar--sm" aria-hidden="true">${esc(iniciais(usuario))}</span>` +
      '<span class="ucam-nav__conta-identidade" aria-hidden="true">' +
      `<span class="ucam-nav__conta-nome">${esc(usuario)}</span>` +
      (campus ? `<span class="ucam-nav__conta-meta">Campus ${esc(campus)}</span>` : '') +
      '</span>' +
      `<span class="ucam-sr-only">Conta de ${esc(usuario)}</span>` +
      '<svg class="ic ucam-nav__conta-chevron" aria-hidden="true"><use href="#i-chevronsUpDown"/></svg>' +
      '</button>' +
      menuDaConta(' ucam-menu--conta-nav') +
      '</div>'
    : '';

  /* A FILEIRA DO CELULAR. Só existe abaixo de 64rem, e existe porque abaixo de
   * 64rem a coluna é painel sobreposto e não há faixa para hospedar o botão que
   * a abre. Carrega o gatilho e o nome do sistema, e nada mais: o resto da
   * identidade está na coluna, a uma tecla de distância. */
  const barraMovel = lateral && temNav
    ? '<div class="ucam-mobilebar">' +
      `<button class="ucam-btn ucam-btn--icon ucam-btn--ghost ucam-mobilebar__menu" type="button" aria-label="Abrir navegação" aria-expanded="false" aria-controls="${esc(navId)}">` +
      ic('menu') +
      '</button>' +
      `<span class="ucam-mobilebar__sistema">${esc(sistema)}</span>` +
      '</div>'
    : '';




  // A CABEÇA DA GAVETA: só existe no modo sobreposto, e só no arranjo com
  // faixa. Abaixo de nav-fixa o painel entra POR CIMA da faixa (z.nav > z.faixa,
  // de propósito: é ele que cobre) — e cobria também o botão que o abriu.
  // Sobrava Esc, o escurecimento ou um link como saída, nenhum deles visível.
  // Medido em 10/09/2026 a 820 e 390px: painel a partir de y=0, sem nome do
  // sistema e sem fechar. A cabeça devolve os dois; o botão de fechar é o
  // primeiro focável, para que quem abre pelo teclado saiba sair antes de
  // andar. O arranjo `lateral` já tem o topo com marca e não precisa disto.
  // A gaveta leva a ASSINATURA da universidade ao lado do nome do sistema
  // (ADR-033) e, abaixo de faixa-minima — onde o select saiu da faixa —, o
  // campus ativo: contexto que muda o significado da tela não some, muda de
  // lugar.
  const cabecaGaveta =
    !lateral && temNav
      ? '<div class="ucam-nav__gaveta">' +
        '<span class="ucam-nav__gaveta-id">' +
        '<span class="ucam-nav__gaveta-marca" aria-hidden="true"></span>' +
        `<span class="ucam-nav__gaveta-sistema">${esc(sistema)}</span>` +
        '</span>' +
        `<button class="ucam-btn ucam-btn--icon ucam-btn--ghost ucam-nav__fechar" type="button" aria-label="Fechar navegação" aria-controls="${esc(navId)}">` +
        '<svg class="ic" aria-hidden="true"><use href="#i-x"/></svg>' +
        '</button></div>' +
        (campus ? `<p class="ucam-nav__gaveta-campus">Campus · ${esc(campus)}</p>` : '')
      : '';

  /* A BARRA DO TOPO com o botão de recolher, nos arranjos com faixa. O botão
   * chegou a morar na cabeça da faixa (10/09/2026), antes da marca, e o
   * usuário mandou tirá-lo de lá: a faixa é da instituição e do sistema, e um
   * controle da coluna na frente da logo lia como parte da marca. Foi para o
   * pé da coluna, e em 11/09/2026 o usuário pediu o hambúrguer no TOPO dela:
   * é a primeira coisa que o olho encontra ao entrar na coluna, e é onde a
   * coluna recolhida ainda tem o que mostrar. Fica DENTRO da coluna, não na
   * faixa — o motivo da primeira mudança continua de pé. Na régua de 20
   * quando aberta, centrado quando recolhida. No arranjo lateral ele já vive
   * na fileira da marca, que também é o topo. */
  const barraRecolher = temNav && !lateral
    ? '<div class="ucam-nav__recolher-barra">' + recolherLateral + '</div>'
    : '';

  const blocoNav = temNav
    ? `<nav class="ucam-nav" id="${esc(navId)}" aria-label="Navegação principal">${barraRecolher}${cabecaGaveta}${navTopo}${seletorSistema}${acaoNav}${buscaLateral}${buscaNav}<div class="ucam-nav__scroll">${grupos}</div>${rodapeNav}${contaLateral}</nav><div class="ucam-nav-scrim"></div>`
    : '';

  /* `pleno` é o único valor que NÃO é largura de leitura: ele desliga o teto
   * e o recuo para que o conteúdo alcance a borda da moldura. Existe para a
   * tela cujo conteúdo É o arranjo da moldura inteira — a entrada, em duas
   * colunas que precisam encostar no raio do painel. Fora desse caso, texto
   * sem teto de medida é o defeito que as outras quatro larguras corrigem. */
  const classeConteudo =
    largura === 'larga'
      ? 'ucam-content ucam-content--larga'
      : largura === 'estreita'
        ? 'ucam-content ucam-content--estreita'
        : largura === 'foco'
          ? 'ucam-content ucam-content--foco'
          : largura === 'pleno'
            ? 'ucam-content ucam-content--pleno'
            : 'ucam-content';

  const blocoRodape = rodape
    ? `<footer class="ucam-shell__footer">${logo ? '' : '<span class="ucam-shell__footer-marca" role="img" aria-label="Universidade Candido Mendes"></span>'}${rodape}</footer>`
    : '';

  // Com rail, a FAIXA NÃO EXISTE. Não é a faixa escondida por CSS: ela não é
  // emitida. Uma testeira presente no documento e invisível continuaria na
  // ordem de tabulação e no leitor de tela, anunciando marca, busca e sair
  // que ninguém vê — e o skip-link passaria por cima dela.
  // SUBPALETA DO SISTEMA (ADR-037, em teste): a categoria vai no SHELL, e não
  // na faixa, porque a família da ação troca na tela inteira. O Portal
  // (lockup) não declara: é o saguão, e fica no bordô.
  const sistemaAttr = !logo && moduloCategoria ? ` data-sistema="${esc(moduloCategoria)}"` : '';

  const faixa = topo || railColuna || lateral || semFaixa
    ? ''
    : `<header class="ucam-appbar${logo ? ' ucam-appbar--lockup' : ''}">` +
      botaoMenu +
      linkOuMarca(
        inicio,
        'ucam-appbar__brand',
        '',
        // A logo e a marquinha são decorativas AQUI porque o nome do sistema ao
        // lado, dentro do mesmo link, já dá o nome acessível. Anunciar as duas
        // sairia como "Universidade Candido Mendes Protocolo" em toda página.
        //
        // A MARQUINHA (ADR-033): o lockup de 110px abria a faixa de todo
        // sistema e era ele que a estourava a 320 e a 480px. O ladrilho do
        // módulo diz em que sistema se está com a mesma cor da grade do Portal;
        // a universidade fica onde ela é o assunto.
        (logo
          ? `<span class="ucam-appbar__logo" aria-hidden="true"></span><span class="ucam-appbar__divider"></span>`
          : moduloIcone
            ? `<span class="ucam-icon-tile ucam-appbar__marca${moduloCategoria ? ` ucam-icon-tile--${esc(moduloCategoria)}` : ''}" aria-hidden="true">${ic(moduloIcone)}</span>`
            : '') + `<span class="ucam-appbar__system">${esc(sistema)}</span>`,
      ) +
      `<span class="ucam-appbar__spacer"></span>` +
      campoBusca +
      (campoBusca ? `<span class="ucam-appbar__spacer"></span>` : '') +
      chipCampus +
      (chipCampus && (sinoNotificacoes || menuSistemas || menuConta)
        ? `<span class="ucam-appbar__divider"></span>`
        : '') +
      sinoNotificacoes +
      // O RAIL, recolhido, na PONTA DIREITA — encostado na conta.
      //
      // A coluna prometia trocar de sistema sem passar pelo Portal; tirar a
      // coluna e não repor a promessa seria trocar largura por função. O que
      // mudou em 09/09/2026 foi o LADO. Ele nasceu na ponta esquerda, onde a
      // coluna de 72px ficava, e ali disputava a entrada da faixa com o botão
      // de menu e com a marca: três alvos antes do nome do sistema, e o
      // primeiro deles levando para FORA do sistema em que a pessoa está.
      //
      // À direita ele encosta na conta, e o grupo passa a ter um assunto só —
      // quem sou eu, onde estou, para onde saio. É onde uma década de Google
      // Workspace pôs a grade de aplicativos, e reaproveitar esse hábito custa
      // menos que ensinar um novo: aqui o público são alunos e servidores que
      // já usam Gmail e Drive todo dia.
      menuSistemas +
      menuConta +
      `</header>`;

  /* =====================================================================
   * A MOLDURA DE TOPO.
   *
   * Por que ela existe, medido na Caixa de entrada do Protocolo a 1440px:
   * o rail come 72px, a navegação lateral come mais 305, e a tela — que é um
   * mestre-detalhe, ou seja, DUAS colunas de conteúdo — recebia 1063 para
   * dividir entre a lista e o registro. Vinte e seis por cento da janela
   * gastos em cromo que não muda entre telas, contra um conteúdo que precisa
   * justamente de largura. Deitada, a mesma navegação custa 40px de ALTURA e
   * devolve a largura inteira.
   *
   * DUAS FILEIRAS, não uma:
   *   1ª — identidade e contexto: sistemas, marca, sistema atual, busca,
   *        campus, conta. Não muda ao navegar.
   *   2ª — as seções DESTE sistema, mais a ação primária. Muda por sistema.
   * Numa fileira só, um sistema com oito seções disputaria espaço horizontal
   * com a busca e a conta, e a primeira coisa a ser cortada seria a
   * navegação. Separadas, cada fileira tem um dono.
   *
   * O RAIL NÃO SOME, MUDA DE FORMA. A coluna de módulos prometia troca de
   * sistema sem passar pelo Portal; aqui a mesma lista é o menu do botão de
   * grade, na primeira fileira. Tirar a promessa junto com a coluna seria
   * trocar largura por função.
   *
   * ABAIXO DE 64rem a segunda fileira sai e a navegação volta a ser o painel
   * sobreposto de sempre, aberto pelo botão de menu da primeira. Uma fileira
   * de seções com rolagem horizontal no celular esconde item sem dizer que
   * escondeu — é a gaveta que resolve isso, e ela já existe.
   * ===================================================================== */

  /* Um item da fileira de seções. Folha vira <a>; ramo vira <button> com menu
   * — a mesma regra do menu lateral, pelo mesmo motivo: ramo não é destino.
   * Deitado, o ramo abre para BAIXO em vez de empurrar os irmãos para o lado,
   * que é o que a lista recuada faria numa fileira horizontal. */
  const itemTopo = (i) => {
    const icone = i.icone ? ic(i.icone) : '';
    const contagem =
      i.contagem != null ? `<span class="ucam-topnav__count">${esc(i.contagem)}</span>` : '';
    const filhos = Array.isArray(i.itens) ? i.itens : [];

    if (!filhos.length) {
      const atual = i.ativo ? ' aria-current="page"' : '';
      return linkOuMarca(
        i.href,
        'ucam-topnav__item',
        atual,
        `${icone}<span>${esc(i.rotulo)}</span>${contagem}`,
      );
    }

    const idr = `${navId}-topo-${esc(i.id ?? String(i.rotulo).toLowerCase().replace(/\W+/g, '-'))}`;
    const temAtivo = filhos.some((f) => f.ativo);
    return (
      '<div class="ucam-topnav__branch">' +
      `<button class="ucam-topnav__item ucam-topnav__item--ramo" type="button" id="${idr}-g" aria-haspopup="menu" aria-expanded="false" aria-controls="${idr}" data-menu${temAtivo ? ' aria-current="true"' : ''}>` +
      icone +
      `<span>${esc(i.rotulo)}</span>` +
      contagem +
      '<svg class="ic ucam-topnav__chevron" aria-hidden="true"><use href="#i-chevronDown"/></svg>' +
      '</button>' +
      `<div class="ucam-menu" id="${idr}" role="menu" aria-labelledby="${idr}-g" hidden>` +
      filhos.map((f) => itemMenu(f)).join('') +
      '</div></div>'
    );
  };

  /* O filete entre grupos preserva a única informação que a lista vertical
   * dava de graça: que "Caixa de entrada" e "Setores" não são irmãos. Sem ele
   * a fileira vira uma régua de sete itens equivalentes. O título do grupo em
   * si não entra — deitado ele custaria mais largura do que informa. */
  const topnavItens = (nav || [])
    .map((g) => `<div class="ucam-topnav__grupo">${(g.itens || []).map(itemTopo).join('')}</div>`)
    .join('<span class="ucam-topnav__sep" aria-hidden="true"></span>');

  /* A ação do módulo é SECUNDÁRIA na fileira, e é uma decisão de hierarquia,
   * não de gosto. Cheia, ela ficava bordô a 90px de um 'Concluir' também
   * bordô, e o olho passava a ter dois primários na mesma tela — com o agravante
   * de o da moldura estar sempre ali, em toda tela, competindo com a ação que
   * de fato pertence à página aberta. Contornada, ela continua sendo o único
   * botão da fileira e segue óbvia; o que ela deixa de fazer é disputar. */
  const acaoTopo = navAcao
    ? '<button class="ucam-btn ucam-btn--secondary ucam-btn--sm ucam-topnav__cta" type="button">' +
      (navAcao.icone ? ic(navAcao.icone) : '') +
      `<span>${esc(navAcao.rotulo)}</span>` +
      '</button>'
    : '';

  const blocoTopo = topo
    ? '<header class="ucam-topbar">' +
      // A fileira de identidade É uma .ucam-appbar. Não "parece com": ela
      // carrega a classe, e com ela as cinco derivadas de cor (filete,
      // esmaecido, hover, contorno de controle, anel de foco) que o bloco de
      // .ucam-appbar já resolve a partir de bg e fg. Sem isso, uma fileira
      // bordô precisaria redeclarar o tratamento do campo de busca, do chip de
      // campus e do avatar — que é literalmente como o parque legado chegou a
      // três faixas diferentes para a mesma universidade.
      //
      // O que a classe de modificação abaixo NÃO herda é a moldura flutuante:
      // margem, raio e sombra saem em .ucam-topbar__identidade, porque aqui a
      // testeira atravessa a tela de ponta a ponta.
      `<div class="ucam-appbar ucam-appbar--${esc(topoCor)} ucam-topbar__identidade">` +
      botaoMenu +
      linkOuMarca(
        inicio,
        'ucam-topbar__marca',
        '',
        (logo
          ? '<span class="ucam-topbar__logo" aria-hidden="true"></span><span class="ucam-topbar__divisor"></span>'
          : '') + `<span class="ucam-topbar__sistema">${esc(sistema)}</span>`,
      ) +
      '<span class="ucam-topbar__folga"></span>' +
      campoBusca +
      chipCampus +
      // Mesmo lado, mesmo motivo que na faixa: a fileira de identidade da
      // testeira É uma .ucam-appbar, e as duas molduras não podem discordar
      // sobre onde mora a grade de sistemas.
      menuSistemas +
      menuConta +
      '</div>' +
      (temNav
        ? '<nav class="ucam-topnav" aria-label="Seções do sistema">' +
          `<div class="ucam-topnav__scroll">${topnavItens}</div>` +
          acaoTopo +
          '</nav>'
        : '') +
      '</header>'
    : '';

  const estiloRail = railMarca ? ` style="--ucam-rail-marca:url('${esc(railMarca)}')"` : '';

  return (
    `<div class="ucam-shell${temNav ? '' : ' ucam-shell--sem-nav'}${topo ? ' ucam-shell--topo' : railColuna ? ' ucam-shell--rail' : lateral ? ' ucam-shell--lateral' : ''}" data-nav="closed"${estiloRail}${sistemaAttr}>` +
    `<a class="ucam-skip" href="#${esc(idConteudo)}">Pular para o conteúdo</a>` +
    // A REGIÃO VIVA DA TELA, vazia e sem tamanho. Toast está fora do
    // catálogo por decisão (alert.json): mensagem que some não pode carregar
    // informação necessária. O preço dessa escolha é que a confirmação de
    // ação vira mudança na própria tela — selo que troca, linha que entra,
    // botão que muda de nome — e NADA disso chega a quem não vê a tela. É
    // aqui que essas mudanças ganham palavra. Precisa existir desde o
    // carregamento: região criada junto com o texto não é observada.
    '<p class="ucam-sr-only" role="status" data-anuncio></p>' +
    blocoRail +
    blocoTopo +
    barraMovel +
    (topo ? '' : faixa) +
    blocoNav +
    // tabindex="-1" é obrigatório: sem ele o foco não pousa no destino e o
    // skip-link move só a rolagem, deixando o teclado onde estava.
    `<main class="ucam-main${centrado ? ' ucam-main--centrado' : ''}" id="${esc(idConteudo)}" tabindex="-1">` +
    `<div class="${classeConteudo}">${conteudo}</div>` +
    `</main>` +
    blocoRodape +
    `</div>`
  );
}

/**
 * Mescla a configuração de shell do PROJETO com a da TELA.
 *
 * O projeto declara o que é dele — sistema, campus, usuário, menu — e a tela
 * declara só o que é dela: qual item do menu está ativo e a largura que o
 * conteúdo pede. É o que impede a tela de reinventar a faixa.
 */
/**
 * O ÍNDICE DE DESTINOS do conjunto inteiro de telas.
 *
 * Vive aqui, e não no gerador, porque são DOIS os geradores que montam shell —
 * build-templates.mjs (as páginas autônomas) e build-index.mjs (o preview que
 * vai para o site) — e um índice por gerador é o caminho conhecido para duas
 * respostas diferentes à mesma pergunta. É a mesma razão pela qual o markup do
 * shell mora num arquivo só.
 *
 * As telas geradas são IRMÃS no mesmo diretório: de protocolo-gerencial.html
 * para protocolo-analytics.html o caminho é o nome do arquivo, e nada mais.
 *
 * Quem casa item de menu com tela é o próprio `shell.navAtivo` que a tela já
 * declarava para se marcar como atual — não há tabela de rotas paralela para
 * sair de sincronia. Duas telas com o mesmo navAtivo (a Caixa de entrada e o
 * Requerimento em página) — vence a primeira, que é a lista; o detalhe se
 * alcança de dentro dela, que é como o mestre-detalhe funciona.
 */
export function indiceDeDestinos(projetos = []) {
  const porProjeto = {};
  const porId = {};
  // A TELA DE ENTRADA, que é para onde "Sair" leva. Ela se declara
  // (shell.entrada) e vale para todos os projetos: sair do SigFin e sair do
  // Protocolo terminam no mesmo lugar.
  let entrada = null;

  for (const p of projetos) {
    if (!p.templates?.length) continue;
    const arquivo = (t) => `${p.id}-${t.id}.html`;
    porProjeto[p.id] = arquivo(p.templates[0]);
    for (const t of p.templates) if (t.shell?.entrada) entrada = arquivo(t);
    const porNav = {};
    const porTela = {};
    for (const t of p.templates) {
      porTela[t.id] = arquivo(t);
      const alvo = t.shell?.navAtivo;
      if (alvo && !porNav[alvo]) porNav[alvo] = arquivo(t);
    }
    porId[p.id] = { porNav, porTela };
  }

  /* O CONTEÚDO da tela também navega, e escreve a rota do SITE.
   *
   * Os cartões da Grade de módulos e os links do rodapé do login apontam
   * `#/templates/<projeto>/<tela>` — endereço certo dentro da documentação e
   * âncora morta na página autônoma. O menu passar a navegar e o conteúdo não
   * passaria a impressão de um protótipo funcionando pela metade, e justamente
   * na tela cujo trabalho INTEIRO é levar a outro sistema.
   *
   * A tradução acontece na geração, e não na spec, porque o mesmo preview
   * serve aos dois destinos: a documentação continua recebendo a rota que
   * entende. */
  const religaPreview = (html = '') =>
    String(html).replace(
      /#\/templates\/([a-z0-9-]+)\/([a-z0-9-]+)/g,
      (achado, projetoId, telaId) => porId[projetoId]?.porTela[telaId] ?? achado,
    );

  return { de: (p) => ({ ...porId[p.id], porProjeto, entrada }), religaPreview };
}

export function shellDaTela(projeto = {}, template = {}, destinos = {}) {
  const base = projeto.shell ?? {};
  const tela = template.shell ?? {};
  const ativo = tela.navAtivo ?? null;

  // O ÍNDICE DE DESTINOS, montado por build-templates.mjs — que é o único
  // lugar que conhece as onze telas ao mesmo tempo.
  //
  //   porNav      id do item de menu   -> arquivo da tela que o realiza
  //   porTela     id do template       -> arquivo
  //   porProjeto  id do projeto        -> arquivo da primeira tela dele
  //
  // O item de menu vira link quando existe tela para ele, e só então. Um menu
  // de seis itens em que dois têm tela desenhada não deve fingir seis.
  const { porNav = {}, porTela = {}, porProjeto = {} } = destinos;

  // O ativo desce um nível: `navAtivo` pode nomear um item de primeiro nível
  // OU um subitem. Sem descer, um sistema com submenu perderia o destaque
  // justamente nas telas mais profundas — que são as que mais precisam dele.
  //
  // O destino desce junto, e pela mesma razão.
  /* ÂNCORA vence o índice de destinos. Há item de menu cujo destino é uma
   * SEÇÃO da página que já está aberta — "Acessos frequentes" é o primeiro
   * bloco da própria grade de módulos, não uma segunda tela. Sem esta linha
   * ele cairia no ramo de "sem tela desenhada" e viraria um span desabilitado:
   * o menu declararia inalcançável um destino que está a 400px de rolagem.
   *
   * A âncora sai da spec e entra crua no href. O propagador de consulta das
   * páginas autônomas só reescreve href que termina em .html, então ela passa
   * intacta — e é o comportamento certo: consulta é estado da moldura, e pular
   * para uma seção da mesma página não troca de moldura. */
  const marca = (i) => ({
    ...i,
    ativo: ativo != null && i.id === ativo,
    href: i.ancora ?? porNav[i.id] ?? null,
    ...(Array.isArray(i.itens) ? { itens: i.itens.map(marca) } : {}),
  });

  const nav = (base.nav ?? []).map((g) => ({
    ...g,
    itens: (g.itens ?? []).map(marca),
  }));

  // O rail e o menu de sistemas trocam de SISTEMA, não de seção: o destino
  // deles é a primeira tela do outro projeto, e a chave é `projeto` na spec.
  const rail = base.rail
    ? {
        ...base.rail,
        itens: (base.rail.itens ?? []).map((i) => ({ ...i, href: porProjeto[i.projeto] ?? null })),
      }
    : base.rail;

  // Os favoritos apontam uma tela (id do template), um item de menu, ou nada.
  const favoritos = (base.favoritos ?? []).map((i) => ({
    ...i,
    href: i.href ?? (i.tela ? porTela[i.tela] : null) ?? (i.nav ? porNav[i.nav] : null) ?? null,
  }));

  /* Os RESULTADOS DA BUSCA apontam tela ou item de menu, pela mesma regra
   * dos favoritos. Item sem destino desenhado continua na lista e continua
   * achável — ele só não vira link. Tirá-lo seria fazer a busca mentir sobre
   * o que o sistema tem; fingir um link seria pior. */
  const buscaResultados = (base.buscaResultados ?? []).map((g) => ({
    ...g,
    itens: (g.itens ?? []).map((i) => ({
      ...i,
      href: i.href ?? (i.tela ? porTela[i.tela] : null) ?? (i.nav ? porNav[i.nav] : null) ?? null,
    })),
  }));

  /* Os AVISOS do sino apontam uma tela, pela mesma regra dos favoritos — e,
   * pela mesma regra, aviso cujo destino não está desenhado neste conjunto
   * continua na lista sem virar link. A contagem do selo tem de bater com o
   * que a lista mostra; tirar o aviso sem destino faria o selo contar o que
   * ninguém acha. */
  const notificacoesItens = (base.notificacoesItens ?? []).map((n) => ({
    ...n,
    href: n.href ?? (n.tela ? porTela[n.tela] : null) ?? (n.nav ? porNav[n.nav] : null) ?? null,
  }));

  // A ação primária aponta uma TELA do próprio projeto, pelo id do template.
  const navAcao = base.navAcao
    ? { ...base.navAcao, href: porTela[base.navAcao.tela] ?? null }
    : base.navAcao;

  return {
    ...base,
    rail,
    navAcao,
    favoritos,
    buscaResultados,
    notificacoesItens,
    inicio: porProjeto[projeto.id] ?? null,
    // Sem tela de entrada no conjunto (o preview do catálogo, por exemplo) o
    // item continua sendo um botão — link para lugar nenhum seria pior.
    saida: destinos.entrada ?? null,
    // A marquinha do módulo e o lockup (ADR-033): o projeto declara o ícone e
    // a categoria; só o que declara lockup (o Portal) abre a faixa com a
    // universidade.
    moduloIcone: projeto.icone ?? null,
    moduloCategoria: projeto.categoria ?? null,
    logo: projeto.lockup === true,
    perfil: porNav.perfil ?? null,
    ...tela,
    nav: tela.semNav ? [] : nav,
    navId: `nav-${template.id ?? 'app'}`,
    idConteudo: `conteudo-${template.id ?? 'app'}`,
  };
}

/**
 * Atalho de teclado da busca da faixa, para as páginas autônomas de tela.
 *
 * Existe porque o contrato do app-shell diz, com todas as letras, que atalho
 * escrito e não implementado é promessa falsa — e a tecla desenhada ao lado do
 * campo é justamente uma promessa. Aqui ela é cumprida.
 *
 * A tecla e a BARRA, nua. Era Ctrl+K, que e o atalho de paleta de comando —
 * e a paleta ja existe no catalogo como componente proprio, com esse mesmo
 * atalho. Duas coisas diferentes na mesma tecla ensinam a errar. A barra e o
 * que "buscar" significa em quase todo sistema com busca global, e nao exige
 * a mao sair da posicao de digitar.
 *
 * O preco dela e a guarda de contexto abaixo: atalho de uma tecla so precisa
 * saber quando NAO disparar.
 */
export const atalhoBuscaScript = `
document.addEventListener('keydown', function (e) {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
  // A TECLA NUA SO VALE FORA DE CAMPO DE TEXTO. Sem esta guarda, digitar uma
  // barra numa data ou numa observacao roubava o foco para a busca e comia o
  // caractere — o defeito classico do atalho de uma tecla so.
  var de = e.target;
  if (de && (de.isContentEditable || /^(input|textarea|select)$/i.test(de.tagName))) return;
  var campo = document.querySelector('[data-busca]');
  if (!campo) return;
  e.preventDefault();
  campo.focus();
  campo.select();
  // O foco ABRE o painel — o mesmo caminho do clique. Antes o atalho
  // entregava um cursor piscando num campo que não achava nada.
  if (window.ucamBuscaAbrir) window.ucamBuscaAbrir(campo);
});
`.trim();

/**
 * A BUSCA GLOBAL — filtrar enquanto se digita, e chegar pelo teclado.
 *
 * O painel já vem montado no HTML, com TODOS os resultados: o que o script
 * faz é esconder o que não casa. É a escolha certa para o tamanho do
 * problema — algumas dezenas de itens por sistema —, e ela dá de graça duas
 * coisas que uma lista montada em JS custaria: a busca funciona antes de o
 * script carregar (a lista está lá, em ordem, dentro de um listbox) e o
 * leitor de tela não recebe um painel que se reescreve inteiro a cada tecla.
 *
 * A COMPARAÇÃO É SEM ACENTO, dos dois lados. A chave de cada item foi
 * normalizada na geração; o termo digitado é normalizado aqui pela mesma
 * regra. Sem isso "Secretaria" não acha "Secretária" e o acento vira
 * requisito de digitação.
 *
 * O REALCE é feito por índice, não por regex: o termo do usuário pode conter
 * parênteses, ponto ou barra, e montar uma expressão com ele é o caminho
 * conhecido para a busca quebrar em cima de uma pontuação. Recorta-se o
 * rótulo em três pedaços e o do meio entra num <mark>.
 *
 * As setas percorrem SÓ o que está visível, e o corrente é apontado por
 * aria-activedescendant — o foco nunca sai do campo, que é o que permite
 * continuar digitando no meio da navegação.
 *
 * Delegação no documento pela razão de sempre: a documentação monta preview
 * depois do carregamento.
 */
export const buscaGlobalScript = `
(function () {
  var SEM_ACENTO = /[\\u0300-\\u036f]/g;
  function limpa(t) {
    return String(t == null ? '' : t).normalize('NFD').replace(SEM_ACENTO, '').toLowerCase().trim();
  }

  function caixaDe(el) { return el && el.closest ? el.closest('[data-busca-caixa]') : null; }
  function painelDe(caixa) { return caixa ? caixa.querySelector('.ucam-busca') : null; }
  function campoDe(caixa) { return caixa ? caixa.querySelector('[data-busca]') : null; }

  function abrir(campo) {
    var caixa = caixaDe(campo);
    var painel = painelDe(caixa);
    if (!painel || !painel.hidden) return;
    painel.hidden = false;
    campo.setAttribute('aria-expanded', 'true');
    filtrar(caixa);
  }

  function fechar(caixa) {
    var painel = painelDe(caixa);
    var campo = campoDe(caixa);
    if (!painel || painel.hidden) return;
    painel.hidden = true;
    if (campo) {
      campo.setAttribute('aria-expanded', 'false');
      campo.removeAttribute('aria-activedescendant');
    }
    marcar(caixa, null);
  }

  // O item corrente. Sem foco de verdade: quem tem o foco é o campo, e o
  // listbox aponta o corrente por id. Trocar o foco a cada seta faria a
  // digitação parar no meio da navegacao.
  function marcar(caixa, alvo) {
    var todos = caixa.querySelectorAll('.ucam-busca__item');
    for (var i = 0; i < todos.length; i++) {
      var e = todos[i] === alvo;
      todos[i].setAttribute('aria-selected', e ? 'true' : 'false');
      todos[i].classList.toggle('ucam-busca__item--corrente', e);
    }
    var campo = campoDe(caixa);
    if (!campo) return;
    if (alvo) {
      campo.setAttribute('aria-activedescendant', alvo.id);
      if (alvo.scrollIntoView) alvo.scrollIntoView({ block: 'nearest' });
    } else {
      campo.removeAttribute('aria-activedescendant');
    }
  }

  function visiveis(caixa) {
    return [].slice.call(caixa.querySelectorAll('.ucam-busca__item')).filter(function (i) {
      return !i.hidden;
    });
  }

  // O REALCE. Recorta por índice — ver o cabeçalho.
  function realca(item, termo) {
    // RÓTULO E APOIO. Metade dos casamentos acontece no apoio — o número do
    // protocolo casa no rótulo, o nome do requerente casa no apoio —, e uma
    // linha que entra na lista sem nenhuma marca visível não diz por que
    // entrou.
    var alvos = item.querySelectorAll('[data-realcavel]');
    for (var a = 0; a < alvos.length; a++) {
      var alvo = alvos[a];
      var texto = alvo.getAttribute('data-texto');
      if (texto == null) { texto = alvo.textContent; alvo.setAttribute('data-texto', texto); }
      var i = termo ? limpa(texto).indexOf(termo) : -1;
      if (i < 0) { alvo.textContent = texto; continue; }
      alvo.textContent = '';
      alvo.appendChild(document.createTextNode(texto.slice(0, i)));
      var m = document.createElement('mark');
      m.textContent = texto.slice(i, i + termo.length);
      alvo.appendChild(m);
      alvo.appendChild(document.createTextNode(texto.slice(i + termo.length)));
    }
  }

  function filtrar(caixa) {
    var campo = campoDe(caixa);
    var painel = painelDe(caixa);
    if (!campo || !painel) return;
    var termo = limpa(campo.value);
    var escopoBotao = painel.querySelector('.ucam-busca__escopo[aria-pressed="true"]');
    var escopo = escopoBotao ? escopoBotao.getAttribute('data-escopo') : '';
    var itens = painel.querySelectorAll('.ucam-busca__item');
    var porEscopo = {};
    var total = 0;

    for (var i = 0; i < itens.length; i++) {
      var it = itens[i];
      var g = it.getAttribute('data-escopo');
      // SEM TERMO, a lista não é a lista inteira: é o que a aplicação marcou
      // como recente mais os destinos do menu. Despejar todo o índice numa
      // caixa que acabou de abrir é ruído, não ajuda.
      var casa = termo
        ? it.getAttribute('data-chave').indexOf(termo) >= 0
        : it.hasAttribute('data-recente') || g === 'ir';
      if (casa) { porEscopo[g] = (porEscopo[g] || 0) + 1; }
      var mostra = casa && (!escopo || escopo === g);
      it.hidden = !mostra;
      if (mostra) { total++; realca(it, termo); }
    }

    // Grupo sem item visível não deixa o título órfão.
    var grupos = painel.querySelectorAll('.ucam-busca__grupo');
    for (var j = 0; j < grupos.length; j++) {
      grupos[j].hidden = !grupos[j].querySelector('.ucam-busca__item:not([hidden])');
    }

    // Os escopos: contagem do termo corrente, e desabilitado quando zera.
    // Desabilitar em vez de esconder — chip que some a cada tecla faz a
    // fileira dançar debaixo do ponteiro.
    var chips = painel.querySelectorAll('.ucam-busca__escopo');
    var soma = 0;
    for (var k in porEscopo) soma += porEscopo[k];
    for (var c = 0; c < chips.length; c++) {
      var id = chips[c].getAttribute('data-escopo');
      var n = id ? (porEscopo[id] || 0) : soma;
      var selo = chips[c].querySelector('[data-n]');
      if (selo) selo.textContent = n ? String(n) : '';
      chips[c].disabled = !n && !!id;
    }

    var vazio = painel.querySelector('.ucam-busca__vazio');
    if (vazio) {
      vazio.hidden = total > 0;
      var eco = vazio.querySelector('[data-termo]');
      if (eco) eco.textContent = campo.value.trim();
    }
    var conta = painel.querySelector('[data-contagem]');
    if (conta) conta.textContent = total ? total + (total === 1 ? ' resultado' : ' resultados') : '';

    var primeiro = visiveis(caixa)[0];
    marcar(caixa, primeiro || null);
  }

  window.ucamBuscaAbrir = abrir;

  document.addEventListener('focusin', function (e) {
    var campo = e.target.closest && e.target.closest('[data-busca]');
    if (campo) { abrir(campo); return; }
    // Foco que sai da caixa fecha o painel — inclusive o Tab que sai do
    // último resultado. O clique num item não passa por aqui: ele navega.
    var abertos = document.querySelectorAll('[data-busca-caixa] .ucam-busca:not([hidden])');
    for (var i = 0; i < abertos.length; i++) {
      var caixa = caixaDe(abertos[i]);
      if (caixa && !caixa.contains(e.target)) fechar(caixa);
    }
  });

  document.addEventListener('click', function (e) {
    var campo = e.target.closest && e.target.closest('[data-busca]');
    if (campo) { abrir(campo); return; }

    var chip = e.target.closest && e.target.closest('.ucam-busca__escopo');
    if (chip) {
      var cx = caixaDe(chip);
      var irmaos = cx.querySelectorAll('.ucam-busca__escopo');
      for (var i = 0; i < irmaos.length; i++) {
        irmaos[i].setAttribute('aria-pressed', String(irmaos[i] === chip));
      }
      filtrar(cx);
      var cp = campoDe(cx);
      if (cp) cp.focus();
      return;
    }

    if (e.target.closest && e.target.closest('.ucam-busca')) return;
    var todas = document.querySelectorAll('[data-busca-caixa]');
    for (var t = 0; t < todas.length; t++) fechar(todas[t]);
  });

  document.addEventListener('input', function (e) {
    var campo = e.target.closest && e.target.closest('[data-busca]');
    if (!campo) return;
    var caixa = caixaDe(campo);
    abrir(campo);
    filtrar(caixa);
  });

  document.addEventListener('keydown', function (e) {
    var campo = e.target.closest && e.target.closest('[data-busca]');
    if (!campo) return;
    var caixa = caixaDe(campo);
    var painel = painelDe(caixa);
    if (!painel) return;

    if (e.key === 'Escape') {
      // Esc com painel aberto FECHA o painel. Só depois de fechado ele
      // devolve o campo — dois papéis na mesma tecla, na ordem em que a
      // pessoa desfaz o que fez.
      if (!painel.hidden) { e.preventDefault(); fechar(caixa); }
      else { campo.value = ''; }
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (painel.hidden) abrir(campo);
      var lista = visiveis(caixa);
      if (!lista.length) return;
      e.preventDefault();
      var atual = painel.querySelector('.ucam-busca__item--corrente');
      var i = lista.indexOf(atual);
      var passo = e.key === 'ArrowDown' ? 1 : -1;
      // Circular: a última seta para baixo volta ao topo. Numa lista de
      // resultados, parar na última linha é obrigar a subir tudo de volta.
      var prox = lista[(i + passo + lista.length) % lista.length] || lista[0];
      marcar(caixa, prox);
      return;
    }

    if (e.key === 'Enter') {
      var alvo = painel.querySelector('.ucam-busca__item--corrente');
      if (alvo && !painel.hidden) { e.preventDefault(); alvo.click(); }
    }
  });
})();
`.trim();

/**
 * A NAVEGAÇÃO SOBREPOSTA — abrir, fechar, Esc, retenção de foco.
 *
 * A folha entrega os dois estados: `[data-nav="open"]` desliza o painel e
 * acende o escurecimento. O comentário dela diz, desde sempre, "a aplicação
 * alterna data-nav". Só que estas telas SÃO a aplicação de referência, e
 * ninguém alternava nada — o botão de menu da faixa estava no HTML e não fazia
 * coisa alguma. Abaixo de 64rem, que são duas das quatro larguras que a
 * moldura de dispositivo da documentação oferece, a navegação de todo sistema
 * do parque ficava inalcançável.
 *
 * Retenção de foco de verdade, e não só `focus()` no primeiro item: painel
 * sobreposto COM escurecimento é modal, e Tab que escapa para o conteúdo
 * escurecido atrás é a falha clássica da gaveta implementada pela metade — a
 * mesma que o contrato do app-shell aponta no drawer do Protocolo.
 *
 * Delegação no documento pela razão já registrada no script do menu da conta:
 * a documentação monta preview depois do carregamento.
 */
export const navScript = `
(function () {
  var FOCAVEIS = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
  var gatilhoAtual = null;

  function shellDe(el) { return el && el.closest('.ucam-shell'); }

  function gatilhos(shell) {
    return Array.prototype.slice.call(
      shell.querySelectorAll('.ucam-appbar__menu,.ucam-rail__menu,.ucam-mobilebar__menu')
    );
  }

  function visivel(el) { return !!(el.offsetWidth || el.offsetHeight); }

  // O que fica ATRÁS do escurecimento sai da árvore enquanto a gaveta está
  // aberta. A armadilha de Tab não alcança o leitor de tela no celular, que
  // navega por gesto e nunca aperta Tab. A faixa fica de fora: é nela que mora
  // o gatilho, e ele faz parte do ciclo.
  function fundo(shell) {
    return Array.prototype.filter.call(shell.children, function (el) {
      return el.matches('.ucam-main,.ucam-shell__footer');
    });
  }

  function fechar(shell, devolverFoco) {
    if (!shell || shell.dataset.nav !== 'open') return;
    fundo(shell).forEach(function (el) { el.inert = false; });
    shell.dataset.nav = 'closed';
    gatilhos(shell).forEach(function (g) { g.setAttribute('aria-expanded', 'false'); });
    if (devolverFoco && gatilhoAtual) gatilhoAtual.focus();
    gatilhoAtual = null;
  }

  function abrir(shell, gatilho) {
    shell.dataset.nav = 'open';
    if (!window.matchMedia('(min-width: 64rem)').matches) fundo(shell).forEach(function (el) { el.inert = true; });
    gatilhos(shell).forEach(function (g) { g.setAttribute('aria-expanded', 'true'); });
    gatilhoAtual = gatilho;
    var nav = shell.querySelector('.ucam-nav');
    if (!nav) return;
    // O FECHAR da gaveta, quando existe e está visível: quem abre pelo
    // teclado encontra a saída antes de andar pelo menu. Caía na ação
    // primária ("Novo requerimento"), que é o primeiro focável — e a primeira
    // coisa que a gaveta oferecia era criar um registro, não navegar.
    // Sem ele, o primeiro focável DO PAINEL, e não o painel: pousar num <nav>
    // sem tabindex não move o foco, e o teclado ficaria no gatilho atrás do
    // escurecimento.
    var fecharBtn = nav.querySelector('.ucam-nav__fechar');
    var primeiro = (fecharBtn && visivel(fecharBtn)) ? fecharBtn : nav.querySelector(FOCAVEIS);
    if (primeiro) primeiro.focus();
  }

  document.addEventListener('click', function (e) {
    var gatilho = e.target.closest && e.target.closest('.ucam-appbar__menu,.ucam-rail__menu,.ucam-mobilebar__menu');
    if (gatilho) {
      e.preventDefault();
      var shell = shellDe(gatilho);
      if (!shell) return;
      if (shell.dataset.nav === 'open') fechar(shell, true);
      else abrir(shell, gatilho);
      return;
    }
    var scrim = e.target.closest && e.target.closest('.ucam-nav-scrim');
    if (scrim) return fechar(shellDe(scrim), true);
    var fecharGaveta = e.target.closest && e.target.closest('.ucam-nav__fechar');
    if (fecharGaveta) return fechar(shellDe(fecharGaveta), true);
    // Link do menu também fecha: no modo sobreposto o painel cobre a página,
    // e navegar sem fechar deixaria a pessoa olhando o menu de novo em vez do
    // conteúdo que ela pediu.
    var link = e.target.closest && e.target.closest('.ucam-nav a[href]');
    if (link) fechar(shellDe(link), false);
  });

  document.addEventListener('keydown', function (e) {
    var shell = document.querySelector('.ucam-shell[data-nav="open"]');
    if (!shell) return;
    if (e.key === 'Escape') { e.preventDefault(); return fechar(shell, true); }
    if (e.key !== 'Tab') return;

    var nav = shell.querySelector('.ucam-nav');
    if (!nav) return;
    // O ciclo inclui os gatilhos visíveis junto com o painel: fechar o menu é
    // a saída natural, e tirá-la do ciclo obrigaria a usar Esc para uma ação
    // que tem botão desenhado na tela.
    var lista = Array.prototype.slice
      .call(nav.querySelectorAll(FOCAVEIS))
      .concat(gatilhos(shell))
      .filter(visivel);
    if (!lista.length) return;
    var primeiro = lista[0];
    var ultimo = lista[lista.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  });

  // Passar de sobreposto para coluna da grade com o painel aberto deixaria o
  // escurecimento pendurado sobre uma navegação que ali já não é modal.
  var largo = window.matchMedia('(min-width: 64rem)');
  if (largo.addEventListener) {
    largo.addEventListener('change', function (m) {
      if (m.matches) fechar(document.querySelector('.ucam-shell[data-nav="open"]'), false);
    });
  }
})();
`.trim();

/**
 * O menu da conta e os ramos da navegação, para as páginas de tela.
 *
 * A folha entrega a APARÊNCIA dos dois estados — \`hidden\` fecha, \`aria-expanded\`
 * gira o chevron. O que ela não entrega, porque é comportamento, está aqui:
 * abrir, fechar com Esc, fechar ao clicar fora, devolver o foco ao gatilho e
 * manter \`aria-expanded\` em dia. É a mesma divisão que o listbox do Select já
 * faz, e pelo mesmo motivo: um app AngularJS tem ng-click; o que ele não tinha
 * era com o que pintar o menu.
 *
 * DELEGAÇÃO NO DOCUMENTO, e não um ouvinte por gatilho — a mesma escolha do
 * listbox e pela mesma razão: o site monta os previews com innerHTML depois do
 * carregamento, e um querySelectorAll rodado uma vez na inicialização não
 * enxerga nada que chegue depois dele.
 *
 * As setas existem porque \`role="menu"\` as promete. Quem abre um menu pelo
 * teclado espera Cima e Baixo; um menu que só responde a Tab é menu no nome e
 * lista de links no comportamento.
 */
/**
 * Os controles de ESTADO das telas: estrela de favorito, segmented e seção
 * recolhível.
 *
 * Os três carregavam o atributo certo — aria-pressed, aria-expanded — e
 * nenhum mudava ao clique. A sonda de 10/09/2026 contou 70 controles mortos
 * de 72 na grade do Portal, e 3 estrelas mortas na navegação de TODA tela do
 * Protocolo: a promessa estava na marcação e não na tela, que é exatamente o
 * defeito que o contrato do menu registrou no chip de campus.
 *
 * A estrela é o caso com mais regra, todas do contrato icon-button:
 *   - aria-pressed alterna e o RÓTULO acompanha o próximo verbo — "Fixar X
 *     nos Y" vira "Remover X dos Y" e volta. O ícone muda de forma sozinho:
 *     a folha lê o aria-pressed.
 *   - o estado tem ECO em outro lugar da tela, senão é adivinhação: fixar um
 *     módulo o põe na seção Favoritos do Portal; fixar um registro o põe no grupo
 *     Favoritos da navegação; desfixar em qualquer um dos dois lados desfaz
 *     o outro.
 * O alvo é lido do próprio rótulo, que já o nomeia: não há segundo atributo
 * para dessincronizar.
 */
/**
 * O ECO FALADO, e ele é de MAIS DE UM SCRIPT.
 *
 * Estava dentro do estadoScript. Quando as preferências da gaveta — que vivem
 * no filtroScript, outro IIFE — passaram a confirmar o que salvaram, a chamada
 * lançou ReferenceError e o handler morreu em silêncio: o navegador não
 * reclama de erro em ouvinte de evento onde ninguém está olhando.
 *
 * Duas cópias resolveriam e divergiriam no primeiro ajuste, que é o defeito
 * que tools/lib/wcag.mjs existe para evitar. Uma fonte, interpolada em cada
 * script que precisa — cada um a recebe dentro do próprio IIFE, então não há
 * colisão de nome.
 */
const FN_ANUNCIA = `
  /**
   * O ECO FALADO. Uma frase curta, no passado, dizendo o que a tela acabou de
   * fazer — a mesma coisa que o selo trocado e a linha nova dizem a quem vê.
   *
   * Esvazia antes de escrever: repetir a MESMA frase sem limpar não produz
   * anúncio nenhum, e arquivar duas naturezas seguidas é o caso comum.
   *
   * A região é procurada a partir do gatilho porque a página do site mostra
   * vários shells de uma vez; o primeiro do documento seria o shell errado.
   */
  function anuncia(texto, de) {
    if (!texto) return;
    var raiz = (de && de.closest && de.closest('.ucam-shell')) || document;
    var regiao = raiz.querySelector('[data-anuncio]') || document.querySelector('[data-anuncio]');
    if (!regiao) return;
    regiao.textContent = '';
    setTimeout(function () { regiao.textContent = texto; }, 60);
  }
`;

export const estadoScript = `
(function () {
  var RE = /^(Fixar|Remover) (.+) (nos|dos) (.+)$/;

  function alvoDe(botao) {
    var m = RE.exec(botao.getAttribute('aria-label') || '');
    return m ? { alvo: m[2], onde: m[4] } : null;
  }

  // Um botão, um estado: o atributo e o rótulo saem juntos.
  function marcar(botao, fixado) {
    var a = alvoDe(botao);
    botao.setAttribute('aria-pressed', String(fixado));
    if (a) botao.setAttribute('aria-label', (fixado ? 'Remover ' : 'Fixar ') + a.alvo + (fixado ? ' dos ' : ' nos ') + a.onde);
  }

  function estrelas(alvo) {
    return Array.prototype.filter.call(document.querySelectorAll('button[aria-pressed]'), function (b) {
      var a = alvoDe(b);
      return a && a.alvo === alvo;
    });
  }

  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  // --- menu da coluna da tabela -----------------------------------------------
  // Contrato data-table.json, parte column-menu. Tudo aqui trabalha pela
  // COLUNA ORIGINAL (data-col), carimbada na primeira vez que a tabela e
  // tocada: fixar move celulas de lugar, e o indice na fileira deixa de dizer
  // de que coluna uma celula e.
  function colunasCarimbar(tabela) {
    if (tabela.hasAttribute('data-colunas')) return;
    tabela.setAttribute('data-colunas', '');
    var n = tabela.tHead ? tabela.tHead.rows[0].children.length : 0;
    Array.prototype.forEach.call(tabela.rows, function (tr) {
      // Fileira de estado (vazio, erro) tem uma celula com colspan: fica fora.
      if (tr.children.length !== n) return;
      Array.prototype.forEach.call(tr.children, function (c, k) { c.setAttribute('data-col', String(k)); });
    });
  }

  function colunaCelulas(tabela, th) {
    return tabela.querySelectorAll('[data-col="' + th.getAttribute('data-col') + '"]');
  }

  function colunaMarcar(th, acao, sim) {
    var it = th.querySelector('[data-coluna="' + acao + '"]');
    if (it) it.setAttribute('aria-checked', String(sim));
  }

  // O texto que ORDENA: data em dd/mm/aaaa vira aaaammdd, e travessao ou
  // celula vazia valem como ausente — que vai para o FIM nas duas direcoes
  // (contrato data-table: sort).
  function colunaValor(td) {
    var v = td ? td.textContent.replace(/\\s+/g, ' ').trim() : '';
    if (v === '\\u2014' || v === '\\u2013' || v === '-') return '';
    var d = /^(\\d{2})\\/(\\d{2})\\/(\\d{4})/.exec(v);
    return d ? d[3] + d[2] + d[1] + v.slice(10) : v;
  }

  function colunaOrdenar(tabela, th, dir) {
    var tb = tabela.tBodies[0];
    if (!tb) return;
    var linhas = Array.prototype.slice.call(tb.rows);
    linhas.forEach(function (tr, k) { if (!tr.hasAttribute('data-ordem')) tr.setAttribute('data-ordem', String(k)); });
    var col = th.getAttribute('data-col');
    var cmp = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
    function cel(tr) { return tr.querySelector('[data-col="' + col + '"]'); }
    linhas.sort(function (a, b) {
      if (!dir) return Number(a.getAttribute('data-ordem')) - Number(b.getAttribute('data-ordem'));
      var va = colunaValor(cel(a));
      var vb = colunaValor(cel(b));
      if (!va && vb) return 1;
      if (va && !vb) return -1;
      var r = cmp.compare(va, vb);
      return dir === 'desc' ? -r : r;
    });
    linhas.forEach(function (tr) { tb.appendChild(tr); });
    // Quem pagina é o filtroScript; daqui sai só o aviso de que a fila mudou de
    // ordem. Sem ele a página 1 seguiria mostrando as linhas que já estavam
    // visíveis, agora espalhadas pela ordem nova.
    tabela.dispatchEvent(new CustomEvent('ucam:lista', { bubbles: true }));
    // UMA coluna governa a ordem: as outras ordenaveis voltam a none, e o
    // aria-sort que o leitor anuncia e o mesmo atributo que pinta a seta.
    Array.prototype.forEach.call(th.parentElement.children, function (o) {
      if (!o.hasAttribute('aria-sort')) return;
      var d = o === th ? dir : null;
      o.setAttribute('aria-sort', d === 'asc' ? 'ascending' : d === 'desc' ? 'descending' : 'none');
      var uso = o.querySelector('.ucam-table__coluna > svg use');
      if (uso) uso.setAttribute('href', d === 'asc' ? '#i-chevronUp' : d === 'desc' ? '#i-chevronDown' : '#i-chevronsUpDown');
      colunaMarcar(o, 'asc', d === 'asc');
      colunaMarcar(o, 'desc', d === 'desc');
      var limpar = o.querySelector('[data-coluna="limpar"]');
      if (limpar) limpar.hidden = !d;
    });
  }

  // Reordena as colunas e escreve o sticky. Peso: selecao 0, fixa no inicio
  // 1, o resto 2 na ordem original, fixa no fim 3, acoes 4.
  function colunasArranjar(tabela) {
    var cab = tabela.tHead && tabela.tHead.rows[0];
    if (!cab) return;
    var ths = Array.prototype.slice.call(cab.children);
    function peso(th) {
      if (th.classList.contains('th--selecao')) return 0;
      var f = th.getAttribute('data-fixa');
      if (f === 'inicio') return 1;
      if (f === 'fim') return 3;
      if (th.classList.contains('th--acoes')) return 4;
      return 2;
    }
    var ordem = ths.slice().sort(function (a, b) {
      return peso(a) - peso(b) || Number(a.getAttribute('data-col')) - Number(b.getAttribute('data-col'));
    });
    var temInicio = ths.some(function (th) { return th.getAttribute('data-fixa') === 'inicio'; });
    var temFim = ths.some(function (th) { return th.getAttribute('data-fixa') === 'fim'; });
    var chaves = ordem.map(function (th) { return th.getAttribute('data-col'); });
    Array.prototype.forEach.call(tabela.rows, function (tr) {
      if (tr.children.length !== ths.length) return;
      var por = {};
      Array.prototype.forEach.call(tr.children, function (c) { por[c.getAttribute('data-col')] = c; });
      chaves.forEach(function (k) { if (por[k]) tr.appendChild(por[k]); });
    });
    // O bloco fixo de cada lado: a selecao gruda junto com a fixa do inicio,
    // e as acoes junto com a do fim.
    var lados = ordem.map(function (th) {
      var p = peso(th);
      return p <= 1 && temInicio ? 'inicio' : p >= 3 && temFim ? 'fim' : null;
    });
    var ultimaInicio = lados.lastIndexOf('inicio');
    var primeiraFim = lados.indexOf('fim');
    var x = 0;
    var desloc = {};
    ordem.forEach(function (th, i) {
      if (lados[i] === 'inicio') { desloc[i] = x; x += th.getBoundingClientRect().width; }
    });
    x = 0;
    for (var i = ordem.length - 1; i >= 0; i--) {
      if (lados[i] === 'fim') { desloc[i] = x; x += ordem[i].getBoundingClientRect().width; }
    }
    ordem.forEach(function (th, i) {
      Array.prototype.forEach.call(colunaCelulas(tabela, th), function (c) {
        c.classList.toggle('ucam-col--fixa-inicio', lados[i] === 'inicio');
        c.classList.toggle('ucam-col--fixa-fim', lados[i] === 'fim');
        c.classList.toggle('ucam-col--borda-inicio', i === ultimaInicio);
        c.classList.toggle('ucam-col--borda-fim', i === primeiraFim);
        if (lados[i]) c.style.setProperty('--ucam-col-x', desloc[i] + 'px');
        else c.style.removeProperty('--ucam-col-x');
      });
    });
  }

  function colunaFixar(tabela, th, lado) {
    // Uma fixa por lado: fixar outra do mesmo lado solta a anterior.
    Array.prototype.forEach.call(th.parentElement.children, function (o) {
      if (lado && o !== th && o.getAttribute('data-fixa') === lado) {
        o.removeAttribute('data-fixa');
        colunaMarcar(o, 'fixar-inicio', false);
        colunaMarcar(o, 'fixar-fim', false);
      }
    });
    if (lado) th.setAttribute('data-fixa', lado); else th.removeAttribute('data-fixa');
    colunaMarcar(th, 'fixar-inicio', lado === 'inicio');
    colunaMarcar(th, 'fixar-fim', lado === 'fim');
    colunasArranjar(tabela);
  }

  function colunaBarraOcultas(tabela) {
    var alvo = tabela.closest('.ucam-table-wrap') || tabela;
    var n = tabela.tHead.querySelectorAll('th[hidden]').length;
    var barra = alvo.previousElementSibling;
    if (!barra || !barra.classList.contains('ucam-table__ocultas')) {
      if (!n) return null;
      barra = document.createElement('div');
      barra.className = 'ucam-table__ocultas';
      alvo.parentNode.insertBefore(barra, alvo);
    }
    if (!n) { barra.remove(); return null; }
    barra.innerHTML = '<span role="status"></span><button type="button" class="ucam-btn ucam-btn--ghost ucam-btn--sm" data-coluna-reexibir>Mostrar</button>';
    barra.querySelector('span').textContent = plural(n, 'coluna oculta', 'colunas ocultas');
    return barra.querySelector('button');
  }

  // Devolve o elemento que deve receber o foco, quando nao for o gatilho.
  function colunaAgir(tabela, th, acao, marcado) {
    colunasCarimbar(tabela);
    if (acao === 'asc' || acao === 'desc') { colunaOrdenar(tabela, th, marcado ? null : acao); return null; }
    if (acao === 'limpar') { colunaOrdenar(tabela, th, null); return null; }
    if (acao === 'fixar-inicio' || acao === 'fixar-fim') {
      colunaFixar(tabela, th, marcado ? null : acao === 'fixar-inicio' ? 'inicio' : 'fim');
      return null;
    }
    if (acao === 'ocultar') {
      if (th.getAttribute('data-fixa')) colunaFixar(tabela, th, null);
      Array.prototype.forEach.call(colunaCelulas(tabela, th), function (c) { c.hidden = true; });
      colunasArranjar(tabela);
      return colunaBarraOcultas(tabela);
    }
    return null;
  }

  /* O X DO ALERTA. O contrato do alert tem a prop dismissible e a folha desenha o
   * botão; no Trilho A nada o dispensava. Não é ação de tela — é comportamento
   * do componente —, então quem identifica é a CLASSE, e vale em qualquer tela
   * sem precisar de data-acao repetido em cada aviso.
   *
   * O foco não pode sumir com o elemento: ele vai para o título da região, que
   * recebe tabindex -1 só para poder recebê-lo — a mesma saída que o diálogo
   * usa quando a linha que o abriu deixou de existir. */
  document.addEventListener('click', function (e) {
    var x = e.target.closest && e.target.closest('.ucam-alert__fechar');
    if (!x) return;
    var alerta = x.closest('.ucam-alert');
    if (!alerta) return;
    var tinhaFoco = alerta.contains(document.activeElement);
    var regiao = alerta.closest('section, .ucam-corpo, main') || document.body;
    alerta.remove();
    if (tinhaFoco) {
      var titulo = regiao.querySelector('.ucam-viewbar__titulo, .ucam-section__title, h1, h2, h3');
      if (titulo) { titulo.setAttribute('tabindex', '-1'); titulo.focus(); }
    }
  });

  // --- ações da tela (data-acao) ---------------------------------------------
  var NL = String.fromCharCode(10);

  function eco(el) {
    if (!el) return;
    el.removeAttribute('data-eco');
    void el.offsetWidth;
    el.setAttribute('data-eco', 'true');
    setTimeout(function () { el.removeAttribute('data-eco'); }, 1700);
  }

${FN_ANUNCIA}

  /**
   * O AVISO DA AÇÃO: um .ucam-alert de verdade na região, e só quando a
   * confirmação carrega informação que a pessoa vai precisar DEPOIS (contrato
   * alert.json). Não flutua, não some sozinho e não é toast — toast está fora
   * do catálogo por decisão, e a razão é esta: mensagem que some não pode
   * carregar informação necessária.
   *
   * Um por região: o segundo substitui o primeiro, porque dois alertas
   * empilhados não são lidos. Vai DEPOIS do cabeçalho da seção — o aviso é do
   * conteúdo, não do título.
   *
   * Sem role=status: quem fala é a região de anúncio, que já existe e já
   * recebeu a mesma frase. Dois anúncios da mesma coisa é pior que um.
   */
  function avisa(texto, de, tom) {
    var regiao =
      (de.closest && de.closest('section')) ||
      (de.closest('.ucam-shell') || document).querySelector('.ucam-corpo') ||
      document.querySelector('main');
    if (!regiao) return;
    var anterior = regiao.querySelector('[data-aviso-da-acao]');
    if (anterior) anterior.remove();
    var icone = tom === 'warning' ? 'triangleAlert' : tom === 'info' ? 'info' : 'circleCheck';
    var el = document.createElement('div');
    el.className = 'ucam-alert ucam-alert--' + (tom || 'success');
    el.setAttribute('data-aviso-da-acao', '');
    el.innerHTML =
      '<svg class="ic" aria-hidden="true"><use href="#i-' + icone + '"/></svg>' +
      '<div class="ucam-alert__corpo"></div>' +
      '<button class="ucam-alert__fechar" type="button" aria-label="Fechar aviso">' +
      '<svg class="ic" aria-hidden="true"><use href="#i-x"/></svg></button>';
    el.querySelector('.ucam-alert__corpo').textContent = texto;
    var cabeca = regiao.querySelector(':scope > .ucam-section__cabeca, :scope > .ucam-cluster');
    if (cabeca) cabeca.insertAdjacentElement('afterend', el);
    else regiao.insertBefore(el, regiao.firstChild);
    return eco(el);
  }

  /**
   * O erro PERTENCE AO CAMPO (contrato field.json): aria-invalid no controle,
   * a frase em .ucam-field__error com role=alert, e o id dela na FRENTE do
   * aria-describedby — o apoio continua descrito, depois do erro.
   *
   * Antes daqui, a resposta vazia só chamava focus() no campo: o envio era
   * recusado em silêncio, que é o defeito que o design system combate no
   * legado. Nada dizia por que não foi.
   */
  function erroDeCampo(campo, frase) {
    if (!campo.id) campo.id = 'campo-' + Math.random().toString(36).slice(2, 8);
    var id = campo.id + '-erro';
    var caixa = document.getElementById(id);
    if (!caixa) {
      caixa = document.createElement('p');
      caixa.className = 'ucam-field__error';
      caixa.id = id;
      caixa.setAttribute('role', 'alert');
      caixa.setAttribute('data-erro-do-script', '');
      var casca = campo.closest('.ucam-field') || campo.parentElement;
      casca.appendChild(caixa);
    }
    // role=alert anuncia sozinho ao entrar; não passa pela região viva, para
    // a mesma frase não ser dita duas vezes.
    caixa.textContent = frase;
    campo.setAttribute('aria-invalid', 'true');
    var resto = (campo.getAttribute('aria-describedby') || '').split(/\\s+/).filter(function (x) { return x && x !== id; });
    campo.setAttribute('aria-describedby', [id].concat(resto).join(' '));
    campo.focus();
  }

  /** Tira o erro que ESTE script pôs — nunca um que a tela declarou. */
  function semErroDeCampo(campo) {
    var id = campo.id + '-erro';
    var caixa = document.getElementById(id);
    if (!caixa || !caixa.hasAttribute('data-erro-do-script')) return;
    caixa.remove();
    campo.removeAttribute('aria-invalid');
    var resto = (campo.getAttribute('aria-describedby') || '').split(/\\s+/).filter(function (x) { return x && x !== id; });
    if (resto.length) campo.setAttribute('aria-describedby', resto.join(' '));
    else campo.removeAttribute('aria-describedby');
  }

  // Digitou, o erro sai: o campo deixa de estar errado no instante em que
  // deixa de estar vazio, e manter a mensagem seria mentir sobre o estado.
  document.addEventListener('input', function (e) {
    var alvo = e.target;
    if (!alvo || !alvo.getAttribute || alvo.getAttribute('aria-invalid') !== 'true') return;
    semErroDeCampo(alvo);
    // A recusa de acesso vale pelos DOIS campos: basta mexer em um para a
    // mensagem deixar de valer, e deixá-la na tela seria dizer que o novo
    // valor também está errado antes de tentar.
    var form = alvo.closest('form');
    var recusa = form && form.querySelector('[data-alerta-acesso]');
    if (!recusa) return;
    recusa.remove();
    Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid="true"]'), function (c) {
      c.removeAttribute('aria-invalid');
    });
  });

  function rotuloTemporario(botao, texto) {
    if (botao.hasAttribute('data-rotulo-original')) return;
    botao.setAttribute('data-rotulo-original', botao.innerHTML);
    botao.textContent = texto;
    setTimeout(function () {
      botao.innerHTML = botao.getAttribute('data-rotulo-original');
      botao.removeAttribute('data-rotulo-original');
    }, 2000);
  }

  /**
   * A RECUSA DE ACESSO, no topo do formulário e ancorada a ele.
   *
   * Um alerta por região (contrato alert): o anterior sai antes de o novo
   * entrar. role=alert anuncia sozinho ao ser inserido — por isso a região
   * viva da tela fica de fora, para a mesma frase não sair duas vezes.
   *
   * Os dois campos ficam aria-invalid sem mensagem própria: a mensagem é uma
   * só e está no alerta. Marcar cada campo com "incorreto" diria que o
   * sistema sabe qual dos dois errou, e ele não sabe.
   */
  function acessoNegado(form, cpf, senha) {
    var velho = form.querySelector('[data-alerta-acesso]');
    if (velho) velho.remove();

    var alerta = document.createElement('div');
    alerta.className = 'ucam-alert ucam-alert--danger';
    alerta.setAttribute('role', 'alert');
    alerta.setAttribute('data-alerta-acesso', '');
    alerta.innerHTML =
      '<svg class="ic" aria-hidden="true"><use href="#i-circleAlert"/></svg>' +
      '<div class="ucam-alert__corpo"></div>';
    alerta.querySelector('.ucam-alert__corpo').textContent =
      'CPF ou senha incorretos. Confira os dois e tente de novo. Se esqueceu a senha, use "Esqueci minha senha" logo acima do campo.';
    form.insertBefore(alerta, form.firstElementChild);

    cpf.setAttribute('aria-invalid', 'true');
    senha.setAttribute('aria-invalid', 'true');
    // O foco volta ao primeiro campo, não ao alerta: quem vai corrigir precisa
    // digitar, e o role=alert já levou a mensagem a quem ouve.
    cpf.focus();
  }

  function hora() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  // O selo de SITUAÇÃO do registro: o primeiro selo, subindo a partir do
  // botão, cujo texto é uma situação — não o de prioridade nem o de modalidade.
  var SITUACOES = ['Em análise', 'Encaminhado', 'Concluído', 'Aguardando', 'Aberto'];
  function seloSituacao(de) {
    for (var a = de; a && a !== document.body; a = a.parentElement) {
      var achado = Array.prototype.filter.call(a.querySelectorAll('.ucam-badge'), function (b) {
        return SITUACOES.some(function (s) { return b.textContent.trim() === s; });
      })[0];
      if (achado) return achado;
    }
    return null;
  }

  function mudarSelo(selo, texto, tom) {
    if (!selo) return;
    selo.className = 'ucam-badge ucam-badge--' + tom;
    selo.innerHTML = '<span class="ucam-badge__ponto" aria-hidden="true"></span>' + texto;
    eco(selo);
  }

  function evento(texto, icone) {
    var tl = document.querySelector('.ucam-timeline');
    if (!tl) return;
    var li = document.createElement('li');
    li.className = 'ucam-timeline__item';
    li.setAttribute('data-tipo', 'evento');
    li.innerHTML =
      '<span class="ucam-timeline__trilho" aria-hidden="true"><span class="ucam-timeline__no"><svg class="ic" aria-hidden="true"><use href="#i-' + icone + '"/></svg></span><span class="ucam-timeline__linha"></span></span>' +
      '<div class="ucam-timeline__conteudo"><p class="ucam-timeline__cabecalho"><span class="ucam-timeline__autor">Você</span><time class="ucam-timeline__tempo">agora</time></p><p class="ucam-timeline__corpo"></p></div>';
    li.querySelector('.ucam-timeline__corpo').textContent = texto;
    // Com corte por fase, o primeiro filho é o rótulo da fase atual: o item
    // novo entra logo abaixo dele, e não acima, fora da fase.
    var topo = tl.firstElementChild;
    if (topo && topo.classList.contains('ucam-timeline__grupo')) topo = topo.nextElementSibling;
    tl.insertBefore(li, topo);
    eco(li);
  }

  function csvDe(tabela) {
    var q = function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; };
    return Array.prototype.filter.call(tabela.rows, function (tr) {
      return !tr.hidden;
    }).map(function (tr) {
      return Array.prototype.filter.call(tr.cells, function (c) {
        return !c.hidden && !c.classList.contains('th--selecao') && !c.classList.contains('td--selecao') && !c.classList.contains('th--acoes') && !c.classList.contains('td--acoes');
      }).map(function (c) {
        var clone = c.cloneNode(true);
        Array.prototype.forEach.call(clone.querySelectorAll('.ucam-menu, .ucam-sr-only'), function (n) { n.remove(); });
        return q(clone.textContent.replace(/[ \\t\\r\\n]+/g, ' ').trim());
      }).join(';');
    }).join(NL);
  }

  // O TILE DO ANEXO a partir de um File. O tamanho sai em pt-BR com uma casa
  // e piso de 1 KB, como pede o contrato: ninguém precisa saber de 312 bytes.
  function tamanhoBr(b) {
    if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + ' KB';
    return (b / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
  }

  /**
   * A REGRA do campo, lida do gatilho: data-accept e data-max-size. Fica no
   * markup, e não numa constante daqui, porque é a tela que declara o que
   * aceita — e é a mesma declaração que gera a frase de apoio.
   */
  function regraDoAnexo(botao) {
    var campo = botao.closest('fieldset, .ucam-field, .ucam-compositor') || botao.parentElement;
    var g = campo.querySelector('[data-accept], [data-max-size]') || botao;
    var aceita = (g.getAttribute('data-accept') || '').split(',').map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
    var teto = Number(g.getAttribute('data-max-size') || 0) || null;
    return { aceita: aceita, teto: teto };
  }

  function nomesDosFormatos(aceita) {
    var nomes = aceita.map(function (r) { return r.replace(/^\\./, '').toUpperCase(); });
    if (nomes.length < 2) return nomes[0] || '';
    return nomes.slice(0, -1).join(', ') + ' nem ' + nomes[nomes.length - 1];
  }

  /**
   * Por que o arquivo não entrou — ou null. O motivo é texto com o NÚMERO que
   * a pessoa precisa: "tem 14,2 MB — o limite é 10 MB", nunca "arquivo
   * inválido" (contrato file-field, conteudo.recusa).
   */
  function recusaDe(f, regra) {
    if (regra.teto && f.size > regra.teto) {
      return 'tem ' + tamanhoBr(f.size) + ' — o limite é ' + tamanhoBr(regra.teto).replace(',0 ', ' ');
    }
    if (!regra.aceita.length) return null;
    var nome = f.name.toLowerCase();
    var tipo = (f.type || '').toLowerCase();
    var serve = regra.aceita.some(function (r) {
      if (r.charAt(0) === '.') return nome.slice(-r.length) === r;
      if (r.slice(-2) === '/*') return tipo.indexOf(r.slice(0, -1)) === 0;
      return tipo === r;
    });
    return serve ? null : 'não é ' + nomesDosFormatos(regra.aceita);
  }

  function anexoTile(f, recusa) {
    var ext = (f.name.split('.').pop() || '').toUpperCase();
    var figura = recusa ? 'circleAlert' : /^(JPE?G|PNG|GIF|WEBP)$/.test(ext) ? 'image' : /^(PDF|DOCX?|ODT|TXT|RTF)$/.test(ext) ? 'fileText' : 'file';
    var li = document.createElement('li');
    li.className = recusa ? 'ucam-anexo ucam-anexo--recusado' : 'ucam-anexo';
    li.innerHTML =
      '<span class="ucam-anexo__figura" aria-hidden="true"><svg class="ic" aria-hidden="true"><use href="#i-' + figura + '"/></svg></span>' +
      '<span class="ucam-anexo__corpo"><span class="ucam-anexo__nome"></span><span class="ucam-anexo__apoio"></span></span>' +
      '<button class="ucam-btn ucam-btn--icon ucam-btn--ghost ucam-btn--sm ucam-anexo__acao" type="button" data-acao="remover-anexo"><svg class="ic" aria-hidden="true"><use href="#i-x"/></svg></button>';
    // Nome por textContent: o nome do arquivo é dado de quem anexou, e um
    // arquivo chamado <img onerror=...>.pdf não pode virar marcação.
    var nome = li.querySelector('.ucam-anexo__nome');
    nome.textContent = f.name;
    nome.title = f.name;
    // Recusado, o apoio é só o motivo: repetir formato e tamanho ao lado de
    // "tem 14,2 MB" seria dizer o mesmo número duas vezes.
    li.querySelector('.ucam-anexo__apoio').textContent = recusa || ((ext ? ext + ' · ' : '') + tamanhoBr(f.size) + ' · anexado');
    li.querySelector('.ucam-anexo__acao').setAttribute('aria-label', 'Remover anexo ' + f.name);
    return li;
  }

  function baixar(nome, conteudo) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([String.fromCharCode(0xFEFF) + conteudo], { type: 'text/csv;charset=utf-8' }));
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function limparCampos(de) {
    var raiz = de.closest('form, .ucam-section, .ucam-card, .ucam-aside') || document;
    // Sobe até achar campos: o botão pode estar num rodapé de ações sem nenhum.
    while (raiz !== document && !raiz.querySelector('input, textarea, [data-listbox]')) {
      raiz = raiz.parentElement.closest('form, .ucam-section, .ucam-card, .ucam-corpo') || document;
    }
    Array.prototype.forEach.call(raiz.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea'), function (i) { i.value = ''; });
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-listbox]'), function (g) {
      var lb = document.getElementById(g.getAttribute('aria-controls'));
      var primeira = lb && lb.querySelector('.ucam-option');
      if (!primeira) return;
      lb.querySelectorAll('.ucam-option').forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
      primeira.setAttribute('aria-selected', 'true');
      g.textContent = primeira.textContent;
    });
    var primeiro = raiz.querySelector('input:not([type=checkbox]):not([type=radio]), textarea, [data-listbox]');
    if (primeiro) primeiro.focus();
  }

  function andarEtapa(botao, destino) {
    var passos = Array.prototype.slice.call(document.querySelectorAll('.ucam-stepper__passo'));
    if (!passos.length) return;
    var atual = passos.findIndex(function (p) { return p.classList.contains('ucam-stepper__passo--current'); });
    var j = destino === 'inicio' ? 0 : destino === 'voltar' ? Math.max(0, atual - 1) : Math.min(passos.length - 1, atual + 1);
    passos.forEach(function (p, k) {
      p.classList.toggle('ucam-stepper__passo--done', k < j);
      p.classList.toggle('ucam-stepper__passo--current', k === j);
      if (k === j) p.setAttribute('aria-current', 'step'); else p.removeAttribute('aria-current');
      var marcador = p.querySelector('.ucam-stepper__marcador');
      if (marcador) marcador.innerHTML = k < j ? '<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>' : String(k + 1);
      var sr = p.querySelector('.ucam-sr-only');
      if (sr) sr.textContent = ', etapa ' + (k + 1) + ' de ' + passos.length + ', ' + (k < j ? 'concluída' : k === j ? 'atual' : 'pendente');
    });
    /* Na PRIMEIRA etapa não há para onde voltar, e um botão que não volta é
     * o controle morto que este design system combate. Ele fica no lugar —
     * some e volta seria a barra de ações pulando a cada etapa —, mas diz que
     * não age. */
    var voltar = document.querySelector('[data-acao="etapa-voltar"]');
    if (voltar) {
      if (j === 0) { voltar.setAttribute('aria-disabled', 'true'); voltar.setAttribute('title', 'Você está na primeira etapa'); }
      else { voltar.removeAttribute('aria-disabled'); voltar.removeAttribute('title'); }
    }

    var avancar = document.querySelector('[data-acao="etapa-continuar"], [data-acao="enviar"]');
    if (avancar) {
      var ultima = j === passos.length - 1;
      avancar.setAttribute('data-acao', ultima ? 'enviar' : 'etapa-continuar');
      avancar.innerHTML = (ultima ? 'Enviar requerimento' : 'Continuar para revisão') + ' <svg class="ic" aria-hidden="true"><use href="#i-' + (ultima ? 'send' : 'arrowRight') + '"/></svg>';
    }
    var aviso = document.querySelector('.ucam-alert__corpo');
    if (aviso) {
      aviso.textContent = j === passos.length - 1
        ? 'Revise os dados ao lado. Enviar cria o protocolo e avisa o setor responsável; depois disso o requerimento não pode ser editado.'
        : j === 0
          ? 'Etapa 1: confirme quem é o requerente. Trocar abre a busca por matrícula ou nome.'
          : 'Nada é enviado nesta etapa: a revisão vem a seguir. Depois de enviado, o requerimento não pode ser editado.';
    }
    // O nome da etapa sai do próprio passo, sem o sufixo sr-only que ele
    // carrega para o leitor de tela — senão a frase sairia "Requerente, etapa
    // 1 de 3, atual, etapa 1 de 3".
    var srAtual = passos[j].querySelector('.ucam-sr-only');
    var nomeEtapa = passos[j].textContent.replace(srAtual ? srAtual.textContent : '', '').replace(/^\\s*\\d+\\s*/, '').trim();
    anuncia('Etapa ' + (j + 1) + ' de ' + passos.length + ': ' + nomeEtapa + '.', botao);
    eco(passos[j]);
  }

  function agir(botao, qual) {
    if (qual === 'imprimir') return window.print();

    /* NOTIFICAÇÕES LIDAS. O selo some, o nome acessível do sino passa a dizer
     * "nenhuma não lida", o título do painel perde a contagem — e o próprio
     * item se esconde, porque oferecer "marcar todas" sem nada para marcar é a
     * mesma promessa vazia que o sino sem lista era. O foco volta ao sino: o
     * item que some estava com ele, e foco perdido cai no começo do documento.
     */
    if (qual === 'marcar-lidas') {
      var caixa = botao.closest('.ucam-appbar__notificacoes') || document;
      var sino = caixa.querySelector('.ucam-appbar__lancador');
      var selo = caixa.querySelector('.ucam-appbar__selo');
      var leitura = sino && sino.querySelector('.ucam-sr-only');
      var quantas = leitura ? leitura.textContent.replace(/[^0-9]/g, '') : '';
      if (selo) selo.remove();
      if (leitura) leitura.textContent = ', nenhuma não lida';
      var tituloPainel = caixa.querySelector('[data-notificacoes-titulo]');
      if (tituloPainel) tituloPainel.textContent = 'Notificações';
      botao.hidden = true;
      if (sino) sino.focus();
      anuncia(
        quantas ? quantas + ' notificações marcadas como lidas.' : 'Notificações marcadas como lidas.',
        botao,
      );
      return;
    }

    if (qual === 'exportar') {
      var tabela = (botao.closest('.ucam-corpo, .ucam-main') || document).querySelector('table.ucam-table') || document.querySelector('table.ucam-table');
      if (!tabela) return;
      var titulo = (document.querySelector('.ucam-viewbar__titulo, h1') || {}).textContent || 'tabela';
      baixar(titulo.trim().toLowerCase().replace(/[^a-z0-9à-ú]+/gi, '-') + '.csv', csvDe(tabela));
      anuncia('Tabela exportada em CSV.', botao);
      return rotuloTemporario(botao, 'Exportado');
    }

    // ANEXAR monta a grade do Anexo (spec/components/anexo.json), e não mais
    // uma frase "Anexado: a.pdf, b.pdf". A frase dizia o nome e parava ali:
    // sem tamanho, sem formato, sem como tirar o arquivo errado.
    if (qual === 'anexar') {
      var entrada = document.createElement('input');
      entrada.type = 'file';
      entrada.multiple = true;
      entrada.addEventListener('change', function () {
        if (!entrada.files.length) return;
        // .ucam-compositor vem PRIMEIRO: dentro dele o ancestral mais próximo
        // seria a barra de ações, e a grade de anexos nasceria dentro da caixa
        // de escrever. Anexo é vizinho da caixa, não conteúdo dela.
        var lugar = botao.closest('.ucam-compositor, .ucam-cluster, .ucam-field, fieldset, .ucam-form-actions') || botao.parentElement;
        var grade = (botao.closest('fieldset') || lugar.parentElement).querySelector('ul.ucam-anexos[data-anexos]');
        if (!grade) {
          grade = document.createElement('ul');
          grade.className = 'ucam-anexos';
          grade.setAttribute('data-anexos', '');
          grade.setAttribute('aria-label', 'Arquivos anexados');
          lugar.insertAdjacentElement('afterend', grade);
        }
        // VALIDA antes de montar. O arquivo recusado entra na lista e FICA:
        // recusado que some do campo é o comportamento do parque hoje, e é a
        // razão de a pessoa tentar o mesmo arquivo três vezes.
        var regra = regraDoAnexo(botao);
        var entraram = 0;
        var recusas = [];
        Array.prototype.forEach.call(entrada.files, function (f) {
          var recusa = recusaDe(f, regra);
          if (recusa) recusas.push(f.name + ' ' + recusa + '.');
          else entraram++;
          grade.appendChild(anexoTile(f, recusa));
        });
        eco(grade.lastElementChild);
        var dito = [];
        if (entraram) dito.push(entraram === 1 ? 'Arquivo anexado.' : entraram + ' arquivos anexados.');
        anuncia(dito.concat(recusas).join(' '), botao);
        // O foco vai para a primeira linha recusada: a recusa veio de escolha
        // por teclado, e quem escolheu precisa chegar ao motivo.
        if (recusas.length) {
          var primeira = grade.querySelector('.ucam-anexo--recusado');
          if (primeira) { primeira.setAttribute('tabindex', '-1'); primeira.focus(); }
        }
      });
      return entrada.click();
    }

    // Tirar da tela devolve o foco ao anexo seguinte, ou ao gatilho quando a
    // grade esvazia — nunca ao topo da página (contrato file-field, teclado).
    if (qual === 'remover-anexo') {
      var li = botao.closest('.ucam-anexo');
      var ul = li && li.parentElement;
      if (!li) return;
      var vizinho = li.nextElementSibling || li.previousElementSibling;
      var nomeAnexo = (li.querySelector('.ucam-anexo__nome') || {}).textContent || 'arquivo';
      li.remove();
      anuncia('Anexo ' + nomeAnexo.trim() + ' removido.', botao);
      if (vizinho) return vizinho.querySelector('button, a').focus();
      var dono = ul.closest('fieldset') || ul.parentElement;
      ul.remove();
      var gatilho = dono.querySelector('[data-acao="anexar"]');
      if (gatilho) gatilho.focus();
      return;
    }

    // Protótipo não tem arquivo para entregar: o tile responde, e é só.
    if (qual === 'baixar-anexo') {
      var tile = botao.closest('.ucam-anexo');
      var nomeArquivo = (tile && tile.querySelector('.ucam-anexo__nome') || botao).textContent.trim();
      anuncia('Baixando ' + nomeArquivo + '.', botao);
      return eco(tile);
    }

    if (qual === 'filtros') {
      var fileira = document.querySelector('.ucam-viewbar__fileira--filtros');
      if (!fileira) return;
      fileira.hidden = !fileira.hidden;
      botao.setAttribute('aria-expanded', String(!fileira.hidden));
      return;
    }

    if (qual === 'remover-filtro' || qual === 'limpar-filtros') {
      var fila = document.querySelector('.ucam-viewbar__fileira--filtros');
      if (!fila) return;
      var chips = qual === 'remover-filtro' ? [botao.closest('.ucam-chip')] : Array.prototype.slice.call(fila.querySelectorAll('.ucam-chip'));
      chips.forEach(function (c) { if (c) c.remove(); });
      var n = fila.querySelectorAll('.ucam-chip').length;
      var cont = document.querySelector('[data-filtros-contagem]');
      if (cont) {
        var num = cont.querySelector('.ucam-viewbar__contagem');
        var sr = cont.querySelector('.ucam-sr-only');
        if (num) { num.textContent = String(n); num.hidden = n === 0; }
        if (sr) sr.textContent = n ? ', ' + n + (n === 1 ? ' aplicado' : ' aplicados') : ', nenhum aplicado';
      }
      anuncia(n ? n + (n === 1 ? ' filtro aplicado.' : ' filtros aplicados.') : 'Nenhum filtro aplicado.', botao);
      if (!n) {
        fila.hidden = true;
        if (cont) { cont.setAttribute('aria-expanded', 'false'); cont.focus(); }
      } else {
        var proximo = fila.querySelector('.ucam-chip button');
        if (proximo) proximo.focus();
      }
      return;
    }

    if (qual === 'encaminhar') {
      mudarSelo(seloSituacao(botao), 'Encaminhado', 'info');
      evento('Encaminhou o requerimento ao setor responsável', 'send');
      anuncia('Requerimento encaminhado ao setor responsável.', botao);
      return rotuloTemporario(botao, 'Encaminhado');
    }

    if (qual === 'concluir') {
      mudarSelo(seloSituacao(botao), 'Concluído', 'success');
      evento('Concluiu o requerimento', 'check');
      anuncia('Requerimento concluído.', botao);
      botao.setAttribute('aria-disabled', 'true');
      botao.setAttribute('title', 'O requerimento já está concluído');
      return;
    }

    if (qual === 'responder') {
      var campo = (botao.closest('form') || document).querySelector('textarea');
      if (!campo) return;
      if (!campo.value.trim()) return erroDeCampo(campo, 'Escreva a resposta antes de enviar. Ela vai por e-mail e pelo portal, e não pode ser apagada depois.');
      semErroDeCampo(campo);
      evento('Respondeu ao requerente: ' + campo.value.trim(), 'send');
      campo.value = '';
      anuncia('Resposta enviada ao requerente. Ela entrou na atividade.', botao);
      return rotuloTemporario(botao, 'Resposta enviada');
    }

    // BLOQUEAR E DESBLOQUEAR o acesso de uma pessoa. O botão é o mesmo, e o
    // rótulo é o verbo do PRÓXIMO clique — a regra da estrela, do contrato
    // icon-button. O selo da linha é o eco: sem ele, a única prova de que o
    // bloqueio aconteceu seria o botão ter mudado de nome.
    if (qual === 'bloquear' || qual === 'desbloquear') {
      var linha = botao.closest('tr');
      var bloquear = qual === 'bloquear';
      var quem = (botao.getAttribute('aria-label') || '').replace(/^(Bloquear o acesso de|Desbloquear)\\s*/, '');
      var seloConta = linha && Array.prototype.filter.call(linha.querySelectorAll('.ucam-badge'), function (b) {
        return /Ativo|Bloqueado|Aguardando/.test(b.textContent);
      })[0];
      if (seloConta) {
        mudarSelo(seloConta, bloquear ? 'Bloqueado' : 'Ativo', bloquear ? 'warning' : 'success');
        // O MOTIVO ao lado do selo: "Bloqueado" sozinho manda perguntar por quê.
        var celulaConta = seloConta.parentElement;
        var apoio = celulaConta.querySelector('.ucam-card__apoio');
        if (bloquear) {
          if (!apoio) {
            apoio = document.createElement('span');
            apoio.className = 'ucam-card__apoio';
            celulaConta.appendChild(apoio);
          }
          apoio.textContent = 'bloqueado por você, agora';
        } else if (apoio) {
          apoio.remove();
        }
      }
      botao.setAttribute('data-acao', bloquear ? 'desbloquear' : 'bloquear');
      botao.setAttribute('aria-label', (bloquear ? 'Desbloquear ' : 'Bloquear o acesso de ') + quem);
      var usoConta = botao.querySelector('use');
      if (usoConta) usoConta.setAttribute('href', bloquear ? '#i-refreshCw' : '#i-lock');
      evento((bloquear ? 'Bloqueou ' : 'Desbloqueou ') + quem, bloquear ? 'lock' : 'refreshCw');
      anuncia('Acesso de ' + quem + (bloquear ? ' bloqueado.' : ' desbloqueado.'), botao);
      return eco(linha || botao);
    }

    // SAIR DO GRUPO tira a linha, e com ela o botão que foi clicado. Quem
    // devolve o foco é o confirmaScript, pela regra do contrato dialog: some o
    // gatilho, o foco vai para o cabeçalho da região.
    if (qual === 'sair-grupo') {
      var linhaGrupo = botao.closest('tr');
      if (!linhaGrupo) return;
      var tabelaGrupo = linhaGrupo.closest('table');
      var grupo = (botao.getAttribute('aria-label') || '').replace(/^.*\\bdo grupo\\s*/, '');
      linhaGrupo.remove();
      var resumo = tabelaGrupo && tabelaGrupo.closest('section') && tabelaGrupo.closest('section').querySelector('.ucam-section__hint');
      if (resumo) resumo.textContent = 'Saiu de ' + grupo + ' agora. Os menus que vinham só desse grupo deixam de valer no próximo acesso.';
      evento('Tirou do grupo ' + grupo, 'users');
      anuncia('Saiu do grupo ' + grupo + '. Os menus que vinham só desse grupo deixam de valer no próximo acesso.', tabelaGrupo);
      return eco(tabelaGrupo || document.body);
    }

    // ADICIONAR A GRUPO. O nome do grupo vem do diálogo de escolha, em
    // data-escolha (ver dialogoScript). A linha nasce igual às que já estão
    // lá — inclusive com o botão de sair, que é o desfazer desta ação.
    if (qual === 'adicionar-grupo') {
      var grupoNovo = botao.getAttribute('data-escolha');
      var secaoGrupos = botao.closest('section');
      var tabelaGrupos = secaoGrupos && secaoGrupos.querySelector('table');
      if (!grupoNovo || !tabelaGrupos) return;
      var jaTem = Array.prototype.some.call(tabelaGrupos.tBodies[0].rows, function (tr) {
        return tr.cells[0].textContent.indexOf(grupoNovo) === 0;
      });
      if (jaTem) return rotuloTemporario(botao, 'Já está no grupo');
      var pessoa = (document.querySelector('.ucam-page-header__titulo, .ucam-viewbar__titulo') || {}).textContent || 'a pessoa';
      var tr2 = document.createElement('tr');
      tr2.innerHTML =
        '<td><a class="ucam-card__titulo ucam-link" href="gerencial-grupo-menu.html" data-fluxo="a"></a>' +
        '<span class="ucam-card__apoio">Adicionado agora · os menus valem no próximo acesso</span></td>' +
        '<td class="td--num">—</td><td class="td--num">—</td>' +
        '<td style="white-space:nowrap">hoje</td>' +
        '<td class="td--acoes"><button class="ucam-btn ucam-btn--icon ucam-btn--ghost" type="button" data-fluxo="c" data-acao="sair-grupo" data-confirmar>' +
        '<svg class="ic" aria-hidden="true"><use href="#i-x"/></svg></button></td>';
      tr2.querySelector('a').textContent = grupoNovo;
      tr2.querySelector('button').setAttribute('aria-label', 'Tirar ' + pessoa.trim() + ' do grupo ' + grupoNovo);
      tabelaGrupos.tBodies[0].appendChild(tr2);
      evento('Adicionou ao grupo ' + grupoNovo, 'users');
      return eco(tr2);
    }

    // COPIAR PERMISSÕES de outro grupo. No protótipo, copiar é marcar o que
    // falta: o que interessa provar é que a tela responde, que a contagem
    // anda junto e que o Descartar devolve tudo. Cada caixa emite o seu
    // change, e quem recalcula segue sendo o filtroScript — um dono só.
    if (qual === 'copiar-permissoes') {
      var de = botao.getAttribute('data-escolha');
      if (!de) return;
      var mudou = 0;
      Array.prototype.forEach.call(document.querySelectorAll('tbody .td--selecao input[type="checkbox"]'), function (c) {
        if (c.checked) return;
        c.checked = true;
        c.dispatchEvent(new Event('change', { bubbles: true }));
        mudou++;
      });
      return rotuloTemporario(botao, mudou ? 'Copiado de ' + de : 'Nada a copiar');
    }

    // As duas ações do cartão de segurança. Não há tela para elas neste
    // conjunto, e não é disso que se trata: o que a tela precisa provar é que
    // a ação ACONTECEU e deixou rastro no histórico.
    if (qual === 'redefinir-senha') {
      evento('Enviou o e-mail de redefinição de senha', 'mail');
      anuncia('E-mail de redefinição enviado. O link vale por uma hora.', botao);
      // O prazo do link não está em lugar nenhum da tela: a linha do histórico
      // registra que o e-mail saiu, não que ele expira em uma hora.
      avisa(
        'E-mail de redefinição enviado. O link vale por uma hora; a senha atual continua valendo até ela ser trocada.',
        botao,
        'success',
      );
      return rotuloTemporario(botao, 'E-mail enviado');
    }

    if (qual === 'reemitir-cartao') {
      var serie = document.querySelector('[data-cartao-serie]');
      if (serie) serie.textContent = serie.textContent.replace(/(\\d+)$/, function (n) {
        return String(Number(n) + 1).padStart(n.length, '0');
      });
      evento('Reemitiu o cartão de segurança', 'refreshCw');
      anuncia('Cartão reemitido. O cartão anterior deixou de valer.', botao);
      // A série nova aparece na tela; o que some sem deixar rastro é a notícia
      // de que o cartão na mão de alguém parou de funcionar agora. Tom de
      // atenção, e não de sucesso: o que a frase carrega é uma consequência.
      avisa(
        'Cartão reemitido' +
          (serie ? ' na série ' + serie.textContent.trim() : '') +
          '. O cartão anterior deixou de valer agora — quem estiver com ele na mão não entra.',
        botao,
        'warning',
      );
      return rotuloTemporario(botao, 'Cartão reemitido');
    }

    /* O LOTE age sobre as linhas MARCADAS E VISÍVEIS: com um filtro de pé, o
     * que não está na tela não está no lote — a barra fala do que se vê.
     *
     * Arquivar em lote clica o botão de arquivar de cada linha em vez de
     * repetir o efeito aqui: se a regra de arquivar mudar, muda num lugar só.
     * Linha já arquivada fica de fora, senão o botão dela (que agora diz
     * "Reativar") desfaria o que o lote acabou de fazer. */
    /* Cada ação em lote diz qual BOTÃO DA LINHA ela dispara. Nada de efeito
     * repetido aqui: se a regra de bloquear mudar, muda no lugar em que ela
     * mora, e o lote continua certo. */
    var LOTE = {
      'arquivar-lote': { verbo: 'arquivar', um: 'registro arquivado.', varios: 'registros arquivados.' },
      'bloquear-lote': { verbo: 'bloquear', um: 'conta bloqueada.', varios: 'contas bloqueadas.' },
    };
    if (LOTE[qual] || qual === 'limpar-selecao') {
      var barra = botao.closest('.ucam-lote');
      var tab = barra && (barra.parentElement.querySelector('table') || document.querySelector('table'));
      if (!tab) return;
      var marcadas = Array.prototype.filter.call(
        tab.querySelectorAll('tbody .td--selecao input[type="checkbox"]'),
        function (c) { return c.checked && !c.closest('[hidden]'); },
      );
      var emLote = LOTE[qual];
      if (emLote) {
        var feitas = 0;
        marcadas.forEach(function (c) {
          var linha = c.closest('tr');
          var acao = linha && linha.querySelector('[data-acao="' + emLote.verbo + '"]');
          if (!acao) return;
          // A confirmação foi dada UMA vez, na barra: a linha não pergunta de
          // novo. data-confirmado é a mesma marca que o confirmaScript usa
          // para deixar o segundo clique passar.
          acao.setAttribute('data-confirmado', '');
          acao.click();
          acao.removeAttribute('data-confirmado');
          feitas++;
        });
        anuncia(feitas + ' ' + (feitas === 1 ? emLote.um : emLote.varios), botao);
      }
      marcadas.forEach(function (c) { c.checked = false; });
      if (!emLote && marcadas.length) {
        anuncia('Seleção limpa: ' + marcadas.length + (marcadas.length === 1 ? ' registro desmarcado.' : ' registros desmarcados.'), botao);
      }
      // O mesmo change que a tabela já escuta: a cabeça, a contagem da seção e
      // a própria barra se atualizam por onde sempre se atualizaram.
      if (marcadas.length) marcadas[0].dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    if (qual === 'arquivar' || qual === 'reativar') {
      var tr = botao.closest('tr');
      if (!tr) return;
      var arquivar = qual === 'arquivar';
      var selo = Array.prototype.filter.call(tr.querySelectorAll('.ucam-badge'), function (b) { return b.textContent.trim() === 'Arquivada'; })[0];
      if (arquivar && !selo) {
        var titulo2 = tr.querySelector('.ucam-card__titulo') || tr.cells[1];
        if (titulo2) titulo2.insertAdjacentHTML('beforeend', ' <span class="ucam-badge ucam-badge--neutral">Arquivada</span>');
      }
      if (!arquivar && selo) selo.remove();
      botao.setAttribute('data-acao', arquivar ? 'reativar' : 'arquivar');
      var nome = (botao.getAttribute('aria-label') || '').replace(/^(Arquivar|Reativar) /, '');
      botao.setAttribute('aria-label', (arquivar ? 'Reativar ' : 'Arquivar ') + nome);
      var uso = botao.querySelector('use');
      if (uso) uso.setAttribute('href', arquivar ? '#i-refreshCw' : '#i-archive');
      anuncia((arquivar ? 'Arquivou ' : 'Reativou ') + nome + '.', botao);
      return eco(tr);
    }

    if (qual === 'etapa-inicio') return andarEtapa(botao, 'inicio');
    if (qual === 'etapa-voltar') return andarEtapa(botao, 'voltar');
    if (qual === 'etapa-continuar') return andarEtapa(botao, 'continuar');
    if (qual === 'enviar') {
      var destino = botao.getAttribute('data-destino');
      if (destino) location.href = destino + location.search;
      return;
    }

    /*
     * ENTRAR — e, principalmente, NÃO entrar.
     *
     * Esta é a tela mais acessada da universidade e era a única do conjunto
     * que precisava do caminho do erro: no legado a recusa é texto vermelho
     * solto, sem ícone e sem foco, legível só para quem enxerga a cor — o
     * caso que o contrato do Alert cita ao explicar por que o tom nunca é o
     * único portador do significado.
     *
     * A primeira tentativa FALHA de propósito. Sem isso a tela de exemplo
     * conheceria só o caminho feliz, que é exatamente o buraco encontrado nas
     * 20 telas: nenhum estado de erro em lugar nenhum. A segunda entra.
     *
     * Campo vazio é erro DO CAMPO (a casca sabe qual falta); credencial
     * recusada é erro do SISTEMA, e aí o lugar é o alerta — o servidor não
     * diz qual dos dois está errado, e fingir que diz ensinaria a enumerar
     * CPF.
     */
    if (qual === 'entrar') {
      var formAcesso = botao.closest('form');
      if (!formAcesso) return;
      var cpf = formAcesso.querySelector('input[autocomplete="username"], input[type="text"]');
      var senha = formAcesso.querySelector('input[type="password"]');
      if (!cpf || !senha) return;

      var vazio = !cpf.value.trim() ? cpf : !senha.value.trim() ? senha : null;
      if (vazio) return erroDeCampo(vazio, vazio === cpf ? 'Digite seu CPF para entrar.' : 'Digite sua senha para entrar.');

      if (!botao.hasAttribute('data-tentou')) {
        botao.setAttribute('data-tentou', '');
        return acessoNegado(formAcesso, cpf, senha);
      }
      var destinoAcesso = botao.getAttribute('data-destino') || formAcesso.getAttribute('action');
      // A consulta vai junto, como no 'enviar': entrar no escuro não pode
      // devolver a tela seguinte no claro.
      if (destinoAcesso) location.href = destinoAcesso + location.search;
      return;
    }

    if (qual === 'limpar-busca') {
      // O botão mora DENTRO do estado vazio, e o estado vazio sabe de quem é:
      // é o campo cujo aria-controls aponta para ele. Antes daqui a busca era
      // "a primeira da .ucam-main", o que valia enquanto houvesse uma só por
      // tela — o Grupo × Menu tem duas (filtrar menu, filtrar grupo) e limpar
      // pelo vazio da segunda esvaziava a primeira, que nem estava preenchida.
      var caixa = botao.closest('.ucam-empty');
      var busca = caixa && caixa.id
        ? document.querySelector('[data-filtra][aria-controls="' + caixa.id + '"]')
        : null;
      if (!busca) busca = document.querySelector('.ucam-main input[type=search], .ucam-main .ucam-input-group__controle');
      if (!busca) return;
      busca.value = '';
      busca.dispatchEvent(new Event('input', { bubbles: true }));
      return busca.focus();
    }

    if (qual === 'limpar-campos') return limparCampos(botao);

    if (qual === 'calcular') {
      var secoes = document.querySelectorAll('.ucam-section');
      var resultado = Array.prototype.filter.call(secoes, function (s) {
        var h = s.querySelector('.ucam-section__title');
        return h && h.textContent.trim() === 'Resultado';
      })[0];
      if (!resultado) return;
      resultado.scrollIntoView({ block: 'start', behavior: 'smooth' });
      // A rolagem é o eco de quem vê. Para quem não vê, o resultado só existe
      // se alguém disser que ele chegou — e o foco vai junto, porque foi ele
      // que a pessoa pediu.
      var tituloResultado = resultado.querySelector('.ucam-section__title');
      if (tituloResultado) {
        tituloResultado.setAttribute('tabindex', '-1');
        tituloResultado.focus();
      }
      anuncia('Resultado calculado, logo abaixo do formulário.', botao);
      return eco(resultado);
    }

    if (qual === 'copiar') {
      var codigo = (botao.closest('.ucam-section, .ucam-card') || document).querySelector('.ucam-codigo');
      if (!codigo) return;
      var feito = function () { rotuloTemporario(botao, 'Copiado'); eco(codigo); anuncia('Linha digitável copiada.', botao); };
      if (navigator.clipboard) navigator.clipboard.writeText(codigo.textContent.trim()).then(feito, feito);
      else feito();
      return;
    }

    if (qual === 'email') {
      var linha = (botao.closest('.ucam-section, .ucam-card') || document).querySelector('.ucam-codigo');
      location.href = 'mailto:?subject=' + encodeURIComponent('Boleto da mensalidade') + '&body=' + encodeURIComponent('Linha digitável: ' + (linha ? linha.textContent.trim() : ''));
      return;
    }

    if (qual === 'salvar') {
      eco(document.querySelector('tr[aria-selected="true"]'));
      anuncia('Salvo.', botao);
      return rotuloTemporario(botao, 'Salvo');
    }

    if (qual === 'fechar-caixa') {
      var fechando = !botao.hasAttribute('data-fechado');
      var registrar = document.querySelector('[data-acao="registrar-lancamento"]');
      var aviso = document.querySelector('.ucam-alert__corpo');
      if (fechando) {
        botao.setAttribute('data-fechado', '');
        botao.lastChild.textContent = ' Reabrir caixa';
        if (registrar) { registrar.setAttribute('aria-disabled', 'true'); registrar.setAttribute('title', 'O caixa está fechado'); }
        if (aviso) { aviso.setAttribute('data-texto-original', aviso.textContent); aviso.textContent = 'Caixa fechado às ' + hora() + ' por você. Novos lançamentos ficam para a próxima abertura.'; }
      } else {
        botao.removeAttribute('data-fechado');
        botao.lastChild.textContent = ' Fechar caixa';
        if (registrar) { registrar.removeAttribute('aria-disabled'); registrar.removeAttribute('title'); }
        if (aviso && aviso.hasAttribute('data-texto-original')) aviso.textContent = aviso.getAttribute('data-texto-original');
      }
      if (aviso) eco(aviso.closest('.ucam-alert'));
      anuncia(fechando ? 'Caixa fechado às ' + hora() + '. Novos lançamentos ficam para a próxima abertura.' : 'Caixa reaberto. Lançamentos liberados.', botao);
      return;
    }

    if (qual === 'registrar-lancamento') {
      var corpo = (botao.closest('.ucam-corpo, .ucam-main') || document).querySelector('table.ucam-table tbody');
      if (!corpo) return;
      var modelo = corpo.rows[0];
      var nova = document.createElement('tr');
      var colunas = modelo ? modelo.cells.length : 5;
      var valores = [hora(), 'Novo', 'Lançamento em edição', '—', '—'];
      for (var i = 0; i < colunas; i++) {
        var td = document.createElement('td');
        if (modelo) td.className = modelo.cells[i].className;
        td.textContent = valores[i] || '';
        nova.appendChild(td);
      }
      corpo.insertBefore(nova, corpo.firstElementChild);
      anuncia('Lançamento novo na primeira linha da tabela, em edição.', botao);
      return eco(nova);
    }
  }

  // --- eco na grade do Portal: a seção Favoritos (id grupo-frequentes) --------
  function ecoFrequentes(botao, alvo, fixado) {
    var secao = document.getElementById('grupo-frequentes');
    if (!secao) return;
    var grade = secao.querySelector('.ucam-grid');
    if (!grade) return;
    var dentro = Array.prototype.filter.call(grade.querySelectorAll('.ucam-card'), function (c) {
      var b = c.querySelector('button[aria-pressed]');
      var a = b && alvoDe(b);
      return a && a.alvo === alvo;
    });
    if (fixado && !dentro.length) {
      var card = botao.closest('.ucam-card');
      if (card) {
        var copia = card.cloneNode(true);
        // Em Favoritos o cartão leva a UNIDADE como apoio: o mesmo sistema
        // existe em até quatro delas, e o nome sozinho não diz qual. O rótulo
        // já a traz entre parênteses — "Protocolo (Rio)".
        var unidade = /\\(([^)]+)\\)$/.exec(alvo);
        var texto = copia.querySelector('.ucam-card__cabecalho-texto');
        if (unidade && texto) {
          var apoio = texto.querySelector('.ucam-card__apoio');
          var legado = apoio && /Legado/.test(apoio.textContent);
          if (apoio) apoio.remove();
          apoio = document.createElement('span');
          apoio.className = 'ucam-card__apoio';
          apoio.textContent = unidade[1] + (legado ? ' · legado' : '');
          texto.appendChild(apoio);
        }
        grade.appendChild(copia);
        eco(copia);
      }
    }
    if (!fixado) dentro.forEach(function (c) { c.remove(); });
    var n = grade.querySelectorAll('.ucam-card').length;
    var contagem = secao.querySelector('.ucam-section__contagem');
    if (contagem) contagem.textContent = plural(n, 'fixado', 'fixados');
    // Grupo vazio não fica: um título "Favoritos" sobre nada é a
    // mesma coisa que o grupo Favoritos da navegação não emite.
    secao.hidden = n === 0;
  }

  // --- eco na navegação: o grupo Favoritos -----------------------------------
  function grupoFavoritos(criar) {
    var lista = document.querySelector('.ucam-nav__fixados');
    if (lista || !criar) return lista;
    var nav = document.querySelector('.ucam-nav__scroll') || document.querySelector('.ucam-nav');
    if (!nav) return null;
    var id = 'nav-favoritos-' + Date.now();
    var grupo = document.createElement('div');
    grupo.className = 'ucam-nav__group';
    grupo.innerHTML =
      '<button class="ucam-nav__group-title ucam-nav__group-title--recolhivel" type="button" aria-expanded="true" aria-controls="' + id + '" data-ramo>' +
      '<span>Favoritos</span><svg class="ic ucam-nav__chevron" aria-hidden="true"><use href="#i-chevronDown"/></svg></button>' +
      '<div class="ucam-nav__fixados" id="' + id + '"></div>';
    var primeiro = nav.querySelector('.ucam-nav__group');
    nav.insertBefore(grupo, primeiro || null);
    return grupo.querySelector('.ucam-nav__fixados');
  }

  function itemFavorito(alvo) {
    return Array.prototype.filter.call(document.querySelectorAll('.ucam-nav__fixado'), function (f) {
      var b = f.querySelector('.ucam-nav__desfixar');
      var a = b && alvoDe(b);
      return a && a.alvo === alvo;
    })[0] || null;
  }

  function ecoNavegacao(alvo, fixado) {
    var atual = itemFavorito(alvo);
    if (!fixado) {
      if (!atual) return;
      var lista = atual.parentElement;
      atual.remove();
      if (lista && !lista.children.length) {
        var grupo = lista.closest('.ucam-nav__group');
        if (grupo) grupo.remove();
      }
      return;
    }
    if (atual) return;
    var fixados = grupoFavoritos(true);
    if (!fixados) return;
    var el = document.createElement('div');
    el.className = 'ucam-nav__fixado';
    el.innerHTML =
      '<a class="ucam-nav__item" href="' + (location.hash || '#') + '" aria-current="page"><span></span></a>' +
      '<button class="ucam-btn ucam-btn--ghost ucam-btn--icon ucam-btn--sm ucam-nav__desfixar" type="button" aria-pressed="true"><svg class="ic" aria-hidden="true"><use href="#i-star"/></svg></button>';
    el.querySelector('span').textContent = alvo;
    el.querySelector('button').setAttribute('aria-label', 'Remover ' + alvo + ' dos favoritos');
    fixados.appendChild(el);
  }

  // CTRL + ENTER ENVIA — o atalho que a dica do compositor promete. Estava
  // escrito na tela desde o primeiro desenho e não existia em lugar nenhum:
  // promessa em texto é promessa igual, e um atalho anunciado que não responde
  // ensina a não ler a dica. Dispara o mesmo botão do clique, para não haver
  // dois caminhos de envio que possam divergir.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return;
    var campo = e.target;
    if (!campo.closest || !campo.closest('.ucam-compositor__campo')) return;
    var enviar = (campo.closest('form') || document).querySelector('[data-acao="responder"]');
    if (!enviar) return;
    e.preventDefault();
    enviar.click();
  });

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;

    // AÇÕES DA TELA (ADR-033). Todo botão de tela de referência declara em
    // data-fluxo o que faz: (a) é link, (b) não tem tela neste conjunto e fica
    // aria-disabled, (c) age aqui — e o eco é o próprio controle ou o registro,
    // porque toast está fora do catálogo. Os tratadores são a versão mínima que
    // faz a tela se comportar como o sistema; a aplicação troca cada um pela
    // chamada ao serviço.
    var acao = t.closest('[data-acao]');
    if (acao) {
      e.preventDefault();
      if (acao.getAttribute('aria-disabled') === 'true') return;
      agir(acao, acao.getAttribute('data-acao'));
      return;
    }

    // ESTRELA: qualquer interruptor cujo ícone é a estrela do sprite.
    var estrela = t.closest('button[aria-pressed]');
    if (estrela && estrela.querySelector('use[href="#i-star"]')) {
      var a = alvoDe(estrela);
      if (!a) return;
      var fixado = estrela.getAttribute('aria-pressed') !== 'true';
      estrelas(a.alvo).forEach(function (b) { marcar(b, fixado); });
      // data-fixou dispara o retorno de movimento só no controle clicado.
      if (fixado) estrela.setAttribute('data-fixou', '');
      else estrela.removeAttribute('data-fixou');
      if (estrela.closest('.ucam-card')) ecoFrequentes(estrela, a.alvo, fixado);
      else ecoNavegacao(a.alvo, fixado);
      // Desfixar pela navegação também solta a estrela do registro aberto,
      // se for o mesmo: estrelas(alvo) já cobriu, porque o rótulo é o mesmo.
      return;
    }

    // MOSTRAR SENHA: a ação do grupo de campo (input-group). O eco do estado
    // é o próprio campo — o tipo troca entre password e text —, o rótulo diz
    // o próximo verbo e o ícone acompanha (eye / eyeOff).
    var olho = t.closest('button[data-mostrar-senha][aria-pressed]');
    if (olho) {
      var campoSenha = document.getElementById(olho.getAttribute('aria-controls') || '');
      var mostrar = olho.getAttribute('aria-pressed') !== 'true';
      olho.setAttribute('aria-pressed', String(mostrar));
      olho.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
      var usoOlho = olho.querySelector('use');
      if (usoOlho) usoOlho.setAttribute('href', mostrar ? '#i-eyeOff' : '#i-eye');
      if (campoSenha) campoSenha.type = mostrar ? 'text' : 'password';
      return;
    }

    // MENU DA COLUNA: as opções do menu que o cabeçalho abre. Depois da
    // ação o menu fecha e o foco volta ao gatilho — menos ao ocultar, em que
    // o gatilho some junto com a coluna e o foco vai para o "Mostrar".
    var acaoCol = t.closest('.ucam-menu--coluna [data-coluna]');
    if (acaoCol) {
      if (acaoCol.getAttribute('aria-disabled') === 'true') return;
      var menuCol = acaoCol.closest('.ucam-menu--coluna');
      var thCol = menuCol.closest('th');
      var tabCol = thCol && thCol.closest('table');
      var gatCol = document.getElementById(menuCol.getAttribute('aria-labelledby') || '');
      menuCol.hidden = true;
      if (gatCol) gatCol.setAttribute('aria-expanded', 'false');
      if (!tabCol) return;
      var foco = colunaAgir(tabCol, thCol, acaoCol.getAttribute('data-coluna'), acaoCol.getAttribute('aria-checked') === 'true');
      (foco || gatCol || thCol).focus();
      return;
    }

    var reexibir = t.closest('[data-coluna-reexibir]');
    if (reexibir) {
      var barraOc = reexibir.closest('.ucam-table__ocultas');
      var alvoOc = barraOc && barraOc.nextElementSibling;
      var tabOc = alvoOc && (alvoOc.tagName === 'TABLE' ? alvoOc : alvoOc.querySelector('table'));
      if (!tabOc) return;
      var primeiro = null;
      Array.prototype.forEach.call(tabOc.querySelectorAll('[data-col][hidden]'), function (c) {
        c.hidden = false;
        if (!primeiro && c.tagName === 'TH') primeiro = c;
      });
      barraOc.remove();
      colunasArranjar(tabOc);
      var gatPrim = primeiro && primeiro.querySelector('.ucam-table__coluna');
      if (gatPrim) gatPrim.focus();
      return;
    }

    // PASSO NUMÉRICO: os botões − e + do campo de número (input-group
    // --numero). Quem soma é o próprio campo, por stepUp/stepDown: min, max e
    // step declarados no <input> valem igual para o botão e para a seta do
    // teclado, e não há segunda regra de limite para divergir. Os dois
    // eventos saem porque é o que a digitação dispararia — quem escuta o campo
    // não precisa saber que o valor veio de um botão.
    var passo = t.closest('button[data-passo]');
    if (passo) {
      var campoNum = document.getElementById(passo.getAttribute('aria-controls') || '');
      if (!campoNum || campoNum.disabled || campoNum.readOnly) return;
      if (Number(passo.getAttribute('data-passo')) > 0) campoNum.stepUp(); else campoNum.stepDown();
      campoNum.dispatchEvent(new Event('input', { bubbles: true }));
      campoNum.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    // SEGMENTED: um escolhido por grupo, e o seletor é o aria-pressed.
    var segmento = t.closest('.ucam-segmented > button[aria-pressed]');
    if (segmento) {
      Array.prototype.forEach.call(segmento.parentElement.children, function (b) {
        if (b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', String(b === segmento));
      });
      // VISTA: o segmento que carrega data-vista troca o arranjo das grades
      // da tela — "lista" põe .ucam-grid--lista em toda .ucam-grid do main,
      // "grade" tira. O cartão não muda; só o lugar das coisas dentro dele.
      var vista = segmento.getAttribute('data-vista');
      if (vista) {
        var raiz = segmento.closest('.ucam-main') || segmento.closest('.ucam-shell') || document;
        Array.prototype.forEach.call(raiz.querySelectorAll('.ucam-grid'), function (g) {
          g.classList.toggle('ucam-grid--lista', vista === 'lista');
        });
      }
      return;
    }

    // SEÇÃO RECOLHÍVEL: o estado mora no aria-expanded do gatilho e no hidden
    // da região, e a contagem fica visível com a seção fechada (section-bar).
    var gatilho = t.closest('.ucam-section__gatilho[aria-controls]');
    if (gatilho) {
      var regiao = document.getElementById(gatilho.getAttribute('aria-controls'));
      var aberto = gatilho.getAttribute('aria-expanded') === 'true';
      gatilho.setAttribute('aria-expanded', String(!aberto));
      if (regiao) regiao.hidden = aberto;
      atualizaRecolherTodas();
      return;
    }

    // RECOLHER TODAS: interruptor sem aria-expanded, porque atua sobre várias
    // regiões; o que ele anuncia é o próximo verbo.
    var todas = t.closest('[data-recolher-todas]');
    if (todas) {
      var gatilhos = document.querySelectorAll('.ucam-section__gatilho[aria-controls]');
      var algumAberto = Array.prototype.some.call(gatilhos, function (g) { return g.getAttribute('aria-expanded') === 'true'; });
      Array.prototype.forEach.call(gatilhos, function (g) {
        g.setAttribute('aria-expanded', String(!algumAberto));
        var r = document.getElementById(g.getAttribute('aria-controls'));
        if (r) r.hidden = algumAberto;
      });
      atualizaRecolherTodas();
    }
  });

  function atualizaRecolherTodas() {
    var todas = document.querySelector('[data-recolher-todas]');
    if (!todas) return;
    var gatilhos = document.querySelectorAll('.ucam-section__gatilho[aria-controls]');
    var algumAberto = Array.prototype.some.call(gatilhos, function (g) { return g.getAttribute('aria-expanded') === 'true'; });
    todas.textContent = algumAberto ? 'Recolher todas' : 'Expandir todas';
  }
})();
`.trim();

/**
 * "Mostrar todos os N valores" da lista de descrição em layout painel
 * (description-list.json, prop visibleCount).
 *
 * O estado mora em dois lugares que precisam concordar: o aria-expanded do
 * botão e o hidden de cada par além do corte (data-alem). O rótulo troca
 * entre os dois spans do botão — data-fechado e data-aberto — em vez de ser
 * reescrito, para o número continuar no HTML e não numa string do script.
 */
export const descricaoScript = `
(function () {
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-mostrar-todos]');
    if (!b) return;
    var lista = document.getElementById(b.getAttribute('aria-controls'));
    if (!lista) return;
    var aberto = b.getAttribute('aria-expanded') === 'true';
    Array.prototype.forEach.call(lista.querySelectorAll('[data-alem]'), function (par) {
      par.hidden = aberto;
    });
    b.setAttribute('aria-expanded', String(!aberto));
    var fechado = b.querySelector('[data-fechado]');
    var abertoEl = b.querySelector('[data-aberto]');
    if (fechado) fechado.hidden = !aberto;
    if (abertoEl) abertoEl.hidden = aberto;
  });
})();
`;

/**
 * O filtro da linha do tempo por natureza (ADR-036). O controle é um
 * .ucam-segmented com data-timeline-filtro e aria-controls apontando o <ol>;
 * cada botão traz data-valor (todos, mensagem, evento) e cada item, data-tipo.
 *
 * Depois de filtrar, dois acertos que o CSS sozinho não faz: a fase que ficou
 * sem nenhum item visível some junto (um rótulo sem nada embaixo diz que a
 * fase está vazia, e não está), e data-fim vai para o último item visível,
 * para o fio não descer até o nada.
 */
export const linhaDoTempoScript = `
(function () {
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-timeline-filtro] button[data-valor]');
    if (!b) return;
    var grupo = b.closest('[data-timeline-filtro]');
    var tl = document.getElementById(grupo.getAttribute('aria-controls'));
    if (!tl) return;
    var valor = b.getAttribute('data-valor');
    Array.prototype.forEach.call(grupo.querySelectorAll('button[data-valor]'), function (x) {
      x.setAttribute('aria-pressed', String(x === b));
    });
    var fase = null, faseTemItem = false, ultimo = null;
    function fecharFase() { if (fase) fase.hidden = !faseTemItem; }
    Array.prototype.forEach.call(tl.children, function (li) {
      if (li.classList.contains('ucam-timeline__grupo')) {
        fecharFase();
        fase = li;
        faseTemItem = false;
        return;
      }
      li.removeAttribute('data-fim');
      var ve = valor === 'todos' || li.getAttribute('data-tipo') === valor;
      li.hidden = !ve;
      if (ve) { faseTemItem = true; ultimo = li; }
    });
    fecharFase();
    if (ultimo && ultimo !== tl.lastElementChild) ultimo.setAttribute('data-fim', '');
  });
})();
`;

/**
 * AS ABAS — a tira de recortes que existia na marcação e em lugar nenhum.
 *
 * A caixa de entrada nasceu com role=tablist, quatro role=tab, aria-selected e
 * o roving tabindex escrito à mão. Clicar não trocava recorte nenhum: a tira
 * prometia quatro filas e entregava sempre a mesma, e a seta do teclado — que
 * é quem anda entre abas — não andava. O Trilho B (UcamTabs) faz isto desde o
 * primeiro dia; aqui é a mesma máquina, delegada no documento.
 *
 * DOIS ARRANJOS, um script:
 *   - uma aba por painel: cada aria-controls aponta um id diferente, e só o
 *     painel da aba escolhida fica visível;
 *   - um painel para todas as abas (o caso da caixa de entrada): dentro dele,
 *     o que traz data-aba pertence ao recorte que o token nomeia, e o resto é
 *     moldura — o rodapé de atalhos, o painel de leitura — que fica de pé em
 *     qualquer recorte. Lista que perde todos os itens some junto: um <ul>
 *     vazio com a moldura em volta parece defeito, não recorte vazio.
 *
 * O contrato (tabs.json) pede ativação AUTOMÁTICA por padrão, que é a seta já
 * selecionando, e manual quando a troca dispara consulta — `data-ativacao="manual"`
 * na tira. E pede uma parada de tabulação só: Tab entra e sai da tira, a seta
 * anda dentro.
 */
export const abasScript = `
(function () {
  function abas(tira) {
    return Array.prototype.filter.call(tira.querySelectorAll('[role="tab"]'), function (a) {
      return a.closest('[role="tablist"]') === tira;
    });
  }

  function painelDe(aba) {
    return document.getElementById(aba.getAttribute('aria-controls') || '');
  }

  function paineisDe(tira) {
    var vistos = [];
    abas(tira).forEach(function (a) {
      var p = painelDe(a);
      if (p && vistos.indexOf(p) < 0) vistos.push(p);
    });
    return vistos;
  }

  function tokens(el) {
    return (el.getAttribute('data-aba') || '').split(' ').filter(Boolean);
  }

  /* O recorte DENTRO de um painel só. Quem não traz data-aba é moldura e não
   * se mexe; quem traz aparece no recorte que o token nomeia. */
  function recortar(painel, valor) {
    Array.prototype.forEach.call(painel.querySelectorAll('[data-aba]'), function (el) {
      var dentro = !valor || tokens(el).indexOf(valor) >= 0;
      el.hidden = !dentro;
      // O filtro da tela (filtroScript) não pode devolver à vista o que o
      // recorte tirou: a marca diz de quem é o hidden.
      if (dentro) el.removeAttribute('data-fora-do-recorte');
      else el.setAttribute('data-fora-do-recorte', '');
    });
    Array.prototype.forEach.call(painel.querySelectorAll('.ucam-list, .ucam-grid, table'), function (lista) {
      var itens = lista.tagName === 'TABLE'
        ? (lista.tBodies[0] ? Array.prototype.slice.call(lista.tBodies[0].rows) : [])
        : Array.prototype.filter.call(lista.children, function (n) { return n.nodeType === 1; });
      if (!itens.length || !itens.some(function (i) { return i.hasAttribute('data-aba'); })) return;
      lista.hidden = !itens.some(function (i) { return !i.hidden; });
    });
  }

  function selecionar(tira, aba) {
    var lista = abas(tira);
    lista.forEach(function (x) {
      var sim = x === aba;
      x.setAttribute('aria-selected', String(sim));
      x.tabIndex = sim ? 0 : -1;
    });
    var paineis = paineisDe(tira);
    if (paineis.length > 1) {
      var meu = painelDe(aba);
      paineis.forEach(function (p) { p.hidden = p !== meu; });
      if (meu) meu.setAttribute('aria-labelledby', aba.id);
    } else if (paineis.length === 1) {
      recortar(paineis[0], aba.getAttribute('data-valor'));
      // O painel é um só e passa a ser rotulado pela aba da vez: aria-labelledby
      // preso na primeira aba faz o leitor anunciar a fila errada.
      paineis[0].setAttribute('aria-labelledby', aba.id);
    }
  }

  function manual(tira) {
    return tira.getAttribute('data-ativacao') === 'manual';
  }

  // Só a tira do componente: ver o cabeçalho deste bloco.
  function tiraDe(aba) {
    var tira = aba.closest('[role="tablist"]');
    return tira && tira.classList.contains('ucam-tabs') ? tira : null;
  }

  document.addEventListener('click', function (e) {
    var aba = e.target.closest && e.target.closest('[role="tab"]');
    if (!aba || aba.getAttribute('aria-disabled') === 'true') return;
    var tira = tiraDe(aba);
    if (!tira) return;
    selecionar(tira, aba);
  });

  document.addEventListener('keydown', function (e) {
    var aba = e.target.closest && e.target.closest('[role="tab"]');
    if (!aba) return;
    var tira = tiraDe(aba);
    if (!tira) return;
    var lista = abas(tira);
    var i = lista.indexOf(aba);
    var destino = i;
    if (e.key === 'ArrowRight') destino = (i + 1) % lista.length;
    else if (e.key === 'ArrowLeft') destino = (i - 1 + lista.length) % lista.length;
    else if (e.key === 'Home') destino = 0;
    else if (e.key === 'End') destino = lista.length - 1;
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selecionar(tira, aba);
      return;
    } else return;
    e.preventDefault();
    // O foco vai ANTES da seleção: no modo manual a seleção não acontece, e o
    // foco tem de ir de qualquer forma.
    lista[destino].tabIndex = 0;
    lista[destino].focus();
    if (!manual(tira)) selecionar(tira, lista[destino]);
  });

  // Na carga, o recorte escrito na marcação passa a valer de verdade: sem isto
  // a tela nasce com a aba certa acesa e os itens de todas as filas à vista.
  Array.prototype.forEach.call(document.querySelectorAll('.ucam-tabs[role="tablist"]'), function (tira) {
    var atual = abas(tira).filter(function (a) { return a.getAttribute('aria-selected') === 'true'; })[0];
    if (atual) selecionar(tira, atual);
  });
})();
`;

/**
 * A LISTA QUE ESCOLHE — Grupo × Menu do Gerencial.
 *
 * A coluna dos oito grupos era decoração: a seleção estava cravada em
 * "Secretaria Acadêmica", os itens não tinham controle nenhum e clicar em
 * outro grupo não fazia nada. A barra de 4px do item escolhido, de 19/09,
 * piorou o silêncio: ela PROMETE que a lista escolhe.
 *
 * Cada item carrega os dados do grupo em data-dados — quantos menus por
 * aplicação e, linha a linha das duas tabelas abertas, se é concedido e
 * desde quando. Trocar de grupo reescreve: a meta do cabeçalho, a contagem
 * das seis seções, as caixas e as datas das duas tabelas, os rótulos que
 * nomeiam o grupo, o selo de não salvo e o rodapé de alterações.
 *
 * O que NÃO faz: salvar. É tela de referência; o que ela precisa provar é
 * que a escolha governa o painel.
 */
export const grupoMenuScript = `
(function () {
  var TOTAL_MENUS = 142;

  function conta(c, t) { return c === 0 ? 'nenhum de ' + t : c + ' de ' + t + ' concedidos'; }
  function plural(n, um, varios) { return n + ' ' + (n === 1 ? um : varios); }

  /** As caixas do cabeçalho em três estados, como no marcar todos. */
  function sincronizaCabeca(tabela) {
    var topo = tabela.querySelector('thead .th--selecao input[type="checkbox"]');
    if (!topo) return;
    var cx = Array.prototype.filter.call(tabela.querySelectorAll('tbody .td--selecao input[type="checkbox"]'), function (c) {
      return !c.closest('[hidden]') && !c.disabled;
    });
    var m = cx.filter(function (c) { return c.checked; }).length;
    topo.checked = m > 0 && m === cx.length;
    topo.indeterminate = m > 0 && m < cx.length;
    if (topo.indeterminate) topo.setAttribute('data-indeterminate', 'true');
    else topo.removeAttribute('data-indeterminate');
  }

  function aplica(dados) {
    var meta = document.querySelector('[data-campo="meta"]');
    if (meta) meta.textContent = dados.nome + ' · ' + dados.menus + ' de ' + TOTAL_MENUS + ' menus';

    var naoSalvos = 0;

    Array.prototype.forEach.call(document.querySelectorAll('.ucam-section[data-app]'), function (secao) {
      var app = secao.getAttribute('data-app');
      var alvo = secao.querySelector('.ucam-section__contagem');
      if (alvo) {
        // O total da aplicação está escrito na própria contagem — "22 de 44
        // concedidos" ou "nenhum de 30" —, então ele não precisa ser repetido
        // nos dados de cada grupo, onde sairia oito vezes igual.
        // \\d, e não \d: dentro do template literal deste módulo o \d cru sai
        // como d, e o regex emitido vira /de (d+)/ — casa com nada, e a
        // contagem da seção fica parada enquanto o resto da tela troca.
        var m = alvo.textContent.match(/de (\\d+)/);
        if (m) alvo.textContent = conta(dados.apps[app] || 0, Number(m[1]));
      }

      var tabela = secao.querySelector('table');
      if (!tabela || !dados.linhas[app]) return;
      var linhas = dados.linhas[app];
      Array.prototype.forEach.call(tabela.querySelectorAll('tbody tr'), function (tr, i) {
        var d = linhas[i];
        var novo = d === 'agora';
        if (novo) naoSalvos++;
        var cx = tr.querySelector('.td--selecao input[type="checkbox"]');
        if (cx) {
          cx.checked = !!d;
          cx.setAttribute('aria-label', (cx.getAttribute('aria-label') || '').replace(/ ao grupo .*$/, ' ao grupo ' + dados.nome));
        }
        var titulo = tr.querySelector('.ucam-card__titulo');
        var selo = titulo && titulo.querySelector('.ucam-badge');
        if (titulo && novo && !selo) {
          titulo.insertAdjacentHTML('beforeend', ' <span class="ucam-badge ucam-badge--info"><span class="ucam-badge__ponto" aria-hidden="true"></span>Não salvo</span>');
        } else if (selo && !novo) selo.remove();
        var data = tr.querySelector('td:last-child');
        if (data) data.textContent = d ? d : '—';
      });
      sincronizaCabeca(tabela);

      var hint = secao.querySelector('[data-campo="nao-salvos"]');
      if (hint) {
        var n = linhas.filter(function (d) { return d === 'agora'; }).length;
        hint.hidden = n === 0;
        hint.textContent = n === 0 ? '' : plural(n, 'alteração entrou', 'alterações entraram') + ' agora e ainda ' + (n === 1 ? 'não foi salva' : 'não foram salvas') + '.';
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll('caption [data-campo="grupo"]'), function (el) {
      el.textContent = dados.nome;
    });

    var rodape = document.querySelector('[data-campo="alteracoes"]');
    if (rodape) rodape.textContent = naoSalvos === 0 ? 'Nenhuma alteração para salvar' : plural(naoSalvos, 'alteração não salva', 'alterações não salvas');
  }

  document.addEventListener('click', function (e) {
    var alvo = e.target.closest && e.target.closest('[data-grupo][data-dados]');
    if (!alvo) return;
    var lista = alvo.closest('.ucam-list');
    Array.prototype.forEach.call(lista.querySelectorAll('[data-grupo]'), function (b) {
      var escolhido = b === alvo;
      b.setAttribute('aria-pressed', String(escolhido));
      var item = b.closest('.ucam-list-item');
      if (escolhido) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
    var dados;
    try { dados = JSON.parse(alvo.getAttribute('data-dados')); } catch (err) { return; }
    aplica(dados);
  });
})();
`.trim();

/**
 * FILTRAR E MARCAR TUDO — a camada que faltava nas tabelas das telas.
 *
 * Dois defeitos relatados em 19/09/2026, e a mesma causa nos dois: a marcação
 * carregava a promessa e não havia comportamento nenhum atrás dela.
 *
 * 1. "MARCAR TODOS" não marcava nada, e piscava. O estado misto do cabeçalho
 *    é `data-indeterminate` no Trilho A porque `indeterminate` só existe como
 *    PROPRIEDADE, e tela autônoma é HTML e mais nada. Só que o atributo ficava
 *    lá para sempre: ao clicar, a caixa ficava marcada COM o atributo do misto
 *    ainda posto, e a folha desenhava o traço por baixo do tique — o pisca que
 *    o usuário viu. Aqui o atributo passa a ser escrito pelo script, junto com
 *    a propriedade, que é o que leitor de tela anuncia como "misto".
 *
 * 2. OS FILTROS não filtravam. Campo de busca, segmented e select existiam em
 *    oito telas e nenhum mexia uma linha.
 *
 * A convenção é uma só, e cabe em três atributos:
 *   data-filtra="texto"            no campo de busca;
 *   data-filtra="coluna:Situação"  no grupo de botões ou no select;
 *   data-filtra="marcados"         para "concedidos / não concedidos";
 *   data-filtra-alvo="<id>"        quando o alvo não é o vizinho óbvio.
 * Os controles que apontam para o MESMO alvo se somam: quem digita "matrícula"
 * e escolhe "não concedidos" vê a interseção, não o último clique.
 */
export const filtroScript = `
(function () {
${FN_ANUNCIA}
  function crua(t) {
    return (t || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/\\s+/g, ' ').trim();
  }

  // Um controle pode reger VÁRIOS alvos: a barra de visão fica acima de todas
  // as seções, e "não concedidos" tem de valer para as duas tabelas da tela,
  // não só para a primeira. Dentro de uma seção, o alvo é o vizinho.
  function alvosDe(ctl) {
    var id = ctl.getAttribute('data-filtra-alvo');
    if (id) {
      var um = document.getElementById(id);
      return um ? [um] : [];
    }
    var daBarra = !!ctl.closest('.ucam-viewbar');
    var raiz = daBarra ? (document.querySelector('.ucam-corpo, main') || document) : (ctl.closest('section') || document);
    var achados = Array.prototype.slice.call(raiz.querySelectorAll('table, .ucam-list, .ucam-grid'));
    if (!daBarra) return achados;
    // ALVO COM DONO não entra na varredura implícita. Em Grupo e menu, o
    // campo "Filtrar menu" mora na barra de visão e varre o corpo inteiro —
    // e o corpo inclui a lista de GRUPOS, que tem o seu próprio campo ao
    // lado. Digitar um menu esvaziava a lista de grupos.
    var donos = Array.prototype.map.call(document.querySelectorAll('[data-filtra-alvo]'), function (o) {
      return o.getAttribute('data-filtra-alvo');
    });
    return achados.filter(function (a) { return !a.id || donos.indexOf(a.id) < 0; });
  }

  function itens(alvo) {
    if (!alvo) return [];
    if (alvo.tagName === 'TABLE') return alvo.tBodies[0] ? Array.prototype.slice.call(alvo.tBodies[0].rows) : [];
    return Array.prototype.filter.call(alvo.children, function (n) { return n.nodeType === 1; });
  }

  // A coluna é achada pelo TEXTO do cabeçalho, não pelo índice: mexer na ordem
  // das colunas não pode quebrar o filtro em silêncio.
  function indiceDaColuna(alvo, nome) {
    if (!alvo || alvo.tagName !== 'TABLE') return -1;
    var ths = alvo.querySelectorAll('thead th');
    for (var i = 0; i < ths.length; i++) {
      if (crua(ths[i].textContent).indexOf(crua(nome)) === 0) return i;
    }
    return -1;
  }

  function passa(ctl, item, alvo) {
    var regra = ctl.getAttribute('data-filtra') || '';
    if (regra === 'texto') {
      var termo = crua(ctl.value);
      return !termo || crua(item.textContent).indexOf(termo) >= 0;
    }
    var escolhido = ctl.tagName === 'SELECT' || ctl.hasAttribute('data-valor')
      ? (ctl.hasAttribute('data-valor') ? ctl.getAttribute('data-valor') : ctl.value)
      : (function () {
          var b = ctl.querySelector('[aria-pressed="true"]');
          return b ? b.getAttribute('data-valor') : null;
        })();
    if (!escolhido) return true;
    if (regra === 'marcados') {
      var cx = item.querySelector('input[type="checkbox"]');
      if (!cx) return true;
      return escolhido === 'sim' ? cx.checked : !cx.checked;
    }
    // DADO, não texto: a modalidade de um setor não está escrita em coluna
    // nenhuma — "Todas as unidades" atende EAD e presencial, e "Campos, Rio"
    // só presencial. Procurar a palavra no texto da linha acerta por acaso e
    // erra em silêncio; o token no data-<chave> diz o fato.
    if (regra.indexOf('dado:') === 0) {
      var chave = regra.slice(5);
      var dono = item.hasAttribute('data-' + chave) ? item : item.querySelector('[data-' + chave + ']');
      if (!dono) return true;
      return (dono.getAttribute('data-' + chave) || '').split(' ').indexOf(escolhido) >= 0;
    }
    if (regra.indexOf('coluna:') === 0) {
      var i = indiceDaColuna(alvo, regra.slice(7));
      var celula = i >= 0 && item.cells ? item.cells[i] : item;
      return crua(celula.textContent).indexOf(crua(escolhido)) >= 0;
    }
    return true;
  }

  function aplicar(alvo) {
    if (!alvo) return { vistos: 0, total: 0 };
    var ctls = Array.prototype.filter.call(document.querySelectorAll('[data-filtra]'), function (c) {
      return alvosDe(c).indexOf(alvo) >= 0;
    });
    // Item que a ABA tirou do recorte não é item desta fila: não volta à
    // vista por filtro nenhum, e não entra na conta de "x de y".
    var lista = itens(alvo).filter(function (i) { return !i.hasAttribute('data-fora-do-recorte'); });
    var vistos = 0;
    lista.forEach(function (item) {
      var ok = ctls.every(function (c) { return passa(c, item, alvo); });
      item.hidden = !ok;
      // A marca diz QUEM o filtro recusou. A paginação precisa da distinção:
      // hidden sozinho não separa "o filtro tirou" de "está na página 2", e as
      // duas coisas escrevem no mesmo atributo.
      if (ok) item.removeAttribute('data-filtrado-fora');
      else item.setAttribute('data-filtrado-fora', '');
      if (ok) vistos++;
    });
    // Seção que ficou sem nenhum item sai junto: um título de grupo sozinho
    // diz que o grupo está vazio, e ele não está — está filtrado.
    // Uma seção que HOSPEDA o próprio filtro não pode se esconder: sumiria
    // levando junto o campo em que a pessoa está digitando, e o foco cairia no
    // body no meio da digitação. O painel gerencial era o caso — "Filtrar
    // setor" mora dentro de "Carga por setor", e um termo sem resultado
    // apagava a seção inteira, campo inclusive. Quando a seção fica, quem diz
    // que não há resultado é o .ucam-empty apontado por aria-controls.
    var secao = alvo.closest('section');
    var donaDoFiltro = secao && secao.querySelector('[data-filtra]');
    if (secao && !donaDoFiltro && secao.querySelectorAll('table, .ucam-list, .ucam-grid').length === 1) secao.hidden = vistos === 0;
    var contagem = (secao || document).querySelector('[data-filtra-contagem]');
    if (contagem) contagem.textContent = vistos + ' de ' + lista.length;
    // Conjunto novo, página 1: a página 3 do conjunto velho não quer dizer
    // nada depois que o filtro mudou quantas linhas existem.
    paginarAlvo(alvo, 1);
    return { vistos: vistos, total: lista.length };
  }

  /**
   * O ECO do filtro, e ele não é enfeite: filtro que esconde sem dizer quanto
   * escondeu deixa quem procura achando que o registro não existe.
   *
   * Sai da marcação que a tela já tinha: aria-controls aponta o .ucam-empty a
   * mostrar quando nada sobra, e aria-describedby aponta a região de status
   * que anuncia a contagem para quem ouve. As duas estavam escritas na grade
   * do Portal desde o primeiro desenho, sem nada atrás.
   */
  function aplicarTudo(ctl) {
    var vistos = 0, total = 0;
    alvosDe(ctl).forEach(function (a) {
      var r = aplicar(a);
      vistos += r.vistos;
      total += r.total;
    });
    var vazio = document.getElementById(ctl.getAttribute('aria-controls') || '')
      || (ctl.closest('section, .ucam-corpo, main') || document).querySelector('[data-filtra-vazio]');
    if (vazio && (vazio.classList.contains('ucam-empty') || vazio.hasAttribute('data-filtra-vazio'))) {
      vazio.hidden = vistos > 0;
    }
    var status = document.getElementById(ctl.getAttribute('aria-describedby') || '');
    if (status && status.getAttribute('role') === 'status') {
      // "na tela" é verdade sem paginação; com ela a tela mostra uma página,
      // e quem diz o que está visível é o intervalo do componente.
      var paginada = alvosDe(ctl).some(function (a) { return !!navDaTabela(a); });
      status.textContent = vistos === total ? ''
        : vistos + ' de ' + total + (paginada ? ' no resultado' : ' na tela');
    }
  }

  document.addEventListener('input', function (e) {
    var c = e.target.closest && e.target.closest('[data-filtra="texto"]');
    if (c) aplicarTudo(c);
  });

  /* Nas telas o <select> nativo não existe (ADR-011): o que sobra é o gatilho
   * do listbox, que escreve a escolha em data-valor e dispara o mesmo change.
   * Por isso a escuta é pelo ATRIBUTO e não pela tag — escrita só para
   * <select>, ela nunca pegava o filtro de nenhuma tela autônoma. */
  document.addEventListener('change', function (e) {
    var s = e.target.closest && e.target.closest('[data-filtra]:not([data-filtra="texto"])');
    if (s && s.tagName !== 'DIV') aplicarTudo(s);
  });

  // O segmented já alterna o aria-pressed no estadoScript; aqui só reagimos ao
  // resultado, depois dele — daí o clique em vez do change.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-filtra] button[data-valor]');
    if (!b) return;
    var grupo = b.closest('[data-filtra]');
    setTimeout(function () { aplicarTudo(grupo); }, 0);
  });

  /* ---------------------------------------------- ordenar ---------------- */

  /* ORDENAR uma lista, que é coisa diferente de filtrar: nada sai da tela,
   * muda a ordem em que chega ao olho. "Mais recentes | Mais urgentes" da
   * caixa de entrada é o caso — e era, até aqui, um par de botões que só
   * trocava de cor.
   *
   * O grupo traz data-ordena e aponta o alvo por aria-controls; cada botão
   * traz a CHAVE em data-valor e a direção em data-dir. O item traz
   * data-<chave> — menos para 'tempo', que já está escrito no <time datetime>
   * da própria linha e não precisa ser repetido num atributo que pode
   * discordar dele.
   */
  function listaDe(alvo) {
    if (!alvo) return null;
    if (alvo.tagName === 'TABLE') return alvo.tBodies[0] || null;
    if (alvo.classList.contains('ucam-list') || alvo.classList.contains('ucam-grid')) return alvo;
    return alvo.querySelector('.ucam-list, .ucam-grid, tbody');
  }

  function chaveDe(item, chave) {
    if (item.hasAttribute('data-' + chave)) return item.getAttribute('data-' + chave);
    if (chave === 'tempo') {
      var t = item.querySelector('time[datetime]');
      return t ? t.getAttribute('datetime') : '';
    }
    return '';
  }

  function ordenar(alvo, chave, dir) {
    var lista = listaDe(alvo);
    if (!lista) return;
    var itens = Array.prototype.filter.call(lista.children, function (n) { return n.nodeType === 1; });
    itens.forEach(function (n, k) { if (!n.hasAttribute('data-ordem')) n.setAttribute('data-ordem', String(k)); });
    var num = itens.every(function (n) {
      var v = chaveDe(n, chave);
      return v === '' || !isNaN(Number(v));
    });
    var cmp = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
    itens.sort(function (a, b) {
      var va = chaveDe(a, chave);
      var vb = chaveDe(b, chave);
      // AUSENTE VAI PARA O FIM nas duas direções, como na ordenação de coluna.
      // Metade da fila não tem prazo apertado: se o vazio contasse como zero,
      // "mais urgentes" começaria por quem não tem urgência nenhuma.
      if (va === '' && vb !== '') return 1;
      if (vb === '' && va !== '') return -1;
      var r = num ? Number(va) - Number(vb) : cmp.compare(va, vb);
      // Empate desfeito pela ordem original: lista que se reembaralha a cada
      // clique faz quem lê perder o lugar sem nada ter mudado.
      if (!r) return Number(a.getAttribute('data-ordem')) - Number(b.getAttribute('data-ordem'));
      return dir === 'desc' ? -r : r;
    });
    itens.forEach(function (n) { lista.appendChild(n); });
    // Ordem nova, página 1: as linhas visíveis são as primeiras da fila, e não
    // as mesmas de antes espalhadas pela ordem nova.
    if (alvo && alvo.tagName === 'TABLE') paginarAlvo(alvo, 1);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ordena] button[data-valor]');
    if (!b) return;
    var grupo = b.closest('[data-ordena]');
    ordenar(
      document.getElementById(grupo.getAttribute('aria-controls') || '') || grupo.closest('section, .ucam-corpo, main'),
      b.getAttribute('data-valor'),
      b.getAttribute('data-dir') || 'asc',
    );
  });

  /* ---------------------------------------------- cenário ---------------- */

  /* O RECORTE QUE RECONSULTA. Escolher uma natureza no Analytics não esconde
   * linhas: troca todos os números da tela, porque cada recorte é outra
   * consulta. Numa tela estática isso não tem como ser calculado, então os
   * números de cada recorte vêm escritos na marcação, um atributo por recorte
   * (data-cenario-<chave>), e o script só troca o texto.
   *
   * É o mesmo contrato que o app cumpre com uma requisição — e é por isso que
   * o recorte vale para os números do período e não para os painéis que
   * declaram outro escopo ("situação de agora, em todas as naturezas").
   */
  function cenario(alvo, chave) {
    if (!alvo) return;
    Array.prototype.forEach.call(alvo.querySelectorAll('*'), function (el) {
      var tem = false;
      for (var k in el.dataset) { if (k.indexOf('cenario') === 0) { tem = true; break; } }
      if (!tem) return;
      // O texto de origem é o recorte cheio: guardado na primeira troca, senão
      // volta como "—" quando alguém escolhe Todas de novo.
      if (!el.hasAttribute('data-cenario-todas')) el.setAttribute('data-cenario-todas', el.textContent);
      var valor = el.getAttribute('data-cenario-' + (chave || 'todas'));
      el.textContent = valor === null ? el.getAttribute('data-cenario-todas') : valor;
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cenario] button[data-valor]');
    if (!b) return;
    var grupo = b.closest('[data-cenario]');
    cenario(
      document.getElementById(grupo.getAttribute('aria-controls') || '') || grupo.closest('.ucam-corpo, main'),
      b.getAttribute('data-valor'),
    );
  });

  /* ------------------------------------------- preferências da caixa ---- */
  /* O que a gaveta de preferências escolhe, a lista obedece na hora de
   * gravar: marcador escondido some da linha e a ordem passa pelo MESMO
   * controle da barra — a preferência clica nele em vez de ter um segundo
   * caminho de ordenação que pode divergir do primeiro. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-acao="salvar-preferencias"]');
    if (!b) return;
    var painel = b.closest('.ucam-drawer') || document;
    Array.prototype.forEach.call(painel.querySelectorAll('[data-pref-mostra]'), function (cx) {
      var seletor = cx.getAttribute('data-pref-mostra');
      Array.prototype.forEach.call(document.querySelectorAll('.ucam-list ' + seletor), function (el) {
        el.hidden = !cx.checked;
      });
    });
    // A ORDEM PASSA PELO CONTROLE DA BARRA, não por um segundo caminho: a
    // preferência clica no botão que já existe, com a chave que ele declara.
    // Dois caminhos de ordenação divergem no dia em que um deles mudar.
    var escolha = painel.querySelector('[data-pref-ordem] [aria-pressed="true"]');
    if (escolha) {
      var chave = escolha.getAttribute('data-valor');
      var barra = document.querySelector('.ucam-viewbar [data-ordena]');
      var alvo = barra && barra.querySelector('[data-valor="' + chave + '"]');
      if (alvo && alvo.getAttribute('aria-pressed') !== 'true') alvo.click();
    }
    anuncia('Preferências salvas. Valem só para você, neste navegador.', b);
  });

  /* ---------------------------------------------- marcar todos ---------- */

  function cabeca(tabela) {
    return tabela.querySelector('thead .th--selecao input[type="checkbox"]');
  }
  function caixas(tabela) {
    return Array.prototype.map.call(tabela.querySelectorAll('tbody .td--selecao'), function (td) {
      return td.querySelector('input[type="checkbox"]');
    }).filter(Boolean);
  }

  /* As linhas que o cabeçalho REALMENTE governa: as visíveis e habilitadas.
   *
   * A conta antes era sobre todas as caixas do corpo, e o marcar todos só
   * mexe nestas — então numa tabela com uma linha desabilitada (a natureza do
   * sistema, em Naturezas) o cabeçalho marcava 11 de 12 e voltava para o
   * estado misto no mesmo quadro: o navegador pintava o ✓ do clique e o
   * script o trocava pelo traço. Era o "flicker ao marcar todos". E como ele
   * nunca chegava a marcado, o clique seguinte marcava tudo outra vez em vez
   * de limpar — o controle ficava preso num sentido só. Medido em
   * 19/09/2026 com scratchpad/prova-cabeca.mjs. */
  function elegiveis(tabela) {
    return caixas(tabela).filter(function (c) { return !c.closest('[hidden]') && !c.disabled; });
  }

  /** Os três estados do cabeçalho, escritos na PROPRIEDADE e no atributo. */
  function sincroniza(tabela) {
    var topo = cabeca(tabela);
    if (!topo) return;
    var cx = elegiveis(tabela);
    var marcadas = cx.filter(function (c) { return c.checked; }).length;
    topo.checked = marcadas > 0 && marcadas === cx.length;
    topo.indeterminate = marcadas > 0 && marcadas < cx.length;
    if (topo.indeterminate) topo.setAttribute('data-indeterminate', 'true');
    else topo.removeAttribute('data-indeterminate');
  }

  // O eco da concessão: "22 de 44 concedidos" anda com o que se marca. O total
  // NÃO é o número de linhas — a tela mostra seis dos quarenta e quatro menus —,
  // então o que se mexe é a diferença, nunca a conta inteira.
  function ecoDaContagem(secao, delta) {
    var alvo = secao && secao.querySelector('.ucam-section__contagem');
    if (!alvo || !delta) return;
    var m = alvo.textContent.match(/^(\\d+) de (\\d+)(.*)$/);
    if (!m) return;
    var n = Math.min(Math.max(Number(m[1]) + delta, 0), Number(m[2]));
    alvo.textContent = n + ' de ' + m[2] + m[3];
  }

  document.addEventListener('change', function (e) {
    var cx = e.target;
    if (!cx.closest || cx.type !== 'checkbox') return;
    var tabela = cx.closest('table');
    if (!tabela || !cabeca(tabela)) return;
    var secao = tabela.closest('section');
    if (cx.closest('thead')) {
      // O mesmo conjunto que a sincronização conta — visíveis e habilitadas.
      var alvo = elegiveis(tabela);
      var antes = alvo.filter(function (c) { return c.checked; }).length;
      alvo.forEach(function (c) { c.checked = cx.checked; });
      var depois = alvo.filter(function (c) { return c.checked; }).length;
      ecoDaContagem(secao, depois - antes);
    } else {
      ecoDaContagem(secao, cx.checked ? 1 : -1);
    }
    sincroniza(tabela);
    lote(tabela);
    contaAlteracoes();
    var ligado = document.querySelector('[data-filtra="marcados"]');
    if (ligado) aplicarTudo(ligado);
  });

  /* ------------------------------------------ alterações não salvas ----- */
  /* O ESTADO SALVO É O QUE ESTÁ NO HTML. defaultChecked guarda o atributo
   * checked da marcação — isto é, o que veio do servidor —, enquanto checked
   * guarda o que a pessoa fez. A diferença entre os dois É a lista de
   * alterações pendentes, sem precisar de nenhum registro paralelo, e é ela
   * que "Descartar" desfaz. */
  function mexidas() {
    return Array.prototype.filter.call(document.querySelectorAll('tbody .td--selecao input[type="checkbox"]'), function (c) {
      return c.checked !== c.defaultChecked;
    });
  }

  function contaAlteracoes() {
    var eco = document.querySelector('[data-campo="alteracoes"]');
    if (!eco) return;
    var n = mexidas().length;
    eco.textContent = n === 0 ? 'Nenhuma alteração' : n === 1 ? '1 alteração não salva' : n + ' alterações não salvas';
  }

  // O texto da contagem de cada seção como ele veio: é para cá que o
  // Descartar volta, e recalculá-lo das linhas mentiria (a tela mostra seis
  // dos quarenta e quatro menus).
  var contagensIniciais = [];
  Array.prototype.forEach.call(document.querySelectorAll('.ucam-section__contagem'), function (c) {
    contagensIniciais.push([c, c.textContent]);
  });

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-acao="descartar-marcas"]');
    if (!b) return;
    mexidas().forEach(function (c) { c.checked = c.defaultChecked; });
    contagensIniciais.forEach(function (par) { par[0].textContent = par[1]; });
    Array.prototype.forEach.call(document.querySelectorAll('table'), function (t) {
      if (cabeca(t)) sincroniza(t);
    });
    contaAlteracoes();
    var ligado2 = document.querySelector('[data-filtra="marcados"]');
    if (ligado2) aplicarTudo(ligado2);
  });

  /* A BARRA DE LOTE só existe enquanto há seleção — é o que "barra que paira"
   * quer dizer. Ela ficava de pé com a tabela inteira desmarcada, oferecendo
   * arquivar nada, e o número dentro dela era texto fixo: marcar a quarta
   * linha continuava dizendo três.
   *
   * O substantivo ("naturezas") sai do próprio texto na primeira leitura e
   * fica guardado na barra: ele é da TELA, não do script, e a barra precisa
   * dele de volta quando a seleção renasce. */
  function lote(tabela) {
    var barra = (tabela.closest('section, .ucam-corpo, main') || document).querySelector('.ucam-lote');
    if (!barra) return;
    var n = elegiveis(tabela).filter(function (c) { return c.checked; }).length;
    var alvo = barra.querySelector('.ucam-lote__contagem');
    if (alvo) {
      if (!barra.hasAttribute('data-lote-nome')) {
        var m = alvo.textContent.trim().match(/^[0-9]+ (.*?) (selecionad[oa])s?$/);
        barra.setAttribute('data-lote-nome', m ? m[1] : 'itens');
        // O PARTICÍPIO também sai do texto da tela: "usuários selecionados" e
        // "naturezas selecionadas". Fixá-lo no feminino, como estava, fazia a
        // tabela de contas dizer "1 usuário selecionada".
        if (!barra.hasAttribute('data-lote-participio')) {
          barra.setAttribute('data-lote-participio', m ? m[2] : 'selecionada');
        }
      }
      // O singular vem declarado (data-lote-singular) ou, na falta, do plural
      // sem o s final — que resolve "naturezas" e "menus" e não resolve
      // "opções", e é por isso que o atributo existe.
      var plural = barra.getAttribute('data-lote-nome');
      var nome = n === 1
        ? barra.getAttribute('data-lote-singular') || plural.replace(/s$/, '')
        : plural;
      var participio = barra.getAttribute('data-lote-participio') || 'selecionada';
      alvo.textContent = n + ' ' + nome + ' ' + participio + (n === 1 ? '' : 's');
    }
    barra.hidden = n === 0;
  }

  // Na carga, a propriedade passa a valer o que o atributo dizia: sem isto o
  // cabeçalho nasce visualmente misto e ARIA vazio, dizendo duas coisas.
  /* ------------------------------------------------ paginação ----------- */

  /* A PÁGINA é a última palavra sobre o que se vê, e vem depois do filtro:
   * quem filtra decide QUAIS linhas existem para esta consulta, quem pagina
   * decide QUANTAS delas cabem de uma vez. Por isso paginar() roda no fim de
   * aplicar(), no fim de ordenar(), e também quando o menu de coluna reordena
   * a tabela — esse mora no estadoScript e avisa por 'ucam:lista'.
   *
   * A nav se declara com data-paginacao="<tamanho da página>". Sem o atributo
   * nada acontece: paginação é contrato da TELA (a de Naturezas tem só o
   * intervalo, porque doze de doze cabem numa página), e ligar todas as navs
   * do documento faria a demonstração do componente paginar uma tabela de
   * exemplo que não tem as linhas prometidas.
   *
   * Três regras do contrato (pagination.json → limites, acessibilidade) que é
   * fácil perder:
   *   · com UMA página não se desenha controle nenhum, só o intervalo;
   *   · com ZERO resultados não se desenha nada — o vazio é do EmptyState;
   *   · trocar de página ANUNCIA o novo intervalo e leva o foco para ele, não
   *     para o topo da tela.
   */
  function tabelaDaNav(nav) {
    var id = nav.getAttribute('aria-controls');
    if (id) {
      var apontada = document.getElementById(id);
      if (apontada) return apontada.tagName === 'TABLE' ? apontada : apontada.querySelector('table');
    }
    // A tabela é a que vem ANTES: a paginação fica no pé dela.
    var ir = nav.previousElementSibling;
    while (ir) {
      var achada = ir.tagName === 'TABLE' ? ir : ir.querySelector && ir.querySelector('table');
      if (achada) return achada;
      ir = ir.previousElementSibling;
    }
    return (nav.closest('section, .ucam-card, .ucam-corpo, main') || document).querySelector('table');
  }

  function navDaTabela(tabela) {
    if (!tabela || tabela.tagName !== 'TABLE') return null;
    var raiz = tabela.closest('section, .ucam-card, .ucam-corpo, main') || document;
    var navs = raiz.querySelectorAll('.ucam-pagination[data-paginacao]');
    for (var i = 0; i < navs.length; i++) {
      // Com duas tabelas na mesma seção, a primeira nav não governa a segunda.
      if (tabelaDaNav(navs[i]) === tabela) return navs[i];
    }
    return null;
  }

  /* As linhas que esta consulta TEM: o que a aba tirou do recorte e o que o
   * filtro recusou não são linhas desta fila, e não entram na conta de
   * páginas nem no intervalo. */
  function linhasDaPagina(tabela) {
    var tb = tabela && tabela.tBodies[0];
    if (!tb) return [];
    return Array.prototype.filter.call(tb.rows, function (tr) {
      return !tr.hasAttribute('data-fora-do-recorte') && !tr.hasAttribute('data-filtrado-fora');
    });
  }

  /* O INTERVALO, que é a parte obrigatória do componente — a paginação pode
   * perder os botões (uma página só) e nunca perde esta frase.
   *
   * O substantivo e o total do conjunto saem do texto que a tela escreveu, na
   * primeira leitura, e ficam guardados na nav: o script não sabe dizer
   * "usuários", e o total do conjunto não pode sumir quando o filtro encolhe
   * a lista. Mesmo arranjo do data-lote-nome da barra de lote.
   *
   * O particípio é declarado (data-paginacao-participio) porque nenhuma regra
   * de flexão tira "filtradas" de "naturezas" — é o mesmo motivo do
   * data-lote-singular. */
  function intervalo(nav, de, ate, quantas) {
    var faixa = nav.querySelector('.ucam-pagination__range');
    if (!faixa) return;
    if (!nav.hasAttribute('data-paginacao-nome')) {
      var m = faixa.textContent.trim().match(/^[0-9]+\\s*[\\u2013-]\\s*[0-9]+ de ([0-9.]+) (.+)$/);
      nav.setAttribute('data-paginacao-nome', m ? m[2] : 'itens');
      nav.setAttribute('data-paginacao-total', m ? m[1].replace(/\\./g, '') : String(quantas));
    }
    var nome = nav.getAttribute('data-paginacao-nome');
    var total = Number(nav.getAttribute('data-paginacao-total')) || quantas;
    var faixaTexto = de + '\\u2013' + ate + ' de ' + quantas + ' ' + nome;
    // "11–20 de 12 requerimentos filtrados (340 no total)": o contrato manda
    // dizer as duas contas, senão o filtro parece ter apagado o conjunto.
    if (quantas < total) {
      faixaTexto += ' ' + (nav.getAttribute('data-paginacao-participio') || 'filtrados') +
        ' (' + total + ' no total)';
    }
    faixa.textContent = faixaTexto;
  }

  /* A JANELA de números: três seguidos em volta da atual, mais as duas pontas,
   * e elipse em cada buraco. Na página 1 de 32 dá "1 2 3 … 32", que é o
   * desenho que as telas já traziam escrito à mão. */
  function janela(atual, paginas) {
    if (paginas <= 5) {
      var todas = [];
      for (var i = 1; i <= paginas; i++) todas.push(i);
      return todas;
    }
    var ini = Math.min(Math.max(1, atual - 1), paginas - 2);
    var lista = [1];
    for (var k = ini; k <= Math.min(paginas, ini + 2); k++) if (lista.indexOf(k) < 0) lista.push(k);
    if (lista.indexOf(paginas) < 0) lista.push(paginas);
    lista.sort(function (a, b) { return a - b; });
    var comBuracos = [];
    lista.forEach(function (n, i) {
      if (i && n - lista[i - 1] > 1) comBuracos.push(null);
      comBuracos.push(n);
    });
    return comBuracos;
  }

  function botaoDePagina(n, paginas, atual) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ucam-pagination__page';
    // "Página 3 de 14", nunca o dígito sozinho: é requisito do contrato.
    b.setAttribute('aria-label', 'P\\u00e1gina ' + n + ' de ' + paginas);
    if (n === atual) b.setAttribute('aria-current', 'page');
    b.textContent = String(n);
    return b;
  }

  function elipse() {
    var s = document.createElement('span');
    s.className = 'ucam-pagination__elipse';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = '\\u2026';
    return s;
  }

  /* Os controles. As PONTAS (.ucam-pagination__salto) são da marcação e ficam
   * onde estão — elas trazem ícone e palavra, e reconstruí-las aqui duplicaria
   * o desenho. O que se refaz é só a fileira de números e as elipses, que são
   * consequência de quantas páginas existem agora. */
  function controles(nav, atual, paginas) {
    Array.prototype.forEach.call(
      nav.querySelectorAll('.ucam-pagination__page:not(.ucam-pagination__salto), .ucam-pagination__elipse'),
      function (n) { n.remove(); },
    );
    var pontas = Array.prototype.filter.call(nav.children, function (n) {
      return n.classList.contains('ucam-pagination__salto');
    });
    var proxima = pontas.filter(function (b) { return /pr\\u00f3xima|\\u00faltima/i.test(b.getAttribute('aria-label') || ''); })[0];
    // Uma página só: nenhum controle, apenas o intervalo.
    pontas.forEach(function (b) { b.hidden = paginas <= 1; });
    if (paginas <= 1) return;
    janela(atual, paginas).forEach(function (n) {
      var el = n === null ? elipse() : botaoDePagina(n, paginas, atual);
      nav.insertBefore(el, proxima || null);
    });
    pontas.forEach(function (b) {
      var rot = (b.getAttribute('aria-label') || '').toLowerCase();
      var noComeco = rot.indexOf('anterior') >= 0 || rot.indexOf('primeira') >= 0;
      var morta = noComeco ? atual === 1 : atual === paginas;
      // aria-disabled, não disabled: a ponta continua focável para não sumir
      // da ordem de tabulação no meio da fileira.
      if (morta) b.setAttribute('aria-disabled', 'true');
      else b.removeAttribute('aria-disabled');
    });
  }

  function paginar(nav, pedida) {
    var tabela = tabelaDaNav(nav);
    if (!tabela) return;
    var lista = linhasDaPagina(tabela);
    var tam = Number(nav.getAttribute('data-paginacao')) || 10;
    var paginas = Math.max(1, Math.ceil(lista.length / tam));
    var atual = Math.min(Math.max(1, pedida || Number(nav.getAttribute('data-pagina')) || 1), paginas);
    nav.setAttribute('data-pagina', String(atual));
    var de = (atual - 1) * tam;
    var ate = Math.min(de + tam, lista.length);
    lista.forEach(function (tr, i) { tr.hidden = i < de || i >= ate; });
    intervalo(nav, lista.length ? de + 1 : 0, ate, lista.length);
    controles(nav, atual, paginas);
    // Zero resultado: nada de paginação. Quem fala é o EmptyState.
    nav.hidden = lista.length === 0;
    // A cabeça de seleção e a barra de lote falam da PÁGINA — é a mesma regra
    // do filtro: o que não está na tela não está no lote.
    if (cabeca(tabela)) { sincroniza(tabela); lote(tabela); }
  }

  function paginarAlvo(alvo, pedida) {
    var nav = navDaTabela(alvo);
    if (nav) paginar(nav, pedida);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.ucam-pagination[data-paginacao] .ucam-pagination__page');
    if (!b || b.getAttribute('aria-disabled') === 'true' || b.getAttribute('aria-current') === 'page') return;
    var nav = b.closest('.ucam-pagination');
    var atual = Number(nav.getAttribute('data-pagina')) || 1;
    var rot = (b.getAttribute('aria-label') || '').toLowerCase();
    var num = /^p\\u00e1gina ([0-9]+) de/.exec(rot);
    var destino = num ? Number(num[1])
      : rot.indexOf('primeira') >= 0 ? 1
      : rot.indexOf('\\u00faltima') >= 0 ? 1e9
      : rot.indexOf('anterior') >= 0 ? atual - 1
      : atual + 1;
    paginar(nav, destino);
    // O foco vai para o RESUMO, não para o topo: quem trocou de página quer
    // saber o que está vendo agora, e o intervalo é quem diz.
    var faixa = nav.querySelector('.ucam-pagination__range');
    if (faixa) {
      if (!faixa.hasAttribute('tabindex')) faixa.setAttribute('tabindex', '-1');
      faixa.focus();
    }
  });

  // Reordenar por menu de coluna mora no estadoScript; ele avisa por evento,
  // e a fila volta para a primeira página — a ordem mudou, a página 3 da
  // ordem velha não quer dizer nada.
  document.addEventListener('ucam:lista', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('table') : null;
    if (t) paginarAlvo(t, 1);
  });

  Array.prototype.forEach.call(document.querySelectorAll('table'), function (t) {
    if (cabeca(t)) { sincroniza(t); lote(t); }
  });

  // A PRIMEIRA PÁGINA. A marcação já nasce com as linhas seguintes hidden —
  // sem JavaScript a tela mostra a página 1, e não as trinta linhas de uma vez
  // —, e é aqui que os controles ganham estado.
  Array.prototype.forEach.call(document.querySelectorAll('.ucam-pagination[data-paginacao]'), function (nav) {
    paginar(nav, Number(nav.getAttribute('data-pagina')) || 1);
  });
})();
`;

/**
 * A CONFIRMAÇÃO das ações que mexem no acesso de alguém.
 *
 * Catorze botões das telas do Gerencial estavam aria-disabled com o mesmo
 * motivo no título: "a confirmação não está desenhada neste conjunto". O que
 * faltava não era a ação — bloquear uma conta é trocar um selo e um verbo —,
 * era o passo do meio. Sem ele a tela tinha duas escolhas ruins: destravar o
 * botão e destruir ao primeiro clique, ou deixá-lo morto.
 *
 * O diálogo é o <dialog> NATIVO com showModal: ele já retém o foco e deixa o
 * resto da página inerte, e o contrato proíbe reimplementar isso à mão. Duas
 * regras do contrato dialog que o código abaixo cumpre e que são fáceis de
 * perder: o foco de abertura NUNCA pousa na ação destrutiva (pousa em
 * Cancelar), e ao fechar ele volta para quem abriu — ou, se a linha sumiu com
 * o clique, para o cabeçalho da região, que é o que sobrou para se agarrar.
 *
 * A interceptação é na fase de CAPTURA: o clique original é engolido antes de
 * chegar ao estadoScript, e depois do "sim" o mesmo botão é clicado de novo,
 * agora com data-confirmado. Assim o efeito mora num lugar só — se o bloqueio
 * mudar, muda no estadoScript, e a confirmação não fica sabendo.
 */
export const confirmaScript = `
(function () {
  var TEXTOS = {
    'bloquear': {
      corpo: 'A pessoa perde o acesso ao SIGU no próximo clique dela. Os grupos e o histórico continuam como estão, e o acesso pode ser devolvido depois.',
      rotulo: 'Bloquear acesso',
      tom: 'danger',
    },
    'desbloquear': {
      corpo: 'A pessoa volta a entrar com a senha que já tinha. Se o bloqueio foi por tentativas de senha, a contagem zera.',
      rotulo: 'Desbloquear',
      tom: 'primary',
    },
    'bloquear-lote': {
      corpo: 'As contas marcadas perdem o acesso ao SIGU no próximo clique de cada pessoa. Os grupos e o histórico continuam como estão, e o acesso pode ser devolvido depois. Quem já está bloqueado fica de fora.',
      rotulo: 'Bloquear acesso',
      tom: 'danger',
    },
    'sair-grupo': {
      corpo: 'Os menus que vinham só deste grupo deixam de valer no próximo acesso. Os menus concedidos direto à pessoa continuam.',
      rotulo: 'Tirar do grupo',
      tom: 'danger',
    },
    'redefinir-senha': {
      corpo: 'A pessoa recebe um e-mail com um link de uma hora para escolher outra senha. A senha atual continua valendo até ela trocar.',
      rotulo: 'Enviar e-mail',
      tom: 'primary',
    },
    'descartar-marcas': {
      corpo: 'As caixas voltam ao que está salvo. O que você marcou e desmarcou desde a última gravação se perde, e não há como recuperar.',
      rotulo: 'Descartar alterações',
      tom: 'danger',
    },
    'reemitir-cartao': {
      corpo: 'O cartão atual deixa de valer imediatamente e uma série nova é emitida. Quem estiver com o cartão antigo na mão não entra.',
      rotulo: 'Reemitir cartão',
      tom: 'danger',
    },
  };

  var caixa = null;

  function monta() {
    if (caixa) return caixa;
    caixa = document.createElement('dialog');
    caixa.className = 'ucam-dialog';
    caixa.innerHTML =
      '<form method="dialog" class="ucam-dialog__form">' +
        '<div class="ucam-dialog__header"><h2 class="ucam-dialog__title"></h2></div>' +
        '<div class="ucam-dialog__body"><p class="ucam-dialog__texto"></p></div>' +
        '<div class="ucam-dialog__footer">' +
          '<button class="ucam-btn ucam-btn--secondary" type="submit" value="nao" data-cancelar>Cancelar</button>' +
          '<button class="ucam-btn ucam-btn--primary" type="submit" value="sim" data-confirmar-ok></button>' +
        '</div>' +
      '</form>';
    // DENTRO do .ucam, não no body: os tokens e a fonte do sistema são
    // escopados nele, e um diálogo pendurado no body sai em Times, com as
    // medidas do navegador. O <dialog> modal desenha na top layer de qualquer
    // jeito, então aninhar não muda o empilhamento — muda só a herança.
    (document.querySelector('.ucam') || document.body).appendChild(caixa);
    return caixa;
  }

  // O foco de saída: quem abriu, se ainda existe; senão o título da região,
  // que recebe tabindex -1 só para poder recebê-lo.
  function devolveFoco(gatilho, ancora) {
    if (gatilho && gatilho.isConnected) return gatilho.focus();
    var titulo = ancora && (ancora.querySelector('.ucam-section__title, h2, h3'));
    if (!titulo) return;
    titulo.setAttribute('tabindex', '-1');
    titulo.focus();
  }

  document.addEventListener('click', function (e) {
    var botao = e.target.closest && e.target.closest('[data-confirmar]');
    if (!botao || botao.hasAttribute('data-confirmado')) return;
    e.preventDefault();
    e.stopPropagation();

    var acao = botao.getAttribute('data-acao');
    var texto = TEXTOS[acao];
    if (!texto) return;

    var d = monta();
    d.querySelector('.ucam-dialog__title').textContent = (botao.getAttribute('aria-label') || botao.textContent.trim()) + '?';
    d.querySelector('.ucam-dialog__texto').textContent = texto.corpo;
    var ok = d.querySelector('[data-confirmar-ok]');
    ok.textContent = texto.rotulo;
    // O tom destrutivo é data-tone, não modificador: ver a nota do .ucam-btn.
    if (texto.tom === 'danger') ok.setAttribute('data-tone', 'danger');
    else ok.removeAttribute('data-tone');
    var ancora = botao.closest('section') || botao.closest('main');

    d.onclose = function () {
      var sim = d.returnValue === 'sim';
      d.onclose = null;
      if (sim) {
        botao.setAttribute('data-confirmado', '');
        botao.click();
        botao.removeAttribute('data-confirmado');
      }
      devolveFoco(botao, ancora);
    };

    d.showModal();
    // NUNCA a ação destrutiva: o foco pousa em Cancelar (contrato dialog).
    d.querySelector('[data-cancelar]').focus();
  }, true);
})();
`;

/**
 * O DIÁLOGO QUE PERGUNTA QUAL, irmão do confirmaScript.
 *
 * Confirmar é sim ou não, e o diálogo pode ser montado pelo script. Escolher
 * qual grupo é outra coisa: tem um controle dentro, e controle mora na
 * marcação da tela — é lá que se escreve a etiqueta, a lista e a dica. Por
 * isso aqui o <dialog> vem do HTML e o script só o abre, lê a escolha e
 * devolve o clique ao botão, com data-confirmado e data-escolha.
 *
 * O efeito continua no estadoScript, como no confirmaScript: quem sabe mexer
 * na tela é ele, e um só lugar decide o que "adicionar a grupo" faz.
 */
export const dialogoScript = `
(function () {
  document.addEventListener('click', function (e) {
    var botao = e.target.closest && e.target.closest('[data-abre-dialogo]');
    if (!botao || botao.hasAttribute('data-confirmado')) return;
    var d = document.getElementById(botao.getAttribute('data-abre-dialogo'));
    if (!d) return;
    e.preventDefault();
    e.stopPropagation();

    d.returnValue = '';
    d.onclose = function () {
      d.onclose = null;
      if (d.returnValue === 'ok') {
        // Dois formatos: o <select> da marcação crua e o gatilho de listbox
        // que o listboxSelects põe no lugar dele nas telas. O rótulo do
        // gatilho É a escolha — é o que a pessoa lê antes de confirmar.
        var sel = d.querySelector('select');
        var gatilho = d.querySelector('[data-listbox]');
        var valor = sel ? sel.options[sel.selectedIndex].text : gatilho ? gatilho.textContent.trim() : '';
        if (valor) botao.setAttribute('data-escolha', valor);
        botao.setAttribute('data-confirmado', '');
        botao.click();
        botao.removeAttribute('data-confirmado');
      }
      // O foco volta a quem abriu, como no confirmaScript.
      if (botao.isConnected) botao.focus();
    };

    d.showModal();
    // Aqui o foco PODE pousar no controle: ele não decide nada sozinho, e
    // quem abriu um diálogo de escolha veio justamente escolher.
    var primeiro = d.querySelector('select, [data-listbox], input, textarea');
    if (primeiro) primeiro.focus();
  }, true);
})();
`;

/**
 * A GAVETA: painel que entra pela borda para uma tarefa curta sem tirar a
 * pessoa da lista que ela estava lendo (contrato drawer.json).
 *
 * O que o contrato exige e o que o código faz:
 *   - foco entra no primeiro interativo do CORPO, nunca no fechar, que é a
 *     saída;
 *   - foco preso enquanto aberta: quem prende é o `inert` no resto da página,
 *     não um laço de Tab escrito à mão — o navegador já sabe fazer isso, e
 *     `inert` cobre até documento de iframe aninhado;
 *   - Esc fecha e o foco volta a quem abriu;
 *   - a rolagem do documento trava; a única área que rola é o corpo;
 *   - clicar no scrim fecha, porque a gaveta é dispensável por natureza.
 *
 * Não empilha: gaveta aberta não abre outra (limite do contrato).
 */
export const gavetaScript = `
(function () {
  var aberta = null;
  var gatilho = null;

  /**
   * O que fica inerte: os IRMÃOS da gaveta em cada nível, subindo até o body.
   *
   * A primeira versão marcava os filhos do body e pronto — e a gaveta vive
   * dentro do .ucam, não no body. Resultado: o ancestral dela virava inerte e
   * a gaveta inteira ia junto, sem foco possível. Medido em 20/09/2026: o
   * foco de abertura caía no pular-para-o-conteúdo.
   */
  function irmaos(painel) {
    var fora = [];
    for (var n = painel; n && n !== document.body; n = n.parentElement) {
      Array.prototype.forEach.call(n.parentElement ? n.parentElement.children : [], function (irmao) {
        if (irmao !== n && !irmao.classList.contains('ucam-drawer-scrim')) fora.push(irmao);
      });
    }
    return fora;
  }

  function abrir(painel, quem) {
    if (aberta) return;
    aberta = painel;
    gatilho = quem;
    painel.hidden = false;
    var scrim = painel.previousElementSibling;
    if (scrim && scrim.classList.contains('ucam-drawer-scrim')) scrim.hidden = false;
    irmaos(painel).forEach(function (n) { n.setAttribute('inert', ''); });
    document.documentElement.style.overflow = 'hidden';
    var corpo = painel.querySelector('.ucam-drawer__body');
    var primeiro = corpo && corpo.querySelector('button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])');
    // DEPOIS de quem fechou o menu. A gaveta costuma ser aberta por um item de
    // menu, e o script do menu devolve o foco ao gatilho dele ao fechar — se a
    // gaveta focar antes, o menu rouba o foco em seguida e a pessoa continua
    // atrás da sobreposição. Medido em 20/09/2026: o foco caía no pular-para-o-
    // conteúdo, fora da gaveta.
    setTimeout(function () { (primeiro || painel).focus(); }, 0);
  }

  function fechar() {
    if (!aberta) return;
    var painel = aberta;
    aberta = null;
    painel.hidden = true;
    var scrim = painel.previousElementSibling;
    if (scrim && scrim.classList.contains('ucam-drawer-scrim')) scrim.hidden = true;
    irmaos(painel).forEach(function (n) { n.removeAttribute('inert'); });
    document.documentElement.style.overflow = '';
    // O foco volta a quem abriu, se ele ainda estiver ALCANÇÁVEL. Item de menu
    // não está: o menu fechou junto com a abertura da gaveta, e focar um nó
    // escondido joga o foco no começo do documento. Nesse caso a saída é o
    // gatilho do próprio menu, que continua na tela e é de onde a pessoa veio.
    var volta = gatilho;
    if (volta && (!volta.isConnected || volta.offsetParent === null)) {
      var menu = volta.closest('.ucam-menu');
      volta = menu ? document.getElementById(menu.getAttribute('aria-labelledby') || '') : null;
    }
    if (volta) volta.focus();
    gatilho = null;
  }

  document.addEventListener('click', function (e) {
    var abre = e.target.closest && e.target.closest('[data-abre-gaveta]');
    if (abre) {
      var painel = document.getElementById(abre.getAttribute('data-abre-gaveta'));
      if (!painel) return;
      e.preventDefault();
      return abrir(painel, abre);
    }
    if (!aberta) return;
    if (e.target.closest('[data-fecha-gaveta]')) return fechar();
    if (e.target.classList && e.target.classList.contains('ucam-drawer-scrim')) return fechar();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && aberta) {
      e.preventDefault();
      fechar();
    }
  });
})();
`;

export const menuContaScript = `
(function () {
  // Um seletor para os TRÊS gatilhos de popover do shell: a conta, o lançador
  // de sistemas e o ramo da fileira de seções. Eram todos data-conta
  // quando a conta era o único popover que existia; o comportamento sempre foi
  // genérico — abrir, fechar com Esc, clicar fora, devolver o foco — e só o
  // nome do atributo dizia o contrário.
  var GATILHO = '[data-conta],[data-menu]';

  function menuDe(gatilho) {
    return document.getElementById(gatilho.getAttribute('aria-controls'));
  }

  function itens(menu) {
    // menuitemradio entra junto: o item que ESCOLHE (trocar de campus) anda
    // pelas mesmas setas do item que EXECUTA. Sem ele no seletor, o menu de
    // campus abria e o teclado nao alcancava opcao nenhuma.
    // Item escondido fica FORA: o "Remover ordenacao" do menu da coluna so
    // existe com a coluna ordenada, e focar um item com hidden falha em
    // silencio — a seta parava nele e o foco nao andava.
    return Array.prototype.slice.call(menu.querySelectorAll('[role="menuitem"],[role="menuitemradio"]'))
      .filter(function (el) { return !el.hidden; });
  }

  // O MENU DA COLUNA e fixo (ver .ucam-menu--coluna no build-css): o topo e a
  // esquerda saem do retangulo do gatilho, com a borda da janela como teto —
  // e abre para CIMA quando embaixo nao cabe, que e o caso da tabela colada
  // no pe da tela.
  function posicionar(gatilho, menu) {
    if (!menu.classList.contains('ucam-menu--coluna')) return;
    var r = gatilho.getBoundingClientRect();
    var larg = menu.offsetWidth;
    var alt = menu.offsetHeight;
    var y = r.bottom + 4;
    if (y + alt > window.innerHeight - 8 && r.top - 4 - alt > 8) y = r.top - 4 - alt;
    var x = Math.max(8, Math.min(r.left, window.innerWidth - larg - 8));
    menu.style.insetBlockStart = y + 'px';
    menu.style.insetInlineStart = x + 'px';
  }

  function fechar(gatilho, devolverFoco) {
    var menu = menuDe(gatilho);
    gatilho.setAttribute('aria-expanded', 'false');
    if (menu) menu.hidden = true;
    if (devolverFoco) gatilho.focus();
  }

  function abrir(gatilho) {
    var menu = menuDe(gatilho);
    gatilho.setAttribute('aria-expanded', 'true');
    if (!menu) return;
    menu.hidden = false;
    posicionar(gatilho, menu);
    var lista = itens(menu);
    // preventScroll: focar o primeiro item rola o contêiner quando o menu
    // nasce fora da área rolável (a tabela dentro do .ucam-table-wrap), e a
    // rolagem fecha o menu da coluna no mesmo clique que o abriu — medido no
    // catálogo do site em 13/09/2026. O menu fixo já está na janela; não há
    // o que rolar.
    if (lista.length) lista[0].focus({ preventScroll: true });
  }

  // Menu fixo nao acompanha a rolagem: fecha. Captura, porque quem rola
  // costuma ser o .ucam-table-wrap ou o main, e scroll nao borbulha.
  function fecharColunas() {
    Array.prototype.forEach.call(document.querySelectorAll(GATILHO + '[aria-expanded="true"]'), function (g) {
      var m = menuDe(g);
      if (m && m.classList.contains('ucam-menu--coluna')) fechar(g, false);
    });
  }
  document.addEventListener('scroll', function (e) {
    if (e.target && e.target.closest && e.target.closest('.ucam-menu--coluna')) return;
    fecharColunas();
  }, true);
  window.addEventListener('resize', fecharColunas);

  function abertos(exceto) {
    return Array.prototype.slice
      .call(document.querySelectorAll(GATILHO + '[aria-expanded="true"]'))
      .filter(function (g) { return g !== exceto; });
  }

  document.addEventListener('click', function (e) {
    var gatilho = e.target.closest && e.target.closest(GATILHO);
    var ramo = e.target.closest && e.target.closest('[data-ramo]');

    // Um menu aberto por vez. Dois popovers abertos na mesma tela e o clique
    // fora deixa de ter significado unico.
    abertos(gatilho).forEach(function (g) {
      if (!e.target.closest('#' + g.getAttribute('aria-controls'))) fechar(g, false);
    });

    if (gatilho) {
      if (gatilho.getAttribute('aria-expanded') === 'true') fechar(gatilho, false);
      else abrir(gatilho);
      return;
    }

    // Os ramos do menu lateral. O estado mora no aria-expanded do botao e no
    // hidden da lista — sem classe de estado paralela, que e como um menu
    // acaba com o chevron apontando para um lado e a lista aberta para o
    // outro.
    if (ramo) {
      var sub = document.getElementById(ramo.getAttribute('aria-controls'));
      var aberto = ramo.getAttribute('aria-expanded') === 'true';
      ramo.setAttribute('aria-expanded', String(!aberto));
      if (sub) sub.hidden = aberto;
    }

    // RECOLHER a navegacao do modulo.
    //
    // O estado mora em DOIS lugares que precisam concordar: a classe no shell,
    // que governa a largura da coluna, e o aria-expanded do proprio botao, que
    // e o que o leitor de tela anuncia. Escrever so um dos dois foi como o
    // parque chegou a chevrons apontando para o lado errado.
    //
    // A escolha PERSISTE em localStorage: recolher a navegacao e uma preferencia
    // de quem trabalha na tela o dia inteiro, e refaze-la a cada carga anularia
    // o ganho. A gravacao vai em try porque em modo privado o acesso lanca.
    var recolher = e.target.closest && e.target.closest('[data-recolher]');
    if (recolher) {
      var shell = recolher.closest('.ucam-shell');
      if (!shell) return;
      var vaiRecolher = recolher.getAttribute('aria-expanded') === 'true';
      shell.classList.toggle('ucam-shell--nav-recolhida', vaiRecolher);
      recolher.setAttribute('aria-expanded', String(!vaiRecolher));
      try { localStorage.setItem('ucam-nav-recolhida', vaiRecolher ? '1' : '0'); } catch (err) {}
    }

    // O TEMA. auto REMOVE o data-theme em vez de gravar "auto" nele: sem o
    // atributo, a folha de tokens obedece ao prefers-color-scheme, e e isso
    // que faz o tema acompanhar o sistema operacional quando ele troca a
    // noite. O menu fica aberto — quem escolhe ve a tela mudar atras dele e
    // pode voltar atras sem reabrir.
    var tema = e.target.closest && e.target.closest('[data-tema]');
    if (tema) {
      var v = tema.getAttribute('data-tema');
      if (v === 'auto') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', v);
      try {
        if (v === 'auto') localStorage.removeItem('ucam-theme');
        else localStorage.setItem('ucam-theme', v);
      } catch (err) {}
      marcarTema(v);
    }
  });

  function marcarTema(v) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-tema]'), function (it) {
      it.setAttribute('aria-checked', String(it.getAttribute('data-tema') === v));
    });
  }
  // O que o head aplicou antes da pintura vira a marca do menu.
  marcarTema(document.documentElement.getAttribute('data-theme') || 'auto');

  // Restaura a preferencia antes da primeira pintura que o usuario percebe.
  // Se falhar, a navegacao abre — o padrao aberto e o que ensina onde estao os
  // destinos a quem chega pela primeira vez.
  try {
    if (localStorage.getItem('ucam-nav-recolhida') === '1') {
      var alvo = document.querySelector('[data-recolher]');
      var raiz = alvo && alvo.closest('.ucam-shell');
      if (raiz) {
        raiz.classList.add('ucam-shell--nav-recolhida');
        alvo.setAttribute('aria-expanded', 'false');
      }
    }
  } catch (err) {}

  document.addEventListener('keydown', function (e) {
    var gatilho = e.target.closest && e.target.closest(GATILHO);

    // Baixo abre JA no primeiro item — o atalho que todo menu de aplicacao tem.
    if (gatilho && e.key === 'ArrowDown') {
      e.preventDefault();
      abrir(gatilho);
      return;
    }

    var menu = e.target.closest && e.target.closest('[role="menu"]');
    if (!menu) return;
    var dono = document.querySelector('[data-conta][aria-controls="' + menu.id + '"],[data-menu][aria-controls="' + menu.id + '"]');
    if (!dono) return;

    var lista = itens(menu);
    var i = lista.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); fechar(dono, true); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); lista[(i + 1) % lista.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); lista[(i - 1 + lista.length) % lista.length].focus(); }
    else if (e.key === 'Tab') fechar(dono, false);
  });
})();
`.trim();
