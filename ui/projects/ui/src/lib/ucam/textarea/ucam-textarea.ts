import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input, model, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ZardTextareaComponent } from '@/shared/components/textarea/textarea.component';
import { UcamField, describedBy, nextFieldIds } from '../field/ucam-field';

/**
 * Somente leitura (revisão de estados, 13/09/2026): chão sem papel e contorno
 * de fio, com o texto na tinta primária. Espelha .ucam-input[readonly] do
 * Trilho A. O dark: se repete porque a base pinta dark:bg-input/30.
 */
const LEITURA =
  'bg-[var(--ucam-color-surface-subtle)] dark:bg-[var(--ucam-color-surface-subtle)] border-[var(--ucam-color-border-subtle)] cursor-default';

/**
 * Contrato: spec/components/textarea.json
 *
 * Cresce com o conteúdo até maxRows. É a correção da ROLAGEM ANINHADA do
 * Novo Requerimento, onde a área de texto tinha barra própria e o diálogo
 * tinha outra, lado a lado.
 */
@Component({
  selector: 'ucam-textarea',
  exportAs: 'ucamTextarea',
  imports: [UcamField, ZardTextareaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamTextarea), multi: true }],
  template: `
    <ucam-field
      [label]="label()" [labelHidden]="labelHidden()" [hint]="hint()"
      [errorMessage]="errorMessage()" [invalid]="invalid()" [required]="required()"
      [controlId]="ids.controlId" [hintId]="ids.hintId" [errorId]="ids.errorId"
    >
      <textarea
        z-textarea
        [id]="ids.controlId"
        [rows]="rows()"
        [style.max-height.rem]="maxAltura()"
        [style.resize]="autoGrow() ? 'none' : 'vertical'"
        [value]="value()"
        [attr.placeholder]="placeholder()"
        [attr.maxlength]="maxLength()"
        [attr.required]="required() ? '' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-describedby]="descrito()"
        [disabled]="disabled()"
        [readOnly]="readonly()"
        [class]="readonly() ? leitura : ''"
        (input)="onInput($event)"
        (blur)="onTouched()"
      ></textarea>
      @if (mostrarContador()) {
        <span class="text-xs text-muted-foreground self-end" aria-live="polite">
          {{ value().length }} / {{ maxLength() }}
        </span>
      }
    </ucam-field>
  `,
})
export class UcamTextarea implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly hint = input<string | null>(null);
  readonly placeholder = input<string | null>(null);
  readonly rows = input(4);
  readonly maxRows = input<number | null>(12);
  readonly autoGrow = input(true, { transform: booleanAttribute });
  readonly maxLength = input<number | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = model(false);
  /** Visível e copiável, não editável. Continua focável, ao contrário de disabled. */
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });

  protected readonly leitura = LEITURA;
  readonly errorMessage = input<string | null>(null);

  readonly value = model<string>('');
  /*
   * O output vem do model() acima — declarar um output homônimo colidia com
   * ele, e o compilador do Angular 22 recusa: "bound to both". A API pública
   * não muda: model() já emite XChange a cada escrita de valor.
   */

  protected readonly ids = nextFieldIds('ucam-ta');
  protected readonly descrito = computed(() => describedBy(this.ids, !!this.hint(), this.invalid() && !!this.errorMessage()));

  /** Teto do crescimento em rem, aproximando 1.5rem por linha. */
  protected readonly maxAltura = computed(() => (this.maxRows() ?? 12) * 1.5);

  /** Contador só a partir de 80% do limite — antes disso é ruído. */
  protected readonly mostrarContador = computed(() => {
    const max = this.maxLength();
    return !!max && this.value().length >= max * 0.8;
  });

  protected onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    if (this.autoGrow()) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
    this.value.set(el.value);
    this.onChangeFn(el.value);
  }

  private onChangeFn: (v: string) => void = () => {};
  protected onTouched: () => void = () => {};
  writeValue(v: string | null): void { this.value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this.onChangeFn = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }
}
