/**
 * Portão: a base ZardUI obedece à geometria que a spec do DSUCAM declara?
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
  ['button/button.variants.ts', 'zSize.default', CONTROL_MD, /default: '(h-\d+) gap-1\.5 px-2\.5 has-data/],
  ['button/button.variants.ts', 'zSize.sm', CONTROL_SM, /sm: "(h-\d+) gap-1 rounded-\[min/],
  ['button/button.variants.ts', 'zSize.lg', CONTROL_LG, /lg: '(h-\d+) gap-1\.5 px-2\.5 has-data/],
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

  // --- raio do botão
  // A base fecha o botão em `rounded-md` (calc(--radius - 2px) = 8px) enquanto
  // o Trilho A usa radius-lg (10px) — a ponte de tokens já aponta `--radius`
  // para o lg justamente porque é o que a base assume no resto.
  ['button/button.variants.ts', 'zShape.default', 'rounded-lg', /zShape: \{\s*default: '(rounded-[a-z]+)'/],
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
// tem token correspondente no DSUCAM e não deve ter.
const IGNORADOS = new Set(['sidebar-width-icon']);

const semPonte = [...lidos].filter((n) => !declarados.has(n) && !IGNORADOS.has(n)).sort();
for (const n of semPonte) {
  problemas.push(`  ✗ a base lê --${n}, e a ponte de tokens não o declara: renderiza sem cor`);
}

if (problemas.length) {
  console.error('\n✗ geometria: a base ZardUI diverge da spec do DSUCAM.\n');
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
