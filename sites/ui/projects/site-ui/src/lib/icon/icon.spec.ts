import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideUcamSite } from '../nucleo/provedor';
import { UcamSiteIcon } from './icon';

@Component({ imports: [UcamSiteIcon], template: `<svg [ucamSiteIcon]="nome()"></svg>` })
class Hospede {
  readonly nome = signal('arrowRight');
}

const monta = (providers: unknown[] = []) => {
  TestBed.configureTestingModule({ providers: providers as never[] });
  const f = TestBed.createComponent(Hospede);
  f.detectChanges();
  return f;
};

describe('svg[ucamSiteIcon]', () => {
  it('sem provedor aponta para o sprite em linha, e é decorativo', () => {
    const svg: SVGElement = monta().nativeElement.querySelector('svg');
    expect(svg.getAttribute('class')).toBe('ic');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelector('use')!.getAttribute('href')).toBe('#i-arrowRight');
  });
  it('com provedor aponta para o arquivo do sprite', () => {
    const svg: SVGElement = monta([provideUcamSite({ sprite: '/icons/sprite.svg' })]).nativeElement.querySelector('svg');
    expect(svg.querySelector('use')!.getAttribute('href')).toBe('/icons/sprite.svg#i-arrowRight');
  });
  it('troca o ícone quando a entrada muda, sem acumular <use>', () => {
    const f = monta();
    f.componentInstance.nome.set('check');
    f.detectChanges();
    const usos = f.nativeElement.querySelectorAll('use');
    expect(usos.length).toBe(1);
    expect(usos[0].getAttribute('href')).toBe('#i-check');
  });
  it('nome vazio não cria <use>', () => {
    const f = monta();
    f.componentInstance.nome.set('');
    f.detectChanges();
    expect(f.nativeElement.querySelector('use')).toBeNull();
  });
});
