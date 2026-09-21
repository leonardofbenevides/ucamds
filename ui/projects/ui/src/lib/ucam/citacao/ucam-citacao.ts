import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

/**
 * Contrato: spec/components/citacao.json
 *
 * A fala de uma pessoa reproduzida numa tela que fala com a voz do sistema —
 * o pedido do requerente, a justificativa de quem indeferiu. Veste a mesma
 * superfície da mensagem da linha do tempo porque é o mesmo fato, alguém
 * falando; mas tem nome próprio e não depende do desenho da linha do tempo.
 */
@Component({
  selector: 'ucam-citacao',
  exportAs: 'ucamCitacao',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block' },
  template: `
    <!-- Com autoria, figure + figcaption: é o que liga o nome ao texto para
         o leitor de tela. Sem ela, o blockquote basta. -->
    @if (autor(); as a) {
      <figure class="m-0">
        <blockquote class="ucam-citacao"><ng-container *ngTemplateOutlet="texto" /></blockquote>
        <figcaption class="ucam-citacao__autoria">{{ a }}</figcaption>
      </figure>
    } @else {
      <blockquote class="ucam-citacao"><ng-container *ngTemplateOutlet="texto" /></blockquote>
    }
    <ng-template #texto><ng-content /></ng-template>
  `,
  styles: `
    ucam-citacao .ucam-citacao {
      margin: 0;
      background: var(--ucam-color-surface-subtle);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
      padding: var(--ucam-space-inset-sm) var(--ucam-space-inset-md);
      font-size: var(--ucam-typography-body-sm-font-size);
      color: var(--ucam-color-text-primary);
    }
    ucam-citacao .ucam-citacao__autoria {
      margin-block-start: var(--ucam-space-inline-xs);
      font-size: var(--ucam-typography-caption-font-size);
      color: var(--ucam-color-text-secondary);
    }
  `,
})
export class UcamCitacao {
  /** Quem escreveu. Nulo quando a tela já diz o autor logo acima. */
  readonly autor = input<string | null>(null);
}
