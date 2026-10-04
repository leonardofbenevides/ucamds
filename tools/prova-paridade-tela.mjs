/**
 * PROVA DE PARIDADE DE TELA — Trilho B contra Trilho A, pixel a pixel.
 *
 * A pergunta (03/10/2026): "o dev que monta a tela em Angular chega 100% igual
 * à referência?" Até aqui ninguém media isso. As provas por CDP que existiam
 * comparavam COMPONENTE (A contra A+) e a geometria da base; a tela inteira —
 * moldura, barra de visão, tabela, rodapé — nunca foi posta lado a lado.
 *
 * O que ela faz: abre a página autônoma do Trilho A (/t/<proj>-<tela>.html)
 * e a tela viva em Angular (/vivo/<proj>/<tela>) na MESMA largura, tira uma
 * foto de cada uma, e compara as duas no próprio navegador (canvas), que é o
 * único lugar sem dependência onde se decodifica PNG. Devolve a fração de
 * pixels diferentes no todo e por REGIÃO (faixa, navegação, barra de visão,
 * conteúdo), porque "3% diferente" não diz onde olhar, e grava o mapa de
 * diferenças em PNG.
 *
 * Não é portão de build: precisa do site construído e de um Chrome. É a régua
 * que diz quanto falta, e o que falta vai para a lista do item 3.
 *
 * Como rodar:
 *   1. pnpm --dir site build
 *   2. node tools/prova-paridade-tela.mjs protocolo naturezas [largura=1180]
 *      (sobe o estático em :5313 e o Chrome em :9353 sozinho)
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, statSync, createReadStream } from 'node:fs';
import http from 'node:http';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLICO = join(ROOT, 'site/dist/analog/public');
const [projeto = 'protocolo', tela = 'naturezas', larguraArg = '1180'] = process.argv.slice(2);
const LARGURA = Number(larguraArg);
const PORTA = 5313;
const CDP = 9353;
const SAIDA = join(ROOT, 'scratchpad', 'paridade');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

if (!existsSync(join(PUBLICO, 'index.html'))) {
  console.error('✗ site/dist/analog/public não existe — rode: pnpm --dir site build');
  process.exit(1);
}
mkdirSync(SAIDA, { recursive: true });

/* ------------------------------------------------------------ servidor --- */
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png' };
const servidor = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  let f = join(PUBLICO, u);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); return res.end('404 ' + u); }
  res.writeHead(200, { 'content-type': tipos[extname(f)] || 'application/octet-stream' });
  createReadStream(f).pipe(res);
});
await new Promise((r) => servidor.listen(PORTA, r));

/* -------------------------------------------------------------- chrome --- */
const perfil = join(tmpdir(), `ucam-paridade-${Date.now()}`);
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${CDP}`, `--user-data-dir=${perfil}`,
  `--window-size=${LARGURA},900`, '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank',
], { stdio: 'ignore' });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
let alvo = null;
for (let i = 0; i < 40 && !alvo; i++) {
  await espera(250);
  try { alvo = (await (await fetch(`http://localhost:${CDP}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
}
if (!alvo) { console.error('✗ Chrome não respondeu em :' + CDP); chrome.kill(); process.exit(1); }

const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++seq; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text + ' em ' + expr.slice(0, 80)); return r.result?.result?.value; };
await send('Page.enable');

/** Mede a página inteira e fotografa com a viewport do tamanho do documento — captureBeyondViewport mente (ver memória). */
async function foto(url, nome) {
  await send('Emulation.setDeviceMetricsOverride', { width: LARGURA, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await espera(3500); // o Analog hidrata; antes disso a foto é do HTML pré-renderizado
  await ev(`document.fonts.ready.then(() => true)`);
  const altura = await ev(`Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)`);
  await send('Emulation.setDeviceMetricsOverride', { width: LARGURA, height: Math.min(altura, 6000), deviceScaleFactor: 1, mobile: false });
  await espera(400);
  const regioes = await ev(`(function(){
    const q = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)]; };
    return {
      faixa: q('header.ucam-appbar, .ucam-shell > header, ucam-app-shell header'),
      nav: q('.ucam-nav, ucam-app-shell nav[id]'),
      viewbar: q('.ucam-viewbar, ucam-page-header'),
      corpo: q('.ucam-corpo'),
      tabela: q('.ucam-table'),
      main: q('main'),
    };
  })()`);
  const dados = (await send('Page.captureScreenshot', { format: 'png' })).result?.data;
  writeFileSync(join(SAIDA, `${nome}.png`), Buffer.from(dados, 'base64'));
  return { altura, regioes, png: dados };
}

const base = `http://localhost:${PORTA}`;
console.log(`paridade de ${projeto}/${tela} a ${LARGURA}px`);
const A = await foto(`${base}/t/${projeto}-${tela}.html?embed=1&tema=light`, `${projeto}-${tela}.A`);
const B = await foto(`${base}/vivo/${projeto}/${tela}?tema=light`, `${projeto}-${tela}.B`);
console.log(`  altura  A ${A.altura}px · B ${B.altura}px`);

/* -------------------------------------------------- comparação no canvas --- */
await send('Page.navigate', { url: 'about:blank' });
await espera(300);
const resultado = await ev(`(async function(){
  const carrega = (b64) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + b64; });
  const a = await carrega(${JSON.stringify(A.png)});
  const b = await carrega(${JSON.stringify(B.png)});
  const W = Math.max(a.width, b.width), H = Math.max(a.height, b.height);
  const cv = (img) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(img, 0, 0); return x.getImageData(0, 0, W, H).data; };
  const da = cv(a), db = cv(b);
  const diff = document.createElement('canvas'); diff.width = W; diff.height = H;
  const dx = diff.getContext('2d'); const out = dx.createImageData(W, H);
  let dif = 0; const linhas = new Uint32Array(H);
  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    const d = Math.abs(da[o] - db[o]) + Math.abs(da[o+1] - db[o+1]) + Math.abs(da[o+2] - db[o+2]);
    const difere = d > 48; // tolera anti-aliasing
    if (difere) { dif++; linhas[(i / W) | 0]++; out.data[o] = 220; out.data[o+1] = 30; out.data[o+2] = 30; out.data[o+3] = 255; }
    else { const g = 255 - ((255 - da[o]) >> 2); out.data[o] = g; out.data[o+1] = g; out.data[o+2] = g; out.data[o+3] = 255; }
  }
  dx.putImageData(out, 0, 0);
  const regiao = (r) => { if (!r) return null; let n = 0, t = 0; for (let y = r[1]; y < Math.min(H, r[1] + r[3]); y++) for (let x = r[0]; x < Math.min(W, r[0] + r[2]); x++) { const o = (y * W + x) * 4; const d = Math.abs(da[o] - db[o]) + Math.abs(da[o+1] - db[o+1]) + Math.abs(da[o+2] - db[o+2]); t++; if (d > 48) n++; } return t ? +(n / t * 100).toFixed(2) : null; };
  const regioes = ${JSON.stringify(A.regioes)};
  const porRegiao = {}; for (const k in regioes) porRegiao[k] = regiao(regioes[k]);
  // primeira e última linha com diferença
  let primeira = -1, ultima = -1; for (let y = 0; y < H; y++) if (linhas[y]) { if (primeira < 0) primeira = y; ultima = y; }
  return { W, H, total: +(dif / (W * H) * 100).toFixed(2), porRegiao, primeira, ultima, png: diff.toDataURL('image/png').slice(22) };
})()`);
writeFileSync(join(SAIDA, `${projeto}-${tela}.diff.png`), Buffer.from(resultado.png, 'base64'));

console.log(`  pixels diferentes: ${resultado.total}% de ${resultado.W}×${resultado.H} (limiar 48/765 por canal somado)`);
console.log(`  por região da tela A:`);
for (const [k, v] of Object.entries(resultado.porRegiao)) console.log(`    ${k.padEnd(8)} ${v === null ? '(sem região)' : v + '%'}  ${A.regioes[k] ? JSON.stringify(A.regioes[k]) : ''}  B: ${B.regioes[k] ? JSON.stringify(B.regioes[k]) : '(sem região)'}`);
console.log(`  primeira linha diferente: y=${resultado.primeira} · última: y=${resultado.ultima}`);
console.log(`  fotos em scratchpad/paridade/${projeto}-${tela}.{A,B,diff}.png`);

ws.close();
chrome.kill();
servidor.close();
process.exit(0);
