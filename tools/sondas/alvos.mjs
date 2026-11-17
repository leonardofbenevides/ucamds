// Alvo de toque a 390px: 24px ou vão (WCAG 2.5.8)?
//
// A regra da casa (memória dsucam-responsividade): alvo pequeno se resolve
// com EXTENSOR (::after que alarga a área de clique) ou com VÃO até o vizinho,
// nunca com peça maior. A medida por caixa não vê o extensor, então a sonda
// pergunta ao navegador: nos quatro pontos a 12px do centro, quem recebe o
// toque? O próprio controle (ou o rótulo dele) ou ninguém interativo: passa.
// Outro controle: o toque de um cai no vizinho — reprova. Link dentro de frase
// é exceção da própria WCAG.

export const nome = 'alvos';
export const pergunta = 'a 390px, algum alvo menor que 24px tem o vizinho a menos de 12px do centro?';

const SONDA = `(() => {
  const SEL = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=checkbox], [role=switch], [role=option], [role=menuitem], [tabindex="0"]';
  const dono = (h) => h && h.closest(SEL + ', label');
  const rotulo = (e) => (e.getAttribute('aria-label') || e.textContent || e.placeholder || e.getAttribute('data-acao') || e.id || '').trim().replace(/\\s+/g, ' ').slice(0, 30);
  const nome = (e) => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/)[0] : '') + ' "' + rotulo(e) + '"';
  const emFrase = (e) => e.tagName === 'A' && e.parentElement && /^(P|LI|SPAN|TD|DD)$/.test(e.parentElement.tagName) &&
    e.parentElement.textContent.trim().length > e.textContent.trim().length + 12;
  const proprio = (e, h) => {
    if (!h) return true;
    if (e === h || e.contains(h) || h.contains(e)) return true;
    if (e.labels && [...e.labels].some((l) => l.contains(h))) return true;
    const d = dono(h);
    if (!d) return true;
    if (d === e || d.contains(e) || e.contains(d)) return true;
    if (d.tagName === 'LABEL' && (d.control === e || d.contains(e))) return true;
    return false;
  };
  const ruins = [];
  const vistos = new Set();
  for (const e of document.querySelectorAll(SEL)) {
    if (!e.getClientRects().length || e.closest('[hidden], [inert], [aria-hidden=true]')) continue;
    if (e.disabled) continue;
    let r = e.getBoundingClientRect();
    if (r.width >= 24 && r.height >= 24) continue;
    if (r.width === 0 || r.height === 0) continue;
    if (emFrase(e)) continue;
    // input escondido atrás de um desenho (caixa, interruptor): quem recebe é o rótulo.
    if (/^(checkbox|radio)$/.test(e.type) && e.labels && e.labels.length) {
      const lr = e.labels[0].getBoundingClientRect();
      if (lr.width >= 24 && lr.height >= 24) continue;
    }
    e.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    r = e.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const pontos = [[cx - 12, cy], [cx + 12, cy], [cx, cy - 12], [cx, cy + 12]];
    let vizinho = null;
    for (const [x, y] of pontos) {
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
      const h = document.elementFromPoint(x, y);
      if (!proprio(e, h)) { vizinho = dono(h); break; }
    }
    if (!vizinho) continue;
    const chave = nome(e) + ' × ' + nome(vizinho);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    ruins.push({ chave, tam: Math.round(r.width) + '×' + Math.round(r.height) });
  }
  return ruins;
})()`;

export async function roda(p, { url }) {
  await p.vai(url(), { largura: 390, altura: 844, mobile: true });
  const r = await p.ev(SONDA);
  return r.map((x) => ({ chave: x.chave, detalhe: x.tam + 'px' }));
}
