import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  RelogioProva,
  calcularRestante,
  formatarHms,
  parseTempoMaximo,
  textoRestante,
  tomDoTempo,
} from './relogio-prova';

const H = 3_600_000,
  MIN = 60_000;

describe('funções do relógio', () => {
  it('converte HH:MM:SS em ms', () => {
    expect(parseTempoMaximo('02:00:00')).toBe(2 * H);
    expect(parseTempoMaximo('00:45:30')).toBe(45 * MIN + 30_000);
    expect(parseTempoMaximo('lixo')).toBeNaN();
  });
  it('nunca devolve restante negativo', () => {
    const inicio = new Date('2026-10-01T10:00:00Z');
    expect(calcularRestante(inicio, 2 * H, new Date('2026-10-01T11:00:00Z'))).toBe(H);
    expect(calcularRestante(inicio, 2 * H, new Date('2026-10-01T13:00:00Z'))).toBe(0);
  });
  it('troca de tom no último terço e nos últimos 10 minutos', () => {
    expect(tomDoTempo(90 * MIN, 2 * H)).toBe('neutral');
    expect(tomDoTempo(39 * MIN, 2 * H)).toBe('warning');
    expect(tomDoTempo(9 * MIN, 2 * H)).toBe('danger');
  });
  it('escreve o restante em palavra e em hh:mm:ss', () => {
    expect(textoRestante(42 * MIN + 10_000)).toBe('Faltam 42 min');
    expect(textoRestante(H + 5 * MIN)).toBe('Falta 1 h 5 min');
    expect(textoRestante(50_000)).toBe('Faltam 50 s');
    expect(textoRestante(0)).toBe('Tempo esgotado');
    expect(formatarHms(42 * MIN + 10_000)).toBe('00:42:10');
  });
});

describe('RelogioProva', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('conta a partir do início do servidor e dispara esgotado uma vez só', () => {
    vi.setSystemTime(new Date('2026-10-01T10:30:00Z'));
    const r = TestBed.inject(RelogioProva);
    r.iniciar(new Date('2026-10-01T10:00:00Z'), H);
    expect(r.restante()).toBe(30 * MIN);
    expect(r.esgotado()).toBe(false);
    vi.setSystemTime(new Date('2026-10-01T11:00:01Z')); // aba em segundo plano: salto grande
    vi.advanceTimersByTime(1000);
    expect(r.restante()).toBe(0);
    expect(r.esgotado()).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(r.esgotado()).toBe(true);
    r.parar();
  });

  it('parar() esquece a prova anterior: esgotado não vaza para a tentativa seguinte', () => {
    vi.setSystemTime(new Date('2026-10-01T12:00:00Z'));
    const r = TestBed.inject(RelogioProva);
    r.iniciar(new Date('2026-10-01T09:00:00Z'), H);
    expect(r.esgotado()).toBe(true);
    r.parar();
    expect(r.esgotado()).toBe(false);
    expect(r.restante()).toBe(0);
    expect(r.total()).toBe(0);
  });
});
