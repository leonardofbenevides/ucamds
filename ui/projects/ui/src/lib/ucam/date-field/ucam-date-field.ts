import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  model,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ZardInputComponent } from '@/shared/components/input/input.component';
import { UcamField, describedBy, nextFieldIds } from '../field/ucam-field';
import { UcamIconButton } from '../icon-button/ucam-icon-button';

/**
 * Contrato: spec/components/date-field.json
 *
 * Entrada de data com formato indicado, máscara e seletor de calendário.
 * Sobre o mesmo arranjo do TextField — rótulo persistente, apoio ligado por
 * aria-describedby, erro — mais as regras de data que o legado não tem.
 *
 * DIGITAR SEMPRE FUNCIONA, e o seletor é apoio. É a regra que decide o
 * desenho: data de nascimento de 1974 são doze cliques de calendário e oito
 * teclas digitadas, e o seletor obrigatório é o que torna o SIGFIN penoso para
 * quem lança movimento o dia inteiro.
 *
 * O SELETOR É O NATIVO, por `showPicker()` num <input type="date"> paralelo.
 * Escrever calendário à mão significa reimplementar navegação por seta, mês
 * anterior, ano, retenção de foco e leitura por voz — e errar em algum deles,
 * como erra todo calendário do parque. O nativo já vem com locale, teclado e
 * leitor de tela do sistema. O campo visível continua sendo o de texto: o que
 * o nativo empresta é só o calendário.
 */
export type UcamDatePrecision = 'day' | 'month' | 'year';

interface Regra {
  /** Dígitos que a máscara aceita. */
  max: number;
  /** A dica padrão, que também é o formato esperado na mensagem de erro. */
  formato: string;
  /** Largura pelo conteúdo — acaba com as larguras arbitrárias do legado. */
  largura: string;
  /** O `type` do input nativo que abre o calendário certo. */
  tipoNativo: string;
  fmt: (d: string) => string;
}

const REGRA: Record<UcamDatePrecision, Regra> = {
  day: {
    max: 8,
    formato: 'dd/mm/aaaa',
    largura: 'w-[12ch]',
    tipoNativo: 'date',
    fmt: (d) =>
      d.replace(/(\d{2})(\d{2})?(\d{1,4})?/, (_, a, b, c) => [a, b, c].filter(Boolean).join('/')),
  },
  month: {
    // O Mês/Ano do SIGFIN, que hoje é dois selects lado a lado.
    max: 6,
    formato: 'mm/aaaa',
    largura: 'w-[9ch]',
    tipoNativo: 'month',
    fmt: (d) => d.replace(/(\d{2})(\d{1,4})?/, (_, a, b) => [a, b].filter(Boolean).join('/')),
  },
  year: {
    max: 4,
    formato: 'aaaa',
    largura: 'w-[6ch]',
    // Não existe <input type="year">: a precisão de ano não tem calendário, e
    // oferecer um seria pedir dois cliques para escolher o que já está escrito.
    tipoNativo: '',
    fmt: (d) => d,
  },
};

/** dd/mm/aaaa → aaaa-mm-dd. Vazio quando a data ainda não está completa. */
function paraIso(digitos: string, precisao: UcamDatePrecision): string {
  if (digitos.length < REGRA[precisao].max) return '';
  if (precisao === 'year') return digitos;
  if (precisao === 'month') return `${digitos.slice(2)}-${digitos.slice(0, 2)}`;
  return `${digitos.slice(4)}-${digitos.slice(2, 4)}-${digitos.slice(0, 2)}`;
}

/** aaaa-mm-dd → ddmmaaaa. O caminho de volta, para o que o calendário devolve. */
function paraDigitos(iso: string, precisao: UcamDatePrecision): string {
  const p = iso.split('-');
  if (precisao === 'year') return p[0] ?? '';
  if (precisao === 'month') return `${p[1] ?? ''}${p[0] ?? ''}`;
  return `${p[2] ?? ''}${p[1] ?? ''}${p[0] ?? ''}`;
}

/** Existe de verdade no calendário: 31/02 é sintaticamente válido e não é data. */
function dataReal(iso: string, precisao: UcamDatePrecision): boolean {
  if (precisao === 'year') return /^\d{4}$/.test(iso);
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return false;
  if (precisao === 'month') return true;
  // O Date corrige 31/02 para 03/03 em silêncio; comparar de volta é o que
  // pega a correção.
  return d.toISOString().slice(0, 10) === iso;
}

const porExtenso = (iso: string) => {
  const [a, m, d] = iso.split('-');
  return d ? `${d}/${m}/${a}` : `${m}/${a}`;
};

@Component({
  selector: 'ucam-date-field',
  exportAs: 'ucamDateField',
  imports: [UcamField, ZardInputComponent, UcamIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamDateField), multi: true },
  ],
  template: `
    <ucam-field
      [label]="label()"
      [hint]="dicaEfetiva()"
      [errorMessage]="mensagemErro()"
      [invalid]="invalidoEfetivo()"
      [required]="required()"
      [controlId]="ids.controlId"
      [hintId]="ids.hintId"
      [errorId]="ids.errorId"
    >
      <span class="ucam-date-field">
        <input
          z-input
          [id]="ids.controlId"
          [class]="regra().largura"
          type="text"
          inputmode="numeric"
          [value]="display()"
          [attr.maxlength]="regra().formato.length"
          [attr.autocomplete]="autocomplete()"
          [attr.required]="required() ? '' : null"
          [attr.aria-required]="required() ? 'true' : null"
          [attr.aria-invalid]="invalidoEfetivo() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          [disabled]="disabled()"
          (input)="aoDigitar($event)"
          (blur)="aoSair()"
        />

        @if (mostrarSeletor()) {
          <ucam-icon-button
            icon="calendar"
            label="Escolher data no calendário"
            size="sm"
            [disabled]="disabled()"
            (click)="abrirCalendario()"
          />
          <!-- O input nativo NÃO é o campo: ele existe só para emprestar o
               calendário do sistema. Fora da ordem de tabulação e escondido do
               leitor de tela, porque quem representa o campo é o de texto
               acima — dois controles para o mesmo dado seriam duas paradas de
               tabulação para uma coisa só. -->
          <input
            #nativo
            class="ucam-date-field__nativo"
            [type]="regra().tipoNativo"
            [value]="iso()"
            [attr.min]="min()"
            [attr.max]="max()"
            tabindex="-1"
            aria-hidden="true"
            (change)="aoEscolherNoCalendario($event)"
          />
        }
      </span>
    </ucam-field>
  `,
  styles: `
    ucam-date-field .ucam-date-field {
      display: inline-flex;
      align-items: center;
      gap: var(--ucam-space-inline-xs);
      position: relative;
    }
    /* Sem display:none: um input escondido assim não abre o seletor em parte
       dos navegadores. Fica com tamanho zero, sobre o botão, para o calendário
       nascer ancorado onde a pessoa clicou. */
    ucam-date-field .ucam-date-field__nativo {
      position: absolute;
      inset-inline-end: 0;
      inset-block-end: 0;
      inline-size: 1px;
      block-size: 1px;
      opacity: 0;
      pointer-events: none;
      border: 0;
      padding: 0;
    }
  `,
})
export class UcamDateField implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly precision = input<UcamDatePrecision>('day');
  readonly hint = input<string | null>(null);
  /** ISO. Fora do intervalo é erro com mensagem específica, não silêncio. */
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = model(false);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly errorMessage = input<string | null>(null);
  readonly showPicker = input(true, { transform: booleanAttribute });
  /** Token HTML de autopreenchimento: `bday` em data de nascimento (WCAG 1.3.5). */
  readonly autocomplete = input<string | null>(null);

  /** O valor trafega em ISO (aaaa-mm-dd), nunca com máscara. */
  readonly value = model<string>('');

  private readonly nativo = viewChild<ElementRef<HTMLInputElement>>('nativo');

  protected readonly ids = nextFieldIds('ucam-df');
  protected readonly regra = computed(() => REGRA[this.precision()]);

  /** Os dígitos que a pessoa digitou, antes de virarem data. */
  private readonly digitos = computed(() => paraDigitos(this.value() ?? '', this.precision()));

  /** Erro que o próprio campo apura — some quando a aplicação declara o seu. */
  private readonly erroLocal = computed(() => {
    const iso = this.value();
    if (!iso) return null;
    if (!dataReal(iso, this.precision())) {
      return `Data inválida. Use ${this.regra().formato}.`;
    }
    const min = this.min();
    const max = this.max();
    if (min && iso < min) return `A data precisa ser posterior a ${porExtenso(min)}.`;
    if (max && iso > max) return `A data precisa ser anterior a ${porExtenso(max)}.`;
    return null;
  });

  protected readonly mensagemErro = computed(() => this.errorMessage() ?? this.erroLocal());
  protected readonly invalidoEfetivo = computed(() => this.invalid() || !!this.erroLocal());

  /**
   * A dica de formato é PERSISTENTE e ligada por aria-describedby — nunca
   * placeholder, que some ao digitar e leva o formato junto, justamente quando
   * a pessoa está digitando.
   */
  protected readonly dicaEfetiva = computed(() => this.hint() ?? this.regra().formato);

  protected readonly describedBy = computed(() =>
    describedBy(this.ids, !!this.dicaEfetiva(), this.invalidoEfetivo() && !!this.mensagemErro()),
  );

  protected readonly iso = computed(() => this.value() ?? '');
  protected readonly mostrarSeletor = computed(
    () => this.showPicker() && !!this.regra().tipoNativo,
  );

  protected readonly display = computed(() => {
    const d = this.rascunho ?? this.digitos();
    return d ? this.regra().fmt(d) : '';
  });

  /**
   * O que está sendo digitado ANTES de virar data completa. Sem isto, digitar
   * "0" apagaria o campo a cada tecla: o modelo só aceita ISO completo, e a
   * volta do modelo para a tela zeraria o que ainda não fecha uma data.
   */
  private rascunho: string | null = null;

  protected aoDigitar(evento: Event): void {
    const alvo = evento.target as HTMLInputElement;
    const r = this.regra();
    const limpo = alvo.value.replace(/\D/g, '').slice(0, r.max);
    this.rascunho = limpo;
    alvo.value = limpo ? r.fmt(limpo) : '';
    const iso = paraIso(limpo, this.precision());
    this.value.set(iso);
    this.onChange(iso);
  }

  protected aoSair(): void {
    // O rascunho morre no blur: a partir daqui o que manda é o modelo, e uma
    // data pela metade tem de aparecer como o que é.
    this.rascunho = null;
    this.onTouched();
  }

  protected abrirCalendario(): void {
    const el = this.nativo()?.nativeElement;
    if (!el) return;
    // showPicker exige ativação do usuário — o clique no botão é ela. Em
    // navegador sem suporte, o campo de texto continua sendo o caminho: a
    // digitação nunca dependeu disto.
    el.showPicker?.();
  }

  protected aoEscolherNoCalendario(evento: Event): void {
    const iso = (evento.target as HTMLInputElement).value;
    if (!iso) return;
    this.rascunho = null;
    this.value.set(iso);
    this.onChange(iso);
    // O foco volta para o CAMPO, não fica no input escondido: o contrato exige
    // devolução do foco ao campo quando o seletor fecha.
    (document.getElementById(this.ids.controlId) as HTMLInputElement | null)?.focus();
  }

  // ControlValueAccessor — o valor trafega sempre em ISO.
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string | null): void {
    this.rascunho = null;
    this.value.set(v ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(estado: boolean): void {
    this.disabled.set(estado);
  }
}
