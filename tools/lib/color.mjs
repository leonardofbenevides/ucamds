/* Conversão de cor — OKLCH ⇄ sRGB.
 *
 * Existe porque a revisão da paleta (31/08/2026) passou a tirar os valores do
 * PRÓPRIO Tailwind v4 instalado no repositório (`tailwindcss/theme.css`), que
 * declara tudo em `oklch()`. Sem esta conversão a alternativa seria copiar hex
 * de memória — que foi exatamente como os degraus tortos da rampa antiga
 * nasceram.
 *
 * A spec continua guardando HEX: `tools/lib/wcag.mjs` e todo o portão de
 * contraste leem hex, e um token de cor precisa ser legível por quem abre o
 * JSON. O OKLCH é a régua, não o formato de entrega.
 */

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/* sRGB transfer function (gamma), nos dois sentidos. */
const paraLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const paraGama = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/* OKLab ← linear sRGB (Björn Ottosson). */
export function rgbLinearParaOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabParaRgbLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export const hexParaRgb = (hex) => {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
};

export const rgbParaHex = (rgb) =>
  '#' + rgb.map((c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0').toUpperCase()).join('');

/** hex → { L, C, H } com L em 0–100 e H em graus. */
export function hexParaOklch(hex) {
  const [L, a, b] = rgbLinearParaOklab(hexParaRgb(hex).map(paraLinear));
  const C = Math.hypot(a, b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L: L * 100, C, H: C < 1e-4 ? 0 : H };
}

/**
 * OKLCH → hex, com redução de croma até caber no gamut sRGB.
 *
 * O corte simples (`clamp` por canal) muda a MATIZ — vermelho saturado demais
 * vira laranja ao ser cortado. Reduzir o croma preserva matiz e lightness, que
 * são justamente os dois eixos em que a rampa foi construída.
 *
 * Devolve também `cortado`: quanto de croma teve de sair. Rampa que perde croma
 * silenciosamente é rampa que não bate com o que a spec declara.
 */
export function oklchParaHex(L, C, H) {
  const l = L / 100;
  const rad = (H * Math.PI) / 180;
  const dentro = (c) => {
    const rgb = oklabParaRgbLinear([l, c * Math.cos(rad), c * Math.sin(rad)]);
    return rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  };
  let c = C;
  if (!dentro(c)) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (dentro(mid)) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  const rgb = oklabParaRgbLinear([l, c * Math.cos(rad), c * Math.sin(rad)]).map(paraGama);
  return { hex: rgbParaHex(rgb), cortado: C - c };
}

/** Lê `oklch(97.1% 0.013 17.38)` — o formato do tailwindcss/theme.css. */
export function lerOklch(txt) {
  const m = txt.match(/oklch\(\s*([\d.]+)%\s+([\d.]+|none)\s+([\d.]+|none)/i);
  if (!m) return null;
  return { L: +m[1], C: m[2] === 'none' ? 0 : +m[2], H: m[3] === 'none' ? 0 : +m[3] };
}
