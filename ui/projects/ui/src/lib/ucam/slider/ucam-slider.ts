import { booleanAttribute, ChangeDetectionStrategy, Component, computed, forwardRef, input, model, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { UcamField, describedBy, nextFieldIds } from '../field/ucam-field';

/**
 * Contrato: spec/components/slider.json (ADR-074)
 *
 * Um valor escolhido pela posição numa faixa, com o NÚMERO SEMPRE À VISTA.
 * O mat-slider da correção de redação mostrava a nota só no balão do arraste
 * — que não existe no teclado nem no leitor de tela, e some sob o dedo.
 *
 * O controle é o input range nativo: teclado (setas, PageUp/PageDown,
 * Home/End) e papel de slider de graça. O que se acrescenta é o output com o
 * valor formatado e o aria-valuetext com a unidade ("7,5 pontos").
 */
@Component({
  selector: 'ucam-slider',
  exportAs: 'ucamSlider',
  imports: [UcamField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamSlider), multi: true }],
  template: `
    <ucam-field [label]="label()" [hint]="hint()" [controlId]="ids.controlId" [hintId]="ids.hintId" [errorId]="ids.errorId">
      <div class="ucam-slider" [style.--ucam-slider-pct]="pct()">
        @if (showLimits()) {
          <span class="ucam-slider__limites" aria-hidden="true">{{ fmt(min()) }}</span>
        }
        <input
          class="ucam-slider__controle"
          type="range"
          [id]="ids.controlId"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [value]="value()"
          [disabled]="disabled()"
          [attr.aria-valuetext]="texto()"
          [attr.aria-describedby]="descrito()"
          (input)="mudar($event)"
          (blur)="onTouched()"
        />
        @if (showLimits()) {
          <span class="ucam-slider__limites" aria-hidden="true">{{ fmt(max()) }}</span>
        }
        <output class="ucam-slider__valor" [attr.for]="ids.controlId">{{ texto() }}</output>
      </div>
    </ucam-field>
  `,
  styles: `
    ucam-slider .ucam-slider {
      display: flex;
      align-items: center;
      gap: var(--ucam-space-inline-sm);
      inline-size: 100%;
      max-inline-size: 30rem;
    }
    ucam-slider .ucam-slider__controle {
      flex: 1 1 auto;
      min-inline-size: 0;
      block-size: 1.5rem;
      margin: 0;
      background: transparent;
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
    }
    ucam-slider .ucam-slider__controle::-webkit-slider-runnable-track {
      block-size: 0.375rem;
      border-radius: var(--ucam-radius-pill);
      background: linear-gradient(to right, var(--ucam-color-action-primary-default) var(--ucam-slider-pct), var(--ucam-color-border-strong) var(--ucam-slider-pct));
    }
    ucam-slider .ucam-slider__controle::-moz-range-track { block-size: 0.375rem; border-radius: var(--ucam-radius-pill); background: var(--ucam-color-border-strong); }
    ucam-slider .ucam-slider__controle::-moz-range-progress { block-size: 0.375rem; border-radius: var(--ucam-radius-pill); background: var(--ucam-color-action-primary-default); }
    ucam-slider .ucam-slider__controle::-webkit-slider-thumb {
      -webkit-appearance: none;
      box-sizing: border-box;
      inline-size: 1.25rem;
      block-size: 1.25rem;
      margin-block-start: -0.4375rem;
      border: 2px solid var(--ucam-color-action-primary-default);
      border-radius: var(--ucam-radius-pill);
      background: var(--ucam-color-surface-default);
      box-shadow: var(--ucam-elevation-raised);
    }
    ucam-slider .ucam-slider__controle::-moz-range-thumb {
      box-sizing: border-box;
      inline-size: 1.25rem;
      block-size: 1.25rem;
      border: 2px solid var(--ucam-color-action-primary-default);
      border-radius: var(--ucam-radius-pill);
      background: var(--ucam-color-surface-default);
      box-shadow: var(--ucam-elevation-raised);
    }
    ucam-slider .ucam-slider__controle:focus-visible { outline: none; }
    ucam-slider .ucam-slider__controle:focus-visible::-webkit-slider-thumb { outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus); outline-offset: 2px; }
    ucam-slider .ucam-slider__controle:focus-visible::-moz-range-thumb { outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus); outline-offset: 2px; }
    ucam-slider .ucam-slider__controle:disabled { cursor: not-allowed; }
    ucam-slider .ucam-slider__controle:disabled::-webkit-slider-runnable-track { background: var(--ucam-color-action-disabled-background); }
    ucam-slider .ucam-slider__controle:disabled::-webkit-slider-thumb { border-color: var(--ucam-color-text-disabled); box-shadow: none; }
    ucam-slider .ucam-slider__valor {
      flex: none;
      min-inline-size: 4ch;
      text-align: end;
      font-size: var(--ucam-typography-body-sm-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
      font-variant-numeric: tabular-nums;
    }
    ucam-slider .ucam-slider__limites {
      flex: none;
      color: var(--ucam-color-text-secondary);
      font-size: var(--ucam-typography-caption-font-size);
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class UcamSlider implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly value = model(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  /** Sufixo do valor: %, dias, pontos. */
  readonly unit = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly showLimits = input(false, { transform: booleanAttribute });
  readonly disabled = model(false);

  protected readonly ids = nextFieldIds('ucam-sl');
  protected readonly descrito = computed(() => describedBy(this.ids, !!this.hint(), false));
  protected readonly pct = computed(() => {
    const min = this.min();
    const max = this.max();
    return `${max > min ? ((this.value() - min) / (max - min)) * 100 : 0}%`;
  });
  protected readonly texto = computed(() => {
    const u = this.unit();
    return this.fmt(this.value()) + (u ? (u === '%' ? '%' : ` ${u}`) : '');
  });

  protected fmt(n: number): string {
    return n.toLocaleString('pt-BR');
  }

  protected mudar(e: Event): void {
    const v = Number((e.target as HTMLInputElement).value);
    this.value.set(v);
    this.onChange(v);
  }

  private onChange: (v: number) => void = () => {};
  protected onTouched: () => void = () => {};
  writeValue(v: number | null): void { this.value.set(v ?? this.min()); }
  registerOnChange(fn: (v: number) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }
}
