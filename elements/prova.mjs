/**
 * Prova de INTERAÇÃO do Trilho A+ (ADR-010) numa página sem framework.
 *
 * Componente que só foi visto compilando não foi visto funcionando, e captura
 * de tela não prova combobox. Este script dirige o Chrome pelo protocolo de
 * depuração e verifica o que o contrato promete.
 *
 * Como rodar:
 *   1. pnpm --filter @ucam/elements build
 *   2. sirva a RAIZ do repositório em :5200 (a página busca /dist/elements/*)
 *   3. chrome --headless=new --remote-debugging-port=9333 \
 *        --user-data-dir=<temp> http://localhost:5200/elements/prova.html
 *   4. node elements/prova.mjs
 *
 * ARMADILHA que já custou um diagnóstico errado: a base FILTRA ESCONDENDO o
 * item, não removendo do DOM. Contar `[role=option]` conta as opções ocultas
 * junto e faz o filtro parecer quebrado. Conte por VIS, que descarta [hidden].
 */
const BASE = 'http://localhost:9333';
const lista = await (await fetch(`${BASE}/json/list`)).json();
const p = lista.find((t) => t.type === 'page' && t.url.includes('prova.html'));
const ws = new WebSocket(p.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pend = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) pend.get(m.id)(m), pend.delete(m.id);
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++id;
    pend.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const evalJs = async (e) =>
  (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }))
    .result?.result?.value;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** Espera uma condição virar verdadeira, em vez de chutar um sleep. */
async function ate(expr, ms = 4000) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) {
    if (await evalJs(`!!(${expr})`)) return true;
    await espera(100);
  }
  return false;
}

const ok = [];
const falha = [];
const checa = (nome, cond, det = '') => (cond ? ok : falha).push(`${nome}${det ? ' → ' + det : ''}`);

await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url: 'http://localhost:5200/elements/prova.html' });
await ate(`customElements.get('ucam-combobox')`, 8000);

const IN = `document.querySelector('#cb input[role=combobox]')`;
const LB = `document.querySelector('[role=listbox]')`;
const VIS = `[...(document.querySelector('[role=listbox]')?.querySelectorAll('[role=option]') ?? [])].filter(o => !o.hasAttribute('hidden'))`;

// 1. registro
const reg = await evalJs(
  `JSON.stringify(['ucam-button','ucam-text-field','ucam-select','ucam-combobox'].map(n => [n, !!customElements.get(n)]))`,
);
checa('os 4 custom elements se registram', !JSON.parse(reg).some(([, v]) => !v), reg);

// 2. preflight não vazou para a cromagem legada
const leg = await evalJs(`
  (() => { const ul = document.querySelector('ul.legado'); const cs = getComputedStyle(ul);
    return JSON.stringify({ listStyle: cs.listStyleType, padLeft: cs.paddingLeft,
      fonte: getComputedStyle(document.body).fontFamily.split(',')[0] }); })()`);
const l = JSON.parse(leg);
checa(
  'preflight do Tailwind NÃO vaza para a página',
  l.listStyle === 'square' && parseFloat(l.padLeft) > 20 && /Verdana/i.test(l.fonte),
  leg,
);

// 3. o botão entrega o clique à página
await evalJs(`document.querySelector('#b1 button').click()`);
await espera(200);
const sb = await evalJs(`document.querySelector('#saida').textContent`);
checa('clique no ucam-button chega ao script da página', sb.includes('Salvar clicado'));

// 4. o painel abre
await evalJs(`(() => { const i = ${IN}; i.focus(); i.click(); })()`);
const abriu = await ate(`${LB}`);
const est = await evalJs(`
  (() => { const p = ${LB};
    return JSON.stringify({ expanded: ${IN}.getAttribute('aria-expanded'),
      controls: ${IN}.getAttribute('aria-controls'),
      idListbox: p ? p.id : null,
      opcoes: p ? ${VIS}.length : 0 }); })()`);
const e0 = JSON.parse(est);
checa('painel abre com as 6 opções', abriu && e0.opcoes === 6, est);
checa('aria-expanded=true ao abrir', e0.expanded === 'true');
checa('aria-controls aponta o listbox', !!e0.controls && e0.controls === e0.idListbox);

// 5. digitar filtra
await evalJs(`
  (() => { const i = ${IN};
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    set.call(i, 'col'); i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
await ate(`${VIS}.length === 2`);
const filtrado = await evalJs(`JSON.stringify(${VIS}.map(o => o.textContent.trim()))`);
checa('digitar "col" reduz aos 2 Colegiados', JSON.parse(filtrado).length === 2, filtrado);

// 6. teclado: ArrowDown move o activedescendant
await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 40, key: 'ArrowDown', code: 'ArrowDown' });
await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 40, key: 'ArrowDown', code: 'ArrowDown' });
await espera(300);
const ad = await evalJs(`${IN}.getAttribute('aria-activedescendant')`);
checa('ArrowDown move aria-activedescendant', !!ad, String(ad));

// 7. Enter escolhe e o valor sai pelo evento para a página
await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, key: 'Enter', code: 'Enter' });
await espera(500);
const fim = await evalJs(`document.querySelector('#saida').textContent`);
checa('Enter escolhe e valueChange chega à página', /colegiado/.test(fim), fim.replace(/\n/g, ' | '));

// 8. estado vazio do contrato
await evalJs(`
  (() => { const i = ${IN};
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    i.focus(); i.click(); set.call(i, 'zzzz'); i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
await espera(700);
const vazio = await evalJs(`
  (() => { const p = ${LB}; if (!p) return 'sem painel';
    return ${VIS}.length + ' | visíveis'; })()`);
checa('busca sem resultado mostra o estado vazio', /0 \|/.test(vazio), vazio);

console.log('\n== PASSOU ==');
ok.forEach((s) => console.log('  ✓ ' + s));
if (falha.length) {
  console.log('\n== FALHOU ==');
  falha.forEach((s) => console.log('  ✕ ' + s));
}
console.log(`\n${ok.length} de ${ok.length + falha.length} verificações`);
ws.close();
process.exit(falha.length ? 1 : 0);
