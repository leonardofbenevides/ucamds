import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteBreadcrumb } from '../breadcrumb/breadcrumb';
import { UcamSitePageHero, UcamSitePageHeroActions, UcamSitePageHeroPills } from './editorial-page-hero';

@Component({
  imports: [UcamSitePageHero, UcamSitePageHeroPills, UcamSitePageHeroActions, UcamSiteBreadcrumb],
  // Ações, pílulas e trilha escritas de trás para frente: a peça as põe na ordem do contrato.
  template: `<header ucamSitePageHero data-peca class="minha" heading="Orientações de estágio" [eyebrow]="$any(e()['eyebrow'])" [lede]="$any(e()['lede'])" [width]="$any(e()['width'])" [image]="$any(e()['image'])">
    @if (e()['extras']) { <div ucamSitePageHeroActions><a href="/vagas">Ver vagas</a></div> }
    @if (e()['extras']) { <ul ucamSitePageHeroPills><li>Desde 2001</li></ul> }
    @if (e()['extras']) { <nav ucamSiteBreadcrumb inverse [items]="trilha"></nav> }
  </header>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly trilha = [{ label: 'Início', href: '/' }, { label: 'Orientações de estágio' }];
}

const R = 'ucam-site-page-hero';
const partes = (el: HTMLElement) => [...el.querySelector(`.${R}__inner`)!.children].map((c) => `${c.localName}.${c.className.split(' ')[0]}`);

describe('header[ucamSitePageHero]', () => {
  blocosComuns('editorial-page-hero', Hospede);

  it('só com o título: um h1 dentro da faixa', () => {
    const { el } = monta(Hospede);
    expect([...el.children].map((c) => c.className)).toEqual([`${R}__inner`]);
    expect(partes(el)).toEqual([`h1.${R}__title`]);
    expect(el.querySelector('h1')!.textContent).toBe('Orientações de estágio');
  });
  it('a trilha vem primeiro; depois eyebrow, título, lede, pílulas e ações', () => {
    const { el } = monta(Hospede, { eyebrow: 'Alunos e egressos', lede: 'O que é e como formalizar.', extras: true });
    expect(partes(el)).toEqual([`nav.ucam-site-breadcrumb`, `p.${R}__eyebrow`, `h1.${R}__title`, `p.${R}__lede`, `ul.${R}__pills`, `div.${R}__actions`]);
  });
  it('eyebrow e lede só de espaços não deixam parágrafo', () => {
    expect(partes(monta(Hospede, { eyebrow: ' ', lede: '' }).el)).toEqual([`h1.${R}__title`]);
  });
  it('sem foto, nem modificador, nem foto, nem véu', () => {
    for (const image of [undefined, null, '', '  ', 42]) {
      const { el } = monta(Hospede, { image });
      expect(el.classList.contains(`${R}--sobre-foto`)).toBe(false);
      expect(el.querySelector(`.${R}__media, .${R}__scrim`)).toBeNull();
    }
  });
  it('com foto, os três nascem juntos: modificador, foto decorativa e véu, antes do conteúdo', () => {
    const { el } = monta(Hospede, { image: '/sites/fotos/campos.jpg' });
    expect(el.classList.contains(`${R}--sobre-foto`)).toBe(true);
    expect([...el.children].map((c) => c.className)).toEqual([`${R}__media`, `${R}__scrim`, `${R}__inner`]);
    const img = el.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/sites/fotos/campos.jpg');
    expect(img.getAttribute('alt')).toBe('');
    expect(el.querySelector(`.${R}__scrim`)!.getAttribute('aria-hidden')).toBe('true');
  });
});
