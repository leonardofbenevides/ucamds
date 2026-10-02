import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamTabs } from './ucam-tabs';

@Component({
  imports: [UcamTabs],
  template: `<ucam-tabs ariaLabel="Recortes" [items]="itens" [value]="recorte()" (valueChange)="recorte.set($event)" />`,
})
class Host {
  readonly itens = [
    { id: 'espera', label: 'Em espera' },
    { id: 'corrigidas', label: 'Corrigidas' },
  ];
  readonly recorte = signal('espera');
}

describe('UcamTabs — a parada de tabulação é a aba selecionada', () => {
  const paradas = (el: HTMLElement) => [...el.querySelectorAll<HTMLButtonElement>('[role=tab]')].map((b) => b.tabIndex);

  it('nasce junto com a página sem ler o valor antes do primeiro binding', async () => {
    // Uma página criada pelo roteador num app sem zone: o componente existe,
    // e a primeira detecção de mudanças só vem depois da fila de microtasks.
    // Era aí que o construtor lia value() e estourava NG0952.
    const erros: unknown[] = [];
    const original = globalThis.queueMicrotask;
    globalThis.queueMicrotask = (tarefa) =>
      original(() => {
        try {
          tarefa();
        } catch (e) {
          erros.push(e);
        }
      });
    try {
      await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
      const f = TestBed.createComponent(Host);
      await new Promise((r) => setTimeout(r));
      await f.whenStable();

      expect(erros).toEqual([]);
      expect(paradas(f.nativeElement)).toEqual([0, -1]);
    } finally {
      globalThis.queueMicrotask = original;
    }
  });

  it('acompanha a seleção que muda por fora', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    await f.whenStable();
    expect(paradas(f.nativeElement)).toEqual([0, -1]);

    f.componentInstance.recorte.set('corrigidas');
    await f.whenStable();
    expect(paradas(f.nativeElement)).toEqual([-1, 0]);
  });
});
