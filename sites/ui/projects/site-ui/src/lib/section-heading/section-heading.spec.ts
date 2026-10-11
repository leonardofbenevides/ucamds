import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteSectionHeading, UcamSiteSectionHeadingAcoes } from './section-heading';

@Component({
  imports: [UcamSiteSectionHeading, UcamSiteSectionHeadingAcoes],
  template: `<header ucamSiteSectionHeading data-peca class="minha"
    [eyebrow]="$any(e()['eyebrow'])" [heading]="$any(e()['heading']) ?? 'Título'" [lede]="$any(e()['lede'])"
    [align]="$any(e()['align'])" [size]="$any(e()['size'])" [inverse]="$any(e()['inverse'])" [level]="$any(e()['level'])">
    @if (e()['acoes']) { <div ucamSiteSectionHeadingAcoes><a href="/x">Ver todas</a></div> }
  </header>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

const R = 'ucam-site-section-heading';

describe('[ucamSiteSectionHeading]', () => {
  blocosComuns('section-heading', Hospede);

  it('só com o título não há parágrafo vazio', () => {
    const { el } = monta(Hospede);
    expect(el.querySelectorAll('p').length).toBe(0);
    expect(el.querySelector(`h2.${R}__title`)!.textContent).toBe('Título');
  });
  it('eyebrow e lede entram como parágrafos, na ordem do contrato', () => {
    const { el } = monta(Hospede, { eyebrow: 'Carreiras', lede: 'As vagas da semana.' });
    expect([...el.children].map((c) => `${c.localName}.${c.className}`)).toEqual([`p.${R}__eyebrow`, `h2.${R}__title`, `p.${R}__lede`]);
  });
  it('o nível 3 troca a tag do título, e qualquer outro valor fica em 2', () => {
    expect(monta(Hospede, { level: 3 }).el.querySelector(`.${R}__title`)!.localName).toBe('h3');
    expect(monta(Hospede, { level: '3' }).el.querySelector(`.${R}__title`)!.localName).toBe('h3');
    for (const level of [1, 4, 'x', null]) expect(monta(Hospede, { level }).el.querySelector(`.${R}__title`)!.localName).toBe('h2');
  });
  it('as ações são projetadas depois do texto, com a classe da parte', () => {
    const { el } = monta(Hospede, { lede: 'x', acoes: true });
    const ultimo = el.lastElementChild!;
    expect(ultimo.className).toBe(`${R}__acoes`);
    expect(ultimo.querySelector('a')!.getAttribute('href')).toBe('/x');
  });
});
