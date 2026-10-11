import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteButton } from './button';

@Component({
  imports: [UcamSiteButton],
  template: `<a ucamSiteButton data-peca class="minha" href="/x" [variant]="$any(e()['variant'])" [size]="$any(e()['size'])" [inverse]="$any(e()['inverse'])">x</a>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

@Component({ imports: [UcamSiteButton], template: `<button ucamSiteButton data-peca type="button" disabled>x</button>` })
class HospedeBotao {
  readonly e = signal<Record<string, unknown>>({});
}

describe('[ucamSiteButton]', () => {
  blocosComuns('button', Hospede);

  it('sem entrada nenhuma é o primário', () => {
    expect([...monta(Hospede).classes].sort()).toEqual(['minha', 'ucam-site-btn', 'ucam-site-btn--primary']);
  });
  it('serve em <button>, e não toca em type nem em disabled', () => {
    const { el, classes } = monta(HospedeBotao);
    expect(el.localName).toBe('button');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(classes.has('ucam-site-btn')).toBe(true);
  });
});
