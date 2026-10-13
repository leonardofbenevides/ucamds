import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteHero, UcamSiteHeroActions, UcamSiteHeroPills } from './hero';

@Component({
  imports: [UcamSiteHero, UcamSiteHeroPills, UcamSiteHeroActions],
  // As ações vêm ANTES das pílulas de propósito: a ordem de saída é a do contrato, não a de quem escreve.
  template: `<section ucamSiteHero data-peca class="minha" heading="Seu estágio começa aqui" [eyebrow]="$any(e()['eyebrow'])" [lede]="$any(e()['lede'])" [image]="$any(e()['image'])">
    @if (e()['extras']) { <div ucamSiteHeroActions><a href="/vagas">Ver vagas</a></div> }
    @if (e()['extras']) { <ul ucamSiteHeroPills><li>Desde 2001</li></ul> }
    @if (e()['juntos']) {
      <ul ucamSiteHeroPills><li>Desde 2001</li></ul>
      <div ucamSiteHeroActions><a href="/vagas">Ver vagas</a></div>
    }
  </section>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

const R = 'ucam-site-hero';
const conteudo = (el: HTMLElement) => [...el.querySelector(`.${R}__content`)!.children].map((c) => `${c.localName}.${c.className}`);

describe('section[ucamSiteHero]', () => {
  blocosComuns('hero', Hospede);

  it('sem foto: nem imagem, nem véu, nem o modificador que reserva a metade do texto', () => {
    for (const image of [undefined, null, '', '   ']) {
      const { el, classes } = monta(Hospede, { image });
      expect(el.querySelector('img'), String(image)).toBeNull();
      expect(el.querySelector(`.${R}__scrim`)).toBeNull();
      expect(classes.has(`${R}--com-foto`)).toBe(false);
      expect([...el.children].map((c) => c.className)).toEqual([`${R}__inner`]);
    }
  });
  it('com foto: os três juntos, e a foto é decorativa', () => {
    const { el, classes } = monta(Hospede, { image: '/campus.jpg' });
    expect(classes.has(`${R}--com-foto`)).toBe(true);
    expect([...el.children].map((c) => `${c.localName}.${c.className}`)).toEqual([`img.${R}__media`, `div.${R}__scrim`, `div.${R}__inner`]);
    expect(el.querySelector('img')!.getAttribute('src')).toBe('/campus.jpg');
    expect(el.querySelector('img')!.getAttribute('alt')).toBe('');
    expect(el.querySelector(`.${R}__scrim`)!.getAttribute('aria-hidden')).toBe('true');
  });
  it('o título é o h1; eyebrow e lede só entram quando há texto', () => {
    expect(conteudo(monta(Hospede).el)).toEqual([`h1.${R}__title`]);
    expect(monta(Hospede).el.querySelector('h1')!.textContent).toBe('Seu estágio começa aqui');
    expect(conteudo(monta(Hospede, { eyebrow: 'CENPRE', lede: 'Vagas e convênios.' }).el)).toEqual([`p.${R}__eyebrow`, `h1.${R}__title`, `p.${R}__lede`]);
    expect(conteudo(monta(Hospede, { eyebrow: ' ', lede: '  ' }).el)).toEqual([`h1.${R}__title`]);
  });
  it('pílulas e ações saem na ordem do contrato, qualquer que seja a ordem escrita', () => {
    const { el } = monta(Hospede, { lede: 'Vagas.', extras: true });
    expect(conteudo(el)).toEqual([`h1.${R}__title`, `p.${R}__lede`, `ul.${R}__pills`, `div.${R}__actions`]);
    expect(el.querySelector(`.${R}__actions a`)!.getAttribute('href')).toBe('/vagas');
  });
  it('conteúdo num @if com mais de um nó não entra nos encaixes, mas não some: vai para o fim, na ordem escrita', () => {
    // É regra do Angular (aviso NG8011): um @if com vários nós na raiz não é projetado por select.
    // Sem o encaixe geral, pílulas e ações desapareciam da página sem erro.
    const { el } = monta(Hospede, { juntos: true });
    expect(conteudo(el)).toEqual([`h1.${R}__title`, `ul.${R}__pills`, `div.${R}__actions`]);
  });
});
