import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ZardInputComponent } from '../../shared/components/input/input.component';
import { UcamField, describedBy, nextFieldIds } from '../field/ucam-field';
import { UcamButton } from '../button/ucam-button';
import { UcamIcon } from '../icon/ucam-icon';
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
 * O CALENDÁRIO É O DO DS (29/09/2026), o mesmo popover .ucam-calendario que
 * o dataScript do Trilho A abre desde 28/09. O nativo por `showPicker()` saiu
 * da precisão de dia: é do sistema operacional, não recebe estilo, e cada
 * navegador desenha um — as telas mostravam dois calendários diferentes para
 * o mesmo campo, conforme o trilho. O ícone mora DENTRO do campo, no início,
 * decorativo: o campo inteiro é o gatilho. Clique (ou Alt+seta para baixo)
 * abre; o foco pelo Tab não abre nada, porque quem chega pelo teclado digita.
 *
 * O popover é role=dialog NÃO modal, com um dia focável por vez (roving
 * tabindex): setas andam um dia ou uma semana, PageUp/PageDown um mês,
 * Home/End o começo e o fim da semana, Enter/Espaço escolhe, Esc fecha e
 * devolve o foco ao campo. Dia fora de min/max fica aria-disabled — continua
 * focável, para a seta não pular buracos, e não é escolhível.
 *
 * A precisão de MÊS continua no nativo (type=month), por botão ao lado: o DS
 * ainda não tem grade de meses, e a de dias não serve para escolher mês.
 */
export type UcamDatePrecision = 'day' | 'month' | 'year';

interface Regra {
  /** Dígitos que a máscara aceita. */
  max: number;
  /** A dica padrão, que também é o formato esperado na mensagem de erro. */
  formato: string;
  /** Largura pelo conteúdo — acaba com as larguras arbitrárias do legado. */
  largura: string;
  /** O `type` do input nativo que abre o seletor — só o de mês sobrou nele. */
  tipoNativo: string;
  fmt: (d: string) => string;
}

const REGRA: Record<UcamDatePrecision, Regra> = {
  day: {
    max: 8,
    formato: 'dd/mm/aaaa',
    // 29/09/2026: a mesma largura do Trilho A (calc(10ch + 3rem)) — o ícone
    // entrou no campo e come o recuo inicial.
    largura: 'w-[calc(10ch+3rem)]',
    // Sem nativo: a precisão de dia abre o calendário do DS.
    tipoNativo: '',
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

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const SEMANA: [string, string][] = [
  ['D', 'domingo'], ['S', 'segunda'], ['T', 'terça'], ['Q', 'quarta'],
  ['Q', 'quinta'], ['S', 'sexta'], ['S', 'sábado'],
];
const doisD = (n: number) => (n < 10 ? '0' : '') + n;
const isoDe = (d: Date) => `${d.getFullYear()}-${doisD(d.getMonth() + 1)}-${doisD(d.getDate())}`;
const hojeLocal = () => {
  const h = new Date();
  return new Date(h.getFullYear(), h.getMonth(), h.getDate());
};

interface DiaCal {
  iso: string;
  dia: number;
  rotulo: string;
  fora: boolean;
}

const porExtenso = (iso: string) => {
  const [a, m, d] = iso.split('-');
  return d ? `${d}/${m}/${a}` : `${m}/${a}`;
};

@Component({
  selector: 'ucam-date-field',
  exportAs: 'ucamDateField',
  imports: [UcamField, ZardInputComponent, UcamIconButton, UcamIcon, UcamButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UcamDateField), multi: true },
  ],
  host: {
    '(document:click)': 'aoClicarFora($event)',
    '(document:focusin)': 'aoFocarFora($event)',
    '(window:resize)': 'fecharCalendario(false)',
  },
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
      <span class="ucam-date-field" [class.ucam-date-field--calendario]="calendarioDs()">
        @if (calendarioDs()) {
          <!-- Decorativo: quem nomeia o campo é o rótulo, e quem abre o
               calendário é o próprio campo. Sem pointer-events, o clique no
               ícone cai no input. -->
          <ucam-icon name="calendar" size="sm" class="ucam-date-field__icone" aria-hidden="true" />
        }
        <input
          #campo
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
          [attr.aria-haspopup]="calendarioDs() ? 'dialog' : null"
          [attr.aria-expanded]="calendarioDs() ? aberto() : null"
          [attr.aria-controls]="aberto() ? idCalendario : null"
          [disabled]="disabled()"
          (input)="aoDigitar($event)"
          (blur)="aoSair()"
          (click)="abrirCalendario()"
          (keydown)="aoTeclarNoCampo($event)"
        />

        @if (aberto()) {
          <div
            #calendario
            class="ucam-calendario"
            [class.ucam-calendario--acima]="acima()"
            role="dialog"
            [id]="idCalendario"
            [attr.aria-label]="'Escolher ' + label() + ' no calendário'"
            (keydown)="aoTeclarNoCalendario($event)"
          >
            <div class="ucam-calendario__cabeca">
              <ucam-icon-button icon="chevronLeft" label="Mês anterior" size="sm" (click)="trocarMes(-1)" />
              <span class="ucam-calendario__mes" aria-live="polite">{{ tituloMes() }}</span>
              <ucam-icon-button icon="chevronRight" label="Próximo mês" size="sm" (click)="trocarMes(1)" />
            </div>
            <table class="ucam-calendario__grade">
              <thead>
                <tr>
                  @for (s of semana; track $index) {
                    <th scope="col" [attr.abbr]="s[1]">{{ s[0] }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (linha of semanas(); track $index) {
                  <tr>
                    @for (d of linha; track $index) {
                      <td>
                        @if (d) {
                          <button
                            type="button"
                            class="ucam-calendario__dia"
                            [attr.data-dia]="d.iso"
                            [attr.aria-label]="d.rotulo"
                            [attr.aria-pressed]="d.iso === escolhido() ? 'true' : null"
                            [attr.aria-current]="d.iso === hoje() ? 'date' : null"
                            [attr.aria-disabled]="d.fora ? 'true' : null"
                            [tabIndex]="d.iso === focoIso() ? 0 : -1"
                            (click)="escolherDia(d)"
                          >
                            {{ d.dia }}
                          </button>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
            <div class="ucam-calendario__pe">
              <ucam-button variant="ghost" size="sm" [disabled]="hojeFora()" (click)="escolherHoje()">Hoje</ucam-button>
            </div>
          </div>
        }

        @if (mostrarSeletor()) {
          <ucam-icon-button
            icon="calendar"
            label="Escolher mês no seletor"
            size="sm"
            [disabled]="disabled()"
            (click)="abrirNativo()"
          />
          <!-- O input nativo NÃO é o campo: ele existe só para emprestar o
               seletor de MÊS do sistema. Fora da ordem de tabulação e escondido
               do leitor de tela, porque quem representa o campo é o de texto
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
    /* O CALENDÁRIO DO DS, com a pele do Trilho A (.ucam-calendario em
       build-css.mjs, 28/09/2026) copiada aqui porque quem usa só @ucam/ui não
       carrega aquela folha. Mesmos valores, para os dois trilhos abrirem o
       mesmo desenho (29/09/2026). */
    ucam-date-field .ucam-date-field__icone {
      position: absolute;
      inset-inline-start: 0.625rem;
      inset-block-start: 50%;
      translate: 0 -50%;
      color: var(--ucam-color-text-placeholder);
      pointer-events: none;
      z-index: 1;
    }
    ucam-date-field .ucam-date-field--calendario > input {
      padding-inline-start: 2.125rem;
      cursor: pointer;
    }
    ucam-date-field .ucam-calendario {
      position: absolute;
      z-index: var(--ucam-z-overlay);
      inset-inline-start: 0;
      inset-block-start: calc(100% + 0.25rem);
      inline-size: 17.5rem;
      padding: var(--ucam-space-inline-sm);
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
      box-shadow: var(--ucam-elevation-overlay);
    }
    ucam-date-field .ucam-calendario--acima {
      inset-block-start: auto;
      inset-block-end: calc(100% + 0.25rem);
    }
    ucam-date-field .ucam-calendario__cabeca {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ucam-space-inline-xs);
      margin-block-end: var(--ucam-space-inline-xs);
    }
    ucam-date-field .ucam-calendario__mes {
      font-weight: var(--ucam-typography-label-font-weight);
      font-size: var(--ucam-typography-body-sm-font-size);
    }
    ucam-date-field .ucam-calendario__mes::first-letter { text-transform: uppercase; }
    ucam-date-field .ucam-calendario__grade {
      inline-size: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    ucam-date-field .ucam-calendario__grade th {
      padding-block: 0.25rem;
      font-size: var(--ucam-typography-caption-font-size);
      font-weight: var(--ucam-typography-label-font-weight);
      color: var(--ucam-color-text-secondary);
      text-align: center;
    }
    ucam-date-field .ucam-calendario__grade td { padding: 1px; text-align: center; }
    ucam-date-field .ucam-calendario__dia {
      inline-size: 100%;
      aspect-ratio: 1;
      min-block-size: 2rem;
      border: 0;
      border-radius: var(--ucam-radius-control);
      background: none;
      font: inherit;
      font-size: var(--ucam-typography-body-sm-font-size);
      font-variant-numeric: tabular-nums;
      color: var(--ucam-color-text-primary);
      cursor: pointer;
    }
    ucam-date-field .ucam-calendario__dia:hover { background: var(--ucam-color-interaction-hover); }
    ucam-date-field .ucam-calendario__dia:focus-visible {
      outline: var(--ucam-focus-ring-width) solid var(--ucam-color-border-focus);
      outline-offset: 1px;
    }
    /* Hoje: peso e um traço embaixo — não cor, que é do escolhido. */
    ucam-date-field .ucam-calendario__dia[aria-current='date'] {
      font-weight: var(--ucam-typography-action-font-weight);
      text-decoration: underline;
      text-underline-offset: 0.25em;
    }
    ucam-date-field .ucam-calendario__dia[aria-pressed='true'] {
      background: var(--ucam-color-action-primary-default);
      color: var(--ucam-color-text-on-action);
      font-weight: var(--ucam-typography-action-font-weight);
    }
    /* Fora de min/max: a tinta do desabilitado (ADR-042) e nada de hover —
       o dia continua na grade para a seta não saltar, mas não se escolhe. */
    ucam-date-field .ucam-calendario__dia[aria-disabled='true'] {
      color: var(--ucam-color-text-disabled);
      background: none;
      cursor: not-allowed;
    }
    ucam-date-field .ucam-calendario__pe {
      display: flex;
      justify-content: flex-end;
      margin-block-start: var(--ucam-space-inline-xs);
      padding-block-start: var(--ucam-space-inline-xs);
      border-block-start: 1px solid var(--ucam-color-border-subtle);
    }
    @media (forced-colors: active) {
      ucam-date-field .ucam-calendario__dia[aria-pressed='true'] { outline: 2px solid CanvasText; }
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
  // read: ElementRef — o #campo está num <input z-input>, e sem o read o
  // viewChild devolve a instância do componente da base, que não tem
  // nativeElement: fechar o calendário com Esc lançava erro ao devolver o
  // foco (pego pelo teste do calendário, 29/09/2026).
  private readonly campo = viewChild('campo', { read: ElementRef<HTMLInputElement> });
  private readonly calendario = viewChild<ElementRef<HTMLElement>>('calendario');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly ids = nextFieldIds('ucam-df');
  protected readonly idCalendario = `${this.ids.controlId}-calendario`;
  protected readonly semana = SEMANA;
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
  /** Precisão de dia: o calendário do DS. */
  protected readonly calendarioDs = computed(
    () => this.showPicker() && this.precision() === 'day',
  );
  /** Precisão de mês: o seletor nativo de mês, por botão ao lado. */
  protected readonly mostrarSeletor = computed(
    () => this.showPicker() && !!this.regra().tipoNativo,
  );

  // ---------------------------------------------------------- calendário ---
  protected readonly aberto = signal(false);
  protected readonly acima = signal(false);
  /** O dia que tem o tabindex 0 — e que define o mês desenhado. */
  private readonly foco = signal<Date>(hojeLocal());
  protected readonly focoIso = computed(() => isoDe(this.foco()));
  protected readonly hoje = signal(isoDe(hojeLocal()));
  protected readonly escolhido = computed(() => {
    const v = this.value() ?? '';
    return dataReal(v, 'day') ? v : '';
  });
  protected readonly tituloMes = computed(
    () => `${MESES[this.foco().getMonth()]} de ${this.foco().getFullYear()}`,
  );

  private fora(iso: string): boolean {
    const min = this.min();
    const max = this.max();
    return (!!min && iso < min) || (!!max && iso > max);
  }

  protected readonly hojeFora = computed(() => this.fora(this.hoje()));

  /** A grade do mês: semanas de domingo a sábado, vazio antes do dia 1. */
  protected readonly semanas = computed<(DiaCal | null)[][]>(() => {
    const ano = this.foco().getFullYear();
    const mes = this.foco().getMonth();
    const dias = new Date(ano, mes + 1, 0).getDate();
    const linhas: (DiaCal | null)[][] = [];
    let linha: (DiaCal | null)[] = Array(new Date(ano, mes, 1).getDay()).fill(null);
    for (let dia = 1; dia <= dias; dia++) {
      const d = new Date(ano, mes, dia);
      const iso = isoDe(d);
      linha.push({
        iso,
        dia,
        rotulo: `${dia} de ${MESES[mes]} de ${ano}, ${SEMANA[d.getDay()][1]}`,
        fora: this.fora(iso),
      });
      if (d.getDay() === 6 || dia === dias) {
        linhas.push(linha);
        linha = [];
      }
    }
    return linhas;
  });

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

  /**
   * Abre no CLIQUE, não no foco (29/09/2026, como o dataScript): quem chega
   * pelo Tab vai digitar, e um popover que salta a cada parada de tabulação
   * cobre o campo seguinte do formulário.
   */
  protected abrirCalendario(focarDia = false): void {
    if (!this.calendarioDs() || this.disabled()) return;
    if (this.aberto()) {
      if (focarDia) this.focarDia();
      return;
    }
    this.hoje.set(isoDe(hojeLocal()));
    const base = this.escolhido() ? new Date(this.escolhido() + 'T00:00:00') : hojeLocal();
    this.foco.set(this.dentroDoIntervalo(base));
    this.acima.set(false);
    this.aberto.set(true);
    afterNextRender(
      {
        read: () => {
          this.posicionar();
          if (focarDia) this.focarDia();
        },
      },
      { injector: this.injector },
    );
  }

  /** Abrir em hoje quando hoje está fora de min/max poria o foco num dia que
   *  não se escolhe — e às vezes a meses do primeiro que se pode. */
  private dentroDoIntervalo(d: Date): Date {
    const iso = isoDe(d);
    const min = this.min();
    const max = this.max();
    if (min && iso < min && dataReal(min, 'day')) return new Date(min + 'T00:00:00');
    if (max && iso > max && dataReal(max, 'day')) return new Date(max + 'T00:00:00');
    return d;
  }

  /** Abre para CIMA quando falta altura embaixo e sobra em cima — o campo no
   *  pé do formulário perdia a grade fora da janela. */
  private posicionar(): void {
    const cal = this.calendario()?.nativeElement;
    const campo = this.campo()?.nativeElement;
    if (!cal || !campo) return;
    const c = campo.getBoundingClientRect();
    const altura = cal.getBoundingClientRect().height;
    const embaixo = window.innerHeight - c.bottom - 8;
    const emCima = c.top - 8;
    this.acima.set(altura > embaixo && emCima > embaixo);
  }

  protected fecharCalendario(devolverFoco: boolean): void {
    if (!this.aberto()) return;
    this.aberto.set(false);
    if (devolverFoco) this.campo()?.nativeElement.focus();
  }

  private focarDia(): void {
    const cal = this.calendario()?.nativeElement;
    cal?.querySelector<HTMLButtonElement>(`[data-dia="${this.focoIso()}"]`)?.focus();
  }

  /** Move o dia focado e leva o foco junto, depois que a grade redesenhar —
   *  trocar de mês troca os botões, e focar antes seria focar o que sai. */
  private mover(dias: number, meses = 0): void {
    const f = this.foco();
    let d = new Date(f.getFullYear(), f.getMonth() + meses, f.getDate() + dias);
    // 31/01 + um mês não é 03/03: PageDown pára no último dia do mês seguinte.
    if (meses && d.getDate() !== f.getDate()) d = new Date(f.getFullYear(), f.getMonth() + meses + 1, 0);
    this.foco.set(d);
    afterNextRender({ read: () => this.focarDia() }, { injector: this.injector });
  }

  protected trocarMes(delta: number): void {
    const f = this.foco();
    this.foco.set(new Date(f.getFullYear(), f.getMonth() + delta, 1));
  }

  protected escolherDia(d: DiaCal): void {
    if (d.fora) return;
    this.aplicar(d.iso);
  }

  protected escolherHoje(): void {
    if (this.hojeFora()) return;
    this.aplicar(isoDe(hojeLocal()));
  }

  private aplicar(iso: string): void {
    this.rascunho = null;
    this.value.set(iso);
    this.onChange(iso);
    // O modelo pode não ter mudado (a mesma data escolhida de novo) e, com
    // rascunho na tela, o computed não recalcularia: escreve direto.
    const campo = this.campo()?.nativeElement;
    if (campo) campo.value = this.regra().fmt(paraDigitos(iso, this.precision()));
    this.fecharCalendario(true);
  }

  protected aoTeclarNoCampo(e: KeyboardEvent): void {
    if (!this.calendarioDs()) return;
    if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      this.abrirCalendario(true);
    } else if (e.key === 'Escape' && this.aberto()) {
      e.preventDefault();
      this.fecharCalendario(true);
    } else if (e.key === 'ArrowDown' && this.aberto()) {
      e.preventDefault();
      this.focarDia();
    }
  }

  protected aoTeclarNoCalendario(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.fecharCalendario(true);
      return;
    }
    const alvo = e.target as HTMLElement;
    if (!alvo.hasAttribute('data-dia')) return;
    // Enter e Espaço ficam com o clique nativo do <button>: o mesmo caminho
    // do ponteiro, e o dia fora do intervalo recusa nos dois.
    const mapa: Record<string, [number, number?]> = {
      ArrowLeft: [-1],
      ArrowRight: [1],
      ArrowUp: [-7],
      ArrowDown: [7],
      PageUp: [0, -1],
      PageDown: [0, 1],
      Home: [-this.foco().getDay()],
      End: [6 - this.foco().getDay()],
    };
    const passo = mapa[e.key];
    if (!passo) return;
    e.preventDefault();
    this.mover(passo[0], passo[1] ?? 0);
  }

  /** Clique fora do campo e do popover fecha, sem roubar o foco de volta. */
  protected aoClicarFora(e: Event): void {
    if (this.aberto() && !this.host.nativeElement.contains(e.target as Node)) {
      this.fecharCalendario(false);
    }
  }

  /** Foco que sai do campo e do calendário (Tab para a frente) fecha. */
  protected aoFocarFora(e: FocusEvent): void {
    if (this.aberto() && !this.host.nativeElement.contains(e.target as Node)) {
      this.fecharCalendario(false);
    }
  }

  protected abrirNativo(): void {
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
