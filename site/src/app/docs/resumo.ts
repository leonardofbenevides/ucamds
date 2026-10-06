/**
 * Corta um texto da spec em CHAMADA e RESTO.
 *
 * Em 06/10/2026 o site somava 203 mil palavras visíveis em 181 páginas — a
 * página de um componente tinha, na média, 1.900 —, e o pedido foi "cuidado
 * com a quantidade de texto EXTREMA". O contrato não encolhe: ele é o que os
 * agentes e a revisão de código leem, e cada frase dele registra um defeito
 * que já aconteceu. O que encolhe é o que a PÁGINA mostra de saída.
 *
 * A spec é escrita, quase sempre, na ordem regra → motivo: a primeira frase
 * diz o que fazer, as seguintes dizem por quê e o que deu errado quando não se
 * fez. Por isso o corte é na primeira frase, e não num teto de caracteres, que
 * pararia no meio de uma oração.
 *
 * O resto não some: vai para um `<span class="resto">` que o modo "Completo"
 * do cabeçalho da página mostra (ver leitura.component.ts).
 */

/** Abreviações que terminam em ponto sem terminar a frase. */
const ABREVIA = /(?:^|[\s(])(?:p|ex|etc|vs|cf|art|n|nº|obs|sr|sra|dr|dra|pág|máx|mín|aprox|i\.e|e\.g)\.$/i;

/** Abaixo disto a "primeira frase" é um rótulo ("Não.", "Sim."), não a regra. */
const MIN_PALAVRAS = 4;

/** A partir daqui a frase sozinha já é parede, e vale procurar o travessão. */
const LONGA = 22;

const palavras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

/** Parênteses, aspas curvas e crases abertos no trecho — não se corta dentro. */
function aberto(t: string): boolean {
  let par = 0;
  let curva = 0;
  let crase = 0;
  for (const ch of t) {
    if (ch === '(') par++;
    else if (ch === ')') par--;
    else if (ch === '“') curva++;
    else if (ch === '”') curva--;
    else if (ch === '`') crase++;
  }
  return par > 0 || curva > 0 || crase % 2 === 1;
}

export interface Resumo {
  cabeca: string;
  resto: string;
}

export function resumir(texto: string | null | undefined): Resumo {
  const t = String(texto ?? '').trim();
  if (!t) return { cabeca: '', resto: '' };

  // Fim de frase: pontuação, espaço, e o que vem depois começa uma frase.
  const fim = /[.!?]["'”’)]?\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÀÇ0-9"'“‘(`<[])/g;
  let corte = -1;
  for (let m = fim.exec(t); m; m = fim.exec(t)) {
    const ate = t.slice(0, m.index + m[0].trimEnd().length);
    if (ABREVIA.test(ate)) continue;
    // "2." de lista numerada e "1.4.11." de critério não fecham frase.
    if (/(?:^|\s)\d+\.$/.test(ate)) continue;
    if (aberto(ate)) continue;
    if (palavras(ate) < MIN_PALAVRAS) continue;
    corte = ate.length;
    break;
  }

  let cabeca = corte < 0 ? t : t.slice(0, corte);
  let resto = corte < 0 ? '' : t.slice(corte).trim();

  // Frase única e comprida com UM travessão: "regra — motivo". Com dois, o
  // travessão abre e fecha um aposto, e cortar ali deixaria a oração no ar.
  if (palavras(cabeca) > LONGA) {
    const partes = cabeca.split(' — ');
    if (partes.length === 2 && palavras(partes[0]) >= 6 && !aberto(partes[0])) {
      resto = (partes[1] + (resto ? ' ' + resto : '')).trim();
      resto = resto.charAt(0).toUpperCase() + resto.slice(1);
      cabeca = partes[0].replace(/[,;:]$/, '') + '.';
    }
  }

  return { cabeca, resto };
}
