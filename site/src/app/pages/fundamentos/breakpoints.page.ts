import { Component, ChangeDetectionStrategy } from '@angular/core';

import { fundamentos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

/**
 * Breakpoints.
 *
 * A fundação mais nova do sistema, e a única que nasceu de um defeito medido em
 * vez de uma escolha: até 09/09/2026 as media queries do @ucam/css eram
 * literais escritos à mão no gerador — sete medidas, três dialetos de borda e
 * um par que se sobrepunha em exatamente 1024px.
 *
 * A página existe para que a próxima media query escolha PAPEL e não medida.
 */
@Component({
  selector: 'ucam-breakpoints',
  imports: [PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Breakpoints'"
      [lede]="'Cinco degraus em rem, mobile-first. Media query nova escolhe PAPEL, nunca medida.'"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="prose largo">
      <section id="papeis">
        <h2>Papéis</h2>
        <p>{{ b.papeisDescricao }}</p>

        <div class="regua">
          @for (p of b.papeis; track p.token) {
            <div class="marca">
              <div class="trilho">
                <span class="preenchido" [style.inline-size.%]="proporcao(p.px)"></span>
              </div>
              <p class="rotulo">
                <code>viewport.{{ p.token }}</code>
                <span class="muted num">{{ p.valor }} · {{ p.px }}px</span>
              </p>
              <p class="small muted">{{ p.descricao }}</p>
            </div>
          }
        </div>
      </section>

      <section id="contentores">
        <h2>Papéis de contêiner</h2>
        <p>{{ b.contentoresDescricao }}</p>
        <div class="regua">
          @for (p of b.contentores; track p.token) {
            <div class="marca">
              <div class="trilho">
                <span class="preenchido" [style.inline-size.%]="proporcao(p.px)"></span>
              </div>
              <p class="rotulo">
                <code>container.{{ p.token }}</code>
                <span class="muted num">{{ p.valor }} · {{ p.px }}px</span>
              </p>
              <p class="small muted">{{ p.descricao }}</p>
            </div>
          }
        </div>
        <div class="callout">
          <p>
            <strong>Janela ou espaço?</strong> Media query de viewport decide o que depende da
            JANELA: a navegação virar gaveta, a faixa perder o chip de campus, o rótulo subir para
            cima do campo. Container query decide o que depende do espaço em que o BLOCO vive: o
            painel de apoio ao lado ou embaixo, quatro indicadores em fileira ou 2 + 2, três colunas
            de descrição ou quantas cabem. A 1024px a janela está acima de
            <code>duas-colunas</code> e o painel de conteúdo tem 666px — só o contêiner sabe disso
            (ADR-028).
          </p>
        </div>
      </section>

      <section id="uso">
        <h2>Como escrever a query</h2>
        <p>
          Media query não enxerga <code>var()</code> — não é escolha do sistema, é o CSS: a query é
          avaliada antes de existir elemento onde a variável pudesse ser resolvida. O valor é lido
          do spec pelo gerador e sai literal na folha, o mesmo caminho que a ADR-007 já usa para
          qualquer token.
        </p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">No gerador</th>
                <th scope="col">Sai na folha</th>
                <th scope="col">Lê-se como</th>
              </tr>
            </thead>
            <tbody>
              @for (p of b.papeis; track p.token) {
                <tr>
                  <td><code>acima('{{ p.token }}')</code></td>
                  <td><code class="num">&#64;media (min-width: {{ p.valor }})</code></td>
                  <td class="small">a partir de {{ p.px }}px</td>
                </tr>
              }
              <tr>
                <td><code>abaixo('nav-fixa')</code></td>
                <td><code class="num">&#64;media (max-width: {{ borda(1024) }})</code></td>
                <td class="small">até 1023,98px</td>
              </tr>
              @for (p of b.contentores; track p.token) {
                <tr>
                  <td><code>contentorAcima('{{ p.token }}')</code></td>
                  <td><code class="num">&#64;container corpo (min-width: {{ p.valor }})</code></td>
                  <td class="small">painel de conteúdo a partir de {{ p.px }}px</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="callout callout-warn">
          <p>
            <strong>Um dialeto só para a borda de <code>max-width</code>: −0,001rem.</strong>
            Antes eram três no mesmo arquivo — <code>47.99</code>, <code>63.999</code> e
            <code>29.999</code> — e um par sobreposto: <code>max-width: 64rem</code> e
            <code>min-width: 64rem</code> valiam JUNTOS em 1024px, deixando a caixa de entrada em
            uma e em duas colunas na mesma largura.
          </p>
        </div>
      </section>

      <section id="escala">
        <h2>Escala primitiva</h2>
        <p>{{ b.descricao }}</p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Degrau</th>
                <th scope="col">rem</th>
                <th scope="col">px</th>
                <th scope="col">Papel que o usa</th>
              </tr>
            </thead>
            <tbody>
              @for (d of b.escala; track d.token) {
                <tr>
                  <td><code>breakpoint.{{ d.token }}</code></td>
                  <td class="num">{{ d.valor }}</td>
                  <td class="num">{{ d.px }}</td>
                  <td>
                    @if (papelDe(d.token); as papel) {
                      <code>viewport.{{ papel }}</code>
                    } @else {
                      <span class="muted small">nenhum</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: `
    .regua {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
      margin-block: 1.5rem 2rem;
    }
    .trilho {
      block-size: 0.5rem;
      margin-block-end: 0.5rem;
      background: var(--ucam-color-surface-sunken);
      border-radius: var(--ucam-radius-pill);
      overflow: hidden;
    }
    .preenchido {
      display: block;
      block-size: 100%;
      background: var(--ucam-color-action-primary-default);
    }
    .rotulo {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 0.75rem;
      align-items: baseline;
      margin: 0 0 0.25rem;
      font-size: 0.75rem;
    }
    .marca p:last-child {
      margin: 0;
    }
  `,
})
export default class BreakpointsPage {
  protected readonly b = fundamentos.breakpoints;

  protected readonly secoes: Ancora[] = [
    { id: 'papeis', rotulo: 'Papéis' },
    { id: 'contentores', rotulo: 'Papéis de contêiner' },
    { id: 'uso', rotulo: 'Como escrever a query' },
    { id: 'escala', rotulo: 'Escala primitiva' },
  ];

  /** A barra é comparativa: o maior degrau é 100%. */
  private readonly maior = Math.max(...fundamentos.breakpoints.escala.map((d) => d.px));

  protected proporcao(px: number): number {
    return Math.round((px / this.maior) * 100);
  }

  protected papelDe(degrau: string): string | null {
    return this.b.papeis.find((p) => p.degrau === degrau)?.token ?? null;
  }

  /** A borda de max-width, escrita do mesmo jeito que o gerador escreve. */
  protected borda(px: number): string {
    return `${(px / 16 - 0.001).toFixed(3)}rem`;
  }
}
