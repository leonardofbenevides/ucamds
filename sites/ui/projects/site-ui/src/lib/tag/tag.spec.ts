import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteTag } from './tag';

@Component({ imports: [UcamSiteTag], template: `<span ucamSiteTag data-peca class="minha" [tone]="$any(e()['tone'])">EAD</span>` })
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

describe('[ucamSiteTag]', () => {
  blocosComuns('tag', Hospede);

  it('o tom neutro é o padrão e não tem classe de modificador', () => {
    expect([...monta(Hospede).classes].sort()).toEqual(['minha', 'ucam-site-tag']);
  });
  it('não vira foco nem controle', () => {
    const { el } = monta(Hospede);
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.hasAttribute('role')).toBe(false);
  });
});
