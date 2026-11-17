// Sem rolagem horizontal da página em 320, 390, 1024 e 1440?
//
// A 390 e 320 a viewport é de telefone (`mobile: true`); sem isso o Chrome
// alarga a viewport até caber o conteúdo e a rolagem some da medida
// (memória dsucam-responsividade). Quem rola dentro de um contêiner próprio
// (a tabela no invólucro, a fileira de chips) não conta: a página não rola.
// O culpado é o elemento mais externo que passa da borda sem ancestral que
// recorte ou role.

export const nome = 'rolagem';
export const pergunta = 'a página rola na horizontal em 320, 390, 1024 ou 1440?';

const LARGURAS = [
  { largura: 320, altura: 720, mobile: true },
  { largura: 390, altura: 844, mobile: true },
  { largura: 1024, altura: 768, mobile: false },
  { largura: 1440, altura: 900, mobile: false },
];

const MEDE = `(() => {
  const vw = document.documentElement.clientWidth;
  const excesso = document.documentElement.scrollWidth - vw;
  if (excesso <= 1) return null;
  const contido = (el) => {
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return true;
      if (s.position === 'fixed') return false;
    }
    return false;
  };
  const nome = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
    (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
  const culpados = [];
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (!r.width || r.right <= vw + 1) continue;
    if (getComputedStyle(el).position === 'fixed') continue;
    if (contido(el)) continue;
    // Só o mais externo: se o pai também passa, o pai é o culpado.
    const pai = el.parentElement && el.parentElement.getBoundingClientRect();
    if (pai && pai.right > vw + 1 && el.parentElement !== document.body && !contido(el.parentElement)) continue;
    culpados.push(nome(el) + ' +' + Math.round(r.right - vw) + 'px');
    if (culpados.length >= 3) break;
  }
  return { excesso, culpados };
})()`;

export async function roda(p, { url }) {
  const achados = [];
  for (const v of LARGURAS) {
    await p.vai(url(), v);
    const r = await p.ev(MEDE);
    if (r) {
      achados.push({
        chave: `rola a ${v.largura}px`,
        detalhe: `${r.excesso}px a mais · ${r.culpados.join(', ') || 'culpado não isolado'}`,
      });
    }
  }
  return achados;
}
