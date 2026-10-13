import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteDocCard } from './doc-card';

@Component({
  imports: [UcamSiteDocCard],
  template: `<section ucamSiteDocCard data-peca class="minha" label="Estágio obrigatório" [icon]="$any(e()['icon'])" [items]="$any(e()['items']) ?? itens"></section>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly itens = ['Termo de compromisso', 'Plano de atividades'];
}

describe('section[ucamSiteDocCard]', () => {
  blocosComuns('doc-card', Hospede);

  it('cabeçalho com a pastilha do ícone e o título; cada documento com a marca de conferido', () => {
    const { el } = monta(Hospede);
    const cabeca = el.querySelector('.ucam-site-doc-card__header')!;
    expect(cabeca.querySelector('.ucam-site-icon-chip')!.getAttribute('aria-hidden')).toBe('true');
    expect(cabeca.querySelector('.ucam-site-icon-chip use')!.getAttribute('href')).toBe('#i-fileText');
    expect(cabeca.querySelector('h3.ucam-site-doc-card__label')!.textContent).toBe('Estágio obrigatório');
    const itens = [...el.querySelectorAll('ul.ucam-site-doc-card__list > li.ucam-site-doc-card__item')];
    expect(itens.map((li) => li.textContent!.trim())).toEqual(['Termo de compromisso', 'Plano de atividades']);
    for (const li of itens) expect(li.querySelector('svg.ic use')!.getAttribute('href')).toBe('#i-check');
  });
  it('o ícone do cabeçalho pode ser outro, e vazio volta ao padrão', () => {
    expect(monta(Hospede, { icon: 'briefcase' }).el.querySelector('.ucam-site-icon-chip use')!.getAttribute('href')).toBe('#i-briefcase');
    expect(monta(Hospede, { icon: '  ' }).el.querySelector('.ucam-site-icon-chip use')!.getAttribute('href')).toBe('#i-fileText');
  });
  it('item vazio ou nulo não vira linha; sem itens não há lista', () => {
    expect(monta(Hospede, { items: ['Um', '', '   ', null, 'Dois'] }).el.querySelectorAll('li').length).toBe(2);
    expect(monta(Hospede, { items: [] }).el.querySelector('ul')).toBeNull();
    expect(monta(Hospede, { items: ['', null] }).el.querySelector('ul')).toBeNull();
  });
});
