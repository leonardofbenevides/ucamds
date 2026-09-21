import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/icon-tile.json
 *
 * O fundo atrás de um ícone, onde o ícone precisa discriminar um item de seus
 * irmãos: a grade de 25 módulos do Portal, a lista de setores, os cartões de
 * escolha. 36 usos nas telas e nenhuma implementação Angular até agora.
 *
 * Não é botão, não é avatar, não é selo. O ladrilho NÃO recebe clique nem
 * foco: quem recebe é o cartão ou o item de lista em volta — por isso o host
 * é `aria-hidden` e não entra na ordem de tabulação. Quem nomeia o item é o
 * rótulo ao lado, e o ícone aqui é decorativo.
 */
export type UcamIconTileTone =
  | 'neutral'
  | 'brand'
  | 'academico'
  | 'financeiro'
  | 'atendimento'
  | 'gestao'
  | 'pessoas'
  | 'acervo';
export type UcamIconTileSize = 'sm' | 'md';

@Component({
  selector: 'ucam-icon-tile',
  exportAs: 'ucamIconTile',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <span [class]="classes()" aria-hidden="true">
      <ucam-icon [name]="icon()" [size]="size() === 'sm' ? 'sm' : 'md'" />
    </span>
  `,
  styles: `
    ucam-icon-tile .ucam-icon-tile {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 2.25rem;
      block-size: 2.25rem;
      border-radius: var(--ucam-radius-control);
      background: var(--ucam-color-surface-sunken);
      color: var(--ucam-color-text-secondary);
      /* Não encolhe: num item de lista apertado, um ladrilho que cede largura
         vira um retângulo e deixa de ser ladrilho. */
      flex: none;
    }
    /* A classe do Trilho A é --marca, não --brand: o CSS puro está em
       português e o nome da prop, em inglês, segue a API dos outros
       componentes. Renomear qualquer um dos dois quebraria o outro trilho. */
    ucam-icon-tile .ucam-icon-tile--marca {
      background: color-mix(in srgb, var(--ucam-color-action-primary-default) 12%, transparent);
      color: var(--ucam-color-action-primary-default);
    }
    ucam-icon-tile .ucam-icon-tile--sm {
      inline-size: 1.75rem;
      block-size: 1.75rem;
      border-radius: var(--ucam-radius-md);
    }
  `,
})
export class UcamIconTile {
  /**
   * Um desenho por conceito em todo o parque. A regra do acervo curado pesa
   * mais aqui do que em qualquer outro lugar, porque o ladrilho existe
   * justamente para o ícone discriminar um item dos irmãos.
   */
  readonly icon = input.required<UcamIconName>();
  readonly tone = input<UcamIconTileTone>('neutral');
  readonly size = input<UcamIconTileSize>('md');

  protected readonly classes = computed(() => {
    const partes = ['ucam-icon-tile'];
    const tom = this.tone();
    // brand → --marca (o CSS puro está em português); as categorias (ADR-032)
    // já nascem com o nome da classe, e a pintura vem da folha do Trilho A.
    if (tom === 'brand') partes.push('ucam-icon-tile--marca');
    else if (tom !== 'neutral') partes.push(`ucam-icon-tile--${tom}`);
    if (this.size() === 'sm') partes.push('ucam-icon-tile--sm');
    return partes.join(' ');
  });
}
