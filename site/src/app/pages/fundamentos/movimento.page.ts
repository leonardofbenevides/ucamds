import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

import { fundamentos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

/**
 * Movimento.
 *
 * Curva e duração eram duas linhas soltas no fim da página de espaçamento — a
 * escala primitiva de `duration`, sem os papéis e sem uma única curva. Um
 * sistema que não mostra as curvas não tem como cobrar consistência delas: quem
 * não encontra `motion.easing.standard` escreve `ease-out` e segue.
 *
 * A página ANIMA as amostras. Curva é a fundação que menos se lê em número:
 * cubic-bezier(.2,0,0,1) e cubic-bezier(0,0,.2,1) diferem em duas casas e são
 * duas sensações distintas.
 */
@Component({
  selector: 'ucam-movimento',
  imports: [PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Movimento'"
      [lede]="'Curva e duração são do sistema, não de cada componente. Três curvas, três durações — e nada fora disso.'"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="prose largo">
      <section id="porque">
        <h2>Por que o contrato existe</h2>
        <p>{{ m.descricao }}</p>
      </section>

      <section id="curvas">
        <h2>Curvas</h2>
        <p class="small muted">
As três correm juntas, no mesmo percurso e na mesma duração — é a única
          comparação que denuncia a diferença entre elas. Nenhuma tabela denuncia.
        </p>

        <button class="botao" type="button" (click)="correr()">
          {{ correndo() ? 'Correndo…' : 'Rodar as três' }}
        </button>

        <div class="pista">
          @for (c of m.curvas; track c.token) {
            <div class="faixa">
              <p class="rotulo">
                <code>motion.easing.{{ c.token }}</code>
                <span class="muted num">{{ c.valor }}</span>
              </p>
              <div class="trilho">
                <span
                  class="bolinha"
                  [class.correndo]="correndo()"
                  [style.transition-timing-function]="c.valor"
                ></span>
              </div>
              <p class="small muted">{{ c.descricao }}</p>
            </div>
          }
        </div>
      </section>

      <section id="duracoes">
        <h2>Durações</h2>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Papel</th>
                <th scope="col">Resolve para</th>
                <th scope="col">Quando</th>
              </tr>
            </thead>
            <tbody>
              @for (d of m.duracoes; track d.token) {
                <tr>
                  <td><code>motion.duration.{{ d.token }}</code></td>
                  <td><code class="num">{{ d.valor }}</code></td>
                  <td class="small">{{ d.descricao }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <h3>Escala primitiva</h3>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Degrau</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              @for (d of m.duracoesPrimitivas; track d.token) {
                <tr>
                  <td><code>duration.{{ d.token }}</code></td>
                  <td class="num">{{ d.valor }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="reduzido">
        <h2>Movimento reduzido</h2>
        <div class="callout">
          <p>
            <strong>
              Toda animação do <code>&#64;ucam/css</code> é cancelada sob
              <code>prefers-reduced-motion: reduce</code>.
            </strong>
            Não é cortesia: WCAG 2.3.3. Componente que anima por conta própria, com curva escolhida
            no arquivo dele, escapa dessa regra — que é a segunda razão para a curva ser do sistema
            e não do componente.
          </p>
        </div>
        <p class="small muted">
          Esta página respeita a mesma preferência: com movimento reduzido ligado no sistema
          operacional, as amostras acima trocam de posição sem percorrer o caminho.
        </p>
      </section>
    </div>
  `,
  styles: `
    .botao {
      margin-block: 0.5rem 1.25rem;
      padding: 0.4rem 0.85rem;
      font: inherit;
      font-size: 0.8125rem;
      color: var(--ucam-color-text-primary);
      background: var(--ucam-color-surface-default);
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-control);
      cursor: pointer;
    }
    .botao:hover {
      background: var(--ucam-color-interaction-hover);
    }
    .botao:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
    }
    .pista {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-block-end: 2rem;
    }
    .rotulo {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 0.75rem;
      align-items: baseline;
      margin: 0 0 0.4rem;
      font-size: 0.75rem;
    }
    .trilho {
      container-type: inline-size;
      position: relative;
      block-size: 1.75rem;
      padding: 0.25rem;
      background: var(--ucam-color-surface-sunken);
      border-radius: var(--ucam-radius-pill);
    }
    .bolinha {
      display: block;
      inline-size: 1.25rem;
      block-size: 1.25rem;
      background: var(--ucam-color-action-primary-default);
      border-radius: var(--ucam-radius-pill);
      /* PERCURSO, não troca de estado: em 120ms as três curvas chegam
         juntas e a demonstração não demonstra nada. */
      transition-property: translate;
      transition-duration: var(--ucam-motion-duration-travel);
      translate: 0;
    }
    .bolinha.correndo {
      translate: calc(100cqi - 100%) 0;
    }
    .faixa p:last-child {
      margin: 0.4rem 0 0;
    }
    /* A página é sobre movimento e por isso é a que mais precisa obedecer a
       preferência: demonstrar o contrato quebrando-o não demonstra nada. */
    @media (prefers-reduced-motion: reduce) {
      .bolinha {
        transition-duration: 1ms;
      }
    }
  `,
})
export default class MovimentoPage {
  protected readonly m = fundamentos.movimento;
  protected readonly correndo = signal(false);

  protected readonly secoes: Ancora[] = [
    { id: 'porque', rotulo: 'Por que existe' },
    { id: 'curvas', rotulo: 'Curvas' },
    { id: 'duracoes', rotulo: 'Durações' },
    { id: 'reduzido', rotulo: 'Movimento reduzido' },
  ];

  /** Vai e volta: parado num canto, a curva de ida some da memória. */
  protected correr(): void {
    this.correndo.update((v) => !v);
  }
}
