import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { fundamentos } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

@Component({
  selector: 'ucam-tipografia',
  imports: [RouterLink, PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Fundamentos"
      [titulo]="'Tipografia'"
      [lede]="'Papéis tipográficos nomeados por função, não por tamanho. Nenhum papel usa caixa alta forçada.'"
    />

    <ucam-nesta-pagina [secoes]="secoes" />

    <div class="callout">
      <p>
        <strong>Nenhum papel usa <code>text-transform: uppercase</code>.</strong> Caixa alta elimina
        o contorno da palavra, reduz a velocidade de leitura e é lida letra a letra por alguns
        leitores de tela. A distinção fica por peso e tamanho — ver
        <a routerLink="/decisoes/adr-003">ADR-003</a>.
      </p>
    </div>

    <div class="prose largo">
      <section id="familia">
        <h2>Família</h2>
        <p>{{ f.fontes.descricao }}</p>
        <p class="small muted">{{ f.fontes.origem }}</p>

        <div class="familias">
          @for (fam of f.fontes.familias; track fam.token) {
            <div class="fam">
              <p class="especime" [style.font-family]="fam.valor">Aa Bb Cc 0123456789</p>
              <p class="rotulo">
                <code>font.{{ fam.token }}</code>
                <span class="muted">{{ fam.descricao }}</span>
              </p>
              <p class="small muted num pilha">{{ fam.valor }}</p>
            </div>
          }
        </div>
      </section>
    </div>

    <div class="prose largo">
      <section id="papeis">
        <h2>Papéis</h2>
        <p class="small muted">
          Nomeados por FUNÇÃO. É o papel que o componente referencia — nunca o tamanho solto.
        </p>

        <div class="escala">
          @for (t of f.tipografia; track t.papel) {
            <div class="linha">
              <p
                class="amostra"
                [style.font-size]="t.fontSize"
                [style.font-weight]="t.fontWeight"
                [style.line-height]="t.lineHeight"
                [style.letter-spacing]="t.letterSpacing"
              >
                Requerimento aguardando análise
              </p>
              <p class="meta">
                <code>{{ t.papel }}</code>
                <span class="muted num">
                  {{ t.fontSize }} · {{ t.fontWeight }} · {{ t.lineHeight }}
                  @if (t.letterSpacing) {
                    · {{ t.letterSpacing }}
                  }
                </span>
              </p>
            </div>
          }
        </div>
      </section>
    </div>

    <div class="prose largo">
      <section id="escala">
        <h2>Escala primitiva</h2>
        <p class="small muted">
          A matéria-prima dos papéis. Componente nenhum referencia esta camada direto — quem
          escolhe é o papel acima.
        </p>
        <div class="scroller">
          <table>
            <thead>
              <tr>
                <th scope="col">Degrau</th>
                <th scope="col">Valor</th>
                <th scope="col">px</th>
              </tr>
            </thead>
            <tbody>
              @for (t of f.fontes.tamanhos; track t.token) {
                <tr>
                  <td><code>fontSize.{{ t.token }}</code></td>
                  <td class="num">{{ t.valor }}</td>
                  <td class="num">{{ emPx(t.valor) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section id="pesos">
        <h2>Pesos</h2>
        <p class="small muted">
          Quatro, e nada entre eles. A Geist é variável, então qualquer peso RENDERIZA — o que
          torna a disciplina obrigatória: sem escala fechada, cada tela escolhe o próprio 550.
        </p>
        <ul class="pesos">
          @for (p of f.fontes.pesos; track p.token) {
            <li>
              <span class="amostra-peso" [style.font-weight]="p.valor">Requerimento</span>
              <code>fontWeight.{{ p.token }}</code>
              <span class="muted num">{{ p.valor }}</span>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: `
    .familias {
      display: grid;
      gap: 1.5rem;
      margin-block: 1.25rem 0.5rem;
    }
    .especime {
      margin: 0 0 0.4rem;
      font-size: 1.75rem;
      letter-spacing: -0.01em;
    }
    .rotulo {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 0.75rem;
      align-items: baseline;
      margin: 0 0 0.2rem;
      font-size: 0.75rem;
    }
    /* A pilha de fallback tem seis nomes e passa de cem caracteres: sem a
       quebra ela empurra a página inteira para a rolagem horizontal. */
    .pilha {
      margin: 0;
      overflow-wrap: anywhere;
    }
    .pesos {
      display: grid;
      gap: 0.75rem;
      margin: 1rem 0 0;
      padding: 0;
      list-style: none;
    }
    .pesos li {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem 1rem;
      align-items: baseline;
      font-size: 0.75rem;
    }
    .amostra-peso {
      inline-size: 9rem;
      font-size: 1.125rem;
    }
    .escala {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .linha {
      padding-block-end: 1.25rem;
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    .linha:last-child {
      border-block-end: 0;
    }
    .amostra {
      margin: 0 0 0.4rem;
      text-wrap: balance;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 1rem;
      margin: 0;
      font-size: 0.75rem;
    }
  `,
})
export default class TipografiaPage {
  protected readonly f = fundamentos;

  protected readonly secoes: readonly Ancora[] = [
    { id: 'familia', rotulo: 'Família' },
    { id: 'papeis', rotulo: 'Papéis' },
    { id: 'escala', rotulo: 'Escala primitiva' },
    { id: 'pesos', rotulo: 'Pesos' },
  ];

  /** rem × 16. A escala é declarada em rem; a conversa de todo dia é em px. */
  protected emPx(rem: string): number {
    return Math.round(parseFloat(rem) * 16);
  }
}
