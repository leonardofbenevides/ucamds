/**
 * Quais números a paginação mostra. `null` é a reticência.
 *
 * Sempre a primeira e a última, a atual e as duas vizinhas. Um buraco de UMA
 * página mostra a página: trocar um número por reticências não economiza
 * nada e esconde um destino. `page` fora da faixa é trazida para dentro;
 * `total` menor que 1 (ou que não é número) não tem página nenhuma.
 */
export function janelaDePaginas(page: number, total: number): (number | null)[] {
  const ultima = Math.floor(Number(total));
  if (!Number.isFinite(ultima) || ultima < 1) return [];
  const atual = paginaNaFaixa(page, ultima);
  const mostradas = [...new Set([1, atual - 1, atual, atual + 1, ultima])].filter((p) => p >= 1 && p <= ultima).sort((a, b) => a - b);
  const saida: (number | null)[] = [];
  for (const p of mostradas) {
    const anterior = saida.at(-1);
    if (typeof anterior === 'number') {
      if (p - anterior === 2) saida.push(anterior + 1);
      else if (p - anterior > 2) saida.push(null);
    }
    saida.push(p);
  }
  return saida;
}

/** A página atual dentro de 1..total; o que não é número vira a primeira. */
export function paginaNaFaixa(page: number, total: number): number {
  const p = Math.floor(Number(page));
  if (!Number.isFinite(p)) return 1;
  return Math.min(Math.max(p, 1), Math.max(Math.floor(Number(total)) || 1, 1));
}
