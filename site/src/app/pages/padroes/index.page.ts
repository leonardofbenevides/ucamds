import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { padroes, telas } from '../../spec/spec';
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
          <h2>{{ p.nome }}</h2>
          <p class="small muted">{{ p.resumo }}</p>
          <p class="rodape small">
            @if (rotuloTelas(p.id); as t) {
              <span>{{ t }}</span>
            }
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
    /* Sem selo de status: os oito padrões são draft, e um selo igual em
       todos os cartões não distingue nenhum. O status segue na página do
       padrão. */
    h2 {
      margin: 0 0 0.4rem;
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
      /* 0,75rem: a régua de metadado do site, a mesma do .meta da página de
         componente. Estava em 10,4px, abaixo do piso que este próprio site
         cobra das telas que documenta. */
      font-size: 0.75rem;
      color: var(--ucam-color-text-secondary);
      margin-bottom: 0;
    }
  `,
})
export default class PadroesPage {
  protected readonly lista = padroes;

  /* Quantas telas do catálogo declaram este padrão: é o número que diz se
     ele já é prática ou ainda é proposta. Regras e componentes são detalhe
     da página do padrão. Zero não aparece: a confirmação destrutiva vive
     dentro de outras telas sem ser o padrão delas, e "nenhuma tela" leria
     como padrão sem uso. */
  private readonly telasPorPadrao = telas
    .flatMap((p) => p.templates)
    .reduce<Record<string, number>>((m, t) => ((m[t.padrao] = (m[t.padrao] ?? 0) + 1), m), {});

  protected rotuloTelas(id: string): string {
    const n = this.telasPorPadrao[id] ?? 0;
    return n === 0 ? '' : n === 1 ? 'em 1 tela' : `em ${n} telas`;
  }
}
