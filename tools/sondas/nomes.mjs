// Todo controle tem nome acessível, e toda referência por id aponta para algo?
//
// Lê a árvore de acessibilidade do próprio Chrome (a mesma que o leitor de
// tela recebe), não a marcação: um botão só de ícone sem aria-label sai sem
// nome aqui, e o aria-describedby que aponta para um id que sumiu (o apoio que
// saía do aria-describedby, memória dsucam-feedback-validacao) também.

export const nome = 'nomes';
export const pergunta = 'algum controle sem nome acessível, ou aria-* apontando para id que não existe?';

const PAPEIS = new Set(['button', 'link', 'textbox', 'searchbox', 'combobox', 'checkbox', 'radio', 'switch', 'tab',
  'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'slider', 'spinbutton', 'listbox', 'tree', 'treeitem']);

const REFS = `(() => {
  const ruins = [];
  for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-errormessage', 'for']) {
    for (const e of document.querySelectorAll('[' + attr + ']')) {
      if (e.closest('template')) continue;
      for (const id of e.getAttribute(attr).split(/\\s+/).filter(Boolean)) {
        if (!document.getElementById(id)) ruins.push(attr + '="' + id + '" em ' + e.tagName.toLowerCase());
      }
    }
  }
  const ids = new Map();
  for (const e of document.querySelectorAll('[id]')) ids.set(e.id, (ids.get(e.id) || 0) + 1);
  const dup = [...ids].filter(([, n]) => n > 1).map(([id, n]) => 'id repetido "' + id + '" (' + n + '×)');
  return [...new Set(ruins)].concat(dup);
})()`;

export async function roda(p, { url }) {
  await p.vai(url(), { largura: 1440 });
  await p.cmd('Accessibility.enable');
  await p.cmd('DOM.enable');
  const { nodes } = await p.cmd('Accessibility.getFullAXTree');
  const achados = new Map();
  for (const n of nodes) {
    if (n.ignored || !PAPEIS.has(n.role?.value)) continue;
    if ((n.name?.value || '').trim()) continue;
    const hidden = (n.properties || []).find((x) => x.name === 'hidden')?.value?.value;
    if (hidden) continue;
    let alvo = '';
    if (n.backendDOMNodeId) {
      try {
        const { node } = await p.cmd('DOM.describeNode', { backendNodeId: n.backendDOMNodeId });
        const at = node.attributes || [];
        const cls = at[at.indexOf('class') + 1];
        alvo = node.localName + (at.includes('class') && cls ? '.' + cls.split(/\s+/)[0] : '') +
          (at.includes('data-acao') ? `[data-acao=${at[at.indexOf('data-acao') + 1]}]` : '');
      } catch {}
    }
    const chave = `sem nome: ${n.role.value} ${alvo}`;
    achados.set(chave, { chave, detalhe: `${(achados.get(chave)?.n || 0) + 1}×`, n: (achados.get(chave)?.n || 0) + 1 });
  }
  for (const r of await p.ev(REFS)) achados.set(r, { chave: r, detalhe: '' });
  return [...achados.values()].map(({ chave, detalhe }) => ({ chave, detalhe }));
}
