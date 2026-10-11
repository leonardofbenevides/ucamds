import { Directive, computed, input } from '@angular/core';
import { classesDe, umDe } from '../nucleo/classes';

export type UcamSiteTagTone = 'neutral' | 'brand' | 'info' | 'inverse';

const TONS = ['neutral', 'brand', 'info', 'inverse'] as const;

/**
 * Tag dos sites: uma palavra que classifica. Contrato: sites/spec/components/tag.json.
 * Nunca é clicável, então a diretiva não põe papel nem foco.
 */
@Directive({
  selector: '[ucamSiteTag]',
  host: { '[class]': 'classes()' },
})
export class UcamSiteTag {
  readonly tone = input<UcamSiteTagTone, UcamSiteTagTone | null | undefined>('neutral', { transform: umDe(TONS, 'neutral') });

  protected readonly classes = computed(() => classesDe('ucam-site-tag', this.tone() !== 'neutral' && this.tone()));
}
