import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { padroes } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';

@Component({
  selector: 'ucam-padroes',
  imports: [RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Padrões"
      [titulo]="'Composições recorrentes'"
      [lede]="'Um padrão resolve uma tarefa inteira, não um controle. Vira código gerado quando aparece em três ou mais telas.'"
    />

    <div class="grade-cartoes">
      @for (p of lista; track p.id) {
        <a class="card" [routerLink]="'/padroes/' + p.id">
          <div class="topo">
            <h2>{{ p.nome }}</h2>
            <span class="pill" [class]="'pill-' + p.status">{{ p.status }}</span>
          </div>
          <p class="small muted">{{ p.problema }}</p>
          <p class="rodape small">
            <span>{{ p.regras.length }} regras</span>
            <span>{{ p.usa.length }} componentes</span>
          </p>
        </a>
      }
    </div>
  `,
  styles: `
    .grade-cartoes {
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr));
    }
    .topo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-block-end: 0.4rem;
    }
    h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }
    .card p {
      margin: 0 0 0.6rem;
    }
    .rodape {
      display: flex;
      gap: 0.9rem;
      font-family: var(--f-mono);
      font-size: 0.65rem;
      color: var(--ucam-color-text-secondary);
      margin-bottom: 0;
    }
  `,
})
export default class PadroesPage {
  protected readonly lista = padroes;
}
