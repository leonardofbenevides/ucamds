import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/alert.json
 *
 * Mensagem no fluxo da página, ancorada ao conteúdo a que se refere. Não
 * flutua, não some sozinha e não interrompe: mensagem que desaparece é toast,
 * mensagem que bloqueia é diálogo, e nenhum dos dois é este componente.
 *
 * TOAST ESTÁ FORA DO CATÁLOGO POR DECISÃO — mensagem que some não pode
 * carregar informação necessária. Por isso a confirmação de ação rápida não
 * vira alerta empilhado no topo: o caminho é o próprio controle dizer que
 * terminou (o botão sai de loading, a linha salva pisca o realce). Alerta de
 * sucesso só entra quando a confirmação carrega informação que sobrevive à
 * tela, como o número do protocolo gerado.
 */
export type UcamAlertTone = 'info' | 'success' | 'warning' | 'danger';
export type UcamAlertLive = 'off' | 'polite' | 'assertive';

/**
 * Um tom, um ícone, em todo o parque. O ícone existe porque o tom NUNCA é o
 * único portador do significado (WCAG 1.4.1) — foi a ausência do ícone e da
 * palavra que deixou o erro de login do Portal legível só para quem enxerga
 * a cor.
 */
const ICONE: Record<UcamAlertTone, UcamIconName> = {
  info: 'info',
  success: 'circleCheck',
  warning: 'triangleAlert',
  danger: 'circleAlert',
};

/**
 * `off` não declara região viva NENHUMA, e isso é o padrão de propósito: a
 * maior parte dos alertas já está na página quando ela carrega, e role=alert
 * em conteúdo estático não anuncia nada — só faz o texto ser relido a cada
 * alteração vizinha.
 */
const PAPEL: Record<UcamAlertLive, string | null> = {
  off: null,
  polite: 'status',
  assertive: 'alert',
};

@Component({
  selector: 'ucam-alert',
  exportAs: 'ucamAlert',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    @if (!dispensado()) {
      <div [class]="classes()" [attr.role]="papel()">
        <ucam-icon [name]="iconeEfetivo()" size="sm" aria-hidden="true" />

        <div class="ucam-alert__corpo">
          @if (title(); as t) {
            <p class="ucam-alert__titulo">{{ t }}</p>
          }
          <ng-content />
          <!-- As ações do alerta ficam DENTRO dele, depois da mensagem: uma
               ação colocada fora perde o vínculo com a condição que a explica. -->
          <ng-content select="[ucamAlertAcoes]" />
        </div>

        @if (dismissible()) {
          <button
            type="button"
            class="ucam-alert__fechar"
            [attr.aria-label]="rotuloFechar()"
            (click)="dispensar()"
          >
            <ucam-icon name="x" size="sm" />
          </button>
        }
      </div>
    }
  `,
  styles: `
    ucam-alert .ucam-alert {
      display: flex;
      gap: var(--ucam-space-inline-sm);
      padding: var(--ucam-space-inset-md);
      border-inline-start: 3px solid;
      border-radius: var(--ucam-radius-sm);
    }
    ucam-alert .ucam-alert--info {
      background: var(--ucam-color-feedback-info-background);
      color: var(--ucam-color-feedback-info-foreground);
      border-color: var(--ucam-color-feedback-info-border);
    }
    ucam-alert .ucam-alert--success {
      background: var(--ucam-color-feedback-success-background);
      color: var(--ucam-color-feedback-success-foreground);
      border-color: var(--ucam-color-feedback-success-border);
    }
    ucam-alert .ucam-alert--warning {
      background: var(--ucam-color-feedback-warning-background);
      color: var(--ucam-color-feedback-warning-foreground);
      border-color: var(--ucam-color-feedback-warning-border);
    }
    ucam-alert .ucam-alert--danger {
      background: var(--ucam-color-feedback-danger-background);
      color: var(--ucam-color-feedback-danger-foreground);
      border-color: var(--ucam-color-feedback-danger-border);
    }

    ucam-alert .ucam-alert ucam-icon {
      flex: none;
      margin-block-start: 0.1rem;
      color: inherit;
    }
    ucam-alert .ucam-alert__corpo {
      flex: 1;
      min-inline-size: 0;
    }
    ucam-alert .ucam-alert__corpo > :first-child { margin-block-start: 0; }
    ucam-alert .ucam-alert__corpo > :last-child { margin-block-end: 0; }
    ucam-alert .ucam-alert__titulo {
      margin: 0 0 var(--ucam-space-1);
      font-size: var(--ucam-typography-label-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
    }

    ucam-alert .ucam-alert__fechar {
      flex: none;
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 1.5rem;
      block-size: 1.5rem;
      margin: -0.125rem -0.25rem -0.125rem 0;
      padding: 0;
      border: 0;
      border-radius: var(--ucam-radius-sm);
      background: none;
      color: inherit;
      cursor: pointer;
      opacity: 0.7;
      transition:
        opacity var(--ucam-motion-duration-state) ease,
        background-color var(--ucam-motion-duration-state) ease;
    }
    ucam-alert .ucam-alert__fechar:hover {
      opacity: 1;
      background: color-mix(in srgb, currentColor 12%, transparent);
    }
    /* O desenho tem 24px; a área efetiva precisa dos 24px cheios da 2.5.8 —
       aqui o próprio botão já os tem, e o ::after existe para o caso de o
       tamanho do ícone encolher no futuro sem ninguém revisitar o alvo. */
    ucam-alert .ucam-alert__fechar::after {
      content: '';
      position: absolute;
      inset: -0.125rem;
    }
    ucam-alert .ucam-alert__fechar { position: relative; }

    @media (prefers-reduced-motion: reduce) {
      ucam-alert .ucam-alert__fechar { transition: none; }
    }
  `,
})
export class UcamAlert {
  readonly tone = input<UcamAlertTone>('info');
  /** Título de uma linha. Só quando a mensagem passa de duas frases. */
  readonly title = input<string | null>(null);
  /**
   * Falso por padrão: a maioria dos alertas descreve uma condição que continua
   * verdadeira depois de fechada, e fechá-la só esconde a explicação.
   */
  readonly dismissible = input(false);
  readonly live = input<UcamAlertLive>('off');
  /** Sobrescreve o ícone do tom. Para o símbolo mais preciso do domínio. */
  readonly icon = input<UcamIconName | null>(null);

  readonly dismissed = output<void>();

  private readonly fechado = signal(false);

  protected readonly dispensado = this.fechado.asReadonly();
  protected readonly papel = computed(() => PAPEL[this.live()]);
  protected readonly iconeEfetivo = computed(() => this.icon() ?? ICONE[this.tone()]);
  protected readonly classes = computed(() => `ucam-alert ucam-alert--${this.tone()}`);

  /**
   * "Fechar" sozinho é o mesmo nome em cinco alertas da mesma tela. O título,
   * quando existe, distingue qual está sendo fechado.
   */
  protected readonly rotuloFechar = computed(() =>
    this.title() ? `Fechar alerta: ${this.title()}` : 'Fechar alerta',
  );

  protected dispensar(): void {
    this.fechado.set(true);
    this.dismissed.emit();
  }

  constructor() {
    if (ngDevMode) {
      queueMicrotask(() => {
        // Alerta assertivo interrompe a leitura corrente. Num alerta que já
        // estava na tela isso não anuncia a novidade — relê o que a pessoa já
        // ouviu, no meio de outra coisa.
        if (this.live() === 'assertive' && !this.dismissible() && !this.title()) {
          // Não é erro: é o caso legítimo do erro de envio. O aviso fica para
          // o desenvolvedor conferir se o alerta REALMENTE surgiu agora.
          console.warn(
            '[ucam-alert] live="assertive" só vale para alerta que aparece em resposta a uma ação. Alerta presente na carga da página usa live="off". Ver spec/components/alert.json.',
          );
        }
      });
    }
  }
}

declare const ngDevMode: boolean;
