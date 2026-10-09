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

/* -------------------------------------------------------------- avatar --- */
/* Contrato: sites/spec/components/avatar.json. Pessoa em círculo, com foto ou
 * iniciais; empresa em quadrado (--logo), com a marca contida e sem corte. */
.ucam-site-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  inline-size: ${V('size-avatar')};
  block-size: ${V('size-avatar')};
  border-radius: ${V('radius-pill')};
  overflow: hidden;
  background: ${V('color-surface-brand-soft')};
  color: ${V('color-action-primary-default')};
  font-size: ${V('typography-caption-font-size')};
  font-weight: ${V('typography-action-font-weight')};
  line-height: 1;
}
.ucam-site-avatar img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}
.ucam-site-avatar--sm {
  inline-size: ${V('size-avatar-sm')};
  block-size: ${V('size-avatar-sm')};
  font-size: ${V('typography-eyebrow-font-size')};
}
.ucam-site-avatar--lg {
  inline-size: ${V('size-avatar-lg')};
  block-size: ${V('size-avatar-lg')};
  font-size: ${V('typography-body-lg-font-size')};
}
.ucam-site-avatar--logo {
  border: 1px solid ${V('color-border-default')};
  border-radius: ${V('radius-control')};
  background: ${V('color-surface-default')};
}
.ucam-site-avatar--logo img {
  padding: ${V('space-inline-xs')};
  object-fit: contain;
}

/* ----------------------------------------------------------- accordion --- */
/* Contrato: sites/spec/components/accordion.json. Cada item é um details e o
 * gatilho é o summary dele: abre por clique, Enter e Espaço sem uma linha de
 * script, e o estado aberto é o atributo open. Com o mesmo name nos itens o
 * navegador fecha os outros. */
.ucam-site-accordion {
  display: block;
  border-block-start: 1px solid ${V('color-border-default')};
}
.ucam-site-accordion__item {
  border-block-end: 1px solid ${V('color-border-default')};
}
.ucam-site-accordion__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${V('space-stack-sm')};
  min-block-size: ${V('size-touch-min')};
  padding-block: ${V('space-inset-control')};
  color: ${V('color-text-primary')};
  font-size: ${V('typography-lede-font-size')};
  font-weight: ${V('typography-title-font-weight')};
  line-height: ${V('typography-title-line-height')};
  list-style: none;
  cursor: pointer;
  transition: color ${V('motion-duration-state')} ${V('motion-easing-standard')};
}
.ucam-site-accordion__trigger::-webkit-details-marker {
  display: none;
}
.ucam-site-accordion__trigger:hover {
  color: ${V('color-action-primary-default')};
}
.ucam-site-accordion__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  inline-size: ${V('size-icon-button')};
  block-size: ${V('size-icon-button')};
  border-radius: ${V('radius-pill')};
  background: ${V('color-surface-sunken')};
  color: ${V('color-text-secondary')};
  transition:
    transform ${V('motion-duration-reveal')} ${V('motion-easing-standard')},
    background-color ${V('motion-duration-state')} ${V('motion-easing-standard')},
    color ${V('motion-duration-state')} ${V('motion-easing-standard')};
}
.ucam-site-accordion__trigger:hover .ucam-site-accordion__icon {
  background: ${V('color-surface-brand-soft')};
  color: ${V('color-action-primary-default')};
}
.ucam-site-accordion__item[open] > .ucam-site-accordion__trigger .ucam-site-accordion__icon {
  transform: rotate(180deg);
}
.ucam-site-accordion__panel {
  max-inline-size: ${V('container-prosa')};
  padding-block-end: ${V('space-inset-control')};
  color: ${V('color-text-body')};
}
.ucam-site-accordion__panel > :first-child { margin-block-start: 0; }
.ucam-site-accordion__panel > :last-child { margin-block-end: 0; }
@media (prefers-reduced-motion: reduce) {
  .ucam-site-accordion__icon { transition: none; }
}

/* ---------------------------------------------------------- pagination --- */
/* Contrato: sites/spec/components/pagination.json. 44px por item: no kit eram
 * 36, e paginação é o controle mais tocado de uma lista de vagas no telefone. */
.ucam-site-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${V('space-inline-xs')};
}
.ucam-site-pagination__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: ${V('size-touch-min')};
  min-block-size: ${V('size-touch-min')};
  padding-inline: ${V('space-inline-sm')};
  border-radius: ${V('radius-pill')};
  color: ${V('color-text-secondary')};
  font-size: ${V('typography-body-font-size')};
  font-weight: ${V('typography-action-font-weight')};
  text-decoration: none;
  transition: background-color ${V('motion-duration-state')} ${V('motion-easing-standard')};
}
.ucam-site-pagination__item:hover:not([aria-current="page"]):not([aria-disabled="true"]) {
  background: ${V('color-surface-sunken')};
  color: ${V('color-text-primary')};
}
.ucam-site-pagination__item[aria-current="page"] {
  background: ${V('color-action-primary-default')};
  color: ${V('color-text-on-action')};
}
.ucam-site-pagination__item[aria-disabled="true"] {
  color: ${V('color-text-muted')};
  pointer-events: none;
}
.ucam-site-pagination__item--seta .ic {
  inline-size: ${V('size-icon-md')};
  block-size: ${V('size-icon-md')};
}
.ucam-site-pagination__reticencias {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: ${V('size-icon-button')};
  color: ${V('color-text-muted')};
}

/* --------------------------------------------------------------- input --- */
/* Contrato: sites/spec/components/input.json. A borda é a FORTE (3,47:1): é
 * ela que diz onde o campo começa (WCAG 1.4.11); a do kit dava 1,3:1. O texto
 * do campo é 16px para o iOS não dar zoom ao focar. */
.ucam-site-input {
  display: grid;
  gap: ${V('space-inline-xs')};
}
.ucam-site-input__label {
  color: ${V('color-text-primary')};
  font-size: ${V('typography-caption-font-size')};
  font-weight: ${V('typography-action-font-weight')};
  line-height: ${V('typography-caption-line-height')};
}
.ucam-site-input__control {
  position: relative;
  display: flex;
  align-items: center;
}
.ucam-site-input__field {
  inline-size: 100%;
  min-block-size: ${V('size-control-md')};
  padding-inline: ${V('space-stack-sm')};
  border: 1px solid ${V('color-border-strong')};
  border-radius: ${V('radius-control')};
  background: ${V('color-surface-default')};
  color: ${V('color-text-primary')};
  font-family: ${V('font-body')};
  font-size: ${V('typography-body-lg-font-size')};
  line-height: ${V('typography-body-lg-line-height')};
  transition: border-color ${V('motion-duration-state')} ${V('motion-easing-standard')};
}
.ucam-site-input__field::placeholder {
  color: ${V('color-text-muted')};
  opacity: 1;
}
.ucam-site-input__field:hover:not(:disabled) {
  border-color: ${V('color-border-focus')};
}
.ucam-site-input__field:disabled {
  background: ${V('color-action-disabled-background')};
  color: ${V('color-action-disabled-text')};
  cursor: not-allowed;
}
.ucam-site-input__field[aria-invalid="true"] {
  border-color: ${V('color-feedback-danger-border')};
}
.ucam-site-input__icon {
  position: absolute;
  inset-inline-start: ${V('space-stack-sm')};
  inline-size: ${V('size-icon-md')};
  block-size: ${V('size-icon-md')};
  color: ${V('color-text-muted')};
  pointer-events: none;
}
.ucam-site-input__control:has(.ucam-site-input__icon) .ucam-site-input__field {
  padding-inline-start: calc(${V('space-stack-sm')} * 2 + ${V('size-icon-md')});
}
.ucam-site-input__hint {
  color: ${V('color-text-muted')};
  font-size: ${V('typography-caption-font-size')};
  line-height: ${V('typography-caption-line-height')};
}
.ucam-site-input__erro {
  color: ${V('color-feedback-danger-foreground')};
  font-size: ${V('typography-caption-font-size')};
  font-weight: ${V('typography-action-font-weight')};
  line-height: ${V('typography-caption-line-height')};
}

/* ----------------------------------------------------- newsletter-form --- */
/* Contrato: sites/spec/components/newsletter-form.json. Campo e botão
 * empilham no telefone e deitam lado a lado a partir de duas colunas. */
.ucam-site-newsletter {
  display: grid;
  gap: ${V('space-stack-sm')};
  max-inline-size: ${V('container-prosa')};
}
.ucam-site-newsletter__titulo {
  margin: 0;
  color: ${V('color-text-primary')};
  font-size: ${V('typography-title-font-size')};
  font-weight: ${V('typography-title-font-weight')};
  line-height: ${V('typography-title-line-height')};
}
.ucam-site-newsletter__campos {
  display: grid;
  gap: ${V('space-inline-sm')};
  align-items: end;
}
.ucam-site-newsletter__nota {
  margin: 0;
  color: ${V('color-text-muted')};
  font-size: ${V('typography-caption-font-size')};
  line-height: ${V('typography-caption-line-height')};
}
.ucam-site-newsletter--inverse .ucam-site-newsletter__titulo,
.ucam-site-newsletter--inverse .ucam-site-input__label {
  color: ${V('color-text-on-inverse')};
}
.ucam-site-newsletter--inverse .ucam-site-newsletter__nota,
.ucam-site-newsletter--inverse .ucam-site-input__hint {
  color: ${V('color-text-on-inverse-muted')};
}
${acima('duas-colunas')} {
  .ucam-site-newsletter__campos { grid-template-columns: minmax(0, 1fr) auto; }
}

/* ---------------------------------------------------------- breadcrumb --- */
/* Contrato: sites/spec/components/breadcrumb.json. Lista ordenada dentro de
 * um nav; o separador é desenho (o texto alternativo dele é vazio) e a página
 * atual não é link. */
.ucam-site-breadcrumb {
  color: ${V('color-text-muted')};
  font-size: ${V('typography-caption-font-size')};
  line-height: ${V('typography-caption-line-height')};
}
.ucam-site-breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${V('space-inline-xs')};
  margin: 0;
  padding: 0;
  list-style: none;
}
.ucam-site-breadcrumb__item {
  display: inline-flex;
  align-items: center;
  gap: ${V('space-inline-xs')};
}
.ucam-site-breadcrumb__item + .ucam-site-breadcrumb__item::before {
  content: "/" / "";
  color: ${V('color-border-strong')};
}
.ucam-site-breadcrumb__item a {
  color: ${V('color-text-secondary')};
  text-decoration: none;
}
.ucam-site-breadcrumb__item a:hover {
  color: ${V('color-text-link')};
  text-decoration: underline;
}
.ucam-site-breadcrumb__item [aria-current="page"] {
  color: ${V('color-text-primary')};
  font-weight: ${V('typography-action-font-weight')};
}
.ucam-site-breadcrumb--inverse,
.ucam-site-breadcrumb--inverse .ucam-site-breadcrumb__item a {
  color: ${V('color-text-on-inverse-muted')};
}
.ucam-site-breadcrumb--inverse .ucam-site-breadcrumb__item a:hover,
.ucam-site-breadcrumb--inverse .ucam-site-breadcrumb__item [aria-current="page"] {
  color: ${V('color-text-on-inverse')};
}
.ucam-site-breadcrumb--inverse .ucam-site-breadcrumb__item + .ucam-site-breadcrumb__item::before {
  color: ${V('color-border-on-inverse')};
}

/* ---------------------------------------------------------- page-shell --- */
/* Contrato: sites/spec/components/page-shell.json. A moldura da página: o
 * atalho para o conteúdo, a coluna que empurra o rodapé para o pé, o
 * contêiner com a margem lateral e a seção com o respiro vertical. */
.ucam-site-page {
  display: flex;
  flex-direction: column;
  min-block-size: 100dvh;
  background: ${V('color-surface-canvas')};
}
.ucam-site-page__main {
  flex: 1 0 auto;
}
.ucam-site-skip {
  position: absolute;
  inset-block-start: ${V('space-gutter-sm')};
  inset-inline-start: ${V('space-gutter-sm')};
  z-index: ${V('z-skip')};
  padding: ${V('space-inline-sm')} ${V('space-stack-sm')};
  border-radius: ${V('radius-control')};
  background: ${V('color-surface-default')};
  color: ${V('color-text-primary')};
  box-shadow: ${V('elevation-popover')};
  transform: translateY(-200%);
}
.ucam-site-skip:focus {
  transform: none;
}
.ucam-site-container {
  inline-size: 100%;
  max-inline-size: ${V('container-miolo')};
  margin-inline: auto;
  padding-inline: ${V('space-gutter-sm')};
}
.ucam-site-container--faixa { max-inline-size: ${V('container-faixa')}; }
.ucam-site-container--prosa { max-inline-size: ${V('container-prosa')}; }
.ucam-site-secao {
  padding-block: ${V('space-section-sm')};
}
.ucam-site-secao--sutil {
  background: ${V('color-surface-subtle')};
}
${acima('grade-completa')} {
  .ucam-site-container { padding-inline: ${V('space-gutter')}; }
  .ucam-site-secao { padding-block: ${V('space-section')}; }
}

/* --------------------------------------------------------- site-header --- */
/* Contrato: sites/spec/components/site-header.json. Mobile-first: a
 * navegação em linha nasce escondida e o menu recolhido — um details — nasce
 * visível; a partir de nav-aberta os dois trocam. Nunca aparecem juntos. */
.ucam-site-header {
  position: sticky;
  inset-block-start: 0;
  z-index: ${V('z-header')};
  border-block-end: 1px solid ${V('color-border-default')};
  background: ${V('color-surface-default')};
}
.ucam-site-header__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${V('space-stack-md')};
  inline-size: 100%;
  max-inline-size: ${V('container-faixa')};
  min-block-size: ${V('size-header')};
  margin-inline: auto;
  padding-inline: ${V('space-gutter-sm')};
}
.ucam-site-header__brand {
  display: inline-flex;
  align-items: center;
  flex: none;
  min-block-size: ${V('size-touch-min')};
  color: ${V('color-text-primary')};
  font-family: ${V('font-display')};
  font-size: ${V('typography-title-font-size')};
  font-weight: ${V('typography-title-font-weight')};
  text-decoration: none;
}
.ucam-site-header__logo {
  display: block;
  inline-size: auto;
  block-size: ${V('size-logo')};
}
.ucam-site-header__nav {
  display: none;
  align-items: center;
  gap: ${V('space-stack-md')};
}
.ucam-site-header__link {
  display: inline-flex;
  align-items: center;
  min-block-size: ${V('size-touch-min')};
  color: ${V('color-text-secondary')};
  font-size: ${V('typography-action-font-size')};
  text-decoration: none;
  transition: color ${V('motion-duration-state')} ${V('motion-easing-standard')};
}
.ucam-site-header__link:hover {
  color: ${V('color-action-primary-default')};
}
.ucam-site-header__link[aria-current="page"] {
  color: ${V('color-text-primary')};
  font-weight: ${V('typography-action-font-weight')};
  box-shadow: inset 0 -2px 0 ${V('color-action-primary-default')};
}
.ucam-site-header__actions {
  display: none;
  align-items: center;
  gap: ${V('space-inline-sm')};
}
.ucam-site-header__menu {
  display: block;
}
.ucam-site-header__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: ${V('size-touch-min')};
  min-block-size: ${V('size-touch-min')};
  border-radius: ${V('radius-control')};
  color: ${V('color-text-primary')};
  list-style: none;
  cursor: pointer;
}
.ucam-site-header__toggle::-webkit-details-marker {
  display: none;
}
.ucam-site-header__toggle:hover {
  background: ${V('color-interaction-hover')};
}
.ucam-site-header__menu[open] > .ucam-site-header__toggle {
  background: ${V('color-interaction-active')};
}
.ucam-site-header__mobile {
  position: absolute;
  inset-block-start: 100%;
  inset-inline: 0;
  display: grid;
  gap: ${V('space-inline-xs')};
  padding: ${V('space-stack-sm')} ${V('space-gutter-sm')} ${V('space-stack-md')};
  border-block-end: 1px solid ${V('color-border-default')};
  background: ${V('color-surface-default')};
  box-shadow: ${V('elevation-popover')};
}
.ucam-site-header__mobile .ucam-site-header__link[aria-current="page"] {
  box-shadow: none;
}
.ucam-site-header__mobile .ucam-site-btn {
  margin-block-start: ${V('space-inline-sm')};
}
${acima('nav-aberta')} {
  .ucam-site-header__nav { display: flex; }
  .ucam-site-header__actions { display: flex; }
  .ucam-site-header__menu { display: none; }
}
${acima('grade-completa')} {
  .ucam-site-header__bar { padding-inline: ${V('space-gutter')}; }
}

/* --------------------------------------------------------- site-footer --- */
/* Contrato: sites/spec/components/site-footer.json. Superfície inversa: uma
 * coluna no telefone, duas a partir de duas colunas, e marca + três colunas +
 * contato na grade completa. */
.ucam-site-footer {
  background: ${V('color-surface-inverse')};
  color: ${V('color-text-on-inverse-muted')};
}
.ucam-site-footer :focus-visible {
  outline-color: ${V('color-border-focus-on-inverse')};
}
.ucam-site-footer__inner {
  inline-size: 100%;
  max-inline-size: ${V('container-faixa')};
  margin-inline: auto;
  padding: ${V('space-section-sm')} ${V('space-gutter-sm')};
}
.ucam-site-footer__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${V('space-block')} ${V('space-stack-lg')};
}
.ucam-site-footer__brand {
  display: grid;
  gap: ${V('space-stack-sm')};
  align-content: start;
  justify-items: start;
  color: ${V('color-text-on-inverse')};
  font-family: ${V('font-display')};
  font-size: ${V('typography-title-font-size')};
  font-weight: ${V('typography-title-font-weight')};
}
.ucam-site-footer__logo {
  display: block;
  inline-size: auto;
  max-inline-size: 100%;
  block-size: ${V('size-logo-footer')};
}
.ucam-site-footer__col {
  display: grid;
  gap: ${V('space-inline-xs')};
  align-content: start;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ucam-site-footer__col-title {
  margin: 0 0 ${V('space-inline-xs')};
  color: ${V('color-text-on-inverse')};
  font-size: ${V('typography-eyebrow-font-size')};
  font-weight: ${V('typography-eyebrow-font-weight')};
  line-height: ${V('typography-eyebrow-line-height')};
  letter-spacing: ${V('typography-eyebrow-letter-spacing')};
  text-transform: uppercase;
}
.ucam-site-footer__link {
  display: inline-flex;
  padding-block: ${V('space-inline-xs')};
  color: ${V('color-text-on-inverse-muted')};
  text-decoration: none;
  transition: color ${V('motion-duration-state')} ${V('motion-easing-standard')};
}
.ucam-site-footer__link:hover {
  color: ${V('color-text-on-inverse')};
  text-decoration: underline;
}
.ucam-site-footer__contact {
  display: grid;
  gap: ${V('space-inline-xs')};
  align-content: start;
  font-style: normal;
}
.ucam-site-footer__bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${V('space-stack-sm')};
  margin-block-start: ${V('space-block')};
  padding-block-start: ${V('space-stack-md')};
  border-block-start: 1px solid ${V('color-border-on-inverse')};
}
.ucam-site-footer__legal {
  margin: 0;
  font-size: ${V('typography-caption-font-size')};
  line-height: ${V('typography-caption-line-height')};
}
.ucam-site-footer__social {
  display: flex;
  flex-wrap: wrap;
  gap: ${V('space-stack-sm')};
  margin: 0;
  padding: 0;
  list-style: none;
}
${acima('duas-colunas')} {
  .ucam-site-footer__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
${acima('grade-completa')} {
  .ucam-site-footer__inner { padding-inline: ${V('space-gutter')}; }
  .ucam-site-footer__grid { grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr)) 1.4fr; }
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
