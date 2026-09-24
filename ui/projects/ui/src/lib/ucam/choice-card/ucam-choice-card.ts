import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  ViewEncapsulation,
} from '@angular/core';

import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/choice-card.json
 *
 * Sem equivalente na base. O cartão é a ETIQUETA de um input REAL — div com
 * clique não entra na tabulação, não é anunciada como escolha e não vai no
 * envio do formulário. As setas do grupo de radio continuam sendo as do
 * navegador; nada aqui reimplementa comportamento nativo.
 */
let seq = 0;

@Component({
  selector: 'ucam-choice-card',
  exportAs: 'ucamChoiceCard',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  /** Ver o porquê do contents em ucam-description-list. */
  host: { class: 'contents' },
  template: `
    <label [for]="id" [class]="classes()">
      <input
        [type]="selection() === 'multiple' ? 'checkbox' : 'radio'"
        [id]="id"
        [name]="name()"
        [value]="value()"
        [checked]="checked()"
        [disabled]="disabled()"
        [attr.aria-describedby]="description() ? idApoio : null"
        class="absolute opacity-0 pointer-events-none m-0"
        (change)="marcar($event)"
      />
      @if (icon(); as ic) {
        <span
          class="shrink-0 w-8 h-8 rounded-[var(--ucam-radius-control)] inline-flex items-center justify-center bg-[var(--ucam-color-surface-sunken)] text-[var(--ucam-color-text-secondary)]"
          aria-hidden="true"
        >
          <ucam-icon [name]="ic" />
        </span>
      }
      <span class="min-w-0">
        <span class="block text-sm font-medium text-foreground">{{ label() }}</span>
        @if (description()) {
          <span class="block mt-0.5 text-xs text-muted-foreground" [id]="idApoio">{{ description() }}</span>
        }
      </span>
      <!-- A marca existe ALÉM da borda: em monitor de secretaria com brilho
           baixo a diferença de borda desaparece, e a escolha some junto. -->
      <span data-marca class="absolute top-2 end-2 w-4 h-4 text-primary opacity-0 transition-opacity" aria-hidden="true">
        <ucam-icon name="check" size="sm" />
      </span>
    </label>
  `,
})
export class UcamChoiceCard {
  readonly value = input.required<string>();
  readonly label = input.required<string>();
  readonly description = input<string | null>(null);
  readonly icon = input<UcamIconName | null>(null);
  readonly selection = input<'single' | 'multiple'>('single');
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Radios de um mesmo grupo precisam do mesmo name — é o que faz as setas
   * andarem entre eles e o que impede duas escolhas na mesma pergunta.
   */
  readonly name = input<string | null>(null);
  readonly checked = model(false);

  protected readonly id = `ucam-cc-${++seq}`;
  protected readonly idApoio = `ucam-cc-${seq}-a`;

  protected marcar(e: Event) {
    this.checked.set((e.target as HTMLInputElement).checked);
  }

  protected readonly classes = computed(() => {
    const base =
      'relative flex items-start gap-2 p-4 rounded-[var(--ucam-radius-surface)] border bg-card transition-[border-color,background-color]';
    const estado = this.disabled()
      ? 'border-[var(--ucam-color-border-subtle)] bg-[var(--ucam-color-action-disabled-background)] text-[var(--ucam-color-action-disabled-text)] cursor-not-allowed'
      // Marcado: só a borda em tinta de ação e o check (ADR-046). O fundo
      // rosado saiu — era o terceiro sinal do mesmo estado.
      : 'cursor-pointer border-[var(--ucam-color-border-subtle)] hover:bg-[var(--ucam-color-interaction-hover)] has-[:checked]:border-[var(--ucam-color-action-primary-default)]';
    // O anel de foco aparece no cartão inteiro, não no input escondido.
    const foco =
      'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--ucam-color-border-focus)]';
    // O Tailwind não pinta um filho a partir do estado do pai sem variante
    // explícita: a marca acende por uma regra do próprio rótulo.
    const marca = '[&:has(:checked)_[data-marca]]:opacity-100';
    return `${base} ${estado} ${foco} ${marca}`;
  });
}
