import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ZardInputComponent } from '@/shared/components/input/input.component';
import { UcamField, describedBy, nextFieldIds } from '../field/ucam-field';
import { UcamIcon } from '../icon/ucam-icon';

/**
 * Somente leitura (revisão de estados, 13/09/2026): chão sem papel e contorno
 * de fio, com o texto na tinta primária. Espelha .ucam-input[readonly] do
 * Trilho A. O dark: se repete porque a base pinta dark:bg-input/30.
 */
const LEITURA =
  'bg-[var(--ucam-color-surface-subtle)] dark:bg-[var(--ucam-color-surface-subtle)] border-[var(--ucam-color-border-subtle)] cursor-default';

/**
 * Contrato: spec/components/text-field.json
 *
 * A base contribui só com o estilo do <input>. Rótulo persistente, apoio,
 * erro, ligação ARIA, máscara e largura por conteúdo são deste wrapper.
 */
export type UcamMask = 'cpf' | 'cnpj' | 'phone' | 'cep' | 'date' | null;

/** A máscara é APRESENTAÇÃO: o modelo sempre recebe o valor sem formatação. */
const MASKS: Record<Exclude<UcamMask, null>, { max: number; fmt: (raw: string) => string }> = {
  cpf: { max: 11, fmt: (d) => d.replace(/(\d{3})(\d{3})?(\d{3})?(\d{1,2})?/, (_, a, b, c, e) => [a, b, c].filter(Boolean).join('.') + (e ? '-' + e : '')) },
  cnpj: { max: 14, fmt: (d) => d.replace(/(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{1,2})?/, (_, a, b, c, e, f) => [a, b, c].filter(Boolean).join('.') + (e ? '/' + e : '') + (f ? '-' + f : '')) },
  phone: { max: 11, fmt: (d) => (d.length > 10 ? d.replace(/(\d{2})(\d{5})?(\d{1,4})?/, (_, a, b, c) => `(${a})` + (b ? ' ' + b : '') + (c ? '-' + c : '')) : d.replace(/(\d{2})(\d{4})?(\d{1,4})?/, (_, a, b, c) => `(${a})` + (b ? ' ' + b : '') + (c ? '-' + c : ''))) },
  cep: { max: 8, fmt: (d) => d.replace(/(\d{5})(\d{1,3})?/, (_, a, b) => a + (b ? '-' + b : '')) },
  date: { max: 8, fmt: (d) => d.replace(/(\d{2})(\d{2})?(\d{1,4})?/, (_, a, b, c) => [a, b, c].filter(Boolean).join('/')) },
};

/** Larguras derivadas do dado — acaba com as larguras arbitrárias do legado. */
const CONTENT_WIDTH: Record<string, string> = {
  cpf: 'w-[16ch]', cnpj: 'w-[20ch]', phone: 'w-[17ch]', cep: 'w-[11ch]', date: 'w-[12ch]',
};

@Component({
  selector: 'ucam-text-field',
  exportAs: 'ucamTextField',
  imports: [UcamField, ZardInputComponent, UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamTextField), multi: true }],
  template: `
    <ucam-field
      [label]="label()"
      [labelHidden]="labelHidden()"
      [hint]="hint()"
      [errorMessage]="errorMessage()"
      [invalid]="invalid()"
      [required]="required()"
      [controlId]="ids.controlId"
      [hintId]="ids.hintId"
      [errorId]="ids.errorId"
    >
      <!-- O embrulho existe para o indicador de loading, sobreposto ao fim do
           campo como o spinner do select: sem ele o ícone não teria em relação
           a quê se ancorar dentro do flex do ucam-field. -->
      <span class="relative" [class]="width() === 'content' ? 'inline-block self-start' : 'block'">
      <input
        z-input
        [id]="ids.controlId"
        [class]="classesControle()"
        [type]="type()"
        [value]="display()"
        [attr.placeholder]="placeholder()"
        [attr.inputmode]="inputMode()"
        [attr.maxlength]="maxLength()"
        [attr.autocomplete]="autocomplete()"
        [attr.required]="required() ? '' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        [disabled]="disabled()"
        [readOnly]="readonly()"
        [attr.aria-busy]="loading() ? 'true' : null"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      @if (loading()) {
        <!-- aria-hidden: quem ouve recebe o aria-busy do input, e o resultado
             chega pelos campos que se preenchem, não pelo desenho. -->
        <span class="pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-muted-foreground" aria-hidden="true">
          <ucam-icon name="loaderCircle" size="sm" class="motion-safe:animate-spin" />
        </span>
      }
      </span>
    </ucam-field>
  `,
})
export class UcamTextField implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly hint = input<string | null>(null);
  readonly placeholder = input<string | null>(null);
  readonly type = input<'text' | 'email' | 'tel' | 'password' | 'number' | 'url' | 'search'>('text');
  readonly mask = input<UcamMask>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = model(false);
  readonly readonly = input(false, { transform: booleanAttribute });
  /**
   * Busca remota a partir do valor — o CEP que preenche o endereço. O campo
   * continua editável: aria-busy, nunca disabled. Ver text-field.json.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly errorMessage = input<string | null>(null);
  readonly maxLength = input<number | null>(null);
  readonly width = input<'content' | 'full'>('full');
  readonly autocomplete = input<string | null>(null);

  readonly value = model<string>('');
  /*
   * O output vem do model() acima — declarar um output homônimo colidia com
   * ele, e o compilador do Angular 22 recusa: "bound to both". A API pública
   * não muda: model() já emite XChange a cada escrita de valor.
   */

  protected readonly ids = nextFieldIds('ucam-tf');

  protected readonly describedBy = computed(() =>
    describedBy(this.ids, !!this.hint(), this.invalid() && !!this.errorMessage()),
  );

  protected readonly widthClass = computed(() => {
    const m = this.mask();
    if (this.width() === 'content' && m && CONTENT_WIDTH[m]) return CONTENT_WIDTH[m];
    return this.width() === 'content' ? 'w-auto' : 'w-full';
  });

  /** Largura, somente leitura e a folga do indicador de loading. */
  protected readonly classesControle = computed(() =>
    [this.widthClass(), this.readonly() ? LEITURA : '', this.loading() ? 'pe-8' : ''].filter(Boolean).join(' '),
  );

  /** Teclado numérico no celular quando o dado é numérico. */
  protected readonly inputMode = computed(() => {
    const m = this.mask();
    if (m) return 'numeric';
    return this.type() === 'number' ? 'decimal' : null;
  });

  /** O que aparece na tela: com máscara. O que sai no modelo: sem. */
  protected readonly display = computed(() => {
    const m = this.mask();
    const raw = this.value() ?? '';
    if (!m) return raw;
    const digits = raw.replace(/\D/g, '').slice(0, MASKS[m].max);
    return digits ? MASKS[m].fmt(digits) : '';
  });

  protected onInput(event: Event): void {
    const alvo = event.target as HTMLInputElement;
    const m = this.mask();
    const limpo = m ? alvo.value.replace(/\D/g, '').slice(0, MASKS[m].max) : alvo.value;
    if (m) alvo.value = limpo ? MASKS[m].fmt(limpo) : '';
    this.value.set(limpo);
    this.onChange(limpo);
  }

  // ControlValueAccessor — o valor trafega sempre sem máscara.
  private onChange: (v: string) => void = () => {};
  protected onTouched: () => void = () => {};
  writeValue(v: string | null): void { this.value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }
}
