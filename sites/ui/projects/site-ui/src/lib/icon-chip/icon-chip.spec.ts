import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteIcon } from '../icon/icon';
import { UcamSiteIconChip } from './icon-chip';

@Component({
  imports: [UcamSiteIconChip, UcamSiteIcon],
  template: `<span ucamSiteIconChip data-peca class="minha" [size]="$any(e()['size'])" [tone]="$any(e()['tone'])"><svg ucamSiteIcon="briefcase"></svg></span>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

describe('[ucamSiteIconChip]', () => {
  blocosComuns('icon-chip', Hospede);

  it('é decorativo: aria-hidden na pastilha', () => {
    expect(monta(Hospede).el.getAttribute('aria-hidden')).toBe('true');
  });
  it('o ícone é o que o consumidor projeta', () => {
    expect(monta(Hospede).el.querySelector('svg.ic use')!.getAttribute('href')).toBe('#i-briefcase');
  });
});
