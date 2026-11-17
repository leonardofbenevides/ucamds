// O foco de teclado se vê, inteiro e descoberto?
//
// Percorre a tela com Tab (até 80 paradas) e, em cada parada, pergunta três
// coisas que já custaram defeitos (memórias dsucam-anel-de-foco e
// dsucam-equalizacao-telas):
//   1. HÁ SINAL: a foto do controle com foco difere da foto sem foco. Por
//      pixel, não por estilo: o anel mora às vezes no pai via :has() ou
//      :focus-within, ou num pseudo-elemento, e ler estilos errava (o seletor
//      de campus da faixa tinha anel e saía "sem sinal").
//   2. NÃO ESTÁ COBERTO: o centro do controle não está sob uma barra fixa ou
//      grudada (o rodapé fixo escondia o campo; o par obrigatório do sticky no
//      pé é scroll-margin-block-end).
//   3. NÃO ESTÁ RECORTADO: a faixa onde o anel é desenhado (largura + offset
//      do outline, ou espalhamento da sombra) cabe no ancestral que recorta.
//      Anel por dentro (offset negativo) não tem o que recortar.

import { lePng, pixelsDiferentes } from '../lib/png.mjs';

export const nome = 'foco';
export const pergunta = 'em cada parada do Tab, o anel aparece, inteiro e sem nada por cima?';

const PARADA = `(() => {
  const e = document.activeElement;
  if (!e || e === document.body || e === document.documentElement) return null;
  // A barra do protótipo (Ver documentação) é do site, não da tela.
  if (e.closest('.ucamds-bar')) return null;
  const rotulo = (x) => (x.getAttribute('aria-label') || x.textContent || x.placeholder || x.getAttribute('data-acao') || x.id || '').trim().replace(/\\s+/g, ' ').slice(0, 30);
  const nome = (x) => x.tagName.toLowerCase() + (typeof x.className === 'string' && x.className.trim() ? '.' + x.className.trim().split(/\\s+/)[0] : '');
  const r = e.getBoundingClientRect();
  const s = getComputedStyle(e);
  let ext = 0;
  if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) ext = parseFloat(s.outlineWidth) + parseFloat(s.outlineOffset || 0);
  else if (s.boxShadow && s.boxShadow !== 'none') {
    for (const sh of s.boxShadow.split(/,(?![^(]*\\))/)) {
      if (/inset/.test(sh)) continue;
      const n = (sh.replace(/(rgba?|oklab|oklch|color)\\([^)]*\\)/g, '').match(/-?[\\d.]+px/g) || []).map(parseFloat);
      ext = Math.max(ext, (n[3] || 0) + Math.max(Math.abs(n[0] || 0), Math.abs(n[1] || 0)));
    }
  }
  let coberto = null, recorte = null;
  if (r.width >= 2 && r.height >= 2) {
    const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
    const h = document.elementFromPoint(cx, cy);
    if (h && !(e === h || e.contains(h) || h.contains(e) || (e.labels && [...e.labels].some((l) => l.contains(h))))) {
      for (let a = h; a && a !== document.body; a = a.parentElement) {
        const p = getComputedStyle(a).position;
        if (p === 'fixed' || p === 'sticky') { if (!a.contains(e)) coberto = nome(a); break; }
      }
    }
    if (ext > 0.5) {
      for (let a = e.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
        const sa = getComputedStyle(a);
        const corta = (v) => /(auto|scroll|hidden|clip)/.test(v);
        if (!corta(sa.overflowX) && !corta(sa.overflowY)) continue;
        const b = a.getBoundingClientRect();
        const bl = b.left + a.clientLeft, bt = b.top + a.clientTop, br = bl + a.clientWidth, bb = bt + a.clientHeight;
        const dentro = r.right > bl && r.left < br && r.bottom > bt && r.top < bb;
        const sx = corta(sa.overflowX) && (r.left - ext < bl - 0.5 || r.right + ext > br + 0.5);
        const sy = corta(sa.overflowY) && (r.top - ext < bt - 0.5 || r.bottom + ext > bb + 0.5);
        if ((sx || sy) && dentro) { recorte = nome(a); break; }
      }
    }
  }
  // Recorte na parte À VISTA; o clip do captureScreenshot é em coordenadas do
  // DOCUMENTO, então soma a rolagem (sem isso, com a página rolada, as duas
  // fotos pegavam outro lugar e saíam iguais).
  // ONDE O ANEL PODE ESTAR. O link esticado (cartão, item de lista, anexo)
  // desenha o anel no ::after que cobre o contêiner, e a caixa/rádio no
  // desenho ao lado do input escondido: fotografar só a caixa do elemento
  // dava "sem sinal" para anel que existe. A foto cobre o contêiner do
  // ::after posicionado, ou o rótulo do input.
  let area = r;
  const depois = getComputedStyle(e, '::after');
  if (depois.content !== 'none' && depois.position === 'absolute') {
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      if (getComputedStyle(a).position !== 'static') { area = a.getBoundingClientRect(); break; }
    }
  } else if (/^(checkbox|radio)$/.test(e.type) && e.labels && e.labels.length) {
    const l = e.labels[0].getBoundingClientRect();
    area = { left: Math.min(r.left, l.left), top: Math.min(r.top, l.top), right: Math.max(r.right, l.right), bottom: Math.max(r.bottom, l.bottom) };
  }
  const m = Math.ceil(ext) + 4;
  const x0 = Math.max(0, area.left - m), y0 = Math.max(0, area.top - m);
  const clip = { x: x0 + scrollX, y: y0 + scrollY, width: Math.min(innerWidth, area.right + m) - x0, height: Math.min(innerHeight, area.bottom + m) - y0 };
  window.__focoAtual = e;
  return { id: nome(e) + ' "' + rotulo(e) + '"', w: r.width, h: r.height, clip, coberto, recorte };
})()`;

/* O que entra ANIMADO (o "Pular para o conteúdo" desliza 60px em ~300ms)
 * medido no meio do caminho sai "sem caixa" e "coberto pela faixa". Espera as
 * animações finitas acabarem; as infinitas (carregando) não acabam nunca. */
const ASSENTA = `Promise.race([
  Promise.all(document.getAnimations()
    // Só as do relógio do documento: a animação ligada à rolagem (ucam-rolo)
    // não termina nunca, e esperar por ela custava 1s em toda parada.
    .filter((a) => a.timeline === document.timeline && a.effect && a.effect.getComputedTiming().iterations !== Infinity)
    .map((a) => a.finished.catch(() => null))),
  new Promise((r) => setTimeout(r, 1000)),
]).then(() => true)`;

async function foto(p, clip) {
  const r = await p.cmd('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } });
  return lePng(Buffer.from(r.data, 'base64'));
}

export async function roda(p, { url }) {
  await p.vai(url(), { largura: 1440, altura: 900 });
  await p.ev('document.body.focus(); window.scrollTo(0, 0); true');
  const achados = new Map();
  const add = (chave) => { if (!achados.has(chave)) achados.set(chave, { chave, detalhe: '' }); };
  const vistos = new Set();
  for (let i = 0; i < 80; i++) {
    await p.tecla('Tab', 'Tab', 9);
    await new Promise((r) => setTimeout(r, 30));
    await p.ev(ASSENTA).catch(() => {});
    let r;
    try { r = await p.ev(PARADA); } catch { break; }
    if (!r) continue;
    if (vistos.has(r.id)) break; // deu a volta
    vistos.add(r.id);
    if (r.coberto) add(`coberto por ${r.coberto}: ${r.id}`);
    if (r.recorte) add(`anel recortado por ${r.recorte}: ${r.id}`);
    if (r.w < 2 || r.h < 2 || r.clip.width < 2 || r.clip.height < 2) { add(`foco em elemento sem caixa visível: ${r.id}`); achados.get(`foco em elemento sem caixa visível: ${r.id}`).detalhe = `caixa ${Math.round(r.w)}×${Math.round(r.h)}, foto ${JSON.stringify(r.clip)}`; continue; }
    try {
      const com = await foto(p, r.clip);
      await p.ev('window.__focoAtual.blur(); true');
      await new Promise((res) => setTimeout(res, 30));
      await p.ev(ASSENTA).catch(() => {});
      const sem = await foto(p, r.clip);
      await p.ev('window.__focoAtual.focus({ preventScroll: true }); true');
      // Meia volta de 1px em volta da caixa: menos que isso não é um anel.
      if (pixelsDiferentes(com, sem) < Math.min(r.w + r.h, (r.clip.width + r.clip.height) / 2)) add(`sem sinal de foco: ${r.id}`);
    } catch { break; }
  }
  return [...achados.values()];
}
