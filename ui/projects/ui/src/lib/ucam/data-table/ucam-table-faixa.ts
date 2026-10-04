import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

import { type UcamIconName } from '../icon/ucam-icon';
import { UcamIconTile, type UcamIconTileTone } from '../icon-tile/ucam-icon-tile';

/**
 * Contrato: spec/components/data-table.json, parte "faixa".
 *
 * A FAIXA NO TOPO DA TABELA: o que vale para a tabela inteira e não é filtro
 * nem ação em lote. Dentro da moldura da tabela e antes do cabeçalho de
 * colunas — o mesmo lugar da .ucam-table-faixa do Trilho A. Ladrilho, título
 * e apoio à esquerda; a ação (conteúdo projetado) à direita; quebra para
 * baixo quando aperta.
 *
 * Atributo, não elemento: a faixa é um <div> do cartão da tabela, e o
 * seletor de atributo deixa a marcação igual à do Trilho A.
 *
 * Caso de referência: a sugestão automatizada da análise da isenção — quando
 * foi feita, o que sugeriu, a legenda da marca e "Aplicar N sugestões".
 *
 *   <ucam-data-table …>
 *     <div ucamTableFaixa icon="sparkles" tone="brand" titulo="Sugestão automatizada" [apoio]="resumoSugestao()">
 *       <ucam-button (click)="aplicarSugestoes()">Aplicar {{ firmes() }} sugestões</ucam-button>
 *     </div>
 *   </ucam-data-table>
 *
 * O apoio QUEBRA em vez de cortar com reticências (diferente do cabeçalho de
 * cartão): o fim da frase costuma ser a legenda da marca, e cortada a marca
 * fica sem explicação. Para apoio com marcação (um ícone na legenda), projete
 * em [ucamFaixaApoio] em vez de usar o input.
 */
@Component({
  selector: '[ucamTableFaixa]',
  exportAs: 'ucamTableFaixa',
  imports: [UcamIconTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-table-faixa' },
  template: `
    <div class="ucam-table-faixa__cabecalho">
      @if (icon(); as i) {
        <ucam-icon-tile [icon]="i" [tone]="tone()" />
      }
      <span class="ucam-table-faixa__texto">
        <span class="ucam-table-faixa__titulo">{{ titulo() }}</span>
        <span class="ucam-table-faixa__apoio">@if (apoio(); as a) {{{ a }}}<ng-content select="[ucamFaixaApoio]" /></span>
      </span>
    </div>
    <ng-content />
  `,
  styles: `
    /* Espelho da .ucam-table-faixa de tools/build-css.mjs. */
    .ucam-table-faixa[ucamTableFaixa] {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--ucam-space-inline-md);
      padding: var(--ucam-space-inset-md);
      border-block-end: 1px solid var(--ucam-color-border-subtle);
    }
    .ucam-table-faixa .ucam-table-faixa__cabecalho {
      display: flex;
      align-items: center;
      gap: var(--ucam-space-inline-sm);
      flex: 1 1 20rem;
      min-inline-size: 0;
    }
    .ucam-table-faixa .ucam-table-faixa__texto {
      display: flex;
      flex-direction: column;
      min-inline-size: 0;
    }
    .ucam-table-faixa .ucam-table-faixa__titulo {
      font-size: var(--ucam-typography-label-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
      line-height: var(--ucam-typography-label-line-height);
      color: var(--ucam-color-text-primary);
    }
    .ucam-table-faixa .ucam-table-faixa__apoio {
      font-size: var(--ucam-typography-caption-font-size);
      line-height: var(--ucam-typography-caption-line-height);
      color: var(--ucam-color-text-secondary);
    }
    .ucam-table-faixa .ucam-table-faixa__apoio:empty { display: none; }
  `,
})
export class UcamTableFaixa {
  /** O que a faixa é: "Sugestão automatizada". */
  readonly titulo = input.required<string>();
  /** Quando foi feita, o que disse, a legenda da marca. Quebra, não corta. */
  readonly apoio = input<string | null>(null);
  readonly icon = input<UcamIconName | null>(null);
  readonly tone = input<UcamIconTileTone>('neutral');
}
