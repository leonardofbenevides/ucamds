import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { digitosDoRelogio, fraseDoRelogio, UcamRelogio } from './ucam-relogio';

const MIN = 60_000;
const BASE = new Date('2026-11-06T09:00:00Z');
const depois = (ms: number) => new Date(BASE.getTime() + ms);

@Component({
  imports: [UcamRelogio],
  template: `<ucam-relogio [fim]="fim" [total]="120 * min" [agora]="agora()" (esgotou)="esgotou = esgotou + 1" />`,
})
class Host {
  readonly min = MIN;
  readonly fim = depois(120 * MIN);
  readonly agora = signal(BASE);
  esgotou = 0;
}

describe('UcamRelogio (relogio.json)', () => {
  it('a frase usa a unidade que importa e concorda com o primeiro número', () => {
    expect(fraseDoRelogio(85 * MIN + 40_000)).toBe('Falta 1 h 25 min');
    expect(fraseDoRelogio(42 * MIN + 10_000)).toBe('Faltam 42 min');
    expect(fraseDoRelogio(120 * MIN)).toBe('Faltam 2 h');
    expect(fraseDoRelogio(MIN + 5000)).toBe('Falta 1 min');
    expect(fraseDoRelogio(50_000)).toBe('Faltam 50 s');
    expect(fraseDoRelogio(800)).toBe('Falta 1 s');
    expect(fraseDoRelogio(0)).toBe('Tempo esgotado');
    expect(digitosDoRelogio(85 * MIN + 40_000)).toBe('01:25:40');
    expect(digitosDoRelogio(-5)).toBe('00:00:00');
  });

  async function montar() {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    const ir = async (ms: number) => {
      f.componentInstance.agora.set(depois(ms));
      await f.whenStable();
    };
    return { f, el, ir, pastilha: () => el.querySelector('.ucam-relogio')!, status: () => el.querySelector('[role="status"]')!.textContent!.trim() };
  }

  it('a pastilha é timer, não região viva; o anúncio sai de um status à parte', async () => {
    const { el, pastilha, status } = await montar();
    expect(pastilha().getAttribute('role')).toBe('timer');
    expect(pastilha().hasAttribute('aria-live')).toBe(false);
    expect(pastilha().hasAttribute('data-tom')).toBe(false);
    expect(pastilha().textContent).toContain('Faltam 2 h');
    expect(el.querySelector('.ucam-relogio__digitos')!.textContent).toBe('02:00:00');
    expect(status()).toBe('');
  });

  it('atenção no último terço, perigo nos dez minutos, cada troca anunciada uma vez', async () => {
    const { ir, pastilha, status } = await montar();
    await ir(81 * MIN); // faltam 39 min: último terço de 120
    expect(pastilha().getAttribute('data-tom')).toBe('warning');
    expect(status()).toBe('Faltam 39 min.');
    await ir(82 * MIN);
    expect(status()).toBe('Faltam 39 min.');
    await ir(111 * MIN); // faltam 9 min
    expect(pastilha().getAttribute('data-tom')).toBe('danger');
    expect(status()).toBe('Faltam 9 min.');
    await ir(119 * MIN + 30_000);
    expect(status()).toMatch(/^Falta 1 minuto\. A prova será entregue/);
  });

  it('no fim diz Tempo esgotado e emite esgotou uma vez só', async () => {
    const { f, ir, pastilha, status } = await montar();
    await ir(120 * MIN);
    await ir(121 * MIN);
    expect(pastilha().textContent).toContain('Tempo esgotado');
    expect(status()).toBe('Tempo esgotado.');
    expect(f.componentInstance.esgotou).toBe(1);
  });
});
