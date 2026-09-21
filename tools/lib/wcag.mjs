// Matemática de contraste da WCAG 2.1, em um lugar só.
//
// Existiam duas implementações — uma em build-tokens.mjs, outra em build-docs.mjs.
// Duas implementações do mesmo cálculo é a classe de bug que este projeto declara
// inaceitável: o portão de build aprovaria um par que a documentação reprova.

/** Luminância relativa — WCAG 2.1, definição de relative luminance. */
export function luminance(hex) {
  const c = String(hex).replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste entre duas cores hex. Sempre >= 1. */
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/**
 * Classifica uma razão de contraste.
 * `large` = texto grande (>=24px, ou >=18.66px em negrito), que tem limiar menor.
 */
export function grade(ratio, large = false) {
  const aa = large ? 3 : 4.5;
  const aaa = large ? 4.5 : 7;
  if (ratio >= aaa) return { label: 'AAA', tone: 'good' };
  if (ratio >= aa) return { label: 'AA', tone: 'good' };
  if (ratio >= 3) return { label: 'AA grande', tone: 'warn' };
  return { label: 'reprova', tone: 'bad' };
}
