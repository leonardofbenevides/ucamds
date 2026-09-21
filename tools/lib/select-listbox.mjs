// Troca o <select> nativo pelo gatilho + listbox estilizado, nas telas.
//
// POR QUE ISTO EXISTE
//
// A ADR-011 decidiu, em 30/08, que o <select> nativo sai: a lista aberta de
// um select nativo não é estilizável em navegador nenhum, então metade do
// componente ficava fora do design system — campo fechado com a marca, lista
// aberta com o azul do Windows. A decisão foi aplicada ao @ucam/ui (Angular,
// overlay do z-select) e verificada 8/8 por CDP.
//
// O que ninguém aplicou foi o outro lado: as TELAS de spec/templates.json
// continuaram com <select class='ucam-select'>. Ou seja, os exemplos do
// design system seguiam mostrando exatamente o componente que a ADR aposentou
// — e é isso que se vê ao clicar o campo "Situação" na listagem de setores.
//
// A GEOMETRIA vem da base ZardUI (select.variants.ts), não de invenção:
// trigger h-9 px-3 rounded-lg border; content rounded-md border shadow-md com
// viewport p-1; item rounded-md py-1 pl-2 pr-8 com o check à direita.
//
// O COMPORTAMENTO fica aqui, na página de exemplo, e não no @ucam/css: o
// Trilho A é folha de estilo e não vira framework. Um app AngularJS já tem
// ng-repeat e ng-click — o que faltava era com o que pintar a lista, e as
// classes .ucam-listbox/.ucam-option resolvem isso. Este script é a versão
// mínima que faz as telas de exemplo se comportarem como o componente real.

/** Extrai os <option> de um bloco de <select>. */
function lerOpcoes(miolo) {
  const opcoes = [];
  const re = /<option\b([^>]*)>([\s\S]*?)<\/option>/g;
  let m;
  while ((m = re.exec(miolo)) !== null) {
    const attrs = m[1] || '';
    opcoes.push({
      texto: m[2].trim(),
      // O `value` do <option> atravessa a conversao. Ele e o que distingue
      // "Todos os grupos" (value vazio, filtro nenhum) do nome de um grupo, e
      // sem ele um filtro por select so saberia comparar rotulo com dado.
      valor: attr(attrs, 'value'),
      selecionada: /\bselected\b/.test(attrs),
      desabilitada: /\bdisabled\b/.test(attrs),
    });
  }
  return opcoes;
}

const attr = (tag, nome) => {
  const m = tag.match(new RegExp(`\\b${nome}=(['"])([\\s\\S]*?)\\1`));
  return m ? m[2] : null;
};

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Converte todo `<select class='ucam-select'>` num gatilho + listbox.
 *
 * Mantém id (o `<label for>` continua alcançando: <button> é rotulável),
 * `disabled` e `aria-describedby`. O gatilho recebe aria-haspopup/-expanded/
 * -controls; a lista, role=listbox com option filhos.
 *
 * A OBRIGATORIEDADE atravessa junto: o `required` do <select> nativo não
 * existe em <button>, então vira `aria-required`. Sem esta linha a conversão
 * apagava em silêncio a única semântica por trás do asterisco do rótulo — o
 * campo continuava marcado com * na tela e obrigatório para ninguém.
 */
export function listboxSelects(html) {
  return html.replace(
    /<select\b([^>]*class=(['"])[^'"]*\bucam-select\b[^'"]*\2[^>]*)>([\s\S]*?)<\/select>/g,
    (_, attrs, _aspas, miolo) => {
      const id = attr(attrs, 'id') || `sel-${Math.random().toString(36).slice(2, 8)}`;
      const desabilitado = /\bdisabled\b/.test(attrs);
      const obrigatorio = /\brequired\b/.test(attrs) || attr(attrs, 'aria-required') === 'true';
      // E a INVALIDEZ junto. Mesmo buraco do required, achado no mesmo dia por
      // um exemplo novo: o gatilho saía sem aria-invalid, e com ele saía sem o
      // filete vermelho — o .ucam-select[aria-invalid] da folha nunca casava.
      // O campo ficava com a mensagem de erro embaixo e a aparência de campo
      // em ordem.
      const invalido = attr(attrs, 'aria-invalid') === 'true';
      const descrito = attr(attrs, 'aria-describedby');
      // O gatilho HERDA os modificadores e os data-* do <select>: sem isso
      // todo .ucam-select--x sumia na conversão, e o select de campus da faixa
      // não tinha como se identificar ao script que escreve o contexto.
      const classeExtra = (attr(attrs, 'class') || '')
        .split(/\s+/)
        .filter((c) => c && c !== 'ucam-select')
        .join(' ');
      const dados = (attrs.match(/\sdata-[a-z0-9-]+(?:=(['"])[\s\S]*?\1)?/g) || []).join('');
      const opcoes = lerOpcoes(miolo);
      if (!opcoes.length) return _;

      const iSel = Math.max(0, opcoes.findIndex((o) => o.selecionada));
      const rotulo = opcoes[iSel]?.texto ?? '';
      // Placeholder pela convenção já usada nas telas: "Selecione".
      const vazio = /^selecione\b/i.test(rotulo);

      const itens = opcoes
        .map(
          (o, i) =>
            `<li class="ucam-option" role="option" id="${esc(id)}-o${i}"` +
            ` aria-selected="${i === iSel ? 'true' : 'false'}"` +
            (o.valor === null ? '' : ` data-valor="${esc(o.valor)}"`) +
            (o.desabilitada ? ' aria-disabled="true"' : '') +
            `>${esc(o.texto)}</li>`,
        )
        .join('');

      return (
        `<span class="ucam-select-wrap">` +
        `<button type="button" class="ucam-select ucam-select-trigger${classeExtra ? ' ' + esc(classeExtra) : ''}" id="${esc(id)}"` +
        ` data-listbox aria-haspopup="listbox" aria-expanded="false"` +
        ` aria-controls="${esc(id)}-lb"` +
        (vazio ? ' data-vazio="true"' : '') +
        (opcoes[iSel] && opcoes[iSel].valor !== null ? ` data-valor="${esc(opcoes[iSel].valor)}"` : '') +
        (desabilitado ? ' disabled' : '') +
        (obrigatorio ? ' aria-required="true"' : '') +
        (invalido ? ' aria-invalid="true"' : '') +
        (descrito ? ` aria-describedby="${esc(descrito)}"` : '') +
        dados +
        `>${esc(rotulo)}</button>` +
        `<ul class="ucam-listbox" id="${esc(id)}-lb" role="listbox" hidden` +
        ` aria-labelledby="${esc(id)}">${itens}</ul>` +
        `</span>`
      );
    },
  );
}

/**
 * Comportamento do listbox, para a página autônoma da tela.
 *
 * Teclado conforme o padrão APG de listbox em botão: Enter/Espaço/Alt+Baixo
 * abre, setas andam, Home/End vão às pontas, Enter escolhe, Esc fecha e
 * devolve o foco ao gatilho. `aria-activedescendant` no gatilho, porque o
 * foco permanece nele — a lista não recebe foco.
 */
export const listboxScript = `
(function () {
  var aberta = null;

  function itens(lb) {
    return Array.prototype.slice.call(lb.querySelectorAll('.ucam-option:not([aria-disabled="true"])'));
  }
  function destacar(lb, el) {
    itens(lb).forEach(function (o) { o.removeAttribute('data-destacada'); });
    if (!el) return;
    el.setAttribute('data-destacada', 'true');
    document.getElementById(lb.getAttribute('aria-labelledby')).setAttribute('aria-activedescendant', el.id);
    el.scrollIntoView({ block: 'nearest' });
  }
  // Até onde a lista pode descer: o fundo do ancestral mais próximo que
  // recorta (overflow diferente de visible), ou o da janela. Sem esta conta a
  // lista de um Select perto do fundo de uma gaveta saía por baixo dela —
  // medido em 10/09/2026: 11px além do painel, recortados.
  function tetoDe(el) {
    for (var a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      var ov = getComputedStyle(a);
      if (/hidden|clip|auto|scroll/.test(ov.overflowY)) return a.getBoundingClientRect();
    }
    return { top: 0, bottom: window.innerHeight };
  }
  function abrir(gatilho) {
    if (aberta) fechar(false);
    var lb = document.getElementById(gatilho.getAttribute('aria-controls'));
    lb.classList.remove('ucam-listbox--acima');
    lb.hidden = false;
    // Abre para CIMA quando não cabe embaixo e cabe em cima. A mesma regra do
    // .ucam-menu--acima, decidida aqui porque só o navegador sabe onde a
    // lista cai.
    var limite = tetoDe(lb);
    var g = gatilho.getBoundingClientRect();
    var altura = lb.getBoundingClientRect().height;
    if (g.bottom + altura > limite.bottom && g.top - altura >= limite.top) {
      lb.classList.add('ucam-listbox--acima');
    }
    gatilho.setAttribute('aria-expanded', 'true');
    aberta = gatilho;
    destacar(lb, lb.querySelector('.ucam-option[aria-selected="true"]') || itens(lb)[0]);
  }
  function fechar(devolveFoco) {
    if (!aberta) return;
    var lb = document.getElementById(aberta.getAttribute('aria-controls'));
    lb.hidden = true;
    aberta.setAttribute('aria-expanded', 'false');
    aberta.removeAttribute('aria-activedescendant');
    if (devolveFoco) aberta.focus();
    aberta = null;
  }
  function escolher(gatilho, opcao) {
    var lb = document.getElementById(gatilho.getAttribute('aria-controls'));
    lb.querySelectorAll('.ucam-option').forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
    opcao.setAttribute('aria-selected', 'true');
    gatilho.textContent = opcao.textContent;
    gatilho.removeAttribute('data-vazio');
    // A ESCOLHA SAI DO COMPONENTE. Sem estas duas linhas o gatilho e um
    // <select> que nunca dispara change e nunca diz o que foi escolhido: o
    // data-filtra de um campo Grupo ou Situacao ficava ligado a nada.
    gatilho.setAttribute('data-valor', opcao.getAttribute('data-valor') !== null ? opcao.getAttribute('data-valor') : opcao.textContent.trim());
    gatilho.dispatchEvent(new Event('change', { bubbles: true }));
    // O select de CAMPUS da faixa escreve o contexto no shell: é o que a
    // aplicação lê para recarregar a tela na unidade escolhida (ADR-033).
    if (gatilho.hasAttribute('data-campus-select')) {
      var shell = gatilho.closest('.ucam-shell');
      if (shell) shell.dataset.campus = opcao.textContent.trim();
    }
    fechar(true);
  }

  document.addEventListener('click', function (e) {
    var gatilho = e.target.closest('[data-listbox]');
    if (gatilho && !gatilho.disabled) {
      e.preventDefault();
      if (aberta === gatilho) fechar(true); else abrir(gatilho);
      return;
    }
    var opcao = e.target.closest('.ucam-option');
    if (opcao && aberta && !opcao.hasAttribute('aria-disabled')) {
      escolher(aberta, opcao);
      return;
    }
    fechar(false);
  });

  document.addEventListener('keydown', function (e) {
    // e.target é o DOCUMENTO quando o foco não está em elemento nenhum — e
    // documento não tem closest. Sem esta guarda, a primeira tecla depois de
    // fechar uma sobreposição lança e mata o resto deste tratador.
    var gatilho = e.target.closest && e.target.closest('[data-listbox]');
    if (!gatilho || gatilho.disabled) return;
    var lb = document.getElementById(gatilho.getAttribute('aria-controls'));
    var lista = itens(lb);
    var atual = lb.querySelector('.ucam-option[data-destacada="true"]');
    var i = lista.indexOf(atual);

    if (e.key === 'Escape') { fechar(true); return; }
    if (!aberta && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault(); abrir(gatilho); return;
    }
    if (!aberta) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); destacar(lb, lista[Math.min(i + 1, lista.length - 1)]); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); destacar(lb, lista[Math.max(i - 1, 0)]); }
    else if (e.key === 'Home') { e.preventDefault(); destacar(lb, lista[0]); }
    else if (e.key === 'End') { e.preventDefault(); destacar(lb, lista[lista.length - 1]); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (atual) escolher(gatilho, atual); }
    else if (e.key === 'Tab') { fechar(false); }
  });
})();
`.trim();
