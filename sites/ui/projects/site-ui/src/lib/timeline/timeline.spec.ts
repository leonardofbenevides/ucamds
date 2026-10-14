import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteTimeline, type UcamSiteMilestone } from './timeline';

const MARCOS: UcamSiteMilestone[] = [
  { year: '2000', title: 'Mestrado implantado', text: 'Reconhecido pela CAPES no mesmo ano.' },
  { year: 2001, title: 'Primeira turma do Mestrado' },
];

@Component({
  imports: [UcamSiteTimeline],
  template: `<ol ucamSiteTimeline data-peca class="minha" [items]="$any(e()['items']) ?? marcos"></ol>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly marcos = MARCOS;
}

const marcos = (el: HTMLElement) => [...el.children].map((li) => `${li.localName}: ${[...li.children].map((c) => `${c.localName}.${c.className.replace('ucam-site-timeline__', '__')} ${c.textContent}`).join(' | ')}`);

describe('ol[ucamSiteTimeline]', () => {
  blocosComuns('timeline', Hospede);

  it('uma lista ordenada com role list; em cada marco, o ano antes do título e o texto depois', () => {
    const { el } = monta(Hospede);
    expect(el.getAttribute('role')).toBe('list');
    expect(marcos(el)).toEqual([
      'li: span.__year 2000 | p.__title Mestrado implantado | p.__text Reconhecido pela CAPES no mesmo ano.',
      'li: span.__year 2001 | p.__title Primeira turma do Mestrado',
    ]);
  });
  it('marco sem ano, sem título ou nulo não entra; texto vazio ou de outro tipo não deixa parágrafo', () => {
    const { el } = monta(Hospede, { items: [{ year: '', title: 'x' }, { year: '2006', title: '  ' }, null, { year: 2015, title: 'Doutorado instituído', text: 9 }, { year: '2016', title: 'Primeira turma', text: ' ' }] });
    expect(marcos(el)).toEqual(['li: span.__year 2015 | p.__title Doutorado instituído', 'li: span.__year 2016 | p.__title Primeira turma']);
    expect(monta(Hospede, { items: [] }).el.children.length).toBe(0);
  });
});
