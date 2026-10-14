import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteFactSheet } from './fact-sheet';

const FICHA = [{ term: 'Duração', value: '24 meses' }, { term: 'Modalidade', value: 'Presencial' }];

@Component({
  imports: [UcamSiteFactSheet],
  template: `<dl ucamSiteFactSheet data-peca class="minha" [items]="$any(e()['items']) ?? ficha" [columns]="$any(e()['columns'])"></dl>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly ficha = FICHA;
}

const linhas = (el: HTMLElement) => [...el.children].map((r) => `${r.localName}.${r.className} > ${[...r.children].map((c) => `${c.localName}.${c.className.replace('ucam-site-fact-sheet__', '__')}: ${c.textContent}`).join(' + ')}`);

describe('dl[ucamSiteFactSheet]', () => {
  blocosComuns('fact-sheet', Hospede);

  it('cada linha é um div com o dt da chave e o dd do valor', () => {
    expect(linhas(monta(Hospede).el)).toEqual([
      'div.ucam-site-fact-sheet__row > dt.__term: Duração + dd.__value: 24 meses',
      'div.ucam-site-fact-sheet__row > dt.__term: Modalidade + dd.__value: Presencial',
    ]);
  });
  it('uma coluna por padrão; duas com columns 2, também vindo como texto', () => {
    expect(monta(Hospede).el.classList.contains('ucam-site-fact-sheet--duas-colunas')).toBe(false);
    expect(monta(Hospede, { columns: 2 }).el.classList.contains('ucam-site-fact-sheet--duas-colunas')).toBe(true);
    expect(monta(Hospede, { columns: '2' }).el.classList.contains('ucam-site-fact-sheet--duas-colunas')).toBe(true);
    expect(monta(Hospede, { columns: 3 }).el.classList.contains('ucam-site-fact-sheet--duas-colunas')).toBe(false);
  });
  it('linha sem chave, sem valor ou nula não entra; valor numérico vale; lista vazia fica sem filhos', () => {
    const { el } = monta(Hospede, { items: [{ term: '', value: 'x' }, { term: 'Vagas', value: '  ' }, null, { term: 7, value: 'y' }, { term: 'Créditos', value: 36 }] });
    expect(linhas(el)).toEqual(['div.ucam-site-fact-sheet__row > dt.__term: Créditos + dd.__value: 36']);
    expect(monta(Hospede, { items: [] }).el.children.length).toBe(0);
    expect(monta(Hospede, { items: 'nada' }).el.children.length).toBe(0);
  });
});
