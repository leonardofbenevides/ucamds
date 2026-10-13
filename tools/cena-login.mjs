#!/usr/bin/env node
/* ------------------------------------------------------------------------
 * A CENA DO LOGIN: a Candido Mendes na Praça XV, em isométrica calculada.
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

const COS = 0.8660254;
const SEN = 0.5;
const OX = 404;
const OY = 152;
const LARGURA = 900;
const ALTURA = 660;
/* A sombra de um ponto a altura h cai em (x + h·SX, y + h·SY): para a direita
 * de quem olha, um pouco para a frente. */
const SX = 0.4;
const SY = -0.14;

const n = (v) => String(+v.toFixed(1));
const P = (x, y, z = 0) => [(x - y) * COS + OX, (x + y) * SEN - z + OY];
const d3 = (pts) => pts.map((p, i) => (i ? 'L' : 'M') + P(...p).map(n).join(' ')).join('') + 'Z';
const linhas3 = (segs) => segs.map(([a, b]) => 'M' + P(...a).map(n).join(' ') + 'L' + P(...b).map(n).join(' ')).join('');

/* Sorteio com semente: a cena sai igual a cada geração. */
let semente = 7;
const sorte = () => ((semente = (semente * 16807) % 2147483647) - 1) / 2147483646;

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
const circulo = (x, y, r, k = 20) => Array.from({ length: k }, (_, i) => [x + r * Math.cos((i / k) * 2 * Math.PI), y + r * Math.sin((i / k) * 2 * Math.PI)]);
/* Um círculo do chão vira elipse de eixos retos na projeção. */
function elipse(x, y, z, r) {
  const [cx, cy] = P(x, y, z);
  const rx = r * Math.SQRT2 * COS;
  const ry = r * Math.SQRT2 * SEN;
  return `M${n(cx - rx)} ${n(cy)}a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0Z`;
}
const disco = (cx, cy, r) => `M${n(cx - r)} ${n(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
/* Retângulo de cantos redondos no chão: a praça e os canteiros. */
function redondo(x, y, w, d, r, k = 6) {
  const pts = [];
  const cantos = [[x + w - r, y + r, -90], [x + w - r, y + d - r, 0], [x + r, y + d - r, 90], [x + r, y + r, 180]];
  for (const [cx, cy, a0] of cantos) {
    for (let i = 0; i <= k; i++) {
      const a = ((a0 + (i / k) * 90) * Math.PI) / 180;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), 0]);
    }
  }
  return d3(pts);
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
/* Vão em arco pleno numa face: o desenho da janela do casarão. */
function arco(lado, plano, a, b, z1, z2, c) {
  const r = (b - a) / 2;
  const pt = (u, z) => (lado === 'e' ? [u, plano, z] : [plano, u, z]);
  const pts = [pt(a, z1), pt(b, z1)];
  for (let i = 0; i <= 6; i++) {
    const t = (i / 6) * Math.PI;
    pts.push(pt(a + r + r * Math.cos(t), z2 - r + r * Math.sin(t)));
  }
  return { d: d3(pts), c };
}
const fila = (q, a, b, folga, f) => {
  const passo = (b - a) / q;
  return Array.from({ length: q }, (_, i) => f(a + i * passo + (passo * folga) / 2, a + (i + 1) * passo - (passo * folga) / 2));
};

const CAL = { e: 'p1', d: 'p2', t: 'p0' };
const VIDRO = { e: 't1', d: 't2', t: 't0' };

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
function cilindro(x, y, z, r, h, o = {}) {
  const [cx, cy] = P(x, y, z);
  const rx = r * Math.SQRT2 * COS;
  const ry = r * Math.SQRT2 * SEN;
  const corpo = `M${n(cx - rx)} ${n(cy - h)}L${n(cx - rx)} ${n(cy)}A${n(rx)} ${n(ry)} 0 0 0 ${n(cx + rx)} ${n(cy)}L${n(cx + rx)} ${n(cy - h)}Z`;
  const s = { bb: [x - r, x + r, y - r, y + r, z, z + h], it: [{ d: corpo, c: o.e ?? 'm' }, { d: elipse(x, y, z + h, r), c: o.t ?? 'l' }] };
  if (z === 0 && o.sombra !== false) sombraDe(circulo(x, y, r), h);
  solidos.push(s);
  return s;
}
/* Telhado de quatro águas sobre um retângulo, cumeeira no eixo maior. As duas
 * águas de trás entram primeiro: a 30° de inclinação elas ainda aparecem. A
 * telha é um risco do beiral à cumeeira. */
function telhado(x, y, z, w, d, h, beiral = 4) {
  x -= beiral; y -= beiral; w += 2 * beiral; d += 2 * beiral;
  const t = z + h;
  const aoLongoDeX = w >= d;
  const m = Math.min(w, d) / 2;
  const A = aoLongoDeX ? [x + m, y + m, t] : [x + m, y + m, t];
  const B = aoLongoDeX ? [x + w - m, y + m, t] : [x + m, y + d - m, t];
  const c = { a: [x, y, z], b: [x + w, y, z], c: [x + w, y + d, z], d: [x, y + d, z] };
  const aguas = aoLongoDeX
    ? { tras: [c.a, c.b, B, A], ladoT: [c.d, c.a, A], frente: [c.d, c.c, B, A], ladoF: [c.b, c.c, B] }
    : { tras: [c.a, c.d, B, A], ladoT: [c.a, c.b, A], frente: [c.b, c.c, B, A], ladoF: [c.d, c.c, B] };
  const riscos = [];
  const passo = 9;
  if (aoLongoDeX) {
    for (let u = x + m; u <= x + w - m; u += passo) riscos.push([[u, y + d, z], [u, y + m, t]]);
    for (let v = y + passo; v < y + d; v += passo) riscos.push([[x + w, v, z], [x + w - (m - Math.abs(v - y - m)) , v, z + (h * (m - Math.abs(v - y - m))) / m]]);
  } else {
    for (let v = y + m; v <= y + d - m; v += passo) riscos.push([[x + w, v, z], [x + m, v, t]]);
    for (let u = x + passo; u < x + w; u += passo) riscos.push([[u, y + d, z], [u, y + d - (m - Math.abs(u - x - m)), z + (h * (m - Math.abs(u - x - m))) / m]]);
  }
  solidos.push({
    bb: [x + beiral, x + w - beiral, y + beiral, y + d - beiral, z, t],
    it: [
      { d: d3(aguas.tras), c: 'r0' },
      { d: d3(aguas.ladoT), c: 'r0' },
      { d: d3(aoLongoDeX ? aguas.frente : aguas.ladoF), c: 'r1' },
      { d: d3(aoLongoDeX ? aguas.ladoF : aguas.frente), c: 'r2' },
      { d: linhas3(riscos), c: 'rg' },
    ],
  });
}
function piramide(x, y, z, w, d, h, o = CAL) {
  const ap = [x + w / 2, y + d / 2, z + h];
  solidos.push({
    bb: [x, x + w, y, y + d, z, z + h],
    it: [
      { d: d3([[x, y, z], [x + w, y, z], ap]), c: o.t },
      { d: d3([[x, y, z], [x, y + d, z], ap]), c: o.t },
      { d: d3([[x, y + d, z], [x + w, y + d, z], ap]), c: o.e },
      { d: d3([[x + w, y, z], [x + w, y + d, z], ap]), c: o.d },
    ],
  });
}
/* A árvore das referências: esfera com crescente de sombra e tronco na tinta clara. */
function arvore(x, y, r = 19, tronco = 13) {
  const [bx, by] = P(x, y, 0);
  const [cx, cy] = P(x, y, tronco + r);
  const R = r * 1.55;
  sombras.push({ d: elipse(x + (tronco + r) * SX, y + (tronco + r) * SY, 0, r * 0.72), c: 'sh' });
  const pontos = [[-0.42, -0.3], [-0.1, 0.42], [-0.5, 0.22], [-0.05, -0.55]].map(([u, v]) => disco(cx + u * r, cy + v * r, 1.1)).join('');
  solidos.push({
    bb: [x - 5, x + 5, y - 5, y + 5, 0, tronco + 2 * r],
    it: [
      { d: `M${n(bx)} ${n(by)}L${n(bx)} ${n(cy)}`, c: 'tr' },
      { d: disco(cx, cy, r), c: 'f1' },
      { d: `M${n(cx + r * 0.35)} ${n(cy - r * 0.937)}A${r} ${r} 0 0 1 ${n(cx + r * 0.35)} ${n(cy + r * 0.937)}A${n(R)} ${n(R)} 0 0 0 ${n(cx + r * 0.35)} ${n(cy - r * 0.937)}Z`, c: 'cr' },
      { d: pontos, c: 'pt' },
    ],
  });
}
/* Palmeira imperial: fuste alto e a copa em leque. É o que diz "Rio". */
function palmeira(x, y, h = 78) {
  const [bx, by] = P(x, y, 0);
  const ty = by - h;
  sombras.push({ d: elipse(x + h * SX, y + h * SY, 0, 9), c: 'sh' });
  const folhas = [[-20, -4], [-15, -15], [-5, -21], [7, -20], [17, -12], [20, 0], [-12, 8], [12, 9]]
    .map(([u, v]) => `M${n(bx)} ${n(ty)}Q${n(bx + u * 0.55)} ${n(ty + v - 7)} ${n(bx + u)} ${n(ty + v + 3)}`).join('');
  solidos.push({ bb: [x - 3, x + 3, y - 3, y + 3, 0, h + 20], it: [{ d: `M${n(bx)} ${n(by)}L${n(bx)} ${n(ty)}`, c: 'tr2' }, { d: folhas, c: 'fo' }] });
}
function poste(x, y, h = 36) {
  const [bx, by] = P(x, y, 0);
  solidos.push({ bb: [x - 2, x + 2, y - 2, y + 2, 0, h], it: [{ d: `M${n(bx)} ${n(by)}L${n(bx)} ${n(by - h)}`, c: 'fi' }, { d: disco(bx, by - h - 3.2, 3.2), c: 'a' }] });
}
function bandeira(x, y, h = 56) {
  solidos.push({
    bb: [x - 1, x + 18, y - 1, y + 1, 0, h],
    it: [{ d: linhas3([[[x, y, 0], [x, y, h]]]), c: 'fi' }, { d: d3([[x, y, h], [x + 18, y, h - 2], [x + 18, y, h - 14], [x, y, h - 12]]), c: 'a' }],
  });
}
function montar() {
  semente = 7;

  /* ---- A ÁGUA e o cais: a praça dá para a baía. A onda é um til. ---- */
  chao.push({ d: d3([[512, -500, 0], [1300, -500, 0], [1300, 1100, 0], [512, 1100, 0]]), c: 'ag' });
  let ondas = '';
  for (let i = 0; i < 90; i++) {
    const [wx, wy] = P(526 + sorte() * 190, -120 + sorte() * 800, 0);
    ondas += `M${n(wx - 7)} ${n(wy)}q3.5 -3 7 0t7 0`;
  }
  chao.push({ d: ondas, c: 'on' });

  /* ---- O CHÃO: a praça calçada, os canteiros pontilhados. ---- */
  chao.push({ d: redondo(150, 204, 346, 268, 40), c: 'g' });
  const juntas = [];
  for (let x = 186; x <= 462; x += 23) juntas.push([[x, 222, 0], [x, 454, 0]]);
  for (let y = 222; y <= 454; y += 23.2) juntas.push([[168, y, 0], [478, y, 0]]);
  chao.push({ d: linhas3(juntas), c: 'pv' });
  const canteiros = [[8, 150, 44, 250, 22], [160, 482, 300, 44, 22], [120, 30, 100, 62, 26], [352, 34, 130, 58, 26]];
  for (const [x, y, w, d, r] of canteiros) {
    chao.push({ d: redondo(x, y, w, d, r), c: 'gm' });
    let pts = '';
    for (let i = 0; i < (w * d) / 260; i++) {
      const [px, py] = P(x + 8 + sorte() * (w - 16), y + 8 + sorte() * (d - 16), 0);
      pts += disco(px, py, 0.9);
    }
    chao.push({ d: pts, c: 'pt' });
  }

  /* ---- A TORRE: vidro escuro, nervura vertical, andares acesos. ---- */
  const torre = caixa(236, 10, 0, 92, 92, 252, VIDRO);
  const nE = [];
  const nD = [];
  for (let x = 245.2; x < 328; x += 9.2) nE.push([[x, 102, 0], [x, 102, 252]]);
  for (let y = 19.2; y < 102; y += 9.2) nD.push([[328, y, 0], [328, y, 252]]);
  for (let z = 42; z < 252; z += 42) { nE.push([[236, 102, z], [328, 102, z]]); nD.push([[328, 10, z], [328, 102, z]]); }
  const acesas = [];
  for (let i = 0; i < 26; i++) {
    const col = Math.floor(sorte() * 10);
    const z = 12 + Math.floor(sorte() * 26) * 9;
    acesas.push(sorte() < 0.62 ? esq(102, 236 + col * 9.2 + 1.6, 236 + (col + 1) * 9.2 - 1.6, z, z + 5, 'lz') : dir(328, 10 + col * 9.2 + 1.6, 10 + (col + 1) * 9.2 - 1.6, z, z + 5, 'lz'));
  }
  torre.it.splice(2, 0, { d: linhas3(nE), c: 'ng' }, { d: linhas3(nD), c: 'ng' }, ...acesas);
  caixa(250, 24, 252, 64, 64, 14, VIDRO);
  const [ax, ay] = P(282, 56, 266);
  solidos.push({ bb: [281, 283, 55, 57, 266, 300], it: [{ d: `M${n(ax)} ${n(ay)}L${n(ax)} ${n(ay - 34)}`, c: 'fi' }, { d: disco(ax, ay - 34, 2), c: 'a' }] });

  /* ---- O CASARÃO: dois pavimentos caiados, arcos, telhado de quatro águas. ---- */
  const casa = caixa(150, 112, 0, 312, 80, 62, CAL);
  casa.it.push(...fila(11, 158, 454, 0.42, (a, b) => arco('e', 192, a, b, 4, 27, 'vd')));
  casa.it.push(...fila(11, 158, 454, 0.42, (a, b) => arco('e', 192, a, b, 35, 55, 'vd')));
  casa.it.push(...fila(3, 118, 186, 0.46, (a, b) => arco('d', 462, a, b, 4, 27, 'vd')));
  casa.it.push(...fila(3, 118, 186, 0.46, (a, b) => arco('d', 462, a, b, 35, 55, 'vd')));
  casa.it.push({ d: linhas3([[[150, 192, 31], [462, 192, 31]], [[462, 112, 31], [462, 192, 31]]]), c: 'fc' });
  telhado(150, 112, 62, 312, 80, 24);
  bandeira(282, 198);
  bandeira(330, 198);

  /* ---- A ALA: o mesmo casarão, de lado para a praça. ---- */
  const ala = caixa(60, 150, 0, 78, 236, 54, CAL);
  ala.it.push(...fila(8, 158, 378, 0.42, (a, b) => arco('d', 138, a, b, 4, 24, 'vd')));
  ala.it.push(...fila(8, 158, 378, 0.42, (a, b) => arco('d', 138, a, b, 31, 48, 'vd')));
  ala.it.push(...fila(3, 66, 132, 0.46, (a, b) => arco('e', 386, a, b, 4, 24, 'vd')));
  ala.it.push(...fila(3, 66, 132, 0.46, (a, b) => arco('e', 386, a, b, 31, 48, 'vd')));
  ala.it.push({ d: linhas3([[[138, 150, 27.5], [138, 386, 27.5]], [[60, 386, 27.5], [138, 386, 27.5]]]), c: 'fc' });
  telhado(60, 150, 54, 78, 236, 22);

  /* ---- O ANEXO: concreto e fita de vidro, os tons médios da cena. ---- */
  const anexo = caixa(64, 412, 0, 84, 66, 40);
  anexo.it.push(dir(148, 420, 470, 14, 30, 'v'), esq(478, 72, 140, 14, 30, 'v'));
  anexo.it.push({ d: linhas3([433, 446, 458].map((y) => [[148, y, 14], [148, y, 30]])), c: 'gr' });
  caixa(82, 428, 40, 26, 26, 7);
  caixa(148, 430, 0, 14, 28, 3, { sombra: false });

  /* ---- O CHAFARIZ do Mestre Valentim, que é o desenho da marca. ---- */
  const [cx, cy] = [330, 334];
  caixa(cx - 50, cy - 50, 0, 100, 100, 5, CAL);
  caixa(cx - 40, cy - 40, 5, 80, 80, 5, CAL);
  caixa(cx - 30, cy - 30, 10, 60, 60, 5, CAL);
  const corpo = caixa(cx - 18, cy - 18, 15, 36, 36, 36, CAL);
  corpo.it.push(arco('e', cy + 18, cx - 8, cx + 8, 15, 42, 'vd'), arco('d', cx + 18, cy - 8, cy + 8, 15, 42, 'vd'));
  caixa(cx - 23, cy - 23, 51, 46, 46, 5, CAL);
  caixa(cx - 13, cy - 13, 56, 26, 26, 18, CAL);
  caixa(cx - 17, cy - 17, 74, 34, 34, 4, CAL);
  piramide(cx - 13, cy - 13, 78, 26, 26, 40);
  const [ex, ey] = P(cx, cy, 122);
  solidos.push({ bb: [cx - 3, cx + 3, cy - 3, cy + 3, 118, 140], it: [{ d: `M${n(ex)} ${n(ey)}L${n(ex)} ${n(ey - 15)}M${n(ex - 4)} ${n(ey - 10)}L${n(ex + 4)} ${n(ey - 10)}`, c: 'fi' }, { d: disco(ex, ey, 4.5), c: 'a' }] });

  /* ---- O CAIS e a barca. ---- */
  caixa(498, -500, 0, 14, 1600, 4, { sombra: false });
  emGrupo('barca', () => {
    caixa(548, 250, 0, 34, 104, 9, { ...CAL, sombra: false });
    const cabine = caixa(554, 268, 9, 22, 62, 10, CAL);
    cabine.it.push(...fila(5, 272, 326, 0.4, (a, b) => dir(576, a, b, 12, 17, 'vd')));
    cilindro(565, 318, 19, 4, 9, { e: 'a2', t: 'a' });
  });

  /* ---- O QUE O ACESSO ABRE, flutuando em volta da praça (13/10/2026: "uma
   * tela de sistemas, carteirinha, aprovações, provas, vestibular", depois
   * "mais elementos de sistema" e "distribua melhor os elementos"). Dez peças
   * de pé, todas voltadas para o mesmo lado.
   *
   * Cada peça é posta pelo lugar que ocupa NA TELA (o canto de cima à
   * esquerda da face), e não por coordenada de mundo: a distribuição é um
   * problema de composição no plano do desenho. As dez formam um arco em
   * volta da torre, da esquerda baixa à direita, com alturas alternadas e
   * nenhuma sobre telhado, árvore ou cais. O conteúdo de cada uma é medido
   * a partir do canto de baixo à esquerda dela. ---- */
  const KA = { e: 'k1', d: 'k2', t: 'k0' };
  const doChao = (sx, sy, Y) => { const x = (sx - OX) / COS + Y; return [x, (x + Y) / 2 + OY - sy]; };
  const peca = (sx, sy, w, h, Y = 265) => {
    const [x, topo] = doChao(sx, sy, Y);
    const z = topo - h;
    const s = emGrupo('pc', () => caixa(x, Y - 5, z, w, 5, h, KA));
    const f = (u1, u2, v1, v2, c) => s.it.push(esq(Y, x + u1, x + u2, z + v1, z + v2, c));
    const risco = (pts, c) => s.it.push({ d: linhas3(pts.slice(1).map((p, i) => [[x + pts[i][0], Y, z + pts[i][1]], [x + p[0], Y, z + p[1]]])), c });
    const barras = (u1, u2, v1, v2) => { for (let u = u1; u < u2; u += 4.5) f(u, u + (Math.round(u) % 2 ? 2.8 : 1.4), v1, v2, 'kd'); };
    return { f, risco, barras };
  };
  // O protocolo, embaixo à esquerda, no chão vazio antes da praça.
  const carta = peca(-52, 560, 52, 34);
  carta.risco([[0, 34], [26, 16], [52, 34]], 'fi');
  carta.f(39, 46, 5, 12, 'kd');
  // O calendário de aulas, à esquerda da ala.
  const cal = peca(-70, 292, 60, 52);
  cal.f(0, 60, 42, 52, 'kd');
  [28, 17, 6].forEach((v, l) => [6, 20, 34, 48].forEach((u, c) => cal.f(u, u + 9, v, v + 7, l === 1 && c === 2 ? 'kd' : 'kc')));
  // A tela de sistemas, a maior: cabeçalho e seis ladrilhos, um escolhido.
  const tela = peca(34, 64, 120, 86);
  tela.f(0, 120, 74, 86, 'kc');
  [8, 16, 24].forEach((u) => tela.f(u, u + 4, 78, 82, 'kd'));
  [40, 8].forEach((v, l) => [8, 45, 82].forEach((u, c) => tela.f(u, u + 30, v, v + 26, l === 0 && c === 1 ? 'kd' : 'kc')));
  // A carteirinha: retrato, nome, duas linhas e o código de barras.
  const cart = peca(196, 122, 68, 44);
  cart.f(6, 24, 16, 38, 'kc');
  cart.f(30, 62, 32, 36, 'kd');
  cart.f(30, 56, 24, 27, 'kc');
  cart.f(30, 48, 17, 20, 'kc');
  cart.barras(6, 62, 4, 11);
  // A folha de prova: título e quatro questões de quatro alternativas.
  const prova = peca(318, 8, 48, 64);
  prova.f(7, 34, 53, 57, 'kd');
  [41, 30, 19, 8].forEach((v, l) => [7, 17, 27, 37].forEach((u, c) => prova.f(u, u + 6, v, v + 6, c === [1, 3, 0, 2][l] ? 'kd' : 'kc')));
  // Os livros da biblioteca, sobre o encontro dos dois telhados.
  const [lx, lz] = doChao(424, 176, 262);
  emGrupo('pc', () => [[0, 0, 50, 36], [6, 3, 44, 32], [-2, -1, 48, 36]].forEach(([dx, dy, w, d], i) => {
    const liv = caixa(lx - 25 + dx, 244 + dy, lz + i * 8, w, d, 8, KA);
    liv.it.push(esq(244 + dy + d, lx - 19 + dx, lx - 15 + dx, lz + i * 8, lz + i * 8 + 8, 'kd'));
  }));
  // O capelo do vestibular, no alto, antes da torre.
  const [vx, vz] = doChao(452, 84, 262);
  const [bx, by] = P(vx, 262, vz);
  emGrupo('pc', () => {
    caixa(vx - 12, 250, vz - 14, 24, 24, 11, KA);
    caixa(vx - 28, 234, vz - 3, 56, 56, 3, KA);
    solidos.push({ bb: [vx - 1, vx + 28, 261, 290, vz, vz + 1], it: [{ d: `M${n(bx)} ${n(by)}L${n(bx + 26)} ${n(by + 15)}L${n(bx + 26)} ${n(by + 30)}`, c: 'fi' }, { d: disco(bx + 26, by + 32, 2.6), c: 'a' }] });
  });
  // Do outro lado da torre: o gráfico do gerencial, o aprovado e o boleto.
  const graf = peca(726, 56, 64, 48, 5);
  [[8, 12], [21, 24], [34, 17], [47, 33]].forEach(([u, h], i) => graf.f(u, u + 9, 6, 6 + h, i === 3 ? 'kd' : 'kc'));
  const visto = peca(848, 176, 58, 52, 5);
  visto.risco([[13, 29], [24, 17], [45, 41]], 'kk');
  visto.f(13, 45, 6, 9, 'kc');
  const boleto = peca(722, 262, 72, 40, 5);
  boleto.f(7, 40, 30, 34, 'kd');
  boleto.f(7, 30, 22, 25, 'kc');
  boleto.f(52, 66, 28, 34, 'kc');
  boleto.barras(7, 66, 5, 16);

  /* ---- Árvores, palmeiras e postes. A gente saiu em 13/10/2026, a pedido. ---- */
  [176, 232, 288, 344].forEach((y) => arvore(30, y));
  [190, 250, 310, 370, 430].forEach((x) => arvore(x, 504, 16, 11));
  arvore(150, 62, 17, 12);
  arvore(192, 58, 17, 12);
  arvore(384, 62, 17, 12);
  arvore(432, 66, 17, 12);
  [224, 292, 360, 428].forEach((y) => palmeira(478, y));
  poste(172, 226);
  poste(172, 446);
  poste(456, 226, 30);
  poste(456, 446, 30);
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

function caminhos() {
  chao.length = sombras.length = solidos.length = grupos.length = 0;
  montar();
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
  const moveis = [...grupos].sort((a, b) => (a.nome === 'barca' ? -1 : 0) - (b.nome === 'barca' ? -1 : 0));
  let k = 0;
  /* Dois planos para o ponteiro: a praça (base) e o que flutua. */
  return `<g class='base'>${juntos.map(path).join('')}</g>` + moveis.map((m) => `<g class='${m.nome}'${m.nome === 'pc' ? ` style='--i:${k++}'` : ''}><g>${m.solidos.flatMap((s) => s.it).map(path).join('')}</g></g>`).join('');
}

export function cenaLogin() {
  return `<svg class='ucam-login__cena-svg' viewBox='-110 -76 1120 812' aria-hidden='true' focusable='false'>${fundo('lg')}${caminhos()}</svg>`;
}

/* A MESMA cena para a capa do site, sobre o branco. Lá não há painel de raio
 * para recortar a água que vaza: a cena inteira passa por uma vinheta e se
 * desfaz na página. O viewBox é mais largo que o do login para a torre e o
 * chafariz ficarem dentro da parte cheia da vinheta. */
export function cenaCapa() {
  const vinheta =
    `<defs><radialGradient id='cp-vinheta' cx='50%' cy='50%' r='60%'><stop offset='0.74' stop-color='#fff'/><stop offset='0.98' stop-color='#fff' stop-opacity='0'/></radialGradient>` +
    `<mask id='cp-recorte'><rect x='-150' y='-120' width='1200' height='920' fill='url(#cp-vinheta)'/></mask></defs>`;
  return `<svg viewBox='-150 -120 1200 920' aria-hidden='true' focusable='false'>${vinheta}<g mask='url(#cp-recorte)'>${fundo('cp')}${caminhos()}</g></svg>`;
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
