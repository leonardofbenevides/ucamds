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
  imports: [UcamIconButton, UcamButton],
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
      @if (variant() === 'grade' && selection() === 'single') {
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
  /** Nome para o leitor de tela: Calendário acadêmico de 2026, Data da prova. */
  readonly label = input.required<string>();
  /** Dia escolhido, em ISO. */
  readonly value = model<string | null>(null);
  /** O período, quando selection é range. */
  readonly range = model<UcamDateRange | null>(null);
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
  /** O dia com tabindex 0. Nulo até a primeira navegação: segue o valor. */
  private readonly focoManual = signal<Date | null>(null);
  /** Na agenda, o dia ativado por último. */
  protected readonly ativado = signal<string | null>(null);

  protected readonly foco = computed(() => {
    const manual = this.focoManual();
    if (manual) return manual;
    const v = this.value() || this.range()?.start || (this.month() ? `${this.month()}-01` : '');
    return v ? deIso(v) : hojeLocal();
  });
  protected readonly focoIso = computed(() => isoDe(this.foco()));
  protected readonly nomeMes = computed(() => MESES[this.foco().getMonth()]);
  protected readonly tituloMes = computed(() => `${this.nomeMes()} de ${this.foco().getFullYear()}`);
  protected readonly periodoCompleto = computed(() => !!this.range()?.start && !!this.range()?.end);

  private readonly eventosPorDia = computed(() => {
    const mapa: Record<string, UcamCalendarEvent[]> = {};
    for (const e of this.events()) (mapa[e.date] ??= []).push(e);
    return mapa;
  });

  protected readonly semanas = computed<(DiaCal | null)[][]>(() =>
    montarMes(this.foco(), {
      escolhido: this.selection() === 'single' ? this.value() : null,
      periodo: this.selection() === 'range' ? this.range() : null,
      min: this.min(),
      max: this.max(),
      eventos: this.variant() === 'agenda' ? this.eventosPorDia() : undefined,
    }),
  );

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

  protected trocarMes(delta: number): void {
    const f = this.foco();
    this.irPara(new Date(f.getFullYear(), f.getMonth() + delta, 1));
  }

  private irPara(d: Date): void {
    const antes = this.focoIso().slice(0, 7);
    this.focoManual.set(d);
    const agora = isoDe(d).slice(0, 7);
    if (agora !== antes) this.month.set(agora);
  }

  protected escolher(d: DiaCal): void {
    if (d.fora) return;
    this.focoManual.set(deIso(d.iso));
    if (this.variant() === 'agenda' || this.selection() === 'none') {
      this.ativado.set(d.iso);
      this.daySelect.emit(d.iso);
      return;
    }
    if (this.selection() === 'range') {
      const r = this.range();
      if (!r?.start || r.end) this.range.set({ start: d.iso, end: null });
      else if (d.iso < r.start) this.range.set({ start: d.iso, end: null });
      else this.range.set({ start: r.start, end: d.iso });
      return;
    }
    this.value.set(d.iso);
  }

  protected escolherHoje(): void {
    if (this.hojeFora()) return;
    const h = isoDe(hojeLocal());
    this.focoManual.set(deIso(h));
    this.value.set(h);
  }

  protected teclar(e: KeyboardEvent): void {
    const alvo = e.target as HTMLElement;
    if (!alvo.hasAttribute('data-dia')) return;
    const f = this.foco();
    const passo =
      TECLAS_CAL[e.key] ??
      (e.key === 'Home' ? [-f.getDay()] : e.key === 'End' ? [6 - f.getDay()] : null);
    if (!passo) return;
    e.preventDefault();
    this.irPara(passoCal(f, passo[0], passo[1] ?? 0));
    afterNextRender(
      { read: () => this.host.nativeElement.querySelector<HTMLElement>(`[data-dia="${this.focoIso()}"]`)?.focus() },
      { injector: this.injector },
    );
  }
}
