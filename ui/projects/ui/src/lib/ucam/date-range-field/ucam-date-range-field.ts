import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input, model, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { UcamDateField } from '../date-field/ucam-date-field';
import type { UcamDateRange } from '../calendar/ucam-calendar-grade';

const porExtenso = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/**
 * Contrato: spec/components/date-range-field.json (ADR-074)
 *
 * Um período com começo e fim: dois UcamDateField sob um rótulo só, num
 * fieldset. O que o par solto não garantia, e este garante:
 *
 *  - o fim nunca antes do começo — o erro sai no campo Até, dito com a data;
 *  - o calendário do Até bloqueia os dias antes do começo (min);
 *  - o calendário de QUALQUER ponta marca o período inteiro (period).
 *
 * O valor trafega como { start, end } em ISO, e sai também com uma ponta só.
 */
@Component({
  selector: 'ucam-date-range-field',
  exportAs: 'ucamDateRangeField',
  imports: [UcamDateField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamDateRangeField), multi: true }],
  host: { class: 'block' },
  template: `
    <fieldset class="ucam-date-range" [disabled]="disabled()">
      <legend class="ucam-date-range__legenda">
        {{ label() }}
        @if (required()) {
          <span class="text-primary" aria-hidden="true">*</span>
        }
      </legend>
      <div class="ucam-date-range__pontas">
        <ucam-date-field
          class="ucam-date-range__ponta"
          [label]="startLabel()"
          [min]="min()"
          [max]="max()"
          [required]="required()"
          [period]="periodo()"
          [value]="value().start ?? ''"
          (valueChange)="mudar('start', $event)"
        />
        <span class="ucam-date-range__sep" aria-hidden="true">a</span>
        <ucam-date-field
          class="ucam-date-range__ponta"
          [label]="endLabel()"
          [min]="minFim()"
          [max]="max()"
          [required]="required()"
          [period]="periodo()"
          [invalid]="!!erroOrdem()"
          [errorMessage]="erroOrdem()"
          [value]="value().end ?? ''"
          (valueChange)="mudar('end', $event)"
        />
      </div>
    </fieldset>
  `,
  styles: `
    ucam-date-range-field .ucam-date-range { min-inline-size: 0; margin: 0; padding: 0; border: 0; }
    ucam-date-range-field .ucam-date-range__legenda {
      padding: 0;
      margin-block-end: var(--ucam-space-1);
      font-size: var(--ucam-typography-label-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
      color: var(--ucam-color-text-primary);
    }
    ucam-date-range-field .ucam-date-range__pontas {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: var(--ucam-space-inline-xs) var(--ucam-space-inline-sm);
    }
    /* O "a" fica na altura do campo, não do rótulo: 1.5rem de rótulo + meio campo. */
    ucam-date-range-field .ucam-date-range__sep {
      padding-block-start: calc(1.5rem + (var(--ucam-size-control-md) - 1.25rem) / 2);
      line-height: 1.25rem;
      color: var(--ucam-color-text-secondary);
    }
  `,
})
export class UcamDateRangeField implements ControlValueAccessor {
  /** Nome do período: Período, Vigência da inscrição. */
  readonly label = input.required<string>();
  readonly startLabel = input('De');
  readonly endLabel = input('Até');
  readonly value = model<UcamDateRange>({ start: null, end: null });
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = model(false);

  protected readonly periodo = computed(() => this.value());
  /** O fim não começa antes do começo — nem antes do mínimo do período. */
  protected readonly minFim = computed(() => {
    const s = this.value().start;
    const m = this.min();
    if (s && m) return s > m ? s : m;
    return s || m;
  });
  protected readonly erroOrdem = computed(() => {
    const { start, end } = this.value();
    return start && end && end < start ? `A data final precisa ser igual ou posterior a ${porExtenso(start)}.` : null;
  });

  protected mudar(ponta: 'start' | 'end', iso: string): void {
    const novo = { ...this.value(), [ponta]: iso || null };
    this.value.set(novo);
    this.onChange(novo);
    this.onTouched();
  }

  private onChange: (v: UcamDateRange) => void = () => {};
  private onTouched: () => void = () => {};
  writeValue(v: UcamDateRange | null): void { this.value.set(v ?? { start: null, end: null }); }
  registerOnChange(fn: (v: UcamDateRange) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }
}
