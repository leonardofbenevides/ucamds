import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  ViewEncapsulation,
} from '@angular/core';

import { UcamIcon } from '../icon/ucam-icon';

/**
 * Contrato: spec/components/relogio.json
 *
 * Quanto falta, em palavra e em dígitos, até um fim conhecido. Nasceu da tela
 * de prova do vestibular, que teve de escrever o relógio à mão (06/10/2026).
 *
 * NUNCA DECREMENTA UM CONTADOR. A cada segundo recalcula `fim - agora`: aba em
 * segundo plano, máquina que dormiu e intervalo atrasado não acumulam erro, e
 * o `fim` vem do servidor, que é quem encerra a prova de verdade.
 *
 * O TOM ACOMPANHA O TEMPO e nunca anda sozinho: neutro; atenção no último terço
 * (quando `total` é dado); perigo a partir de `perigoMs`. A frase muda junto.
 *
 * A PASTILHA NÃO É REGIÃO VIVA (role="timer" é aria-live off): seria lida a
 * cada segundo. Os anúncios saem de um status separado, uma vez por troca de
 * tom e uma vez no último minuto.
 */
export type UcamRelogioTom = 'neutral' | 'warning' | 'danger';

const SEG = 1000;
const MIN = 60 * SEG;
const HORA = 60 * MIN;

/** "Faltam 42 min", "Falta 1 h 5 min", "Faltam 50 s", "Tempo esgotado". */
export function fraseDoRelogio(restanteMs: number): string {
  if (restanteMs <= 0) return 'Tempo esgotado';
  if (restanteMs < MIN) {
    const s = Math.ceil(restanteMs / SEG);
    return `${s === 1 ? 'Falta' : 'Faltam'} ${s} s`;
  }
  const h = Math.floor(restanteMs / HORA);
  const m = Math.floor((restanteMs % HORA) / MIN);
  // O verbo concorda com o primeiro número dito: "Falta 1 h 25 min".
  const primeiro = h > 0 ? h : m;
  const partes = [h > 0 ? `${h} h` : '', m > 0 ? `${m} min` : ''].filter(Boolean).join(' ');
  return `${primeiro === 1 ? 'Falta' : 'Faltam'} ${partes}`;
}

/** hh:mm:ss, arredondado para cima: o relógio não mostra 00:00:00 antes do fim. */
export function digitosDoRelogio(restanteMs: number): string {
  const total = Math.max(0, Math.ceil(restanteMs / SEG));
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${dois(Math.floor(total / 3600))}:${dois(Math.floor((total % 3600) / 60))}:${dois(total % 60)}`;
}

@Component({
  selector: 'ucam-relogio',
  exportAs: 'ucamRelogio',
  imports: [UcamIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contents' },
  template: `
    <span class="ucam-relogio" role="timer" [attr.data-tom]="tom() === 'neutral' ? null : tom()">
      <ucam-icon name="clock" size="sm" />
      {{ frase() }}
      @if (digitos()) {
        <span class="ucam-relogio__digitos" aria-hidden="true">{{ hms() }}</span>
      }
    </span>
    <span class="sr-only" role="status">{{ anuncio() }}</span>
  `,
  styles: `
    /* A mesma folha do Trilho A (tools/build-css.mjs, RELÓGIO). */
    ucam-relogio .ucam-relogio {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      min-block-size: 1.75rem;
      padding-inline: var(--ucam-space-inline-sm);
      border: 1px solid var(--ucam-color-border-subtle);
      border-radius: var(--ucam-radius-pill);
      background: var(--ucam-color-surface-default);
      color: var(--ucam-color-text-primary);
      font-size: var(--ucam-typography-caption-font-size);
      white-space: nowrap;
    }
    ucam-relogio .ucam-relogio ucam-icon,
    ucam-relogio .ucam-relogio ng-icon,
    ucam-relogio .ucam-relogio ng-icon svg {
      inline-size: 0.875rem;
      block-size: 0.875rem;
    }
    /* Dígitos tabulares, senão a pastilha treme a cada segundo. */
    ucam-relogio .ucam-relogio__digitos {
      font-variant-numeric: tabular-nums;
      color: var(--ucam-color-text-secondary);
    }
    ucam-relogio .ucam-relogio[data-tom='warning'] {
      border-color: transparent;
      background: var(--ucam-color-feedback-warning-background);
      color: var(--ucam-color-feedback-warning-foreground);
    }
    ucam-relogio .ucam-relogio[data-tom='danger'] {
      border-color: transparent;
      background: var(--ucam-color-feedback-danger-background);
      color: var(--ucam-color-feedback-danger-foreground);
    }
    ucam-relogio .ucam-relogio[data-tom] .ucam-relogio__digitos {
      color: inherit;
    }
  `,
})
export class UcamRelogio {
  /** O instante em que o tempo acaba, calculado do horário do servidor. */
  readonly fim = input.required<Date | string | number>();
  /** A duração total em ms, para o limiar de atenção (último terço). */
  readonly total = input<number | null>(null);
  /** A partir de quanto tempo restante o tom vira perigo. Dez minutos. */
  readonly perigoMs = input(10 * MIN);
  /** Os dígitos hh:mm:ss ao lado da frase. Opcionais em faixa estreita. */
  readonly digitos = input(true);
  /** O que o anúncio do último minuto diz que vai acontecer. */
  readonly avisoFinal = input('A prova será entregue automaticamente no fim do tempo.');
  /**
   * Congela o "agora". Existe para preview e teste: com ele o relógio não
   * anda, e a documentação não muda de tom sozinha.
   */
  readonly agora = input<Date | null>(null);

  /** O tempo chegou a zero. Emitido uma vez. */
  readonly esgotou = output<void>();

  private readonly tique = signal(Date.now());

  private readonly fimMs = computed(() => {
    const f = this.fim();
    return f instanceof Date ? f.getTime() : typeof f === 'number' ? f : new Date(f).getTime();
  });

  protected readonly restante = computed(() => this.fimMs() - (this.agora()?.getTime() ?? this.tique()));

  readonly tom = computed<UcamRelogioTom>(() => {
    const r = this.restante();
    if (r <= this.perigoMs()) return 'danger';
    const t = this.total();
    if (t && r <= t / 3) return 'warning';
    return 'neutral';
  });

  protected readonly frase = computed(() => fraseDoRelogio(this.restante()));
  protected readonly hms = computed(() => digitosDoRelogio(this.restante()));

  protected readonly anuncio = signal('');

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    if (browser) {
      const id = setInterval(() => this.tique.set(Date.now()), SEG);
      inject(DestroyRef).onDestroy(() => clearInterval(id));
    }

    // Os anúncios: um por troca de tom, um no último minuto, um no fim. O
    // estado anterior fica fora do sinal para o efeito não se reexecutar por ele.
    let tomAnterior: UcamRelogioTom | null = null;
    let avisouUltimoMinuto = false;
    let esgotado = false;
    effect(() => {
      const r = this.restante();
      const tom = this.tom();
      if (r <= 0) {
        if (!esgotado) {
          esgotado = true;
          this.anuncio.set('Tempo esgotado.');
          this.esgotou.emit();
        }
        return;
      }
      if (r <= MIN && !avisouUltimoMinuto) {
        avisouUltimoMinuto = true;
        this.anuncio.set(`Falta 1 minuto. ${this.avisoFinal()}`);
      } else if (tomAnterior !== null && tom !== tomAnterior && tom !== 'neutral') {
        this.anuncio.set(`${fraseDoRelogio(r)}.`);
      }
      tomAnterior = tom;
    });
  }
}
