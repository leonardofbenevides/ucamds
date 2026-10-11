import { Directive, computed, input } from '@angular/core';
import { classesDe, umDe } from '../nucleo/classes';

export type UcamSiteIconChipSize = 'md' | 'lg';
export type UcamSiteIconChipTone = 'brand' | 'neutral' | 'inverse';

const TAMANHOS = ['md', 'lg'] as const;
const TONS = ['brand', 'neutral', 'inverse'] as const;

/**
 * Pastilha de ícone. Contrato: sites/spec/components/icon-chip.json.
 * Decorativa: acompanha um título que está fora dela. O ícone é o
 * `<svg ucamSiteIcon>` que o consumidor põe dentro.
 */
@Directive({
  selector: '[ucamSiteIconChip]',
  host: { '[class]': 'classes()', 'aria-hidden': 'true' },
})
export class UcamSiteIconChip {
  readonly size = input<UcamSiteIconChipSize, unknown>('md', { transform: umDe(TAMANHOS, 'md') });
  readonly tone = input<UcamSiteIconChipTone, unknown>('brand', { transform: umDe(TONS, 'brand') });

  protected readonly classes = computed(() =>
    classesDe('ucam-site-icon-chip', this.size() === 'lg' && 'lg', this.tone() !== 'brand' && this.tone()),
  );
}
