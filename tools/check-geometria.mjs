/**
 * Portão: a base ZardUI obedece à geometria que a spec do UCAMDS declara?
 *
 * O design system promete, em toda página do catálogo, que o componente
 * Angular (base ZardUI) e o preview em CSS puro são "a mesma marca, os mesmos
 * tokens". Medido no navegador, não eram:
 *
 *     button      vivo 32px raio 8px   ·  Trilho A 36px raio 10px
 *     select      vivo 32px  16px/400  ·  Trilho A 36px  14px/400
 *     text-field  vivo 32px            ·  Trilho A 36px
 *
 * Quatro pixels em TODO controle de formulário. A causa é que a base traz a
 * escala do shadcn (h-8 = 32px no tamanho padrão) enquanto a spec declara
 * `size.control-md = 2.25rem`, e ninguém reconciliava as duas. As cores
 * passavam pela ponte de tokens; a GEOMETRIA não passava por lugar nenhum.
 *
 * Este portão fecha esse buraco. Ele traduz os tokens de tamanho da spec para
 * as classes do Tailwind (h-N = N × 0.25rem) e cobra o valor em cada ponto
 * onde a base declara geometria de controle.
 *
 * Por que na base e não nos wrappers: o wrapper corrige um componente por vez,
 * e o próximo a ser embrulhado nasceria errado de novo. A ADR-006 trata a
 * ZardUI como matéria-prima copiada, não como dependência — corrigir a cópia é
 * o previsto. O custo, já assumido nos dois patches anteriores, é que um
 * futuro `zard-cli add` reverte isto em silêncio; é exatamente contra esse
 * silêncio que o portão existe.
 *
 *   node tools/check-geometria.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = path.join(ROOT, 'ui/projects/ui/src/lib/shared/components');

const semantic = JSON.parse(fs.readFileSync(path.join(ROOT, 'spec/tokens/semantic.json'), 'utf8'));

/** rem declarado na spec → classe de altura do Tailwind (h-N = N × 0.25rem). */
function classeAltura(token) {
  const valor = semantic.size?.[token]?.$value;
  if (!valor) throw new Error(`spec/tokens/semantic.json não declara size.${token}`);
  const rem = parseFloat(valor);
  const n = rem / 0.25;
  if (!Number.isInteger(n)) throw new Error(`size.${token} = ${valor} não cai na escala do Tailwind`);
  return `h-${n}`;
}

const CONTROL_SM = classeAltura('control-sm');
const CONTROL_MD = classeAltura('control-md');
const CONTROL_LG = classeAltura('control-lg');

/** O degrau primitivo que o papel radius.control referencia → classe do Tailwind. */
function classeRaio(papel) {
  const ref = semantic.radius?.[papel]?.$value;
  const m = /^\{radius\.([a-z0-9]+)\}$/.exec(ref ?? '');
  if (!m) {
    throw new Error(`spec/tokens/semantic.json: radius.${papel} não referencia um degrau primitivo ({radius.x})`);
  }
  return `rounded-${m[1]}`;
}
const RAIO_CONTROLE = classeRaio('control');

/**
 * Um papel de espaço ({space.N}) → utilitária do Tailwind. O degrau primitivo
 * JÁ é o passo do Tailwind (space.4 = 1rem = px-4), então não há conta.
 */
function classeEspaco(prefixo, papel) {
  const ref = semantic.space?.[papel]?.$value;
  const m = /^\{space\.(\d+)\}$/.exec(ref ?? '');
  if (!m) throw new Error(`spec/tokens/semantic.json: space.${papel} não referencia um degrau primitivo ({space.N})`);
  return `${prefixo}-${m[1]}`;
}
const RECUO_SM = classeEspaco('px', 'inset-sm');
const RECUO_MD = classeEspaco('px', 'inset-md');
const RECUO_LG = classeEspaco('px', 'inset-lg');
const VAO = classeEspaco('gap', 'inline-xs');

/**
 * Onde a base declara geometria de controle, e o que a spec manda ali.
 *
 * A lista é explícita, e não uma varredura por `h-\d+`, porque nem toda altura
 * na base é um controle: a linha de cabeçalho da tabela, a faixa de abas e a
 * densidade própria do sidebar não respondem a `size.control-*` e não devem
 * ser arrastadas junto.
 */
const EXIGENCIAS = [
  // --- alturas de controle
  ['button/button.variants.ts', 'zSize.default', CONTROL_MD, /default: '(h-\d+) gap-[\d.]+ px-[\d.]+ has-data/],
  ['button/button.variants.ts', 'zSize.sm', CONTROL_SM, /sm: "(h-\d+) gap-1 rounded-\[min/],
  ['button/button.variants.ts', 'zSize.lg', CONTROL_LG, /lg: '(h-\d+) gap-[\d.]+ px-[\d.]+ has-data/],

  // --- recuo e vão do botão e do campo
  // O mesmo defeito do raio, um eixo ao lado (04/10/2026): a base trazia
  // px-2.5 (10px) e gap-1.5 (6px) do shadcn; a folha do Trilho A usa
  // space.inset-md (16px) no botão, inset-sm (12px) no pequeno e no campo,
  // inset-lg no grande, e space.inline-xs (4px) de vão. Medido pela prova de
  // paridade (ADR-058): botão de texto 12px mais estreito no Trilho B.
  //
  // Com ícone, o recuo cai para 8px DOS DOIS LADOS (has-data-[icon]:px-2).
  // É o que a folha RENDERIZA: a regra dela diz "o lado do ícone respira
  // menos", mas :has(> .ic:last-child) casa também o ícone seguido de texto
  // (nó de texto não é filho-elemento), e todo botão com um ícone sai 8/8
  // nas 31 telas de referência. A base acompanha o que a referência mostra;
  // se a folha um dia separar os lados, este ponto muda junto.
  ['button/button.variants.ts', 'zSize.default recuo', RECUO_MD, /default: 'h-\d+ gap-[\d.]+ (px-[\d.]+) has-data/],
  ['button/button.variants.ts', 'zSize.lg recuo', RECUO_LG, /lg: 'h-\d+ gap-[\d.]+ (px-[\d.]+) has-data/],
  ['button/button.variants.ts', 'zSize.sm recuo', RECUO_SM, /sm: "h-\d+ gap-1 rounded-\[[^\]]+\] (px-[\d.]+) text-xs/],
  ['button/button.variants.ts', 'zSize.default vão', VAO, /default: 'h-\d+ (gap-[\d.]+) px-/],
  ['input/input.variants.ts', 'inputVariants recuo', RECUO_SM, /bg-transparent (px-[\d.]+) py-1 text-base/],
  ['input/input.variants.ts', 'inputVariants', CONTROL_MD, /cva\(\s*'(h-\d+) w-full min-w-0/],
  ['select/select.variants.ts', 'selectTriggerVariants', CONTROL_MD, /'flex (h-\d+) px-3 py-2 w-full/],
  ['input-group/input-group.variants.ts', 'inputGroupVariants', CONTROL_MD, /relative flex (h-\d+) w-full min-w-0/],

  // O textarea nasce com três linhas de controle — é o que o @ucam/css faz
  // com `calc(size-control-md * 3)`. A base trazia min-h-16 (64px), quase
  // metade: o mesmo campo tinha dois tamanhos conforme o trilho.
  [
    'textarea/textarea.variants.ts',
    'textareaVariants',
    `min-h-${(parseFloat(semantic.size['control-md'].$value) * 3) / 0.25}`,
    /field-sizing-content (min-h-\d+) w-full/,
  ],

  // --- raio do controle
  // O raio sai do TOKEN (semantic radius.control), como as alturas. Até
  // 04/10/2026 este bloco cravava 'rounded-lg' com o comentário "o Trilho A
  // usa radius-lg" — verdade até 09/09, quando radius.control desceu para
  // radius.md (6px). O portão continuou exigindo o valor velho e passou a
  // SEGURAR a divergência: botão, campo, select e textarea com 8px de raio
  // no Trilho B e 6 no A, medido pela prova de paridade de tela (ADR-058).
  // Portão com valor escrito à mão envelhece junto com a decisão que copiou.
  ['button/button.variants.ts', 'zShape.default', RAIO_CONTROLE, /zShape: \{\s*default: '(rounded-[a-z]+)'/],
  ['button/button.variants.ts', 'base', RAIO_CONTROLE, /justify-center (rounded-[a-z]+) border border-transparent bg-clip-padding text-sm/],
  ['input/input.variants.ts', 'inputVariants', RAIO_CONTROLE, /w-full min-w-0 (rounded-[a-z]+) border border-input/],
  ['select/select.variants.ts', 'selectTriggerVariants', RAIO_CONTROLE, /justify-between gap-2 (rounded-[a-z]+) border border-input/],
  ['input-group/input-group.variants.ts', 'inputGroupVariants', RAIO_CONTROLE, /min-w-0 items-center (rounded-[a-z]+) border border-input/],
  ['textarea/textarea.variants.ts', 'textareaVariants', RAIO_CONTROLE, /w-full (rounded-[a-z]+) border border-input bg-transparent px-2\.5 py-2/],
];

const problemas = [];
for (const [arquivo, onde, esperado, padrao] of EXIGENCIAS) {
  const caminho = path.join(BASE, arquivo);
  if (!fs.existsSync(caminho)) {
    problemas.push(`  ✗ ${arquivo} não existe — a base mudou de forma`);
    continue;
  }
  const s = fs.readFileSync(caminho, 'utf8');
  const m = padrao.exec(s);
  if (!m) {
    problemas.push(`  ✗ ${arquivo} · ${onde}: não reconheci a declaração (a base mudou de forma)`);
    continue;
  }
  if (m[1] !== esperado) {
    problemas.push(`  ✗ ${arquivo} · ${onde}: está "${m[1]}", a spec pede "${esperado}"`);
  }
}

/* ---------------------------------------------------------------------------
 * 2. COBERTURA DA PONTE
 *
 * A base pinta tudo por nomes do vocabulário shadcn (`bg-primary`,
 * `text-muted-foreground`). Cada um desses nomes só vira cor da UCAM se a
 * ponte de tokens o declarar. Nome que a base lê e a ponte não declara não dá
 * erro nenhum: a propriedade fica vazia e o componente renderiza transparente
 * ou preto, e ninguém descobre até alguém abrir aquela tela.
 *
 * Hoje a cobertura é total. Este trecho existe para que continue sendo depois
 * de um `zard-cli add` que traga um componente usando --success ou --warning.
 * ------------------------------------------------------------------------- */
const VOCAB =
  '(background|foreground|card|popover|primary|secondary|muted|accent|destructive|success|warning|info|border|input|ring|sidebar)';

const fontesBase = [];
(function anda(d) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) anda(p);
    else if (e.name.endsWith('.ts') || e.name.endsWith('.css')) fontesBase.push(p);
  }
})(BASE);

const lidos = new Set();
const utilitaria = new RegExp(
  `\\b(?:bg|text|border|ring|fill|stroke|outline|divide|shadow|from|to|via|caret|accent)-${VOCAB}((?:-[a-z]+)*)`,
  'g',
);
const direta = new RegExp(`var\\(--${VOCAB}((?:-[a-z]+)*)\\)`, 'g');
for (const f of fontesBase) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(utilitaria)) lidos.add(m[1] + m[2]);
  for (const m of s.matchAll(direta)) lidos.add(m[1] + m[2]);
}

const ponte = fs.readFileSync(path.join(ROOT, 'ui/projects/ui/src/tokens/ucam-zard-bridge.css'), 'utf8');
const declarados = new Set([...ponte.matchAll(/^\s+--([a-z0-9-]+):/gm)].map((m) => m[1]));

// `sidebar-width-icon` é constante de layout do sidebar da base, não cor: não
// tem token correspondente no UCAMDS e não deve ter.
const IGNORADOS = new Set(['sidebar-width-icon']);

const semPonte = [...lidos].filter((n) => !declarados.has(n) && !IGNORADOS.has(n)).sort();
for (const n of semPonte) {
  problemas.push(`  ✗ a base lê --${n}, e a ponte de tokens não o declara: renderiza sem cor`);
}

if (problemas.length) {
  console.error('\n✗ geometria: a base ZardUI diverge da spec do UCAMDS.\n');
  console.error(problemas.join('\n'));
  console.error(
    '\n  Os dois trilhos precisam desenhar o mesmo controle. Ajuste a base ' +
      '(ADR-006:\n  matéria-prima copiada, não dependência) ou a spec — mas não deixe as duas discordando.\n',
  );
  process.exit(1);
}
console.log(
  `✓ geometria  base ZardUI alinhada à spec ` +
    `(sm=${CONTROL_SM} md=${CONTROL_MD} lg=${CONTROL_LG}), ${EXIGENCIAS.length} pontos conferidos\n` +
    `             ponte cobre os ${lidos.size} nomes shadcn que a base lê`,
);
