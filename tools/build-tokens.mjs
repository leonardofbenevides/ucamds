// Gera @ucam/tokens a partir de spec/tokens/.
// Saídas: CSS custom properties, SCSS, JSON resolvido e bloco @theme do Tailwind v4.
//
// Falha o build se qualquer par texto/superfície reprovar em contraste — nos
// DOIS temas. É o portão que impede token inacessível de chegar às aplicações.
//
//   node tools/build-tokens.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = join(ROOT, 'spec', 'tokens');
const OUT = join(ROOT, 'dist', 'tokens');

// O SEGUNDO DESTINO É O QUE O TRILHO A CONSOME. A página de instalação ensina
// um <link> para `{host}/tokens/ucam-tokens.css` — e durante meses esse link
// deu 404, porque os tokens só existiam em dist/, que não é publicado. O site
// serve `site/src/assets/` na raiz (publicDir do vite), então escrever aqui é
// o que põe o arquivo no ar. Sem isto, a primeira linha que um dev do parque
// legado copia não funciona.
const OUT_SITE = join(ROOT, 'site', 'src', 'assets', 'tokens');
const read = (f) => JSON.parse(readFileSync(join(SPEC, f), 'utf8'));

const primitive = read('primitive.json');
const semantic = read('semantic.json');
const dark = read('theme.dark.json');

/* ------------------------------------------------------------ contraste --- */
// A matemática vive em tools/lib/wcag.mjs — o site consome a mesma função, para
// que o portão de build e a documentação nunca discordem sobre um contraste.

import { contrast as ratio } from './lib/wcag.mjs';

/* ----------------------------------------------------------- resolução --- */

function lookup(root, path) {
  let cur = root;
  for (const seg of path) cur = cur?.[seg];
  return cur;
}

function resolve(value) {
  if (typeof value !== 'string' || !value.startsWith('{')) return value;
  const node = lookup(primitive, value.replace(/[{}]/g, '').split('.'));
  if (!node || !('$value' in node)) throw new Error(`referência quebrada: ${value}`);
  return node.$value;
}

// Achata uma árvore DTCG em [{ name: 'color-text-primary', value, ref, group }]
function flatten(node, trail = [], out = []) {
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith('$') || key.startsWith('_')) continue;
    if (val && typeof val === 'object' && '$value' in val) {
      const raw = val.$value;
      out.push({
        path: [...trail, key],
        name: [...trail, key].join('-'),
        ref: typeof raw === 'string' && raw.startsWith('{') ? raw : null,
        value: typeof raw === 'object' ? raw : resolve(raw),
        composite: typeof raw === 'object',
        description: val.$description ?? '',
        group: trail[0] ?? key,
      });
    } else if (val && typeof val === 'object') {
      flatten(val, [...trail, key], out);
    }
  }
  return out;
}

const primFlat = flatten(primitive);
const semFlat = flatten(semantic);
const darkFlat = flatten(dark);

// Tokens compostos (tipografia) viram várias custom properties.
function expandComposite(t) {
  return Object.entries(t.value).map(([prop, v]) => ({
    name: `${t.name}-${prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`,
    value: typeof v === 'string' && v.startsWith('{') ? resolve(v) : v,
  }));
}

/* -------------------------------------------------------- portão de a11y --- */

const falhas = [];
const desvios = [];

function checar(tema, tokens) {
  const get = (name) => tokens.find((t) => t.name === name)?.value;
  const surface = get('color-surface-default');
  const canvas = get('color-surface-canvas');
  const brand = get('color-surface-brand');

  const pares = [
    ['color-text-primary', surface, 'texto principal sobre card', 4.5],
    ['color-text-primary', canvas, 'texto principal sobre página', 4.5],
    ['color-text-secondary', surface, 'texto de apoio sobre card', 4.5],
    // ADR-034: o conteúdo assenta no chão cinza. Tudo que não está dentro de
    // cartão — rótulo de campo solto, legenda de seção, meta — lê sobre ele.
    ['color-text-primary', get('color-surface-chao'), 'texto principal sobre o chão do conteúdo', 4.5],
    ['color-text-secondary', get('color-surface-chao'), 'texto de apoio sobre o chão do conteúdo', 4.5],
    // O número do indicador é o único portador do tom no ladrilho (ADR-034).
    // 22px com peso 560 não é texto grande: 4,5, não 3.
    ['color-feedback-success-numeral', surface, 'número de indicador em sucesso', 4.5],
    ['color-feedback-warning-numeral', surface, 'número de indicador em atenção', 4.5],
    ['color-feedback-danger-numeral', surface, 'número de indicador em perigo', 4.5],
    // A faixa do cabeçalho da tabela. Fundo novo é par de contraste novo: sem
    // esta linha, surface.sunken poderia escurecer num tema futuro e levar o
    // rótulo de coluna consigo, em silêncio.
    ['color-text-secondary', get('color-surface-sunken'), 'rótulo de coluna sobre a faixa do cabeçalho', 4.5],
    ['color-text-placeholder', surface, 'placeholder sobre campo', 4.5],
    ['color-text-on-brand', brand, 'texto sobre faixa da marca', 4.5],
    // O chip de campus vive nesta superfície. É contexto crítico — a mesma tela
    // mostra dados diferentes por campus — e hoje, no legado, reprova.
    ['color-text-on-brand', get('color-surface-brand-raised'), 'texto sobre superfície elevada da marca', 4.5],
    ['color-border-on-brand', brand, 'filete sobre a faixa da marca', 3],
    ['color-text-on-action', get('color-action-primary-default'), 'rótulo sobre ação primária', 4.5],
    ['color-text-on-action', get('color-action-danger-default'), 'rótulo sobre ação destrutiva', 4.5],
    // Hover e active também: o rótulo não sai do botão quando o ponteiro entra.
    // Ficaram de fora até 31/08/2026 e foi por isso que dois defeitos do tema
    // escuro passaram — o hover do primário em 3,48:1 e o do destrutivo
    // apontando para um rosa quase branco. Estado transitório continua sendo
    // texto que alguém precisa ler.
    ['color-text-on-action', get('color-action-primary-hover'), 'rótulo sobre ação primária em hover', 4.5],
    ['color-text-on-action', get('color-action-primary-active'), 'rótulo sobre ação primária pressionada', 4.5],
    ['color-text-on-action', get('color-action-danger-hover'), 'rótulo sobre ação destrutiva em hover', 4.5],
    // ADR-015 partiu o vermelho em eixo próprio e criou pares que esta lista
    // não conhecia. Entram aqui pelo mesmo argumento que trouxe os hovers em
    // 31/08: par não conferido é par que passa a reprovar em silêncio na
    // próxima mexida de tema. Os três primeiros são o tom sobre secondary e
    // ghost, onde o vermelho vira TEXTO e não preenchimento.
    ['color-text-on-action', get('color-action-danger-active'), 'rótulo sobre ação destrutiva pressionada', 4.5],
    ['color-action-danger-default', surface, 'destrutivo como texto sobre card', 4.5],
    ['color-action-danger-default', canvas, 'destrutivo como texto sobre página', 4.5],
    ['color-action-danger-default', get('color-action-danger-subtle'), 'destrutivo como texto sobre o próprio hover', 4.5],
    // O chip de filtro aplicado: texto da marca sobre o fundo tinto suave.
    ['color-action-primary-default', get('color-action-primary-subtle'), 'chip de filtro aplicado', 4.5],
    // color.action.primary.default pinta TEXTO além de preenchimento — item de
    // nav ativo, aba selecionada. Nenhum par de texto do tema escuro passava
    // por aqui, e o valor antigo dava 2,99:1 sobre o card.
    ['color-action-primary-default', surface, 'ação primária como texto sobre card', 4.5],
    ['color-text-link', surface, 'link sobre card', 4.5],
    ['color-border-focus', surface, 'anel de foco sobre card', 3],
    // WCAG 1.4.11: o limite visual que identifica um componente exige 3:1.
    // Vale para a borda do campo E para a do botão secundário — é ela que
    // diz onde o botão começa.
  ];

  // ADR-009: a borda em REPOUSO é um desvio consciente da 1.4.11, trocado por
  // repouso visual. Vira aviso nomeado, não falha silenciosa — e o anel de
  // foco, que carrega a identificação, continua sendo exigido acima.
  for (const [tok, desc] of [
    ['color-border-default', 'borda de campo em repouso'],
    ['color-action-secondary-border', 'borda do botão secundário em repouso'],
  ]) {
    const f = get(tok);
    if (!f) continue;
    const r = ratio(f, surface);
    if (r < 3) desvios.push({ tema, desc, tok, valor: f, r, min: 3, criterio: '1.4.11', porque: 'ADR-009: repouso visual, com hover e anel de foco carregando a identificação em 3:1' });
  }

  // O TEXTO DESABILITADO, contra o fundo que ele realmente tem.
  //
  // A 1.4.3 isenta componente inativo, então isto não pode ser falha. Mas
  // ficar de fora da conta foi pior: a descrição de action.disabled.text
  // afirmava "4.80:1", número que não corresponde a par nenhum — o mais
  // próximo é 4,71:1 contra BRANCO, e o botão desabilitado não é branco, é
  // action.disabled.background. Medir contra a superfície errada é o jeito
  // mais fácil de um desvio virar promessa.
  //
  // ADR-042 reorganizou os dois pares por SUPERFÍCIE, que é a única coisa que
  // um número de contraste pode responder. action.disabled.text veste o que
  // tem chão próprio — botão, campo, caixa, radio — e se mede contra esse
  // chão. color-text-disabled é tinta apagada solta sobre o card, e é contra o
  // card que ela responde. A linha antiga media o texto de campo contra
  // surface.subtle do tema CLARO; no escuro o campo desabilitado nunca esteve
  // nessa superfície, e foi por isso que 2,10:1 passou por aqui sem um aviso.
  for (const [fg, bg, desc] of [
    ['color-action-disabled-text', get('color-action-disabled-background'), 'tinta de controle desabilitado sobre o próprio chão'],
    ['color-text-disabled', surface, 'tinta desabilitada sobre superfície comum'],
  ]) {
    const f = get(fg);
    if (!f || !bg) continue;
    const r = ratio(f, bg);
    if (r < 4.5) desvios.push({ tema, desc, tok: fg, valor: f, r, min: 4.5, criterio: '1.4.3', porque: 'componente inativo é isento — o número existe para que a isenção seja escolhida e não descoberta' });
  }

  for (const [fg, bg, desc, min] of pares) {
    const f = get(fg);
    if (!f || !bg) continue;
    const r = ratio(f, bg);
    if (r < min) falhas.push({ tema, desc, fg, valor: f, bg, r, min });
  }

  // Cada tom de feedback: foreground sobre seu próprio background.
  for (const tom of ['success', 'warning', 'danger', 'info']) {
    const f = get(`color-feedback-${tom}-foreground`);
    const b = get(`color-feedback-${tom}-background`);
    if (!f || !b) continue;
    const r = ratio(f, b);
    if (r < 4.5) falhas.push({ tema, desc: `feedback ${tom}`, fg: `color-feedback-${tom}-foreground`, valor: f, bg: b, r, min: 4.5 });
  }
}

// O tema escuro é o claro com as sobrescritas aplicadas por cima.
const darkNames = new Set(darkFlat.map((t) => t.name));
const darkResolved = [...semFlat.filter((t) => !darkNames.has(t.name)), ...darkFlat];

checar('claro', semFlat);
checar('escuro', darkResolved);

/* ------------------------------------------------------------- saídas --- */

const P = 'ucam';
const banner = (fmt) => `/* @ucam/tokens — gerado de spec/tokens/ por tools/build-tokens.mjs
 * NÃO EDITAR À MÃO. Edite a spec e rode: pnpm tokens
 * Formato: ${fmt}
 */\n`;

const cssVar = (t) => {
  if (t.composite) return expandComposite(t).map((e) => `  --${P}-${e.name}: ${e.value};`).join('\n');
  return `  --${P}-${t.name}: ${t.value};`;
};

// 1. CSS custom properties, com os dois temas nos três estados de tema.
const cssPrimitives = primFlat.map(cssVar).join('\n');
const cssSemantic = semFlat.map(cssVar).join('\n');
const cssDark = darkFlat.map(cssVar).join('\n');
// Dentro do @media o bloco ganha um nível a mais de aninhamento.
const cssDarkIndented = cssDark.replace(/^/gm, '  ');

const css = `${banner('CSS custom properties')}
/* color-scheme diz ao NAVEGADOR qual é o tema, e nenhum token consegue dizer
 * isso por ele. Sem esta linha o cromo nativo continua claro sobre a página
 * escura: barra de rolagem com trilho branco, lista aberta de <select>, cursor
 * de texto, calendário do date input e os controles de <video>.
 *
 * Acompanha os MESMOS três estados dos tokens de cor. Precisa estar em :root:
 * só o elemento raiz propaga para o cromo do documento. */
:root { color-scheme: light; }

:root {
  /* camada 1 — primitivos. Não referencie diretamente (ADR-007). */
${cssPrimitives}

  /* camada 2 — semânticos. É o que aplicações usam. */
${cssSemantic}
}

/* camada 3 — tema escuro.
   Três estados: escolha explícita (data-theme), preferência do sistema
   (sem marcação no elemento raiz) e escolha explícita de tema claro, que
   precisa vencer um sistema em escuro. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${cssDarkIndented}
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
${cssDark}
}
`;

// 2. SCSS
const scssLine = (t) => {
  if (t.composite) return expandComposite(t).map((e) => `$${P}-${e.name}: ${e.value};`).join('\n');
  return `$${P}-${t.name}: ${t.value};`;
};
const scss = `${banner('SCSS')}
${primFlat.map(scssLine).join('\n')}

${semFlat.map(scssLine).join('\n')}

$${P}-semantic: (
${semFlat.filter((t) => !t.composite).map((t) => `  "${t.name}": $${P}-${t.name}`).join(',\n')}
);
`;

// 3. JSON resolvido — consumo programático, Figma e MCP.
const json = {
  $generated: new Date().toISOString(),
  $source: 'spec/tokens/',
  primitive: Object.fromEntries(primFlat.filter((t) => !t.composite).map((t) => [t.name, t.value])),
  semantic: Object.fromEntries(semFlat.map((t) => [t.name, { value: t.value, ref: t.ref, description: t.description }])),
  dark: Object.fromEntries(darkFlat.map((t) => [t.name, { value: t.value, ref: t.ref }])),
};

// 4. Tailwind v4 — bloco @theme apontando para as custom properties, para
//    que a troca de tema continue funcionando em runtime.
const tw = `${banner('Tailwind v4 @theme')}
@import "./ucam-tokens.css";

@theme {
${semFlat.filter((t) => t.group === 'color' && !t.composite).map((t) => `  --color-${t.name.replace(/^color-/, '')}: var(--${P}-${t.name});`).join('\n')}

${semFlat.filter((t) => t.group === 'space').map((t) => `  --spacing-${t.name.replace(/^space-/, '')}: var(--${P}-${t.name});`).join('\n')}

${primFlat.filter((t) => t.group === 'radius').map((t) => `  --radius-${t.name.replace(/^radius-/, '')}: var(--${P}-${t.name});`).join('\n')}

${semFlat.filter((t) => t.path[0] === 'motion' && t.path[1] === 'easing').map((t) => `  --ease-${t.path[2]}: var(--${P}-${t.name});`).join('\n')}

  /* O PADRÃO das utilitárias transition-*, e não é detalhe.
   *
   * O Tailwind v4 entrega transition-colors com cubic-bezier(0.4, 0, 0.2, 1)
   * e 150ms. Essa curva é simétrica: acelera no começo e desacelera no fim.
   * O Trilho A inteiro move em ease-out — então, sem estas duas linhas, um
   * ucam-button do Angular e um .ucam-btn do CSS puro fazem a MESMA troca
   * de cor em curvas diferentes, e ninguém percebe olhando um de cada vez.
   *
   * Sobrescrever o padrão, em vez de pedir ease-standard em cada wrapper, é
   * o que faz a ADR-013 valer por construção: o componente que esquecer de
   * declarar curva já acerta. */
  --default-transition-timing-function: var(--${P}-motion-easing-standard);
  --default-transition-duration: var(--${P}-motion-duration-state);
}
`;

// 5. Ponte ZardUI. Os componentes copiados da ZardUI usam a nomenclatura do
//    shadcn (--primary, --destructive, --ring...). Em vez de reescrever cada
//    componente, remapeamos esses nomes para os tokens semânticos da UCAM.
//    Assim o código da base continua intacto e ainda assim obedece à marca —
//    é o que torna a atualização da ZardUI barata (ADR-006).
const PONTE = [
  ['background', 'color-surface-canvas'],
  ['foreground', 'color-text-primary'],
  ['card', 'color-surface-default'],
  ['card-foreground', 'color-text-primary'],
  ['popover', 'color-surface-raised'],
  ['popover-foreground', 'color-text-primary'],
  ['primary', 'color-action-primary-default'],
  ['primary-foreground', 'color-text-on-action'],
  ['secondary', 'color-action-secondary-default'],
  ['secondary-foreground', 'color-text-primary'],
  ['muted', 'color-surface-subtle'],
  ['muted-foreground', 'color-text-secondary'],
  ['accent', 'color-action-primary-subtle'],
  ['accent-foreground', 'color-action-primary-default'],
  ['destructive', 'color-action-danger-default'],
  ['destructive-foreground', 'color-text-on-action'],
  ['border', 'color-border-default'],
  ['input', 'color-border-default'],
  ['ring', 'color-border-focus'],
  ['sidebar', 'color-surface-default'],
  ['sidebar-foreground', 'color-text-primary'],
  ['sidebar-primary', 'color-action-primary-default'],
  ['sidebar-primary-foreground', 'color-text-on-action'],
  ['sidebar-accent', 'color-surface-subtle'],
  ['sidebar-accent-foreground', 'color-text-primary'],
  ['sidebar-border', 'color-border-subtle'],
  ['sidebar-ring', 'color-border-focus'],
  // O z-chart pinta série por série lendo --chart-N. São CINCO na base e SEIS
  // na UCAM: o sexto slot não tem nome shadcn para ocupar, e por isso o wrapper
  // ucam-chart nunca depende destes nomes — ele passa a cor de cada série
  // explicitamente. Mapear os cinco aqui é rede de segurança: se alguém montar
  // um z-chart cru dentro de um app UCAM, ele já sai na paleta certa em vez do
  // azul de fábrica da base.
  ['chart-1', 'color-chart-series-1'],
  ['chart-2', 'color-chart-series-2'],
  ['chart-3', 'color-chart-series-3'],
  ['chart-4', 'color-chart-series-4'],
  ['chart-5', 'color-chart-series-5'],
];

const semNames = new Set(semFlat.map((t) => t.name));
const ponteFaltando = PONTE.filter(([, ucam]) => !semNames.has(ucam));

const ponte = `${banner('ponte ZardUI → tokens UCAM')}
/* Importe DEPOIS do styles.css da ZardUI: estas declarações sobrescrevem o
 * tema neutro que o zard-cli instalou. Os componentes da base continuam
 * escrevendo bg-primary; o valor passa a vir da UCAM. */

@import "./ucam-tokens.css";

:root {
${PONTE.map(([shad, ucam]) => `  --${shad}: var(--${P}-${ucam});`).join('\n')}
  /* lg, não md: é o 0.625rem que a própria base assume. Com md os
     componentes do ZardUI ficavam mais quadrados aqui do que na origem. */
  --radius: var(--${P}-radius-lg);

  /* A ESCALA INTEIRA, degrau por degrau — não só o --radius.
   *
   * O tema do shadcn DERIVA os outros degraus por aritmética
   * (sm = radius - 4px, md = radius - 2px, xl = radius + 4px). Com --radius em
   * 0.625rem isso dá sm=6px e md=8px, enquanto a spec do DSUCAM declara
   * sm=4px e md=6px: DOIS dos quatro degraus ficavam errados, em silêncio, em
   * todo componente da base. Foi assim que o checkbox saiu com 6px de raio
   * onde o mesmo checkbox em CSS puro tinha 4px.
   *
   * Escala derivada é escala que não obedece à spec. Aqui cada degrau aponta
   * para o token que a spec declara, e nenhuma conta acontece pelo caminho. */
${['sm', 'md', 'lg', 'xl'].map((d) => `  --radius-${d}: var(--${P}-radius-${d});`).join('\n')}

  /* A CURVA, pela mesma porta que o raio.
   *
   * A ponte existe para que a base obedeça à UCAM sem reescrever a base. O
   * mesmo argumento vale para movimento: os wrappers usam transition-colors
   * do Tailwind, cujo padrão de fábrica é cubic-bezier(0.4, 0, 0.2, 1) em
   * 150ms — curva SIMÉTRICA. O Trilho A move em ease-out. Sem estas linhas,
   * um ucam-button do Angular e um .ucam-btn do CSS puro fazem a mesma troca
   * de cor em curvas diferentes.
   *
   * Funciona no :root, e não só dentro de @theme, porque a utilitária que o
   * Tailwind v4 gera não crava a curva: ela emite
   * transition-timing-function: var(--tw-ease, var(--default-transition-timing-function)).
   * É consulta em tempo de execução, então redefinir a variável basta.
   * @ucam/ui não importa o bloco @theme — a ponte é o único arquivo gerado
   * que a lib carrega, e por isso é aqui que isto tem de estar. */
  --default-transition-timing-function: var(--${P}-motion-easing-standard);
  --default-transition-duration: var(--${P}-motion-duration-state);
  --ease-standard: var(--${P}-motion-easing-standard);
  --ease-entrance: var(--${P}-motion-easing-entrance);
  --ease-emphasized: var(--${P}-motion-easing-emphasized);
}
`;

const arquivos = [
  ['ucam-zard-bridge.css', ponte],
  ['ucam-tokens.css', css],
  ['_ucam-tokens.scss', scss],
  ['ucam-tokens.json', JSON.stringify(json, null, 2)],
  ['ucam-theme.css', tw],
];

for (const destino of [OUT, OUT_SITE]) {
  if (!existsSync(destino)) mkdirSync(destino, { recursive: true });
  for (const [nome, conteudo] of arquivos) writeFileSync(join(destino, nome), conteudo, 'utf8');
}

const kb = (s) => (s.length / 1024).toFixed(1) + ' KB';
console.log('@ucam/tokens → dist/tokens/ e site/src/assets/tokens/ (servido em /tokens)');
console.log(`  ucam-tokens.css    ${kb(css)}   ${primFlat.length} primitivos + ${semFlat.length} semânticos + ${darkFlat.length} no escuro`);
console.log(`  _ucam-tokens.scss  ${kb(scss)}`);
console.log(`  ucam-tokens.json   ${kb(JSON.stringify(json, null, 2))}`);
console.log(`  ucam-theme.css     ${kb(tw)}   Tailwind v4`);
console.log(`  ucam-zard-bridge.css ${kb(ponte)} ${PONTE.length} nomes shadcn remapeados`);

// Um nome da ponte apontando para token inexistente faria a ZardUI cair no
// valor neutro dela sem avisar — falha silenciosa, a pior categoria.
if (ponteFaltando.length) {
  console.error('\n✗ ponte ZardUI aponta para tokens que não existem:');
  for (const [shad, ucam] of ponteFaltando) console.error(`  --${shad} → ${ucam}`);
  process.exit(1);
}

if (falhas.length) {
  console.error(`\n✗ ${falhas.length} par(es) reprovando em contraste:`);
  for (const f of falhas) {
    console.error(`  [${f.tema}] ${f.desc}`);
    console.error(`      ${f.fg} (${f.valor}) sobre ${f.bg} = ${f.r.toFixed(2)}:1, mínimo ${f.min}:1`);
  }
  process.exit(1);
}
if (desvios.length) {
  console.log('\n⚠ desvios conscientes, por critério:');
  for (const c of [...new Set(desvios.map((d) => d.criterio))]) {
    const doGrupo = desvios.filter((d) => d.criterio === c);
    console.log(`  WCAG ${c} — ${doGrupo[0].porque}`);
    for (const d of doGrupo) {
      console.log(`    [${d.tema}] ${d.desc} — ${d.valor} = ${d.r.toFixed(2)}:1, mínimo ${d.min}:1`);
    }
  }
}
console.log('\n✓ contraste verificado nos dois temas');
