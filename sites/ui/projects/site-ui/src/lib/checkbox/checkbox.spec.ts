import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteCheck, UcamSiteCheckBox, UcamSiteCheckGroup } from './checkbox';

@Component({
  imports: [UcamSiteCheckGroup, UcamSiteCheck, UcamSiteCheckBox],
  template: `<fieldset ucamSiteCheckGroup [legend]="$any(e()['legend'])" data-peca-legend><label ucamSiteCheck data-peca class="minha" [label]="$any(e()['label'] ?? 'Presencial')"><input ucamSiteCheckBox [checked]="!!e()['checked']" [disabled]="!!e()['disabled']"></label></fieldset>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
}

describe('label[ucamSiteCheck]', () => {
  blocosComuns('checkbox', Hospede);

  it('o label envolve a caixa: o texto é o nome e o clique no texto marca', () => {
    const { el } = monta(Hospede);
    const caixa = el.querySelector('input')!;
    expect(caixa.type).toBe('checkbox');
    expect(caixa.classList.contains('ucam-site-checkbox__box')).toBe(true);
    expect(el.querySelector('.ucam-site-checkbox__label')!.textContent).toBe('Presencial');
    (el.querySelector('.ucam-site-checkbox__label') as HTMLElement).click();
    expect(caixa.checked).toBe(true);
  });

  it('checked e disabled são os nativos', () => {
    const caixa = monta(Hospede, { checked: true, disabled: true }).el.querySelector('input')!;
    expect(caixa.checked).toBe(true);
    expect(caixa.disabled).toBe(true);
  });

  it('o grupo é um fieldset com legenda, e legenda vazia não desenha legend', () => {
    const { f } = monta(Hospede, { legend: 'Modalidade' });
    const grupo = f.nativeElement.querySelector('fieldset') as HTMLElement;
    expect(grupo.classList.contains('ucam-site-checkbox-group')).toBe(true);
    expect(grupo.querySelector('legend')!.textContent).toBe('Modalidade');
    expect(monta(Hospede, { legend: '  ' }).f.nativeElement.querySelector('legend')).toBeNull();
  });
});
