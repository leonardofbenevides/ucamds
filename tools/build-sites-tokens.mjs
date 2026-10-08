// Gera os tokens do UCAMDS Sites a partir de sites/spec/tokens/.
//
// Lê o primitivo COMPARTILHADO (spec/tokens/primitive.json) mais a extensão
// dos sites, a semântica dos sites e cada submarca (marca.<id>.json). Falha o
// build se a extensão redefinir degrau compartilhado, se houver hex cru na
// semântica, se uma submarca criar token em vez de sobrescrever, se algum par
// de contraste reprovar ou se marca e destrutivo encostarem — na base e em
// cada submarca. É o mesmo portão do build-tokens, para outro sistema.
//
//   node tools/build-sites-tokens.mjs
//
// Saídas em dist/sites/tokens/: CSS custom properties (--ucam-site-*), SCSS
// ($ucam-site-*, para a constitution do dev do CENPRE), JSON resolvido e um
// CSS por submarca, aplicado por data-marca="<id>" no elemento raiz.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { criarResolvedor, flatten, mesclarPrimitivos, aplicarCamada, cssVar, scssLine } from './lib/tokens.mjs';
import { contrast as ratio } from './lib/wcag.mjs';
import { conferirMarcaVsDestrutivo, DECISIVOS } from './check-marca-vs-destrutivo.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = 'ucam-site';

/* Os pares que o site mostra. Diferentes dos da aplicação: aqui há superfície
 * inversa e não há chão, tabela, indicador nem desabilitado em campo. Um par
 * cujo token não exista é pulado — a semântica mínima dos testes não declara
 * todos, e a real declara. */
const PARES = [
  ['color-text-primary', 'color-surface-canvas', 'texto principal sobre a página', 4.5],
  ['color-text-primary', 'color-surface-subtle', 'texto principal sobre seção recuada', 4.5],
  ['color-text-body', 'color-surface-canvas', 'corpo sobre a página', 4.5],
  ['color-text-body', 'color-surface-subtle', 'corpo sobre seção recuada', 4.5],
  ['color-text-secondary', 'color-surface-canvas', 'apoio sobre a página', 4.5],
  ['color-text-secondary', 'color-surface-subtle', 'apoio sobre seção recuada', 4.5],
  ['color-text-muted', 'color-surface-canvas', 'legenda sobre a página', 4.5],
  ['color-text-muted', 'color-surface-subtle', 'legenda sobre seção recuada', 4.5],
  ['color-text-muted', 'color-surface-sunken', 'placeholder sobre campo', 4.5],
  ['color-text-on-inverse', 'color-surface-inverse', 'texto sobre seção escura', 4.5],
  ['color-text-on-inverse-muted', 'color-surface-inverse', 'apoio sobre seção escura', 4.5],
  ['color-text-on-brand', 'color-surface-brand', 'texto sobre faixa de marca', 4.5],
  ['color-text-on-action', 'color-action-primary-default', 'rótulo sobre ação primária', 4.5],
  ['color-text-on-action', 'color-action-primary-hover', 'rótulo sobre ação primária em hover', 4.5],
  ['color-text-on-action', 'color-action-primary-active', 'rótulo sobre ação primária pressionada', 4.5],
  ['color-text-on-action', 'color-action-danger-default', 'rótulo sobre ação destrutiva', 4.5],
  ['color-text-on-action', 'color-action-danger-hover', 'rótulo sobre ação destrutiva em hover', 4.5],
  ['color-text-on-action', 'color-action-danger-active', 'rótulo sobre ação destrutiva pressionada', 4.5],
  ['color-action-primary-default', 'color-surface-canvas', 'ação primária como texto', 4.5],
  ['color-action-primary-default', 'color-action-primary-subtle', 'ação primária sobre a própria lavagem', 4.5],
  ['color-action-danger-default', 'color-surface-canvas', 'destrutivo como texto', 4.5],
  ['color-action-danger-default', 'color-action-danger-subtle', 'destrutivo sobre a própria lavagem', 4.5],
  ['color-text-link', 'color-surface-canvas', 'link sobre a página', 4.5],
  ['color-text-link', 'color-surface-subtle', 'link sobre seção recuada', 4.5],
  ['color-text-link-hover', 'color-surface-canvas', 'link em hover', 4.5],
  ['color-action-disabled-text', 'color-action-disabled-background', 'tinta de controle desabilitado', 4.5],
  ['color-border-focus', 'color-surface-canvas', 'anel de foco sobre a página', 3],
  ['color-border-focus-on-inverse', 'color-surface-inverse', 'anel de foco sobre seção escura', 3],
  ['color-action-secondary-border', 'color-surface-canvas', 'borda do botão secundário', 3],
];

/* Pares que dividem a tela do site. Não decidem a ação; viram desvio nomeado. */
const COEXISTEM_SITES = [
  ['ação primária × filete de erro', 'action-primary-default', 'feedback-danger-border'],
  ['anel de foco × botão destrutivo', 'border-focus', 'action-danger-default'],
  ['link × tinta de erro', 'text-link', 'feedback-danger-foreground'],
];

const banner = (fmt) => `/* @ucam/site-css — gerado de sites/spec/tokens/ por tools/build-sites-tokens.mjs
 * NÃO EDITAR À MÃO. Edite a spec e rode: pnpm sites
 * Formato: ${fmt}
 */\n`;

/* Onde está o scss de cada kit, por id de adaptador. Cada kit mora em OUTRO
 * repositório, então o caminho é da máquina: variável de ambiente, senão o
 * clone padrão do autor. Adaptador sem entrada aqui não tem cobertura
 * conferida — e diz isso, em vez de ser medido contra o kit errado. */
const KITS_PADRAO = {
  'cenpre-ui-kit': process.env.CENPRE_KIT ?? 'C:/Users/Leonardo/Documents/CENPRE/cenpre-ui-angular-scss/projects/cenpre-ui-kit/styles/_tokens.scss',
};

export function construir({ raiz = ROOT, kits = KITS_PADRAO } = {}) {
  const lerJson = (p) => JSON.parse(readFileSync(join(raiz, p), 'utf8'));
  const falhas = [];
  const desvios = [];
  const relatos = [];

  /* ------------------------------------------------------- as camadas --- */
  const primitive = mesclarPrimitivos(lerJson('spec/tokens/primitive.json'), lerJson('sites/spec/tokens/primitive.json'));
  const semantic = lerJson('sites/spec/tokens/semantic.json');
  const resolve = criarResolvedor(primitive);
  const primFlat = flatten(primitive, resolve);
  const semFlat = flatten(semantic, resolve);

  for (const t of semFlat) {
    if (t.group === 'color' && !t.composite && !t.ref) falhas.push(`hex cru em ${t.name}: cor na semântica referencia um primitivo (ADR-007)`);
  }

  const dirTokens = join(raiz, 'sites/spec/tokens');
  const nomesSem = new Set(semFlat.map((t) => t.name));
  // Todo marca.*.json é lido. Id fora de [a-z0-9-] não vira seletor CSS, e
  // ignorar o arquivo em silêncio seria a classe de buraco que estes portões
  // existem para fechar: é falha nomeada.
  const marcas = [];
  for (const f of readdirSync(dirTokens).filter((x) => /^marca\..+\.json$/.test(x)).sort()) {
    const id = f.slice('marca.'.length, -'.json'.length);
    if (!/^[a-z0-9-]+$/.test(id)) {
      falhas.push(`id de submarca inválido para seletor CSS: "${id}" (${f}) — use só [a-z0-9-]`);
      continue;
    }
    marcas.push({ id, flat: flatten(lerJson(join('sites/spec/tokens', f)), resolve) });
  }
  for (const m of marcas) {
    for (const t of m.flat) {
      if (!nomesSem.has(t.name)) falhas.push(`marca ${m.id} cria token ${t.name} — camada 3 só sobrescreve semânticos`);
      if (t.group === 'color' && !t.composite && !t.ref) falhas.push(`hex cru em ${t.name} (marca ${m.id})`);
    }
  }

  /* --------------------------------------------------------- portões --- */
  const variantes = [['base', semFlat], ...marcas.map((m) => [m.id, aplicarCamada(semFlat, m.flat)])];
  for (const [nome, tokens] of variantes) {
    const get = (n) => tokens.find((t) => t.name === n)?.value;
    // Par cujo token não existe não é medido — e isso fica ESCRITO, como
    // desvio nomeado. Renomear um token e ver o portão continuar verde seria
    // o silêncio que ele existe para impedir.
    for (const [fg, bg, desc, min] of PARES) {
      const f = get(fg);
      const b = get(bg);
      if (!f || !b) {
        desvios.push(`[${nome}] par não medido: ${desc} — falta ${!f ? fg : bg}`);
        continue;
      }
      const r = ratio(f, b);
      if (r < min) falhas.push(`[${nome}] ${desc}: ${fg} ${f} sobre ${bg} ${b} dá ${r.toFixed(2)}:1, mínimo ${min}`);
    }
    for (const tom of ['success', 'warning', 'danger', 'info']) {
      const f = get(`color-feedback-${tom}-foreground`);
      const b = get(`color-feedback-${tom}-background`);
      if (!f || !b) {
        desvios.push(`[${nome}] par não medido: feedback ${tom} — falta ${!f ? `color-feedback-${tom}-foreground` : `color-feedback-${tom}-background`}`);
        continue;
      }
      const r = ratio(f, b);
      if (r < 4.5) falhas.push(`[${nome}] feedback ${tom}: ${f} sobre ${b} dá ${r.toFixed(2)}:1`);
    }
    const cor = (n) => {
      const v = get(`color-${n}`);
      return typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v) ? v.toUpperCase() : null;
    };
    const faltaDecisivo = DECISIVOS.flatMap(([, a, b]) => [a, b]).find((n) => !cor(n));
    if (faltaDecisivo) {
      desvios.push(`[${nome}] marca × destrutivo não medido — falta color-${faltaDecisivo}`);
    } else {
      const r = conferirMarcaVsDestrutivo({ tema: nome, cor, coexistem: COEXISTEM_SITES.filter(([, a, b]) => cor(a) && cor(b)) });
      falhas.push(...r.falhas);
      desvios.push(...r.desvios);
      relatos.push(...r.relatos);
    }
  }

  /* ------------------------------------------------------ adaptadores --- */
  // Cada $nome do _tokens.scss do kit aponta para o semântico que o substitui.
  // É o mapa que o dev segue para trocar a folha, e a prova de que nada ficou
  // sem lugar. O scss mora em outro repositório: se está no disco, cobertura
  // incompleta é falha; se não está, é aviso — o CI não tem o clone.
  const dirAdapt = join(raiz, 'sites/spec/adapters');
  const semPaths = new Set(semFlat.map((t) => t.path.join('.')));
  if (existsSync(dirAdapt)) {
    for (const f of readdirSync(dirAdapt).filter((x) => x.endsWith('.json')).sort()) {
      const a = lerJson(join('sites/spec/adapters', f));
      for (const [nome, { destino }] of Object.entries(a.mapa)) {
        if (destino !== null && !semPaths.has(destino)) falhas.push(`adaptador ${a.id}: ${nome} aponta para ${destino}, que não existe na semântica dos sites`);
      }
      const kitScss = kits[a.id];
      if (kitScss && existsSync(kitScss)) {
        const declarados = new Set([...readFileSync(kitScss, 'utf8').matchAll(/^[ \t]*(\$[a-z0-9-]+)[ \t]*:/gm)].map((m) => m[1]));
        const semDestino = [...declarados].filter((n) => !(n in a.mapa));
        for (const n of semDestino) falhas.push(`${n} do kit sem destino no adaptador ${a.id}`);
        if (!semDestino.length) relatos.push(`  ✓ adaptador ${a.id}: ${declarados.size} nomes do kit, todos com destino`);
      } else {
        desvios.push(`adaptador ${a.id}: o scss do kit não está no disco (${kitScss ?? 'sem caminho: informe kits[id] ou a variável de ambiente'}); cobertura não conferida`);
      }
    }
  }

  /* ---------------------------------------------------------- saídas --- */
  const css = `${banner('CSS custom properties')}
:root {
  /* camada 1 — primitivos compartilhados e extensão. Não referencie (ADR-007). */
${primFlat.map((t) => cssVar(P, t, resolve)).join('\n')}

  /* camada 2 — semânticos dos sites. É o que os sites usam. */
${semFlat.map((t) => cssVar(P, t, resolve)).join('\n')}
}
`;

  const scss = `${banner('SCSS')}
${primFlat.map((t) => scssLine(P, t, resolve)).join('\n')}

${semFlat.map((t) => scssLine(P, t, resolve)).join('\n')}

$${P}-semantic: (
${semFlat.filter((t) => !t.composite).map((t) => `  "${t.name}": $${P}-${t.name}`).join(',\n')}
);
`;

  const json = JSON.stringify({
    $generated: new Date().toISOString(),
    $source: 'sites/spec/tokens/ (+ spec/tokens/primitive.json)',
    primitive: Object.fromEntries(primFlat.filter((t) => !t.composite).map((t) => [t.name, t.value])),
    semantic: Object.fromEntries(semFlat.map((t) => [t.name, { value: t.value, ref: t.ref, description: t.description }])),
    marcas: Object.fromEntries(marcas.map((m) => [m.id, Object.fromEntries(m.flat.map((t) => [t.name, { value: t.value, ref: t.ref }]))])),
  }, null, 2);

  const arquivos = [
    ['ucam-site-tokens.css', css],
    ['_ucam-site-tokens.scss', scss],
    ['ucam-site-tokens.json', json],
  ];
  for (const m of marcas) {
    arquivos.push([`ucam-site-marca-${m.id}.css`, `${banner(`submarca ${m.id} (camada 3)`)}
/* Importe DEPOIS de ucam-site-tokens.css. Aplica-se com data-marca="${m.id}"
 * no elemento raiz: só os semânticos listados mudam; o resto herda. */
:root[data-marca="${m.id}"] {
${m.flat.map((t) => cssVar(P, t, resolve)).join('\n')}
}
`]);
  }

  return { arquivos, falhas, desvios, relatos, marcas: marcas.map((m) => m.id) };
}

function principal() {
  const r = construir();
  console.log('tokens dos sites — base' + (r.marcas.length ? ` e submarca ${r.marcas.join(', ')}` : ''));
  for (const l of r.relatos) console.log(l);
  if (r.desvios.length) {
    console.log('\n⚠ desvios nomeados:');
    for (const d of r.desvios) console.log('  ' + d);
  }
  if (r.falhas.length) {
    console.error(`\n✗ ${r.falhas.length} falha(s):`);
    for (const f of r.falhas) console.error('  ' + f);
    process.exit(1);
  }
  const out = join(ROOT, 'dist', 'sites', 'tokens');
  if (!existsSync(out)) mkdirSync(out, { recursive: true });
  for (const [nome, conteudo] of r.arquivos) writeFileSync(join(out, nome), conteudo, 'utf8');
  console.log(`\n✓ @ucam/site-css tokens → dist/sites/tokens/ (${r.arquivos.map(([n]) => n).join(', ')})`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) principal();
