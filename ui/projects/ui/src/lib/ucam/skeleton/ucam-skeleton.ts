import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';

/**
 * Contrato: spec/components/skeleton.json — ADR-005.
 *
 * Substitui o overlay CARREGANDO de tela cheia. O skeleton ocupa o lugar do
 * que está chegando; nunca cobre o que já está lá.
 *
 * É sempre decorativo: quem comunica o carregamento é a região que o contém,
 * com aria-busy. Do contrário seria conteúdo com contraste reprovado.
 */
const FORMA = {
  text: 'h-3.5 w-full',
  heading: 'h-6 w-2/5',
  block: 'h-20 w-full',
  circle: 'h-10 w-10 rounded-full',
  'table-row': 'h-3.5 w-full',
};

@Component({
  selector: 'ucam-skeleton',
  exportAs: 'ucamSkeleton',
  imports: [ZardSkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { 'aria-hidden': 'true', class: 'flex flex-col gap-2' },
  template: `
    @for (linha of linhas(); track $index) {
      <z-skeleton [class]="classeDa($index)" [style.width]="width()" />
    }
  `,
})
export class UcamSkeleton {
  readonly variant = input<keyof typeof FORMA>('text');
  readonly lines = input(1);
  readonly count = input(1);
  readonly width = input<string | null>(null);

  protected readonly linhas = computed(() =>
    Array.from({ length: Math.max(1, this.lines() * this.count()) }),
  );

  /** A última linha de texto encolhe, imitando fim de parágrafo. */
  protected classeDa(i: number): string {
    const base = FORMA[this.variant()];
    const ultima = i === this.linhas().length - 1;
    return this.variant() === 'text' && ultima && this.linhas().length > 1 ? base.replace('w-full', 'w-3/5') : base;
  }
}
