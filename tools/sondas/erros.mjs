// A tela carrega sem exceção, sem console.error e sem 404 — nos dois temas?
//
// O ReferenceError calado entre scripts (memória dsucam-sonda-de-feedback) só
// apareceu porque alguém abriu o console. Aqui todo carregamento é ouvido.

export const nome = 'erros';
export const pergunta = 'carrega sem exceção, console.error nem recurso 404, no claro e no escuro?';

export async function roda(p, { url }) {
  const achados = [];
  for (const tema of ['light', 'dark']) {
    await p.vai(url({ tema }), { largura: 1440 });
    const vistos = new Set();
    for (const e of p.erros) {
      // O Chrome pede /favicon.ico sozinho quando a página não declara ícone;
      // a tela autônoma não declara, e não é ela que pede.
      if (e.tipo === 'rede' && / \/favicon\.ico$/.test(e.texto)) continue;
      const chave = `${e.tipo}: ${e.texto}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      achados.push({ chave, detalhe: `tema ${tema}` });
    }
  }
  // O mesmo erro nos dois temas é um achado só.
  const unico = new Map();
  for (const a of achados) unico.set(a.chave, unico.has(a.chave) ? { ...a, detalhe: 'nos dois temas' } : a);
  return [...unico.values()];
}
