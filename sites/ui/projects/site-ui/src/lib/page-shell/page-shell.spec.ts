import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteContainer, UcamSitePage, UcamSitePageMain, UcamSiteSecao, UcamSiteSkip } from './page-shell';

@Component({
  imports: [UcamSitePage, UcamSiteSkip, UcamSitePageMain, UcamSiteSecao, UcamSiteContainer],
  template: `<div ucamSitePage data-peca class="minha">
    <a ucamSiteSkip href="#c">Ir para o conteúdo</a>
    <main ucamSitePageMain id="c">
      <section ucamSiteSecao data-peca-tone [tone]="$any(e()['tone'])">
        <div ucamSiteContainer data-peca-width [width]="$any(e()['width'])">x</div>
      </section>
    </main>
  </div>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

describe('a moldura da página', () => {
  blocosComuns('page-shell', Hospede);

  it('cada elemento leva a classe da sua parte', () => {
    const { el } = monta(Hospede);
    expect(el.className).toContain('ucam-site-page');
    expect(el.querySelector('a')!.className).toBe('ucam-site-skip');
    expect(el.querySelector('main')!.className).toBe('ucam-site-page__main');
    expect(el.querySelector('section')!.className).toBe('ucam-site-secao');
    expect(el.querySelector('section > div')!.className).toBe('ucam-site-container');
  });
  it('o link de salto e o conteúdo principal ficam ligados pelo que o consumidor escreveu', () => {
    const { el } = monta(Hospede);
    expect(el.querySelector('a')!.getAttribute('href')).toBe('#c');
    expect(el.querySelector('main')!.getAttribute('id')).toBe('c');
  });
  it('largura e tom são independentes', () => {
    const { el } = monta(Hospede, { tone: 'sutil', width: 'faixa' });
    expect(el.querySelector('section')!.className.split(' ').sort()).toEqual(['ucam-site-secao', 'ucam-site-secao--sutil']);
    expect(el.querySelector('section > div')!.className.split(' ').sort()).toEqual(['ucam-site-container', 'ucam-site-container--faixa']);
  });
});
