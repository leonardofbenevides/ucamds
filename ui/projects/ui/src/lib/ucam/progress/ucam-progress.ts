import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

/**
 * Contrato: spec/components/progress.json
 *
 * Parte da base (z-progress), mas NÃO a embrulha: o ARIA dela é onde os dois
 * divergem. A base crava aria-valuemin=0 e aria-valuemax=100 no host e aceita
 * só porcentagem; o contrato exige o total REAL (24 de 40 requerimentos), que
 * é o número que quem distribui conhece, mais aria-valuetext e nome acessível
 * obrigatório. Sobrescrever atributo de host da base a partir de fora é
 * frágil e ficaria calado quando quebrasse. O que a base entrega de fato aqui
 * são seis declarações de CSS — copiadas, com a geometria da spec.
 */
export type UcamProgressTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const PREENCHIMENTO: Record<UcamProgressTone, string> = {
  neutral: 'bg-muted-foreground',
  info: 'bg-[var(--ucam-color-feedback-info-foreground)]',
  success: 'bg-[var(--ucam-color-feedback-success-foreground)]',
  warning: 'bg-[var(--ucam-color-feedback-warning-foreground)]',
  danger: 'bg-[var(--ucam-color-feedback-danger-foreground)]',
};

let seq = 0;

@Component({
  selector: 'ucam-progress',
  exportAs: 'ucamProgress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  /** Ver o porquê do contents em ucam-description-list. */
  host: { class: 'contents' },
  template: `
    <div
      role="progressbar"
      class="block w-full bg-muted rounded-full overflow-hidden"
      [class]="size() === 'sm' ? 'h-1' : 'h-2'"
      [attr.aria-label]="label()"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="max()"
      [attr.aria-valuenow]="valorLimitado()"
      [attr.aria-valuetext]="valueText()"
    >
      <span
        class="block h-full rounded-[inherit] transition-[width] duration-200 motion-reduce:transition-none"
        [class]="preenchimento()"
        [style.width.%]="percentual()"
      ></span>
    </div>
    @if (legendStart() || legendEnd()) {
      <p class="flex justify-between gap-2 mt-1.5 text-xs text-muted-foreground tabular-nums m-0">
        <span>{{ legendStart() }}</span>
        <span>{{ legendEnd() }}</span>
      </p>
    }
  `,
})
export class UcamProgress {
  readonly value = input.required<number>();
  /**
   * O total REAL, não 100. Declarar 40 requerimentos preserva o número que a
   * pessoa conhece; converter para porcentagem obriga a refazer a conta.
   */
  readonly max = input(100);
  /** Nome acessível. Nunca "progresso": diz o que está sendo medido. */
  readonly label = input.required<string>();
  readonly tone = input<UcamProgressTone>('neutral');
  readonly size = input<'sm' | 'md'>('md');
  /** Substitui a leitura numérica crua: "24 de 40 requerimentos abertos". */
  readonly valueText = input<string | null>(null);

  /**
   * A legenda existe porque a barra sozinha não diz de quanto é a parte:
   * entre 58% e 64% ninguém distingue, e a decisão depende do número.
   */
  readonly legendStart = input<string | null>(null);
  readonly legendEnd = input<string | null>(null);

  protected readonly id = `ucam-pg-${++seq}`;

  protected readonly valorLimitado = computed(() => Math.min(Math.max(this.value(), 0), this.max()));
  protected readonly percentual = computed(() => {
    const m = this.max();
    return m > 0 ? (this.valorLimitado() / m) * 100 : 0;
  });
  protected readonly preenchimento = computed(() => PREENCHIMENTO[this.tone()]);
}
