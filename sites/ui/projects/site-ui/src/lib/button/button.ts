import { Directive, booleanAttribute, computed, input } from '@angular/core';
import { classesDe, umDe } from '../nucleo/classes';

export type UcamSiteButtonVariant = 'primary' | 'secondary' | 'ghost';
export type UcamSiteButtonSize = 'md' | 'lg';

const VARIANTES = ['primary', 'secondary', 'ghost'] as const;
const TAMANHOS = ['md', 'lg'] as const;

/**
 * Botão dos sites. Contrato: sites/spec/components/button.json.
 *
 * Diretiva sobre `<a>` ou `<button>`: nos sites o botão é quase sempre uma
 * âncora, e `href`, `routerLink`, `type` e `disabled` continuam nativos.
 */
@Directive({
  selector: 'a[ucamSiteButton], button[ucamSiteButton]',
  host: { '[class]': 'classes()' },
})
export class UcamSiteButton {
  readonly variant = input<UcamSiteButtonVariant, unknown>('primary', { transform: umDe(VARIANTES, 'primary') });
  readonly size = input<UcamSiteButtonSize, unknown>('md', { transform: umDe(TAMANHOS, 'md') });
  readonly inverse = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() =>
    classesDe('ucam-site-btn', this.variant(), this.size() === 'lg' && 'lg', this.inverse() && 'inverse'),
  );
}
