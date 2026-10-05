import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { LinksInternos } from './links-internos';

@Component({
  imports: [LinksInternos],
  template: `
    <div appLinksInternos>
      <a id="interno" href="/banca/provas"><span>Provas</span></a>
      <a id="externo" href="https://www.candidomendes.edu.br/">Site</a>
      <a id="nova-aba" href="/banca/provas" target="_blank">Provas em outra aba</a>
      <a id="tratado" href="/banca/redacoes" (click)="$event.preventDefault()">Redações</a>
    </div>
  `,
})
class Host {}

describe('LinksInternos', () => {
  let el: HTMLElement;
  let nav: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host], providers: [provideRouter([])] }).compileComponents();
    nav = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    el = f.nativeElement;
  });

  /** Clica e devolve se a diretiva segurou o clique. O jsdom não navega: quem sobra é segurado aqui, depois de medido. */
  const clicar = (sel: string, init: MouseEventInit = {}) => {
    let segurado = false;
    const medir = (e: Event) => {
      segurado = e.defaultPrevented;
      e.preventDefault();
    };
    el.addEventListener('click', medir, { once: true });
    el.querySelector(sel)!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init }));
    return { defaultPrevented: segurado };
  };

  it('entrega ao roteador o clique simples num link interno, mesmo vindo de um filho do link', () => {
    const evento = clicar('#interno span');
    expect(evento.defaultPrevented).toBe(true);
    expect(nav).toHaveBeenCalledWith('/banca/provas');
  });

  it('deixa passar link externo, link para outra aba e clique com tecla', () => {
    expect(clicar('#externo').defaultPrevented).toBe(false);
    expect(clicar('#nova-aba').defaultPrevented).toBe(false);
    expect(clicar('#interno', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(nav).not.toHaveBeenCalled();
  });

  it('não navega de novo quando alguém já tratou o clique', () => {
    clicar('#tratado');
    expect(nav).not.toHaveBeenCalled();
  });
});
