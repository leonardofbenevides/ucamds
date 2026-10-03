// Quantas ações primárias a pessoa pode VER de uma vez num template (ADR-023).
//
// O núcleo do @ucam/ds-mcp conta todo `variant="primary"` do texto. Numa tela
// com @if/@else — "Tentar de novo" num ramo, "Ir para o site" no outro — ele
// achava cinco primários onde nunca aparece mais de um. Aqui a conta segue o
// fluxo de controle do Angular: ramos de @if/@else, @case e @for/@empty são
// alternativas (vale o maior), o resto soma, e um <ucam-dialog> é uma vista
// própria — a tela por trás dele não está em vista enquanto ele está aberto.

const PRIMARIO = '\u0001P\u0001';
const ABRE_DIALOGO = '\u0001D\u0001';
const FECHA_DIALOGO = '\u0001/D\u0001';

/** Tira comentário, interpolação e tags, deixando só marcadores e o fluxo de controle. */
function reduzir(codigo) {
  return codigo
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .replace(/<(\/?)([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (_, barra, tag, attrs) => {
      if (tag === 'ucam-dialog') return barra ? FECHA_DIALOGO : ABRE_DIALOGO;
      if (tag === 'ucam-button' && !barra && /\bvariant\s*=\s*["']primary["']/.test(attrs)) return PRIMARIO;
      if (/\bucam-btn--primary\b/.test(attrs)) return PRIMARIO;
      return ' ';
    });
}

const TOKEN = /\u0001\/?[PD]\u0001|@(?:else\s+if|else|if|switch|case|default|for|empty|defer|placeholder|loading|error)\b[^{]*\{|[{}]/g;

/**
 * Lê uma sequência de itens até o `}` que fecha o bloco atual (ou o fim), e
 * devolve quantos primários ficam em vista ao mesmo tempo nessa sequência.
 * Os diálogos encontrados viram vistas próprias em `vistas`.
 */
function lerSequencia(tokens, vistas) {
  let soma = 0;
  while (tokens.length) {
    const t = tokens[0];
    if (t === '}' || t === FECHA_DIALOGO) break;
    tokens.shift();
    if (t === PRIMARIO) {
      soma += 1;
    } else if (t === ABRE_DIALOGO) {
      vistas.push(lerSequencia(tokens, vistas));
      if (tokens[0] === FECHA_DIALOGO) tokens.shift();
    } else if (t === '{') {
      soma += lerBloco(tokens, vistas);
    } else if (/^@(if|switch|for|defer)\b/.test(t)) {
      soma += lerAlternativas(t, tokens, vistas);
    } else {
      // @else, @case, @empty… fora de lugar: trata como bloco comum.
      soma += lerBloco(tokens, vistas);
    }
  }
  return soma;
}

/** Consome o conteúdo de um bloco já aberto até o `}` e o fecha. */
function lerBloco(tokens, vistas) {
  const n = lerSequencia(tokens, vistas);
  if (tokens[0] === '}') tokens.shift();
  return n;
}

/**
 * @if … {} @else if … {} @else {} — ou @switch com os @case —, ou @for … {}
 * @empty {}, ou @defer com @placeholder/@loading/@error: só um ramo aparece.
 */
function lerAlternativas(abertura, tokens, vistas) {
  const ramos = [];
  if (abertura.startsWith('@switch')) {
    // Dentro do switch só há @case/@default; cada um é um ramo.
    while (tokens.length && tokens[0] !== '}') {
      const t = tokens.shift();
      if (/^@(case|default)\b/.test(t)) ramos.push(lerBloco(tokens, vistas));
      else if (t === PRIMARIO) ramos.push(1);
      else if (t === '{') ramos.push(lerBloco(tokens, vistas));
    }
    if (tokens[0] === '}') tokens.shift();
  } else {
    ramos.push(lerBloco(tokens, vistas));
    const continuacao = abertura.startsWith('@for')
      ? /^@empty\b/
      : abertura.startsWith('@defer')
        ? /^@(placeholder|loading|error)\b/
        : /^@else\b/;
    while (tokens.length && continuacao.test(tokens[0])) {
      tokens.shift();
      ramos.push(lerBloco(tokens, vistas));
    }
  }
  return Math.max(0, ...ramos);
}

/** O maior número de primários em vista ao mesmo tempo, na página ou em qualquer diálogo. */
export function primariosSimultaneos(codigo) {
  const tokens = reduzir(codigo).match(TOKEN) ?? [];
  const vistas = [];
  const pagina = lerSequencia(tokens, vistas);
  return Math.max(pagina, ...vistas);
}
