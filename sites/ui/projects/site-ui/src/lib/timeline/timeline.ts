import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';

export interface UcamSiteMilestone {
  year: string | number;
  title: string;
  /** Uma frase sobre o marco. Opcional. */
  text?: string | null;
}

/**
 * Linha do tempo. Contrato: sites/spec/components/timeline.json.
 *
 *   <ol ucamSiteTimeline [items]="[{ year: 2000, title: 'Mestrado implantado', text: 'Reconhecido pela CAPES no mesmo ano.' }]"></ol>
 *
 * Uma lista ordenada: a ordem é a do dado, do mais antigo ao mais novo. O fio
 * e o ponto são da folha, decorativos. No documento, o ano vem antes do
 * título. A lista leva role="list": sem marcador, o Safari deixa de anunciá-la.
 * Marco sem ano ou sem título não entra.
 */
@Component({
  selector: 'ol[ucamSiteTimeline]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-timeline', role: 'list' },
  template: `@for (m of marcos(); track $index) {<li class="ucam-site-timeline__item"><span class="ucam-site-timeline__year">{{ m.year }}</span><p class="ucam-site-timeline__title">{{ m.title }}</p>@if (m.text) {<p class="ucam-site-timeline__text">{{ m.text }}</p>}</li>}`,
})
export class UcamSiteTimeline {
  readonly items = input.required<UcamSiteMilestone[], UcamSiteMilestone[] | null | undefined>({ transform: (v) => (Array.isArray(v) ? v : []) });

  protected readonly marcos = computed(() =>
    this.items()
      .map((m) => ({
        year: typeof m?.year === 'number' || typeof m?.year === 'string' ? String(m.year).trim() : '',
        title: typeof m?.title === 'string' ? m.title.trim() : '',
        text: typeof m?.text === 'string' ? m.text.trim() : '',
      }))
      .filter((m) => m.year && m.title),
  );
}
