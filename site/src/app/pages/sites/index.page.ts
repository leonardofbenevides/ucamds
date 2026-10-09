import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import { sitesPorCategoria, sitesMeta } from '../../spec/sites';
import type { Componente } from '../../spec/spec.types';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { TextoComponent } from '../../docs/texto.component';

/**
 * O catálogo dos SITES: o segundo sistema do UCAMDS (ADR-067), para o site
 * institucional, o CENPRE e o de Campos. Mesma grade do catálogo da
 * aplicação, com duas diferenças: o preview vive sob a classe de raiz dos
 * sites, e o alternador Bordô / CENPRE escreve data-marca no invólucro — é a
 * camada 3 (ADR-068) aplicada num elemento, não no elemento raiz.
 *
 * Sem o encaixe por escala do catálogo da aplicação: as peças de site são
 * átomos e seções curtas, e aparecem em tamanho real.
 */
@Component({
  selector: 'ucam-sites',
  imports: [TextoComponent, RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Sites"
      [titulo]="'Componentes dos sites'"
      [lede]="total + ' contratos para os sites públicos da UCAM: institucional, CENPRE e Campos. CSS puro, sobre o mesmo primitivo da aplicação (ADR-067).'"
    />

    <div class="marcas" role="group" aria-label="Submarca dos previews">
      <span class="marcas-rotulo">Ver em</span>
      <button type="button" class="marca" [attr.aria-pressed]="marca() === 'base'" (click)="marca.set('base')">Bordô UCAM</button>
      @for (m of submarcas; track m) {
        <button type="button" class="marca" [attr.aria-pressed]="marca() === m" (click)="marca.set(m)">{{ rotulo(m) }}</button>
      }
    </div>

    <div [attr.data-marca]="marca() === 'base' ? null : marca()">
      @for (g of grupos; track g.chave) {
        <section class="grupo">
          <div class="grupo-cabeca">
            <h2>{{ g.rotulo }} <span class="num">{{ g.itens.length }}</span></h2>
            @if (g.nota) {
              <p class="small muted"><ucam-t [t]="g.nota" /></p>
            }
          </div>
          <div class="grade">
            @for (c of g.itens; track c.id) {
              <a class="card" [routerLink]="'/sites/' + c.id">
                <div class="palco" inert>
                  @if (preview(c); as html) {
                    <div class="ucam-site palco-conteudo" [class.reduzido]="g.chave === 'layout'" [innerHTML]="html"></div>
                  }
                </div>
                <div class="corpo">
                  <h3>
                    {{ c.name }}
                    @if (c.status !== 'stable') {
                      <span class="pill" [class]="'pill-' + c.status">{{ c.status }}</span>
                    }
                  </h3>
                  <p class="small muted"><ucam-t [t]="c.description" /></p>
                </div>
              </a>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    .marcas {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 2.5rem;
    }
    .marcas-rotulo {
      font-size: 0.8125rem;
      color: var(--ucam-color-text-secondary);
      margin-inline-end: 0.25rem;
    }
    .marca {
      min-block-size: 2rem;
      padding: 0 0.75rem;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-full);
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
    }
    .marca[aria-pressed='true'] {
      border-color: var(--ucam-color-text-primary);
      font-weight: 650;
    }
    .grupo {
      margin-block-end: 4rem;
    }
    .grupo-cabeca {
      margin-block-end: 1.25rem;
      max-inline-size: var(--measure);
    }
    .grupo-cabeca h2 {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      margin: 0 0 0.3rem;
      font-size: 1.375rem;
      font-weight: 560;
      letter-spacing: -0.02em;
    }
    .grupo-cabeca .num {
      font-family: var(--f-mono);
      font-size: 0.7rem;
      font-weight: 400;
      color: var(--ucam-color-text-secondary);
    }
    .grupo-cabeca p {
      margin: 0;
    }
    .grade {
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
    }
    .card {
      display: flex;
      flex-direction: column;
      padding: 0;
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--r-superficie);
      background: var(--ucam-color-surface-default);
      text-decoration: none;
      color: inherit;
      overflow: hidden;
    }
    .card:hover {
      border-color: var(--borda-marca);
      box-shadow: var(--sombra-hover);
    }
    /* O palco é branco de propósito: a peça de site assenta sobre a página
       do site, que é branca. Respiro generoso porque não há escala. */
    .palco {
      display: grid;
      place-items: center;
      min-block-size: 10rem;
      padding: 1.5rem;
      background: var(--ucam-color-surface-default);
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    .palco-conteudo {
      inline-size: 100%;
      display: grid;
      justify-items: center;
    }
    /* MOLDURA E SEÇÃO aparecem reduzidas. Um cabeçalho de seção é desenhado
       para a largura da página: o título em display mede pela JANELA (clamp
       com vw) e saía com 52px num cartão de 320 — duas palavras por linha e o
       cartão três vezes mais alto que os vizinhos (captura de 09/10/2026).
       Átomo continua em tamanho real; só o que é seção encolhe, e na página
       do componente ele volta ao tamanho inteiro. */
    .palco-conteudo.reduzido {
      zoom: 0.55;
      justify-items: start;
    }
    .corpo {
      padding: 0.9rem 1rem 1rem;
    }
    .corpo h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.3rem;
      font-size: 1rem;
      font-weight: 600;
    }
    .corpo p {
      margin: 0;
    }
  `,
})
export default class SitesPage {
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly total = sitesMeta.componentes;
  protected readonly submarcas = sitesMeta.submarcas;
  protected readonly grupos = sitesPorCategoria();
  protected readonly marca = signal<string>('base');

  protected rotulo(m: string): string {
    return m === 'cenpre' ? 'CENPRE' : m;
  }

  private readonly cache = new Map<string, SafeHtml | null>();

  /** Mesma justificativa do DemoPainel: a origem é a spec deste repositório. */
  protected preview(c: Componente): SafeHtml | null {
    if (!this.cache.has(c.id)) {
      const html = (c.demo?.principal?.preview ?? c.demo?.miniatura)?.trim();
      this.cache.set(c.id, html ? this.sanitizer.bypassSecurityTrustHtml(html) : null);
    }
    return this.cache.get(c.id)!;
  }
}
