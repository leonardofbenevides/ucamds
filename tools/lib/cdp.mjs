// NAVEGADOR PARA PROVAS E SONDAS — Chrome headless próprio + servidor estático.
//
// Cada prova em scratchpad/ reescrevia o mesmo boilerplate de CDP com uma porta
// fixa (9333, 9341, 9344, 9346, 9353, 9471...), e cada uma pedia que alguém
// abrisse um Chrome e um servidor à mão antes. Aqui as duas coisas sobem
// sozinhas em portas livres e morrem no fim:
//
//   const nav = await abreNavegador({ raiz: 'docs' });
//   const p = await nav.pagina();
//   await p.vai(nav.base + '/t/protocolo/naturezas.html', { largura: 1440 });
//   const n = await p.ev('document.querySelectorAll("button").length');
//   p.erros   // exceções, console.error e respostas >= 400 desde o último vai()
//   await nav.fecha();
//
// O servidor não manda cache (http-server mandava 1h e a sonda via a tela
// velha) e nunca usa cwd dentro de dist/ (o rmdir do build dava EBUSY).
// CHROME troca o executável.

import http from 'node:http';
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, statSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

const CANDIDATOS = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

export const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

export function achaChrome() {
  return CANDIDATOS.find((c) => existsSync(c)) || null;
}

/** Servidor estático da pasta `raiz`, em porta livre. */
export async function serve(raiz) {
  const base = resolve(raiz);
  const servidor = http.createServer((req, res) => {
    let u;
    try { u = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); return res.end(); }
    let f = resolve(join(base, u));
    if (f !== base && !f.startsWith(base + sep)) { res.writeHead(403); return res.end(); }
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!existsSync(f)) { res.writeHead(404, { 'cache-control': 'no-store' }); return res.end('404 ' + u); }
    res.writeHead(200, { 'content-type': TIPOS[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(f).pipe(res);
  });
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${servidor.address().port}`, fecha: () => new Promise((r) => servidor.close(r)) };
}

/** Sobe o Chrome headless (e, com `raiz`, o servidor). */
export async function abreNavegador({ raiz = null } = {}) {
  const exe = achaChrome();
  if (!exe) throw new Error('Chrome não encontrado — defina CHROME com o caminho do executável');
  const perfil = mkdtempSync(join(tmpdir(), 'ucam-cdp-'));
  const chrome = spawn(exe, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${perfil}`,
    '--hide-scrollbars', '--force-device-scale-factor=1', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-background-networking', '--mute-audio',
    // VÁRIAS ABAS AO MESMO TEMPO: sem estas três o Chrome estrangula as abas
    // de fundo — transição parada no primeiro quadro e setTimeout a 1s. Foi
    // o que deu "Pular para o conteúdo" fora da tela em 73 telas e a sonda de
    // mortos estourando 240s com seis abas (17/11/2026).
    '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
    'about:blank',
  ], { stdio: 'ignore' });

  // Porta 0: o Chrome escolhe e escreve em DevToolsActivePort.
  let porta = null;
  for (let i = 0; i < 80 && !porta; i++) {
    await dorme(125);
    try { porta = readFileSync(join(perfil, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); } catch {}
  }
  if (!porta) { chrome.kill(); throw new Error('Chrome não abriu a porta de depuração'); }
  const cdp = `http://127.0.0.1:${porta}`;
  const servidor = raiz ? await serve(raiz) : null;
  const paginas = new Set();

  /* CADA PÁGINA NUM CONTEXTO PRÓPRIO (17/11/2026). As abas do mesmo perfil
   * dividem o localStorage: a sonda de mortos clicava "Recolher navegação"
   * numa tela e as outras abas carregavam a navegação recolhida — os títulos
   * de grupo saíam "sem caixa". Contexto novo = armazenamento novo. */
  let navegador = null;
  async function canalDoNavegador() {
    if (navegador) return navegador;
    const { webSocketDebuggerUrl } = await (await fetch(`${cdp}/json/version`)).json();
    const ws = new WebSocket(webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let n = 0; const pend = new Map();
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
    const cmd = (method, params = {}) => new Promise((res, rej) => { const i = ++n; pend.set(i, (m) => (m.error ? rej(new Error(m.error.message)) : res(m.result))); ws.send(JSON.stringify({ id: i, method, params })); });
    navegador = { ws, cmd };
    return navegador;
  }

  async function pagina() {
    const b = await canalDoNavegador();
    const { browserContextId } = await b.cmd('Target.createBrowserContext', { disposeOnDetach: false });
    const { targetId } = await b.cmd('Target.createTarget', { url: 'about:blank', browserContextId });
    const alvo = { id: targetId, contexto: browserContextId, webSocketDebuggerUrl: `ws://127.0.0.1:${porta}/devtools/page/${targetId}` };
    const ws = new WebSocket(alvo.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let seq = 0;
    const pend = new Map();
    const erros = [];
    const ouvintes = new Map();
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
      if (m.method === 'Runtime.exceptionThrown') {
        const d = m.params.exceptionDetails;
        erros.push({ tipo: 'exceção', texto: (d.exception?.description || d.text || '').split('\n')[0] });
      } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
        erros.push({ tipo: 'console', texto: m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200) });
      } else if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) {
        erros.push({ tipo: 'rede', texto: `${m.params.response.status} ${m.params.response.url.replace(servidor?.url || '', '')}` });
      }
      for (const f of ouvintes.get(m.method) || []) f(m.params);
    };
    const cmd = (method, params = {}, { limite = 30000 } = {}) => new Promise((res, rej) => {
      const i = ++seq;
      const t = setTimeout(() => { pend.delete(i); rej(new Error(`${method}: sem resposta em ${limite / 1000}s`)); }, limite);
      pend.set(i, (m) => { clearTimeout(t); m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result); });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
    const uma = (evento) => new Promise((r) => {
      const f = (p) => { ouvintes.get(evento).delete(f); r(p); };
      if (!ouvintes.has(evento)) ouvintes.set(evento, new Set());
      ouvintes.get(evento).add(f);
    });
    await cmd('Page.enable');
    await cmd('Runtime.enable');
    await cmd('Network.enable');
    // Toda aba se comporta como a da frente (foco, :focus-visible, rAF).
    await cmd('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {});

    /** Avalia uma expressão (promessas resolvem). Exceção vira erro com o texto.
     *  `{ limite }` em ms troca os 30s padrão (varredura longa pede mais). */
    async function ev(expr, opcoes) {
      const r = await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, opcoes);
      if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'erro').split('\n')[0]);
      return r.result?.value;
    }

    /** Navega com a viewport pedida e espera carregar + fontes. Zera `erros`. */
    async function vai(url, { largura = 1440, altura = 900, mobile = false, espera = 250 } = {}) {
      erros.length = 0;
      // Cada tela começa sem a preferência que a anterior gravou (navegação
      // recolhida, tema, favoritos): mesma origem, mesmo contexto.
      try { await cmd('Storage.clearDataForOrigin', { origin: new URL(url).origin, storageTypes: 'local_storage,session_storage' }); } catch {}
      await cmd('Emulation.setDeviceMetricsOverride', { width: largura, height: altura, deviceScaleFactor: 1, mobile });
      if (mobile) await cmd('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      const carregou = uma('Page.loadEventFired');
      await cmd('Page.navigate', { url });
      await Promise.race([carregou, dorme(15000)]);
      await ev('document.fonts ? document.fonts.ready.then(() => true) : true').catch(() => {});
      await dorme(espera);
    }

    async function foto({ clip } = {}) {
      const r = await cmd('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { scale: 1, ...clip } } : {}) });
      return Buffer.from(r.data, 'base64');
    }

    async function tecla(key, code = key, vk = 0, mods = 0) {
      await cmd('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, modifiers: mods });
      await cmd('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, modifiers: mods });
    }

    async function fecha() {
      paginas.delete(p);
      try { ws.close(); } catch {}
      await fetch(`${cdp}/json/close/${alvo.id}`).catch(() => {});
      await navegador?.cmd('Target.disposeBrowserContext', { browserContextId: alvo.contexto }).catch(() => {});
    }

    const p = { cmd, ev, vai, foto, tecla, erros, fecha, uma };
    paginas.add(p);
    return p;
  }

  async function fecha() {
    for (const p of [...paginas]) await p.fecha();
    try { navegador?.ws.close(); } catch {}
    chrome.kill();
    if (servidor) await servidor.fecha();
    for (let i = 0; i < 10; i++) {
      try { rmSync(perfil, { recursive: true, force: true }); break; } catch { await dorme(200); }
    }
  }

  return { base: servidor?.url || null, cdp, pagina, fecha };
}
