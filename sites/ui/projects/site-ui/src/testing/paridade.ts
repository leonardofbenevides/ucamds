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

function linhas(no: Node, nivel: number, saida: string[]): void {
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
      .filter((a) => !andaime(a.nome) && !entradas.has(a.nome))
      .map((a) => `${a.nome}="${a.valor}"`)
      .sort()
      .join(' ');
    saida.push(`${recuo}<${el.localName}${classes ? ` class="${classes}"` : ''}${atributos ? ` ${atributos}` : ''}>`);
    linhas(el, nivel + 1, saida);
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
  linhas(no, 0, saida);
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
