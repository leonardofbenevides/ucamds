/**
 * O portão de paridade: a peça Angular tem de produzir a MESMA árvore da demo
 * em HTML do catálogo. Compara-se o que o contrato promete — elemento, classes
 * e os atributos que mudam o que o usuário recebe — e ignora-se o que é
 * andaime do Angular (comentários, _ng*, os atributos de seletor e de entrada).
 */
const ATRIBUTOS = new Set(['role', 'href', 'type', 'disabled', 'alt', 'src', 'for', 'id', 'name', 'open', 'tabindex']);

const conta = (nome: string) => ATRIBUTOS.has(nome) || nome.startsWith('aria-');

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
    const atributos = Array.from(el.attributes)
      .filter((a) => conta(a.name))
      .map((a) => `${a.name}="${a.value}"`)
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
