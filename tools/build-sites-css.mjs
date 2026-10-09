// Gera a folha de classes do UCAMDS Sites: dist/sites/css/ucam-site.css.
//
// Escrita à mão, no mesmo molde do build-css.mjs da aplicação: um template
// literal, uma seção por componente, o contrato citado no comentário. Três
// restrições: tudo sob .ucam-site; zero reset global; só token semântico dos
// sites (var(--ucam-site-…) que exista e não seja primitivo). Mobile-first:
// só min-width, e só com os viewports da semântica.
//
//   node tools/build-sites-css.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Lê os tokens gerados e a semântica, para os helpers e os portões. */
function lerTokens(raiz) {
  const dir = join(raiz, 'dist', 'sites', 'tokens');
  const css = join(dir, 'ucam-site-tokens.css');
  if (!existsSync(css)) throw new Error('dist/sites/tokens/ucam-site-tokens.css não existe. Rode: node tools/build-sites-tokens.mjs');
  const nomes = JSON.parse(readFileSync(join(dir, 'ucam-site-tokens.json'), 'utf8'));
  const semantic = JSON.parse(readFileSync(join(raiz, 'sites', 'spec', 'tokens', 'semantic.json'), 'utf8'));
  const primitive = JSON.parse(readFileSync(join(raiz, 'sites', 'spec', 'tokens', 'primitive.json'), 'utf8'));
  const base = JSON.parse(readFileSync(join(raiz, 'spec', 'tokens', 'primitive.json'), 'utf8'));
  const breakpoints = { ...(base.breakpoint ?? {}), ...(primitive.breakpoint ?? {}) };
  const viewports = new Set();
  const remDoPapel = (papel) => {
    const no = semantic.viewport?.[papel];
    if (!no) throw new Error(`papel de viewport inexistente: ${papel}`);
    const degrau = no.$value.replace(/[{}]/g, '').split('.').at(-1);
    const bruto = breakpoints[degrau]?.$value;
    if (!bruto) throw new Error(`breakpoint.${degrau} inexistente`);
    return parseFloat(bruto);
  };
  for (const papel of Object.keys(semantic.viewport ?? {})) {
    if (!papel.startsWith('$')) viewports.add(`min:${remDoPapel(papel)}rem`);
  }
  return {
    disponiveis: new Set([...readFileSync(css, 'utf8').matchAll(/^\s*(--ucam-site-[a-z0-9-]+):/gm)].map((m) => m[1])),
    primitivos: new Set(Object.keys(nomes.primitive).map((n) => `--ucam-site-${n}`)),
    semanticos: new Set(Object.keys(nomes.semantic).map((n) => `--ucam-site-${n}`)),
    viewports,
    remDoPapel,
  };
}

/** Os portões, puros: recebem a folha e as listas, devolvem falhas. */
export function conferirFolha(bruta, tokens) {
  const falhas = [];
  // Sem os comentários: o que um comentário cita não é o que a folha faz.
  const css = bruta.replace(/\/\*[\s\S]*?\*\//g, '');

  // VARIÁVEL DA APLICAÇÃO. No site de docs ela resolveria — os tokens da
  // aplicação estão carregados ali — e o defeito só apareceria no WordPress.
  for (const v of new Set([...css.matchAll(/var\(\s*(--ucam-(?!site-)[a-z0-9-]+)/gi)].map((m) => m[1]))) {
    falhas.push(`variável da aplicação na folha dos sites: ${v}`);
  }
  // O QUE O PORTÃO NÃO MEDE NÃO ENTRA (lição da subpaleta, ADR-037): cor
  // calculada no navegador e cor escrita à mão escapam do contraste medido.
  if (/color-mix\(/i.test(css)) falhas.push('color-mix() na folha dos sites: cor calculada em tempo de execução não passa por portão');
  if (/oklch\(/i.test(css)) falhas.push('oklch() na folha dos sites: cor calculada em tempo de execução não passa por portão');
  for (const h of new Set([...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]))) {
    falhas.push(`hex cru na folha dos sites: ${h} — cor vem de token semântico`);
  }
  const referenciadas = [...new Set([...css.matchAll(/var\(\s*(--ucam-site-[a-z0-9-]+)\s*[,)]/g)].map((m) => m[1]))];
  const declaradas = new Set([...css.matchAll(/(?:^|[{;])\s*(--ucam-site-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]));
  for (const t of referenciadas) {
    if (declaradas.has(t)) continue;
    if (!tokens.disponiveis.has(t)) falhas.push(`token inexistente na folha dos sites: ${t}`);
    else if (tokens.primitivos.has(t) && !tokens.semanticos.has(t)) falhas.push(`primitivo em componente (ADR-007): ${t}`);
  }
  for (const m of css.matchAll(/\((min|max)-width:\s*([^)]+)\)/gi)) {
    const lado = m[1].toLowerCase();
    const chave = `${lado}:${m[2].trim()}`;
    if (lado === 'max') falhas.push(`max-width na folha dos sites (mobile-first, só min-width): ${chave}`);
    else if (!tokens.viewports.has(chave)) falhas.push(`media query fora dos viewports da semântica: ${chave}`);
  }
  return { falhas };
}

export function construirCss({ raiz = ROOT } = {}) {
  const tokens = lerTokens(raiz);
  const acima = (papel) => `@media (min-width: ${tokens.remDoPapel(papel)}rem)`;
  const V = (n) => `var(--ucam-site-${n})`;

  const css = `/* @ucam/site-css — gerado por tools/build-sites-css.mjs. NÃO EDITAR À MÃO.
 * Trilho A dos sites: aparência sem framework, escopada sob .ucam-site.
 * Mobile-first, só min-width. Só token semântico dos sites. */
@import "../tokens/ucam-site-tokens.css";

/* ---------------------------------------------------------------- raiz --- */
/* Tudo vive sob .ucam-site. A família é declarada aqui pelo mesmo motivo
 * que em .ucam: sem ela o escopo herda a fonte do site hospedeiro. */
.ucam-site {
  color: ${V('color-text-body')};
  font-family: ${V('font-body')};
  font-size: ${V('typography-body-font-size')};
  line-height: ${V('typography-body-line-height')};
  -webkit-font-smoothing: antialiased;
}
.ucam-site *,
.ucam-site *::before,
.ucam-site *::after {
  box-sizing: border-box;
}
/* O ÍCONE. O markup é o do sprite compartilhado — um svg com a classe ic e um
 * use apontando para o símbolo —, e um svg sem inline-size estica até o
 * contêiner. A regra morava só na folha do site de docs: quem copiava a demo
 * do pacote recebia o icon-chip vazio (revisão de 09/10/2026). Fica ANTES das
 * peças, para o degrau por papel de cada uma vencer. */
.ucam-site .ic {
  display: inline-block;
  inline-size: ${V('size-icon-md')};
  block-size: ${V('size-icon-md')};
  flex: none;
  vertical-align: -0.15em;
  stroke-width: 2;
}
/* Anel de foco cinza (ADR-048), igual em toda peça. Sobre seção escura o
 * degrau é outro, medido. */
.ucam-site :focus-visible {
  outline: ${V('focus-ring-width')} solid ${V('color-border-focus')};
  outline-offset: ${V('focus-ring-offset')};
}
.ucam-site-inverso :focus-visible {
  outline-color: ${V('color-border-focus-on-inverse')};
}

/* ------------------------------------------------------- seção escura --- */
/* color.surface.inverse é uma SUPERFÍCIE, não um tema: hero com foto,
 * rodapé, CTA final. Quem está dentro lê em on-inverse. */
.ucam-site-inverso {
  background: ${V('color-surface-inverse')};
  color: ${V('color-text-on-inverse')};
}

/* --------------------------------------------------- texto de apoio ---- */
.ucam-site-muted {
  color: ${V('color-text-muted')};
  font-size: ${V('typography-caption-font-size')};
  line-height: ${V('typography-caption-line-height')};
}
.ucam-site-inverso .ucam-site-muted {
  color: ${V('color-text-on-inverse-muted')};
}
.ucam-site-titulo {
  display: block;
  color: ${V('color-text-primary')};
  font-size: ${V('typography-title-font-size')};
  font-weight: ${V('typography-title-font-weight')};
  line-height: ${V('typography-title-line-height')};
}
.ucam-site-inverso .ucam-site-titulo {
  color: ${V('color-text-on-inverse')};
}

/* -------------------------------------------------------------- button --- */
/* Contrato: sites/spec/components/button.json. Uma classe, variante e
 * tamanho por modificador; <a> e <button> sem diferença. */
.ucam-site-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${V('space-inline-sm')};
  min-block-size: ${V('size-control-md')};
  padding-inline: ${V('space-inset-control')};
  border: 1px solid transparent;
  border-radius: ${V('radius-control')};
  background: transparent;
  color: inherit;
  font-family: ${V('typography-action-font-family')};
  font-size: ${V('typography-action-font-size')};
  font-weight: ${V('typography-action-font-weight')};
  line-height: ${V('typography-action-line-height')};
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color ${V('motion-duration-state')} ${V('motion-easing-standard')},
    border-color ${V('motion-duration-state')} ${V('motion-easing-standard')},
    color ${V('motion-duration-state')} ${V('motion-easing-standard')};
}
.ucam-site-btn .ic,
.ucam-site-btn__icon {
  inline-size: ${V('size-icon-md')};
  block-size: ${V('size-icon-md')};
  flex: none;
}
.ucam-site-btn--lg {
  min-block-size: ${V('size-control-lg')};
  padding-inline: ${V('space-stack-md')};
  font-size: ${V('typography-body-lg-font-size')};
}
.ucam-site-btn--primary {
  background: ${V('color-action-primary-default')};
  color: ${V('color-text-on-action')};
  box-shadow: ${V('elevation-button')};
}
.ucam-site-btn--primary:hover:not(:disabled):not([aria-disabled="true"]) { background: ${V('color-action-primary-hover')}; }
.ucam-site-btn--primary:active:not(:disabled):not([aria-disabled="true"]) { background: ${V('color-action-primary-active')}; box-shadow: none; }
.ucam-site-btn--secondary {
  background: ${V('color-action-secondary-default')};
  border-color: ${V('color-action-secondary-border')};
  color: ${V('color-text-primary')};
}
.ucam-site-btn--secondary:hover:not(:disabled):not([aria-disabled="true"]) { background: ${V('color-action-secondary-hover')}; }
.ucam-site-btn--secondary:active:not(:disabled):not([aria-disabled="true"]) { background: ${V('color-action-secondary-active')}; }
.ucam-site-btn--ghost {
  color: ${V('color-action-primary-default')};
}
.ucam-site-btn--ghost:hover:not(:disabled):not([aria-disabled="true"]) { background: ${V('color-action-primary-subtle')}; }
.ucam-site-btn--ghost:active:not(:disabled):not([aria-disabled="true"]) { background: ${V('color-interaction-active')}; }
/* Sobre seção escura: o primário vira papel com tinta escura, o secundário
 * ganha borda clara, o fantasma lê em branco e o hover é lavagem de papel. */
.ucam-site-btn--inverse.ucam-site-btn--primary {
  background: ${V('color-text-on-inverse')};
  color: ${V('color-text-primary')};
  box-shadow: none;
}
.ucam-site-btn--inverse.ucam-site-btn--primary:hover:not(:disabled):not([aria-disabled="true"]) { background: ${V('color-surface-subtle')}; }
.ucam-site-btn--inverse.ucam-site-btn--primary:active:not(:disabled):not([aria-disabled="true"]) { background: ${V('color-surface-sunken')}; }
.ucam-site-btn--inverse.ucam-site-btn--secondary {
  background: transparent;
  border-color: ${V('color-border-on-inverse')};
  color: ${V('color-text-on-inverse')};
}
.ucam-site-btn--inverse.ucam-site-btn--secondary:hover:not(:disabled):not([aria-disabled="true"]) { background: ${V('color-interaction-hover-on-inverse')}; }
.ucam-site-btn--inverse.ucam-site-btn--secondary:active:not(:disabled):not([aria-disabled="true"]) { background: ${V('color-interaction-active-on-inverse')}; }
.ucam-site-btn--inverse.ucam-site-btn--ghost {
  color: ${V('color-text-on-inverse')};
}
.ucam-site-btn--inverse.ucam-site-btn--ghost:hover:not(:disabled):not([aria-disabled="true"]) { background: ${V('color-interaction-hover-on-inverse')}; }
.ucam-site-btn--inverse.ucam-site-btn--ghost:active:not(:disabled):not([aria-disabled="true"]) { background: ${V('color-interaction-active-on-inverse')}; }
.ucam-site-btn:disabled,
.ucam-site-btn[aria-disabled="true"] {
  background: ${V('color-action-disabled-background')};
  border-color: transparent;
  color: ${V('color-action-disabled-text')};
  box-shadow: none;
  cursor: not-allowed;
}

/* ----------------------------------------------------------------- tag --- */
/* Contrato: sites/spec/components/tag.json. Pílula, nunca clicável. */
.ucam-site-tag {
  display: inline-flex;
  align-items: center;
  gap: ${V('space-inline-xs')};
  padding: ${V('space-inline-xs')} ${V('space-inline-sm')};
  border-radius: ${V('radius-pill')};
  background: ${V('color-surface-sunken')};
  color: ${V('color-text-secondary')};
  font-size: ${V('typography-caption-font-size')};
  font-weight: ${V('typography-action-font-weight')};
  line-height: ${V('typography-caption-line-height')};
  white-space: nowrap;
}
.ucam-site-tag--brand {
  background: ${V('color-surface-brand-soft')};
  color: ${V('color-action-primary-default')};
}
.ucam-site-tag--info {
  background: ${V('color-feedback-info-background')};
  color: ${V('color-feedback-info-foreground')};
}
.ucam-site-tag--inverse {
  background: ${V('color-interaction-hover-on-inverse')};
  color: ${V('color-text-on-inverse')};
}

/* ----------------------------------------------------------- icon-chip --- */
/* Contrato: sites/spec/components/icon-chip.json. Decorativa; o ícone
 * recebe o degrau do papel pela folha, não pela marcação. */
.ucam-site-icon-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  inline-size: ${V('size-icon-chip-md')};
  block-size: ${V('size-icon-chip-md')};
  border-radius: ${V('radius-control')};
  background: ${V('color-surface-brand-soft')};
  color: ${V('color-action-primary-default')};
}
.ucam-site-icon-chip .ic {
  inline-size: ${V('size-icon-md')};
  block-size: ${V('size-icon-md')};
}
.ucam-site-icon-chip--lg {
  inline-size: ${V('size-icon-chip-lg')};
  block-size: ${V('size-icon-chip-lg')};
}
.ucam-site-icon-chip--lg .ic {
  inline-size: ${V('size-icon-lg')};
  block-size: ${V('size-icon-lg')};
}
.ucam-site-icon-chip--neutral {
  background: ${V('color-surface-sunken')};
  color: ${V('color-text-secondary')};
}
.ucam-site-icon-chip--inverse {
  background: ${V('color-interaction-hover-on-inverse')};
  color: ${V('color-text-on-inverse')};
}

/* ----------------------------------------------------- section-heading --- */
/* Contrato: sites/spec/components/section-heading.json. Eyebrow, título em
 * display e lede, na largura de prosa. */
.ucam-site-section-heading {
  display: grid;
  gap: ${V('space-stack-xs')};
  max-inline-size: ${V('container-prosa')};
}
.ucam-site-section-heading__eyebrow {
  margin: 0;
  color: ${V('color-action-primary-default')};
  font-size: ${V('typography-eyebrow-font-size')};
  font-weight: ${V('typography-eyebrow-font-weight')};
  line-height: ${V('typography-eyebrow-line-height')};
  letter-spacing: ${V('typography-eyebrow-letter-spacing')};
  text-transform: uppercase;
}
.ucam-site-section-heading__title {
  margin: 0;
  color: ${V('color-text-primary')};
  font-family: ${V('typography-display-section-font-family')};
  font-size: ${V('typography-display-section-font-size')};
  font-weight: ${V('typography-display-section-font-weight')};
  line-height: ${V('typography-display-section-line-height')};
  letter-spacing: ${V('typography-display-section-letter-spacing')};
  text-wrap: balance;
}
.ucam-site-section-heading--sm .ucam-site-section-heading__title {
  font-size: ${V('typography-display-section-sm-font-size')};
  letter-spacing: ${V('typography-display-section-sm-letter-spacing')};
}
.ucam-site-section-heading__lede {
  margin: 0;
  color: ${V('color-text-secondary')};
  font-size: ${V('typography-lede-font-size')};
  line-height: ${V('typography-lede-line-height')};
  text-wrap: pretty;
}
.ucam-site-section-heading__acoes {
  display: flex;
  flex-wrap: wrap;
  gap: ${V('space-inline-sm')};
  margin-block-start: ${V('space-stack-sm')};
}
.ucam-site-section-heading--center {
  justify-items: center;
  margin-inline: auto;
  text-align: center;
}
.ucam-site-section-heading--center .ucam-site-section-heading__acoes {
  justify-content: center;
}
.ucam-site-section-heading--inverse .ucam-site-section-heading__title {
  color: ${V('color-text-on-inverse')};
}
.ucam-site-section-heading--inverse .ucam-site-section-heading__eyebrow,
.ucam-site-section-heading--inverse .ucam-site-section-heading__lede {
  color: ${V('color-text-on-inverse-muted')};
}
${acima('nav-aberta')} {
  .ucam-site-section-heading {
    gap: ${V('space-stack-sm')};
  }
}
`;

  const { falhas } = conferirFolha(css, tokens);
  return { css, falhas, relatos: [`  ${(css.length / 1024).toFixed(1)} KB · ${(css.match(/^\.ucam-site[a-z0-9_-]*\s*\{/gm) ?? []).length} regras de raiz`] };
}

function principal() {
  const r = construirCss();
  if (r.falhas.length) {
    console.error(`✗ ${r.falhas.length} falha(s) na folha dos sites:`);
    for (const f of r.falhas) console.error('  ' + f);
    process.exit(1);
  }
  const out = join(ROOT, 'dist', 'sites', 'css');
  if (!existsSync(out)) mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'ucam-site.css'), r.css, 'utf8');
  console.log('@ucam/site-css → dist/sites/css/ucam-site.css');
  for (const l of r.relatos) console.log(l);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) principal();
