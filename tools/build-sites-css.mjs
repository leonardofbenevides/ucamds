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

/* ------------------------------------------------------------- fileira --- */
/* Peças em linha lado a lado: botões, tags, pastilhas, avatar e nome. Quem
 * separa é o gap, não o espaço em branco do HTML: um template Angular tira
 * esse espaço ao compilar, e dois botões irmãos ficavam encostados na lib e
 * com 4px no HTML (medido, 10/10/2026). Dentro da fileira os dois dão igual. */
.ucam-site-fileira {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${V('space-inline-md')};
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
/* O painel desliza onde o navegador sabe animar até a altura do conteúdo
 * (interpolate-size) e expõe o conteúdo do details (::details-content). Nos
 * outros ele aparece e some, como antes. É da folha, não da lib: vale também
 * para quem escreve o HTML à mão. */
@supports (interpolate-size: allow-keywords) {
  .ucam-site-accordion { interpolate-size: allow-keywords; }
  .ucam-site-accordion__item::details-content {
    block-size: 0;
    overflow: clip;
    transition:
      block-size ${V('motion-duration-state')} ${V('motion-easing-standard')},
      content-visibility ${V('motion-duration-state')} allow-discrete;
  }
  .ucam-site-accordion__item[open]::details-content { block-size: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .ucam-site-accordion__icon { transition: none; }
  .ucam-site-accordion__item::details-content { transition: none; }
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
.ucam-site-input__field:hover:not(:disabled):not([aria-invalid="true"]) {
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
  margin: 0;
  color: ${V('color-text-muted')};
  font-size: ${V('typography-caption-font-size')};
  line-height: ${V('typography-caption-line-height')};
}
.ucam-site-input__erro {
  margin: 0;
  color: ${V('color-feedback-danger-foreground')};
  font-size: ${V('typography-caption-font-size')};
  font-weight: ${V('typography-action-font-weight')};
  line-height: ${V('typography-caption-line-height')};
}
/* SOBRE SEÇÃO ESCURA, em qualquer lugar: a busca de vagas num hero, o campo
 * no rodapé. O campo continua branco; quem troca é o que fica fora dele. O
 * conserto morava só no modificador da newsletter, e um campo solto sobre
 * fundo escuro saía com rótulo a 1,5:1 e erro a 1,44:1. */
.ucam-site-inverso .ucam-site-input__label {
  color: ${V('color-text-on-inverse')};
}
.ucam-site-inverso .ucam-site-input__hint {
  color: ${V('color-text-on-inverse-muted')};
}
.ucam-site-inverso .ucam-site-input__erro {
  color: ${V('color-feedback-danger-on-inverse')};
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
/* A região de status: a confirmação do envio. Fica SEMPRE no documento,
 * porque região que nasce junto com o texto não é anunciada pelo leitor de
 * tela. Vazia, sai do fluxo (não ocupa trilha nem vão da grade) sem deixar
 * de existir: display none a calaria. */
.ucam-site-newsletter__status {
  margin: 0;
  color: ${V('color-text-primary')};
  font-weight: ${V('typography-action-font-weight')};
}
.ucam-site-newsletter__status:empty {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.ucam-site-newsletter--inverse .ucam-site-newsletter__status {
  color: ${V('color-text-on-inverse')};
}
.ucam-site-newsletter--inverse .ucam-site-newsletter__titulo,
.ucam-site-newsletter--inverse .ucam-site-input__label {
  color: ${V('color-text-on-inverse')};
}
.ucam-site-newsletter--inverse .ucam-site-newsletter__nota,
.ucam-site-newsletter--inverse .ucam-site-input__hint {
  color: ${V('color-text-on-inverse-muted')};
}
.ucam-site-newsletter--inverse .ucam-site-input__erro {
  color: ${V('color-feedback-danger-on-inverse')};
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
  /* O primeiro valor é a reserva: onde a sintaxe de texto alternativo não é
   * entendida, a declaração inteira cairia e a trilha ficaria sem separador. */
  content: "/";
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
  white-space: nowrap;
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
/* A ação secundária só cabe na janela larga: com cinco itens, a primária e a
 * secundária, a faixa passava de 1024px. */
.ucam-site-header__actions .ucam-site-btn--secondary {
  display: none;
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
  /* Teto e rolagem: num telefone deitado o painel passava da janela e, com o
   * cabeçalho grudado no topo, os últimos links ficavam inalcançáveis. */
  max-block-size: calc(100dvh - ${V('size-header')});
  overflow-y: auto;
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
${acima('desktop-largo')} {
  .ucam-site-header__actions .ucam-site-btn--secondary { display: inline-flex; }
}

/* --------------------------------------------------------- site-footer --- */
/* Contrato: sites/spec/components/site-footer.json. Superfície inversa: uma
 * coluna no telefone, duas a partir de duas colunas, e na grade completa a
 * marca mais uma trilha por coluna que houver — três ou quatro de links e a de
 * contato. Cinco trilhas fixas derrubavam o contato para uma segunda fileira
 * quando havia quatro colunas de links. */
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
  .ucam-site-footer__grid { grid-template-columns: 1.4fr; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
}

/* ---------------------------------------------------------------- hero --- */
/* Contrato: sites/spec/components/hero.json. O topo da home, na superfície
 * inversa. TEXTO NUNCA ASSENTA SOBRE FOTO: a imagem e o véu nascem escondidos
 * e só entram na grade completa, na metade final; o texto fica na inicial.
 * Sobre foto o contraste dependeria de qual foto, e nenhum portão o mede. */
.ucam-site-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: ${V('color-surface-inverse')};
  color: ${V('color-text-on-inverse')};
}
/* Hero, hero de página e CTA são superfície inversa sem levar .ucam-site-inverso:
 * o anel de foco troca aqui, como no rodapé. O cinza dava 2,20:1 sobre o escuro. */
.ucam-site-hero :focus-visible,
.ucam-site-page-hero :focus-visible,
.ucam-site-cta :focus-visible {
  outline-color: ${V('color-border-focus-on-inverse')};
}
.ucam-site-hero__media {
  display: none;
  position: absolute;
  inset-block: 0;
  inset-inline: 50% 0;
  z-index: -2;
  inline-size: 50%;
  block-size: 100%;
  object-fit: cover;
}
.ucam-site-hero__scrim {
  display: none;
  position: absolute;
  inset-block: 0;
  inset-inline: 50% 0;
  z-index: -1;
  background: linear-gradient(to right, ${V('color-surface-inverse')} 0%, transparent 60%);
  pointer-events: none;
}
.ucam-site-hero__inner {
  inline-size: 100%;
  max-inline-size: ${V('container-faixa')};
  margin-inline: auto;
  padding: ${V('space-section-sm')} ${V('space-gutter-sm')};
}
.ucam-site-hero__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-inline-size: 0;
  gap: ${V('space-stack-md')};
  justify-items: start;
  max-inline-size: ${V('container-prosa')};
}
.ucam-site-hero__eyebrow {
  margin: 0;
  color: ${V('color-text-on-inverse-muted')};
  font-size: ${V('typography-eyebrow-font-size')};
  font-weight: ${V('typography-eyebrow-font-weight')};
  line-height: ${V('typography-eyebrow-line-height')};
  letter-spacing: ${V('typography-eyebrow-letter-spacing')};
  text-transform: uppercase;
}
.ucam-site-hero__title {
  margin: 0;
  font-family: ${V('typography-display-hero-font-family')};
  font-size: ${V('typography-display-hero-font-size')};
  font-weight: ${V('typography-display-hero-font-weight')};
  line-height: ${V('typography-display-hero-line-height')};
  letter-spacing: ${V('typography-display-hero-letter-spacing')};
  max-inline-size: 100%;
  overflow-wrap: break-word;
  text-wrap: balance;
}
.ucam-site-hero__lede {
  margin: 0;
  color: ${V('color-text-on-inverse-muted')};
  font-size: ${V('typography-lede-font-size')};
  line-height: ${V('typography-lede-line-height')};
  text-wrap: pretty;
}
.ucam-site-hero__pills {
  display: flex;
  flex-wrap: wrap;
  gap: ${V('space-inline-sm')};
  margin: 0;
  padding: 0;
  list-style: none;
}
.ucam-site-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: ${V('space-inline-md')};
}
${acima('grade-completa')} {
  .ucam-site-hero--com-foto .ucam-site-hero__media { display: block; }
  .ucam-site-hero--com-foto .ucam-site-hero__scrim { display: block; }
  .ucam-site-hero__inner { display: flex; align-items: center; min-block-size: ${V('size-hero')}; padding: ${V('space-section')} ${V('space-gutter')}; }
  .ucam-site-hero--com-foto .ucam-site-hero__content { max-inline-size: 50%; padding-inline-end: ${V('space-stack-lg')}; }
}

/* ------------------------------------------------- editorial-page-hero --- */
/* Contrato: sites/spec/components/editorial-page-hero.json. O topo das
 * páginas internas: trilha, palavra, título, frase e, se houver, pílulas e
 * ações. Sem foto, salvo a variante --sobre-foto, a única exceção à regra de
 * foto dos Sites: a foto cobre a peça, o véu fica entre ela e o texto, e a
 * opacidade do véu é a da conta do build (pior caso: véu sobre branco puro). */
.ucam-site-page-hero {
  background: ${V('color-surface-inverse')};
  color: ${V('color-text-on-inverse')};
}
.ucam-site-page-hero__inner {
  display: grid;
  gap: ${V('space-stack-md')};
  justify-items: start;
  inline-size: 100%;
  max-inline-size: ${V('container-faixa')};
  margin-inline: auto;
  padding: ${V('space-section-sm')} ${V('space-gutter-sm')};
}
.ucam-site-page-hero--prosa .ucam-site-page-hero__inner {
  max-inline-size: ${V('container-prosa')};
}
.ucam-site-page-hero__eyebrow {
  margin: 0;
  color: ${V('color-text-on-inverse-muted')};
  font-size: ${V('typography-eyebrow-font-size')};
  font-weight: ${V('typography-eyebrow-font-weight')};
  line-height: ${V('typography-eyebrow-line-height')};
  letter-spacing: ${V('typography-eyebrow-letter-spacing')};
  text-transform: uppercase;
}
.ucam-site-page-hero__title {
  max-inline-size: ${V('container-prosa')};
  margin: 0;
  font-family: ${V('typography-display-page-font-family')};
  font-size: ${V('typography-display-page-font-size')};
  font-weight: ${V('typography-display-page-font-weight')};
  line-height: ${V('typography-display-page-line-height')};
  letter-spacing: ${V('typography-display-page-letter-spacing')};
  text-wrap: balance;
}
.ucam-site-page-hero__lede {
  max-inline-size: ${V('container-prosa')};
  margin: 0;
  color: ${V('color-text-on-inverse-muted')};
  font-size: ${V('typography-lede-font-size')};
  line-height: ${V('typography-lede-line-height')};
  text-wrap: pretty;
}
.ucam-site-page-hero__pills {
  display: flex;
  flex-wrap: wrap;
  gap: ${V('space-inline-sm')};
  margin: 0;
  padding: 0;
  list-style: none;
}
.ucam-site-page-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: ${V('space-inline-md')};
}
.ucam-site-page-hero--sobre-foto {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}
.ucam-site-page-hero__media,
.ucam-site-page-hero__scrim {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
}
.ucam-site-page-hero__media {
  z-index: -2;
  object-fit: cover;
}
/* Abaixo da grade completa o texto ocupa a largura toda, e o véu é uniforme. */
.ucam-site-page-hero__scrim {
  z-index: -1;
  background: ${V('color-surface-photo-scrim')};
  opacity: ${V('opacity-photo-scrim')};
}
/* A conta do véu é feita com a tinta on-inverse, a única que passa no pior
 * caso: a apagada (on-inverse-muted) dava 4,29:1 na base e 3,36:1 na CENPRE
 * sobre foto branca (revisão de 14/10/2026). Sobre foto, palavra, frase e
 * trilha usam a cheia; a pílula troca o fundo translúcido, que clareia sobre
 * a foto, pelo da cor do véu, opaco, e pode quebrar linha para não sair da
 * metade do texto. */
.ucam-site-page-hero--sobre-foto .ucam-site-page-hero__eyebrow,
.ucam-site-page-hero--sobre-foto .ucam-site-page-hero__lede,
.ucam-site-page-hero--sobre-foto .ucam-site-breadcrumb--inverse,
.ucam-site-page-hero--sobre-foto .ucam-site-breadcrumb--inverse .ucam-site-breadcrumb__item a {
  color: ${V('color-text-on-inverse')};
}
.ucam-site-page-hero--sobre-foto .ucam-site-hero-pill {
  background: ${V('color-surface-photo-scrim')};
  white-space: normal;
}
${acima('grade-completa')} {
  .ucam-site-page-hero__inner { padding: ${V('space-section')} ${V('space-gutter')}; }
  .ucam-site-page-hero--sobre-foto { display: flex; align-items: center; min-block-size: ${V('size-hero')}; }
  /* O véu é sólido até 55% da largura e some depois, para a foto aparecer.
   * Cada filho do conteúdo mede até metade da caixa de conteúdo, o que faz o
   * texto terminar, em qualquer largura, na metade da peça: dentro do sólido. */
  .ucam-site-page-hero__scrim { mask-image: linear-gradient(to right, black 0 55%, transparent 100%); }
  .ucam-site-page-hero--sobre-foto .ucam-site-page-hero__inner > * { max-inline-size: 50%; }
}

/* ----------------------------------------------------------- hero-pill --- */
/* Contrato: sites/spec/components/hero-pill.json. Um fato curto sobre a
 * seção escura: 1.700 empresas, desde 2001. Não é clicável. */
.ucam-site-hero-pill {
  display: inline-flex;
  align-items: center;
  gap: ${V('space-inline-sm')};
  min-block-size: ${V('size-icon-button')};
  padding-inline: ${V('space-stack-sm')};
  border: 1px solid ${V('color-border-on-inverse')};
  border-radius: ${V('radius-pill')};
  background: ${V('color-interaction-hover-on-inverse')};
  color: ${V('color-text-on-inverse')};
  font-size: ${V('typography-caption-font-size')};
  font-weight: ${V('typography-action-font-weight')};
  line-height: ${V('typography-caption-line-height')};
  white-space: nowrap;
}
.ucam-site-hero-pill .ic {
  inline-size: ${V('size-icon-sm')};
  block-size: ${V('size-icon-sm')};
}

/* ------------------------------------------------------- editorial-cta --- */
/* Contrato: sites/spec/components/editorial-cta.json. A chamada que fecha a
 * página. Com foto, a mesma regra do hero: a imagem entra só na grade
 * completa e na metade que não tem texto. */
.ucam-site-cta {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: ${V('space-block')} ${V('space-inset-card')};
  border-radius: ${V('radius-card')};
  background: ${V('color-surface-inverse')};
  color: ${V('color-text-on-inverse')};
}
.ucam-site-cta__media {
  display: none;
  position: absolute;
  inset-block: 0;
  inset-inline: 50% 0;
  z-index: -2;
  inline-size: 50%;
  block-size: 100%;
  object-fit: cover;
}
.ucam-site-cta__scrim {
  display: none;
  position: absolute;
  inset-block: 0;
  inset-inline: 50% 0;
  z-index: -1;
  background: linear-gradient(to right, ${V('color-surface-inverse')} 0%, transparent 60%);
  pointer-events: none;
}
.ucam-site-cta__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-inline-size: 0;
  gap: ${V('space-stack-sm')};
  justify-items: start;
  max-inline-size: ${V('container-prosa')};
}
.ucam-site-cta__eyebrow {
  margin: 0;
  color: ${V('color-text-on-inverse-muted')};
  font-size: ${V('typography-eyebrow-font-size')};
  font-weight: ${V('typography-eyebrow-font-weight')};
  line-height: ${V('typography-eyebrow-line-height')};
  letter-spacing: ${V('typography-eyebrow-letter-spacing')};
  text-transform: uppercase;
}
.ucam-site-cta__title {
  margin: 0;
  font-family: ${V('typography-display-section-sm-font-family')};
  font-size: ${V('typography-display-section-sm-font-size')};
  font-weight: ${V('typography-display-section-sm-font-weight')};
  line-height: ${V('typography-display-section-sm-line-height')};
  letter-spacing: ${V('typography-display-section-sm-letter-spacing')};
  max-inline-size: 100%;
  overflow-wrap: break-word;
  text-wrap: balance;
}
.ucam-site-cta__text {
  margin: 0;
  color: ${V('color-text-on-inverse-muted')};
  font-size: ${V('typography-lede-font-size')};
  line-height: ${V('typography-lede-line-height')};
}
.ucam-site-cta__actions {
  display: flex;
  flex-wrap: wrap;
  gap: ${V('space-inline-md')};
  margin-block-start: ${V('space-inline-sm')};
}
${acima('grade-completa')} {
  .ucam-site-cta { padding: ${V('space-section-sm')}; }
  .ucam-site-cta--com-foto .ucam-site-cta__media { display: block; }
  .ucam-site-cta--com-foto .ucam-site-cta__scrim { display: block; }
  .ucam-site-cta--com-foto .ucam-site-cta__content { max-inline-size: 50%; padding-inline-end: ${V('space-stack-lg')}; }
}

/* ---------------------------------------------------------- stats-band --- */
/* Contrato: sites/spec/components/stats-band.json. Uma lista de definição: o
 * rótulo vem antes no documento e o número aparece em cima; a frase, se houver,
 * fica por último nos dois. Por isso a coluna é a direta, com o número puxado
 * para o começo pela ordem: a coluna invertida poria a frase no topo. Duas colunas no
 * telefone; na grade completa, uma coluna por número — com quatro trilhas
 * fixas, três números deixavam um quarto da faixa vazio. */
.ucam-site-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${V('space-stack-lg')} ${V('space-stack-md')};
  margin: 0;
}
.ucam-site-stats__item {
  display: flex;
  flex-direction: column;
  gap: ${V('space-inline-xs')};
  padding-block-start: ${V('space-stack-sm')};
  border-block-start: 1px solid ${V('color-border-default')};
}
.ucam-site-stats__value {
  order: -1;
  margin: 0;
  color: ${V('color-text-primary')};
  font-family: ${V('typography-display-section-sm-font-family')};
  font-size: ${V('typography-display-section-sm-font-size')};
  font-weight: ${V('typography-display-section-sm-font-weight')};
  line-height: ${V('typography-display-section-sm-line-height')};
  letter-spacing: ${V('typography-display-section-sm-letter-spacing')};
}
.ucam-site-stats__label {
  color: ${V('color-text-secondary')};
}
.ucam-site-stats__text {
  margin: ${V('space-inline-xs')} 0 0;
  color: ${V('color-text-body')};
  font-size: ${V('typography-body-font-size')};
  line-height: ${V('typography-body-line-height')};
  text-wrap: pretty;
}
.ucam-site-stats--inverse .ucam-site-stats__item {
  border-block-start-color: ${V('color-border-on-inverse')};
}
.ucam-site-stats--inverse .ucam-site-stats__value {
  color: ${V('color-text-on-inverse')};
}
.ucam-site-stats--inverse .ucam-site-stats__label,
.ucam-site-stats--inverse .ucam-site-stats__text {
  color: ${V('color-text-on-inverse-muted')};
}
${acima('grade-completa')} {
  .ucam-site-stats { grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
}

/* ---------------------------------------------------------- fact-sheet --- */
/* Contrato: sites/spec/components/fact-sheet.json. A ficha: uma lista de
 * definição, uma linha por dado, separadas por fio. A chave fica na tinta de
 * apoio e o valor na de título; a partir de duas-colunas, lado a lado. Com
 * --duas-colunas as linhas se arrumam em duas colunas, descendo pela primeira:
 * a ordem do documento é a de leitura. */
.ucam-site-fact-sheet {
  display: grid;
  margin: 0;
  border-block-end: 1px solid ${V('color-border-subtle')};
}
.ucam-site-fact-sheet__row {
  display: grid;
  gap: ${V('space-inline-xs')};
  padding-block: ${V('space-stack-xs')};
  border-block-start: 1px solid ${V('color-border-subtle')};
}
.ucam-site-fact-sheet__term {
  color: ${V('color-text-secondary')};
}
.ucam-site-fact-sheet__value {
  margin: 0;
  color: ${V('color-text-primary')};
  overflow-wrap: anywhere;
}
${acima('duas-colunas')} {
  .ucam-site-fact-sheet__row { grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: ${V('space-inline-md')}; }
  .ucam-site-fact-sheet--duas-colunas { display: block; columns: 2; column-gap: ${V('space-stack-lg')}; }
  .ucam-site-fact-sheet--duas-colunas .ucam-site-fact-sheet__row { grid-template-columns: none; gap: ${V('space-inline-xs')}; break-inside: avoid; }
}

/* -------------------------------------------------------- section-tabs --- */
/* Contrato: sites/spec/components/section-tabs.json. A fileira de abas de
 * uma página longa. Quando as abas não cabem, a NAV rola de lado (e é nela que
 * a lib centra a atual, por isso é ela o contexto de posição). A atual se
 * marca por fio de 2px e peso, nunca por fundo; o anel de foco fica para
 * dentro, porque a rolagem recorta o que passa da borda. */
.ucam-site-section-tabs {
  position: relative;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  border-block-end: 1px solid ${V('color-border-default')};
}
.ucam-site-section-tabs__list {
  display: flex;
  gap: ${V('space-inline-md')};
  inline-size: max-content;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ucam-site-section-tabs__item {
  flex: none;
  scroll-snap-align: start;
}
.ucam-site-section-tabs__tab {
  display: flex;
  align-items: center;
  min-block-size: ${V('size-touch-min')};
  padding-inline: ${V('space-inline-xs')};
  border-block-end: 2px solid transparent;
  color: ${V('color-text-secondary')};
  text-decoration: none;
  white-space: nowrap;
  transition: color ${V('motion-duration-state')} ${V('motion-easing-standard')};
}
.ucam-site-section-tabs__tab:hover {
  color: ${V('color-text-primary')};
}
.ucam-site-section-tabs__tab[aria-current="location"] {
  border-block-end-color: ${V('color-action-primary-default')};
  color: ${V('color-text-primary')};
  font-weight: ${V('typography-action-font-weight')};
}
.ucam-site-section-tabs__tab:focus-visible {
  outline-offset: calc(-1 * ${V('focus-ring-width')});
}

/* ------------------------------------------------------------ timeline --- */
/* Contrato: sites/spec/components/timeline.json. Uma lista ordenada de
 * marcos presos a um fio vertical. O fio é a borda inicial da lista e o ponto
 * de cada marco é um ::before centrado nele, na altura da linha do ano: os
 * dois são decoração, a ordem já é da lista. */
.ucam-site-timeline {
  display: grid;
  gap: ${V('space-stack-md')};
  margin: 0 0 0 ${V('space-inline-xs')};
  padding: 0 0 0 ${V('space-stack-md')};
  border-inline-start: 1px solid ${V('color-border-default')};
  list-style: none;
}
.ucam-site-timeline__item {
  position: relative;
  display: grid;
  gap: ${V('space-inline-xs')};
}
.ucam-site-timeline__item::before {
  content: "";
  position: absolute;
  inset-block-start: calc(0.5lh - ${V('space-inline-xs')});
  inset-inline-start: calc(-1 * (${V('space-stack-md')} + ${V('space-inline-xs')}) - 0.5px);
  inline-size: ${V('space-inline-sm')};
  block-size: ${V('space-inline-sm')};
  border-radius: ${V('radius-pill')};
  background: ${V('color-surface-brand')};
}
.ucam-site-timeline__year {
  color: ${V('color-text-secondary')};
  font-weight: ${V('typography-title-font-weight')};
  font-variant-numeric: tabular-nums;
}
.ucam-site-timeline__title {
  margin: 0;
  color: ${V('color-text-primary')};
  font-weight: ${V('typography-title-font-weight')};
}
.ucam-site-timeline__text {
  margin: 0;
  color: ${V('color-text-body')};
  text-wrap: pretty;
}

/* -------------------------------------------------------- contact-card --- */
/* Contrato: sites/spec/components/contact-card.json. O contato de uma
 * unidade: título e um address com uma linha por dado, cada uma com o ícone
 * dela. Filete e fundo de cartão, sem sombra: o cartão não é clicável, os
 * links são o telefone e o e-mail. O ícone fica no degrau pequeno e centrado
 * na primeira linha do texto. */
.ucam-site-contact-card {
  display: grid;
  gap: ${V('space-stack-sm')};
  align-content: start;
  padding: ${V('space-inset-card')};
  border: 1px solid ${V('color-border-default')};
  border-radius: ${V('radius-card')};
  background: ${V('color-surface-default')};
}
.ucam-site-contact-card__title {
  margin: 0;
  color: ${V('color-text-primary')};
  font-size: ${V('typography-title-font-size')};
  font-weight: ${V('typography-title-font-weight')};
  line-height: ${V('typography-title-line-height')};
}
.ucam-site-contact-card__lines {
  display: grid;
  gap: ${V('space-inline-sm')};
  font-style: normal;
}
.ucam-site-contact-card__line {
  display: flex;
  gap: ${V('space-inline-sm')};
  align-items: flex-start;
  margin: 0;
  color: ${V('color-text-body')};
  overflow-wrap: anywhere;
}
.ucam-site-contact-card__line .ic {
  inline-size: ${V('size-icon-sm')};
  block-size: ${V('size-icon-sm')};
  margin-block-start: calc((1lh - ${V('size-icon-sm')}) / 2);
  color: ${V('color-text-secondary')};
}
.ucam-site-contact-card__line a {
  color: ${V('color-text-link')};
  text-decoration-line: underline;
  text-underline-offset: 0.2em;
}
.ucam-site-contact-card__line a:hover {
  color: ${V('color-text-link-hover')};
}

/* -------------------------------------------------------- logo-marquee --- */
/* Contrato: sites/spec/components/logo-marquee.json. Os logos desfilam em
 * laço: a trilha tem duas cópias do grupo e anda metade da própria largura.
 * Movimento que não para sozinho precisa de parada: para sob o ponteiro e sob
 * foco, e com movimento reduzido não anima — os logos assentam em linhas e a
 * segunda cópia some. Ponteiro e foco não bastam: logo sem link não recebe
 * foco e no toque não há ponteiro. A parada de verdade é a caixa "Pausar",
 * irmã da janela, que funciona sem script. */
.ucam-site-marquee {
  display: block;
}
.ucam-site-marquee__pausa {
  inline-size: ${V('size-icon-sm')};
  block-size: ${V('size-icon-sm')};
  margin: 0;
  margin-inline-end: ${V('space-inline-xs')};
  accent-color: ${V('color-action-primary-default')};
  vertical-align: middle;
}
.ucam-site-marquee__pausa-rotulo {
  display: inline-flex;
  align-items: center;
  min-block-size: ${V('size-icon-button')};
  color: ${V('color-text-secondary')};
  font-size: ${V('typography-caption-font-size')};
  line-height: ${V('typography-caption-line-height')};
  vertical-align: middle;
  cursor: pointer;
}
.ucam-site-marquee__pausa:checked ~ .ucam-site-marquee__viewport .ucam-site-marquee__track {
  animation-play-state: paused;
}
/* A janela é o contêiner: cada grupo tem no mínimo a largura dela. Com poucos
 * logos o grupo ficava mais estreito que a janela e o fim de cada volta
 * mostrava um vazio. */
.ucam-site-marquee__viewport {
  overflow: hidden;
  container-type: inline-size;
}
.ucam-site-marquee__track {
  display: flex;
  align-items: center;
  inline-size: max-content;
  animation: ucam-site-desfile ${V('motion-duration-desfile')} linear infinite;
}
.ucam-site-marquee__track:hover,
.ucam-site-marquee__track:focus-within {
  animation-play-state: paused;
}
.ucam-site-marquee__group {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-around;
  min-inline-size: 100cqi;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ucam-site-marquee__item {
  display: flex;
  flex: none;
  align-items: center;
  padding-inline-end: ${V('space-block')};
}
.ucam-site-marquee__item img {
  inline-size: auto;
  block-size: ${V('size-logo-parceiro')};
  object-fit: contain;
  filter: grayscale(0.65);
  opacity: 0.9;
  transition:
    filter ${V('motion-duration-state')} ${V('motion-easing-standard')},
    opacity ${V('motion-duration-state')} ${V('motion-easing-standard')};
}
.ucam-site-marquee__item:hover img,
.ucam-site-marquee__item:focus-within img {
  filter: none;
  opacity: 1;
}
.ucam-site-marquee--parado .ucam-site-marquee__track {
  flex-wrap: wrap;
  justify-content: center;
  row-gap: ${V('space-stack-md')};
  inline-size: auto;
  animation: none;
}
.ucam-site-marquee--parado .ucam-site-marquee__group {
  flex-wrap: wrap;
  justify-content: center;
  row-gap: ${V('space-stack-md')};
  min-inline-size: 0;
}
.ucam-site-marquee--parado .ucam-site-marquee__pausa,
.ucam-site-marquee--parado .ucam-site-marquee__pausa-rotulo {
  display: none;
}
.ucam-site-marquee--parado .ucam-site-marquee__group + .ucam-site-marquee__group {
  display: none;
}
@keyframes ucam-site-desfile {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .ucam-site-marquee__track { flex-wrap: wrap; justify-content: center; row-gap: ${V('space-stack-md')}; inline-size: auto; animation: none; }
  .ucam-site-marquee__group { flex-wrap: wrap; justify-content: center; row-gap: ${V('space-stack-md')}; min-inline-size: 0; }
  .ucam-site-marquee__group + .ucam-site-marquee__group { display: none; }
  .ucam-site-marquee__pausa, .ucam-site-marquee__pausa-rotulo { display: none; }
}

/* ------------------------------------------------ card e course-card --- */
/* Contratos: sites/spec/components/card.json e course-card.json. A mesma
 * caixa para os dois: o que muda é o que vai dentro. O cartão inteiro é
 * clicável por UM link — o do título, esticado por ::after —, nunca por um
 * link em volta de tudo; o foco do link se desenha no cartão. */
.ucam-site-card,
.ucam-site-course-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid ${V('color-border-default')};
  border-radius: ${V('radius-card')};
  background: ${V('color-surface-default')};
  box-shadow: ${V('elevation-card')};
}
.ucam-site-card__media,
.ucam-site-course-card__media {
  display: block;
  inline-size: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: ${V('color-surface-sunken')};
}
.ucam-site-card__body,
.ucam-site-course-card__body {
  display: grid;
  flex: 1;
  gap: ${V('space-inline-sm')};
  align-content: start;
  padding: ${V('space-inset-card')};
}
.ucam-site-card__title,
.ucam-site-course-card__title {
  margin: 0;
  color: ${V('color-text-primary')};
  font-size: ${V('typography-title-font-size')};
  font-weight: ${V('typography-title-font-weight')};
  line-height: ${V('typography-title-line-height')};
}
.ucam-site-card__text {
  margin: 0;
  color: ${V('color-text-body')};
}
.ucam-site-card__meta,
.ucam-site-course-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: ${V('space-inline-sm')};
  margin: 0;
  padding: 0;
  list-style: none;
}
.ucam-site-course-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: ${V('space-inline-xs')} ${V('space-stack-sm')};
  margin: 0;
  padding: 0;
  color: ${V('color-text-secondary')};
  font-size: ${V('typography-caption-font-size')};
  line-height: ${V('typography-caption-line-height')};
  list-style: none;
}
.ucam-site-card__link,
.ucam-site-course-card__link {
  color: inherit;
  text-decoration: none;
}
.ucam-site-card__link::after,
.ucam-site-course-card__link::after {
  content: "";
  position: absolute;
  inset: 0;
}
.ucam-site-card__link:focus-visible,
.ucam-site-course-card__link:focus-visible {
  outline: none;
}
/* O anel de reserva é do próprio link esticado, por dentro da borda (o cartão
 * recorta o que sai). Onde há :has(), o anel passa para o cartão, por fora.
 * Sem a reserva, navegador sem :has() ficava sem indicador de foco nenhum. */
.ucam-site-card__link:focus-visible::after,
.ucam-site-course-card__link:focus-visible::after {
  border-radius: ${V('radius-card')};
  outline: ${V('focus-ring-width')} solid ${V('color-border-focus')};
  outline-offset: calc(-1 * ${V('focus-ring-width')});
}
@supports selector(:has(*)) {
  .ucam-site-card__link:focus-visible::after,
  .ucam-site-course-card__link:focus-visible::after {
    outline: none;
  }
  .ucam-site-card:has(.ucam-site-card__link:focus-visible),
  .ucam-site-course-card:has(.ucam-site-course-card__link:focus-visible) {
    outline: ${V('focus-ring-width')} solid ${V('color-border-focus')};
    outline-offset: ${V('focus-ring-offset')};
  }
}
.ucam-site-card--interativo,
.ucam-site-course-card {
  transition:
    border-color ${V('motion-duration-state')} ${V('motion-easing-standard')},
    box-shadow ${V('motion-duration-state')} ${V('motion-easing-standard')},
    transform ${V('motion-duration-state')} ${V('motion-easing-standard')};
}
.ucam-site-card--interativo:hover,
.ucam-site-course-card:hover {
  border-color: ${V('color-border-strong')};
  box-shadow: ${V('elevation-card-hover')};
  transform: translateY(-2px);
}
@media (prefers-reduced-motion: reduce) {
  .ucam-site-card--interativo:hover { transform: none; }
  .ucam-site-course-card:hover { transform: none; }
}
/* O cartão de destaque: a informação que a página quer que se veja primeiro,
 * como a próxima turma. Lavagem e filete da marca, sem sombra a mais. Só sem
 * link: um cartão clicável tinto competiria com o botão primário. Os pares de
 * texto sobre a lavagem são medidos no build, nas duas marcas. */
.ucam-site-card--destaque {
  border-color: ${V('color-surface-brand')};
  background: ${V('color-surface-brand-soft')};
}
/* A tag de marca tem a mesma lavagem por fundo: no destaque ela sumiria. */
.ucam-site-card--destaque .ucam-site-tag--brand {
  background: ${V('color-surface-default')};
}

/* ------------------------------------------------------------ doc-card --- */
/* Contrato: sites/spec/components/doc-card.json. A lista de documentos de um
 * caso: o que levar para formalizar o estágio. O fio de marca no alto diz que
 * é um cartão de consulta, não de conteúdo. */
.ucam-site-doc-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid ${V('color-border-default')};
  border-block-start: ${V('space-inline-xs')} solid ${V('color-surface-brand')};
  border-radius: ${V('radius-card')};
  background: ${V('color-surface-default')};
  box-shadow: ${V('elevation-card')};
}
.ucam-site-doc-card__header {
  display: flex;
  align-items: center;
  gap: ${V('space-inline-sm')};
  padding: ${V('space-inset-card')} ${V('space-inset-card')} ${V('space-stack-sm')};
  border-block-end: 1px solid ${V('color-border-subtle')};
}
.ucam-site-doc-card__label {
  margin: 0;
  color: ${V('color-text-primary')};
  font-size: ${V('typography-body-lg-font-size')};
  font-weight: ${V('typography-action-font-weight')};
  line-height: ${V('typography-title-line-height')};
}
.ucam-site-doc-card__list {
  display: grid;
  gap: ${V('space-inline-sm')};
  margin: 0;
  padding: ${V('space-stack-sm')} ${V('space-inset-card')} ${V('space-inset-card')};
  list-style: none;
}
.ucam-site-doc-card__item {
  display: flex;
  align-items: flex-start;
  gap: ${V('space-inline-sm')};
  color: ${V('color-text-body')};
}
.ucam-site-doc-card__item .ic {
  inline-size: ${V('size-icon-sm')};
  block-size: ${V('size-icon-sm')};
  margin-block-start: 0.25em;
  color: ${V('color-action-primary-default')};
}

/* ----------------------------------------------------------- step-card --- */
/* Contrato: sites/spec/components/step-card.json. Um passo de uma sequência:
 * o número, o que fazer e, se houver, para onde ir. A lista tem classe
 * própria: sem ela, quem copiava o exemplo recebia os cartões recuados e
 * colados. */
.ucam-site-steps {
  display: grid;
  gap: ${V('space-stack-sm')};
  margin: 0;
  padding: 0;
  list-style: none;
}
.ucam-site-step-card {
  display: flex;
  align-items: flex-start;
  gap: ${V('space-stack-sm')};
  padding: ${V('space-inset-card')};
  border: 1px solid ${V('color-border-default')};
  border-radius: ${V('radius-card')};
  background: ${V('color-surface-default')};
  box-shadow: ${V('elevation-card')};
}
.ucam-site-step-card__number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  inline-size: ${V('size-icon-chip-md')};
  block-size: ${V('size-icon-chip-md')};
  border-radius: ${V('radius-pill')};
  background: ${V('color-action-primary-default')};
  color: ${V('color-text-on-action')};
  font-size: ${V('typography-body-lg-font-size')};
  font-weight: ${V('typography-action-font-weight')};
  line-height: 1;
}
.ucam-site-step-card__body {
  display: grid;
  gap: ${V('space-inline-xs')};
  min-inline-size: 0;
}
.ucam-site-step-card__title {
  margin: 0;
  color: ${V('color-text-primary')};
  font-size: ${V('typography-body-lg-font-size')};
  font-weight: ${V('typography-action-font-weight')};
  line-height: ${V('typography-title-line-height')};
}
.ucam-site-step-card__text {
  margin: 0;
  color: ${V('color-text-body')};
}
.ucam-site-step-card__link {
  display: inline-flex;
  align-items: center;
  gap: ${V('space-inline-xs')};
  justify-self: start;
  margin-block-start: ${V('space-inline-sm')};
  color: ${V('color-text-link')};
  font-weight: ${V('typography-action-font-weight')};
  text-decoration: none;
}
.ucam-site-step-card__link:hover {
  color: ${V('color-text-link-hover')};
  text-decoration: underline;
}
.ucam-site-step-card__link .ic {
  inline-size: ${V('size-icon-sm')};
  block-size: ${V('size-icon-sm')};
}

/* --------------------------------------------------------- testimonial --- */
/* Contrato: sites/spec/components/testimonial.json. Uma figure: a fala e
 * quem falou. Sem estrelas. */
.ucam-site-testimonial {
  display: grid;
  gap: ${V('space-stack-md')};
  align-content: start;
  margin: 0;
  padding: ${V('space-inset-card')};
  border: 1px solid ${V('color-border-default')};
  border-radius: ${V('radius-card')};
  background: ${V('color-surface-default')};
}
.ucam-site-testimonial__quote {
  margin: 0;
  color: ${V('color-text-primary')};
  font-size: ${V('typography-lede-font-size')};
  line-height: ${V('typography-lede-line-height')};
  text-wrap: pretty;
  quotes: "\\201C" "\\201D";
}
.ucam-site-testimonial__quote::before {
  content: open-quote;
}
.ucam-site-testimonial__quote::after {
  content: close-quote;
}
.ucam-site-testimonial__autor {
  display: flex;
  align-items: center;
  gap: ${V('space-stack-sm')};
}
.ucam-site-testimonial__nome {
  display: block;
  color: ${V('color-text-primary')};
  font-weight: ${V('typography-action-font-weight')};
}
.ucam-site-testimonial__papel {
  display: block;
  color: ${V('color-text-muted')};
  font-size: ${V('typography-caption-font-size')};
  line-height: ${V('typography-caption-line-height')};
}
.ucam-site-testimonial--inverse {
  border-color: ${V('color-border-on-inverse')};
  background: transparent;
}
.ucam-site-testimonial--inverse .ucam-site-testimonial__quote,
.ucam-site-testimonial--inverse .ucam-site-testimonial__nome {
  color: ${V('color-text-on-inverse')};
}
.ucam-site-testimonial--inverse .ucam-site-testimonial__papel {
  color: ${V('color-text-on-inverse-muted')};
}

/* --------------------------------------------------------------- prose --- */
/* Contrato: sites/spec/components/prose.json. O texto corrido de um artigo.
 * É a ÚNICA peça cujo conteúdo não leva classe — o texto vem de um CMS e
 * não tem como levar classe em cada parágrafo —, e só alcança o que está
 * dentro da raiz. A linha não passa da largura de prosa. */
.ucam-site-prose {
  max-inline-size: ${V('container-prosa')};
  color: ${V('color-text-body')};
  font-size: ${V('typography-body-lg-font-size')};
  line-height: ${V('typography-body-lg-line-height')};
}
.ucam-site-prose p,
.ucam-site-prose ul,
.ucam-site-prose ol,
.ucam-site-prose blockquote,
.ucam-site-prose figure {
  margin: 0 0 ${V('space-stack-sm')};
}
.ucam-site-prose h2 {
  margin: ${V('space-block')} 0 ${V('space-stack-sm')};
  color: ${V('color-text-primary')};
  font-family: ${V('typography-subtitle-font-family')};
  font-size: ${V('typography-subtitle-font-size')};
  font-weight: ${V('typography-subtitle-font-weight')};
  line-height: ${V('typography-subtitle-line-height')};
  letter-spacing: ${V('typography-subtitle-letter-spacing')};
  text-wrap: balance;
}
.ucam-site-prose h3 {
  margin: ${V('space-stack-lg')} 0 ${V('space-inline-sm')};
  color: ${V('color-text-primary')};
  font-size: ${V('typography-title-font-size')};
  font-weight: ${V('typography-title-font-weight')};
  line-height: ${V('typography-title-line-height')};
}
.ucam-site-prose a {
  color: ${V('color-text-link')};
  text-decoration: underline;
  text-underline-offset: 0.15em;
}
.ucam-site-prose a:hover {
  color: ${V('color-text-link-hover')};
}
.ucam-site-prose ul,
.ucam-site-prose ol {
  padding-inline-start: ${V('space-stack-md')};
}
.ucam-site-prose li + li {
  margin-block-start: ${V('space-inline-xs')};
}
.ucam-site-prose strong {
  color: ${V('color-text-primary')};
  font-weight: ${V('typography-action-font-weight')};
}
.ucam-site-prose blockquote {
  padding-inline-start: ${V('space-stack-sm')};
  border-inline-start: ${V('space-inline-xs')} solid ${V('color-surface-brand')};
  color: ${V('color-text-primary')};
  font-size: ${V('typography-lede-font-size')};
  line-height: ${V('typography-lede-line-height')};
}
.ucam-site-prose img {
  display: block;
  max-inline-size: 100%;
  block-size: auto;
  border-radius: ${V('radius-card')};
}
.ucam-site-prose figcaption {
  margin-block-start: ${V('space-inline-sm')};
  color: ${V('color-text-muted')};
  font-size: ${V('typography-caption-font-size')};
  line-height: ${V('typography-caption-line-height')};
}
.ucam-site-prose hr {
  margin-block: ${V('space-stack-lg')};
  border: 0;
  border-block-start: 1px solid ${V('color-border-default')};
}
.ucam-site-prose > :first-child {
  margin-block-start: 0;
}
.ucam-site-prose > :last-child {
  margin-block-end: 0;
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
