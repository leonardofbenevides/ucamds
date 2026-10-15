import { ChangeDetectionStrategy, Component, Directive, ViewEncapsulation, booleanAttribute, computed, input } from '@angular/core';
import { classesDe, umDe } from '../nucleo/classes';

export type UcamSiteSectionHeadingAlign = 'start' | 'center';
export type UcamSiteSectionHeadingSize = 'section' | 'section-sm' | 'subtitle' | 'title';

const ALINHAMENTOS = ['start', 'center'] as const;
const TAMANHOS = ['section', 'section-sm', 'subtitle', 'title'] as const;

/**
 * Cabeçalho de seção. Contrato: sites/spec/components/section-heading.json.
 *
 * Componente de seletor de ATRIBUTO: o `<header>` (ou `<div>`) é do
 * consumidor e é a raiz do contrato, sem elemento hospedeiro no meio. O
 * título se chama `heading` porque `title` é a dica nativa do navegador.
 *
 * `count` é a contagem ao lado do título ("Disciplinas eletivas 12"): fica
 * DENTRO do heading, depois de um espaço de verdade, para o nome do título
 * dizer "eletivas 12" e não "eletivas12". `headingId` põe o id no próprio
 * heading, para a seção apontar para ele com aria-labelledby.
 */
@Component({
  selector: 'header[ucamSiteSectionHeading], div[ucamSiteSectionHeading]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()' },
  template: `@if (eyebrow()?.trim(); as texto) {<p class="ucam-site-section-heading__eyebrow">{{ texto }}</p>}
@if (level() === 3) {<h3 class="ucam-site-section-heading__title" [attr.id]="idDoTitulo()">{{ heading() }}@if (contagem(); as c) {{{ ' ' }}<span class="ucam-site-section-heading__count">{{ c }}</span>}</h3>} @else {<h2 class="ucam-site-section-heading__title" [attr.id]="idDoTitulo()">{{ heading() }}@if (contagem(); as c) {{{ ' ' }}<span class="ucam-site-section-heading__count">{{ c }}</span>}</h2>}
@if (lede()?.trim(); as texto) {<p class="ucam-site-section-heading__lede">{{ texto }}</p>}
<ng-content />`,
})
export class UcamSiteSectionHeading {
  readonly heading = input.required<string>();
  readonly eyebrow = input<string | null | undefined>(null);
  readonly lede = input<string | null | undefined>(null);
  /** A contagem ao lado do título: quantos itens a seção lista. */
  readonly count = input<number | string | null | undefined>(null);
  /** O id do heading, para a seção se nomear por aria-labelledby. */
  readonly headingId = input<string | null | undefined>(null);
  readonly align = input<UcamSiteSectionHeadingAlign, UcamSiteSectionHeadingAlign | null | undefined>('start', { transform: umDe(ALINHAMENTOS, 'start') });
  readonly size = input<UcamSiteSectionHeadingSize, UcamSiteSectionHeadingSize | null | undefined>('section', { transform: umDe(TAMANHOS, 'section') });
  readonly inverse = input(false, { transform: booleanAttribute });
  /** Nível do título: 2 por padrão, 3 quando a seção está dentro de outra. */
  readonly level = input<2 | 3, 2 | 3 | '2' | '3' | null | undefined>(2, { transform: (v) => (Number(v) === 3 ? 3 : 2) });

  protected readonly contagem = computed(() => {
    const c = this.count();
    return typeof c === 'number' || typeof c === 'string' ? String(c).trim() || null : null;
  });
  protected readonly idDoTitulo = computed(() => this.headingId()?.trim() || null);
  protected readonly classes = computed(() =>
    classesDe(
      'ucam-site-section-heading',
      this.align() === 'center' && 'center',
      this.size() === 'section-sm' && 'sm',
      this.size() === 'subtitle' && 'subtitulo',
      this.size() === 'title' && 'titulo',
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
