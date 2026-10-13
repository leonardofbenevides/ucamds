import { ChangeDetectionStrategy, Component, ViewEncapsulation, booleanAttribute, computed, input } from '@angular/core';
import { classesDe } from '../nucleo/classes';

export interface UcamSiteBreadcrumbItem {
  label: string;
  href?: string | null;
}

/**
 * Trilha de navegação. Contrato: sites/spec/components/breadcrumb.json.
 *
 * Recebe a trilha como dado, do início até a página atual. O ÚLTIMO item é
 * sempre a página atual — texto com aria-current, nunca link, tenha href ou
 * não: a página atual não é link para si mesma.
 *
 * Item nulo ou sem rótulo não entra: a trilha vem de um CMS, e um buraco no
 * dado não pode virar link sem nome nem derrubar a página.
 */
@Component({
  selector: 'nav[ucamSiteBreadcrumb]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { '[class]': 'classes()', '[attr.aria-label]': 'rotulo()' },
  template: `@if (trilha().length) {<ol class="ucam-site-breadcrumb__list">@for (item of trilha(); track $index; let ultimo = $last) {<li class="ucam-site-breadcrumb__item">@if (ultimo) {<span aria-current="page">{{ item.label }}</span>} @else if (item.href) {<a [attr.href]="item.href">{{ item.label }}</a>} @else {<span>{{ item.label }}</span>}</li>}</ol>}`,
})
export class UcamSiteBreadcrumb {
  readonly items = input.required<UcamSiteBreadcrumbItem[], UcamSiteBreadcrumbItem[] | null | undefined>({ transform: (v) => v ?? [] });
  readonly inverse = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null | undefined>('Trilha');

  protected readonly trilha = computed(() => this.items().filter((i) => i?.label?.trim()));
  /** Navegação sem nome não se distingue da principal: vazio volta ao padrão. */
  protected readonly rotulo = computed(() => this.ariaLabel()?.trim() || 'Trilha');
  protected readonly classes = computed(() => classesDe('ucam-site-breadcrumb', this.inverse() && 'inverse'));
}
