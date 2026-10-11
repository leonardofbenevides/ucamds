import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteAvatar } from './avatar';

@Component({
  imports: [UcamSiteAvatar],
  template: `<span ucamSiteAvatar data-peca class="minha" [size]="$any(e()['size'])" [shape]="$any(e()['shape'])" [name]="$any(e()['name'])">AS</span>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

describe('[ucamSiteAvatar]', () => {
  blocosComuns('avatar', Hospede);

  it('com nome é uma imagem com rótulo', () => {
    const { el } = monta(Hospede, { name: 'Ana de Souza' });
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Ana de Souza');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
  });
  it('sem nome é decorativo: o nome está escrito ao lado', () => {
    for (const name of [undefined, null, '', '   ']) {
      const { el } = monta(Hospede, { name });
      expect(el.getAttribute('aria-hidden')).toBe('true');
      expect(el.hasAttribute('role')).toBe(false);
      expect(el.hasAttribute('aria-label')).toBe(false);
    }
  });
});
