/**
 * Dá ids próprios a uma cópia de HTML de demo.
 *
 * A página de cada peça dos sites mostra a mesma demo três vezes: o preview,
 * o lado HTML do par de paridade e o lado Angular. Com os mesmos ids, o
 * `for` do rótulo de uma cópia apontaria para o campo de outra, e o `name`
 * de um <details> fecharia o acordeão vizinho. O lado Angular já vem da spec
 * com ids próprios; esta função prefixa os do lado HTML.
 *
 * Só toca no que é LIGAÇÃO dentro do trecho: os ids declarados, quem os cita
 * (`for`, `aria-describedby`, `aria-labelledby`, `aria-controls`, `href="#…"`)
 * e o `name` de <details>. `href="#i-check"` aponta para o sprite, que não
 * está no trecho, e fica como está.
 */
export function prefixarIds(html: string, prefixo: string): string {
  const ids = new Set([...html.matchAll(/\sid=(["'])(.+?)\1/g)].map((m) => m[2]));
  const troca = (valor: string) => (ids.has(valor) ? prefixo + valor : valor);
  return html
    .replace(/(\s(?:id|for)=)(["'])(.+?)\2/g, (_t, nome, aspas, valor) => `${nome}${aspas}${troca(valor)}${aspas}`)
    .replace(/(\s(?:aria-describedby|aria-labelledby|aria-controls)=)(["'])(.+?)\2/g, (_t, nome, aspas, valor: string) => `${nome}${aspas}${valor.split(/\s+/).map(troca).join(' ')}${aspas}`)
    .replace(/(\shref=)(["'])#(.+?)\2/g, (_t, nome, aspas, valor) => `${nome}${aspas}#${troca(valor)}${aspas}`)
    .replace(/(<details\b[^>]*?\sname=)(["'])(.+?)\2/g, (_t, antes, aspas, valor) => `${antes}${aspas}${prefixo}${valor}${aspas}`);
}
