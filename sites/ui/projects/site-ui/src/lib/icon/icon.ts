import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';
import { UCAM_SITE_SPRITE } from '../nucleo/provedor';

/**
 * Ícone do sprite compartilhado: `<svg ucamSiteIcon="arrowRight"></svg>`.
 *
 * Sempre decorativo (aria-hidden): nos sites o ícone acompanha um texto, e
 * quem precisa de nome acessível o põe no elemento que o hospeda. O <use> é
 * criado pelo Renderer2, não pelo document, para sair igual no servidor.
 */
@Directive({
  selector: 'svg[ucamSiteIcon]',
  host: { class: 'ic', 'aria-hidden': 'true' },
})
export class UcamSiteIcon {
  readonly ucamSiteIcon = input.required<string>();

  private readonly el = inject<ElementRef<SVGElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly sprite = inject(UCAM_SITE_SPRITE);
  private uso: SVGUseElement | null = null;

  constructor() {
    effect(() => {
      const nome = this.ucamSiteIcon();
      if (this.uso) {
        this.renderer.removeChild(this.el.nativeElement, this.uso);
        this.uso = null;
      }
      if (!nome) return;
      this.uso = this.renderer.createElement('use', 'svg') as SVGUseElement;
      this.renderer.setAttribute(this.uso, 'href', `${this.sprite}#i-${nome}`);
      this.renderer.appendChild(this.el.nativeElement, this.uso);
    });
  }
}
