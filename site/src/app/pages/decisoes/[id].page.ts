import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { adrPorSlug, componentes } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

@Component({
  selector: 'ucam-decisao',
  imports: [RouterLink, PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let a = adr();

    @if (!a) {
      <p class="lede">Decisão não encontrada.</p>
      <p><a routerLink="/decisoes">Voltar às decisões</a></p>
    } @else {
      <ucam-page-header [secao]="a.id" [titulo]="a.titulo">
        <span slot="selo" class="pill" [class]="'pill-' + a.status">{{ a.status }}</span>
        <p class="small muted num">{{ a.data }}</p>
      </ucam-page-header>

      <ucam-nesta-pagina [secoes]="secoes" />

      <div class="prose">
        <section id="contexto">
          <h2>Contexto</h2>
          <p>{{ a.contexto }}</p>
        </section>

        <section id="decisao">
          <h2>Decisão</h2>
          <p class="decisao">{{ a.decisao }}</p>
        </section>

        <section id="consequencias">
          <h2>Consequências</h2>
          <ul class="list">
            @for (c of a.consequencias; track c) {
              <li>{{ c }}</li>
            }
          </ul>
        </section>

        <section id="afeta">
          <h2>Afeta</h2>
          <div class="chips">
            @for (x of afeta(); track x.nome) {
              @if (x.id) {
                <a class="chip" [routerLink]="'/catalogo/' + x.id">{{ x.nome }}</a>
              } @else {
                <span class="chip" title="Ainda sem contrato">{{ x.nome }} · sem contrato</span>
              }
            }
          </div>
        </section>
      </div>
    }
  `,
  styles: `
    .decisao {
      font-size: 1.0625rem;
      padding-inline-start: 1rem;
      border-inline-start: 3px solid var(--ucam-color-action-primary-default);
    }
    a.chip {
      text-decoration: none;
    }
    a.chip:hover {
      border-color: var(--ucam-color-action-primary-default);
      color: var(--ucam-color-action-primary-default);
    }
  `,
})
export default class DecisaoPage {
  /** Parâmetro de rota `[id]`, ligado por `withComponentInputBinding()`. */
  readonly id = input('');

  protected readonly adr = computed(() => adrPorSlug(this.id()));

  /**
   * As quatro seções de uma ADR são fixas — é a forma do documento, não do
   * conteúdo. Por isso lista constante, não computada.
   */
  protected readonly secoes: readonly Ancora[] = [
    { id: 'contexto', rotulo: 'Contexto' },
    { id: 'decisao', rotulo: 'Decisão' },
    { id: 'consequencias', rotulo: 'Consequências' },
    { id: 'afeta', rotulo: 'Afeta' },
  ];

  /**
   * `afeta` mistura ids de componente com nomes de coisas que ainda não têm
   * contrato. Quem tem, vira link; quem não tem fica marcado — é a lista de
   * trabalho que a decisão criou.
   */
  protected readonly afeta = computed(() =>
    (this.adr()?.afeta ?? []).map((nome) => ({
      nome,
      id: componentes.find((c) => c.id === nome || c.selector === nome)?.id ?? '',
    })),
  );
}
