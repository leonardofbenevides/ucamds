import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamSegmented, type UcamSegmentItem } from './ucam-segmented';

const ITENS: UcamSegmentItem[] = [
  { id: 'isentar', label: 'Isentar' },
  { id: 'nao', label: 'Não isentar' },
];

@Component({
  imports: [UcamSegmented],
  template: `<ucam-segmented ariaLabel="Decisão" [items]="itens" [(value)]="value" allowEmpty />`,
})
class HostVazio {
  readonly itens = ITENS;
  readonly value = signal('');
}

async function montar<T>(host: new () => T): Promise<{ host: T; botoes: HTMLButtonElement[] }> {
  await TestBed.configureTestingModule({ imports: [host] }).compileComponents();
  const f = TestBed.createComponent(host);
  await f.whenStable();
  return { host: f.componentInstance, botoes: [...(f.nativeElement as HTMLElement).querySelectorAll('button')] };
}

describe('UcamSegmented — allowEmpty', () => {
  it('com allowEmpty, começa sem escolha e nenhum segmento fica pressionado', async () => {
    const { botoes } = await montar(HostVazio);
    expect(botoes.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false']);
  });

  it('com allowEmpty, clicar no escolhido desfaz a escolha', async () => {
    const { host, botoes } = await montar(HostVazio);
    botoes[0].click();
    expect(host.value()).toBe('isentar');
    botoes[0].click();
    expect(host.value()).toBe('');
  });
});
