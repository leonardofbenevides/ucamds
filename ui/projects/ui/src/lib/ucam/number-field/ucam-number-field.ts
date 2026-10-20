import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { UcamField, describedBy, nextFieldIds } from '../field/ucam-field';
import { UcamIcon } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/number-field.json (ADR-074)
 *
 * Número com − e + do lado. Digitar é o caminho rápido; os botões são o
 * ajuste fino, com o alvo da altura inteira do campo (36px) e não as setinhas
 * de 10px do type=number cru do Protocolo. Mínimo, máximo e passo moram no
 * <input>, e valem igual para o botão, a seta do teclado e a validação: o
 * botão da ponta alcançada fica desabilitado, e fora do limite é erro dito
 * com o limite ("O máximo é 80 vagas.").
 *
 * É o .ucam-input-group--numero do Trilho A, que existia sem contrato.
 */
@Component({
  selector: 'ucam-number-field',
  exportAs: 'ucamNumberField',
  imports: [UcamField, UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamNumberField), multi: true }],
  template: `
    <ucam-field
      [label]="label()"
      [hint]="hint()"
      [errorMessage]="mensagem()"
      [invalid]="invalidoEfetivo()"
      [required]="required()"
      [controlId]="ids.controlId"
      [hintId]="ids.hintId"
      [errorId]="ids.errorId"
    >
      <div class="ucam-number-field" [attr.data-invalid]="invalidoEfetivo() ? '' : null">
        <button
          type="button"
          class="ucam-number-field__passo"
          [attr.aria-label]="'Diminuir ' + nome()"
          [attr.aria-controls]="ids.controlId"
          [disabled]="disabled() || noMinimo()"
          (click)="passo(-1)"
        >
          <ucam-icon name="minus" size="sm" />
        </button>
        <input
          class="ucam-number-field__controle"
          type="number"
          [id]="ids.controlId"
          [attr.min]="min()"
          [attr.max]="max()"
          [step]="step()"
          [value]="value() ?? ''"
          [disabled]="disabled()"
          [attr.required]="required() ? '' : null"
          [attr.aria-invalid]="invalidoEfetivo() ? 'true' : null"
          [attr.aria-describedby]="descrito()"
          (input)="digitar($event)"
          (blur)="onTouched()"
        />
        <button
          type="button"
          class="ucam-number-field__passo"
          [attr.aria-label]="'Aumentar ' + nome()"
          [attr.aria-controls]="ids.controlId"
          [disabled]="disabled() || noMaximo()"
          (click)="passo(1)"
        >
          <ucam-icon name="plus" size="sm" />
        </button>
      </div>
    </ucam-field>
  `,
  styles: `
    ucam-number-field .ucam-number-field {
      display: inline-flex;
      align-items: stretch;
      inline-size: 100%;
      block-size: var(--ucam-size-control-md);
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-control);
      background: var(--ucam-color-surface-default);
      overflow: hidden;
    }
    ucam-number-field .ucam-number-field:focus-within {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: 2px;
    }
    ucam-number-field .ucam-number-field[data-invalid] { border-color: var(--ucam-color-action-danger-default); }
    ucam-number-field .ucam-number-field__controle {
      flex: 1 1 auto;
      min-inline-size: 0;
      border: 0;
      background: none;
      font: inherit;
      font-size: var(--ucam-typography-body-font-size);
      font-variant-numeric: tabular-nums;
      text-align: center;
      color: var(--ucam-color-text-primary);
      -moz-appearance: textfield;
    }
    ucam-number-field .ucam-number-field__controle:focus-visible { outline: none; }
    ucam-number-field .ucam-number-field__controle::-webkit-inner-spin-button,
    ucam-number-field .ucam-number-field__controle::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    /* As duas ações têm a altura inteira do campo, e o filete as separa do
       número: dois quadrados colados sem ele liam como um botão largo. */
    ucam-number-field .ucam-number-field__passo {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: var(--ucam-size-control-md);
      border: 0;
      background: none;
      color: var(--ucam-color-text-secondary);
      cursor: pointer;
    }
    ucam-number-field .ucam-number-field__passo:first-child { border-inline-end: 1px solid var(--ucam-color-border-subtle); }
    ucam-number-field .ucam-number-field__passo:last-child { border-inline-start: 1px solid var(--ucam-color-border-subtle); }
    ucam-number-field .ucam-number-field__passo:hover:not(:disabled) {
      background: var(--ucam-color-interaction-hover);
      color: var(--ucam-color-text-primary);
    }
    ucam-number-field .ucam-number-field__passo:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: calc(-1 * var(--ucam-focus-ring-width));
    }
    ucam-number-field .ucam-number-field__passo:disabled { color: var(--ucam-color-text-disabled); cursor: not-allowed; }
  `,
})
export class UcamNumberField implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly value = model<number | null>(null);
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly step = input(1);
  /** Sufixo dito no nome dos botões e nas mensagens: horas, vagas. */
  readonly unit = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = model(false);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly errorMessage = input<string | null>(null);

  protected readonly ids = nextFieldIds('ucam-nf');
  private readonly tocado = signal(false);

  /** "vagas" se a unidade disser; senão o rótulo em minúsculas. */
  protected readonly nome = computed(() => this.unit() ?? this.label().toLowerCase());
  protected readonly noMinimo = computed(() => this.min() !== null && this.value() !== null && this.value()! <= this.min()!);
  protected readonly noMaximo = computed(() => this.max() !== null && this.value() !== null && this.value()! >= this.max()!);

  private readonly erroLocal = computed(() => {
    const v = this.value();
    const u = this.unit() ? ` ${this.unit()}` : '';
    if (v === null) return null;
    if (this.min() !== null && v < this.min()!) return `O mínimo é ${this.min()!.toLocaleString('pt-BR')}${u}.`;
    if (this.max() !== null && v > this.max()!) return `O máximo é ${this.max()!.toLocaleString('pt-BR')}${u}.`;
    return null;
  });
  protected readonly mensagem = computed(() => this.errorMessage() ?? this.erroLocal());
  protected readonly invalidoEfetivo = computed(() => this.invalid() || !!this.erroLocal());
  protected readonly descrito = computed(() =>
    describedBy(this.ids, !!this.hint(), this.invalidoEfetivo() && !!this.mensagem()),
  );

  protected passo(sinal: 1 | -1): void {
    const atual = this.value() ?? this.min() ?? 0;
    let v = atual + sinal * this.step();
    if (this.min() !== null) v = Math.max(this.min()!, v);
    if (this.max() !== null) v = Math.min(this.max()!, v);
    // Arredonda ao passo: 0,1 + 0,2 não é 0,30000000000000004 na tela.
    v = Number(v.toFixed(10));
    this.aplicar(v);
  }

  protected digitar(e: Event): void {
    const bruto = (e.target as HTMLInputElement).value;
    this.aplicar(bruto === '' ? null : Number(bruto));
  }

  private aplicar(v: number | null): void {
    this.value.set(v);
    this.onChange(v);
    this.tocado.set(true);
  }

  private onChange: (v: number | null) => void = () => {};
  protected onTouched: () => void = () => {};
  writeValue(v: number | null): void { this.value.set(v ?? null); }
  registerOnChange(fn: (v: number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }
}
