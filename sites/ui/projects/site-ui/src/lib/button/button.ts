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
  // A ESCRITA é tipada pelo contrato: literal errado no template não compila. O
  // transform ainda cai no padrão para o que chega sem tipo ($any, JS, dado de CMS).
  readonly variant = input<UcamSiteButtonVariant, UcamSiteButtonVariant | null | undefined>('primary', { transform: umDe(VARIANTES, 'primary') });
  readonly size = input<UcamSiteButtonSize, UcamSiteButtonSize | null | undefined>('md', { transform: umDe(TAMANHOS, 'md') });
  readonly inverse = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() =>
    classesDe('ucam-site-btn', this.variant(), this.size() === 'lg' && 'lg', this.inverse() && 'inverse'),
  );
}
