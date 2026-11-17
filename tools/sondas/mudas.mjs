// A ação chega a quem não vê a tela?
//
// Portada de scratchpad/sonda-mudas.mjs (21/09/2026). A sonda de mortos
// pergunta se o documento mudou; esta pergunta PARA QUEM. Selo que troca de
// cor e linha que entra na lista não existem para quem ouve a tela, e toast
// está fora do catálogo. O eco sai por um destes canais:
//   1. região viva ([data-anuncio]) ou role=status/alert que mudou de texto
//   2. estado ARIA em qualquer lugar (expanded, pressed, checked, selected, invalid, current, busy)
//   3. o foco, que se moveu
//   4. o nome acessível do próprio controle
//   5. navegação, impressão ou diálogo aberto
// Nenhum deles: a ação é MUDA.
//
// Uma ação por vez, com recarga entre elas: estado acumulado faz ação boa
// parecer muda (concluir duas vezes não muda nada, e está certo).

export const nome = 'mudas';
export const pergunta = 'alguma ação (data-acao) acontece sem eco para leitor de tela?';

/* Pontos cegos da sonda, com o motivo — não são mudez. */
const CEGOS = {
  anexar: 'abre o seletor de arquivos do sistema, que não abre em headless',
  email: 'entrega o mailto: ao sistema operacional',
  'limpar-selecao': 'sem nada marcado, limpar em silêncio está certo',
};

const FOTO = `(() => {
  const vivas = [...document.querySelectorAll('[data-anuncio], [role="status"], [role="alert"]')].map((r) => r.textContent.trim()).join(' ~ ');
  let aria = '';
  for (const e of document.querySelectorAll('[aria-expanded],[aria-pressed],[aria-checked],[aria-selected],[aria-invalid],[aria-current],[aria-busy],[aria-sort]')) {
    aria += ['expanded', 'pressed', 'checked', 'selected', 'invalid', 'current', 'busy', 'sort'].map((k) => e.getAttribute('aria-' + k) || '').join('') + '|';
  }
  for (const e of document.querySelectorAll('input[type=checkbox], input[type=radio]')) aria += e.checked ? 'C' : 'c';
  const f = document.activeElement;
  return {
    vivas, aria,
    foco: f ? f.tagName + '#' + (f.id || '') + '.' + String(f.className || '').slice(0, 30) + ':' + (f.getAttribute('data-acao') || '') : '',
    onde: location.pathname + location.hash,
    dialogo: !!document.querySelector('dialog[open], [role=dialog]:not([hidden]), .ucam-drawer:not([hidden])'),
  };
})()`;

const ACOES = `(() => {
  const vis = (e) => e.getClientRects().length && !e.closest('[hidden], [inert]') && !e.disabled && e.getAttribute('aria-disabled') !== 'true';
  return [...new Set([...document.querySelectorAll('[data-acao]')].filter(vis).map((e) => e.getAttribute('data-acao')))];
})()`;

const nomeDe = (acao) => `(() => { const b = [...document.querySelectorAll('[data-acao="${acao}"]')].find((e) => e.getClientRects().length);
  return b ? (b.getAttribute('aria-label') || b.textContent.replace(/\\s+/g, ' ').trim()) : null; })()`;

export async function roda(p, { url }) {
  await p.vai(url(), { largura: 1440 });
  const acoes = await p.ev(ACOES);
  const achados = [];
  for (const acao of acoes) {
    if (CEGOS[acao]) continue;
    await p.vai(url(), { largura: 1440, espera: 150 });
    await p.ev(`window.print = function () { window.__imprimiu = 1; }; window.open = function () { window.__abriu = 1; return null; };
      document.addEventListener('submit', function (e) { e.preventDefault(); window.__submeteu = 1; }, true); true`);
    const antes = await p.ev(FOTO);
    const nomeAntes = await p.ev(nomeDe(acao));
    if (nomeAntes === null) continue;
    try {
      await p.ev(`[...document.querySelectorAll('[data-acao="${acao}"]')].find((e) => e.getClientRects().length).click(); true`);
    } catch { continue; } // navegou no meio: navegar é eco
    await new Promise((r) => setTimeout(r, 300));
    let depois, nomeDepois, extra;
    const falou = () => (depois.vivas !== antes.vivas && depois.vivas.trim()) || depois.aria !== antes.aria ||
      depois.foco !== antes.foco || nomeDepois !== nomeAntes || depois.onde !== antes.onde ||
      depois.dialogo !== antes.dialogo || extra;
    try {
      // Confirmação destrutiva: a ação só acontece depois do sim.
      const confirma = await p.ev(`!!document.querySelector('dialog[open] [data-confirmar-ok]')`);
      if (confirma) {
        await p.ev(`document.querySelector('dialog[open] [data-confirmar-ok]').click(); true`);
        await new Promise((r) => setTimeout(r, 350));
      }
      // ESPERA ATIVA: o anúncio sai por setTimeout (60ms no anuncia), e com
      // várias abas disputando a máquina 300ms fixos às vezes não bastavam —
      // descartar-form e baixar-anexo saíram "mudos" falando (17/11/2026).
      for (let k = 0; k < 8; k++) {
        depois = await p.ev(FOTO);
        nomeDepois = await p.ev(nomeDe(acao));
        extra = await p.ev(`!!(window.__imprimiu || window.__abriu || window.__submeteu)`);
        if (falou()) break;
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch { continue; }
    const fala = falou();
    if (!fala) achados.push({ chave: `muda: ${acao}`, detalhe: `"${nomeAntes.slice(0, 40)}"` });
  }
  return achados;
}
