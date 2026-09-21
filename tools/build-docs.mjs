// Gera o site LEGADO de documentação (docs/index.html).
//
// NÃO é o site publicado. O site do UCAMDS é o app Analog em site/ — cabeçalho
// com as áreas no topo, segundo andar de abas, uma rota por página — e é ele
// que a Vercel publica (vercel.json aponta para site/dist/analog/public).
// Este arquivo segue no `pnpm build` só para docs/ não apodrecer; roda sozinho
// por `pnpm legado` e se vê por `pnpm dev:legado`.
//
// Estilo Storybook: navegação lateral, uma página por componente, preview ao
// vivo com abas Preview/Código, instalação, API e boas práticas.
//
// O preview é renderizado pelo dist/css/ucam.css REAL, embutido na página.
// Não é maquete: mudou o token na spec, muda o preview.
//
//   node tools/build-docs.mjs

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { iconCss } from './lib/icon-css.mjs';
import { listboxSelects, listboxScript } from './lib/select-listbox.mjs';
import { menuContaScript, estadoScript, descricaoScript, linhaDoTempoScript, abasScript, filtroScript, confirmaScript, dialogoScript, gavetaScript } from './lib/shell.mjs';
import { fontFaceCss } from './lib/fonts-css.mjs';
import { simbolo, marcaCss } from './lib/marca.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = join(ROOT, 'spec');
const read = (p) => JSON.parse(readFileSync(join(SPEC, p), 'utf8'));

for (const f of ['dist/tokens/ucam-tokens.css', 'dist/css/ucam.css']) {
  if (!existsSync(join(ROOT, f))) {
    console.error(`✗ ${f} não existe. Rode: pnpm run tokens && pnpm run css`);
    process.exit(1);
  }
}

const tokensCss = readFileSync(join(ROOT, 'dist/tokens/ucam-tokens.css'), 'utf8').replace(/@import[^;]+;/g, '');
const ucamCss = readFileSync(join(ROOT, 'dist/css/ucam.css'), 'utf8').replace(/@import[^;]+;/g, '');
// Sprite dos mesmos 49 ícones curados — o site usa a fonte que documenta.
const sprite = readFileSync(join(ROOT, 'dist/icons/sprite.svg'), 'utf8');

const primitive = read('tokens/primitive.json');
const semantic = read('tokens/semantic.json');
const dark = read('tokens/theme.dark.json');
const adrs = read('decisions/adr.json').decisions;
const patterns = read('patterns/patterns.json').patterns;
const demos = read('demos.json').demos;
const icons = read('icons.json');
const states = read('states.json');
const projetos = read('templates.json').projetos;

const components = readdirSync(join(SPEC, 'components'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => read(join('components', f)))
  .sort((a, b) => a.name.localeCompare(b.name));

/* ---------------------------------------------------------- utilidades --- */

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function lum(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

function resolvePrim(ref) {
  let n = primitive;
  for (const k of ref.replace(/[{}]/g, '').split('.')) n = n?.[k];
  return n?.$value ?? null;
}

function flatColors(node, trail = []) {
  const out = [];
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && '$value' in v) {
      const raw = v.$value;
      out.push({
        name: [...trail, k].join('.'),
        ref: raw,
        hex: typeof raw === 'string' && raw.startsWith('{') ? resolvePrim(raw) : raw,
        description: v.$description ?? '',
      });
    } else if (v && typeof v === 'object') out.push(...flatColors(v, [...trail, k]));
  }
  return out;
}
const semColors = flatColors(semantic.color, ['color']);
const darkColors = flatColors(dark.color, ['color']);
const surfaceLight = semColors.find((c) => c.name === 'color.surface.default')?.hex ?? '#FFFFFF';
const surfaceDark = darkColors.find((c) => c.name === 'color.surface.default')?.hex ?? '#2B2727';

/* --------------------------------------------------------- fragmentos --- */

// O tamanho saiu da assinatura: quem decide o degrau é o papel, na folha.
function icon(nome) {
  return `<svg class="ic" aria-hidden="true"><use href="#i-${nome}"/></svg>`;
}

const pill = (s) => `<span class="pill pill-${esc(s)}">${esc(s)}</span>`;
const chips = (l = [], cls = '') => l.map((c) => `<span class="chip ${cls}">${esc(c)}</span>`).join('');

function table(headers, rows, cls = '') {
  if (!rows.length) return '';
  return `<div class="scroller"><table class="${cls}">
<thead><tr>${headers.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
</table></div>`;
}

let demoSeq = 0;
// Painel com abas Preview / Código, no modelo da documentação da ZardUI.
function demoPanel(preview, codigo, { titulo, descricao } = {}) {
  preview = preview ? listboxSelects(preview) : preview;
  const id = `d${++demoSeq}`;
  const hasPreview = preview && preview.trim();
  return `<section class="demo">
  ${titulo ? `<h3 class="demo-title">${esc(titulo)}</h3>` : ''}
  ${descricao ? `<p class="demo-desc">${esc(descricao)}</p>` : ''}
  <div class="panel">
    <div class="panel-tabs" role="tablist" aria-label="${esc(titulo || 'Demonstração')}">
      ${hasPreview ? `<button role="tab" class="panel-tab" aria-selected="true" data-tab="${id}-p">Preview</button>` : ''}
      <button role="tab" class="panel-tab" aria-selected="${hasPreview ? 'false' : 'true'}" data-tab="${id}-c">Código</button>
      <button class="copy" data-copy="${id}-c" type="button">${icon('copy')} Copiar</button>
    </div>
    ${hasPreview ? `<div class="panel-body stage" id="${id}-p" role="tabpanel"><div class="ucam">${preview}</div></div>` : ''}
    <div class="panel-body code" id="${id}-c" role="tabpanel" ${hasPreview ? 'hidden' : ''}><pre><code>${esc(codigo)}</code></pre></div>
  </div>
</section>`;
}

/* --------------------------------------------------- páginas: componente --- */

function apiTable(c) {
  const rows = c.props.map((p) => [
    `<code class="prop">${esc(p.nome)}</code>${p.obrigatorio ? '<span class="req" title="obrigatória">*</span>' : ''}`,
    `<code class="type">${esc(p.tipo)}</code>`,
    p.default ? `<code>${esc(p.default)}</code>` : '<span class="muted">—</span>',
    esc(p.descricao ?? ''),
  ]);
  return table(['Prop', 'Tipo', 'Padrão', 'Descrição'], rows, 'api');
}

function boasPraticas(c) {
  const parts = [];

  if (c.limites) {
    const regras = c.limites.regras ?? (c.limites.regra ? [c.limites.regra] : []);
    parts.push(`<div class="callout callout-limit">
      <p class="callout-head">Quando não usar</p>
      ${regras.length ? `<ul class="list">${regras.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
      ${c.limites.motivo ? `<p class="muted">${esc(c.limites.motivo)}</p>` : ''}
      ${c.limites.criterio ? `<p><strong>Critério.</strong> ${esc(c.limites.criterio)}</p>` : ''}
      ${c.limites.excecao ? `<p><strong>Exceção.</strong> ${esc(c.limites.excecao)}</p>` : ''}
    </div>`);
  }

  // Conteúdo: pares bom/evitar ganham destaque visual, listas viram regras.
  for (const [k, v] of Object.entries(c.conteudo)) {
    if (Array.isArray(v)) {
      parts.push(`<h4>${esc(k.replace(/_/g, ' '))}</h4><ul class="list">${v.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);
    } else {
      parts.push(`<div class="goodbad">
        <div class="gb gb-good"><p class="gb-head">Bom</p><ul>${(v.bom ?? []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>
        <div class="gb gb-bad"><p class="gb-head">Evitar</p><ul>${(v.ruim ?? []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>
      </div>`);
    }
  }

  parts.push(`<h4>Acessibilidade</h4>
    <div class="chips">${c.acessibilidade.criterios_wcag.map((w) => `<span class="chip chip-wcag">WCAG ${esc(w)}</span>`).join('')}</div>
    <ul class="list">${c.acessibilidade.requisitos.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    ${c.acessibilidade.teclado ? table(['Tecla', 'Comportamento'],
      c.acessibilidade.teclado.map((t) => [`<kbd>${esc(t.tecla)}</kbd>`, esc(t.comportamento)])) : ''}`);

  return parts.join('');
}

function componentPage(c) {
  const d = demos[c.id] ?? {};
  const blocks = [];

  blocks.push(`<header class="page-head">
    <div class="page-head-row">
      <h1>${esc(c.name)}</h1>
      ${pill(c.status)}
      <span class="chip chip-cat">${esc(c.category)}</span>
    </div>
    <p class="lede">${esc(c.description)}</p>
    <code class="selector">&lt;${esc(c.selector)}&gt;</code>
  </header>`);

  if (d.principal) blocks.push(demoPanel(d.principal.preview, d.principal.codigo));

  if (d.instalacao) {
    blocks.push(`<section class="sec"><h2 id="${c.id}-inst">Instalação</h2>
      <div class="panel"><div class="panel-body code"><pre><code>${esc(d.instalacao)}</code></pre></div></div>
      <p class="muted small">O CLI copia o código-fonte do componente para dentro do seu projeto. Você passa a ser dono dele — não há dependência de runtime.</p>
      <h3>Importação</h3>
      <div class="panel"><div class="panel-body code"><pre><code>${esc(d.importacao ?? '')}</code></pre></div></div>
    </section>`);
  }

  if (d.exemplos?.length) {
    blocks.push(`<section class="sec"><h2 id="${c.id}-ex">Exemplos</h2>
      ${d.exemplos.map((e) => demoPanel(e.preview, e.codigo, e)).join('')}</section>`);
  }

  blocks.push(`<section class="sec"><h2 id="${c.id}-api">API</h2>
    <h3>Entradas</h3>
    ${apiTable(c)}
    ${c.eventos?.length ? `<h3>Saídas</h3>` + table(['Evento', 'Payload', 'Descrição'],
      c.eventos.map((e) => [
        `<code class="event">(${esc(e.nome)})</code>`,
        `<code class="type">${esc(e.payload)}</code>`,
        esc(e.descricao),
      ])) : ''}
    ${(() => {
      const en = c.props.find((p) => p.valores);
      if (!en) return '';
      return `<h3>Valores de <code>${esc(en.nome)}</code></h3>` + table(['Valor', 'Uso', 'Limite'],
        Object.entries(en.valores).map(([k, v]) => [
          `<code>${esc(k)}</code>`, esc(v.uso ?? v.quando ?? ''),
          v.limite ? `<span class="limit">${esc(v.limite)}</span>` : '<span class="muted">—</span>',
        ]));
    })()}
    ${c.schemas ? Object.entries(c.schemas).map(([n, f]) => `<h3>Tipo <code>${esc(n)}</code></h3>` +
      table(['Campo', 'Tipo', 'Padrão', 'Descrição'], Object.entries(f).map(([k, x]) => [
        `<code class="prop">${esc(k)}</code>${x.obrigatorio ? '<span class="req">*</span>' : ''}`,
        `<code class="type">${esc(x.tipo)}</code>`,
        x.default ? `<code>${esc(x.default)}</code>` : '<span class="muted">—</span>',
        esc(x.descricao ?? ''),
      ]))).join('') : ''}
    <h3>Estados</h3><div class="chips">${chips(c.estados)}</div>
  </section>`);

  blocks.push(`<section class="sec"><h2 id="${c.id}-bp">Boas práticas</h2>${boasPraticas(c)}</section>`);

  for (const key of ['responsividade', 'foco', 'rolagem', 'dependencia', 'obrigatoriedade']) {
    if (!c[key]) continue;
    const o = c[key];
    const bits = [];
    for (const [k, v] of Object.entries(o)) {
      const label = k.replace(/^\$/, '').replace(/_/g, ' ');
      if (typeof v === 'string') bits.push(`<p><strong>${esc(label)}.</strong> ${esc(v)}</p>`);
      else if (Array.isArray(v)) bits.push(`<p class="k-head">${esc(label)}</p><ul class="list">${v.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);
      else if (v && typeof v === 'object') bits.push(table([esc(label), ''], Object.entries(v).map(([a, b]) => [
        `<code>${esc(a)}</code>`,
        typeof b === 'object' ? Object.entries(b).map(([x, y]) => `<strong>${esc(x)}:</strong> ${esc(y)}`).join('<br>') : esc(b),
      ])));
    }
    blocks.push(`<section class="sec"><h2>${key[0].toUpperCase() + key.slice(1)}</h2>${bits.join('')}</section>`);
  }

  if (c.migracao) {
    blocks.push(`<section class="sec"><h2 id="${c.id}-mig">Migração do legado</h2>
      <p class="muted">De: <code>${esc(c.migracao.de)}</code></p>
      ${table(['Legado', 'Novo', 'Nota'], c.migracao.mapa.map((m) => [
        `<code class="legacy">${esc(m.legado)}</code>`,
        `<code class="modern">${esc(m.novo)}</code>`,
        m.nota ? esc(m.nota) : '<span class="muted">conversão direta</span>',
      ]))}</section>`);
  }

  if (c.evidencia) {
    blocks.push(`<section class="sec"><h2 id="${c.id}-ev">De onde veio</h2>
      <p class="muted">Auditoria de <code>${esc(c.evidencia.origem)}</code>. Cada decisão deste componente responde a um problema observado em produção.</p>
      ${table(['Tela', 'Elemento', 'Problema'], c.evidencia.ocorrencias.map((o) => [
        esc(o.tela), esc(o.rotulo ?? o.campo ?? '—'), esc(o.problema)]))}
      ${c.evidencia.conclusao ? `<p class="conclusion">${esc(c.evidencia.conclusao)}</p>` : ''}</section>`);
  }

  return `<article class="page" id="/componentes/${c.id}">${blocks.join('')}</article>`;
}

/* ------------------------------------------------------ páginas: começar --- */

function pageIntro() {
  return `<article class="page" id="/">
  <header class="page-head">
    <div class="page-head-row"><h1>Design System UCAM</h1></div>
    <p class="lede">Componentes, tokens e padrões para os sistemas da Universidade Candido Mendes. Construído sobre a <a href="https://zardui.com" target="_blank" rel="noopener">ZardUI</a>, adaptado à identidade e às necessidades da universidade.</p>
  </header>

  <div class="stats">
    <div class="stat"><strong>${components.length}</strong><span>componentes</span></div>
    <div class="stat"><strong>${demoSeqTotal}</strong><span>demos</span></div>
    <div class="stat"><strong>${patterns.length}</strong><span>padrões</span></div>
    <div class="stat"><strong>${adrs.length}</strong><span>decisões</span></div>
    <div class="stat"><strong>${totalTemplates}</strong><span>templates</span></div>
    <div class="stat"><strong>${totalWcag}</strong><span>critérios WCAG</span></div>
  </div>

  <section class="sec">
    <h2>Por que existe</h2>
    <p>Os sistemas da UCAM resolvem os mesmos problemas de formas diferentes. Só no Sistema de Protocolo, a auditoria encontrou <strong>duas paginações incompatíveis</strong>, <strong>três redações para o mesmo estado vazio</strong> e <strong>quatro cores para a mesma intenção de ação</strong>. Botões de ícone sem nome acessível tornam a paginação inutilizável por leitor de tela.</p>
    <p>Este design system não é um exercício de estética: é a padronização do que já existe, com acessibilidade tratada como requisito e não como auditoria de fim de projeto.</p>
  </section>

  <section class="sec">
    <h2>Como está organizado</h2>
    ${table(['Camada', 'O que é', 'Quem consome'], [
      ['<code>@ucam/tokens</code>', 'Cor, tipografia, espaçamento e tema escuro em CSS, SCSS, JSON e Tailwind v4.', 'Todos os sistemas, inclusive AngularJS'],
      ['<code>@ucam/css</code>', 'Primitivos visuais sem framework, escopados sob <code>.ucam</code>, sem preflight.', 'Sistemas legados, sem migrar'],
      ['<code>@ucam/ui</code>', 'Componentes Angular sobre a ZardUI adaptada.', 'Sistemas novos e migrados'],
      ['<code>@ucam/ds-mcp</code>', 'Servidor MCP que serve os contratos a agentes de IA.', 'Ferramentas de desenvolvimento'],
    ])}
  </section>

  <section class="sec">
    <h2>A base: ZardUI</h2>
    <p>A <a href="https://zardui.com" target="_blank" rel="noopener">ZardUI</a> é uma biblioteca Angular no modelo do shadcn/ui: o CLI copia o código-fonte para dentro do seu projeto em vez de criar uma dependência. Licença MIT, Angular 21, Tailwind v4, construída sobre <code>@angular/cdk</code> e <code>@angular/aria</code>.</p>
    <p>Partimos dela e adaptamos: os componentes ganham a identidade UCAM, as correções de acessibilidade que a auditoria apontou e os componentes que a biblioteca não tem. <strong>Aplicações nunca importam ZardUI diretamente</strong> — só a API da UCAM. É o que permite trocar ou abandonar a base sem tocar em nenhum sistema.</p>
    <div class="callout"><p>Componentes que a ZardUI não cobre e a UCAM precisa criar: <code>data-table</code> com estados e responsividade, <code>empty-state</code> com motivo, <code>badge</code> do fluxo de requerimento, <code>page-header</code> e <code>app-shell</code> com contexto de campus.</p></div>
  </section>

  <section class="sec">
    <h2>Estado do projeto</h2>
    <p>Fase de contratos e fundações. Os tokens e a camada CSS já são gerados e utilizáveis; a biblioteca Angular ainda não foi implementada. As cores da paleta foram derivadas de captura de tela e precisam ser substituídas por medição no CSS de produção.</p>
  </section>
</article>`;
}

function pageInstalacao() {
  return `<article class="page" id="/comecar/instalacao">
  <header class="page-head"><div class="page-head-row"><h1>Instalação</h1></div>
  <p class="lede">Dois caminhos, conforme a versão do Angular do seu sistema.</p></header>

  <section class="sec">
    <h2>Trilho A — sistemas legados</h2>
    <p>Angular 14 ou anterior, AngularJS, ou qualquer stack. Duas folhas de estilo e um <code>class="ucam"</code> no container. Não há reset global nem preflight: o CSS existente do sistema continua funcionando.</p>
    <div class="panel"><div class="panel-body code"><pre><code>&lt;link rel="stylesheet" href="/assets/ucam-tokens.css"&gt;
&lt;link rel="stylesheet" href="/assets/ucam.css"&gt;

&lt;div class="ucam"&gt;
  &lt;button class="ucam-btn ucam-btn--primary"&gt;Salvar&lt;/button&gt;
&lt;/div&gt;</code></pre></div></div>
    <p class="muted small">A adoção é incremental — uma tela por vez, e uma tela pela metade continua funcionando.</p>
  </section>

  <section class="sec">
    <h2>Trilho B — Angular moderno</h2>
    <p>Angular 21 com Tailwind v4. O CLI copia o código-fonte do componente para o seu projeto.</p>
    <div class="panel"><div class="panel-body code"><pre><code>npx ucam-cli init
npx ucam-cli add button text-field data-table</code></pre></div></div>
    <h3>Tailwind</h3>
    <div class="panel"><div class="panel-body code"><pre><code>/* styles.css */
@import "tailwindcss";
@import "@ucam/tokens/ucam-theme.css";</code></pre></div></div>
  </section>

  <section class="sec">
    <h2>Tema escuro</h2>
    <p>O tema tem três estados. Sem marcação no elemento raiz, vale a preferência do sistema; <code>data-theme</code> sobrescreve nos dois sentidos.</p>
    <div class="panel"><div class="panel-body code"><pre><code>&lt;html&gt;                        &lt;!-- segue o sistema --&gt;
&lt;html data-theme="dark"&gt;       &lt;!-- força escuro --&gt;
&lt;html data-theme="light"&gt;      &lt;!-- força claro, mesmo com sistema escuro --&gt;</code></pre></div></div>
  </section>
</article>`;
}

/* ---------------------------------------------------- páginas: foundations --- */

const ramps = Object.entries(primitive)
  .filter(([k, v]) => !k.startsWith('$') && !k.startsWith('_') && v.$type === 'color')
  .map(([name, r]) => ({
    name, description: r.$description ?? '',
    steps: Object.entries(r).filter(([k]) => !k.startsWith('$')).map(([s, t]) => ({ s, v: t.$value })),
  }));

const rampHtml = (r) => `<div class="ramp"><h4>${esc(r.name)}</h4>
  ${r.description ? `<p class="muted small">${esc(r.description)}</p>` : ''}
  <div class="swatches">${r.steps.map((s) => {
    const fg = contrast(s.v, '#FFFFFF') >= contrast(s.v, '#1A1717') ? '#FFFFFF' : '#1A1717';
    return `<div class="sw" style="background:${s.v};color:${fg}"><span>${esc(s.s)}</span><span class="sw-hex">${esc(s.v)}</span></div>`;
  }).join('')}</div></div>`;

function pageFoundations() {
  return `<article class="page" id="/foundations">
  <header class="page-head"><div class="eyebrow">Foundations</div>
    <div class="page-head-row"><h1>Fundações</h1></div>
    <p class="lede">A linguagem visual antes dos componentes: como cor, tipografia, espaço e forma se comportam nos sistemas da UCAM.</p></header>

  <section class="sec"><h2>Princípios</h2>
    <h3>A marca aparece na ação, não só no cabeçalho</h3>
    <p>Hoje o bordô institucional vive preso à faixa do topo, enquanto os botões usam azul, preto, verde e cinza. A ação primária passa a carregar a marca — é onde a pessoa olha e onde ela age.</p>
    <h3>Cor nunca é o único portador de significado</h3>
    <p>Todo estado comunicado por cor vem acompanhado de texto. Vale para status de requerimento, erro de campo e feedback de sistema. Não é só acessibilidade: é o que faz a interface funcionar em impressão, em tela ruim e sob luz forte.</p>
    <h3>Contraste é verificado, não estimado</h3>
    <p>Cada par texto/superfície é calculado no build, nos dois temas. Token que reprova derruba o pipeline antes de virar componente. A checagem já encontrou três falhas de <code>1.4.11</code> que passariam despercebidas numa revisão visual.</p>
    <h3>Nada em caixa alta forçada</h3>
    <p>O legado usa CAIXA ALTA em botões, cabeçalhos de tabela e navegação. Caixa alta apaga o contorno da palavra, reduz a velocidade de leitura e é soletrada por alguns leitores de tela. A hierarquia passa a vir de peso, tamanho e cor.</p>
  </section>

  <section class="sec"><h2>Nesta seção</h2>
    ${table(['Página', 'O que traz'], [
      ['<a href="#/foundations/cor">Cor</a>', 'Paleta, papéis semânticos e contraste verificado.'],
      ['<a href="#/foundations/tipografia">Tipografia</a>', 'Escala e papéis, com amostras reais.'],
      ['<a href="#/foundations/espacamento">Espaçamento e forma</a>', 'Ritmo, raio, tamanhos de controle e movimento.'],
      ['<a href="#/comecar/tokens">Tokens</a>', 'A implementação das fundações: três camadas, tema escuro e formatos gerados.'],
    ])}
  </section>
</article>`;
}

function pageFoundationsCor() {
  const textRows = semColors.filter((c) => c.name.startsWith('color.text') && c.hex).map((t) => {
    const onBrand = t.name.includes('on-brand') || t.name.includes('on-action');
    const bg = onBrand ? (semColors.find((c) => c.name === 'color.surface.brand')?.hex ?? '#6C1E2B') : surfaceLight;
    const r = contrast(t.hex, bg);
    const isento = t.name.includes('disabled');
    const g = isento ? { l: 'isento 1.4.3', t: '' } : r >= 7 ? { l: 'AAA', t: 'good' } : r >= 4.5 ? { l: 'AA', t: 'good' } : { l: 'reprova', t: 'bad' };
    return [`<code>${esc(t.name)}</code>`,
      `<span class="dot" style="background:${t.hex}"></span><code>${esc(t.ref)}</code>`,
      `<span class="num">${r.toFixed(2)}:1</span>`, `<span class="chip chip-${g.t}">${g.l}</span>`, esc(t.description)];
  });

  return `<article class="page" id="/foundations/cor">
  <header class="page-head"><div class="eyebrow">Foundations</div>
    <div class="page-head-row"><h1>Cor</h1></div>
    <p class="lede">O bordô institucional é a âncora. Tudo o mais é neutro com leve viés quente, mais quatro rampas semânticas que existem só para comunicar estado.</p></header>

  <div class="callout callout-limit"><p><strong>As cores ainda são estimativa.</strong> ${esc(primitive._meta.origem)} ${esc(primitive._meta.pendencia)}</p></div>

  <section class="sec"><h2>Paleta</h2>
    <p>Os neutros têm viés quente de propósito: cinza puro ao lado do bordô lê como sujeira. As rampas verde, âmbar, vermelha e azul são semânticas — nunca decorativas.</p>
    ${ramps.map(rampHtml).join('')}
  </section>

  <section class="sec"><h2>Papéis semânticos</h2>
    <p>Componentes referenciam estes nomes, nunca a paleta acima. O contraste é calculado no build.</p>
    ${table(['Papel', 'Resolve para', 'Contraste', 'WCAG', 'Nota'], textRows)}
  </section>

  <section class="sec"><h2>Uso da cor de marca</h2>
    <div class="goodbad">
      <div class="gb gb-good"><p class="gb-head">Bom</p><ul>
        <li>Ação primária da tela.</li><li>Faixa de identificação do sistema.</li>
        <li>Indicador de item ativo na navegação.</li><li>Anel de foco.</li></ul></div>
      <div class="gb gb-bad"><p class="gb-head">Evitar</p><ul>
        <li>Duas ações primárias na mesma tela.</li><li>Bordô para comunicar erro — isso é a rampa vermelha.</li>
        <li>Fundo bordô atrás de texto longo.</li><li>Bordô como cor de status de requerimento.</li></ul></div>
    </div>
  </section>
</article>`;
}

function pageFoundationsTipografia() {
  const typeRows = Object.entries(semantic.typography).filter(([k]) => !k.startsWith('$')).map(([k, v]) => {
    const size = resolvePrim(v.$value.fontSize), w = resolvePrim(v.$value.fontWeight);
    return `<div class="type-row">
      <div style="font-size:${size};font-weight:${w};line-height:${v.$value.lineHeight}">Requerimento aguardando análise</div>
      <div class="type-meta"><code>${esc(k)}</code><span class="muted">${esc(size)} · ${esc(String(w))} · ${esc(v.$value.lineHeight)}</span></div>
    </div>`;
  }).join('');

  return `<article class="page" id="/foundations/tipografia">
  <header class="page-head"><div class="eyebrow">Foundations</div>
    <div class="page-head-row"><h1>Tipografia</h1></div>
    <p class="lede">Oito papéis, nomeados por função. Nenhum aplica caixa alta forçada — ver <a href="#/decisoes">ADR-003</a>.</p></header>

  <section class="sec"><h2>Famílias</h2>
    <p>Pilha de sistema, sem webfont: carrega instantâneo, funciona offline e não depende de CDN. Os sistemas da UCAM rodam em rede interna e em máquinas de secretaria — uma fonte que não chega deixa a tela em serifada.</p>
    ${table(['Papel', 'Pilha', 'Amostra'],
      Object.entries(semantic.font).filter(([k]) => !k.startsWith('$')).map(([k, v]) => {
        const pilha = resolvePrim(v.$value);
        return [
          `<code>font.${esc(k)}</code>`,
          `<code style="font-size:.72rem">${esc(pilha.split(',').slice(0, 3).join(',') + '…')}</code>`,
          `<span style="font-family:${pilha};font-size:.95rem">Requerimento 2026-0311</span>`,
        ];
      }))}
  </section>

  <section class="sec"><h2>Escala</h2>
    <div class="type-scale">${typeRows}</div>
  </section>

  <section class="sec"><h2>Regras</h2>
    <ul class="list">
      <li>Texto corrido não passa de ~72 caracteres por linha.</li>
      <li>Hierarquia por peso e tamanho, nunca por caixa alta.</li>
      <li>Números em coluna usam <code>tabular-nums</code>: datas, valores e contagens precisam alinhar.</li>
      <li>Rótulo de campo usa <code>label</code>; nunca <code>body</code> em negrito.</li>
      <li>A escala não é extensível por conta própria — tamanho fora dela é pedido de token, não valor arbitrário.</li>
    </ul>
  </section>
</article>`;
}

function pageFoundationsEspacamento() {
  const spaceScale = Object.entries(primitive.space).filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => `<div class="scale-row"><code class="scale-key">space.${esc(k)}</code>
      <span class="scale-bar" style="inline-size:${v.$value}"></span>
      <span class="num muted">${esc(v.$value)}</span></div>`).join('');

  const semSpace = Object.entries(semantic.space).filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => [`<code>space.${esc(k)}</code>`, `<code>${esc(v.$value)}</code>`, esc(v.$description ?? '')]);

  const radius = Object.entries(primitive.radius).filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => [`<code>radius.${esc(k)}</code>`, `<code>${esc(v.$value)}</code>`,
      `<span style="display:inline-block;inline-size:2.5rem;block-size:1.5rem;background:var(--ucam-color-action-primary-default);border-radius:${v.$value}"></span>`]);

  const sizes = Object.entries(semantic.size).filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => [`<code>size.${esc(k)}</code>`, `<code>${esc(v.$value)}</code>`, esc(v.$description ?? '')]);

  return `<article class="page" id="/foundations/espacamento">
  <header class="page-head"><div class="eyebrow">Foundations</div>
    <div class="page-head-row"><h1>Espaçamento e forma</h1></div>
    <p class="lede">Escala base 4px. Aplicações usam os nomes por intenção, não os degraus brutos — <code>stack-md</code> diz o que faz; <code>space-4</code> não.</p></header>

  <section class="sec"><h2>Escala</h2><div class="scale">${spaceScale}</div></section>

  <section class="sec"><h2>Nomes por intenção</h2>
    ${table(['Token', 'Valor', 'Uso'], semSpace)}
  </section>

  <section class="sec"><h2>Raio</h2>
    <p>Conservador de propósito: o sistema é de trabalho, não de marketing. Raio grande em tabela densa vira ruído.</p>
    ${table(['Token', 'Valor', ''], radius)}
  </section>

  <section class="sec"><h2>Tamanhos de controle</h2>
    <p>O alvo mínimo de toque é <code>24×24px</code> (WCAG 2.5.8) e <code>44×44px</code> onde houver espaço. A paginação do legado falha nos dois.</p>
    ${table(['Token', 'Valor', 'Uso'], sizes)}
  </section>

  <section class="sec"><h2>Movimento</h2>
    <p>Curto e funcional: transição existe para explicar mudança de estado, não para enfeitar. Tudo respeita <code>prefers-reduced-motion</code>.</p>
    ${table(['Token', 'Valor', 'Uso'], Object.entries(primitive.duration).filter(([k]) => !k.startsWith('$')).map(([k, v]) => [
      `<code>duration.${esc(k)}</code>`, `<code>${esc(v.$value)}</code>`,
      { instant: 'Sem transição.', fast: 'Hover, foco, cor de botão.', normal: 'Abertura de popover e menu.', slow: 'Entrada de diálogo.' }[k] ?? '',
    ]))}
  </section>
</article>`;
}

function pageFoundationsIconografia() {
  const total = icons.grupos.reduce((n, g) => n + g.icones.length, 0);
  return `<article class="page" id="/foundations/iconografia">
  <header class="page-head"><div class="eyebrow">Foundations</div>
    <div class="page-head-row"><h1>Iconografia</h1><span class="chip">Lucide</span></div>
    <p class="lede">${esc(icons.$description)}</p></header>

  <div class="callout"><p><strong>Conjunto fechado.</strong> ${esc(icons._meta.regra)}</p></div>

  <section class="sec"><h2>Regras</h2>
    ${table(['', ''], [
      ['<strong>Tamanho</strong>', esc(icons._meta.tamanho)],
      ['<strong>Traço</strong>', esc(icons._meta.traco)],
      ['<strong>Acessibilidade</strong>', esc(icons._meta.acessibilidade)],
      ['<strong>Produção</strong>', esc(icons._meta.producao)],
    ])}
    <ul class="list">${icons.regras_de_uso.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
  </section>

  ${icons.grupos.map((g) => `<section class="sec">
    <h2>${esc(g.nome)}</h2>
    ${table(['Ícone', 'Nome', 'Uso'], g.icones.map((i) => [
      `<code>${esc(i.lucide)}</code>`,
      `<code class="prop">${esc(i.lucide)}</code>`,
      esc(i.uso),
    ]))}
  </section>`).join('')}

  <section class="sec"><h2>Uso em código</h2>
    <p>O tipo <code>UcamIconName</code> é gerado da spec: nome fora do conjunto é erro de compilação, não ícone vazio. São ${total} ícones em ${icons.grupos.length} grupos.</p>
    <div class="panel"><div class="panel-body code"><pre><code>${esc(`<ucam-icon name="fileText" size="md" />

<!-- dentro de um controle, quem nomeia é o ariaLabel -->
<ucam-icon-button icon="trash2" label="Excluir setor Biblioteca" variant="danger" />

<!-- acompanhado de texto, o ícone é decorativo -->
<ucam-button variant="primary" iconStart="plus">Novo requerimento</ucam-button>`)}</code></pre></div></div>
  </section>
</article>`;
}

function pageFoundationsEstados() {
  const ordem = states.precedencia.ordem;
  return `<article class="page" id="/foundations/estados">
  <header class="page-head"><div class="eyebrow">Foundations</div>
    <div class="page-head-row"><h1>Estados</h1></div>
    <p class="lede">${esc(states.$description)}</p></header>

  <section class="sec"><h2>Vocabulário</h2>
    ${table(['Estado', 'Gatilho', 'Aparência'], states.estados.map((e) => [
      `<code class="prop">${esc(e.id)}</code>`, esc(e.gatilho), esc(e.aparencia),
    ]))}
  </section>

  <section class="sec"><h2>Precedência</h2>
    <p>${esc(states.precedencia.regra)}</p>
    <ol class="steps">${ordem.map((e) => `<li><code>${esc(e)}</code></li>`).join('')}</ol>
    <div class="callout"><p><strong>Exceção.</strong> ${esc(states.precedencia.excecao)}</p></div>
  </section>

  <section class="sec"><h2>Desabilitado</h2>
    <p><strong>Regra.</strong> ${esc(states.disabled.regra)}</p>
    <p>${esc(states.disabled.motivo)}</p>
    <ul class="list">${states.disabled.acessibilidade.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
  </section>

  <section class="sec"><h2>Carregando</h2>
    <p><strong>Regra.</strong> ${esc(states.loading.regra)}</p>
    <p>${esc(states.loading.motivo)}</p>
    ${table(['Componente', 'Posição do indicador'], states.loading.posicao_do_indicador.map((p) => [
      `<code>${esc(p.componente)}</code>`, esc(p.posicao),
    ]))}
  </section>

  <section class="sec"><h2>Movimento</h2>
    <p>${esc(states.movimento.regra)}</p>
    ${table(['Propriedade', 'Duração', 'Easing'], states.movimento.mapa.map((m) => [
      esc(m.propriedade), `<code>${esc(m.duracao)}</code>`, `<code>${esc(m.easing)}</code>`,
    ]))}
    <h3>Proibido</h3>
    <ul class="list">${states.movimento.proibido.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
  </section>

  <section class="sec"><h2>De onde veio</h2>
    <p class="muted">${esc(states._meta.origem)}</p>
    <div class="callout callout-limit">
      <p class="callout-head">Onde divergimos da referência</p>
      <p>${esc(states._meta.divergencia)}</p>
    </div>
  </section>
</article>`;
}

/* -------------------------------------------------------- páginas: tokens --- */

function pageTokens() {
  const textRows = semColors.filter((c) => c.name.startsWith('color.text') && c.hex).map((t) => {
    const onBrand = t.name.includes('on-brand') || t.name.includes('on-action');
    const bg = onBrand ? (semColors.find((c) => c.name === 'color.surface.brand')?.hex ?? '#6C1E2B') : surfaceLight;
    const r = contrast(t.hex, bg);
    const isento = t.name.includes('disabled');
    const g = isento ? { l: 'isento 1.4.3', t: '' } : r >= 7 ? { l: 'AAA', t: 'good' } : r >= 4.5 ? { l: 'AA', t: 'good' } : { l: 'reprova', t: 'bad' };
    return [`<code>${esc(t.name)}</code>`,
      `<span class="dot" style="background:${t.hex}"></span><code>${esc(t.ref)}</code>`,
      `<span class="num">${r.toFixed(2)}:1</span>`, `<span class="chip chip-${g.t}">${g.l}</span>`, esc(t.description)];
  });

  const darkRows = darkColors.filter((d) => d.name.startsWith('color.text') || d.name.startsWith('color.border')).map((d) => {
    const alvo = d.name.startsWith('color.border') ? 3 : 4.5;
    const r = contrast(d.hex, surfaceDark);
    const isento = d.name.includes('disabled');
    const g = isento ? { l: 'isento 1.4.3', t: '' } : { l: r >= alvo ? 'passa' : 'reprova', t: r >= alvo ? 'good' : 'bad' };
    const claro = semColors.find((c) => c.name === d.name);
    return [`<code>${esc(d.name)}</code>`,
      claro ? `<span class="dot" style="background:${claro.hex}"></span><code>${esc(claro.ref)}</code>` : '—',
      `<span class="dot" style="background:${d.hex}"></span><code>${esc(d.ref)}</code>`,
      `<span class="num">${r.toFixed(2)}:1</span>`, `<span class="chip chip-${g.t}">${g.l}</span>`];
  });

  return `<article class="page" id="/comecar/tokens">
  <header class="page-head"><div class="eyebrow">Tokens</div>
  <div class="page-head-row"><h1>Camadas e formatos</h1></div>
  <p class="lede">Formato DTCG / W3C Design Tokens, em três camadas. Componentes referenciam <strong>apenas a camada semântica</strong> — é isso que torna troca de marca e tema escuro uma troca de arquivo, não uma refatoração.</p></header>

  <section class="sec"><h2>Camada 1 — primitivos</h2>
    <p>Valores brutos, sem significado de uso. Referenciá-los direto em componente é erro de CI (<a href="#/decisoes">ADR-007</a>). A paleta completa está em <a href="#/foundations/cor">Foundations → Cor</a>.</p>
    <div class="swatches">${ramps.find((r) => r.name === 'wine').steps.map((s) => {
      const fg = contrast(s.v, '#FFFFFF') >= contrast(s.v, '#1A1717') ? '#FFFFFF' : '#1A1717';
      return `<div class="sw" style="background:${s.v};color:${fg}"><span>${esc(s.s)}</span><span class="sw-hex">${esc(s.v)}</span></div>`;
    }).join('')}</div>
  </section>

  <section class="sec"><h2>Camada 2 — semânticos</h2>
    <p>Nomeados por intenção de uso. Os contrastes abaixo são calculados no build: token que reprova derruba o pipeline antes de chegar à tela.</p>
    ${table(['Token', 'Resolve para', 'Contraste', 'WCAG', 'Nota'], textRows)}
  </section>

  <section class="sec"><h2>Camada 3 — tema escuro</h2>
    <p>${esc(dark._meta.regra)}</p>
    ${table(['Token', 'Claro', 'Escuro', 'Contraste no escuro', 'WCAG'], darkRows)}
  </section>

  <section class="sec"><h2>Formatos gerados</h2>
    ${table(['Arquivo', 'Para quê'], [
      ['<code>ucam-tokens.css</code>', 'Custom properties com os dois temas. É o que o legado consome.'],
      ['<code>_ucam-tokens.scss</code>', 'Variáveis e mapa para pipelines Sass.'],
      ['<code>ucam-tokens.json</code>', 'Consumo programático, Figma e servidor MCP.'],
      ['<code>ucam-theme.css</code>', 'Bloco <code>@theme</code> do Tailwind v4.'],
    ])}
  </section>
</article>`;
}

function pageMcp() {
  const cfg = JSON.stringify({ mcpServers: { ucamds: { command: 'npx', args: ['-y', '@ucam/ds-mcp@latest'] } } }, null, 2);
  return `<article class="page" id="/comecar/mcp">
  <header class="page-head"><div class="page-head-row"><h1>Servidor MCP</h1>${pill('draft')}</div>
  <p class="lede">Serve os contratos dos componentes a agentes de IA, para que eles usem a API real em vez de inventar props.</p></header>
  <section class="sec"><h2>Por que existe</h2>
    <p>Sem contrato legível por máquina, um servidor de documentação devolve prosa e o agente alucina. Cada componente daqui tem um contrato estruturado — props tipadas, estados, requisitos de acessibilidade, limites de uso e mapa de migração do legado. É isso que o MCP serve.</p></section>
  <section class="sec"><h2>Instalação</h2>
    <div class="panel"><div class="panel-body code"><pre><code>${esc(cfg)}</code></pre></div></div></section>
  <section class="sec"><h2>Ferramentas</h2>
    ${table(['Ferramenta', 'O que faz'], [
      ['<code>ucam_list_components</code>', 'Lista o catálogo com id, status, categoria e descrição.'],
      ['<code>ucam_get_component</code>', 'Contrato completo de um componente.'],
      ['<code>ucam_get_tokens</code>', 'Tokens semânticos resolvidos, por tema.'],
      ['<code>ucam_migrate_from_legacy</code>', 'Recebe template AngularJS / Angular Material e devolve o equivalente na API da UCAM.'],
      ['<code>ucam_check_usage</code>', 'Aponta violações: token primitivo direto, componente fora dos limites, prop inexistente.'],
    ])}</section>
</article>`;
}

/* ------------------------------------------------------ páginas: templates --- */
// Templates são telas inteiras, agrupadas por projeto. É onde o design system
// deixa de ser catálogo e vira a tela que alguém vai construir.

/**
 * Moldura de dispositivo.
 *
 * O preview vai num <iframe> de propósito: media query responde à largura do
 * FRAME, não à da página. Num <div> com max-width os breakpoints do template
 * nunca disparariam e a simulação seria falsa.
 *
 * O iframe aponta para o ARQUIVO gerado por build-templates.mjs — o mesmo que
 * o botão "abrir em nova aba" abre. Antes ele era remontado aqui por srcdoc,
 * juntando a marcação de um <script type="text/html"> com o CSS do bloco
 * #ucam-runtime, e isso quebrava o preview de quatro maneiras ao mesmo tempo:
 *
 *   1. o sprite de ícones vive no documento hospedeiro. <use href="#i-x">
 *      dentro de um iframe resolve contra o documento DO IFRAME — não achava
 *      nada e todo ícone saía invisível;
 *   2. #ucam-runtime não carrega a regra .ic. Um <svg> sem inline-size não tem
 *      tamanho intrínseco e estica até o contêiner: cada item de menu virava
 *      um bloco alto com o rótulo empurrado para a direita. É exatamente o bug
 *      que icon-css.mjs foi criado para não deixar acontecer de novo — voltou
 *      porque apareceu um TERCEIRO consumidor do markup com ícone;
 *   3. sem @font-face, o preview caía na fonte do sistema enquanto o resto da
 *      documentação usava Geist;
 *   4. sem --ucam-appbar-logo e sem os scripts de listbox e menu de conta, a
 *      marca não pintava e nenhum select abria.
 *
 * Apontar para o arquivo remove a segunda cópia da receita em vez de corrigir
 * item por item: preview e "nova aba" passam a ser a mesma página, e uma
 * quinta divergência futura não tem por onde entrar. Tema e modo embutido
 * viajam por query string porque o iframe pode estar em file://, onde ler o
 * contentDocument seria bloqueado.
 */
const DISPOSITIVOS = [
  { id: 'desktop', rotulo: 'Desktop', icone: 'settings', w: 1280, h: 820 },
  { id: 'laptop', rotulo: 'Notebook', icone: 'settings', w: 1024, h: 700 },
  { id: 'tablet', rotulo: 'Tablet', icone: 'settings', w: 834, h: 1000 },
  { id: 'mobile', rotulo: 'Celular', icone: 'settings', w: 390, h: 780 },
];

let deviceSeq = 0;
function deviceFrame(arquivo, titulo) {
  const id = `dev${++deviceSeq}`;
  return `<div class="device" id="${id}" data-w="1280" data-h="820" data-src="${esc(arquivo)}">
  <div class="device-bar" role="group" aria-label="Tamanho de tela">
    ${DISPOSITIVOS.map((d, i) => `<button type="button" class="device-btn" data-w="${d.w}" data-h="${d.h}" aria-pressed="${i === 0}">${esc(d.rotulo)}</button>`).join('')}
    <span class="device-size" aria-live="polite">1280 × 820</span>
    <a class="device-open" href="${esc(arquivo)}" target="_blank" rel="noopener" title="Abrir em nova aba">${icon('externalLink')}</a>
  </div>
  <div class="device-stage">
    <iframe class="device-frame" title="${esc(titulo)}" loading="lazy"></iframe>
  </div>
</div>`;
}

function templatePage(proj, t) {
  const padrao = patterns.find((p) => p.id === t.padrao);
  return `<article class="page" id="/templates/${proj.id}/${t.id}">
  <header class="page-head">
    <div class="eyebrow">${esc(proj.nome)}</div>
    <div class="page-head-row"><h1>${esc(t.nome)}</h1>
      ${padrao ? `<a class="chip chip-dep" href="#/padroes">padrão: ${esc(padrao.nome)}</a>` : ''}
    </div>
    <p class="lede">${esc(t.descricao)}</p>
    <p class="muted small">Origem: ${esc(t.origem)}</p>
  </header>

  ${deviceFrame(`t/${proj.id}-${t.id}.html`, `Tela ${t.nome} — ${proj.nome}`)}

  <section class="demo">
    <div class="panel">
      <div class="panel-tabs" role="tablist" aria-label="Código da tela">
        <button role="tab" class="panel-tab" aria-selected="true" data-tab="${'tc' + deviceSeq}-c">Código</button>
        <button class="copy" data-copy="${'tc' + deviceSeq}-c" type="button">${icon('copy')} Copiar</button>
      </div>
      <div class="panel-body code" id="${'tc' + deviceSeq}-c" role="tabpanel"><pre><code>${esc(t.codigo)}</code></pre></div>
    </div>
  </section>

  ${t.problemas?.length ? `<section class="sec">
    <h2>O que estava errado</h2>
    <div class="callout callout-limit">
      <p class="callout-head">Auditoria da tela em produção</p>
      <ul class="list">${t.problemas.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
  </section>` : ''}

  <section class="sec">
    <h2>Instalação</h2>
    <div class="panel"><div class="panel-body code"><pre><code>npx ucam-cli add ${esc(proj.id)}-${esc(t.id)}</code></pre></div></div>
    <p class="muted small">O CLI copia a tela inteira para o seu projeto, com os componentes que ela usa. Ponto de partida, não caixa-preta.</p>
  </section>

  <section class="sec">
    <h2>Decisões desta tela</h2>
    <ul class="list">${t.notas.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
  </section>

  <section class="sec">
    <h2>Componentes usados</h2>
    <div class="chips">${t.usa.map((sel) => {
      const c = components.find((x) => x.selector === sel);
      return c
        ? `<a class="chip chip-dep" href="#/componentes/${c.id}">${esc(sel)}</a>`
        : `<span class="chip" title="sem contrato ainda">${esc(sel)}</span>`;
    }).join('')}</div>
    <p class="muted small">Chips sem link ainda não têm contrato. Template que precisa de componente inexistente vira pedido de contrato, não gambiarra local.</p>
  </section>
</article>`;
}

function pageProjeto(proj) {
  return `<article class="page" id="/templates/${proj.id}">
  <header class="page-head">
    <div class="eyebrow">Templates</div>
    <div class="page-head-row"><h1>${esc(proj.nome)}</h1></div>
    <p class="lede">${esc(proj.descricao)}</p>
    <p class="muted small">Stack atual: <code>${esc(proj.stack_atual)}</code></p>
  </header>

  <section class="sec">
    <h2>${proj.templates.length} telas</h2>
    <div class="blocks">
      ${proj.templates.map((t) => `<a class="block" href="#/templates/${proj.id}/${t.id}">
        <span class="block-shot"><img src="t/${proj.id}-${t.id}.png" alt="" loading="lazy" onerror="this.parentNode.classList.add('block-shot--sem')"><span class="block-shot-fb">${icon('fileText')}</span></span>
        <span class="block-meta">
          <strong>${esc(t.nome)}</strong>
          <span class="muted small">${esc(t.descricao)}</span>
          <span class="block-tags"><span class="chip">${esc(t.padrao)}</span><span class="chip">${t.usa.length} componentes</span></span>
        </span>
      </a>`).join('')}
    </div>
  </section>
</article>`;
}

function pagePadroes() {
  return `<article class="page" id="/padroes">
  <header class="page-head"><div class="page-head-row"><h1>Padrões</h1></div>
  <p class="lede">Um padrão resolve uma tarefa inteira, não um controle. Vira código em <code>@ucam/patterns</code> quando aparece em três ou mais telas.</p></header>
  ${patterns.map((p) => `<section class="sec" id="p-${esc(p.id)}">
    <div class="page-head-row"><h2>${esc(p.nome)}</h2>${pill(p.status)}</div>
    <p class="muted"><strong>Frequência:</strong> ${esc(p.frequencia)}</p>
    <div class="callout callout-limit"><p class="callout-head">O problema hoje</p><p>${esc(p.problema)}</p></div>
    ${p.estrutura ? `<h3>Estrutura</h3><ol class="steps">${p.estrutura.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
    <h3>Regras</h3><ul class="list">${p.regras.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    <h3>Componentes</h3><div class="chips">${chips(p.usa, 'chip-dep')}</div>
  </section>`).join('')}
</article>`;
}

function pageDecisoes() {
  return `<article class="page" id="/decisoes">
  <header class="page-head"><div class="page-head-row"><h1>Decisões</h1></div>
  <p class="lede">Decisão sem justificativa registrada vira discussão repetida a cada seis meses. Cada regra dos componentes aponta para uma ADR daqui.</p></header>
  ${adrs.map((a) => `<section class="sec adr" id="${slug(a.id)}">
    <div class="page-head-row"><code class="adr-id">${esc(a.id)}</code><h2>${esc(a.titulo)}</h2>${pill(a.status)}</div>
    <p><strong>Contexto.</strong> ${esc(a.contexto)}</p>
    <p class="decision"><strong>Decisão.</strong> ${esc(a.decisao)}</p>
    <p class="k-head">Consequências</p>
    <ul class="list">${a.consequencias.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
    <p class="muted small">Afeta: ${a.afeta.map((x) => `<code>${esc(x)}</code>`).join(' ')}</p>
  </section>`).join('')}
</article>`;
}

/* ------------------------------------------------------------ montagem --- */

const totalWcag = new Set(components.flatMap((c) => c.acessibilidade.criterios_wcag)).size;
const totalTemplates = projetos.reduce((n, p) => n + p.templates.length, 0);
const demoSeqTotal = Object.values(demos).reduce((n, d) => n + (d.principal ? 1 : 0) + (d.exemplos?.length ?? 0), 0);

const componentPages = components.map(componentPage).join('');

// Índice de busca — alimenta o ⌘K. Construído do mesmo material que a
// navegação, para nunca divergir dela.
const indice = [
  { t: 'Introdução', s: 'Começar', h: '#/' },
  { t: 'Instalação', s: 'Começar', h: '#/comecar/instalacao' },
  { t: 'Servidor MCP', s: 'Começar', h: '#/comecar/mcp' },
  { t: 'Fundações', s: 'Foundations', h: '#/foundations' },
  { t: 'Cor', s: 'Foundations', h: '#/foundations/cor' },
  { t: 'Tipografia', s: 'Foundations', h: '#/foundations/tipografia' },
  { t: 'Espaçamento e forma', s: 'Foundations', h: '#/foundations/espacamento' },
  { t: 'Iconografia', s: 'Foundations', h: '#/foundations/iconografia' },
  { t: 'Camadas e formatos', s: 'Tokens', h: '#/comecar/tokens' },
  ...components.map((c) => ({ t: c.name, s: 'Componentes', h: `#/componentes/${c.id}`, d: c.description.slice(0, 90) })),
  ...patterns.map((p) => ({ t: p.nome, s: 'Padrões', h: '#/padroes' })),
  ...projetos.flatMap((p) => [
    { t: p.nome, s: 'Templates', h: `#/templates/${p.id}` },
    ...p.templates.map((x) => ({ t: x.nome, s: `Templates · ${p.nome}`, h: `#/templates/${p.id}/${x.id}`, d: x.descricao.slice(0, 90) })),
  ]),
  ...adrs.map((a) => ({ t: `${a.id} — ${a.titulo}`, s: 'Decisões', h: '#/decisoes' })),
];

// Os contratos já declaram category. A navegação agrupa por ela em vez de
// despejar 11 componentes numa lista alfabética.
const CATEGORIA_LABEL = {
  acao: 'Ação',
  formulario: 'Formulário',
  dados: 'Dados',
  navegacao: 'Navegação',
  sobreposicao: 'Sobreposição',
  feedback: 'Feedback',
  layout: 'Layout',
  conteudo: 'Conteúdo',
};
const ORDEM_CATEGORIA = ['acao', 'formulario', 'dados', 'navegacao', 'sobreposicao', 'feedback', 'layout', 'conteudo'];

const porCategoria = ORDEM_CATEGORIA
  .map((cat) => ({ cat, itens: components.filter((c) => c.category === cat) }))
  .filter((g) => g.itens.length);

const navLink = (href, texto, status) =>
  `<a href="${href}">${esc(texto)}${status ? `<span class="nav-pill nav-${esc(status)}"></span>` : ''}</a>`;

const navGroup = (titulo, icone, corpo) =>
  `<div class="nav-group"><span>${icon(icone, 'sm')}${esc(titulo)}</span>${corpo}</div>`;

const nav = [
  navGroup('Começar', 'bookOpen', [
    navLink('#/', 'Introdução'),
    navLink('#/comecar/instalacao', 'Instalação'),
    navLink('#/comecar/mcp', 'Servidor MCP'),
  ].join('')),

  navGroup('Foundations', 'settings', [
    navLink('#/foundations', 'Visão geral'),
    navLink('#/foundations/cor', 'Cor'),
    navLink('#/foundations/tipografia', 'Tipografia'),
    navLink('#/foundations/espacamento', 'Espaçamento e forma'),
    navLink('#/foundations/iconografia', 'Iconografia'),
    navLink('#/foundations/estados', 'Estados'),
    navLink('#/comecar/tokens', 'Tokens'),
  ].join('')),

  navGroup('Componentes', 'clipboardList',
    porCategoria.map((g) =>
      `<span class="nav-sub">${esc(CATEGORIA_LABEL[g.cat])}</span>` +
      g.itens.map((c) => navLink(`#/componentes/${c.id}`, c.name, c.status)).join(''),
    ).join('')),

  navGroup('Padrões', 'archive', navLink('#/padroes', 'Composições')),

  navGroup('Templates', 'fileText',
    projetos.map((p) =>
      `<span class="nav-sub">${esc(p.nome)}</span>` +
      navLink(`#/templates/${p.id}`, 'Visão geral') +
      p.templates.map((t) => navLink(`#/templates/${p.id}/${t.id}`, t.nome)).join(''),
    ).join('')),

  navGroup('Decisões', 'scrollText', navLink('#/decisoes', `${adrs.length} ADRs`)),
].join('');

const CSS = `
${fontFaceCss('fonts')}
:root{
--bg:#FFFFFF;--pn:#FFFFFF;--pn2:#FAFAFA;--pn3:#F5F5F5;
--tx:#171717;--tx2:#575757;--tx3:#8A8A8A;
--rl:#E4E4E4;--rl2:#D0D0D0;
--br:#6C1E2B;--br2:#631623;--brs:#FDF7F8;--brb:#EFD6DB;
--gd:#2A6046;--gds:#EDF6F1;--wn:#7A5308;--wns:#FBF3E2;--bd:#9A2B20;--bds:#FCEDEB;--inf:#1B5382;--infs:#EDF3F9;
--fb:"Geist Variable",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
--fm:"Geist Mono Variable",ui-monospace,"Cascadia Mono",Consolas,monospace;
--rad:10px}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0C0C0C;--pn:#131313;--pn2:#181818;--pn3:#1F1F1F;--tx:#EDEDED;--tx2:#A1A1A1;--tx3:#757575;--rl:#262626;--rl2:#383838;--br:#DF97A4;--br2:#EFC2CA;--brs:#231416;--brb:#3D1D22;--gd:#7FC3A0;--gds:#132119;--wn:#DBA45A;--wns:#241B0C;--bd:#E89189;--bds:#251311;--inf:#84B4DF;--infs:#0F1C28}}
:root[data-theme="dark"]{--bg:#0C0C0C;--pn:#131313;--pn2:#181818;--pn3:#1F1F1F;--tx:#EDEDED;--tx2:#A1A1A1;--tx3:#757575;--rl:#262626;--rl2:#383838;--br:#DF97A4;--br2:#EFC2CA;--brs:#231416;--brb:#3D1D22;--gd:#7FC3A0;--gds:#132119;--wn:#DBA45A;--wns:#241B0C;--bd:#E89189;--bds:#251311;--inf:#84B4DF;--infs:#0F1C28}

body{background:var(--bg);color:var(--tx);font-family:var(--fb);font-size:16px;line-height:1.65;-webkit-font-smoothing:antialiased;letter-spacing:-.006em}
.shell{display:grid;grid-template-columns:1fr;min-block-size:100vh}
@media(min-width:64rem){.shell{grid-template-columns:15.5rem minmax(0,1fr)}}

.topbar{display:flex;align-items:center;gap:.75rem;padding:.8rem 1.15rem;border-block-end:1px solid var(--rl);position:sticky;top:0;background:var(--bg);z-index:20}
@media(min-width:64rem){.topbar{display:none}}
.burger{background:none;border:0;padding:.3rem;color:var(--tx2);cursor:pointer;font-size:1.05rem}
${marcaCss}
.topbar-marca{display:flex;align-items:center;gap:.45rem;color:var(--br);font-weight:640;letter-spacing:-.02em}

.side{padding:2rem 1.15rem 4rem;display:none;flex-direction:column;gap:1.6rem;border-inline-end:1px solid var(--rl)}
.side.open{display:flex}
@media(min-width:64rem){.side{display:flex;position:sticky;top:0;max-block-size:100vh;overflow-y:auto}}
.mark{display:flex;align-items:center;justify-content:space-between;gap:.5rem}
.mark a{text-decoration:none;display:flex;align-items:center;gap:.55rem;color:var(--br)}
.mark .marca-simbolo{inline-size:1.5rem;block-size:1.5rem}
.mark-txt{display:flex;flex-direction:column;gap:.05rem}
.mark-txt strong{font-size:1rem;font-weight:640;color:var(--tx);letter-spacing:-.02em}
.mark-txt span{font-size:.7rem;color:var(--tx3);letter-spacing:0}
/* O ALTERNADOR DE TEMA É UM QUADRADO FIXO, e isso é a correção de um defeito.
   Ele era texto — "◑ claro" / "◐ escuro" —, e as duas palavras não medem o
   mesmo tanto. Como .mark é um flex de dois itens com space-between e o botão
   tinha white-space:nowrap, ele nunca cedia: quem cedia era a marca ao lado.
   Trocar para escuro alargava o botão em alguns pixels, a marca encolhia na
   mesma medida e "Design System UCAM" — que cabia em uma linha — passava a
   duas. O cabeçalho da lateral crescia e voltava a cada clique.
   Em 2rem por 2rem não há palavra para medir: a largura do botão é a mesma nos
   dois estados, e a marca nunca é espremida. O estado, que a palavra dizia,
   agora está no ícone (sol/lua) e no aria-label — dois canais, como no resto
   do sistema. */
.theme-toggle{display:inline-flex;align-items:center;justify-content:center;flex:none;
  inline-size:2rem;block-size:2rem;padding:0;border:0;border-radius:.5rem;
  background:none;cursor:pointer;color:var(--tx3);
  transition:color .12s ease,background-color .12s ease}
.theme-toggle:hover{color:var(--tx);background:var(--pn2)}
.theme-toggle svg{inline-size:1.0625rem;block-size:1.0625rem}
/* Os ícones são DESENHADOS, não os glifos ◑ ◐: o Geist não tem nenhum dos
   dois, cada um caía numa fonte de fallback com peso e alinhamento próprios, e
   o disco saía como uma bolinha chapada sem relação com a régua de 1,75px dos
   outros ícones. É a mesma decisão que o ucam-theme-toggle do site já tomou.
   Quem escolhe qual aparece é o [data-theme] no <html>, não o JS: o ícone não
   tem como divergir do tema aplicado se ninguém precisa lembrar de trocá-lo. */
.theme-toggle .lua{display:none}
[data-theme="dark"] .theme-toggle .sol{display:none}
[data-theme="dark"] .theme-toggle .lua{display:block}
/* A marca pode encolher; o subtítulo corta em reticências em vez de quebrar.
   Cinto e suspensório: com o botão de largura fixa a quebra já não acontece,
   mas a lateral também estreita em telas pequenas. */
.mark a{min-inline-size:0}
.mark-txt{min-inline-size:0}
.mark-txt span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nav-group{display:flex;flex-direction:column;gap:0}
.nav-group>span{font-size:.68rem;letter-spacing:.06em;text-transform:uppercase;color:var(--tx3);margin-block-end:.5rem;font-weight:600}
.side a{color:var(--tx2);text-decoration:none;font-size:.855rem;padding:.26rem 0;display:flex;align-items:center;justify-content:space-between;gap:.4rem;line-height:1.4}
.side a:hover{color:var(--tx)}
.side a.active{color:var(--br);font-weight:600}
.nav-pill{inline-size:.32rem;block-size:.32rem;border-radius:50%;flex:none;opacity:.55}
.nav-draft{background:var(--wn)}
.nav-stable{background:var(--gd)}

.main{padding:2.25rem 1.15rem 7rem;min-inline-size:0}
@media(min-width:64rem){.main{padding:3.5rem 3.5rem 10rem}}
/* A coluna cresce; quem limita a leitura é a largura do parágrafo, não a
   da página. Assim tabela, código e moldura de dispositivo aproveitam a tela. */
.page{display:none;flex-direction:column;gap:3rem;max-inline-size:74rem}
.page.active{display:flex}
.page-head{display:flex;flex-direction:column;gap:.7rem}
.page-head-row{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem}
.eyebrow{font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--tx3);font-weight:600}
h1{font-size:clamp(1.75rem,4vw,2.15rem);font-weight:650;line-height:1.15;letter-spacing:-.028em}
h2{font-size:1.2rem;font-weight:640;line-height:1.3;letter-spacing:-.018em;scroll-margin-top:1rem}
h3{font-size:.98rem;font-weight:640;letter-spacing:-.01em;margin-block-start:.4rem}
h4{font-size:.9rem;font-weight:640;color:var(--tx);margin-block-start:.5rem}
p{max-inline-size:68ch}
.lede{max-inline-size:60ch}
.lede{font-size:1.06rem;color:var(--tx2);line-height:1.6}
.muted{color:var(--tx3)}
.small{font-size:.82rem}
.sec{display:flex;flex-direction:column;gap:.95rem;padding-block-start:2rem;border-block-start:1px solid var(--rl)}
a{color:var(--br);text-decoration:none}
a:hover{text-decoration:underline;text-underline-offset:.18em}
.k-head{font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;color:var(--tx3);font-weight:600}
.selector{align-self:flex-start}
.conclusion{color:var(--tx2);font-size:.92rem}
.decision{border-inline-start:2px solid var(--br);padding-inline-start:.9rem}
.adr-id{color:var(--br);font-size:.75rem;background:none;padding:0;font-weight:600}

ul.list,ol.steps{display:flex;flex-direction:column;gap:.45rem;padding-inline-start:1.1rem;max-inline-size:70ch;font-size:.92rem}
ul.list li::marker{color:var(--rl2)}
ol.steps li::marker{color:var(--br);font-size:.8rem}

code{font-family:var(--fm);font-size:.83em;background:var(--pn3);border:0;border-radius:4px;padding:.1em .34em;letter-spacing:0}
code.type{color:var(--inf)}
code.prop{color:var(--br);font-weight:600}
code.event{color:var(--gd);font-weight:600}
code.legacy{color:var(--tx3)}
code.modern{color:var(--br)}
kbd{font-family:var(--fm);font-size:.78em;background:var(--pn3);border:1px solid var(--rl2);border-radius:4px;padding:.12em .4em}

.demo{display:flex;flex-direction:column;gap:.55rem}
.demo-title{font-size:.97rem;font-weight:640;margin:0;letter-spacing:-.01em}
.demo-desc{font-size:.9rem;color:var(--tx2);margin:0}
/* Aba, preview e código compartilham o mesmo recuo lateral: o rótulo da aba
   cai na mesma vertical do conteúdo abaixo dele. */
.panel{--pad-panel:1.25rem;border:1px solid var(--rl);border-radius:var(--rad);overflow:hidden;background:var(--pn)}
.panel-tabs{display:flex;align-items:center;gap:1rem;padding:0 var(--pad-panel);border-block-end:1px solid var(--rl)}
.panel-tab{background:none;border:0;border-block-end:1.5px solid transparent;padding:.6rem 0;margin-block-end:-1px;font:inherit;font-size:.8rem;color:var(--tx3);cursor:pointer}
.panel-tab[aria-selected="true"]{color:var(--tx);font-weight:600;border-block-end-color:var(--br)}
.copy{margin-inline-start:auto;background:none;border:0;padding:.2rem 0;font:inherit;font-size:.74rem;color:var(--tx3);cursor:pointer}
.copy:hover{color:var(--tx)}
.panel-body{padding:1.75rem var(--pad-panel)}
.panel-body.stage{background:var(--pn);display:flex;align-items:center;min-block-size:5rem;overflow-x:auto}
.panel-body.stage>.ucam{inline-size:100%}
.panel-body.code{padding:0;background:var(--pn2)}
.panel-body.code pre{margin:0;padding:1.05rem var(--pad-panel);overflow-x:auto;font-family:var(--fm);font-size:.795rem;line-height:1.7;color:var(--tx2);letter-spacing:0}
.panel-body.code code{background:none;padding:0;font-size:1em}

.scroller{overflow-x:auto}
table{inline-size:100%;border-collapse:collapse;font-size:.87rem;min-inline-size:28rem}
th,td{text-align:start;vertical-align:top;padding:.62rem .9rem .62rem 0;border-block-end:1px solid var(--rl)}
th:last-child,td:last-child{padding-inline-end:0}
thead th{font-size:.7rem;letter-spacing:.05em;text-transform:uppercase;color:var(--tx3);font-weight:600;white-space:nowrap;border-block-end-color:var(--rl2)}
tbody tr:last-child td{border-block-end:0}
.num{font-variant-numeric:tabular-nums;white-space:nowrap}
.req{color:var(--br);font-weight:700}
.limit{color:var(--wn)}
.dot{display:inline-block;inline-size:.65rem;block-size:.65rem;border-radius:3px;border:1px solid var(--rl2);margin-inline-end:.35rem;vertical-align:-1px}

.chips{display:flex;flex-wrap:wrap;gap:.35rem}
.chip{display:inline-block;font-family:var(--fm);font-size:.7rem;padding:.14rem .45rem;border-radius:5px;background:var(--pn3);color:var(--tx2);white-space:nowrap;letter-spacing:0}
a.chip:hover{text-decoration:none;color:var(--tx)}
.chip-wcag{background:var(--infs);color:var(--inf)}
.chip-good{background:var(--gds);color:var(--gd)}
.chip-bad{background:var(--bds);color:var(--bd)}
.chip-dep{background:var(--brs);color:var(--br2)}
.chip-cat{background:none;color:var(--tx3);border:1px solid var(--rl2)}
.pill{display:inline-block;font-size:.68rem;letter-spacing:.03em;padding:.14rem .48rem;border-radius:5px;font-weight:600}
.pill-draft{background:var(--wns);color:var(--wn)}
.pill-stable,.pill-aceita{background:var(--gds);color:var(--gd)}

.callout{border:1px solid var(--brb);background:var(--brs);padding:1rem 1.2rem;border-radius:var(--rad);display:flex;flex-direction:column;gap:.55rem}
.callout-limit{border-color:color-mix(in srgb,var(--wn) 22%,transparent);background:var(--wns)}
.callout-head{font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;color:var(--wn);margin:0;font-weight:700}
.callout p{max-inline-size:64ch}

.goodbad{display:grid;grid-template-columns:1fr;gap:1.5rem}
@media(min-width:46rem){.goodbad{grid-template-columns:1fr 1fr;gap:2rem}}
.gb{display:flex;flex-direction:column;gap:.45rem}
.gb-head{font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;margin:0;font-weight:700}
.gb-good .gb-head{color:var(--gd)}
.gb-bad .gb-head{color:var(--bd)}
.gb ul{padding-inline-start:1.05rem;display:flex;flex-direction:column;gap:.32rem;font-size:.875rem;margin:0;color:var(--tx2)}

.ramp{display:flex;flex-direction:column;gap:.5rem;margin-block-start:1.1rem}
.ramp h4{margin:0;font-family:var(--fm);font-size:.76rem;color:var(--tx2)}
.swatches{display:grid;grid-template-columns:repeat(auto-fit,minmax(4.6rem,1fr));gap:.3rem}
.sw{padding:.6rem .5rem;display:flex;flex-direction:column;gap:.1rem;min-block-size:3.6rem;justify-content:flex-end;font-family:var(--fm);font-size:.72rem;font-weight:600;border-radius:6px;letter-spacing:0}
.sw-hex{font-size:.6rem;font-weight:400;opacity:.8}
.scale{display:flex;flex-direction:column;gap:.35rem}
.scale-row{display:grid;grid-template-columns:8.5rem 1fr auto;gap:.8rem;align-items:center}
.scale-key{font-size:.7rem}
.scale-bar{display:block;block-size:.7rem;background:var(--br);opacity:.6;border-radius:2px;min-inline-size:1px}
.type-scale{display:flex;flex-direction:column;gap:1.1rem}
.type-row{display:flex;flex-direction:column;gap:.25rem;padding-block-end:.9rem;border-block-end:1px solid var(--rl)}
.type-meta{display:flex;gap:.7rem;align-items:baseline;font-size:.72rem}

.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(6.5rem,1fr));gap:1.75rem}
.stat{display:flex;flex-direction:column;gap:.1rem}
.stat strong{font-size:1.7rem;font-weight:640;color:var(--tx);line-height:1;letter-spacing:-.03em}
.stat span{font-size:.75rem;color:var(--tx3)}

.search-trigger{display:flex;align-items:center;justify-content:space-between;gap:.5rem;inline-size:100%;padding:.4rem .6rem;background:var(--pn2);border:1px solid var(--rl);border-radius:6px;color:var(--tx3);font:inherit;font-size:.8rem;cursor:pointer;text-align:start}
.search-trigger:hover{color:var(--tx);border-color:var(--rl2)}
.search-trigger kbd{font-size:.68rem;background:var(--bg);border:1px solid var(--rl2);border-radius:4px;padding:.05em .3em}

.nav-group.collapsed a{display:none}
.nav-group>span{cursor:pointer;user-select:none;display:flex;align-items:center;gap:.35rem}
.nav-group>span::after{content:"";margin-inline-start:auto;inline-size:0;block-size:0;border-inline-start:3.5px solid currentColor;border-block-start:3px solid transparent;border-block-end:3px solid transparent;transform:rotate(90deg);opacity:.45;transition:transform .12s ease}
.nav-group.collapsed>span::after{transform:rotate(0deg)}

.palette{position:fixed;inset:0;background:color-mix(in srgb,var(--tx) 22%,transparent);display:flex;align-items:flex-start;justify-content:center;padding:8vh 1rem 1rem;z-index:60}
.palette[hidden]{display:none}
.palette-box{inline-size:min(34rem,100%);background:var(--pn);border:1px solid var(--rl2);border-radius:12px;overflow:hidden;box-shadow:0 12px 40px -12px color-mix(in srgb,var(--tx) 35%,transparent)}
.palette-input{inline-size:100%;padding:.9rem 1.1rem;border:0;border-block-end:1px solid var(--rl);background:none;color:var(--tx);font:inherit;font-size:.95rem;outline:none}
.palette-input::placeholder{color:var(--tx3)}
.palette-results{list-style:none;margin:0;padding:.35rem;max-block-size:22rem;overflow-y:auto}
.palette-results li{display:flex;align-items:baseline;justify-content:space-between;gap:1rem;padding:.5rem .75rem;border-radius:6px;cursor:pointer;font-size:.875rem}
.palette-results li[aria-selected="true"]{background:var(--brs);color:var(--br)}
.palette-results li.pr-vazio{color:var(--tx3);cursor:default;justify-content:flex-start}
.pr-s{font-size:.72rem;color:var(--tx3);white-space:nowrap}
.palette-results li[aria-selected="true"] .pr-s{color:var(--br)}
.palette-foot{display:flex;gap:.4rem;align-items:center;padding:.5rem .9rem;border-block-start:1px solid var(--rl);font-size:.7rem;color:var(--tx3)}
.palette-foot kbd{font-size:.68rem;background:var(--pn2);border:1px solid var(--rl2);border-radius:4px;padding:.05em .3em}

.device{border:1px solid var(--rl);border-radius:var(--rad);overflow:hidden;background:var(--pn2)}
.device-bar{display:flex;align-items:center;gap:.25rem;padding:.4rem .5rem;background:var(--pn);border-block-end:1px solid var(--rl)}
.device-btn{background:none;border:0;padding:.28rem .6rem;border-radius:6px;font:inherit;font-size:.78rem;color:var(--tx3);cursor:pointer}
.device-btn:hover{color:var(--tx);background:var(--pn2)}
.device-btn[aria-pressed="true"]{background:var(--brs);color:var(--br);font-weight:600}
.device-size{margin-inline-start:auto;font-family:var(--fm);font-size:.7rem;color:var(--tx3);font-variant-numeric:tabular-nums}
.device-stage{overflow:hidden;padding:1.5rem;display:flex;justify-content:center;background:var(--pn2)}
/* flex:none é o coração da moldura, não um detalhe.
   O palco é flex; sem isto o iframe é item flexível e ENCOLHE até caber na
   coluna. A moldura anunciava "Desktop · 1280px" e entregava uma viewport de
   1072 — o arranjo documentado passava a ser o de outra largura, e as grades
   com auto-fit perdiam uma coluna calada. A redução tem de vir da ESCALA
   (transform), que não mexe na viewport, nunca da largura. */
.device-frame{border:1px solid var(--rl2);border-radius:6px;background:#fff;display:block;flex:none;transform-origin:top center;transition:width .18s ease,height .18s ease}
:root[data-theme="dark"] .device-frame{background:#141312}
@media(prefers-reduced-motion:reduce){.device-frame{transition:none}}

.blocks{display:grid;grid-template-columns:repeat(auto-fill,minmax(17rem,1fr));gap:1.25rem}
.block{display:flex;flex-direction:column;border:1px solid var(--rl);border-radius:var(--rad);overflow:hidden;text-decoration:none;color:inherit;background:var(--pn);transition:border-color .12s ease}
.block:hover{border-color:var(--rl2);text-decoration:none}
.block-shot{position:relative;display:block;aspect-ratio:16/10;background:var(--pn2);border-block-end:1px solid var(--rl);overflow:hidden}
.block-shot img{inline-size:100%;block-size:100%;object-fit:cover;object-position:top center;display:block}
.block-shot-fb{position:absolute;inset:0;display:none;align-items:center;justify-content:center;color:var(--tx3)}
.block-shot--sem img{display:none}
.block-shot--sem .block-shot-fb{display:flex}
.block-meta{display:flex;flex-direction:column;gap:.3rem;padding:.85rem 1rem 1rem}
.block-meta strong{font-size:.95rem;font-weight:640;letter-spacing:-.01em}
.block-tags{display:flex;flex-wrap:wrap;gap:.3rem;margin-block-start:.15rem}
.device-open{margin-inline-start:.5rem;color:var(--tx3);display:inline-flex;align-items:center;padding:.2rem}
.device-open:hover{color:var(--br)}

${iconCss}
.nav-group>span .ic{opacity:.6}
.nav-sub{font-size:.66rem;letter-spacing:.05em;text-transform:uppercase;color:var(--tx3);margin:.6rem 0 .15rem;padding-inline-start:.1rem}
.nav-group.collapsed .nav-sub{display:none}

:focus-visible{outline:2px solid var(--br);outline-offset:2px;border-radius:3px}
@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;

const JS = `
(function () {
  var pages = Array.prototype.slice.call(document.querySelectorAll('.page'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.side a[href^="#/"]'));
  var side = document.querySelector('.side');

  function route() {
    var hash = location.hash.replace(/^#/, '') || '/';
    var found = false;
    pages.forEach(function (p) {
      var on = p.id === hash;
      p.classList.toggle('active', on);
      if (on) found = true;
    });
    if (!found && pages.length) pages[0].classList.add('active');
    links.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + hash);
    });
    if (side) side.classList.remove('open');
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();

  // Abas Preview / Código
  document.addEventListener('click', function (e) {
    var tab = e.target.closest('.panel-tab');
    if (tab) {
      var tabs = tab.parentNode.querySelectorAll('.panel-tab');
      Array.prototype.forEach.call(tabs, function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        var body = document.getElementById(t.dataset.tab);
        if (body) body.hidden = !on;
      });
      return;
    }
    var btn = e.target.closest('.copy');
    if (btn) {
      var el = document.getElementById(btn.dataset.copy);
      var txt = el ? el.textContent.trim() : '';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(txt).then(function () {
          var old = btn.textContent;
          btn.textContent = 'Copiado';
          setTimeout(function () { btn.textContent = old; }, 1400);
        });
      }
      return;
    }
    if (e.target.closest('.burger')) { side.classList.toggle('open'); }
  });

  /* -------------------------------------------------------- tema ---- */
  // O padrão é CLARO, independente da preferência do sistema: a maioria dos
  // sistemas da UCAM roda em desktop de secretaria, em tela clara. O escuro
  // fica disponível na alternância e a escolha persiste.

  var raiz = document.documentElement;
  var toggle = document.querySelector('.theme-toggle');

  function lerTema() {
    try { return localStorage.getItem('ucam-tema'); } catch (e) { return null; }
  }
  function gravarTema(v) {
    try { v ? localStorage.setItem('ucam-tema', v) : localStorage.removeItem('ucam-tema'); } catch (e) {}
  }
  // O botão não escreve mais o estado: quem troca o ícone é o CSS, a partir do
  // [data-theme] que esta função acabou de pôr no <html>. Ao JS resta o nome
  // acessível — que é texto fora do fluxo e não mexe com a largura de nada.
  function aplicar(t) {
    raiz.setAttribute('data-theme', t);
    if (toggle) toggle.setAttribute('aria-label', 'Tema ' + (t === 'dark' ? 'escuro' : 'claro') + '. Alternar.');
  }

  aplicar(lerTema() === 'dark' ? 'dark' : 'light');

  if (toggle) {
    toggle.addEventListener('click', function () {
      var proximo = raiz.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      aplicar(proximo);
      gravarTema(proximo);
      if (window.__repintarDevices) window.__repintarDevices();
    });
  }

  // Estado indeterminado só existe via propriedade, não via atributo.
  Array.prototype.forEach.call(document.querySelectorAll('.js-indeterminate'), function (el) {
    el.indeterminate = true;
  });

  /* -------- molduras de dispositivo ---- */
  // O iframe existe para que as media queries do template respondam à largura
  // do FRAME. Num div com max-width os breakpoints nunca disparariam.

  // O frame carrega a página autônoma da tela, com o tema da documentação e
  // sem a barra de contexto. O cabeçalho de deviceFrame() no gerador conta o
  // que a montagem por srcdoc quebrava.
  function montarDevice(dev) {
    var frame = dev.querySelector('.device-frame');
    var src = dev.dataset.src;
    if (!frame || !src) return;
    var tema = document.documentElement.getAttribute('data-theme') || 'light';
    var url = src + '?embed=1&tema=' + tema;
    if (frame.dataset.pronto === url) return;
    frame.setAttribute('src', url);
    frame.dataset.pronto = url;
  }

  function ajustarDevice(dev) {
    var frame = dev.querySelector('.device-frame');
    var stage = dev.querySelector('.device-stage');
    var rotulo = dev.querySelector('.device-size');
    if (!frame || !stage) return;
    var w = Number(dev.dataset.w), h = Number(dev.dataset.h);
    // Largura disponível menos o padding do palco.
    var disp = stage.clientWidth - 48;
    var escala = Math.min(1, disp / w);
    frame.style.width = w + 'px';
    frame.style.height = h + 'px';
    frame.style.transform = escala < 1 ? 'scale(' + escala + ')' : '';
    stage.style.height = Math.round(h * escala) + 48 + 'px';
    if (rotulo) {
      rotulo.textContent = w + ' × ' + h + (escala < 1 ? '  ·  ' + Math.round(escala * 100) + '%' : '');
    }
  }

  var devices = Array.prototype.slice.call(document.querySelectorAll('.device'));

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.device-btn');
    if (!b) return;
    var dev = b.closest('.device');
    Array.prototype.forEach.call(dev.querySelectorAll('.device-btn'), function (x) {
      x.setAttribute('aria-pressed', x === b);
    });
    dev.dataset.w = b.dataset.w;
    dev.dataset.h = b.dataset.h;
    ajustarDevice(dev);
  });

  // Só monta o iframe da página visível — 7 frames de uma vez seria desperdício.
  function prepararVisiveis() {
    devices.forEach(function (dev) {
      if (dev.closest('.page') && dev.closest('.page').classList.contains('active')) {
        montarDevice(dev);
        ajustarDevice(dev);
      }
    });
  }
  window.addEventListener('hashchange', function () { setTimeout(prepararVisiveis, 0); });
  window.addEventListener('resize', function () { devices.forEach(ajustarDevice); });
  setTimeout(prepararVisiveis, 0);

  // Trocar o tema recarrega os frames visíveis com o outro ?tema=. montarDevice
  // compara a URL inteira, então frame já no tema certo não recarrega à toa.
  window.__repintarDevices = prepararVisiveis;

  /* ---------------------------------------------------- busca ⌘K ---- */

  var INDICE = __INDICE__;
  var palette = document.querySelector('.palette');
  var input = document.querySelector('.palette-input');
  var results = document.querySelector('.palette-results');
  var ativo = 0;
  var visiveis = [];

  function normaliza(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  }

  function render() {
    var q = normaliza(input.value.trim());
    visiveis = q
      ? INDICE.filter(function (i) { return normaliza(i.t + ' ' + i.s + ' ' + (i.d || '')).indexOf(q) !== -1; })
      : INDICE.slice(0, 12);
    ativo = 0;
    results.innerHTML = visiveis.length
      ? visiveis.map(function (i, n) {
          return '<li role="option" aria-selected="' + (n === 0) + '" data-href="' + i.h + '">' +
            '<span class="pr-t">' + i.t + '</span><span class="pr-s">' + i.s + '</span></li>';
        }).join('')
      : '<li class="pr-vazio">Nada encontrado para “' + input.value + '”.</li>';
  }

  function marcar() {
    Array.prototype.forEach.call(results.children, function (li, n) {
      li.setAttribute('aria-selected', n === ativo);
      if (n === ativo && li.scrollIntoView) li.scrollIntoView({ block: 'nearest' });
    });
  }

  function abrirPalette() {
    palette.hidden = false;
    input.value = '';
    render();
    input.focus();
  }
  function fecharPalette() {
    palette.hidden = true;
  }
  function irPara(i) {
    if (!i) return;
    location.hash = i.h;
    fecharPalette();
  }

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette.hidden ? abrirPalette() : fecharPalette();
      return;
    }
    if (palette.hidden) return;
    if (e.key === 'Escape') { fecharPalette(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); ativo = Math.min(ativo + 1, visiveis.length - 1); marcar(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); ativo = Math.max(ativo - 1, 0); marcar(); }
    if (e.key === 'Enter') { e.preventDefault(); irPara(visiveis[ativo]); }
  });

  if (input) input.addEventListener('input', render);
  if (results) results.addEventListener('click', function (e) {
    var li = e.target.closest('li[data-href]');
    if (li) { location.hash = li.dataset.href; fecharPalette(); }
  });
  if (palette) palette.addEventListener('click', function (e) {
    if (e.target === palette) fecharPalette();
  });
  var trigger = document.querySelector('.search-trigger');
  if (trigger) trigger.addEventListener('click', abrirPalette);

  /* ------------------------------------------- grupos colapsáveis ---- */
  // Com 3 projetos de templates a lateral fica longa. Grupos sem página
  // ativa recolhem; o que contém a página atual permanece aberto.

  Array.prototype.forEach.call(document.querySelectorAll('.nav-group > span'), function (cab) {
    cab.setAttribute('role', 'button');
    cab.setAttribute('tabindex', '0');
    function alterna() { cab.parentNode.classList.toggle('collapsed'); }
    cab.addEventListener('click', alterna);
    cab.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alterna(); }
    });
  });
})();
`;

const html = `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>UCAMDS</title>
<style>
${CSS}
</style>

<!-- O @ucam/css real, que dá vida aos previews de componente desta página.
     As molduras de dispositivo NÃO leem daqui: elas carregam a página autônoma
     da tela, que traz a própria folha. Ver deviceFrame(). -->
<style id="ucam-runtime">
/* ---- tokens gerados ---- */
${tokensCss}
/* ---- @ucam/css gerado ---- */
${ucamCss}
</style>

${sprite}
<div class="shell">
  <div class="topbar">
    <button class="burger" aria-label="Abrir navegação">&#9776;</button>
    <span class="topbar-marca">${simbolo()}<strong>UCAMDS</strong></span>
  </div>

  <nav class="side" aria-label="Documentação">
    <div class="mark">
      <a href="#/">${simbolo()}<span class="mark-txt"><strong>UCAMDS</strong><span>Design System UCAM</span></span></a>
      <button class="theme-toggle" type="button" aria-label="Tema claro. Alternar." title="Alternar tema"><svg class="sol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4"/></svg><svg class="lua" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg></button>
    </div>
    <button class="search-trigger" type="button" aria-label="Buscar na documentação">
      <span style="display:flex;align-items:center;gap:.4rem">${icon('search')}Buscar…</span><kbd>⌘K</kbd>
    </button>
    ${nav}
  </nav>

  <div class="palette" hidden>
    <div class="palette-box" role="dialog" aria-modal="true" aria-label="Buscar na documentação">
      <input class="palette-input" type="search" placeholder="Buscar componente, token, tela…" autocomplete="off" aria-controls="palette-results" />
      <ul class="palette-results" id="palette-results" role="listbox"></ul>
      <div class="palette-foot"><kbd>↑</kbd><kbd>↓</kbd> navegar · <kbd>↵</kbd> abrir · <kbd>esc</kbd> fechar</div>
    </div>
  </div>

  <main class="main">
    ${pageIntro()}
    ${pageInstalacao()}
    ${pageFoundations()}
    ${pageFoundationsCor()}
    ${pageFoundationsTipografia()}
    ${pageFoundationsEspacamento()}
    ${pageFoundationsIconografia()}
    ${pageFoundationsEstados()}
    ${pageTokens()}
    ${pageMcp()}
    ${componentPages}
    ${pagePadroes()}
    ${projetos.map((p) => pageProjeto(p) + p.templates.map((t) => templatePage(p, t)).join('')).join('')}
    ${pageDecisoes()}
  </main>
</div>

<script>${JS.replace("__INDICE__", JSON.stringify(indice))}</script>
<script>${listboxScript}</script>
<script>${menuContaScript}</script>
<script>${estadoScript}</script>
<script>${descricaoScript}</script>
<script>${linhaDoTempoScript}</script>
<script>${abasScript}</script>
<script>${filtroScript}</script>
<script>${confirmaScript}</script>
<script>${dialogoScript}</script>
<script>${gavetaScript}</script>`;

const outDir = join(ROOT, 'docs');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'index.html'), html, 'utf8');

console.log('site → docs/index.html');
console.log(`  ${(html.length / 1024).toFixed(0)} KB · ${components.length} componentes · ${demoSeqTotal} demos · ${patterns.length} padrões · ${adrs.length} ADRs`);
