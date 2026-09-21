// A paleta de séries de gráfico continua separável para quem não vê cor?
//
// A spec PROMETE isso em três lugares — o contrato do chart ("séries vizinhas
// separadas com folga também sob simulação de daltonismo"), a descrição dos
// tokens de série ("a ordem é o mecanismo que mantém os pares vizinhos
// separáveis, e trocá-la invalida a verificação") e a ADR-014. Até 07/09/2026
// nada verificava: a "verificação" que a prosa dizia estar sendo invalidada
// nunca existiu como código.
//
// É a mesma classe de buraco que a auditoria de setembro achou nos contratos —
// regulamento escrito, portão ausente.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { hexParaRgb, rgbLinearParaOklab, hexParaOklch } from './lib/color.mjs';
import { contrast } from './lib/wcag.mjs';

const paraLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const paraGama = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
const cl = (v) => Math.min(1, Math.max(0, v));

/* Viénot-Brettel-Mollon: projeta a cor no plano que o cone ausente deixa.
 * Roda em RGB LINEAR — aplicar a matriz sobre o valor com gama embutida
 * exagera a separação e faria o portão aprovar paleta que colide na tela. */
export function simula(hex, tipo) {
  const [r, g, b] = hexParaRgb(hex).map(paraLinear);
  const L = 17.8824 * r + 43.5161 * g + 4.11935 * b;
  const M = 3.45565 * r + 27.1554 * g + 3.86714 * b;
  const S = 0.0299566 * r + 0.184309 * g + 1.46709 * b;
  let l = L, m = M, s = S;
  if (tipo === 'protanopia') l = 2.02344 * M - 2.52581 * S;
  if (tipo === 'deuteranopia') m = 0.494207 * L + 1.24827 * S;
  if (tipo === 'tritanopia') s = -0.395913 * L + 0.801109 * M;
  return '#' + [
    0.0809444479 * l - 0.130504409 * m + 0.116721066 * s,
    -0.0102485335 * l + 0.0540193266 * m - 0.113614708 * s,
    -0.000365296938 * l - 0.00412161469 * m + 0.693511405 * s,
  ].map((v) => Math.round(cl(paraGama(cl(v))) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

const oklab = (h) => rgbLinearParaOklab(hexParaRgb(h).map(paraLinear));
/* Distância euclidiana em OKLab. Não é ΔE2000, e não precisa ser: aqui a
 * pergunta é "dá para dizer que são duas cores?", não "quanto exatamente
 * diferem?". OKLab é uniforme o bastante para um limiar. */
export const distancia = (a, b) => {
  const A = oklab(a), B = oklab(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
};

/* Limiares. VIZINHO é o que a spec promete e vira FALHA. TODOS OS PARES é o
 * que a tela realmente mostra — um gráfico de seis séries põe as seis juntas,
 * e ninguém compara só os slots adjacentes — e por ora vira DESVIO NOMEADO,
 * porque corrigi-lo mexe na identidade visual e isso é decisão, não conserto. */
const LIMITE_VIZINHO = 0.10;
const LIMITE_TODOS = 0.06;
/* 'normal' entra na lista, e não é redundância: uma paleta pode ser desenhada
 * para sobreviver às três dicromacias e encostar duas séries à vista comum —
 * a descrição do slot 4 já registrava esse risco para o par azul/turquesa.
 * Portão que só olha o caso difícil deixa passar o caso fácil. */
const TIPOS = ['normal', 'deuteranopia', 'protanopia', 'tritanopia'];
const ver = (hex, tipo) => (tipo === 'normal' ? hex : simula(hex, tipo));

/* O portão exporta simula() e distancia() para quem quiser medir uma paleta
 * candidata sem reimplementar a matemática — e reimplementar seria a mesma
 * falha que tools/lib/wcag.mjs já existe para evitar. Por isso a execução fica
 * atrás de uma guarda: importar este arquivo não pode rodar o portão nem
 * derrubar o processo de quem importou. */
function principal() {
const NL = String.fromCharCode(10);
const tokens = readFileSync('dist/tokens/ucam-tokens.css', 'utf8');
const blocoDe = (marca) => {
  const i = tokens.indexOf(marca);
  if (i < 0) return '';
  const ini = tokens.indexOf('{', i);
  return tokens.slice(ini, tokens.indexOf(NL + '}', ini));
};
const leVars = (txt) =>
  Object.fromEntries([...txt.matchAll(/--(ucam-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
/* Recorta por BLOCO, não pela primeira ocorrência de data-theme="dark": entre
 * o :root claro e o :root[data-theme="dark"] existe um @media
 * prefers-color-scheme que também carrega o escuro. Cortar no primeiro
 * casamento leva o @media junto e o mapa "claro" sai com valores do escuro. */
const claro = leVars(blocoDe(NL + ':root {'));
const escuro = { ...claro, ...leVars(blocoDe(':root[data-theme="dark"] {')) };
const resolve = (v, mapa, n = 0) => {
  if (n > 10 || !v) return v;
  const m = String(v).match(/^var\(--([a-z0-9-]+)\)$/);
  return m ? resolve(mapa[m[1]], mapa, n + 1) : String(v).trim();
};

const falhas = [];
const desvios = [];
const relatos = [];

for (const [tema, mapa, fundo] of [['claro', claro, '#FFFFFF'], ['escuro', escuro, resolve('var(--ucam-color-surface-canvas)', escuro)]]) {
  const series = [];
  for (let n = 1; ; n++) {
    const hex = resolve(`var(--ucam-color-chart-series-${n})`, mapa);
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) break;
    series.push(hex.toUpperCase());
  }
  if (!series.length) { falhas.push(`[${tema}] nenhum token color.chart.series-* encontrado`); continue; }

  const Ls = series.map((h) => hexParaOklch(h).L);
  const amplitude = Math.max(...Ls) - Math.min(...Ls);
  relatos.push(`  [${tema}] ${series.length} séries · amplitude de luminosidade ${amplitude.toFixed(1)}`);

  /* Amplitude de L é o diagnóstico, não um detalhe: matiz é o canal que o
   * dicromata perde, então tudo que separa as séries para ele mora em L. Uma
   * paleta achatada em luminosidade não tem como passar, e sem esta linha o
   * relatório diria QUE falhou sem dizer POR QUÊ. */
  if (amplitude < 10) {
    desvios.push(`[${tema}] as séries cabem em ${amplitude.toFixed(1)} de luminosidade — separadas só por matiz, que é o canal que o dicromata não tem`);
  }

  for (const tipo of TIPOS) {
    const sim = series.map((h) => ver(h, tipo));

    for (let i = 0; i < sim.length - 1; i++) {
      const d = distancia(sim[i], sim[i + 1]);
      if (d < LIMITE_VIZINHO) {
        falhas.push(`[${tema}] ${tipo}: séries VIZINHAS ${i + 1} e ${i + 2} a d=${d.toFixed(3)} (mínimo ${LIMITE_VIZINHO}) — ${series[i]} e ${series[i + 1]} viram ${sim[i]} e ${sim[i + 1]}`);
      }
    }

    let pior = { d: Infinity };
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const d = distancia(sim[i], sim[j]);
        if (d < pior.d) pior = { d, i: i + 1, j: j + 1 };
      }
    }
    if (pior.d < LIMITE_TODOS) {
      desvios.push(`[${tema}] ${tipo}: séries ${pior.i} e ${pior.j} a d=${pior.d.toFixed(3)} (mínimo ${LIMITE_TODOS}) — não são vizinhas, mas um gráfico de ${series.length} séries põe as duas na mesma tela`);
    }
  }

  /* Elemento gráfico portador de informação: 3:1 pela 1.4.11. */
  series.forEach((h, i) => {
    const r = contrast(h, fundo);
    if (r < 3) falhas.push(`[${tema}] série ${i + 1} (${h}) a ${r.toFixed(2)}:1 contra o fundo — mínimo 3:1 (WCAG 1.4.11)`);
  });

  /* CATEGORIAS DE MÓDULO (ADR-032). Não são séries: não há ordem nem vizinho,
   * os seis coexistem numa grade. Por isso a conferência é de todos os pares,
   * e o que sai é DESVIO, não falha — o ícone e o nome escrito carregam a
   * distinção; a cor é reforço. Um par abaixo do limiar registra que aquelas
   * duas categorias se confundem para aquele tipo de visão. */
  const CATEGORIAS = ['academico', 'financeiro', 'atendimento', 'gestao', 'pessoas', 'acervo'];
  const cats = CATEGORIAS.map((c) => resolve(`var(--ucam-color-categoria-${c})`, mapa).toUpperCase());
  if (cats.every((h) => /^#[0-9A-F]{6}$/.test(h))) {
    for (const tipo of TIPOS) {
      const sim = cats.map((h) => ver(h, tipo));
      for (let i = 0; i < sim.length; i++) {
        for (let j = i + 1; j < sim.length; j++) {
          const d = distancia(sim[i], sim[j]);
          if (d < LIMITE_TODOS) desvios.push(`[${tema}] ${tipo}: categorias ${CATEGORIAS[i]} e ${CATEGORIAS[j]} a d=${d.toFixed(3)} (mínimo ${LIMITE_TODOS}) — ícone e nome escrito carregam a distinção`);
        }
      }
    }
    relatos.push(`  [${tema}] 6 categorias de módulo conferidas entre si`);
  } else {
    falhas.push(`[${tema}] tokens color.categoria.* incompletos: ${cats.join(', ')}`);
  }
}

console.log('daltonismo — séries de gráfico sob protanopia, deuteranopia e tritanopia');
for (const r of relatos) console.log(r);

if (desvios.length) {
  console.log('\n⚠ desvios nomeados (pares não-vizinhos e paleta achatada):');
  for (const d of desvios) console.log('  ' + d);
  console.log('  a mitigação em vigor é a tabela equivalente sempre no DOM (contrato do chart),');
  console.log('  que é o que de fato torna o gráfico legível sem cor. A cor é reforço, não portadora.');
}

if (falhas.length) {
  console.error(`\n✗ ${falhas.length} falha(s) de separação entre séries vizinhas:`);
  for (const f of falhas) console.error('  ' + f);
  process.exit(1);
}

console.log('\n✓ séries vizinhas separáveis nas três dicromacias, nos dois temas');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) principal();
