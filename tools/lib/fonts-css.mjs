// O @font-face da Geist, com o caminho parametrizado.
//
// Três consumidores servem a mesma fonte de lugares diferentes: dist/css/
// alcança ../fonts, o docs/index.html alcança fonts/ e as telas em docs/t/
// alcançam ../fonts. Gerar o bloco a partir de uma função evita a alternativa
// óbvia e ruim — copiar o @font-face em três arquivos e torcer para os três
// mudarem juntos quando a fonte mudar.

export const familias = [
  { pkg: '@fontsource-variable/geist', arquivo: 'geist', nome: 'Geist Variable' },
  { pkg: '@fontsource-variable/geist-mono', arquivo: 'geist-mono', nome: 'Geist Mono Variable' },
];

// latin cobre o português; latin-ext entra pelos nomes próprios com diacrítico
// fora do latin básico. Cirílico e grego, que o @fontsource também traz, não
// servem a uma universidade brasileira e triplicariam o peso.
export const subconjuntos = [
  {
    id: 'latin',
    unicode:
      'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  },
  {
    id: 'latin-ext',
    unicode:
      'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
  },
];

export const arquivosWoff2 = familias.flatMap((f) =>
  subconjuntos.map((s) => `${f.arquivo}-${s.id}-wght-normal.woff2`),
);

/** @param prefixo caminho até a pasta das fontes, sem barra final. */
export function fontFaceCss(prefixo) {
  return familias
    .flatMap((familia) =>
      subconjuntos.map(
        (sub) => `@font-face {
  font-family: '${familia.nome}';
  font-style: normal;
  /* Eixo variável inteiro num arquivo só: um peso a mais não custa requisição. */
  font-weight: 100 900;
  font-display: swap;
  src: url('${prefixo}/${familia.arquivo}-${sub.id}-wght-normal.woff2') format('woff2-variations');
  unicode-range: ${sub.unicode};
}`,
      ),
    )
    .join('\n\n');
}
