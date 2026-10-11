import { ChangeDetectionStrategy, Component, Directive, ViewEncapsulation, booleanAttribute, computed, input } from '@angular/core';
import { classesDe, umDe } from '../nucleo/classes';

export type UcamSiteSectionHeadingAlign = 'start' | 'center';
export type UcamSiteSectionHeadingSize = 'section' | 'section-sm';

const ALINHAMENTOS = ['start', 'center'] as const;
const TAMANHOS = ['section', 'section-sm'] as const;

/**
 * Cabeçalho de seção. Contrato: sites/spec/components/section-heading.json.
 *
 * Componente de seletor de ATRIBUTO: o `<header>` (ou `<div>`) é do
 * consumidor e é a raiz do contrato, sem elemento hospedeiro no meio. O
 * título se chama `heading` porque `title` é a dica nativa do navegador.
 */
@Component({
  selector: 'header[ucamSiteSectionHeading], div[ucamSiteSectionHeading]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `@if (eyebrow()?.trim(); as texto) {<p class="ucam-site-section-heading__eyebrow">{{ texto }}</p>}
@if (level() === 3) {<h3 class="ucam-site-section-heading__title">{{ heading() }}</h3>} @else {<h2 class="ucam-site-section-heading__title">{{ heading() }}</h2>}
@if (lede()?.trim(); as texto) {<p class="ucam-site-section-heading__lede">{{ texto }}</p>}
<ng-content />`,
})
export class UcamSiteSectionHeading {
  readonly heading = input.required<string>();
  readonly eyebrow = input<string | null | undefined>(null);
  readonly lede = input<string | null | undefined>(null);
  readonly align = input<UcamSiteSectionHeadingAlign, UcamSiteSectionHeadingAlign | null | undefined>('start', { transform: umDe(ALINHAMENTOS, 'start') });
  readonly size = input<UcamSiteSectionHeadingSize, UcamSiteSectionHeadingSize | null | undefined>('section', { transform: umDe(TAMANHOS, 'section') });
  readonly inverse = input(false, { transform: booleanAttribute });
  /** Nível do título: 2 por padrão, 3 quando a seção está dentro de outra. */
  readonly level = input<2 | 3, 2 | 3 | '2' | '3' | null | undefined>(2, { transform: (v) => (Number(v) === 3 ? 3 : 2) });

  protected readonly classes = computed(() =>
    classesDe(
      'ucam-site-section-heading',
      this.align() === 'center' && 'center',
      this.size() === 'section-sm' && 'sm',
      this.inverse() && 'inverse',
    ),
  );
}

/** A fileira de ações do cabeçalho de seção: `<div ucamSiteSectionHeadingAcoes>`. */
@Directive({
  selector: '[ucamSiteSectionHeadingAcoes]',
  host: { class: 'ucam-site-section-heading__acoes' },
})
export class UcamSiteSectionHeadingAcoes {}
