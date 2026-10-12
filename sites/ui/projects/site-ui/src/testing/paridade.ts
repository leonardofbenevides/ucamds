/**
 * O portão de paridade: a peça Angular tem de produzir a MESMA árvore da demo
 * em HTML do catálogo.
 *
 * Conta TUDO o que o navegador recebe — elemento, classes, texto e todo
 * atributo —, menos o que é andaime do Angular: comentários, `_ng*`, `ng-*`,
 * o atributo de seletor da peça e as ENTRADAS da peça escritas como atributo
 * (`variant="ghost"` fica no DOM, e não é atributo do <a>). A lista de
 * entradas vem do contrato (`trilho_b`), e só vale no elemento que leva o
 * seletor daquela peça: `name` é entrada no avatar e atributo num campo.
 *
 * Nasceu como lista do que conta, e escondia o que as próximas peças têm de
 * acertar (target, rel, required, loading). Lista do que se ignora erra para
 * o lado seguro: atributo novo conta até alguém dizer que não.
 *
 * IDS SÃO COMPARADOS PELA LIGAÇÃO, não pelo nome (fatia 3a-2). A página de
 * cada peça renderiza a demo três vezes, então a forma Angular usa ids
 * próprios. Cada id vira um número pela ordem em que aparece no trecho, e
 * `for`, `aria-describedby`, `aria-labelledby`, `aria-controls` e `href="#…"`
 * passam a citar esse número. Referência a um id que NÃO existe no trecho
 * fica literal: é assim que a ligação quebrada, e o `#i-check` do sprite,
 * continuam sendo diferença. O `name` de <details> é numerado do mesmo jeito.
 */
import { ENTRADAS_POR_SELETOR } from './contrato';

/** As entradas das peças cujo seletor este elemento leva, em minúsculas. */
function entradasDe(el: Element): Set<string> {
  const fora = new Set<string>();
  for (const a of Array.from(el.attributes)) {
    for (const entrada of ENTRADAS_POR_SELETOR[a.name.toLowerCase()] ?? []) fora.add(entrada.toLowerCase());
  }
  return fora;
}

const andaime = (nome: string) => nome === 'class' || nome.startsWith('_ng') || nome.startsWith('ng-') || nome.startsWith('ucamsite');

/**
 * Onde o nome da entrada É um atributo do elemento, ele conta: o `open` e o
 * `name` de um <details> são o que a peça entrega, não só o que ela recebe.
 */
const NATIVOS: Record<string, string[]> = {
  details: ['open', 'name'],
  a: ['href'],
  input: ['type', 'value', 'disabled', 'placeholder', 'required', 'name'],
  button: ['type', 'disabled'],
};

const REFERENCIAS = new Set(['for', 'aria-describedby', 'aria-labelledby', 'aria-controls']);

interface Ligacoes {
  ids: Map<string, string>;
  grupos: Map<string, string>;
}

function ligacoesDe(raiz: Element): Ligacoes {
  const ids = new Map<string, string>();
  const grupos = new Map<string, string>();
  for (const el of Array.from(raiz.querySelectorAll('*'))) {
    const id = el.getAttribute('id');
    if (id && !ids.has(id)) ids.set(id, `id#${ids.size + 1}`);
    const nome = el.localName === 'details' ? el.getAttribute('name') : null;
    if (nome && !grupos.has(nome)) grupos.set(nome, `grupo#${grupos.size + 1}`);
  }
  return { ids, grupos };
}

function valorDe(el: Element, nome: string, valor: string, l: Ligacoes): string {
  if (nome === 'id') return l.ids.get(valor) ?? valor;
  if (REFERENCIAS.has(nome)) return valor.split(/\s+/).filter(Boolean).map((v) => l.ids.get(v) ?? v).join(' ');
  if (nome === 'href' && valor.startsWith('#') && l.ids.has(valor.slice(1))) return `#${l.ids.get(valor.slice(1))}`;
  if (nome === 'name' && el.localName === 'details') return l.grupos.get(valor) ?? valor;
  return valor;
}

function linhas(no: Node, nivel: number, saida: string[], l: Ligacoes): void {
  for (const filho of Array.from(no.childNodes)) {
    const recuo = '  '.repeat(nivel);
    if (filho.nodeType === 3) {
      const texto = (filho.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (texto) saida.push(`${recuo}"${texto}"`);
      continue;
    }
    if (filho.nodeType !== 1) continue;
    const el = filho as Element;
    const classes = (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).sort().join(' ');
    const entradas = entradasDe(el);
    const atributos = Array.from(el.attributes)
      .map((a) => ({ nome: a.name.toLowerCase(), valor: a.value }))
      .filter((a) => !andaime(a.nome) && (!entradas.has(a.nome) || (NATIVOS[el.localName] ?? []).includes(a.nome)))
      .map((a) => `${a.nome}="${valorDe(el, a.nome, a.valor, l)}"`)
      .sort()
      .join(' ');
    saida.push(`${recuo}<${el.localName}${classes ? ` class="${classes}"` : ''}${atributos ? ` ${atributos}` : ''}>`);
    linhas(el, nivel + 1, saida, l);
  }
}

/** A árvore do CONTEÚDO de `raiz` (o contêiner em si não entra), uma linha por nó. */
export function normalizar(raiz: Element | string): string {
  let no: Element;
  if (typeof raiz === 'string') {
    no = document.createElement('div');
    no.innerHTML = raiz;
  } else {
    no = raiz;
  }
  const saida: string[] = [];
  linhas(no, 0, saida, ligacoesDe(no));
  return saida.join('\n');
}

export function mesmaArvore(esperado: Element | string, obtido: Element | string): { igual: boolean; diferenca: string } {
  const a = normalizar(esperado).split('\n');
  const b = normalizar(obtido).split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return { igual: false, diferenca: `linha ${i + 1} — esperado: ${a[i] ?? '(nada)'} | obtido: ${b[i] ?? '(nada)'}` };
    }
  }
  return { igual: true, diferenca: '' };
}
