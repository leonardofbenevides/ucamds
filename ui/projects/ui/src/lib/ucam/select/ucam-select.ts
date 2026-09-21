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

import {
  ZardSelectGroupComponent,
  ZardSelectLabelComponent,
} from '@/shared/components/select/select-group.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';

import { UcamField, describedBy, nextFieldIds } from '../field/ucam-field';
import { UcamIcon } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/select.json
 *
 * Usa o OVERLAY do z-select, não o <select> nativo — ver ADR-011.
 *
 * A decisão anterior era o nativo, e o raciocínio dela continua correto no
 * que dizia: teclado, typeahead e seletor de roda do celular vêm de graça.
 * O que ela não pesava é que a LISTA ABERTA de um select nativo não é
 * estilizável em navegador nenhum. Na prática, metade do componente ficava
 * fora do design system: o campo fechado seguia a marca e, ao abrir, a lista
 * aparecia com o azul do Windows. Um design system que não alcança o momento
 * da escolha não está documentando esse componente.
 *
 * O que se perde está registrado na ADR-011 e não é pequeno: no celular, o
 * seletor nativo é melhor que qualquer overlay.
 */
export interface UcamOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

@Component({
  selector: 'ucam-select',
  exportAs: 'ucamSelect',
  imports: [
    UcamField,
    UcamIcon,
    ZardSelectComponent,
    ZardSelectGroupComponent,
    ZardSelectItemComponent,
    ZardSelectLabelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamSelect), multi: true }],
  template: `
    <ucam-field
      [label]="label()"
      [labelHidden]="labelHidden()"
      [hint]="hintEfetivo()"
      [errorMessage]="errorMessage()"
      [invalid]="invalid()"
      [required]="required()"
      [controlId]="ids.controlId"
      [hintId]="ids.hintId"
      [errorId]="ids.errorId"
    >
      <!-- aria-busy mora aqui: o z-select não o expõe, e o contrato pede que o
           carregamento seja anunciado, não só pintado de cinza. -->
      <span
        class="relative"
        [class.block]="width() === 'full'"
        [class.w-full]="width() === 'full'"
        [class.inline-block]="width() === 'content'"
        [attr.aria-busy]="loading() ? 'true' : null"
      >
        <z-select
          [zTriggerId]="ids.controlId"
          [zValue]="value()"
          [zPlaceholder]="placeholder()"
          [zDisabled]="bloqueado()"
          [zInvalid]="invalid()"
          zPosition="popper"
          [class]="width() === 'full' ? 'block w-full' : 'inline-block'"
          (zSelectionChange)="onSelect($event)"
        >
          @for (g of grupos(); track g.nome ?? $index) {
            @if (g.nome) {
              <z-select-group>
                <span z-select-label>{{ g.nome }}</span>
                @for (o of g.opcoes; track o.value) {
                  <z-select-item [zValue]="o.value" [zDisabled]="o.disabled ?? false">
                    {{ o.label }}
                  </z-select-item>
                }
              </z-select-group>
            } @else {
              @for (o of g.opcoes; track o.value) {
                <z-select-item [zValue]="o.value" [zDisabled]="o.disabled ?? false">
                  {{ o.label }}
                </z-select-item>
              }
            }
          }
        </z-select>

        <!-- O chevron é do gatilho da base. O spinner do contrato o COBRE
             enquanto carrega: é a única parte da anatomia que a base não
             tem, e sobrepor evita bifurcar o trigger inteiro. -->
        @if (loading()) {
          <span
            class="pointer-events-none absolute inset-y-0 right-2.5 flex items-center bg-background pl-1 text-muted-foreground"
            aria-hidden="true"
          >
            <ucam-icon name="loaderCircle" size="sm" class="motion-safe:animate-spin" />
          </span>
        }
      </span>
    </ucam-field>
  `,
  /*
   * O PAINEL ABERTO. Ele mora num overlay do CDK, fora do hospedeiro, e por
   * isso o seletor é o data-slot da base e não uma classe nossa. Três defeitos
   * medidos em 13/09/2026 na página do catálogo:
   *
   * 1. Abria POR CIMA do campo. A base vem em item-aligned, que alinha a opção
   *    escolhida ao gatilho como o menu nativo do macOS: a lista começava 2px
   *    acima do campo e cobria os 32px dele. Agora é popper, abaixo, com o vão
   *    de 4px (translate-y-1) que o .ucam-listbox do Trilho A também tem.
   * 2. Fio na cor do TEXTO. A classe border da base não traz cor, e quem dá
   *    cor a border sem cor é o @layer base da folha da biblioteca, que o site
   *    não importa de propósito. Sem ela, o Tailwind v4 cai em currentColor.
   * 3. Sem sombra e com raio de 6px, onde o Trilho A tem elevation.overlay e
   *    raio de superfície.
   *
   * Tudo por token, sem depender da camada base de quem consome.
   */
  styles: `
    [data-slot='select-content'] {
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      border-color: var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
      box-shadow: var(--ucam-elevation-overlay);
    }
  `,
})
export class UcamSelect implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly options = input.required<UcamOption[]>();
  readonly placeholder = input('Selecione');
  readonly hint = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = model(false);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly errorMessage = input<string | null>(null);
  readonly width = input<'content' | 'full'>('content');

  /**
   * Nome do campo do qual este depende. Enquanto o pai estiver vazio o
   * controle fica bloqueado e DIZ o motivo — no legado ele aparecia
   * habilitado e vazio, sem explicar nada.
   */
  readonly dependsOn = input<string | null>(null);
  readonly dependencyFilled = input(true, { transform: booleanAttribute });

  readonly value = model<string>('');
  /*
   * O output vem do model() acima — declarar um output homônimo colidia com
   * ele, e o compilador do Angular 22 recusa: "bound to both". A API pública
   * não muda: model() já emite XChange a cada escrita de valor.
   */

  protected readonly ids = nextFieldIds('ucam-sel');

  protected readonly aguardandoDependencia = computed(
    () => !!this.dependsOn() && !this.dependencyFilled(),
  );

  protected readonly bloqueado = computed(
    () => this.disabled() || this.loading() || this.aguardandoDependencia(),
  );

  /** O estado de espera é anunciado por texto, não só pelo cinza do controle. */
  protected readonly hintEfetivo = computed(() => {
    if (this.aguardandoDependencia()) return `Selecione ${this.dependsOn()} primeiro.`;
    if (this.loading()) return 'Carregando opções…';
    return this.hint();
  });

  protected readonly describedBy = computed(() =>
    describedBy(this.ids, !!this.hintEfetivo(), this.invalid() && !!this.errorMessage()),
  );

  protected readonly grupos = computed(() => {
    const out: { nome: string | null; opcoes: UcamOption[] }[] = [];
    for (const o of this.options()) {
      const nome = o.group ?? null;
      const ultimo = out.at(-1);
      if (ultimo && ultimo.nome === nome) ultimo.opcoes.push(o);
      else out.push({ nome, opcoes: [o] });
    }
    return out;
  });

  /** A base emite string em modo simples e string[] em múltiplo, que não usamos. */
  protected onSelect(v: string | string[]): void {
    const valor = Array.isArray(v) ? (v[0] ?? '') : v;
    this.value.set(valor);
    this.onChangeFn(valor);
    this.onTouched();
  }

  private onChangeFn: (v: string) => void = () => {};
  protected onTouched: () => void = () => {};
  writeValue(v: string | null): void {
    this.value.set(v ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChangeFn = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
