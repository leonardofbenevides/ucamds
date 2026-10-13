import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteStep, UcamSiteSteps } from './step-card';

@Component({
  imports: [UcamSiteSteps, UcamSiteStep],
  template: `<ol ucamSiteSteps>
    <li ucamSiteStep data-peca class="minha" [number]="1" heading="Cadastre o currículo" [text]="$any(e()['text'])" [href]="$any(e()['href'])" [linkLabel]="$any(e()['linkLabel'])"></li>
    <li ucamSiteStep [number]="2" heading="Candidate-se às vagas"></li>
  </ol>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

describe('ol[ucamSiteSteps] e li[ucamSiteStep]', () => {
  blocosComuns('step-card', Hospede);

  it('a lista leva a classe e role="list": sem marcador, o Safari deixaria de anunciá-la', () => {
    const lista = monta(Hospede).el.parentElement!;
    expect(lista.localName).toBe('ol');
    expect(lista.className).toBe('ucam-site-steps');
    expect(lista.getAttribute('role')).toBe('list');
    expect(lista.querySelectorAll('li.ucam-site-step-card').length).toBe(2);
  });
  it('o número é desenhado e escondido do leitor de tela: a ordem é da lista', () => {
    const numero = monta(Hospede).el.querySelector('.ucam-site-step-card__number')!;
    expect(numero.textContent).toBe('1');
    expect(numero.getAttribute('aria-hidden')).toBe('true');
  });
  it('só o título: sem parágrafo e sem link', () => {
    const corpo = monta(Hospede).el.querySelector('.ucam-site-step-card__body')!;
    expect([...corpo.children].map((c) => `${c.localName}.${c.className}`)).toEqual(['h3.ucam-site-step-card__title']);
    expect(corpo.querySelector('h3')!.textContent).toBe('Cadastre o currículo');
  });
  it('o link precisa do destino E do texto', () => {
    expect(monta(Hospede, { href: '/plataforma' }).el.querySelector('a')).toBeNull();
    expect(monta(Hospede, { linkLabel: 'Acessar' }).el.querySelector('a')).toBeNull();
    const link = monta(Hospede, { text: 'Na plataforma.', href: '/plataforma', linkLabel: 'Acessar a plataforma' }).el.querySelector('a.ucam-site-step-card__link')!;
    expect(link.getAttribute('href')).toBe('/plataforma');
    expect(link.textContent!.trim()).toBe('Acessar a plataforma');
    expect(link.querySelector('svg.ic use')!.getAttribute('href')).toBe('#i-arrowRight');
    expect(link.previousElementSibling!.className).toBe('ucam-site-step-card__text');
  });
});
