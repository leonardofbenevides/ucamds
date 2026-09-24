import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import { layouts } from '../../spec/spec';
import type { BlocoLayout } from '../../spec/spec.types';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

/**
 * A camada entre componente e tela.
 *
 * Um componente resolve um controle; um bloco resolve ONDE as coisas ficam.
 * A página existe porque, sem ela, a pergunta "como empilho isto" só tinha
 * duas respostas: copiar de outra tela ou escrever um style inline — que foi
 * exatamente como as 7 telas deste repositório estavam escritas.
 *
 * Cada bloco mostra um desenho ao vivo, montado com o @ucam/css real. O
 * desenho usa caixas neutras de propósito: o assunto aqui é o ARRANJO, e
 * preencher com componentes de verdade faria o olho ler os componentes.
 */
@Component({
  selector: 'ucam-layout',
  imports: [PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Layout"
      [titulo]="'Blocos de layout'"
      [lede]="lede"
      [porque]="porque"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <!-- É um callout, e agora usa o callout do site. A classe .nota desenhava
         o mesmo bloco com outro dialeto — barra cinza de 2px, canto reto de um
         lado — e ficava como o único aviso do site fora da linguagem comum. O
         que sobra de local é só a medida e o vão. -->
    <section class="callout nota">
      <p class="small">{{ regra }}</p>
    </section>

    <!-- ============================================================ shell -->
    <section class="bloco" id="shell">
      <header class="bloco-cabeca">
        <h2>{{ shell.nome }}</h2>
        <code class="classe">.{{ shell.classe }}</code>
      </header>
      <p class="papel">{{ shell.papel }}</p>
      <p class="small muted">{{ shell.grade }}</p>

      <div class="palco palco-shell">
        <div class="ucam" [innerHTML]="desenhoShell"></div>
      </div>

      <details class="evidencia">
        <summary>Por que existe</summary>
        <p class="small">{{ shell.evidencia }}</p>
      </details>

      <h3>Áreas</h3>
      <dl class="areas">
        @for (a of shell.areas; track a.area) {
          <div class="area">
            <dt>
              <code>.{{ a.classe }}</code>
              @if (a.obrigatorio) {
                <span class="pill pill-stable">obrigatória</span>
              }
            </dt>
            <dd>
              <p class="small">{{ a.descricao }}</p>
              @if (a.partes?.length) {
                <ul class="partes">
                  @for (p of a.partes; track p.classe) {
                    <li class="small">
                      <code>.{{ p.classe }}</code>
                      <span class="muted">{{ p.descricao }}</span>
                    </li>
                  }
                </ul>
              }
            </dd>
          </div>
        }
      </dl>

      <h3>Ajustes</h3>
      <ul class="vars">
        @for (v of shell.variaveis; track v.nome) {
          <li class="small">
            <code>{{ v.nome }}</code>
            <span class="def">{{ v.default }}</span>
            <span class="muted">{{ v.descricao }}</span>
          </li>
        }
      </ul>

      <h3>Acessibilidade</h3>
      <ul class="reqs">
        @for (r of shell.acessibilidade; track r) {
          <li class="small">{{ r }}</li>
        }
      </ul>
    </section>

    <!-- =========================================================== blocos -->
    @for (b of blocos; track b.id) {
      <section class="bloco" [id]="b.id">
        <header class="bloco-cabeca">
          <h2>{{ b.nome }}</h2>
          <code class="classe">.{{ b.classe }}</code>
        </header>
        <p class="papel">{{ b.papel }}</p>
        <p class="small muted">{{ b.quando }}</p>

        <div class="palco">
          <div class="ucam" [innerHTML]="desenho(b)"></div>
        </div>

        @if (b.decisao) {
          <p class="decisao small"><strong>Decisão:</strong> {{ b.decisao }}</p>
        }
        @if (b.substitui) {
          <p class="decisao small"><strong>Substitui:</strong> {{ b.substitui }}</p>
        }

        @if (b.variantes?.length) {
          <h3>Variantes</h3>
          <ul class="vars">
            @for (v of b.variantes; track v.classe) {
              <li class="small">
                <code>.{{ v.classe }}</code>
                <span class="muted">{{ v.quando }}</span>
                @if (v.nota) {
                  <em class="nota-variante">{{ v.nota }}</em>
                }
              </li>
            }
          </ul>
        }

        @if (b.partes?.length) {
          <h3>Partes</h3>
          <ul class="vars">
            @for (p of b.partes; track p.classe) {
              <li class="small">
                <code>.{{ p.classe }}</code>
                <span class="muted">{{ p.descricao }}</span>
              </li>
            }
          </ul>
        }

        @if (b.variaveis?.length) {
          <h3>Ajustes</h3>
          <ul class="vars">
            @for (v of b.variaveis; track v.nome) {
              <li class="small">
                <code>{{ v.nome }}</code>
                <span class="def">{{ v.default }}</span>
                <span class="muted">{{ v.descricao }}</span>
              </li>
            }
          </ul>
        }

        <h3>Uso</h3>
        <pre class="codigo"><code>{{ b.exemplo }}</code></pre>
      </section>
    }

    <!-- =================================================== boas práticas -->
    <section class="bloco" id="praticas">
      <h2>Faça e evite</h2>
      <div class="praticas">
        @for (p of praticas; track p.faca) {
          <div class="pratica">
            <div class="faca">
              <span class="rotulo">Faça</span>
              <p class="small">{{ p.faca }}</p>
            </div>
            <div class="evite">
              <span class="rotulo">Evite</span>
              <p class="small">{{ p.evite }}</p>
            </div>
            @if (p.porque) {
              <p class="porque small">{{ p.porque }}</p>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .nota {
      max-inline-size: var(--measure);
      margin-block-end: 3rem;
    }
    .nota p {
      margin: 0;
    }

    .bloco {
      margin-block-end: 4.5rem;
      scroll-margin-block-start: 5rem;
    }
    .bloco-cabeca {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-block-end: 0.5rem;
    }
    .bloco h2 {
      margin: 0;
      font-size: 1.4375rem;
      font-weight: 560;
      letter-spacing: -0.02em;
    }
    .classe {
      font-family: var(--f-mono);
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
    }
    .papel {
      max-inline-size: var(--measure);
      margin: 0 0 0.3rem;
    }
    .bloco > p.small.muted {
      max-inline-size: var(--measure);
      margin: 0 0 1.25rem;
    }
    .bloco h3 {
      margin: 1.75rem 0 0.6rem;
      font-size: 0.9375rem;
      font-weight: 600;
    }

    /* O palco acompanha o catálogo: BRANCO desde 20/09/2026 (ADR-040), com o
       filete fazendo o limite que o cinza fazia. Ele segue dizendo "isto é uma
       amostra, não uma tela". A diferença para o catálogo é que aqui o desenho
       NÃO é reduzido por escala — o assunto é a proporção entre as caixas, e
       reduzir mentiria sobre ela. */
    .palco {
      padding: 1.25rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-lg);
      background-color: var(--ucam-color-surface-canvas);
      overflow-x: auto;
    }
    .palco-shell {
      padding: 0;
    }

    .decisao {
      max-inline-size: var(--measure);
      margin: 1rem 0 0;
    }
    .evidencia {
      max-inline-size: var(--measure);
      margin-block-start: 1rem;
    }
    .evidencia summary {
      cursor: pointer;
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
    }
    .evidencia p {
      margin: 0.6rem 0 0;
    }

    .areas {
      margin: 0;
      display: grid;
      gap: 0.9rem;
    }
    .area {
      padding-block-end: 0.9rem;
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    .area:last-child {
      border-block-end: 0;
    }
    .areas dt {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-block-end: 0.25rem;
    }
    .areas dd {
      margin: 0;
      max-inline-size: var(--measure);
    }
    .areas dd p {
      margin: 0;
    }
    .partes {
      margin: 0.5rem 0 0;
      padding: 0 0 0 0.9rem;
      display: grid;
      gap: 0.3rem;
      border-inline-start: 1px solid var(--ucam-color-border-subtle);
    }

    ul.vars,
    ul.reqs,
    .partes {
      list-style: none;
    }
    ul.vars,
    ul.reqs {
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
      max-inline-size: 62rem;
    }
    ul.vars li,
    .partes li {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.5rem;
    }
    ul.reqs li {
      max-inline-size: var(--measure);
      padding-inline-start: 0.9rem;
      border-inline-start: 2px solid var(--ucam-color-border-subtle);
    }
    code {
      font-family: var(--f-mono);
      font-size: 0.78rem;
    }
    .def {
      font-family: var(--f-mono);
      font-size: 0.72rem;
      padding: 0.05rem 0.35rem;
      border-radius: var(--ucam-radius-sm);
      background: var(--ucam-color-surface-subtle);
      color: var(--ucam-color-text-secondary);
    }
    .nota-variante {
      flex-basis: 100%;
      color: var(--ucam-color-text-secondary);
      font-size: 0.8125rem;
    }

    .codigo {
      margin: 0;
      padding: 0.9rem 1.1rem;
      overflow-x: auto;
      background: var(--ucam-color-surface-subtle);
      border: 1px solid var(--ucam-color-border-subtle);
      /* Mesmo raio do .code global: é o mesmo objeto com outro nome. */
      border-radius: var(--r-superficie);
      font-family: var(--f-mono);
      font-size: 0.78rem;
      line-height: 1.6;
    }

    .praticas {
      display: grid;
      gap: 1rem;
    }
    .pratica {
      display: grid;
      gap: 0 1rem;
      grid-template-columns: 1fr;
      padding: 0.9rem 1.1rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-lg);
    }
    @media (min-width: 52rem) {
      .pratica {
        grid-template-columns: 1fr 1fr;
      }
      .porque {
        grid-column: 1 / -1;
      }
    }
    /* Rótulos são as PALAVRAS Faça/Evite, não ✓/✕: o glifo iria aria-hidden e
       deixaria quem ouve sem saber qual trecho é qual, além de jogar o
       significado só na cor (WCAG 1.4.1). */
    .rotulo {
      display: inline-block;
      margin-block-end: 0.25rem;
      font-family: var(--f-mono);
      /* 0,75rem: a régua de metadado do site, a mesma do .meta da página de
         componente. Estava em 10,4px, abaixo do piso que este próprio site
         cobra das telas que documenta. */
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .faca .rotulo {
      color: var(--ucam-color-feedback-success-foreground);
    }
    .evite .rotulo {
      color: var(--ucam-color-feedback-danger-foreground);
    }
    .pratica p {
      margin: 0 0 0.6rem;
    }
    .porque {
      margin: 0.3rem 0 0;
      padding-block-start: 0.6rem;
      border-block-start: 1px solid var(--ucam-color-border-subtle);
      color: var(--ucam-color-text-secondary);
    }
  `,
})
export default class LayoutPage {
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly shell = layouts.shell;
  protected readonly blocos = layouts.blocos;
  protected readonly praticas = layouts.boas_praticas;

  /**
   * Os ids já existiam no template (o shell e cada bloco); o que faltava era
   * alguém apontar para eles. A lateral do site também passou a apontar —
   * eram oito links para /layout sem âncora, todos caindo no topo, e o
   * @for do menu via oito chaves iguais (NG0955 em toda navegação).
   */
  protected readonly secoes: readonly Ancora[] = [
    { id: 'shell', rotulo: this.shell.nome },
    ...this.blocos.map((b) => ({ id: b.id, rotulo: b.nome })),
    { id: 'praticas', rotulo: 'Faça e evite' },
  ];
  protected readonly regra = layouts._meta.regra;
  protected readonly lede = layouts.$lede;
  protected readonly porque = layouts.$description;

  /**
   * `bypassSecurityTrustHtml` é deliberado, como no catálogo: a origem é este
   * arquivo, não entrada de usuário. Sanitizar apagaria os `style` das caixas
   * do desenho e o arranjo — que é o assunto da página — desapareceria.
   */
  private readonly cache = new Map<string, SafeHtml>();

  protected readonly desenhoShell = this.sanitizer.bypassSecurityTrustHtml(DESENHOS['shell']);

  protected desenho(b: BlocoLayout): SafeHtml {
    if (!this.cache.has(b.id)) {
      this.cache.set(
        b.id,
        this.sanitizer.bypassSecurityTrustHtml(DESENHOS[b.id] ?? DESENHOS['fallback'])
      );
    }
    return this.cache.get(b.id)!;
  }
}

/* --------------------------------------------------------------- desenhos --- */
/* Caixas neutras, não componentes de verdade.
 *
 * Preencher o desenho com botões e tabelas reais faria o olho ler os
 * componentes; o assunto aqui é o arranjo. As caixas usam tokens semânticos
 * como o resto do escopo, então o desenho troca de tema junto com a página. */

const caixa = (rotulo: string, extra = '') =>
  `<div style="display:flex;align-items:center;justify-content:center;min-block-size:3rem;padding:.5rem;` +
  `background:var(--ucam-color-surface-subtle);border:1px dashed var(--ucam-color-border-default);` +
  `border-radius:var(--ucam-radius-md);font-family:var(--ucam-font-mono);font-size:.7rem;` +
  `color:var(--ucam-color-text-secondary);${extra}">${rotulo}</div>`;

const DESENHOS: Record<string, string> = {
  /* O shell aparece em miniatura viva: são as classes REAIS, num contêiner de
     altura reduzida.

     A grade de colunas, porém, É da viewport: a coluna da navegação só entra
     acima de nav-fixa (64rem). Abaixo disso a miniatura herdava a grade de
     uma coluna, a navegação sem área caía numa célula implícita embaixo e à
     direita, e o palco rolava de lado sem sinal nenhum (medido a 390px em
     19/09/2026). O desenho declara o arranjo que ilustra — faixa em cima,
     navegação e conteúdo lado a lado, rodapé embaixo — e a coluna da
     navegação cede até 38% do palco, que a 340px ainda lê como coluna. */
  shell:
    `<div class="ucam-shell" style="min-block-size:0;block-size:19rem;border-radius:var(--ucam-radius-lg);overflow:hidden;` +
    `grid-template-columns:min(var(--ucam-nav-width),38%) minmax(0,1fr);` +
    `grid-template-areas:'appbar appbar' 'nav main' 'footer footer'">` +
    `<header class="ucam-appbar">` +
    `<span class="ucam-appbar__system">Sistema</span>` +
    `<span class="ucam-appbar__spacer"></span>` +
    `<span class="ucam-campus ucam-campus--faixa"><span class="ucam-campus__valor">Campus</span></span>` +
    `<span class="ucam-appbar__divider"></span>` +
    `<span class="ucam-appbar__user"><span class="ucam-appbar__avatar">LB</span></span>` +
    `</header>` +
    `<nav class="ucam-nav" style="position:static;transform:none;visibility:visible;inline-size:auto;block-size:auto;inset-block-start:auto" aria-label="Exemplo">` +
    `<div class="ucam-nav__scroll">` +
    `<div class="ucam-nav__group"><p class="ucam-nav__group-title">Grupo</p>` +
    `<span class="ucam-nav__item" aria-current="page">Item ativo</span>` +
    `<span class="ucam-nav__item">Item</span>` +
    `<span class="ucam-nav__item">Item</span></div></div></nav>` +
    `<main class="ucam-main"><div class="ucam-content">${caixa('.ucam-content', 'min-block-size:7rem')}</div></main>` +
    `<footer class="ucam-shell__footer">Rodapé</footer>` +
    `</div>`,

  stack:
    `<div class="ucam-stack">${caixa('1')}${caixa('2')}${caixa('3')}</div>`,

  cluster:
    `<div class="ucam-cluster ucam-cluster--entre">${caixa('início', 'min-inline-size:7rem')}` +
    `<span class="ucam-cluster__spacer"></span>${caixa('fim', 'min-inline-size:5rem')}${caixa('fim', 'min-inline-size:5rem')}</div>`,

  grid:
    `<div class="ucam-grid ucam-grid--sm">${caixa('1')}${caixa('2')}${caixa('3')}${caixa('4')}${caixa('5')}</div>`,

  split:
    `<div class="ucam-split">${caixa('conteúdo', 'min-block-size:7rem')}${caixa('apoio', 'min-block-size:7rem')}</div>`,

  section:
    `<section class="ucam-section">` +
    `<h3 class="ucam-section__title">Título da seção</h3>` +
    `<p class="ucam-section__hint">Uma linha de apoio.</p>` +
    `${caixa('conteúdo')}</section>`,

  content:
    `<div style="background:var(--ucam-color-surface-canvas);padding:.75rem;border-radius:var(--ucam-radius-md)">` +
    `<div class="ucam-content" style="--ucam-content-max:26rem">${caixa('.ucam-content — centrado sob o teto')}</div></div>`,

  fallback: caixa('—'),
};
