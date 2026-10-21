import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { UcamButton } from '../button/ucam-button';
import { UcamIcon } from '../icon/ucam-icon';
import { UcamIconButton } from '../icon-button/ucam-icon-button';
import {
  CSS_GRADE,
  type DiaCal,
  deIso,
  hojeLocal,
  isoDe,
  MESES,
  montarMes,
  passoCal,
  SEMANA,
  TECLAS_CAL,
  chaveDe,
  cobre,
  montarOpcoes,
  NIVEL_DA,
  type NivelCal,
  type OpcaoCal,
  type UcamCalendarPrecision,
  type UcamCalendarEvent,
  type UcamDateRange,
} from './ucam-calendar-grade';

export type UcamCalendarVariant = 'grade' | 'agenda';
export type UcamCalendarSelection = 'single' | 'range' | 'none';

/**
 * Contrato: spec/components/calendar.json (ADR-074)
 *
 * O mês inteiro à vista, em duas formas. A GRADE escolhe um dia ou um período
 * sem campo de texto — a mesma grade que o UcamDateField abre no popover, e
 * montada pela mesma função (montarMes). A AGENDA mostra em cada dia o que
 * cai nele e repete tudo numa lista em texto embaixo: a célula de 40px corta
 * título, e cor não é lida por quem não vê.
 *
 * Escrito do zero: a ZardUI tem calendar, mas sem agenda nem período, e com
 * o teclado e o nome de dia diferentes dos do DateField.
 */
@Component({
  selector: 'ucam-calendar',
  exportAs: 'ucamCalendar',
  imports: [UcamIcon, UcamIconButton, UcamButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'block' },
  template: `
    <div
      class="ucam-calendario"
      [class.ucam-calendario--solto]="variant() === 'grade'"
      [class.ucam-calendario--agenda]="variant() === 'agenda'"
      [attr.role]="variant() === 'agenda' ? 'region' : 'group'"
      [attr.aria-label]="label()"
      (keydown)="teclar($event)"
    >
      <div class="ucam-calendario__cabeca">
        <ucam-icon-button icon="chevronLeft" [label]="rotuloPasso()[0]" size="sm" (click)="trocarMes(-1)" />
        @if (sobe(); as acima) {
          <button
            type="button"
            class="ucam-calendario__titulo"
            [attr.aria-label]="tituloMes() + (acima === 'mes' ? ', escolher o mês e o ano' : ', escolher o ano')"
            (click)="subir(acima)"
          >
            <span class="ucam-calendario__mes" aria-live="polite">{{ tituloMes() }}</span>
            <ucam-icon name="chevronDown" size="xs" />
          </button>
        } @else {
          <span class="ucam-calendario__mes" aria-live="polite">{{ tituloMes() }}</span>
        }
        <ucam-icon-button icon="chevronRight" [label]="rotuloPasso()[1]" size="sm" (click)="trocarMes(1)" />
      </div>
      @if (nivel() !== 'dia') {
        <div
          class="ucam-calendario__opcoes"
          [class.ucam-calendario__opcoes--meses]="nivel() === 'mes'"
          [class.ucam-calendario__opcoes--semestres]="nivel() === 'semestre'"
          [class.ucam-calendario__opcoes--anos]="nivel() === 'ano'"
          role="group"
          [attr.aria-label]="tituloMes()"
        >
          @for (op of opcoes(); track op.chave) {
            <button
              type="button"
              class="ucam-calendario__opcao"
              [attr.data-chave]="op.chave"
              [attr.aria-label]="op.rotulo"
              [attr.aria-pressed]="op.escolhido ? 'true' : null"
              [attr.data-intervalo]="op.noPeriodo ? '' : null"
              [attr.aria-current]="op.atual ? 'date' : null"
              [attr.aria-disabled]="op.fora ? 'true' : null"
              [tabIndex]="op.chave === focoChave() ? 0 : -1"
              (click)="escolherOpcao(op.chave, op.fora)"
            >
              <span class="ucam-calendario__opcao-texto">{{ op.texto }}</span>
              @if (op.sub) {
                <span class="ucam-calendario__opcao-sub">{{ op.sub }}</span>
              }
            </button>
          }
        </div>
      } @else {
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
                      [attr.aria-pressed]="d.escolhido || d.iso === ativado() ? 'true' : null"
                      [attr.data-intervalo]="d.noPeriodo ? '' : null"
                      [attr.data-ponta]="d.escolhido && periodoCompleto() ? '' : null"
                      [attr.aria-current]="d.hoje ? 'date' : null"
                      [attr.aria-disabled]="d.fora ? 'true' : null"
                      [tabIndex]="d.iso === focoIso() ? 0 : -1"
                      (click)="escolher(d)"
                    >{{ d.dia }}</button>
                    @if (variant() === 'agenda' && d.eventos.length) {
                      <ul class="ucam-calendario__eventos" aria-hidden="true">
                        @for (e of d.eventos.slice(0, d.eventos.length > 2 ? 1 : 2); track $index) {
                          <li class="ucam-calendario__evento" [attr.data-tom]="e.tone ?? null"><span>{{ e.title }}</span></li>
                        }
                        @if (d.eventos.length > 2) {
                          <li class="ucam-calendario__evento ucam-calendario__evento--mais">+{{ d.eventos.length - 1 }}</li>
                        }
                      </ul>
                    }
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
      }
      @if (variant() === 'grade' && selection() === 'single' && precision() === 'day' && nivel() === 'dia') {
        <div class="ucam-calendario__pe">
          <ucam-button variant="ghost" size="sm" [disabled]="hojeFora()" (click)="escolherHoje()">Hoje</ucam-button>
        </div>
      }
      @if (variant() === 'agenda') {
        <ol class="ucam-calendario__lista">
          @for (e of eventosDoMes(); track $index) {
            <li [attr.data-tom]="e.tone ?? null" [attr.data-destaque]="e.date === ativado() ? '' : null">
              <time [attr.datetime]="e.date">{{ dataCurta(e.date) }}</time>{{ e.title }}
            </li>
          } @empty {
            <li data-vazio>Nenhum evento em {{ nomeMes() }}.</li>
          }
        </ol>
      }
    </div>
  `,
  styles: [
    CSS_GRADE,
    `
    ucam-calendar .ucam-calendario {
      position: relative;
      inline-size: 17.5rem;
      padding: var(--ucam-space-inline-sm);
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-surface);
    }
    ucam-calendar .ucam-calendario--agenda { inline-size: 100%; padding: var(--ucam-space-inset-md); }
    ucam-calendar .ucam-calendario--agenda .ucam-calendario__grade th { padding-inline: 0.5rem; text-align: start; }
    ucam-calendar .ucam-calendario--agenda .ucam-calendario__grade td {
      position: relative;
      block-size: 5.75rem;
      padding: 0;
      vertical-align: top;
      text-align: start;
      border: 1px solid var(--ucam-color-border-subtle);
    }
    ucam-calendar .ucam-calendario--agenda .ucam-calendario__dia {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      inline-size: 100%;
      block-size: 100%;
      min-block-size: 0;
      aspect-ratio: auto;
      padding: 0.375rem 0.5rem;
      border-radius: 0;
    }
    ucam-calendar .ucam-calendario--agenda .ucam-calendario__dia[aria-pressed='true'] {
      background: none;
      color: var(--ucam-color-text-primary);
      box-shadow: inset 0 0 0 2px var(--ucam-color-action-primary-default);
    }
    ucam-calendar .ucam-calendario__eventos {
      position: absolute;
      inset: 1.75rem 0.375rem 0.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--ucam-typography-caption-font-size);
      line-height: 1.25rem;
      pointer-events: none;
    }
    ucam-calendar .ucam-calendario__evento { display: flex; align-items: center; gap: 0.375rem; min-inline-size: 0; }
    ucam-calendar .ucam-calendario__evento > span { min-inline-size: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    ucam-calendar .ucam-calendario__evento::before,
    ucam-calendar .ucam-calendario__lista li::before {
      content: '';
      flex: none;
      inline-size: 0.5rem;
      block-size: 0.5rem;
      border-radius: var(--ucam-radius-pill);
      background: var(--ucam-cal-tom, var(--ucam-color-text-secondary));
    }
    ucam-calendar .ucam-calendario__evento--mais { color: var(--ucam-color-text-secondary); }
    ucam-calendar .ucam-calendario__evento--mais::before,
    ucam-calendar .ucam-calendario__lista li[data-vazio]::before { content: none; }
    ucam-calendar [data-tom='danger'] { --ucam-cal-tom: var(--ucam-color-feedback-danger-graphic); }
    ucam-calendar [data-tom='warning'] { --ucam-cal-tom: var(--ucam-color-feedback-warning-graphic); }
    ucam-calendar [data-tom='info'] { --ucam-cal-tom: var(--ucam-color-feedback-info-graphic); }
    ucam-calendar [data-tom='success'] { --ucam-cal-tom: var(--ucam-color-feedback-success-graphic); }
    ucam-calendar .ucam-calendario__lista {
      display: grid;
      margin: var(--ucam-space-stack-md) 0 0;
      padding: 0;
      list-style: none;
      font-size: var(--ucam-typography-body-sm-font-size);
    }
    ucam-calendar .ucam-calendario__lista li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.5rem 0.5rem 0.75rem;
      border-block-start: 1px solid var(--ucam-color-border-subtle);
    }
    ucam-calendar .ucam-calendario__lista li[data-vazio] { color: var(--ucam-color-text-secondary); }
    ucam-calendar .ucam-calendario__lista time {
      flex: none;
      min-inline-size: 6.5rem;
      color: var(--ucam-color-text-secondary);
      font-variant-numeric: tabular-nums;
    }
    ucam-calendar .ucam-calendario__lista li[data-destaque] {
      box-shadow: inset 4px 0 0 var(--ucam-color-action-primary-default);
      font-weight: var(--ucam-typography-label-font-weight);
    }
    @media (max-width: 40rem) {
      ucam-calendar .ucam-calendario--agenda { padding: var(--ucam-space-inset-sm); }
      ucam-calendar .ucam-calendario--agenda .ucam-calendario__grade td { block-size: 3rem; }
      ucam-calendar .ucam-calendario--agenda .ucam-calendario__eventos { inset: auto 0.25rem 0.25rem; flex-direction: row; flex-wrap: wrap; }
      ucam-calendar .ucam-calendario--agenda .ucam-calendario__evento > span,
      ucam-calendar .ucam-calendario--agenda .ucam-calendario__evento--mais { display: none; }
    }
  `,
  ],
})
export class UcamCalendar {
  readonly variant = input<UcamCalendarVariant>('grade');
  readonly selection = input<UcamCalendarSelection>('single');
  /** O que se escolhe: dia, mês, semestre (aaaa.1 / aaaa.2) ou ano (ADR-077). */
  readonly precision = input<UcamCalendarPrecision>('day');
  /** Nome para o leitor de tela: Calendário acadêmico de 2026, Data da prova. */
  readonly label = input.required<string>();
  /** O escolhido, na chave da precisão: aaaa-mm-dd, aaaa-mm, aaaa.s ou aaaa. */
  readonly value = model<string | null>(null);
  /** O período, quando selection é range — nas chaves da precisão. */
  readonly range = model<UcamDateRange | null>(null);
  /** Marca um período sem escolhê-lo: o DateField que é ponta de um DateRangeField. */
  readonly period = input<UcamDateRange | null>(null);
  /** Mês visível, aaaa-mm. Muda com a navegação (monthChange). */
  readonly month = model<string | null>(null);
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);
  readonly events = input<UcamCalendarEvent[]>([]);
  /** Na agenda, o dia ativado. A lista marca os eventos dele. */
  readonly daySelect = output<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly semana = SEMANA;
  /** A data com tabindex 0. Nula até a primeira navegação: segue o valor. */
  private readonly focoManual = signal<Date | null>(null);
  /** O nível à vista quando a pessoa subiu pelo título; nulo = o da precisão. */
  private readonly nivelManual = signal<NivelCal | null>(null);
  /** Na agenda, o dia ativado por último. */
  protected readonly ativado = signal<string | null>(null);

  private readonly nivelDaPrecisao = computed(() => NIVEL_DA[this.precision()]);
  protected readonly nivel = computed<NivelCal>(() => this.nivelManual() ?? this.nivelDaPrecisao());

  protected readonly foco = computed(() => {
    const manual = this.focoManual();
    if (manual) return manual;
    const v = this.value() || this.range()?.start || this.period()?.start;
    if (v) return this.precision() === 'day' ? deIso(v) : deIso(cobre(v, this.nivelDaPrecisao())[0]);
    if (this.month()) return deIso(`${this.month()}-01`);
    // Abrir em hoje quando hoje está fora de min/max poria o foco num dia que não se escolhe.
    const h = isoDe(hojeLocal());
    if (this.min() && h < this.min()!) return deIso(this.min()!);
    if (this.max() && h > this.max()!) return deIso(this.max()!);
    return hojeLocal();
  });
  protected readonly focoIso = computed(() => isoDe(this.foco()));
  protected readonly focoChave = computed(() => chaveDe(this.foco(), this.nivel()));
  protected readonly nomeMes = computed(() => MESES[this.foco().getMonth()]);
  protected readonly tituloMes = computed(() => {
    const ano = this.foco().getFullYear();
    const n = this.nivel();
    if (n === 'dia') return `${this.nomeMes()} de ${ano}`;
    if (n === 'ano') return `${ano - (ano % 12)} – ${ano - (ano % 12) + 11}`;
    return String(ano);
  });
  /** Para onde o título leva: dias → meses → anos; o topo não sobe. */
  protected readonly sobe = computed<NivelCal | null>(() => {
    const n = this.nivel();
    return n === 'dia' ? 'mes' : n === 'ano' ? null : 'ano';
  });
  protected readonly rotuloPasso = computed<[string, string]>(() => {
    const n = this.nivel();
    if (n === 'dia') return ['Mês anterior', 'Próximo mês'];
    if (n === 'ano') return ['Anos anteriores', 'Próximos anos'];
    return ['Ano anterior', 'Próximo ano'];
  });
  protected readonly periodoCompleto = computed(() => !!this.range()?.start && !!this.range()?.end);

  private readonly eventosPorDia = computed(() => {
    const mapa: Record<string, UcamCalendarEvent[]> = {};
    for (const e of this.events()) (mapa[e.date] ??= []).push(e);
    return mapa;
  });

  private readonly periodoVisivel = computed(() => (this.selection() === 'range' ? this.range() : this.period()));

  protected readonly semanas = computed<(DiaCal | null)[][]>(() =>
    montarMes(this.foco(), {
      escolhido: this.selection() === 'single' && this.precision() === 'day' ? this.value() : null,
      periodo: this.precision() === 'day' ? this.periodoVisivel() : null,
      min: this.min(),
      max: this.max(),
      eventos: this.variant() === 'agenda' ? this.eventosPorDia() : undefined,
    }),
  );

  protected readonly opcoes = computed<OpcaoCal[]>(() => {
    const n = this.nivel();
    if (n === 'dia') return [];
    return montarOpcoes(n, this.foco(), {
      escolhido: this.selection() === 'single' ? this.value() : null,
      periodo: this.periodoVisivel(),
      min: this.min(),
      max: this.max(),
      marca: n === this.nivelDaPrecisao(),
    });
  });

  protected readonly eventosDoMes = computed(() => {
    const pre = this.focoIso().slice(0, 7);
    return this.events()
      .filter((e) => e.date.slice(0, 7) === pre)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  });

  protected readonly hojeFora = computed(() => {
    const h = isoDe(hojeLocal());
    return (!!this.min() && h < this.min()!) || (!!this.max() && h > this.max()!);
  });

  protected dataCurta(iso: string): string {
    const d = deIso(iso);
    return `${iso.slice(8, 10)}/${iso.slice(5, 7)}, ${SEMANA[d.getDay()][1].slice(0, 3)}`;
  }

  /** As setas da cabeça: um mês nos dias, um ano em meses e semestres, doze anos na grade de anos. */
  protected trocarMes(delta: number): void {
    const f = this.foco();
    const n = this.nivel();
    if (n === 'dia') this.irPara(new Date(f.getFullYear(), f.getMonth() + delta, 1));
    else this.irPara(new Date(f.getFullYear() + (n === 'ano' ? 12 : 1) * delta, f.getMonth(), 1));
  }

  protected subir(n: NivelCal): void {
    this.nivelManual.set(n);
    this.focarDepois();
  }

  private irPara(d: Date): void {
    const antes = this.focoIso().slice(0, 7);
    this.focoManual.set(d);
    const agora = isoDe(d).slice(0, 7);
    if (agora !== antes && this.nivel() === 'dia') this.month.set(agora);
  }

  /** Num nível acima da precisão, escolher DESCE: ano → mês (ou semestre), mês → dias. */
  protected escolherOpcao(chave: string, fora: boolean): void {
    if (fora) return;
    const n = this.nivel();
    if (n === this.nivelDaPrecisao()) {
      this.focoManual.set(deIso(cobre(chave, n)[0]));
      this.aplicar(chave);
      return;
    }
    if (n === 'ano') {
      this.focoManual.set(new Date(Number(chave), this.foco().getMonth(), 1));
      this.nivelManual.set(this.precision() === 'semester' ? 'semestre' : 'mes');
    } else if (n === 'mes') {
      const [a, m] = chave.split('-').map(Number);
      this.irPara(new Date(a, m - 1, 1));
      this.nivelManual.set(null);
      this.month.set(chave);
    }
    this.focarDepois();
  }

  protected escolher(d: DiaCal): void {
    if (d.fora) return;
    this.focoManual.set(deIso(d.iso));
    if (this.variant() === 'agenda' || this.selection() === 'none') {
      this.ativado.set(d.iso);
      this.daySelect.emit(d.iso);
      return;
    }
    this.aplicar(d.iso);
  }

  private aplicar(chave: string): void {
    if (this.selection() === 'range') {
      const r = this.range();
      if (!r?.start || r.end) this.range.set({ start: chave, end: null });
      else if (chave < r.start) this.range.set({ start: chave, end: null });
      else this.range.set({ start: r.start, end: chave });
      return;
    }
    if (this.selection() === 'none') return;
    this.value.set(chave);
  }

  protected escolherHoje(): void {
    if (this.hojeFora()) return;
    const h = isoDe(hojeLocal());
    this.focoManual.set(deIso(h));
    this.value.set(h);
  }

  /** Põe o foco no item com tabindex 0 depois que a grade redesenhar. */
  focar(): void {
    this.host.nativeElement.querySelector<HTMLElement>('[data-dia][tabindex="0"], [data-chave][tabindex="0"]')?.focus();
  }

  private focarDepois(): void {
    afterNextRender({ read: () => this.focar() }, { injector: this.injector });
  }

  protected teclar(e: KeyboardEvent): void {
    const alvo = e.target as HTMLElement;
    const f = this.foco();
    if (alvo.hasAttribute('data-dia')) {
      const passo =
        TECLAS_CAL[e.key] ?? (e.key === 'Home' ? [-f.getDay()] : e.key === 'End' ? [6 - f.getDay()] : null);
      if (!passo) return;
      e.preventDefault();
      this.irPara(passoCal(f, passo[0], passo[1] ?? 0));
      this.focarDepois();
      return;
    }
    if (!alvo.hasAttribute('data-chave')) return;
    // Grades de mês, semestre e ano: setas andam uma opção (cima e baixo, uma
    // fileira); PageUp/PageDown, uma página.
    const n = this.nivel();
    const cols = n === 'semestre' ? 2 : 3;
    const passo = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols } as Record<string, number>)[e.key];
    const pagina = ({ PageUp: -1, PageDown: 1 } as Record<string, number>)[e.key];
    if (passo === undefined && pagina === undefined) return;
    e.preventDefault();
    let novo: Date;
    if (n === 'mes') novo = new Date(f.getFullYear(), f.getMonth() + (passo ?? 12 * pagina), 1);
    else if (n === 'semestre') novo = new Date(f.getFullYear(), f.getMonth() + 6 * (passo ?? 2 * pagina), 1);
    else novo = new Date(f.getFullYear() + (passo ?? 12 * pagina), f.getMonth(), 1);
    this.focoManual.set(novo);
    this.focarDepois();
  }
}
