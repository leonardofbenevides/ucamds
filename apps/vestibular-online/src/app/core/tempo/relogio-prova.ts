import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export type TomTempo = 'neutral' | 'warning' | 'danger';
const DEZ_MIN = 10 * 60_000;

export function parseTempoMaximo(hms: string): number {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(hms ?? '');
  if (!m) return NaN;
  return (+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000;
}

export function calcularRestante(inicio: Date, totalMs: number, agora: Date): number {
  return Math.max(0, inicio.getTime() + totalMs - agora.getTime());
}

export function tomDoTempo(restanteMs: number, totalMs: number): TomTempo {
  if (restanteMs <= DEZ_MIN) return 'danger';
  if (restanteMs <= totalMs / 3) return 'warning';
  return 'neutral';
}

/** "Faltam 42 min", "Falta 1 h 5 min", "Faltam 50 s", "Tempo esgotado". */
export function textoRestante(ms: number): string {
  if (ms <= 0) return 'Tempo esgotado';
  const totalMin = Math.floor(ms / 60_000);
  if (totalMin === 0) {
    const s = Math.floor(ms / 1000);
    return `${s === 1 ? 'Falta' : 'Faltam'} ${s} s`;
  }
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  const partes = [h ? `${h} h` : '', min ? `${min} min` : ''].filter(Boolean).join(' ');
  const singular = h === 1 || (h === 0 && min === 1);
  return `${singular ? 'Falta' : 'Faltam'} ${partes}`;
}

/** Uma duração em palavra, na mesma unidade do relógio: "1 h 15 min", "42 min", "50 s". */
export function duracaoEmPalavra(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s} s`;
  const h = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  return [h ? `${h} h` : '', min ? `${min} min` : ''].filter(Boolean).join(' ');
}

export function formatarHms(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

/**
 * Relógio da prova. Recalcula o restante a partir do horário de início do
 * servidor e do relógio da máquina a cada segundo — nunca decrementa um
 * contador local, então uma aba em segundo plano não "ganha" tempo.
 */
@Injectable({ providedIn: 'root' })
export class RelogioProva {
  private readonly inicio = signal<Date | null>(null);
  private readonly agora = signal<number>(Date.now());
  private intervalo: ReturnType<typeof setInterval> | null = null;

  readonly total = signal<number>(0);
  readonly restante = computed(() => {
    const i = this.inicio();
    return i ? calcularRestante(i, this.total(), new Date(this.agora())) : 0;
  });
  readonly decorrido = computed(() => this.total() - this.restante());
  readonly tom = computed(() => tomDoTempo(this.restante(), this.total()));
  readonly texto = computed(() => textoRestante(this.restante()));
  readonly hms = computed(() => formatarHms(this.restante()));
  readonly esgotado = computed(() => this.inicio() !== null && this.restante() === 0);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.parar());
  }

  iniciar(inicio: Date, totalMs: number): void {
    this.parar();
    this.total.set(totalMs);
    this.inicio.set(inicio);
    this.agora.set(Date.now());
    this.intervalo = setInterval(() => this.agora.set(Date.now()), 1000);
  }

  /** Para e ESQUECE a prova: o serviço é singleton e a tentativa seguinte não pode herdar um esgotado. */
  parar(): void {
    if (this.intervalo) clearInterval(this.intervalo);
    this.intervalo = null;
    this.inicio.set(null);
    this.total.set(0);
  }
}
