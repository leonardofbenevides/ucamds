import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteCta, UcamSiteCtaActions } from './editorial-cta';

@Component({
  imports: [UcamSiteCta, UcamSiteCtaActions],
  template: `<section ucamSiteCta data-peca class="minha" heading="Pronto para o primeiro estágio?" [eyebrow]="$any(e()['eyebrow'])" [text]="$any(e()['text'])" [image]="$any(e()['image'])">
    @if (e()['acoes']) { <div ucamSiteCtaActions><a href="/vagas">Ver vagas</a></div> }
  </section>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

const R = 'ucam-site-cta';
const conteudo = (el: HTMLElement) => [...el.querySelector(`.${R}__content`)!.children].map((c) => `${c.localName}.${c.className}`);

describe('section[ucamSiteCta]', () => {
  blocosComuns('editorial-cta', Hospede);

  it('sem foto: nem imagem, nem véu, nem o modificador', () => {
    for (const image of [undefined, null, '  ']) {
      const { el, classes } = monta(Hospede, { image });
      expect(el.querySelectorAll(`img, .${R}__scrim`).length).toBe(0);
      expect(classes.has(`${R}--com-foto`)).toBe(false);
    }
  });
  it('com foto: imagem decorativa, véu e modificador, juntos', () => {
    const { el, classes } = monta(Hospede, { image: '/alunos.jpg' });
    expect(classes.has(`${R}--com-foto`)).toBe(true);
    expect([...el.children].map((c) => `${c.localName}.${c.className}`)).toEqual([`img.${R}__media`, `div.${R}__scrim`, `div.${R}__content`]);
    expect(el.querySelector('img')!.getAttribute('alt')).toBe('');
    expect(el.querySelector(`.${R}__scrim`)!.getAttribute('aria-hidden')).toBe('true');
  });
  it('o título é um h2; eyebrow, texto e ações só entram quando existem', () => {
    expect(conteudo(monta(Hospede).el)).toEqual([`h2.${R}__title`]);
    expect(conteudo(monta(Hospede, { eyebrow: 'Próximo passo', text: 'Cadastre o currículo.', acoes: true }).el)).toEqual([
      `p.${R}__eyebrow`, `h2.${R}__title`, `p.${R}__text`, `div.${R}__actions`,
    ]);
    expect(conteudo(monta(Hospede, { eyebrow: ' ', text: ' ' }).el)).toEqual([`h2.${R}__title`]);
  });
});
