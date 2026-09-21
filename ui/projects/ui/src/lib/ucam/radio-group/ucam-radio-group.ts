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

import { UcamIcon } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/radio-group.json
 *
 * A lacuna que o catálogo tinha: havia checkbox para o que se marca, switch
 * para o que se liga e segmented para o recorte de duas a quatro opções em
 * trilho — e nenhum controle para a escolha exclusiva de cinco a sete
 * alternativas dentro de um formulário.
 *
 * FIELDSET E RÁDIO NATIVOS, não div com role. É a decisão que carrega o
 * componente inteiro: o nativo já traz o grupo por `name`, a navegação por
 * seta, a parada única de tabulação, o "opção 2 de 3" do leitor de tela e o
 * comportamento — que quase toda reimplementação erra — de o Tab levar ao
 * PRIMEIRO rádio quando nenhum está escolhido.
 *
 * É o defeito medido na forma de pagamento do SIGFIN: três <input type=radio>
 * sem fieldset e sem legend. O leitor de tela anuncia três controles soltos e
 * nunca diz qual é a pergunta.
 */
export interface UcamRadioOption {
  value: string;
  label: string;
  /** A CONSEQUÊNCIA da alternativa, não o rótulo com outras palavras. */
  hint?: string;
  disabled?: boolean;
}

let seq = 0;

@Component({
  selector: 'ucam-radio-group',
  exportAs: 'ucamRadioGroup',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamRadioGroup), multi: true },
  ],
  template: `
    <fieldset
      [class]="classes()"
      [attr.aria-required]="required() ? 'true' : null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="describedBy()"
      [disabled]="disabled()"
    >
      <!-- <legend> de verdade. Um <span> fazendo as vezes de rótulo não amarra
           as alternativas à pergunta: é o fieldset+legend que declara isso. -->
      <legend class="ucam-radio-group__legenda">{{ label() }}</legend>

      @if (hint(); as h) {
        <span class="ucam-radio-group__apoio" [id]="idApoio">{{ h }}</span>
      }

      <!-- O erro vem ANTES das alternativas na ordem de leitura: quem ouve
           precisa saber que há erro antes de escolher de novo, e não depois. -->
      @if (invalid() && errorMessage()) {
        <span class="ucam-radio-group__erro" [id]="idErro">
          <ucam-icon name="circleAlert" size="sm" aria-hidden="true" />
          {{ errorMessage() }}
        </span>
      }

      <div class="ucam-radio-group__opcoes">
        @for (op of options(); track op.value) {
          <label class="ucam-radio">
            <input
              type="radio"
              [name]="nome"
              [value]="op.value"
              [checked]="op.value === value()"
              [disabled]="op.disabled || disabled()"
              [attr.required]="required() ? '' : null"
              (change)="escolher(op.value)"
              (blur)="onTouched()"
            />
            <span class="ucam-radio__texto">
              <span class="ucam-radio__rotulo">{{ op.label }}</span>
              @if (op.hint) {
                <span class="ucam-radio__apoio">{{ op.hint }}</span>
              }
            </span>
          </label>
        }
      </div>
    </fieldset>
  `,
  styles: `
    ucam-radio-group .ucam-radio-group {
      border: 0;
      margin: 0;
      padding: 0;
      min-inline-size: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ucam-space-2);
    }
    ucam-radio-group .ucam-radio-group__legenda {
      padding: 0;
      font-size: var(--ucam-typography-label-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
      line-height: var(--ucam-typography-label-line-height);
      color: var(--ucam-color-text-primary);
    }
    ucam-radio-group .ucam-radio-group__apoio {
      font-size: var(--ucam-typography-caption-font-size);
      line-height: var(--ucam-typography-caption-line-height);
      color: var(--ucam-color-text-secondary);
    }
    ucam-radio-group .ucam-radio-group__opcoes {
      display: flex;
      flex-direction: column;
      gap: var(--ucam-space-2);
    }
    ucam-radio-group .ucam-radio-group--horizontal .ucam-radio-group__opcoes {
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--ucam-space-inline-md);
    }

    /* O alvo é o RÓTULO INTEIRO: o círculo tem 16px e o piso da 2.5.8 é 24. */
    ucam-radio-group .ucam-radio {
      display: flex;
      align-items: start;
      gap: var(--ucam-space-inline-sm);
      cursor: pointer;
    }
    ucam-radio-group .ucam-radio input[type='radio'] {
      appearance: none;
      flex: none;
      inline-size: 1rem;
      block-size: 1rem;
      margin-block-start: 0.15rem;
      border: 1px solid var(--ucam-color-border-default);
      border-radius: var(--ucam-radius-pill);
      background: var(--ucam-color-surface-default);
      cursor: pointer;
    }
    ucam-radio-group .ucam-radio input[type='radio']:checked {
      border-color: var(--ucam-color-action-primary-default);
      box-shadow: inset 0 0 0 3px var(--ucam-color-surface-default);
      background: var(--ucam-color-action-primary-default);
    }
    ucam-radio-group .ucam-radio input[type='radio']:hover:not(:disabled) {
      border-color: var(--ucam-color-border-strong);
    }
    ucam-radio-group .ucam-radio input[type='radio']:disabled {
      background: var(--ucam-color-surface-sunken);
      border-color: var(--ucam-color-border-subtle);
      cursor: not-allowed;
    }
    ucam-radio-group .ucam-radio:has(input:disabled) {
      color: var(--ucam-color-text-disabled);
      cursor: not-allowed;
    }
    ucam-radio-group .ucam-radio__texto {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      min-inline-size: 0;
    }
    ucam-radio-group .ucam-radio__rotulo {
      font-size: var(--ucam-typography-body-font-size);
      line-height: var(--ucam-typography-body-line-height);
    }
    ucam-radio-group .ucam-radio__apoio {
      font-size: var(--ucam-typography-caption-font-size);
      line-height: var(--ucam-typography-caption-line-height);
      color: var(--ucam-color-text-secondary);
    }
    ucam-radio-group .ucam-radio-group__erro {
      display: flex;
      align-items: center;
      gap: var(--ucam-space-inline-xs);
      font-size: var(--ucam-typography-caption-font-size);
      color: var(--ucam-color-feedback-danger-foreground);
    }
    /* Só os NÃO escolhidos ganham o filete de erro: pintar o escolhido de
       vermelho diria que a escolha está errada, quando o que falta é escolher. */
    ucam-radio-group .ucam-radio-group--invalido .ucam-radio input[type='radio']:not(:checked) {
      border-color: var(--ucam-color-feedback-danger-border);
    }
  `,
})
export class UcamRadioGroup implements ControlValueAccessor {
  /** A pergunta. Vira a <legend> do fieldset. */
  readonly label = input.required<string>();
  readonly options = input.required<readonly UcamRadioOption[]>();
  /**
   * Two-way: [(value)]. Diferente do segmented, aqui o vazio é LEGÍTIMO:
   * pré-marcar uma alternativa é responder pela pessoa, e é assim que um valor
   * errado atravessa a revisão sem ninguém notar.
   */
  readonly value = model<string | null>(null);
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly hint = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = model(false);
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Diz o que fazer, não que está errado: "Escolha uma forma de pagamento". */
  readonly errorMessage = input<string | null>(null);

  /**
   * O `name` amarra o grupo no DOM. Único por instância: dois grupos com o
   * mesmo nome na mesma página viram UM grupo, e escolher num desmarca o
   * outro — que é um defeito silencioso e difícil de achar.
   */
  protected readonly nome = `ucam-rg-${++seq}`;
  protected readonly idApoio = `${this.nome}-apoio`;
  protected readonly idErro = `${this.nome}-erro`;

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(this.idApoio);
    if (this.invalid() && this.errorMessage()) ids.push(this.idErro);
    return ids.length ? ids.join(' ') : null;
  });

  protected readonly classes = computed(() => {
    const p = ['ucam-radio-group'];
    if (this.orientation() === 'horizontal') p.push('ucam-radio-group--horizontal');
    if (this.invalid()) p.push('ucam-radio-group--invalido');
    return p.join(' ');
  });

  protected escolher(v: string): void {
    this.value.set(v);
    this.onChange(v);
  }

  protected onTouched: () => void = () => {};
  private onChange: (v: string | null) => void = () => {};

  writeValue(v: string | null): void {
    this.value.set(v);
  }
  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(estado: boolean): void {
    this.disabled.set(estado);
  }

  constructor() {
    if (ngDevMode) {
      queueMicrotask(() => {
        const n = this.options().length;
        if (n < 2) {
          throw new Error(
            '[ucam-radio-group] rádio único não se desmarca e vira um controle que só liga. Com uma alternativa, o componente é checkbox ou switch. Ver spec/components/radio-group.json.',
          );
        }
        if (n > 7) {
          throw new Error(
            `[ucam-radio-group] recebeu ${n} alternativas; acima de sete a comparação entre elas deixa de acontecer — use ucam-select, ou ucam-combobox acima de quinze. Ver spec/components/radio-group.json.`,
          );
        }
        // Apoio deitado duplica a altura da fileira e desalinha os campos
        // vizinhos da linha.
        if (this.orientation() === 'horizontal' && this.options().some((o) => o.hint)) {
          throw new Error(
            '[ucam-radio-group] orientation="horizontal" não convive com apoio por alternativa: a linha de apoio deitada desalinha os campos vizinhos. Use vertical.',
          );
        }
      });
    }
  }
}

declare const ngDevMode: boolean;
