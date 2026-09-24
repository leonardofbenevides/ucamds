import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { adrs } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';

@Component({
  selector: 'ucam-decisoes',
  imports: [RouterLink, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ucam-page-header
      secao="Decisões"
      [titulo]="'Architecture Decision Records'"
      [lede]="'A regra, o motivo e as alternativas descartadas. Cada regra do design system aponta para uma ADR daqui.'"
    />

    <ol class="lista">
      @for (a of lista; track a.slug) {
        <li>
          <a [routerLink]="'/decisoes/' + a.slug" class="item">
            <div class="topo">
              <code class="id">{{ a.id }}</code>
              <span class="pill" [class]="'pill-' + a.status">{{ a.status }}</span>
              <span class="num muted data">{{ a.data }}</span>
            </div>
            <h2>{{ a.titulo }}</h2>
            <p class="small muted">{{ a.decisao }}</p>
          </a>
        </li>
      }
    </ol>
  `,
  styles: `
    .lista {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
    }
    .item {
      display: block;
      padding: 1rem 0;
      border-block-end: 1px solid var(--ucam-color-border-subtle);
      text-decoration: none;
    }
    .item:hover h2 {
      color: var(--ucam-color-action-primary-default);
    }
    .topo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-block-end: 0.35rem;
    }
    .id {
      font-weight: 600;
      font-size: 0.7rem;
      color: var(--ucam-color-action-primary-default);
    }
    .data {
      margin-inline-start: auto;
      font-size: 0.7rem;
    }
    h2 {
      margin: 0 0 0.3rem;
      font-size: 1.0625rem;
      font-weight: 600;
      text-wrap: balance;
    }
    /* DUAS LINHAS, e o resto na página da ADR. A lista servia a decisão
       INTEIRA de cada uma das 42 — mediana de 141 palavras, uma delas com 530
       —, e isso sozinho dava 1.096 linhas renderizadas: um quarto do texto do
       site inteiro numa página que existe para ESCOLHER qual ADR ler. O texto
       não foi cortado; ele está em /decisoes/<id>, que é o destino do link
       que envolve cada item. */
    p {
      margin: 0;
      max-inline-size: var(--measure);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `,
})
export default class DecisoesPage {
  protected readonly lista = adrs;
}
