// Todo controle que promete interação muda alguma coisa?
//
// Portada de scratchpad/sonda-mortos.mjs (29/09/2026), que levou 54 mortos a 0
// (memória dsucam-controles-vivos). Clica (ou digita em) tudo que promete
// interação e pergunta uma coisa só: o documento mudou?
//
// AS CINCO ARMADILHAS, todas pagas antes:
//   1. `checked` e `value` são propriedade, não atributo — a assinatura lê as
//      propriedades, senão toda caixa e todo interruptor sai morto.
//   2. O segmento, rádio ou página JÁ ESCOLHIDO não muda nada, e está certo.
//   3. Baixar, imprimir, anexar, copiar e e-mail agem fora do DOM.
//   4. Submeter e navegar são agir — o submit é segurado e contado, o
//      data-destino conta vivo sem clique (a página sairia do ar).
//   5. Gaveta, diálogo ou menu que o clique abriu deixa o resto inerte: fecha
//      antes do próximo controle.

export const nome = 'mortos';
export const pergunta = 'algum botão, aba, busca, caixa ou opção não muda nada ao ser acionado?';

const SONDA = `(async () => {
  const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
  window.print = function () {};
  const assina = () => {
    let s = '';
    const todos = document.querySelectorAll('body *');
    for (let i = 0; i < todos.length; i++) {
      const e = todos[i];
      s += (e.hidden ? '1' : '0') + (e.getAttribute('aria-pressed') || '') + (e.getAttribute('aria-selected') || '') +
           (e.getAttribute('aria-expanded') || '') + (e.getAttribute('aria-checked') || '') + (e.getAttribute('aria-sort') || '') +
           (typeof e.className === 'string' ? e.className : '') +
           (e.type === 'checkbox' || e.type === 'radio' ? (e.checked ? 'C' : 'c') + (e.indeterminate ? 'M' : '') : '') +
           (typeof e.value === 'string' ? e.value : '') + (e.getAttribute('data-eco') || '') + (e.getAttribute('style') || '') + (e.open ? 'O' : '') + '|';
    }
    s += document.body.textContent + ':' + (document.activeElement && document.activeElement.id) + ':' + Math.round(window.scrollY) + ':' + location.hash;
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return h + '/' + s.length;
  };
  const rotulo = (e) => (e.getAttribute('aria-label') || e.placeholder || e.textContent || e.id || e.getAttribute('data-acao') || '')
    .trim().replace(/\\s+/g, ' ').slice(0, 46);
  const foraDoDom = ['exportar', 'imprimir', 'anexar', 'copiar', 'baixar', 'e-mail', 'download'];
  let submetidos = 0;
  document.addEventListener('submit', function (ev) { ev.preventDefault(); submetidos++; }, true);
  const fechaAberto = async () => {
    let fechou = false;
    for (const g of document.querySelectorAll('.ucam-drawer:not([hidden])')) { const x = g.querySelector('[data-fecha-gaveta]'); if (x) { x.click(); fechou = true; } }
    for (const d of document.querySelectorAll('dialog[open]')) { d.close(); fechou = true; }
    if (document.querySelector('[aria-expanded="true"]')) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); fechou = true; }
    if (fechou) await dorme(120);
  };

  const mortos = [];
  let vivos = 0;
  const alvos = [...document.querySelectorAll(
    'button, [role=tab], input[type=search], input[type=checkbox], input[type=radio], [data-listbox], .ucam-option, summary'
  )];
  for (const el of alvos) {
    if (!el.isConnected || el.closest('a')) continue;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('[inert]')) continue;
    if (!el.getClientRects().length) continue;
    if (el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-selected') === 'true' ||
        el.getAttribute('aria-current') === 'page' || el.getAttribute('aria-checked') === 'true') continue;
    if (el.type === 'radio' && el.checked) continue;
    const nome = rotulo(el);
    const acao = (el.getAttribute('data-acao') || '') + ' ' + nome.toLowerCase();
    if (foraDoDom.some((p) => acao.indexOf(p) >= 0)) continue;
    if (el.hasAttribute('data-destino')) { vivos++; continue; }

    const antes = assina();
    if (el.tagName === 'INPUT' && el.type === 'search') {
      el.value = 'zzq';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await dorme(90);
      const dep = assina();
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await dorme(60);
      if (dep === antes) mortos.push(nome + ' [busca]'); else vivos++;
      continue;
    }
    const urlAntes = location.href;
    const subAntes = submetidos;
    el.click();
    await dorme(110);
    if (submetidos > subAntes || location.href !== urlAntes) vivos++;
    else if (assina() === antes) mortos.push(nome + ' [' + el.tagName.toLowerCase() + (el.getAttribute('role') ? ' ' + el.getAttribute('role') : '') + ']');
    else vivos++;
    await fechaAberto();
  }
  return { vivos, mortos };
})()`;

export async function roda(p, { url }) {
  await p.vai(url(), { largura: 1440, altura: 1000 });
  // A tela de entrada navega ao submeter; o resto do relatório vale do mesmo jeito.
  let r;
  // Um clique a cada 110ms: tela de 200 controles passa de 30s.
  try { r = await p.ev(SONDA, { limite: 240000 }); }
  catch (e) { return [{ chave: 'sonda interrompida', detalhe: e.message }]; }
  if (!r) return [{ chave: 'sonda interrompida', detalhe: 'a página saiu do ar no meio da varredura' }];
  const vistos = new Map();
  for (const m of r.mortos) vistos.set(m, (vistos.get(m) || 0) + 1);
  return [...vistos].map(([m, n]) => ({ chave: m, detalhe: n > 1 ? `${n} vezes` : '' }));
}
