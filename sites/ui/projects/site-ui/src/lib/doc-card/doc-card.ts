import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';
import { UcamSiteIcon } from '../icon/icon';
import { UcamSiteIconChip } from '../icon-chip/icon-chip';

/**
 * Cartão de documentos: a lista do que levar para um caso. Contrato:
 * sites/spec/components/doc-card.json.
 *
 * Título, ícone do cabeçalho e os itens, como dado. Item vazio não vira
 * linha, e sem itens não há lista.
 */
@Component({
  selector: 'section[ucamSiteDocCard]',
  imports: [UcamSiteIcon, UcamSiteIconChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ucam-site-doc-card' },
  template: `<div class="ucam-site-doc-card__header"><span ucamSiteIconChip><svg [ucamSiteIcon]="icone()"></svg></span><h3 class="ucam-site-doc-card__label">{{ label() }}</h3></div>@if (linhas().length) {<ul class="ucam-site-doc-card__list">@for (item of linhas(); track $index) {<li class="ucam-site-doc-card__item"><svg ucamSiteIcon="check"></svg> {{ item }}</li>}</ul>}`,
})
export class UcamSiteDocCard {
  readonly label = input.required<string>();
  readonly icon = input<string | null | undefined>('fileText');
  readonly items = input.required<string[], string[] | null | undefined>({ transform: (v) => v ?? [] });

  protected readonly icone = computed(() => this.icon()?.trim() || 'fileText');
  protected readonly linhas = computed(() => this.items().filter((i) => typeof i === 'string' && i.trim()));
}
