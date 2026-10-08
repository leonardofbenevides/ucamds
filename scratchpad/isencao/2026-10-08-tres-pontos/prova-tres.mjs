// Prova dos três pontos de 08/10/2026 na análise da isenção:
//  1. clicar no fundo (::backdrop) fecha o diálogo de documentos;
//  2. o campo Observação preenche o cartão, e o contador termina onde o campo termina;
//  3. o Desfazer do rascunho da IA é um botão do DS, não o botão nativo do navegador.
// Precisa de Chrome com CDP (CDP=http://localhost:9471) e das telas servidas (BASE=http://localhost:5471).
const CDP = process.env.CDP || 'http://localhost:9471';
const BASE = process.env.BASE || 'http://localhost:5471';
async function abre(tela, largura = 1440) {
  const alvo = await (await fetch(`${CDP}/json/new?${BASE}/t/isencao-${tela}.html`, { method: 'PUT' })).json();
  const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map(); const erros = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception || {}).description); };
  const cmd = (m, p = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: largura, height: 900, deviceScaleFactor: 1, mobile: false });
  await cmd('Page.reload'); await new Promise((r) => setTimeout(r, 1500));
  const js = async (x) => { const r = await cmd('Runtime.evaluate', { expression: `(async () => { ${x} })()`, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result.result.value; };
  const clique = async (x, y) => { await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); };
  const foto = async (arquivo) => { const r = await cmd('Page.captureScreenshot', { format: 'png' }); (await import('node:fs')).writeFileSync(arquivo, Buffer.from(r.result.data, 'base64')); };
  const fecha = async () => { await fetch(`${CDP}/json/close/${alvo.id}`).catch(() => {}); await new Promise((r) => setTimeout(r, 200)); };
  return { js, clique, foto, erros, fecha };
}
let falhas = 0, total = 0;
const prova = (nome, ok, det = '') => { total++; if (!ok) falhas++; console.log((ok ? 'ok    ' : 'FALHA ') + nome + (ok ? '' : '  <- ' + (typeof det === 'string' ? det : JSON.stringify(det)))); };
const W = `const w = (n) => new Promise((r) => setTimeout(r, n)); const q = (s) => document.querySelector(s);`;
const FOTOS = process.env.FOTOS || '';
{
  const p = await abre('analise');
  // 1. diálogo: abre, clica no fundo, fecha
  const d1 = await p.js(`${W} q("[data-abre-dialogo='is-docs']").click(); await w(200); const d = q('#is-docs'); const r = d.getBoundingClientRect(); return { aberto: d.open, rect: { l: r.left, t: r.top, r: r.right, b: r.bottom } };`);
  prova('diálogo de documentos abre pelo clipe', d1.aberto === true, d1);
  await p.clique(20, 20); // canto da página: fora da caixa, sobre o backdrop
  await new Promise((r) => setTimeout(r, 200));
  const d2 = await p.js(`${W} const d = q('#is-docs'); return { aberto: d.open, foco: document.activeElement && (document.activeElement.getAttribute('data-abre-dialogo') || document.activeElement.tagName) };`);
  prova('clicar no fundo FECHA o diálogo (contrato: dismissible)', d2.aberto === false, d2);
  prova('e o foco volta ao clipe que abriu', d2.foco === 'is-docs', d2);
  // clique DENTRO da caixa não fecha
  await p.js(`${W} q("[data-abre-dialogo='is-docs']").click(); await w(200); return q('#is-docs').open;`);
  const d3 = await p.js(`${W} const d = q('#is-docs'); const r = d.getBoundingClientRect(); return { x: Math.round(r.left + 12), y: Math.round(r.top + 12) };`);
  await p.clique(d3.x, d3.y);
  await new Promise((r) => setTimeout(r, 200));
  const d4 = await p.js(`${W} return q('#is-docs').open;`);
  prova('clicar DENTRO da caixa não fecha', d4 === true, d4);
  await p.js(`${W} q('#is-docs').close(); await w(100); return 1;`);
  // 2. textarea preenche o cartão
  const t = await p.js(`${W} const ta = q('#is-obs'); const campo = ta.closest('.ucam-field'); const cartao = campo.closest('.ucam-card'); const cont = q('#is-obs-c');
    const r = (e) => e.getBoundingClientRect(); return { ta: r(ta).right, campo: r(campo).right, cartao: r(cartao).right, contador: r(cont).right, taW: r(ta).width, campoW: r(campo).width };`);
  prova('Observação preenche o campo (borda direita do textarea = do campo)', Math.abs(t.ta - t.campo) <= 1, t);
  prova('contador termina onde o textarea termina', Math.abs(t.contador - t.ta) <= 1, t);
  // 3. Desfazer do rascunho da IA
  const ia = await p.js(`${W} const lin = q("tr[data-disciplina='Direito Civil I']") || q('tr[data-disciplina]'); const b = lin.querySelector('[data-decisao] button[data-valor="documento"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); await w(150);
    q("[data-acao='ia-rascunhar-observacao']").click(); await w(250); const btn = q('#is-obs-ia button'); if (!btn) return { btn: null };
    const cs = getComputedStyle(btn); const corpo = getComputedStyle(q("[data-acao='ia-rascunhar-observacao']"));
    return { classe: btn.className, mesmaFonte: cs.fontFamily === corpo.fontFamily, fundo: cs.backgroundColor, borda: cs.borderTopStyle + ' ' + cs.borderTopWidth, altura: btn.getBoundingClientRect().height, texto: btn.textContent.trim() };`);
  prova('Desfazer existe após Rascunhar com IA', ia.btn !== null && ia.texto === 'Desfazer', ia);
  prova('Desfazer é botão do DS (ucam-btn), não link', /\bucam-btn\b/.test(ia.classe || '') && !/ucam-link/.test(ia.classe || ''), ia);
  prova('Desfazer usa a fonte dos outros botões do DS, não a do navegador', ia.mesmaFonte === true, ia);
  if (FOTOS) { await p.js(`${W} q('#is-obs').scrollIntoView({ block: 'center' }); await w(200); return 1;`); await p.foto(FOTOS + '/observacao.png'); }
  prova('sem exceção no console', p.erros.length === 0, p.erros);
  await p.fecha();
}
console.log(`\n${total - falhas}/${total} ok`);
process.exit(falhas ? 1 : 0);
