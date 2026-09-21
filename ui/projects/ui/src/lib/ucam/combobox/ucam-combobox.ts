import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import {
  ZardComboboxComponent,
  ZardComboboxContentComponent,
  ZardComboboxEmptyComponent,
  ZardComboboxGroupComponent,
  ZardComboboxInputComponent,
  ZardComboboxItemComponent,
  ZardComboboxLabelComponent,
  ZardComboboxListComponent,
} from '@/shared/components/combobox';

import { UcamField, describedBy, nextFieldIds } from '../field/ucam-field';

/**
 * Contrato: spec/components/combobox.json
 *
 * A escala do Select. Envolve o z-combobox da base, que é overlay do CDK com
 * filtro e teclado — não um <select>. É por isso que ele existe: a lista de um
 * select nativo é desenhada pelo sistema operacional e nenhum navegador deixa
 * estilizá-la. O caso que motivou o componente é o campo Setor do Protocolo,
 * com 58 opções.
 *
 * NÃO substitui o ucam-select. O contrato marca a fronteira em 15 opções: em
 * lista curta o select nativo ganha, porque entrega typeahead e o seletor de
 * roda do celular sem custo nenhum.
 *
 * Composição explícita em vez do modo abreviado da base: é o que dá acesso ao
 * zShowClear do input, que o modo abreviado não expõe.
 */
export interface UcamComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

@Component({
  selector: 'ucam-combobox',
  exportAs: 'ucamCombobox',
  imports: [
    UcamField,
    ZardComboboxComponent,
    ZardComboboxInputComponent,
    ZardComboboxContentComponent,
    ZardComboboxListComponent,
    ZardComboboxItemComponent,
    ZardComboboxGroupComponent,
    ZardComboboxLabelComponent,
    ZardComboboxEmptyComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamCombobox), multi: true }],
  template: `
    <ucam-field
      [label]="label()"
      [labelHidden]="labelHidden()"
      [hint]="hintEfetivo()"
      [errorMessage]="errorMessage()"
      [invalid]="invalid()"
      [required]="required()"
      [controlId]="controlId()"
      [hintId]="ids.hintId"
      [errorId]="ids.errorId"
    >
      <!-- aria-busy mora aqui: o z-combobox não o expõe, e o contrato pede
           que o carregamento seja anunciado, não só pintado de cinza. -->
      <span [class]="width() === 'full' ? 'block w-full' : 'inline-block'" [attr.aria-busy]="loading() ? 'true' : null">
        <!-- zWidth: a base tem largura fixa por padrão (w-50). Quem manda é o
             prop width do contrato; o painel acompanha a âncora.
             zValue recebe null, não string vazia: a base conta '' como valor
             escolhido, o que fazia o botão de limpar nascer visível — e ele
             esconde o chevron. -->
        <z-combobox
          [zValue]="value() || null"
          [zWidth]="width() === 'full' ? 'full' : 'md'"
          [zDisabled]="bloqueado()"
          [zInvalid]="invalid()"
          [placeholder]="placeholder()"
          [searchPlaceholder]="searchPlaceholder()"
          [emptyText]="emptyText()"
          [ariaLabel]="label()"
          [ariaDescribedBy]="describedBy() ?? ''"
          (zValueChange)="onEscolha($event)"
          (zQueryChange)="queryChange.emit($event)"
        >
          <!-- zShowClear só com valor e só quando o campo não é obrigatório:
               limpar um campo obrigatório só produz formulário inválido. -->
          <z-combobox-input [zShowClear]="clearable() && !required()" />

          <z-combobox-content>
            <span z-combobox-empty>{{ emptyText() }}</span>

            <div z-combobox-list>
              @for (g of grupos(); track g.nome ?? $index) {
                @if (g.nome) {
                  <div z-combobox-group>
                    <span z-combobox-label>{{ g.nome }}</span>
                    @for (o of g.opcoes; track o.value) {
                      <div z-combobox-item [zValue]="o.value" [zLabel]="o.label" [zDisabled]="o.disabled ?? false">
                        {{ o.label }}
                      </div>
                    }
                  </div>
                } @else {
                  @for (o of g.opcoes; track o.value) {
                    <div z-combobox-item [zValue]="o.value" [zLabel]="o.label" [zDisabled]="o.disabled ?? false">
                      {{ o.label }}
                    </div>
                  }
                }
              }
            </div>
          </z-combobox-content>
        </z-combobox>
      </span>
    </ucam-field>
  `,
})
export class UcamCombobox implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly options = input.required<UcamComboboxOption[]>();
  readonly placeholder = input('Selecione');
  readonly searchPlaceholder = input('Buscar');
  readonly emptyText = input('Nenhum resultado');
  readonly hint = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = model(false);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly errorMessage = input<string | null>(null);
  readonly clearable = input(false, { transform: booleanAttribute });

  /**
   * Default 'full', diferente do Select. Lista longa costuma ter rótulos
   * longos, e largura pelo conteúdo faria o campo saltar a cada escolha.
   */
  readonly width = input<'content' | 'full'>('full');

  /** Mesmo encadeamento do Select — ver spec/components/select.json. */
  readonly dependsOn = input<string | null>(null);
  readonly dependencyFilled = input(true, { transform: booleanAttribute });

  readonly value = model<string>('');
  /*
   * O output vem do model() acima — declarar um output homônimo colidia com
   * ele, e o compilador do Angular 22 recusa: "bound to both". A API pública
   * não muda: model() já emite XChange a cada escrita de valor.
   */
  readonly queryChange = output<string>();

  protected readonly ids = nextFieldIds('ucam-cbx');

  /**
   * O id do input é gerado dentro do z-combobox e não aceita ser passado de
   * fora. Buscamos o real para o `for` do rótulo apontar para algo que existe;
   * até o viewChild resolver, o nome acessível já vem do ariaLabel.
   */
  private readonly combo = viewChild(ZardComboboxComponent);
  protected readonly controlId = computed(() => this.combo()?.inputId ?? this.ids.controlId);

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
    const out: { nome: string | null; opcoes: UcamComboboxOption[] }[] = [];
    for (const o of this.options()) {
      const nome = o.group ?? null;
      const ultimo = out.at(-1);
      if (ultimo && ultimo.nome === nome) ultimo.opcoes.push(o);
      else out.push({ nome, opcoes: [o] });
    }
    return out;
  });

  protected onEscolha(v: string | string[] | null): void {
    // zMultiple fica fora do contrato nesta versão; o array não ocorre.
    const valor = Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
    this.value.set(valor);
    this.onChangeFn(valor);
    this.onTouched();
  }

  private onChangeFn: (v: string) => void = () => {};
  protected onTouched: () => void = () => {};
  writeValue(v: string | null): void { this.value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this.onChangeFn = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }
}
