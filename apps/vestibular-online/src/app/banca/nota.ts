/**
 * A escala de nota da banca, a mesma do legado: de 0 a 10, de meio em meio
 * ponto. Vale para a nota da redação e para a pontuação de uma questão.
 */

/** '7,5' ou '7.5' → 7.5; null se não for valor da escala. */
export function lerNota(texto: string): number | null {
  const t = texto.trim().replace(',', '.');
  if (!/^\d{1,2}(\.\d)?$/.test(t)) return null;
  const n = Number(t);
  return n >= 0 && n <= 10 && Number.isInteger(n * 2) ? n : null;
}

export function escreverNota(nota: number): string {
  return nota.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}
