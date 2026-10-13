import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteIcon } from '../icon/icon';
import { UcamSiteHeroPill } from './hero-pill';

@Component({
  imports: [UcamSiteHeroPill, UcamSiteIcon],
  template: `<ul><li ucamSiteHeroPill data-peca class="minha"><svg ucamSiteIcon="briefcase"></svg> 1.700 empresas parceiras</li></ul>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

describe('[ucamSiteHeroPill]', () => {
  blocosComuns('hero-pill', Hospede);

  it('só põe a classe: o ícone e o texto são de quem usa, e a pílula não vira controle', () => {
    const { el } = monta(Hospede);
    expect(el.textContent!.trim()).toBe('1.700 empresas parceiras');
    expect(el.querySelector('svg.ic use')!.getAttribute('href')).toBe('#i-briefcase');
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.hasAttribute('role')).toBe(false);
  });
});
