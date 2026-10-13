import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteProse } from './prose';

@Component({
  imports: [UcamSiteProse],
  template: `<div ucamSiteProse data-peca class="minha" [innerHTML]="html"></div>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly html = '<p>Um <strong>parágrafo</strong>.</p><h2>Título</h2><ul><li>item</li></ul>';
}

describe('[ucamSiteProse]', () => {
  blocosComuns('prose', Hospede);

  it('só põe a classe: o HTML do artigo, ligado por quem usa, fica como veio', () => {
    const { el } = monta(Hospede);
    expect(el.innerHTML).toBe('<p>Um <strong>parágrafo</strong>.</p><h2>Título</h2><ul><li>item</li></ul>');
  });
});
