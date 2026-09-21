import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input, model, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ZardSwitchComponent } from '@/shared/components/switch/switch.component';
import { describedBy, nextFieldIds } from '../field/ucam-field';

/**
 * Contrato: spec/components/switch.json
 *
 * Envolve o z-switch. O que o wrapper acrescenta é o que o legado não tinha:
 * rótulo persistente ligado ao controle, apoio anunciado e um estado de
 * confirmação pendente.
 *
 * Substitui os pares SIM/NÃO do Protocolo e do SIGFIN, ambíguos por
 * construção: o texto mostrava um valor sem dizer se era o estado atual ou
 * o que aconteceria ao clicar.
 */
@Component({
  selector: 'ucam-switch',
  exportAs: 'ucamSwitch',
  imports: [ZardSwitchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamSwitch), multi: true }],
  host: { class: 'inline-flex flex-col gap-1' },
  template: `
    <span class="inline-flex items-center gap-2">
      <z-switch
        [zId]="ids.controlId"
        [zChecked]="checked()"
        [zDisabled]="disabled() || loading()"
        (zCheckedChange)="onToggle($event)"
      />
      <label [attr.for]="ids.controlId" [class]="labelHidden() ? 'sr-only' : 'text-sm cursor-pointer'">{{ label() }}</label>
    </span>
    @if (hint()) {
      <span class="text-xs text-muted-foreground" [id]="ids.hintId">{{ hint() }}</span>
    }
  `,
})
export class UcamSwitch implements ControlValueAccessor {
  /** Descreve o que fica ligado. Nunca Sim, Não ou Ativar. */
  readonly label = input.required<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly hint = input<string | null>(null);
  readonly checked = model(false);
  readonly disabled = model(false);
  /** Enquanto o servidor confirma. Mantém o estado anterior até a resposta. */
  readonly loading = input(false, { transform: booleanAttribute });

  /*
   * O output vem do model() acima — declarar um output homônimo colidia com
   * ele, e o compilador do Angular 22 recusa: "bound to both". A API pública
   * não muda: model() já emite XChange a cada escrita de valor.
   */

  protected readonly ids = nextFieldIds('ucam-sw');
  protected readonly descrito = computed(() => describedBy(this.ids, !!this.hint(), false));

  protected onToggle(v: boolean): void {
    if (this.loading() || this.disabled()) return;
    this.checked.set(v);
    this.onChangeFn(v);
  }

  private onChangeFn: (v: boolean) => void = () => {};
  protected onTouched: () => void = () => {};
  writeValue(v: boolean | null): void { this.checked.set(!!v); }
  registerOnChange(fn: (v: boolean) => void): void { this.onChangeFn = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }
}
