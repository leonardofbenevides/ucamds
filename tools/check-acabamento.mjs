/*
 * Portão de ACABAMENTO: mede o site renderizado e falha no que o olho não pega.
 *
 * Os outros portões leem arquivos. Este abre o site num navegador de verdade,
 * em duas larguras, e verifica três coisas que só existem depois do layout:
 *
 *   VAZAMENTO   documento mais largo que a viewport. É o pior defeito de
 *               celular, porque move a página inteira e não só a peça que
 *               estourou. FALHA o portão.
 *   MIÚDO       texto abaixo de 11px. Este site cobra um piso das telas que
 *               documenta; cumpri-lo é o mínimo. FALHA o portão.
 *   LINHA       parágrafo acima de 85 caracteres, contados até a QUEBRA REAL
 *               por Range e busca binária, não pela largura da caixa. Um <p>
 *               largo com filho estreito não tem linha longa: medir a caixa
 *               acusava a faixa do Trilho A+ e a lista de ADRs, ambas certas.
 *               AVISA e não falha: há casos
 *               decididos de propósito (o callout, o "porque" das boas
 *               práticas) e um portão que falha neles vira portão ignorado.
 *
 * Alvo de toque NÃO entra. A primeira versão desta sonda apontou setenta
 * alvos abaixo de 24px e todos estavam conformes: a WCAG 2.5.8 falha apenas
 * quando o círculo de 24px centrado no alvo INTERSECTA o de outro, e chips de
 * 20px com 5px de vão passam pela exceção de espaçamento. Um portão que grita
 * em conteúdo correto é pior que portão nenhum.
 *
 * COMO RODAR
 *   1. pnpm dev              (ou qualquer servidor do site)
 *   2. node tools/check-acabamento.mjs [urlBase]
 *
 * O Chrome sobe sozinho se não houver um escutando em :9333. Sem servidor do
 * site, o portão PULA com código 0 — ele não pode derrubar um build de CI que
 * não tem navegador, e é por isso que não entra no `pnpm build`.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE_SITE = process.argv[2] || 'http://localhost:5174';
const CDP = 'http://localhost:9333';
const LARGURAS = [390, 1440];
const PISO_FONTE = 11;
const TETO_LINHA = 85;

/** As rotas que cobrem as formas do site — uma de cada gênero de página. */
const ROTAS = [
  '/',
  '/catalogo',
  '/catalogo/button',
  '/catalogo/data-table',
  '/fundamentos/cor',
  '/fundamentos/tipografia',
  '/comecar/instalacao',
  '/decisoes',
  '/padroes',
  '/telas',
];

const CHROMES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

async function vivo(url) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 1500);
    await fetch(url, { signal: c.signal });
    clearTimeout(t);
    return true;
  } catch {
    return false;
  }
}

if (!(await vivo(BASE_SITE))) {
  console.log('· acabamento  PULADO — nada servindo em ' + BASE_SITE + ' (rode `pnpm dev`)');
  process.exit(0);
}

if (!(await vivo(CDP + '/json/version'))) {
  const exe = CHROMES.find((c) => existsSync(c));
  if (!exe) {
    console.log('· acabamento  PULADO — Chrome não encontrado');
    process.exit(0);
  }
  spawn(
    exe,
    [
      '--remote-debugging-port=9333',
      '--headless=new',
      '--disable-gpu',
      '--user-data-dir=' + mkdtempSync(join(tmpdir(), 'ucam-acab-')),
      'about:blank',
    ],
    { detached: true, stdio: 'ignore' },
  ).unref();
  for (let i = 0; i < 20 && !(await vivo(CDP + '/json/version')); i++) await dorme(500);
  if (!(await vivo(CDP + '/json/version'))) {
    console.log('· acabamento  PULADO — o Chrome não subiu');
    process.exit(0);
  }
}

const alvo = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) {
    pend.get(m.id)(m);
    pend.delete(m.id);
  }
};
const cmd = (m, p = {}) =>
  new Promise((res) => {
    const i = ++id;
    pend.set(i, res);
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });
const ava = async (expr) =>
  (await cmd('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value;

/* A sonda roda DENTRO da página. Sem template literal e sem barra-n: ela
   viaja como string por Runtime.evaluate, e escape perdido aqui vira defeito
   silencioso — já aconteceu. */
const SONDA = [
  '(function () {',
  '  var doc = document.documentElement;',
  '  var r = { vaza: null, miudo: [], linha: [] };',
  '  if (doc.scrollWidth > doc.clientWidth + 1) {',
  '    var quem = [];',
  '    var todos = document.querySelectorAll("body *");',
  '    for (var i = 0; i < todos.length && quem.length < 2; i++) {',
  '      var e = todos[i], b = e.getBoundingClientRect();',
  '      if (!b.width || b.right <= doc.clientWidth + 1) continue;',
  '      var n = e.parentElement, contido = false;',
  '      while (n && n !== document.body) {',
  '        var o = getComputedStyle(n).overflowX;',
  '        if (o === "auto" || o === "scroll" || o === "hidden") { contido = true; break; }',
  '        n = n.parentElement;',
  '      }',
  '      if (contido) continue;',
  '      quem.push((e.className ? String(e.className).trim().split(/\\s+/)[0] : e.tagName.toLowerCase()) + "@" + Math.round(b.right));',
  '    }',
  '    r.vaza = doc.scrollWidth + ">" + doc.clientWidth + " [" + quem.join(" ") + "]";',
  '  }',
  '  var vistos = {};',
  '  var folhas = document.querySelectorAll("main *");',
  '  for (var k = 0; k < folhas.length; k++) {',
  '    var el = folhas[k];',
  '    if (el.childElementCount || !el.textContent.trim()) continue;',
  '    if (el.closest("[inert]")) continue;',
  '    var fs = parseFloat(getComputedStyle(el).fontSize);',
  '    if (fs >= PISO) continue;',
  '    var cl = (el.className ? String(el.className).trim().split(/\\s+/)[0] : el.tagName.toLowerCase());',
  '    var ch = fs + "px " + cl;',
  '    if (!vistos[ch]) { vistos[ch] = 1; r.miudo.push(ch); }',
  '  }',
  '  var ps = document.querySelectorAll("main p, main li");',
  '  for (var q = 0; q < ps.length && r.linha.length < 3; q++) {',
  '    var p = ps[q];',
  '    var no = p.firstChild;',
  '    if (!no || no.nodeType !== 3) continue;',
  '    var txt = no.textContent;',
  '    if (txt.trim().length < 160) continue;',
  '    var rg = document.createRange();',
  '    rg.setStart(no, 0); rg.setEnd(no, 1);',
  '    var topo = rg.getBoundingClientRect().top;',
  '    var lo = 1, hi = txt.length, corte = txt.length;',
  '    while (lo <= hi) {',
  '      var meio = (lo + hi) >> 1;',
  '      rg.setStart(no, meio); rg.setEnd(no, Math.min(meio + 1, txt.length));',
  '      var rr = rg.getBoundingClientRect();',
  '      if (rr.height && rr.top > topo + 2) { corte = meio; hi = meio - 1; } else { lo = meio + 1; }',
  '    }',
  '    if (corte <= TETO) continue;',
  '    r.linha.push(corte + "ch " + (p.className ? String(p.className).trim().split(/\\s+/)[0] : p.tagName.toLowerCase()));',
  '  }',
  '  return JSON.stringify(r);',
  '})()',
]
  .join('\n')
  .replace('PISO', String(PISO_FONTE))
  .replace('TETO', String(TETO_LINHA));

await cmd('Page.enable');

const falhas = [];
const avisos = [];

for (const larg of LARGURAS) {
  await cmd('Emulation.setDeviceMetricsOverride', {
    width: larg,
    height: 900,
    deviceScaleFactor: 1,
    mobile: larg < 700,
  });
  for (const rota of ROTAS) {
    await cmd('Page.navigate', { url: BASE_SITE + rota });
    let ant = -1, estavel = 0;
    for (let i = 0; i < 40; i++) {
      await dorme(300);
      const n = await ava('document.body?document.body.innerText.length:0');
      if (n > 200 && n === ant) {
        if (++estavel >= 2) break;
      } else estavel = 0;
      ant = n;
    }
    await dorme(400);
    const bruto = await ava(SONDA);
    if (!bruto) continue;
    const r = JSON.parse(bruto);
    const onde = rota + ' @' + larg;
    if (r.vaza) falhas.push('VAZA      ' + onde.padEnd(30) + r.vaza);
    if (r.miudo.length) falhas.push('MIÚDO     ' + onde.padEnd(30) + r.miudo.join(' · '));
    if (r.linha.length) avisos.push('linha>' + TETO_LINHA + ' ' + onde.padEnd(30) + r.linha.join(' · '));
  }
}

ws.close();
await fetch(`${CDP}/json/close/${alvo.id}`);

for (const a of avisos) console.log('  · ' + a);

if (falhas.length) {
  console.error('');
  for (const f of falhas) console.error('  ✗ ' + f);
  console.error('');
  console.error(
    '✗ acabamento  ' + falhas.length + ' defeito(s) em ' + ROTAS.length + ' rotas × ' + LARGURAS.length + ' larguras',
  );
  process.exit(1);
}

console.log(
  '✓ acabamento  ' +
    ROTAS.length * LARGURAS.length +
    ' páginas medidas: nenhuma vaza a viewport, nenhum texto abaixo de ' +
    PISO_FONTE +
    'px' +
    (avisos.length ? ' (' + avisos.length + ' aviso(s) de linha longa acima)' : ''),
);
