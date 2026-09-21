import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { padraoPorId, componentes } from '../../spec/spec';
import { PageHeaderComponent } from '../../docs/page-header.component';
import { NestaPaginaComponent, type Ancora } from '../../docs/nesta-pagina.component';

@Component({
  selector: 'ucam-padrao',
  imports: [RouterLink, PageHeaderComponent, NestaPaginaComponent],
  host: { class: 'pagina' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = padrao();

    @if (!p) {
      <p class="lede">Padrão não encontrado.</p>
      <p><a routerLink="/padroes">Voltar aos padrões</a></p>
    } @else {
      <ucam-page-header secao="Padrão" [titulo]="p.nome">
        <span slot="selo" class="pill" [class]="'pill-' + p.status">{{ p.status }}</span>
        <p class="small muted"><strong class="k">Frequência.</strong> {{ p.frequencia }}</p>
      </ucam-page-header>

      <ucam-nesta-pagina [secoes]="secoes()" />

      <div class="prose">
        <div class="callout callout-limit">
          <p class="eyebrow">O problema hoje</p>
          <p>{{ p.problema }}</p>
        </div>

        @if (p.estrutura?.length) {
          <section id="estrutura">
            <h2>Estrutura</h2>
            <ol class="steps">
              @for (e of p.estrutura; track e) {
                <li>{{ e }}</li>
              }
            </ol>
          </section>
        }

        <section id="regras">
          <h2>Regras</h2>
          <ul class="list">
            @for (r of p.regras; track r) {
              <li>{{ r }}</li>
            }
          </ul>
        </section>

        <section id="usa">
          <h2>Componentes que usa</h2>
          <div class="chips">
            @for (u of usa(); track u.seletor) {
              @if (u.id) {
                <a class="chip" [routerLink]="'/catalogo/' + u.id">{{ u.seletor }}</a>
              } @else {
                <span class="chip" title="Ainda sem contrato">{{ u.seletor }} ·  sem contrato</span>
              }
            }
          </div>
        </section>

        <section id="evidencia">
          <h2>Evidência</h2>
          <p class="small muted">{{ p.evidencia }}</p>
        </section>
      </div>
    }
  `,
})
export default class PadraoPage {
  /** Parâmetro de rota `[id]`, ligado por `withComponentInputBinding()`. */
  readonly id = input('');

  protected readonly padrao = computed(() => padraoPorId(this.id()));

  /**
   * O padrão declara seletores (`ucam-pagination`). Alguns já têm contrato,
   * outros não — e a diferença precisa aparecer: um chip que não linka é a
   * lista de trabalho pendente.
   */
  protected readonly usa = computed(() =>
    (this.padrao()?.usa ?? []).map((seletor) => ({
      seletor,
      id: componentes.find((c) => c.selector === seletor)?.id ?? '',
    })),
  );

  /**
   * Computada porque "Estrutura" é condicional no template — a mesma condição,
   * escrita uma vez de cada lado. Âncora para seção que não existe é pior que
   * âncora nenhuma: leva a lugar nenhum e não avisa.
   */
  protected readonly secoes = computed<readonly Ancora[]>(() => {
    const p = this.padrao();
    return [
      ...(p?.estrutura?.length ? [{ id: 'estrutura', rotulo: 'Estrutura' }] : []),
      { id: 'regras', rotulo: 'Regras' },
      { id: 'usa', rotulo: 'Componentes que usa' },
      { id: 'evidencia', rotulo: 'Evidência' },
    ];
  });
}
