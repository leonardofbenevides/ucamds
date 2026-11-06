import { ChangeDetectionStrategy, Component, computed, input, output, ViewEncapsulation } from '@angular/core';

/**
 * Contrato: spec/components/mapa-questoes.json
 *
 * O cartão-resposta em miniatura: uma bolha por questão, em grade de colunas
 * fixas, porque a POSIÇÃO é a informação — a 14 está sempre no mesmo lugar.
 * Nasceu da tela de prova do vestibular, que teve de escrevê-lo à mão.
 *
 * Três sinais, um por fato, e nenhum é só cor (WCAG 1.4.1): respondida é a
 * bolha cheia; atual é o anel (aria-current); marcada para revisar é o ponto
 * no canto. O nome acessível diz os três por extenso.
 */
export type UcamMapaEstado = 'respondida' | 'em-branco';

export interface UcamMapaItem {
  /** O número da questão na prova. É o que `ir` devolve. */
  numero: number;
  estado: UcamMapaEstado;
  /** Marcada para revisar. */
  revisar?: boolean;
  /** O caderno (a disciplina, sem "Caderno de"). Itens com grupo saem em grades separadas. */
  grupo?: string;
  /**
   * Item que não é questão numerada, como a redação: sai largo, na linha de
   * baixo, com este rótulo no lugar do número.
   */
  rotulo?: string;
}

interface Grupo {
  nome: string | null;
  itens: UcamMapaItem[];
}

@Component({
  selector: 'ucam-mapa-questoes',
  exportAs: 'ucamMapaQuestoes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <nav class="ucam-mapa" [attr.aria-label]="label()" [style.--ucam-mapa-colunas]="colunas()">
      @for (g of grupos(); track g.nome) {
        @if (g.nome) {
          <p class="ucam-mapa__grupo">{{ g.nome }}</p>
        }
        <ol class="ucam-mapa__grade" [attr.aria-label]="g.nome">
          @for (q of g.itens; track q.numero) {
            <li [class.ucam-mapa__li--largo]="!!q.rotulo">
              <button
                type="button"
                class="ucam-mapa__item"
                [class.ucam-mapa__item--largo]="!!q.rotulo"
                [attr.data-estado]="q.estado === 'respondida' ? 'respondida' : null"
                [attr.data-revisar]="q.revisar ? '' : null"
                [attr.aria-current]="q.numero === atual() ? 'true' : null"
                [attr.aria-label]="nome(q)"
                (click)="ir.emit(q.numero)"
              >
                {{ q.rotulo ?? q.numero }}
              </button>
            </li>
          }
        </ol>
      }
      <ul class="ucam-mapa__legenda">
        <li><span class="ucam-mapa__item" data-estado="respondida" aria-hidden="true"></span>Respondida</li>
        <li><span class="ucam-mapa__item" aria-hidden="true"></span>Em branco</li>
        <li><span class="ucam-mapa__item" data-revisar aria-hidden="true"></span>Marcada para revisar</li>
      </ul>
    </nav>
  `,
  styles: `
    /* A mesma folha do Trilho A (tools/build-css.mjs, MAPA DE QUESTÕES). */
    ucam-mapa-questoes .ucam-mapa {
      --ucam-mapa-colunas: 5;
      display: flex;
      flex-direction: column;
      gap: var(--ucam-space-stack-sm);
    }
    ucam-mapa-questoes .ucam-mapa__grupo {
      margin: 0;
      font-size: var(--ucam-typography-caption-font-size);
      color: var(--ucam-color-text-secondary);
    }
    ucam-mapa-questoes .ucam-mapa__grade {
      display: grid;
      grid-template-columns: repeat(var(--ucam-mapa-colunas), 2.25rem);
      gap: 0.375rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    /* O <li> do item largo ocupa a linha: na folha do A a grade não tem <li>
       entre ela e o botão largo, aqui tem. */
    ucam-mapa-questoes .ucam-mapa__li--largo {
      grid-column: 1 / -1;
      display: flex;
    }
    ucam-mapa-questoes .ucam-mapa__item {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 2.25rem;
      block-size: 2.25rem;
      padding: 0;
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-pill);
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      font: inherit;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
    }
    ucam-mapa-questoes .ucam-mapa__item:hover {
      background: var(--ucam-color-interaction-hover);
    }
    ucam-mapa-questoes .ucam-mapa__item:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: var(--ucam-focus-ring-offset);
    }
    ucam-mapa-questoes .ucam-mapa__item[data-estado='respondida'] {
      border-color: var(--ucam-color-action-primary-default);
      background: var(--ucam-color-action-primary-default);
      color: var(--ucam-color-text-on-brand);
    }
    ucam-mapa-questoes .ucam-mapa__item[aria-current='true'] {
      box-shadow:
        0 0 0 2px var(--ucam-color-surface-default),
        0 0 0 4px var(--ucam-color-text-primary);
    }
    ucam-mapa-questoes .ucam-mapa__item[data-revisar]::after {
      content: '';
      position: absolute;
      inset-block-start: -2px;
      inset-inline-end: -2px;
      inline-size: 0.625rem;
      block-size: 0.625rem;
      border: 2px solid var(--ucam-color-surface-default);
      border-radius: var(--ucam-radius-pill);
      background: var(--ucam-color-feedback-warning-border);
    }
    ucam-mapa-questoes .ucam-mapa__item--largo {
      inline-size: auto;
      padding-inline: var(--ucam-space-inline-sm);
      justify-content: flex-start;
      gap: var(--ucam-space-inline-xs);
    }
    ucam-mapa-questoes .ucam-mapa__legenda {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ucam-space-inline-sm);
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--ucam-typography-caption-font-size);
      color: var(--ucam-color-text-secondary);
    }
    ucam-mapa-questoes .ucam-mapa__legenda li {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }
    ucam-mapa-questoes .ucam-mapa__legenda .ucam-mapa__item {
      inline-size: 0.875rem;
      block-size: 0.875rem;
      cursor: default;
      pointer-events: none;
    }
    ucam-mapa-questoes .ucam-mapa__legenda .ucam-mapa__item[data-revisar]::after {
      inset-block-start: -3px;
      inset-inline-end: -3px;
      inline-size: 0.5rem;
      block-size: 0.5rem;
      border-width: 1px;
    }
  `,
})
export class UcamMapaQuestoes {
  /** As questões, na ordem da prova. */
  readonly itens = input.required<readonly UcamMapaItem[]>();
  /** O número da questão em que a pessoa está. */
  readonly atual = input<number | null>(null);
  /** Bolhas por linha. Fixo por prova: a posição vira memória, e a grade não reflui. */
  readonly colunas = input(5);
  /** O nome do mapa para quem navega por região. */
  readonly label = input('Questões da prova');

  /** A pessoa escolheu uma questão no mapa. */
  readonly ir = output<number>();

  /** Os cadernos na ordem em que aparecem; sem grupo, uma grade só. */
  protected readonly grupos = computed<Grupo[]>(() => {
    const saida: Grupo[] = [];
    for (const q of this.itens()) {
      const nome = q.grupo ?? null;
      let g = saida.find((x) => x.nome === nome);
      if (!g) saida.push((g = { nome, itens: [] }));
      g.itens.push(q);
    }
    return saida;
  });

  /** "Questão 7, respondida, marcada para revisar, atual" — por extenso. */
  protected nome(q: UcamMapaItem): string {
    return [
      q.rotulo ?? `Questão ${q.numero}`,
      q.estado === 'respondida' ? 'respondida' : 'em branco',
      q.revisar ? 'marcada para revisar' : '',
      q.numero === this.atual() ? 'atual' : '',
    ]
      .filter(Boolean)
      .join(', ');
  }
}
