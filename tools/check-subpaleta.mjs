// A subpaleta de cada sistema continua legível, e continua sendo OUTRA cor que
// o tom semântico ao lado dela?
//
// A ADR-037 pôs a cor da categoria na família da AÇÃO e escreveu o risco na
// própria lista de consequências: "no SigFin o primário é verde e o sucesso
// também — número de destaque e botão primário passam a ler como 'deu certo'.
// Em Relatórios o primário azul encosta na informação e no link."
//
// Escrito, e nada medindo. Este arquivo mede — e o que ele encontrou no
// primeiro dia é pior do que a prosa dizia: `color-categoria-financeiro` e
// `color-feedback-success-border` são o MESMO hex (#17825A);
// `color-categoria-academico` e `color-feedback-info-border` também (#1A6FC4).
// O primário do SigFin não "encostava" no verde de sucesso: partia dele.
//
// COMO A SEPARAÇÃO É MEDIDA, e por que não é a régua do portão de daltonismo.
// A primeira versão exigia distância 0,10 de todo tom semântico sob as três
// dicromacias, que é o limiar da ADR-016. Rodada contra o BORDÔ DE HOJE, sem
// subpaleta nenhuma, ela reprovou cinco dos oito tons no escuro. Uma régua que
// reprova o sistema que já está no ar não mede a subpaleta: mede a si mesma, e
// portão que grita sem causa é portão que se aprende a ignorar — a mesma razão
// pela qual o portão da marca casa por estado em vez de todos contra todos.
//
// A régua certa é o mecanismo que a ADR-026 já tinha achado: quando duas cores
// estão na MESMA FAMÍLIA DE MATIZ, a matiz não separa — sob protanopia e
// deuteranopia o arco colapsa num eixo — e o que separa é o degrau de
// LIGHTNESS. Então são duas perguntas, não uma:
//
//   família (Δmatiz ≤ 40°) → dez pontos de L, o número da ADR-026
//   qualquer par           → 0,10 de distância à VISTA COMUM, que é o piso
//                            abaixo do qual as duas são a mesma cor para todo
//                            mundo (e é onde #17825A × #17825A caía: 0,000)
//
// Entre DOIS SISTEMAS o piso é outro e mais baixo — ver LIMITE_ENTRE_SISTEMAS.
//
// Três coisas, porque são três jeitos diferentes de a subpaleta falhar:
//
//   1. LEGIBILIDADE — o texto sobre a ação, o anel de foco sobre a superfície
//      e o texto sobre o fundo sutil, estado por estado, nos dois temas. É o
//      pedido de 20/09/2026: "tenha atenção no contraste. Em especial nos
//      disabled e estados dos componentes".
//   2. SEPARAÇÃO — a ação de cada sistema contra os tons semânticos, e as
//      subpaletas entre si, que é o que o pedido "menos saturadas" arrisca.
//   3. VAZAMENTO — nenhum sistema redefine feedback, link, disabled ou série.
//      "As cores semânticas são as mesmas para todos os apps", em forma de
//      teste em vez de parágrafo.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { contrast } from './lib/wcag.mjs';
import { hexParaOklch } from './lib/color.mjs';
import { simula, distancia } from './check-daltonismo.mjs';
import { SISTEMAS, HERDA_MARCA, INTOCAVEIS, subpaleta, subpaletaAntiga, FATOR_CROMA, DEGRAUS, DESVIO_L } from './lib/subpaleta.mjs';

const LIMITE_VISTA_COMUM = 0.10;
/* ENTRE SISTEMAS o piso é outro, e mais baixo, porque a pergunta é outra.
 *
 * Ação e tom semântico DIVIDEM UMA TELA: o botão de salvar e o numeral verde
 * do indicador estão à vista ao mesmo tempo, e por isso respondem pelo limiar
 * de vizinhança. Dois sistemas nunca dividem tela nenhuma — a pessoa está num
 * sistema de cada vez, e o reconhecimento é de memória, não de comparação.
 *
 * 0,06 é o LIMITE_COEXISTE que a ADR-016 já usa para o par que aparece junto
 * sem ser vizinho. Nenhum número novo. Exigir 0,10 aqui foi tentado e o preço
 * apareceu na hora: para separar cinco matizes à mesma altura o otimizador
 * espalhava o L de 20 a 56, e o mesmo botão saía quase preto no RH e violeta
 * médio no Gerencial. Coerência entre os sistemas vale mais do que uma
 * distância que ninguém está em posição de medir a olho. */
const LIMITE_ENTRE_SISTEMAS = 0.06;
const FAMILIA = 40;   // graus de matiz OKLCH dentro dos quais a matiz não separa
const DELTA_L = 10;   // ADR-026, importado como número e como razão
const TIPOS = ['normal', 'deuteranopia', 'protanopia', 'tritanopia'];
const ver = (hex, tipo) => (tipo === 'normal' ? hex : simula(hex, tipo));
/* Distância de matiz no círculo. Sem o fechamento em 360 o par 350° × 10°
 * sairia como 340 graus de diferença — duas cores da mesma família lidas como
 * opostas, que é exatamente o caso do vinho contra o vermelho. */
const dMatiz = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/* OS TONS SEMÂNTICOS QUE COEXISTEM COM A AÇÃO NA MESMA TELA.
 *
 * Só as TINTAS — o filete, o ícone e o numeral do feedback, mais o link. O
 * fundo pálido do feedback e o texto escuro dele ficam de fora de propósito:
 * comparar o preenchimento de um botão com o fundo de um alerta produz falha
 * que ninguém pode consertar. O NUMERAL é o que mais aperta a receita, e é
 * também o que a ADR-037 nomeou — "número de destaque e botão primário passam
 * a ler como deu certo". Tirá-lo da lista seria tirar o motivo do portão. */
const SEMANTICOS = [
  ['sucesso (filete e ícone)', 'color-feedback-success-border'],
  ['sucesso (numeral)', 'color-feedback-success-numeral'],
  ['aviso (filete e ícone)', 'color-feedback-warning-border'],
  ['aviso (numeral)', 'color-feedback-warning-numeral'],
  ['erro (filete e ícone)', 'color-feedback-danger-border'],
  ['erro (numeral)', 'color-feedback-danger-numeral'],
  ['informação (filete e ícone)', 'color-feedback-info-border'],
  ['link', 'color-text-link'],
];

/* OS ESTADOS QUE A SUBPALETA TROCA, e contra o que cada um responde.
 *
 * `piso` é o da WCAG 1.4.3 para texto, ou o da 1.4.11 para o que é só forma —
 * o anel de foco. `contra` diz qual token é o par: medir o preenchimento
 * contra o branco quando o texto por cima é escuro é o erro que a nota do
 * action.disabled.text existe para evitar ("a referência é sempre a superfície
 * do próprio botão, nunca o branco"). */
const ESTADOS = [
  ['preenchimento em repouso', 'action-primary-default', 'color-text-on-action', 4.5],
  ['preenchimento sob o ponteiro', 'action-primary-hover', 'color-text-on-action', 4.5],
  ['preenchimento sob pressão', 'action-primary-active', 'color-text-on-action', 4.5],
  ['superfície de marca', 'surface-brand', 'color-text-on-brand', 4.5],
  ['anel de foco', 'border-focus', 'color-surface-default', 3],
  ['fundo sutil', 'action-primary-subtle', 'color-text-primary', 4.5],
];

/* O DISABLED, que a subpaleta NÃO troca e que o pedido mandou vigiar.
 *
 * action.disabled.* e text.disabled são neutros: não saem do primário, e por
 * isso nenhum sistema os move. A conferência aqui não é "o disabled do app X
 * está legível" — é que ele continua sendo O MESMO em todo app, com o desvio
 * de contraste que a spec já nomeia (3,71:1 no claro, 2,99:1 no escuro,
 * isento da 1.4.3 por ser componente inativo). Um disabled tinto pela
 * categoria teria de reprovar esse desvio cinco vezes em dois temas; a lista
 * INTOCAVEIS existe para que ninguém tente. */
const DISABLED = [
  ['rótulo do botão inativo', 'color-action-disabled-text', 'color-action-disabled-background'],
  ['texto de controle inativo', 'color-text-disabled', 'color-surface-default'],
];

function principal() {
const NL = String.fromCharCode(10);
const tokens = readFileSync('dist/tokens/ucam-tokens.css', 'utf8');
/* O mesmo recorte por BLOCO do portão de daltonismo, e pelo mesmo motivo:
 * entre o :root claro e o :root[data-theme="dark"] existe um @media
 * prefers-color-scheme que também carrega o escuro, e cortar na primeira
 * ocorrência traz o @media junto — o mapa "claro" sai com valores do escuro. */
const blocoDe = (marca) => {
  const i = tokens.indexOf(marca);
  if (i < 0) return '';
  const ini = tokens.indexOf('{', i);
  return tokens.slice(ini, tokens.indexOf(NL + '}', ini));
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

const falhas = [];
const desvios = [];
const relatos = [];
const hex6 = (s) => /^#[0-9A-F]{6}$/.test(s);

/* A conta da separação, uma só, usada tanto para os sistemas quanto para o
 * bordô da marca. Escrita uma vez porque o bordô é a RÉGUA: o que ele já faz é
 * o que o parque já aceita, e um sistema derivado não pode fazer pior. */
function separacao(cor, alvo) {
  const a = hexParaOklch(cor);
  const b = hexParaOklch(alvo);
  const mesmaFamilia = dMatiz(a.H, b.H) <= FAMILIA;
  const dL = Math.abs(a.L - b.L);
  const dVista = distancia(cor, alvo);
  const quebras = [];
  if (dVista < LIMITE_VISTA_COMUM) quebras.push(`distância à vista comum ${dVista.toFixed(3)} < ${LIMITE_VISTA_COMUM}`);
  if (mesmaFamilia && dL < DELTA_L) quebras.push(`mesma família de matiz (Δ${dMatiz(a.H, b.H).toFixed(0)}°) e só ΔL ${dL.toFixed(1)} < ${DELTA_L}`);
  return { quebras, dL, dVista, mesmaFamilia };
}

for (const [tema, mapa] of [['claro', claro], ['escuro', escuro]]) {
  const tok = (n) => String(resolve(`var(--ucam-${n})`, mapa) || '').toUpperCase();
  const ctx = { surface: tok('color-surface-default'), texto: tok('color-text-primary') };
  const marcas = SEMANTICOS.map(([n, k]) => [n, tok(k)]).filter(([, h]) => hex6(h));

  /* A RÉGUA: o bordô que o parque já usa, medido com as mesmas duas regras.
   * O que ele quebra é desvio herdado, não falha desta entrega — consertá-lo
   * seria mexer na ação da marca inteira, e isso é decisão, não conserto. */
  const bordo = tok('color-action-primary-default');
  for (const [nome, alvo] of marcas) {
    const { quebras } = separacao(bordo, alvo);
    for (const q of quebras) desvios.push(`[${tema}] HERDADO — bordô da marca ${bordo} × ${nome} ${alvo}: ${q}`);
  }

  const paletas = {};
  for (const s of SISTEMAS) {
    if (HERDA_MARCA.includes(s)) continue;
    const cor = tok(`color-categoria-${s}`);
    if (!hex6(cor)) {
      falhas.push(`[${tema}] color-categoria-${s} ausente ou ilegível: ${cor}`);
      continue;
    }
    paletas[s] = subpaleta(cor, tema, ctx, s);
  }

  /* 1. LEGIBILIDADE, estado por estado. */
  for (const s of Object.keys(paletas)) {
    for (const [nome, papel, contraTok, piso] of ESTADOS) {
      const cor = paletas[s][papel];
      const contra = tok(contraTok);
      if (!hex6(contra)) continue;
      const r = contrast(cor, contra);
      const linha = `[${tema}] ${s}: ${nome} ${cor} × ${contra} = ${r.toFixed(2)}:1 (piso ${piso})`;
      if (r < piso) falhas.push(linha);
      else relatos.push(linha);
    }
  }

  /* 1a-bis. OS ESTADOS TÊM DE SER TRÊS COISAS DIFERENTES.
   *
   * Contraste em pé não basta: repouso, ponteiro e pressão podem estar todos
   * legíveis e serem a MESMA cor, e aí o botão não responde ao toque. Foi o
   * que aconteceu na primeira rodada — pessoas, no claro, saiu com hover e
   * pressionado em #001B17 os dois, porque a escada bateu no piso da receita
   * e os dois degraus foram aparados para a mesma altura. O portão media seis
   * contrastes daquele sistema e aprovava todos.
   *
   * Três pontos de L é pouco de propósito: a pergunta não é "dá para nomear a
   * diferença", é "existe diferença". Estado que não muda nada é o defeito. */
  for (const s of Object.keys(paletas)) {
    const escada = [
      ['repouso', paletas[s]['action-primary-default']],
      ['ponteiro', paletas[s]['action-primary-hover']],
      ['pressão', paletas[s]['action-primary-active']],
    ];
    for (let k = 0; k + 1 < escada.length; k++) {
      const [na, a] = escada[k];
      const [nb, b] = escada[k + 1];
      const dL = Math.abs(hexParaOklch(a).L - hexParaOklch(b).L);
      const linha = `[${tema}] ${s}: ${na} ${a} → ${nb} ${b}, ΔL ${dL.toFixed(1)} (piso 3)`;
      if (a === b) falhas.push(`[${tema}] ${s}: ${na} e ${nb} são a MESMA cor (${a}) — o botão não responde ao toque`);
      else if (dL < 3) falhas.push(linha);
      else relatos.push(linha);
    }
  }

  /* 1b. O DISABLED, que ninguém troca. */
  for (const [nome, frente, fundo] of DISABLED) {
    const a = tok(frente);
    const b = tok(fundo);
    if (!hex6(a) || !hex6(b)) continue;
    relatos.push(`[${tema}] TODO APP: ${nome} ${a} × ${b} = ${contrast(a, b).toFixed(2)}:1 (desvio nomeado na spec, componente inativo)`);
  }

  /* 2a. SEPARAÇÃO da ação contra os tons semânticos.
   *
   * Só o preenchimento em repouso entra, e a tinta do sistema com ele por ser
   * o mesmo degrau: hover e pressionado só existem sob o ponteiro, e um alerta
   * de sucesso não muda de cor porque o dedo está em cima do botão. Casar o
   * que não coexiste é como se inventa falha inconsertável. */
  for (const s of Object.keys(paletas)) {
    const cor = paletas[s]['action-primary-default'];
    for (const [nome, alvo] of marcas) {
      const { quebras, dL, dVista, mesmaFamilia } = separacao(cor, alvo);
      for (const q of quebras) falhas.push(`[${tema}] ${s}: ação ${cor} × ${nome} ${alvo}: ${q}`);
      if (!quebras.length && mesmaFamilia) {
        relatos.push(`[${tema}] ${s}: ação × ${nome} — mesma família, separada por ΔL ${dL.toFixed(1)} (vista comum ${dVista.toFixed(3)})`);
      }
    }
  }

  /* 2b. SEPARAÇÃO das subpaletas ENTRE SI.
   *
   * É o portão que o pedido "cores menos saturadas" arrisca: dessaturar
   * aproxima tudo do cinza, e no cinza as subpaletas viram uma só — some a
   * única coisa que dizia em que sistema a pessoa está. Sem esta conta o
   * FATOR_CROMA seria um gosto; com ela, tem piso.
   *
   * Aqui todas ficam na MESMA lightness de propósito, então a matiz é a única
   * coisa que as separa e a conta é a distância à vista comum. Sob dicromacia
   * elas encostam, e isso é desvio nomeado e não falha: o que diz em que
   * sistema a pessoa está é o NOME escrito na faixa e o desenho do ícone — a
   * mesma saída que a ADR-032 deu para os seis ladrilhos do Portal. */
  const nomes = Object.keys(paletas);
  for (let i = 0; i < nomes.length; i++) {
    for (let j = i + 1; j < nomes.length; j++) {
      const a = paletas[nomes[i]]['action-primary-default'];
      const b = paletas[nomes[j]]['action-primary-default'];
      const d = distancia(a, b);
      const linha = `[${tema}] ${nomes[i]} × ${nomes[j]}: ação ${a} × ${b} = ${d.toFixed(3)} à vista comum (piso ${LIMITE_ENTRE_SISTEMAS})`;
      if (d < LIMITE_ENTRE_SISTEMAS) falhas.push(linha);
      else relatos.push(linha);
      let pior = Infinity;
      let piorTipo = '';
      for (const tipo of TIPOS.slice(1)) {
        const dd = distancia(ver(a, tipo), ver(b, tipo));
        if (dd < pior) { pior = dd; piorTipo = tipo; }
      }
      if (pior < LIMITE_ENTRE_SISTEMAS) {
        desvios.push(`[${tema}] ${nomes[i]} × ${nomes[j]}: ${pior.toFixed(3)} sob ${piorTipo} — separados pelo nome e pelo ícone, não pela cor`);
      }
    }
  }
}

/* 3. VAZAMENTO. A folha construída é a testemunha: se um bloco de sistema
 * declara um token intocável, a regra "as semânticas são as mesmas para todos
 * os apps" já está quebrada na entrega, por mais que a prosa diga o contrário.
 *
 * A varredura é por DECLARAÇÃO dentro de regra que menciona [data-sistema], e
 * não pelo arquivo inteiro: o :root declara todos os intocáveis, e é para isso
 * que ele existe. */
let css = '';
try {
  css = readFileSync('dist/css/ucam.css', 'utf8');
} catch {
  desvios.push('dist/css/ucam.css ausente — o vazamento não foi conferido. Rode `pnpm run css` antes.');
}
if (css) {
  for (const m of css.matchAll(/([^{}]*\[data-sistema[^{}]*)\{([^}]*)\}/g)) {
    const seletor = m[1].replace(/\s+/g, ' ').trim();
    for (const d of m[2].matchAll(/--(ucam-[a-z0-9-]+)\s*:/g)) {
      const nome = d[1].replace(/^ucam-/, '');
      const furo = INTOCAVEIS.find((p) => nome.startsWith(p));
      if (furo) falhas.push(`VAZAMENTO: ${seletor} redefine --ucam-${nome} (prefixo intocável "${furo}")`);
    }
  }
}

/* O QUE MELHOROU. Um portão que só mostra o estado atual não distingue "foi
 * consertado" de "nunca foi medido" — e esta lista é o registro de que a
 * receita nova não é preferência, é conserto. */
const consertos = [];
for (const [tema, mapa] of [['claro', claro], ['escuro', escuro]]) {
  const tok = (n) => String(resolve(`var(--ucam-${n})`, mapa) || '').toUpperCase();
  const ctx = { surface: tok('color-surface-default'), texto: tok('color-text-primary') };
  for (const s of SISTEMAS) {
    if (HERDA_MARCA.includes(s)) continue;
    const cor = tok(`color-categoria-${s}`);
    if (!hex6(cor)) continue;
    const velha = subpaletaAntiga(cor, ctx)['action-primary-default'];
    const nova = subpaleta(cor, tema, ctx, s)['action-primary-default'];
    for (const [nome, chave] of SEMANTICOS) {
      const alvo = tok(chave);
      if (!hex6(alvo)) continue;
      const antes = separacao(velha, alvo);
      const depois = separacao(nova, alvo);
      if (antes.quebras.length && !depois.quebras.length) {
        consertos.push(`[${tema}] ${s} × ${nome}: ${antes.quebras[0]} → ΔL ${depois.dL.toFixed(1)}, vista comum ${depois.dVista.toFixed(3)}`);
      }
    }
  }
}

const log = (...a) => process.stdout.write(a.join(' ') + NL);
const derivados = SISTEMAS.filter((s) => !HERDA_MARCA.includes(s));
log(`Subpaleta do sistema — ${derivados.length} sistemas derivados, ${HERDA_MARCA.length} no bordô da marca (${HERDA_MARCA.join(', ')}), 2 temas.`);
log(`Croma a ${(FATOR_CROMA * 100).toFixed(0)}% da categoria; ação em L ${DEGRAUS.claro.default} no claro e L ${DEGRAUS.escuro.default} no escuro.`);
for (const [s, d] of Object.entries(DESVIO_L)) {
  log(`  ${s} anda ${d.claro > 0 ? '+' : ''}${d.claro} no claro e ${d.escuro > 0 ? '+' : ''}${d.escuro} no escuro — a matiz dele não o separa do vizinho.`);
}
if (consertos.length) {
  log(NL + `Colisões que a receita antiga tinha e esta não tem (${consertos.length}):`);
  for (const l of consertos) log('  ✓ ' + l);
}
if (desvios.length) {
  log(NL + `Desvios nomeados (${desvios.length}) — medidos, aceitos, não são falha desta entrega:`);
  for (const d of desvios) log('  · ' + d);
}
log(NL + `${relatos.length} medidas no piso ou acima.`);
if (falhas.length) {
  log(NL + `FALHAS (${falhas.length}):`);
  for (const f of falhas) log('  ✗ ' + f);
  process.exitCode = 1;
} else {
  log(NL + 'OK — nenhum sistema colide com um tom semântico, nenhum par de sistemas colide, nenhuma semântica vazou.');
}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) principal();
