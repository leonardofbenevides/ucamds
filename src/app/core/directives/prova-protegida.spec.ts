import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProvaProtegida } from './prova-protegida';

@Component({ imports: [ProvaProtegida], template: `<div appProvaProtegida>texto</div>` })
class Host {}

it('impede copiar, recortar, colar e menu de contexto dentro do elemento', async () => {
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const f = TestBed.createComponent(Host);
  await f.whenStable();
  const div = f.nativeElement.querySelector('div') as HTMLElement;
  for (const tipo of ['copy', 'cut', 'paste', 'contextmenu']) {
    const ev = new Event(tipo, { bubbles: true, cancelable: true });
    div.dispatchEvent(ev);
    expect(ev.defaultPrevented, tipo).toBe(true);
  }
});
