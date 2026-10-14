import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteTag } from '../tag/tag';
import { UcamSiteCard, UcamSiteCardMeta } from './card';

@Component({
  imports: [UcamSiteCard, UcamSiteCardMeta, UcamSiteTag],
  // `interactive` só vale com href; o hospedeiro dá um por padrão para o bloco do contrato enxergar a classe.
  // `featured` só vale sem href: com ele ligado, o padrão é não ter href.
  template: `<article ucamSiteCard data-peca class="minha" heading="Como montar o primeiro currículo" [href]="$any(e()['href'] === undefined ? (e()['featured'] ? null : '/curriculo') : e()['href'])"
    [image]="$any(e()['image'])" [text]="$any(e()['text'])" [interactive]="$any(e()['interactive'])" [featured]="$any(e()['featured'])" [level]="$any(e()['level'])">
    @if (e()['meta']) { <ul ucamSiteCardMeta><li ucamSiteTag>Currículo</li></ul> }
  </article>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

const T = '.ucam-site-card__title';

describe('article[ucamSiteCard]', () => {
  blocosComuns('card', Hospede);

  it('com href há UM link, o do título, e é ele que o cartão inteiro segue', () => {
    const { el } = monta(Hospede, { text: 'O que entra e o que sai.', image: '/foto.jpg', meta: true });
    const links = el.querySelectorAll('a');
    expect(links.length).toBe(1);
    expect(links[0].className).toBe('ucam-site-card__link');
    expect(links[0].getAttribute('href')).toBe('/curriculo');
    expect(links[0].parentElement!.matches(`h3${T}`)).toBe(true);
    expect(links[0].textContent).toBe('Como montar o primeiro currículo');
    expect(el.querySelector('a a')).toBeNull();
  });
  it('destaque só sem link: com href o modificador não entra', () => {
    expect(monta(Hospede, { featured: true }).el.classList.contains('ucam-site-card--destaque')).toBe(true);
    const comLink = monta(Hospede, { featured: true, href: '/turma' }).el;
    expect(comLink.classList.contains('ucam-site-card--destaque')).toBe(false);
    expect(comLink.querySelector('a.ucam-site-card__link')).not.toBeNull();
    expect(monta(Hospede, { href: null }).el.classList.contains('ucam-site-card--destaque')).toBe(false);
  });
  it('sem href não há link nenhum: o título é texto, e o cartão não se diz interativo', () => {
    for (const href of [null, '', '   ']) {
      const { el, classes } = monta(Hospede, { href, interactive: true });
      expect(el.querySelector('a'), String(href)).toBeNull();
      expect(el.querySelector(T)!.textContent).toBe('Como montar o primeiro currículo');
      expect(classes.has('ucam-site-card--interativo')).toBe(false);
    }
  });
  it('a ordem é a do contrato: foto, depois o corpo com meta, título e texto', () => {
    const { el } = monta(Hospede, { text: 'Resumo.', image: '/foto.jpg', meta: true });
    expect([...el.children].map((c) => `${c.localName}.${c.className}`)).toEqual(['img.ucam-site-card__media', 'div.ucam-site-card__body']);
    expect([...el.querySelector('.ucam-site-card__body')!.children].map((c) => `${c.localName}.${c.className}`)).toEqual([
      'ul.ucam-site-card__meta', 'h3.ucam-site-card__title', 'p.ucam-site-card__text',
    ]);
    const foto = el.querySelector('img')!;
    expect(foto.getAttribute('src')).toBe('/foto.jpg');
    expect(foto.getAttribute('alt')).toBe('');
  });
  it('sem foto, sem meta e sem texto, sobra só o título', () => {
    const { el } = monta(Hospede);
    expect(el.querySelector('img')).toBeNull();
    expect([...el.querySelector('.ucam-site-card__body')!.children].map((c) => c.localName)).toEqual(['h3']);
    expect(monta(Hospede, { image: '  ', text: ' ' }).el.querySelectorAll('img, p').length).toBe(0);
  });
  it('o nível do título é 3, e pode ser 2 ou 4; qualquer outro valor fica em 3', () => {
    expect(monta(Hospede).el.querySelector(T)!.localName).toBe('h3');
    expect(monta(Hospede, { level: 2 }).el.querySelector(T)!.localName).toBe('h2');
    expect(monta(Hospede, { level: '4' }).el.querySelector(T)!.localName).toBe('h4');
    for (const level of [1, 5, 'x', null]) expect(monta(Hospede, { level }).el.querySelector(T)!.localName).toBe('h3');
    expect(monta(Hospede, { level: 2 }).el.querySelectorAll('h2, h3, h4').length).toBe(1);
  });
});
