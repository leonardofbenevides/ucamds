import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteStats } from './stats-band';

const NUMEROS = [{ value: '5.000+', label: 'alunos encaminhados' }, { value: '24', label: 'anos de atividade' }];

@Component({
  imports: [UcamSiteStats],
  template: `<dl ucamSiteStats data-peca class="minha" [items]="$any(e()['items']) ?? numeros" [inverse]="$any(e()['inverse'])"></dl>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly numeros = NUMEROS;
}

describe('dl[ucamSiteStats]', () => {
  blocosComuns('stats-band', Hospede);

  it('cada número é um grupo com o rótulo ANTES do valor no documento', () => {
    const { el } = monta(Hospede);
    expect([...el.children].map((g) => `${g.localName}.${g.className}`)).toEqual(['div.ucam-site-stats__item', 'div.ucam-site-stats__item']);
    expect([...el.children[0].children].map((c) => `${c.localName}.${c.className}: ${c.textContent}`)).toEqual([
      'dt.ucam-site-stats__label: alunos encaminhados',
      'dd.ucam-site-stats__value: 5.000+',
    ]);
  });
  it('item sem valor, sem rótulo ou nulo não entra; lista vazia deixa a lista sem filhos', () => {
    const { el } = monta(Hospede, { items: [{ value: '', label: 'x' }, { value: '9', label: '  ' }, null, { value: '800+', label: 'vagas' }] });
    expect(el.children.length).toBe(1);
    expect(el.textContent).toBe('vagas800+');
    expect(monta(Hospede, { items: [] }).el.children.length).toBe(0);
  });
  it('valor numérico é aceito como veio', () => {
    expect(monta(Hospede, { items: [{ value: 24, label: 'anos' }] }).el.querySelector('dd')!.textContent).toBe('24');
  });
});
