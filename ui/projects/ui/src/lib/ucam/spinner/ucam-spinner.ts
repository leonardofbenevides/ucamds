import { booleanAttribute, ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

import { UcamIcon, type UcamIconSize } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/spinner.json (ADR-074)
 *
 * O círculo que gira enquanto algo curto termina. O giro é o mesmo do Trilho
 * A (.ucam-spinner: 1s linear, para com movimento reduzido), e quem informa
 * nunca é o círculo:
 *
 *  - com label, o hospedeiro é role=status e a frase é anunciada;
 *  - sem label, é decorativo, e o controle em volta diz aria-busy.
 *
 * Bloco de conteúdo carregando é UcamSkeleton; espera longa com quantidade
 * conhecida é UcamProgress.
 */
@Component({
  selector: 'ucam-spinner',
  exportAs: 'ucamSpinner',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'inline-flex items-center gap-2',
    '[attr.role]': "label() ? 'status' : null",
    '[attr.aria-hidden]': "label() ? null : 'true'",
  },
  template: `
    <ucam-icon name="loaderCircle" [size]="size()" class="ucam-spinner" />
    @if (label()) {
      <span [class.sr-only]="labelHidden()">{{ label() }}</span>
    }
  `,
  styles: `
    ucam-spinner .ucam-spinner { animation: ucam-girar 1s linear infinite; }
    @keyframes ucam-girar { to { rotate: 1turn; } }
    @media (prefers-reduced-motion: reduce) {
      ucam-spinner .ucam-spinner { animation: none; }
    }
  `,
})
export class UcamSpinner {
  /** O que está carregando: "Abrindo o SIGFIN…". Sem ele, decorativo. */
  readonly label = input<string | null>(null);
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly size = input<UcamIconSize>('sm');
}
