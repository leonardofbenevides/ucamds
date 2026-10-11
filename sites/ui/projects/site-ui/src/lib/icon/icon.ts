import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, input } from '@angular/core';
import { UCAM_SITE_SPRITE } from '../nucleo/provedor';

/**
 * Ícone do sprite compartilhado: `<svg ucamSiteIcon="arrowRight"></svg>`.
 *
 * Sempre decorativo (aria-hidden): nos sites o ícone acompanha um texto, e
 * quem precisa de nome acessível o põe no elemento que o hospeda.
 *
 * É COMPONENTE, com o <use> no template, e não diretiva que cria o nó por
 * Renderer2: nó criado fora do template não é hidratado. O servidor
 * serializava o <use>, o cliente acrescentava outro ao hidratar e, na troca
 * de ícone, o do servidor ficava órfão por baixo do novo (revisão de
 * 10/10/2026, medido: 2 <use> no servidor, 4 no cliente).
 */
@Component({
  selector: 'svg[ucamSiteIcon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ic', 'aria-hidden': 'true' },
  template: `@if (ucamSiteIcon(); as nome) {<svg:use [attr.href]="sprite + '#i-' + nome" />}`,
})
export class UcamSiteIcon {
  readonly ucamSiteIcon = input.required<string>();

  protected readonly sprite = inject(UCAM_SITE_SPRITE);
}
