import { Component, ChangeDetectionStrategy } from '@angular/core';

import { fundamentos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

/**
 * Raio.
 *
 * Saiu da página de espaçamento, onde dividia espaço com escala, foco e
 * duração e aparecia só como escala primitiva — a lista de degraus sem uma
 * palavra sobre quem usa qual. Os PAPÉIS (control, surface, frame, pill)
 * existiam no token e em lugar nenhum do site, e é o papel que responde a
 * única pergunta que alguém faz aqui: qual raio eu uso neste elemento.
 */
@Component({
  selector: 'ucam-raio',
  imports: [PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Raio'"
      [lede]="'Raio por PAPEL, não por degrau. A escala declara as medidas; os papéis declaram quem usa qual.'"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="prose largo">
      <section id="papeis">
        <h2>Papéis</h2>
        <p>
          Mudar a suavidade da interface inteira é mudar quatro linhas aqui — não caçar trinta usos
          no gerador de CSS.
        </p>

        <div class="palco">
          @for (p of f.raioPapeis; track p.token) {
            <div class="amostra">
              <div class="caixa" [style.border-radius]="p.valor"></div>
              <p class="rotulo">
                <code>radius.{{ p.token }}</code>
                <span class="muted num">{{ p.valor }}</span>
              </p>
              <p class="small muted">{{ p.descricao }}</p>
            </div>
          }
        </div>
      </section>

      <section id="escala">
        <h2>Escala primitiva</h2>
        <p class="small muted">
          A matéria-prima. Componente nenhum referencia esta camada direto — quem escolhe é o papel
          acima.
        </p>

        <div class="degraus">
          @for (r of f.raio; track r.token) {
            <div class="degrau">
              <span class="quadro" [style.border-radius]="r.valor"></span>
              <code>{{ r.token }}</code>
              <span class="muted num">{{ r.valor }}</span>
            </div>
          }
        </div>

        @for (r of f.raio; track r.token) {
          @if (r.descricao) {
            <p class="small muted nota"><code>radius.{{ r.token }}</code> — {{ r.descricao }}</p>
          }
        }
      </section>
    </div>
  `,
  styles: `
    .palco {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
      gap: 1.5rem;
      margin-block: 1.5rem 2rem;
    }
    .caixa {
      block-size: 4.5rem;
      margin-block-end: 0.9rem;
      background: var(--ucam-color-surface-sunken);
      border: 1px solid var(--ucam-color-border-default);
    }
    .rotulo {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 0.75rem;
      align-items: baseline;
      margin: 0 0 0.3rem;
      font-size: 0.75rem;
    }
    .amostra p:last-child {
      margin: 0;
    }
    .degraus {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-block: 1.25rem 1.5rem;
    }
    .degrau {
      display: grid;
      justify-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
    }
    .quadro {
      inline-size: 3rem;
      block-size: 3rem;
      background: var(--ucam-color-surface-sunken);
      border: 1px solid var(--ucam-color-border-default);
    }
    .nota {
      margin-block: 0.5rem 0;
    }
  `,
})
export default class RaioPage {
  protected readonly f = fundamentos;

  protected readonly secoes: Ancora[] = [
    { id: 'papeis', rotulo: 'Papéis' },
    { id: 'escala', rotulo: 'Escala primitiva' },
  ];
}
