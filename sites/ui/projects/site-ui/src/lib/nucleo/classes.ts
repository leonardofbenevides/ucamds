/**
 * A lista de classes de uma peça: a raiz e um `raiz--mod` por modificador
 * verdadeiro. Os nomes vêm do contrato da peça; a lib nunca inventa classe.
 */
export function classesDe(raiz: string, ...mods: (string | false | null | undefined)[]): string {
  return [raiz, ...mods.filter((m): m is string => !!m).map((m) => `${raiz}--${m}`)].join(' ');
}

/** Devolve `valor` se estiver na lista do contrato; senão, o padrão. */
export function umDe<T extends string>(lista: readonly T[], padrao: T): (valor: unknown) => T {
  return (valor) => (lista.includes(valor as T) ? (valor as T) : padrao);
}
