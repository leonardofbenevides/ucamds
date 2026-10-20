import { ChangeDetectionStrategy, Component, forwardRef, input, model, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { UcamIcon, type UcamIconName } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/toggle-group.json (ADR-074)
 *
 * Botões colados em que cada um liga e desliga sozinho — VÁRIOS podem estar
 * ligados: os dias da semana de uma aula. É marcação múltipla, e por isso o
 * ligado é BORDÔ cheio, como a caixa marcada, e não o grafite do
 * UcamSegmented, que é escolha única. As duas peças vivem na mesma barra e
 * não podem parecer a mesma.
 *
 * Botão de letra ou ícone tem nome por extenso: duas quartas e três sextas
 * ("Q", "S") seriam ouvidas como "Q, S, S" sem o label.
 */
export interface UcamToggleItem {
  id: string;
  /** O nome por extenso: segunda. É o que o leitor de tela ouve. */
  label: string;
  /** O que aparece no botão, quando é mais curto que o nome: S. */
  short?: string;
  icon?: UcamIconName;
}

@Component({
  selector: 'ucam-toggle-group',
  exportAs: 'ucamToggleGroup',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamToggleGroup), multi: true }],
  host: { class: 'inline-block' },
  template: `
    <div class="ucam-toggle-group" role="group" [attr.aria-label]="label()">
      @for (item of items(); track item.id) {
        <button
          type="button"
          [attr.aria-pressed]="value().includes(item.id)"
          [attr.aria-label]="item.short || item.icon ? item.label : null"
          [disabled]="disabled()"
          (click)="alternar(item.id)"
        >
          @if (item.icon) {
            <ucam-icon [name]="item.icon" size="sm" />
          } @else {
            {{ item.short ?? item.label }}
          }
        </button>
      }
    </div>
  `,
  styles: `
    ucam-toggle-group .ucam-toggle-group {
      display: inline-flex;
      align-items: stretch;
      block-size: var(--ucam-size-control-md);
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-control);
      overflow: hidden;
    }
    ucam-toggle-group .ucam-toggle-group > button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      min-inline-size: var(--ucam-size-control-md);
      min-block-size: 0;
      padding: 0 0.625rem;
      border: 0;
      background: none;
      font: inherit;
      font-size: var(--ucam-typography-body-sm-font-size);
      color: var(--ucam-color-text-secondary);
      cursor: pointer;
      transition:
        background-color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard),
        color var(--ucam-motion-duration-state) var(--ucam-motion-easing-standard);
    }
    ucam-toggle-group .ucam-toggle-group > button + button { border-inline-start: 1px solid var(--ucam-color-border-subtle); }
    ucam-toggle-group .ucam-toggle-group > button:hover:not([aria-pressed='true'], :disabled) {
      background: var(--ucam-color-interaction-hover);
      color: var(--ucam-color-text-primary);
    }
    ucam-toggle-group .ucam-toggle-group > button[aria-pressed='true'] {
      background: var(--ucam-color-action-primary-default);
      color: var(--ucam-color-text-on-action);
      font-weight: var(--ucam-typography-action-font-weight);
    }
    ucam-toggle-group .ucam-toggle-group > button[aria-pressed='true']:hover { background: var(--ucam-color-action-primary-hover); }
    ucam-toggle-group .ucam-toggle-group > button[aria-pressed='true'] + button[aria-pressed='true'] {
      border-inline-start-color: color-mix(in srgb, var(--ucam-color-text-on-action) 40%, transparent);
    }
    ucam-toggle-group .ucam-toggle-group > button:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: calc(-1 * var(--ucam-focus-ring-width) - 1px);
    }
    ucam-toggle-group .ucam-toggle-group > button:disabled { color: var(--ucam-color-text-disabled); cursor: not-allowed; }
    ucam-toggle-group .ucam-toggle-group > button[aria-pressed='true']:disabled {
      background: var(--ucam-color-action-disabled-background);
      color: var(--ucam-color-action-disabled-text);
    }
    @media (forced-colors: active) {
      ucam-toggle-group .ucam-toggle-group > button[aria-pressed='true'] { outline: 2px solid CanvasText; outline-offset: -3px; }
    }
  `,
})
export class UcamToggleGroup implements ControlValueAccessor {
  /** Nome do grupo: Dias da aula. */
  readonly label = input.required<string>();
  readonly items = input.required<UcamToggleItem[]>();
  /** Os ids ligados, na ordem dos itens. */
  readonly value = model<string[]>([]);
  readonly disabled = model(false);

  protected alternar(id: string): void {
    const ligados = new Set(this.value());
    if (ligados.has(id)) ligados.delete(id);
    else ligados.add(id);
    const novo = this.items().map((i) => i.id).filter((i) => ligados.has(i));
    this.value.set(novo);
    this.onChange(novo);
    this.onTouched();
  }

  private onChange: (v: string[]) => void = () => {};
  private onTouched: () => void = () => {};
  writeValue(v: string[] | null): void { this.value.set(v ?? []); }
  registerOnChange(fn: (v: string[]) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled.set(d); }
}
