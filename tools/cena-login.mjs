#!/usr/bin/env node
/* ------------------------------------------------------------------------
 * A CENA DO LOGIN E A CAPA DO SITE, em isométrica calculada.
 *
 * Desde 29/10/2026 o login é a pilha de cartões de tools/cena-pilha.mjs (no
 * estilo da skill Hairline), e a Praça XV descrita abaixo saiu do código;
 * este arquivo segue gravando o login nas telas (--aplicar) e desenhando a
 * capa do site (montarCapa, --capa). A história da praça fica para quem
 * quiser saber de onde vieram a malha, a ordem de pintura e a paleta a traço.
 *
 * Pedido de 10/10/2026, com cinco referências (as ilustrações do Chase, um
 * estádio e uma rua em azul, peças empilhadas em traço fino): "melhore essas
 * ilustrações". A cena anterior era a da capa do site — uma placa com peças
 * de interface deitadas, em faces translúcidas — e sobre o bordô lia apagada.
 * O que as referências têm e ela não tinha:
 *
 *   1. UM traço firme e faces OPACAS: o que está na frente cobre o que está
 *      atrás;
 *   2. volume por tons chapados e SOMBRA PROJETADA no chão;
 *   3. um lugar, com coisas de lugar: prédios com janelas, árvores, gente.
 *
 * Segunda rodada, no mesmo dia: "melhore nas cores, na variação tonal,
 * texturas no fundo; queremos que pareça a Universidade Candido Mendes". O
 * campus genérico da primeira prova virou o lugar da marca:
 *
 *   - o CHAFARIZ do Mestre Valentim, que é o desenho do logotipo: degraus,
 *     corpo, cornija, pirâmide e esfera, na tinta mais clara da cena;
 *   - o casarão colonial (o Convento do Carmo): parede caiada, janelas em
 *     arco, telhado de quatro águas com a telha riscada;
 *   - a TORRE de vidro escuro atrás dele, a peça mais alta e a mais escura;
 *   - o cais, a água e a barca.
 *
 * Terceira rodada, 13/10/2026: sobre a praça flutuam dez peças do que o
 * acesso abre (grade de sistemas, carteirinha, prova, aprovado, capelo,
 * calendário, protocolo, livros, gráfico, boleto); a gente da praça saiu; a
 * cena encolheu dentro do viewBox; e a pintura virou traço sobre papel (a
 * tabela de tons está em tools/build-css.mjs).
 *
 * A variação tonal sai de três MATERIAIS em vez de um: cal (quase branco,
 * traço bordô), vidro (mais escuro que o fundo, traço claro) e o concreto do
 * anexo (os tons médios). Textura: malha isométrica e um clarão atrás da
 * cena, calçamento riscado na praça, pontilhado no gramado, onda na água.
 *
 * Projeção isométrica de 30°: (x, y, z) vira ((x − y)·cos30, (x + y)·sen30 − z).
 * x desce para a direita de quem olha, y para a esquerda. A ordem de pintura
 * não é escrita à mão: cada sólido declara a caixa que ocupa e a cena é
 * ordenada pela relação "A está atrás de B" (A termina antes de B começar em
 * x, em y ou em z).
 *
 * Uso:
 *   node tools/cena-login.mjs               imprime o SVG
 *   node tools/cena-login.mjs --aplicar     troca a cena em spec/templates.json
 *   node tools/cena-login.mjs --capa        grava a cena da capa do site (roda em 'pnpm run telas')
 *   node tools/cena-login.mjs --previa a.html [--escuro]   página solta
 * --------------------------------------------------------------------- */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { cenaPilha } from './cena-pilha.mjs';

const COS = 0.8660254;
const SEN = 0.5;
const OX = 404;
const OY = 152;
/* A sombra de um ponto a altura h cai em (x + h·SX, y + h·SY): para a direita
 * de quem olha, um pouco para a frente. */
const SX = 0.4;
const SY = -0.14;

const n = (v) => String(+v.toFixed(1));
const P = (x, y, z = 0) => [(x - y) * COS + OX, (x + y) * SEN - z + OY];
const d3 = (pts) => pts.map((p, i) => (i ? 'L' : 'M') + P(...p).map(n).join(' ')).join('') + 'Z';
const linhas3 = (segs) => segs.map(([a, b]) => 'M' + P(...a).map(n).join(' ') + 'L' + P(...b).map(n).join(' ')).join('');

/* Casco convexo no plano do chão (cadeia monótona). */
function casco(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cruz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const meia = (lista) => {
    const h = [];
    for (const q of lista) {
      while (h.length >= 2 && cruz(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop();
      h.push(q);
    }
    h.pop();
    return h;
  };
  return [...meia(p), ...meia(p.reverse())];
}

const chao = [];
const sombras = [];
const solidos = [];
/* O que se mexe sai da ordenação e é pintado por último, cada um no seu <g>:
 * as peças que flutuam (pc) e a barca. Nada da cena fica na frente deles. */
const grupos = [];
function emGrupo(nome, f) {
  const i = solidos.length;
  const r = f();
  grupos.push({ nome, solidos: solidos.splice(i) });
  return r;
}

const sombraDe = (pts, h) => sombras.push({ d: d3(casco([...pts, ...pts.map(([x, y]) => [x + h * SX, y + h * SY])]).map(([x, y]) => [x, y, 0])), c: 'sh' });

/* Decalques nas faces: a da esquerda de quem olha (plano y) e a da direita (plano x). */
const esq = (Y, x1, x2, z1, z2, c) => ({ d: d3([[x1, Y, z1], [x2, Y, z1], [x2, Y, z2], [x1, Y, z2]]), c });
const dir = (X, y1, y2, z1, z2, c) => ({ d: d3([[X, y1, z1], [X, y2, z1], [X, y2, z2], [X, y1, z2]]), c });
const topo = (z, x, y, w, d, c) => ({ d: d3([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]]), c });

function caixa(x, y, z, w, d, h, o = {}) {
  const t = z + h;
  const s = {
    bb: [x, x + w, y, y + d, z, t],
    it: [esq(y + d, x, x + w, z, t, o.e ?? 'm'), dir(x + w, y, y + d, z, t, o.d ?? 's'), topo(t, x, y, w, d, o.t ?? 'l')],
  };
  if (z === 0 && o.sombra !== false) sombraDe([[x, y], [x + w, y], [x + w, y + d], [x, y + d]], h);
  solidos.push(s);
  return s;
}
/* ---------------------------------------------------------------------
 * A CENA DA CAPA DO SITE: só telas (15/10/2026: "na tela inicial do site
 * UCAMDS deixe a ilustra só das interfaces, de telas"). A capa é a porta do
 * design system, e o que ele entrega são interfaces: a janela de um sistema
 * com navegação, indicadores e tabela; a entrada; um celular; um gráfico; um
 * calendário; um formulário com interruptor; um aviso; uma carteirinha. São
 * painéis de pé, todos voltados para o mesmo lado, empilhados em
 * profundidade (quem tem y maior está mais perto e é pintado depois), cada
 * um com uma sombra chapada no chão, sobre a malha.
 * --------------------------------------------------------------------- */
function montarCapa() {
  const KA = { e: 'k1', d: 'k2', t: 'k0', sombra: false };
  const piso = (x, y, w, d) => d3([[x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0]]);
  /* Um painel é posto pelo canto de cima à esquerda NA TELA e pela altura em
   * que voa sobre o chão: daí saem o x e o y do mundo, e a sombra cai logo
   * abaixo dele. O conteúdo é medido a partir do canto de baixo à esquerda da
   * face. Os painéis são pintados do fundo para a frente (y crescente), seja
   * qual for a ordem em que aparecem aqui. */
  const paineis = [];
  const painel = (sx, sy, w, h, alt) => {
    const dif = (sx - OX) / COS;
    const soma = 2 * (sy + h + alt - OY);
    const p = { x: (soma + dif) / 2, Y: (soma - dif) / 2, z: alt, w, h, itens: [] };
    paineis.push(p);
    const { x, Y, z } = p;
    const f = (u1, u2, v1, v2, c) => p.itens.push(esq(Y, x + u1, x + u2, z + v1, z + v2, c));
    const contorno = (u1, u2, v1, v2) => p.itens.push({ d: d3([[x + u1, Y, z + v1], [x + u2, Y, z + v1], [x + u2, Y, z + v2], [x + u1, Y, z + v2]]), c: 'fi' });
    const risco = (pts, c = 'fi') => p.itens.push({ d: linhas3(pts.slice(1).map((q, i) => [[x + pts[i][0], Y, z + pts[i][1]], [x + q[0], Y, z + q[1]]])), c });
    return { f, contorno, risco };
  };

  // A janela de um sistema: faixa, navegação, três indicadores e a tabela.
  const jan = painel(330, 70, 330, 214, 40);
  jan.f(0, 330, 198, 214, 'kc');
  [8, 16, 24].forEach((u) => jan.f(u, u + 4, 204, 208, 'kd'));
  jan.f(0, 70, 0, 198, 'kc');
  [178, 162, 146, 130, 114].forEach((v, i) => jan.f(10, i === 0 ? 58 : 46, v, v + 6, i === 1 ? 'kd' : 'k0'));
  jan.f(84, 170, 178, 186, 'kd');
  [84, 166, 248].forEach((u, i) => { jan.contorno(u, u + 72, 128, 166); jan.f(u + 8, u + 30, 154, 158, 'kc'); jan.f(u + 8, u + (i === 1 ? 52 : 42), 136, 146, i === 1 ? 'kd' : 'kc'); });
  jan.f(84, 320, 102, 114, 'kc');
  [80, 58, 36, 14].forEach((v, i) => {
    jan.f(90, 100, v + 4, v + 14, 'kc');
    jan.f(108, 170, v + 10, v + 14, 'kc');
    jan.f(108, 150, v + 3, v + 6, 'kc');
    jan.f(270, 306, v + 5, v + 13, i === 2 ? 'kd' : 'kc');
    jan.risco([[84, v], [320, v]], 'gr');
  });

  // A entrada, à esquerda da janela: marca, dois campos e o botão.
  const ent = painel(196, 150, 112, 136, 30);
  ent.f(14, 50, 112, 120, 'kd');
  ent.f(14, 40, 92, 96, 'kc');
  ent.contorno(14, 98, 74, 86);
  ent.f(14, 34, 64, 67, 'kc');
  ent.contorno(14, 98, 46, 58);
  ent.f(14, 98, 18, 32, 'kd');

  // O celular, atrás à esquerda: barra, lista e a barra de abas.
  const cel = painel(100, 50, 70, 140, 60);
  cel.f(0, 70, 122, 140, 'kc');
  [98, 76, 54, 32].forEach((v, i) => { cel.f(8, 20, v, v + 12, i === 0 ? 'kd' : 'kc'); cel.f(26, 60, v + 6, v + 10, 'kc'); cel.f(26, 48, v, v + 3, 'kc'); });
  cel.f(0, 70, 0, 14, 'kc');
  cel.f(30, 40, 4, 10, 'kd');

  // O calendário, no alto à direita.
  const cal = painel(670, 10, 92, 84, 70);
  cal.f(0, 92, 68, 84, 'kd');
  [52, 38, 24, 10].forEach((v, l) => [8, 28, 48, 68].forEach((u, c) => cal.f(u, u + 14, v, v + 10, l === 2 && c === 1 ? 'kd' : 'kc')));

  // O gráfico, à direita da janela: título, a linha e as barras.
  const gra = painel(690, 160, 176, 116, 40);
  gra.f(12, 70, 98, 104, 'kd');
  gra.risco([[12, 30], [44, 54], [76, 42], [108, 70], [140, 62], [164, 86]], 'kk');
  [[12, 14], [44, 22], [76, 18], [108, 30], [140, 26]].forEach(([u, h]) => gra.f(u, u + 18, 8, 8 + h, 'kc'));

  // O formulário, à frente: dois campos e o interruptor ligado.
  const frm = painel(360, 340, 150, 88, 22);
  frm.f(12, 46, 70, 74, 'kc');
  frm.contorno(12, 138, 50, 62);
  frm.f(12, 40, 36, 39, 'kc');
  frm.contorno(12, 138, 16, 28);
  frm.f(104, 138, 34, 44, 'kd');

  // O aviso, à frente da quina da janela: ícone, duas linhas e o selo.
  const avi = painel(570, 420, 146, 46, 26);
  avi.f(10, 26, 15, 31, 'kd');
  avi.f(34, 100, 27, 31, 'kc');
  avi.f(34, 84, 17, 20, 'kc');
  avi.f(108, 136, 16, 26, 'kc');

  // A carteirinha, embaixo à esquerda.
  const car = painel(80, 310, 96, 60, 22);
  car.f(8, 32, 14, 46, 'kc');
  car.f(40, 86, 40, 45, 'kd');
  car.f(40, 76, 30, 33, 'kc');
  car.f(40, 66, 22, 25, 'kc');
  for (let u = 40; u < 88; u += 4.5) car.f(u, u + (Math.round(u) % 2 ? 2.6 : 1.3), 6, 14, 'kd');

  paineis.sort((a, b) => a.Y - b.Y).forEach((p) => {
    chao.push({ d: piso(p.x + 4, p.Y - 16, p.w, 12), c: 'sh' });
    const s = emGrupo('pc', () => caixa(p.x, p.Y - 6, p.z, p.w, 6, p.h, KA));
    s.it.push(...p.itens);
  });
}

/* A ordem de pintura: A vem antes de B se termina antes de B começar em algum
 * eixo. Seleção repetida do que não tem ninguém obrigado a vir antes. */
function ordenar(lista) {
  const atras = (a, b) => a.bb[1] <= b.bb[0] || a.bb[3] <= b.bb[2] || a.bb[5] <= b.bb[4];
  const resto = [...lista];
  const saida = [];
  while (resto.length) {
    let i = resto.findIndex((b) => !resto.some((a) => a !== b && atras(a, b) && !atras(b, a)));
    if (i < 0) i = resto.reduce((m, s, k) => (s.bb[1] + s.bb[3] < resto[m].bb[1] + resto[m].bb[3] ? k : m), 0);
    saida.push(...resto.splice(i, 1));
  }
  return saida;
}

/* O FUNDO: a malha isométrica na mesma projeção da cena e um clarão atrás
 * dela, os dois esmaecendo para as bordas. O retângulo é maior que o viewBox
 * de propósito: o SVG deixa vazar e quem recorta é o raio do painel. */
const fundo = (id) =>
  `<defs>` +
  `<pattern id='${id}-malha' patternUnits='userSpaceOnUse' width='41.57' height='24'><path d='M0 12L20.78 0L41.57 12L20.78 24Z' class='malha'/></pattern>` +
  `<radialGradient id='${id}-fade' cx='50%' cy='50%' r='50%'><stop offset='0.25' stop-color='#fff'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></radialGradient>` +
  `<radialGradient id='${id}-clarao' cx='50%' cy='50%' r='50%'><stop offset='0' class='clarao-0'/><stop offset='1' class='clarao-1'/></radialGradient>` +
  `<mask id='${id}-mascara'><rect x='-400' y='-420' width='1700' height='1400' fill='url(#${id}-fade)'/></mask>` +
  `</defs>` +
  `<ellipse cx='450' cy='330' rx='640' ry='470' fill='url(#${id}-clarao)' class='fundo'/>` +
  `<rect x='-400' y='-420' width='1700' height='1400' fill='url(#${id}-malha)' mask='url(#${id}-mascara)' class='fundo'/>`;

function caminhos(montador) {
  chao.length = sombras.length = solidos.length = grupos.length = 0;
  montador();
  const itens = [...chao, ...sombras, ...ordenar(solidos).flatMap((s) => s.it)];
  /* Vizinhos da mesma classe sem contorno viram um caminho só: a cena pesa
   * menos e o resultado é o mesmo. */
  const juntos = [];
  for (const it of itens) {
    const u = juntos[juntos.length - 1];
    if (u && u.c === it.c && ['sh', 'vd', 'lz', 'v', 'kc', 'kd'].includes(it.c)) u.d += it.d;
    else juntos.push({ ...it });
  }
  const path = (i) => `<path d='${i.d}' class='${i.c}'/>`;
  let k = 0;
  return `<g class='base'>${juntos.map(path).join('')}</g>` + grupos.map((m) => `<g class='${m.nome}'${m.nome === 'pc' ? ` style='--i:${k++}'` : ''}><g>${m.solidos.flatMap((s) => s.it).map(path).join('')}</g></g>`).join('');
}

/* O login, desde 29/10/2026, é a pilha de cartões de tools/cena-pilha.mjs. */
export const cenaLogin = cenaPilha;

/* A capa do site, sobre o branco: a cena de telas (montarCapa), com a mesma
 * malha. Lá não há painel de raio para recortar o fundo: a cena inteira
 * passa por uma vinheta e se desfaz na página. */
export function cenaCapa() {
  const vinheta =
    `<defs><radialGradient id='cp-vinheta' cx='50%' cy='50%' r='60%'><stop offset='0.74' stop-color='#fff'/><stop offset='0.98' stop-color='#fff' stop-opacity='0'/></radialGradient>` +
    `<mask id='cp-recorte'><rect x='-40' y='-70' width='1000' height='700' fill='url(#cp-vinheta)'/></mask></defs>`;
  return `<svg viewBox='-40 -70 1000 700' aria-hidden='true' focusable='false'>${vinheta}<g mask='url(#cp-recorte)'>${fundo('cp')}${caminhos(montarCapa)}</g></svg>`;
}

const eu = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === eu) {
  const svg = cenaLogin();
  const raiz = resolve(dirname(eu), '..');
  if (process.argv.includes('--aplicar')) {
    const arq = resolve(raiz, 'spec/templates.json');
    const antes = readFileSync(arq, 'utf8');
    let vezes = 0;
    const depois = antes.replace(/<svg class='ucam-login__cena-svg'.*?<\/svg>/g, () => (vezes++, svg));
    if (!vezes) throw new Error('nenhuma cena encontrada em spec/templates.json');
    writeFileSync(arq, depois);
    console.log(`cena do login → spec/templates.json  ${vezes} telas · ${(svg.length / 1024).toFixed(1)} KB cada`);
  } else if (process.argv.includes('--capa')) {
    const arq = resolve(raiz, 'site/src/generated/cena-capa.ts');
    const capa = cenaCapa();
    writeFileSync(arq, ['/* GERADO por tools/cena-login.mjs --capa. Não editar. */', 'export const CENA_CAPA = ' + JSON.stringify(capa) + ';', ''].join(String.fromCharCode(10)));
    console.log(`cena da capa → site/src/generated/cena-capa.ts  ${(capa.length / 1024).toFixed(1)} KB`);
  } else if (process.argv.includes('--previa')) {
    const saida = process.argv[process.argv.indexOf('--previa') + 1];
    const css = readFileSync(resolve(raiz, 'tools/build-css.mjs'), 'utf8').match(/\.ucam-login__cena-svg \{[\s\S]*?(?=\n\.ucam-login__subfrase)/)[0];
    const tema = process.argv.includes('--escuro') ? '#52151F' : '#8D293A';
    writeFileSync(saida, `<!doctype html><meta charset='utf-8'><style>:root{--ucam-color-surface-brand:${tema};--ucam-color-text-on-brand:#fff}body{margin:0;background:var(--ucam-color-surface-brand);overflow:hidden}.ucam-login__cena{inline-size:600px;padding:60px 24px}${css}</style><div class='ucam-login__cena'>${svg}</div>`);
    console.log(`prévia → ${saida}  ${(svg.length / 1024).toFixed(1)} KB`);
  } else {
    process.stdout.write(svg);
  }
}
