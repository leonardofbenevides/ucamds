import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  input,
  model,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { describedBy, nextFieldIds } from '../field/ucam-field';

/**
 * Contrato: spec/components/checkbox.json
 *
 * NÃO envolve o z-checkbox da base: ela não tem estado indeterminado, que é
 * requisito do cabeçalho de seleção da DataTable. Reimplementar sobre o
 * <input type=checkbox> nativo sai mais barato e mais correto do que forçar
 * o indeterminado por fora — o estado precisa vir da PROPRIEDADE do elemento
 * para produzir aria-checked=mixed; atributo não serve.
 */
@Component({
  selector: 'ucam-checkbox',
  exportAs: 'ucamCheckbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamCheckbox), multi: true }],
  host: { class: 'flex flex-col gap-1' },
  template: `
    <label class="group inline-flex items-start gap-2 cursor-pointer min-h-6" [attr.for]="ids.controlId">
      <input
        #control
        type="checkbox"
        class="appearance-none m-0 shrink-0 w-5 h-5 rounded-sm border border-input bg-background grid place-content-center cursor-pointer
               checked:bg-primary checked:border-primary indeterminate:bg-primary indeterminate:border-primary
               disabled:bg-muted disabled:cursor-not-allowed
               group-hover:not-disabled:not-checked:not-indeterminate:border-[var(--ucam-color-border-strong)]
               focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring
               after:content-[''] after:w-[0.3rem] after:h-[0.55rem] after:border-solid after:border-primary-foreground
               after:border-r-2 after:border-b-2 after:rotate-45 after:-translate-y-px after:scale-0
               checked:after:scale-100
               indeterminate:after:w-[0.55rem] indeterminate:after:h-0.5 indeterminate:after:bg-primary-foreground
               indeterminate:after:border-0 indeterminate:after:rotate-0 indeterminate:after:translate-y-0 indeterminate:after:scale-100"
        [id]="ids.controlId"
        [checked]="checked()"
        [disabled]="disabled()"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        (change)="onChangeEvent($event)"
        (blur)="onTouched()"
      />
      <span [class]="labelHidden() ? 'sr-only' : 'text-sm leading-6'">{{ label() }}</span>
    </label>

    @if (invalid() && errorMessage()) {
      <p class="text-xs text-destructive" [id]="ids.errorId" role="alert">{{ errorMessage() }}</p>
    }

    <!-- O apoio fica no DOM mesmo com erro, só deixa de ser visto: o
         describedBy() continua citando o hintId, e um id sem elemento é apoio
         que some do leitor de tela bem na hora de corrigir. Ver ucam-field. -->
    @if (hint()) {
      <p class="text-xs text-muted-foreground" [class.sr-only]="invalid() && !!errorMessage()" [id]="ids.hintId">{{ hint() }}</p>
    }
  `,
})
export class UcamCheckbox implements ControlValueAccessor {
  /** Obrigatório sempre. Em seleção de linha, use labelHidden. */
  readonly label = input.required<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly hint = input<string | null>(null);
  readonly checked = model(false);
  /** Estado visual, não um terceiro valor do modelo — nunca é emitido. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly disabled = model(false);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly errorMessage = input<string | null>(null);

  /*
   * O output vem do model() acima — declarar um output homônimo colidia com
   * ele, e o compilador do Angular 22 recusa: "bound to both". A API pública
   * não muda: model() já emite XChange a cada escrita de valor.
   */

  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');
  protected readonly ids = nextFieldIds('ucam-cb');

  protected readonly describedBy = computed(() =>
    describedBy(this.ids, !!this.hint(), this.invalid() && !!this.errorMessage()),
  );

  constructor() {
    // indeterminate só existe como propriedade do elemento; é isso que faz o
    // navegador expor aria-checked=mixed. Não há atributo equivalente.
    effect(() => {
      this.control().nativeElement.indeterminate = this.indeterminate();
    });
  }

  protected onChangeEvent(event: Event): void {
    const v = (event.target as HTMLInputElement).checked;
    this.checked.set(v);
    this.onChangeFn(v);
  }

  private onChangeFn: (v: boolean) => void = () => {};
  protected onTouched: () => void = () => {};
  writeValue(v: boolean | null): void { this.checked.set(!!v); }
  registerOnChange(fn: (v: boolean) => void): void { this.onChangeFn = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }
}
