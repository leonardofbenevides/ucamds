import { Directive, ElementRef, Renderer2, computed, inject, input } from '@angular/core';
import { classesDe, umDe } from '../nucleo/classes';

export type UcamSiteAvatarSize = 'sm' | 'md' | 'lg';
export type UcamSiteAvatarShape = 'person' | 'logo';

const TAMANHOS = ['sm', 'md', 'lg'] as const;
const FORMAS = ['person', 'logo'] as const;

/**
 * Avatar dos sites. Contrato: sites/spec/components/avatar.json.
 *
 * Com `name`, o avatar É a identificação: vira imagem com rótulo. Sem `name`,
 * o nome está escrito ao lado e o avatar é decorativo. As iniciais ou a
 * `<img>` são conteúdo do consumidor.
 */
@Directive({
  selector: '[ucamSiteAvatar]',
  host: {
    '[class]': 'classes()',
    '[attr.role]': 'rotulo() ? "img" : null',
    '[attr.aria-label]': 'rotulo()',
    '[attr.aria-hidden]': 'rotulo() ? null : "true"',
  },
})
export class UcamSiteAvatar {
  readonly size = input<UcamSiteAvatarSize, unknown>('md', { transform: umDe(TAMANHOS, 'md') });
  readonly shape = input<UcamSiteAvatarShape, unknown>('person', { transform: umDe(FORMAS, 'person') });
  readonly name = input<string | null | undefined>(null);

  constructor() {
    // Escrita como atributo (name="Ana de Souza"), a entrada ficaria no DOM
    // como um `name` num <span>, que não é atributo dele. O portão de paridade
    // acusou; o nome que conta é o aria-label.
    inject(Renderer2).removeAttribute(inject(ElementRef).nativeElement, 'name');
  }

  /** O nome aparado, ou null quando não há o que anunciar. */
  protected readonly rotulo = computed(() => this.name()?.trim() || null);

  protected readonly classes = computed(() =>
    classesDe('ucam-site-avatar', this.size() !== 'md' && this.size(), this.shape() === 'logo' && 'logo'),
  );
}
