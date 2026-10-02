import { Component, computed, inject, output } from '@angular/core';
import { UcamIcon, UcamProgress, UcamSectionBar } from '@ucam/ui';
import { rotuloTipoProva, slugTipoProva } from '../../core/model/prova';
import { Posicao, ProvaStore } from '../../core/store/prova.store';

interface ItemMapa {
  slug: string;
  n: number;
  respondida: boolean;
  atual: boolean;
}
interface GrupoMapa {
  slug: string;
  rotulo: string;
  respondidas: number;
  itens: ItemMapa[];
}

/**
 * Navegação da prova. Estado por questão em forma E palavra: a respondida
 * tem contorno, a em branco não, e o nome acessível diz qual é qual. Alvo
 * mínimo pela classe do DS; a atual leva aria-current e o realce.
 */
@Component({
  selector: 'app-mapa-questoes',
  imports: [UcamIcon, UcamProgress, UcamSectionBar],
  template: `
    <nav class="ucam-stack ucam-stack--lg" aria-label="Questões da prova">
      <ucam-progress
        label="Questões respondidas"
        [value]="store.respondidas()"
        [max]="store.totalObjetivas()"
        [tone]="store.respondidas() === store.totalObjetivas() ? 'success' : 'neutral'"
        [valueText]="store.respondidas() + ' de ' + store.totalObjetivas() + ' respondidas'"
        [legendStart]="store.respondidas() + ' de ' + store.totalObjetivas() + ' respondidas'"
      />
      @for (g of grupos(); track g.slug) {
        <section class="ucam-stack ucam-stack--sm">
          <ucam-section-bar [title]="g.rotulo" [level]="2" [count]="g.respondidas + ' de ' + g.itens.length" [rule]="true" />
          <ol class="ucam-cluster" data-mapa>
            @for (i of g.itens; track i.n) {
              <li>
                <button
                  type="button"
                  class="ucam-btn"
                  [class.ucam-btn--secondary]="i.respondida"
                  [class.ucam-btn--ghost]="!i.respondida"
                  [attr.data-questao]="i.slug + '/' + i.n"
                  [attr.aria-current]="i.atual ? 'page' : null"
                  [attr.aria-label]="'Questão ' + i.n + ', ' + (i.respondida ? 'respondida' : 'em branco')"
                  (click)="navegar.emit({ slug: i.slug, n: i.n })"
                >
                  {{ i.n }}
                </button>
              </li>
            }
          </ol>
        </section>
      }
      @if (store.redacao()) {
        <section class="ucam-stack ucam-stack--sm">
          <ucam-section-bar title="Redação" [level]="2" [count]="store.estadoRedacao()" [rule]="true" />
          <button
            type="button"
            class="ucam-btn ucam-btn--ghost"
            [attr.aria-current]="naRedacao() ? 'page' : null"
            (click)="navegar.emit('redacao')"
          >
            <ucam-icon name="pencil" size="sm" aria-hidden="true" /> Abrir a redação
          </button>
        </section>
      }
    </nav>
  `,
  styles: `
    /* Onde a pessoa está, na língua do "escolhido" do DS (ADR-046): um sinal
       de superfície e um de tipografia. O contorno continua dizendo
       respondida; o realce diz atual. */
    .ucam-btn[aria-current='page'] {
      background: var(--ucam-color-action-primary-subtle);
      color: var(--ucam-color-text-primary);
      font-weight: var(--ucam-typography-action-font-weight);
    }
  `,
})
export class MapaQuestoes {
  readonly store = inject(ProvaStore);
  readonly navegar = output<Posicao | 'redacao'>();

  readonly naRedacao = computed(() => this.store.posicao() === null && !!this.store.redacao());

  readonly grupos = computed<GrupoMapa[]>(() => {
    const r = this.store.respostas();
    const p = this.store.posicao();
    return this.store.objetivos().map((c) => {
      const slug = slugTipoProva(c.tipoprova);
      const itens = c.questoes.map((q, i) => ({
        slug,
        n: i + 1,
        respondida: !!r[q.oid],
        atual: p?.slug === slug && p?.n === i + 1,
      }));
      return { slug, rotulo: rotuloTipoProva(c.tipoprova), respondidas: itens.filter((x) => x.respondida).length, itens };
    });
  });
}
