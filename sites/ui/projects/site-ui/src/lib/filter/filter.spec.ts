import { Component, computed, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteFilter } from './filter';

const AREAS = [
  { label: 'Todas', value: '' },
  { label: 'Tecnologia', value: 'tecnologia' },
  { label: 'Saúde', value: 'saude' },
];

@Component({
  imports: [UcamSiteFilter],
  template: `<div ucamSiteFilter data-peca class="minha" [items]="$any(itens())" [value]="$any(e()['value'])" [ariaLabel]="$any(e()['ariaLabel'])" (valueChange)="emitidos.push($event)"></div>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  /** Com a chave, vale o que foi passado, até null; sem ela, as áreas. */
  readonly itens = computed(() => ('items' in this.e() ? this.e()['items'] : AREAS));
  readonly emitidos: string[] = [];
}

describe('div[ucamSiteFilter]', () => {
  blocosComuns('filter', Hospede);

  const pressionadas = (el: HTMLElement) =>
    [...el.querySelectorAll('button')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent);

  it('é um grupo com nome, e nome vazio volta ao padrão', () => {
    expect(monta(Hospede, { ariaLabel: 'Área de conhecimento' }).el.getAttribute('aria-label')).toBe('Área de conhecimento');
    const { el } = monta(Hospede, { ariaLabel: '  ' });
    expect(el.getAttribute('role')).toBe('group');
    expect(el.getAttribute('aria-label')).toBe('Filtro');
  });

  it('exatamente uma opção pressionada; sem value que case, a primeira', () => {
    expect(pressionadas(monta(Hospede, { value: 'saude' }).el)).toEqual(['Saúde']);
    expect(pressionadas(monta(Hospede, { value: 'nao-existe' }).el)).toEqual(['Todas']);
    expect(pressionadas(monta(Hospede).el)).toEqual(['Todas']);
  });

  it('o clique emite o value, e a opção que já vale não emite', () => {
    const { f, el } = monta(Hospede, { value: 'saude' });
    const [todas, tec, saude] = [...el.querySelectorAll('button')];
    saude.click();
    tec.click();
    todas.click();
    expect(f.componentInstance.emitidos).toEqual(['tecnologia', '']);
  });

  it('opção sem rótulo e value repetido ficam de fora; lista nula não quebra', () => {
    const { el } = monta(Hospede, { items: [{ label: 'A', value: 'a' }, { label: ' ', value: 'b' }, { label: 'A de novo', value: 'a' }] });
    expect([...el.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['A']);
    expect(monta(Hospede, { items: null }).el.querySelectorAll('button').length).toBe(0);
  });
});
