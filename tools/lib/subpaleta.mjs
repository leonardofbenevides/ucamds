/* A SUBPALETA DE CADA SISTEMA — a receita, num lugar só.
 *
 * A ADR-037 derivava os degraus da ação com `color-mix()` escrito à mão dentro
 * do CSS. Isso resolvia no NAVEGADOR, e é o que torna a promessa do contrato
 * impossível de conferir: um valor que só existe em tempo de execução nenhum
 * portão mede. O mesmo buraco que a auditoria de setembro achou nos contratos
 * e que check-marca-vs-destrutivo.mjs fechou para o par marca × destrutivo.
 *
 * Aqui a conta sai do navegador e vira número. `tools/build-css.mjs` emite o
 * hex que este módulo calcula, e `tools/check-subpaleta.mjs` mede o hex que
 * este módulo calcula. Portão e folha lendo a MESMA função é o que impede os
 * dois de discordarem sobre a mesma cor — a regra que tools/lib/wcag.mjs já
 * estabeleceu para o contraste.
 *
 * Dois eixos separados, e é por isso que `color-mix` com o texto não servia:
 *
 *   CROMA  — o pedido de 20/09/2026, "nas paletas dos apps, pode usar cores
 *            menos saturadas". Misturar a categoria com text-primary derrubava
 *            croma e lightness JUNTOS, na proporção que a matiz decidisse.
 *            Dessaturar sem escurecer era inexprimível.
 *   LIGHTNESS — o que separa a ação do tom semântico vizinho. A ADR-026 mediu
 *            e escreveu: sob protanopia e deuteranopia o arco vinho→laranja
 *            colapsa num eixo, e girar a matiz não rende nada. Vale igual
 *            aqui, e com mais força: categoria-financeiro e
 *            feedback-success-border são o MESMO hex (#17825A), assim como
 *            categoria-academico e feedback-info-border (#1A6FC4). Não é uma
 *            vizinhança apertada, é a mesma cor — e só o L as separa.
 */

import { hexParaRgb, rgbParaHex, rgbLinearParaOklab, oklabParaRgbLinear, hexParaOklch, oklchParaHex } from './color.mjs';

const paraLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const paraGama = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/* As seis categorias da ADR-032. A ordem é a do token, não alfabética: é a
 * ordem em que o portão de daltonismo já compara os seis entre si, e duas
 * listas com a mesma coisa em ordens diferentes é como um portão passa a
 * medir um par que o outro não mede. */
export const SISTEMAS = ['academico', 'financeiro', 'atendimento', 'gestao', 'pessoas', 'acervo'];

/* `color-mix(in oklab, A, B p%)` — a mesma interpolação que o navegador faz,
 * em OKLab, para o build poder prever o que a folha mostraria. Existe para a
 * receita ANTIGA continuar calculável: é assim que se compara o que a ADR-037
 * emitia com o que ela passa a emitir, sem ter de abrir o navegador. */
export function misturaOklab(a, b, p) {
  const A = rgbLinearParaOklab(hexParaRgb(a).map(paraLinear));
  const B = rgbLinearParaOklab(hexParaRgb(b).map(paraLinear));
  const m = A.map((v, i) => v * (1 - p) + B[i] * p);
  return rgbParaHex(oklabParaRgbLinear(m).map(paraGama));
}

/* QUANTO DE CROMA A SUBPALETA GUARDA.
 *
 * O pedido de 20/09/2026 foi "pode usar cores menos saturadas", sem número.
 * O número sai do portão: dessaturar aproxima tudo do cinza, e no cinza as
 * subpaletas colidem UMAS COM AS OUTRAS — some a única coisa que dizia em que
 * sistema a pessoa está. `pnpm run subpaleta` mede esses pares e é ele quem
 * encontra o piso; mexer aqui sem ler o relato troca um portão por um gosto. */
export const FATOR_CROMA = 0.62;

/* OS DEGRAUS, em lightness OKLCH absoluta (0–100).
 *
 * ABSOLUTA, e não uma porcentagem de mistura sobre a categoria: é a diferença
 * inteira entre esta receita e a que ela substitui. Cinco categorias que
 * entram com L entre 50 e 62 saíam, pela mistura de porcentagem fixa, em cinco
 * alturas diferentes — e a altura é justamente o eixo que carrega o contraste
 * E a separação do tom semântico. Com o L fixo, as subpaletas são A MESMA
 * subpaleta em matizes diferentes, e não cinco paletas improvisadas.
 *
 * DE ONDE VEM O 35 (claro). É um teto, não um gosto. A ação tem de ficar a dez
 * pontos de L de todo tom semântico da sua família de matiz — o mecanismo da
 * ADR-026: sob protanopia e deuteranopia a matiz colapsa e só o L separa. O
 * tom que mais aperta é o NUMERAL (sucesso em L 47, aviso em L 52), e não é
 * coincidência: o numeral do indicador e o botão primário dividem a tela do
 * painel, que é o risco nomeado na ADR-037. Dez abaixo de 47 dá 37; academico
 * ainda tem o link em L 46 e fecha em 35,5. O 35 é o maior valor que serve aos
 * cinco ao mesmo tempo — e sim, a ação fica mais escura que o bordô de hoje
 * (L 44). É o preço da regra, e foi medido antes de ser escrito.
 *
 * DE ONDE VEM O 77 (escuro). O mesmo aperto de cabeça para baixo: no escuro o
 * texto sobre a ação é quase-preto, então o preenchimento sobe em vez de
 * descer. Acervo é quem fecha a janela — aviso-border em L 62 e aviso-numeral
 * em L 66 o empurram para 76 ou mais, e o piso de separação à vista comum o
 * trava logo acima. 77 é o único degrau que cabe nos cinco. */
export const DEGRAUS = {
  claro: { default: 35, hover: -7, active: -13, subtle: 0.09, marca: 35, teto: 12, realce: 88 },
  escuro: { default: 77, hover: +7, active: +13, subtle: 0.14, marca: 30, teto: 96, realce: 36 },
};

/* O REALCE é degrau próprio, e as alturas saem do realce da MARCA, medido:
 * #FCC9CB é L 88,1 no claro e #6C1E2B é L 36,4 no escuro. É o único papel da
 * família que carrega texto de leitura por cima em bloco — o <mark> da busca e
 * o eco da ação —, e por isso fica longe da rampa da ação: pálido no claro,
 * escuro no escuro, com o texto do tema em cima (12,30:1 e 11,30:1 na marca).
 * Sem ele na receita, clicar em "Calcular mensalidade" no SigFin piscava rosa
 * da marca dentro de um sistema verde. */

/* O TETO é o fim da escada, e ele é baixo (12 no claro) por um motivo que só
 * apareceu quando o portão passou a comparar estado com estado. Com o teto em
 * 20, o sistema que anda para baixo chegava ao piso antes de gastar os três
 * degraus, e ponteiro e pressão eram aparados para a MESMA altura: o botão de
 * pessoas ficava #001B17 nos dois, legível e imóvel. Contraste em pé não
 * pergunta se o estado muda alguma coisa. */

/* A SUPERFÍCIE DE MARCA NÃO É O PREENCHIMENTO DA AÇÃO, e isto custou uma
 * rodada do portão para aparecer. No claro as duas coincidem (#8D293A nas
 * duas, 8,36:1 com branco). No ESCURO não: a ação vira clara e carrega texto
 * quase-preto (#DB6F7A), enquanto surface-brand continua vinho escuro com
 * texto BRANCO (#52151F, 14,13:1). Derivar uma da outra fazia a superfície de
 * marca do escuro sair a 2,06:1 nos cinco sistemas — um bloco de marca com
 * texto ilegível em todo app derivado. Por isso `marca` é degrau próprio, e
 * por isso o portão mede cada papel contra o texto que ELE carrega. */

/* O DEGRAU PRÓPRIO DE UM SISTEMA.
 *
 * A regra é altura única: as subpaletas têm de ser a mesma subpaleta em
 * matizes diferentes, ou o mesmo botão fica quase preto num sistema e médio
 * noutro. PESSOAS é a única exceção, e é a mesma lógica da ADR-026 aplicada
 * entre sistemas em vez de entre papéis: teal (182°) e verde (162°) nascem a
 * vinte graus um do outro, e vinte graus não separam nada — à mesma altura e
 * com o croma reduzido, SigFin e RH saem a 0,021 de distância, que é a mesma
 * cor. A matiz não faz o trabalho, então o L faz.
 *
 * Desce no claro e sobe no escuro porque é para onde a janela viável de
 * pessoas abre: no claro o numeral do sucesso (L 47) fecha tudo acima de
 * 36,5; no escuro o filete do sucesso (L 54) fecha tudo abaixo de 74. */
export const DESVIO_L = {
  pessoas: { claro: -8, escuro: +8 },
};

/* O SISTEMA QUE NÃO DERIVA.
 *
 * Atendimento É a matiz da marca: categoria-atendimento e o bordô da ação
 * saem do mesmo lugar, e o token diz por quê — "o atendimento é a cara da
 * instituição, e leva a marca". Derivar uma subpaleta para ele seria inventar
 * um segundo bordô ao lado do primeiro.
 *
 * E não haveria onde pô-lo. No escuro, o filete de erro (L 80) e o numeral de
 * erro (L 66) fecham a janela da família do vinho: a primeira altura que
 * cumpre a regra é L 89, um rosa lavado que já não lê como bordô. A saída não
 * é espremer a marca — é reconhecer que Protocolo e Portal são o mesmo bordô,
 * como o Portal já era por ser o saguão. Dois sistemas sem subpaleta pelo
 * mesmo motivo, e não uma exceção aberta para um deles. */
export const HERDA_MARCA = ['atendimento'];

/* O ANEL DE FOCO não acompanha o preenchimento: ele aparece SOBRE a superfície
 * e responde por 3:1 contra ela, não contra o texto da ação. No claro isso o
 * empurra para baixo do primário; no escuro, para cima. Dois papéis, duas
 * alturas — derivar um do outro é como o anel do SigFin escuro chegou a 3,16:1,
 * a um décimo do piso. */
export const FOCO = { claro: 48, escuro: 72 };

/**
 * A subpaleta de um sistema.
 *
 * @param {string} cor    hex da categoria, no tema pedido
 * @param {'claro'|'escuro'} tema
 * @param {{surface: string}} ctx  superfície sobre a qual o fundo sutil se compõe
 */
export function subpaleta(cor, tema, ctx, sistema) {
  const { C, H } = hexParaOklch(cor);
  const c = C * FATOR_CROMA;
  const d = DEGRAUS[tema];
  /* Hover e pressionado são DESLOCAMENTOS do repouso, não alturas fixas: o
   * sistema que anda (pessoas) tem de levar os seus estados junto, ou o botão
   * clareia para o degrau de outro sistema ao ser tocado. */
  const base = d.default + ((DESVIO_L[sistema] || {})[tema] || 0);
  const limita = (L) => (tema === 'claro' ? Math.max(d.teto, L) : Math.min(d.teto, L));
  const emL = (L) => oklchParaHex(L, c, H).hex;

  return {
    'action-primary-default': emL(base),
    'action-primary-hover': emL(limita(base + d.hover)),
    'action-primary-active': emL(limita(base + d.active)),
    /* O FUNDO SUTIL é tinta sobre a superfície, e não um degrau da rampa:
     * ele fica debaixo de texto de leitura (linha selecionada, item ativo do
     * menu), e um degrau com croma próprio ali roubaria contraste do texto
     * que ele carrega. Mistura com a superfície, como era. */
    'action-primary-subtle': misturaOklab(ctx.surface, emL(base), d.subtle),
    'border-focus': emL(FOCO[tema]),
    /* Degrau próprio — ver a nota em DEGRAUS. Carrega texto BRANCO nos dois
     * temas, e é isso que a separa do preenchimento da ação. */
    'surface-brand': emL(d.marca),
    /* O que a ação ACENDE e o que a busca MARCA — ver a nota em DEGRAUS. */
    'realce-background': emL(d.realce),
    /* A TINTA do sistema, para onde a cor aparece com a família da ação
     * intacta (modo moldura): marquinha e ícone do item ativo. Mesmo degrau
     * do preenchimento — é a mesma cor em outro papel, e dar-lhe altura
     * própria faria a marquinha e o botão brigarem por atenção na mesma
     * faixa. */
    tinta: emL(base),
  };
}

/* A RECEITA ANTIGA (ADR-037 antes de 20/09/2026), preservada para o portão
 * poder dizer o que MELHOROU e não só o que passa. Um portão que só mostra o
 * estado atual não distingue "foi consertado" de "nunca foi medido". */
export function subpaletaAntiga(cor, ctx) {
  return {
    'action-primary-default': misturaOklab(cor, ctx.texto, 0.28),
    'action-primary-hover': misturaOklab(cor, ctx.texto, 0.42),
    'action-primary-active': misturaOklab(cor, ctx.texto, 0.54),
    'action-primary-subtle': misturaOklab(ctx.surface, cor, 0.09),
    'border-focus': cor,
    'surface-brand': misturaOklab(cor, ctx.texto, 0.28),
    tinta: misturaOklab(cor, ctx.texto, 0.28),
  };
}

/* OS MAPAS DE TEMA, lidos da folha de tokens já construída.
 *
 * Mora aqui, e não no portão, porque a FOLHA e o PORTÃO precisam da mesma
 * leitura: build-css.mjs emite o que esta função alimenta, e
 * check-subpaleta.mjs mede o que esta função alimenta. Dois leitores com duas
 * cópias do mesmo recorte é como dois portões passam a discordar sobre a
 * mesma cor — o que tools/lib/wcag.mjs existe para evitar.
 *
 * O recorte é por BLOCO e não pela primeira ocorrência de data-theme="dark":
 * entre o :root claro e o :root[data-theme="dark"] existe um @media
 * prefers-color-scheme que também carrega o escuro, e cortar no primeiro
 * casamento leva o @media junto — o mapa "claro" sai com valores do escuro. */
export function mapasDeTema(tokensCss) {
  const NL = String.fromCharCode(10);
  const blocoDe = (marca) => {
    const i = tokensCss.indexOf(marca);
    if (i < 0) return '';
    const ini = tokensCss.indexOf('{', i);
    return tokensCss.slice(ini, tokensCss.indexOf(NL + '}', ini));
  };
  const leVars = (txt) =>
    Object.fromEntries([...txt.matchAll(/--(ucam-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const claro = leVars(blocoDe(NL + ':root {'));
  const escuro = { ...claro, ...leVars(blocoDe(':root[data-theme="dark"] {')) };
  const resolve = (v, mapa, n = 0) => {
    if (n > 10 || !v) return v;
    const m = String(v).match(/^var\(--([a-z0-9-]+)\)$/);
    return m ? resolve(mapa[m[1]], mapa, n + 1) : String(v).trim();
  };
  return { claro, escuro, resolve };
}

/* O BLOCO DA FOLHA.
 *
 * Gerado, e não escrito à mão, porque é o único jeito de a folha e o portão
 * não discordarem. O custo aparece aqui e é justo nomeá-lo: a receita antiga
 * cabia num bloco só porque `color-mix` com text-primary virava sozinha no
 * tema escuro. Com valor literal isso acaba, e cada sistema precisa das três
 * condições que a folha de tokens já usa — claro, escuro por preferência do
 * sistema, escuro por escolha explícita.
 *
 * O que NÃO precisa de valor literal fica em var(): a cor da categoria já
 * troca por tema no token, e o fundo tinto da faixa é uma mistura de 10% que
 * não responde por contraste nenhum. Duplicar o que não precisa seria triplicar
 * a folha sem comprar medida. */
export function cssDaSubpaleta(tokensCss) {
  const { claro, escuro, resolve } = mapasDeTema(tokensCss);
  const derivados = SISTEMAS.filter((s) => !HERDA_MARCA.includes(s));
  const NL = String.fromCharCode(10);

  const paraTema = (mapa, tema) => {
    const tok = (n) => String(resolve(`var(--ucam-${n})`, mapa) || '').toUpperCase();
    const ctx = { surface: tok('color-surface-default'), texto: tok('color-text-primary') };
    return Object.fromEntries(derivados.map((s) => [s, subpaleta(tok(`color-categoria-${s}`), tema, ctx, s)]));
  };
  const porTema = { claro: paraTema(claro, 'claro'), escuro: paraTema(escuro, 'escuro') };

  /* A família da AÇÃO só troca no modo cheio: `?paleta=moldura` é o meio termo
   * do teste — cor do sistema na moldura, bordô no que se clica. */
  const cheio = (sel) => `:root:not([data-paleta="comum"]):not([data-paleta="moldura"])${sel}`;
  const qualquer = (sel) => `:root:not([data-paleta="comum"])${sel}`;

  const declara = (p, cheia) =>
    (cheia
      ? [
          ['--ucam-color-action-primary-default', p['action-primary-default']],
          ['--ucam-color-action-primary-hover', p['action-primary-hover']],
          ['--ucam-color-action-primary-active', p['action-primary-active']],
          ['--ucam-color-action-primary-subtle', p['action-primary-subtle']],
          ['--ucam-color-border-focus', p['border-focus']],
          ['--ucam-color-surface-brand', p['surface-brand']],
          ['--ucam-color-realce-background', p['realce-background']],
        ]
      : [['--ucam-sistema-tinta', p.tinta]]
    ).map(([k, v]) => `  ${k}: ${v};`).join(NL);

  /* As três condições, na mesma ordem da folha de tokens. `light` explícito
   * vence a preferência do sistema, e por isso o @media traz o :not. */
  const condicoes = [
    ['claro', (sel) => sel, false],
    ['escuro', (sel) => sel.replace(':root', ':root:not([data-theme="light"])'), true],
    ['escuro', (sel) => sel.replace(':root', ':root[data-theme="dark"]'), false],
  ];

  const partes = [];
  for (const [tema, ajusta, dentroDeMedia] of condicoes) {
    const regras = [];
    for (const s of derivados) {
      const p = porTema[tema][s];
      const alvo = ` .ucam-shell[data-sistema="${s}"]`;
      regras.push(`${ajusta(qualquer(alvo))} {${NL}${declara(p, false)}${NL}}`);
      regras.push(`${ajusta(cheio(alvo))} {${NL}${declara(p, true)}${NL}}`);
    }
    const corpo = regras.join(NL + NL);
    partes.push(
      dentroDeMedia
        ? `@media (prefers-color-scheme: dark) {${NL}${corpo.replace(/^/gm, '  ')}${NL}}`
        : corpo,
    );
  }
  return partes.join(NL + NL);
}

/* O QUE A SUBPALETA NÃO PODE TOCAR.
 *
 * "As cores semânticas são as mesmas para todos os apps" (20/09/2026). Esta
 * lista é essa frase em forma de teste: o portão falha se o bloco de qualquer
 * sistema redefinir um destes prefixos. Sem ela, a regra é um parágrafo — e a
 * auditoria de setembro mostrou o que acontece com regulamento sem portão.
 *
 * O DISABLED está aqui e merece nota: action.disabled.background e
 * action.disabled.text são neutros, não saem do primário, e por isso a
 * subpaleta nunca os tocou. A entrada na lista não conserta nada hoje — ela
 * impede que uma futura "subpaleta mais completa" os puxe para dentro. Um
 * disabled tinto pela categoria teria de reprovar o contraste de 3,71:1 que a
 * spec declara e aceita como desvio nomeado, seis vezes, em dois temas. */
export const INTOCAVEIS = [
  'color-feedback-',
  'color-action-disabled-',
  'color-action-danger-',
  'color-text-link',
  'color-text-disabled',
  'color-text-placeholder',
  'color-chart-series-',
  'color-categoria-',
];
