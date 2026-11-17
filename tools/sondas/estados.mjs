// Carregando, vazio e erro reagem e não quebram a tela?
//
// O estadosDaListaScript (22/10/2026, tools/lib/shell.mjs) atende
// ?estado=carregando|vazio|erro em toda tela com tabela. A sonda pergunta,
// para cada tabela visível: o estado chegou (aria-busy no carregando, o vazio
// ou o alerta à vista nos outros dois), avisou quem não vê (role=status ou
// alert) e saiu sem erro de script? Tela sem tabela não se aplica.

export const nome = 'estados';
export const pergunta = 'nas telas com tabela, ?estado=carregando|vazio|erro chega, avisa e não quebra?';

const TEM_TABELA = `[...document.querySelectorAll('.ucam-table-wrap table.ucam-table')]
  .filter((t) => t.tBodies.length && !t.closest('[hidden], .ucam-table__detalhe')).length`;

const CONFERE = {
  carregando: `(() => {
    const busy = document.querySelector('table.ucam-table[aria-busy="true"]');
    const fala = [...document.querySelectorAll('[role=status]')].some((s) => /carregando/i.test(s.textContent));
    return { chegou: !!busy, avisou: fala };
  })()`,
  vazio: `(() => {
    const v = [...document.querySelectorAll('.ucam-empty')].find((e) => e.getClientRects().length && !e.closest('[hidden]'));
    const fala = [...document.querySelectorAll('[role=status], [role=alert]')].some((s) => s.textContent.trim());
    return { chegou: !!v, avisou: fala || !!(v && v.closest('[role=status], [aria-live]')) };
  })()`,
  erro: `(() => {
    const a = [...document.querySelectorAll('[role=alert], .ucam-empty')].find((e) => e.getClientRects().length && !e.closest('[hidden]') && /erro|não foi possível|tentar/i.test(e.textContent));
    return { chegou: !!a, avisou: !!(a && (a.matches('[role=alert]') || a.closest('[role=alert], [aria-live]'))) || !!document.querySelector('[role=alert]') };
  })()`,
};

export async function roda(p, { url }) {
  await p.vai(url(), { largura: 1440, espera: 100 });
  if (!(await p.ev(TEM_TABELA))) return [];
  const achados = [];
  for (const estado of ['carregando', 'vazio', 'erro']) {
    await p.vai(url({ estado }), { largura: 1440, espera: 200 });
    for (const e of p.erros) achados.push({ chave: `${estado}: ${e.tipo}`, detalhe: e.texto });
    const r = await p.ev(CONFERE[estado]);
    if (!r.chegou) achados.push({ chave: `${estado}: não chegou`, detalhe: '' });
    else if (!r.avisou) achados.push({ chave: `${estado}: sem aviso para leitor de tela`, detalhe: '' });
  }
  return achados;
}
