import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteSectionTabs, type UcamSiteSectionTab } from './section-tabs';

const ABAS: UcamSiteSectionTab[] = [
  { label: 'Apresentação', href: '/mestrado#apresentacao' },
  { label: 'Pesquisa', href: '/mestrado#pesquisa' },
  { label: 'Docentes', href: '/mestrado#docentes' },
];

@Component({
  imports: [UcamSiteSectionTabs],
  template: `<nav ucamSiteSectionTabs data-peca class="minha" [items]="$any(e()['items']) ?? abas" [current]="$any(e()['current'])" [ariaLabel]="$any(e()['ariaLabel'])"></nav>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly abas = ABAS;
}

const links = (el: HTMLElement) => [...el.querySelectorAll('a')].map((a) => `${a.getAttribute('href')}${a.getAttribute('aria-current') ? `[${a.getAttribute('aria-current')}]` : ''} ${a.textContent}`);

describe('nav[ucamSiteSectionTabs]', () => {
  blocosComuns('section-tabs', Hospede);

  it('uma lista de links, cada um com o href dado, e a navegação com nome', () => {
    const { el } = monta(Hospede);
    expect(el.firstElementChild!.className).toBe('ucam-site-section-tabs__list');
    expect(links(el)).toEqual(['/mestrado#apresentacao Apresentação', '/mestrado#pesquisa Pesquisa', '/mestrado#docentes Docentes']);
    expect(el.getAttribute('aria-label')).toBe('Seções da página');
    expect(monta(Hospede, { ariaLabel: 'Seções do curso' }).el.getAttribute('aria-label')).toBe('Seções do curso');
    expect(monta(Hospede, { ariaLabel: '  ' }).el.getAttribute('aria-label')).toBe('Seções da página');
  });
  it('exatamente uma aba é a atual quando current casa; nenhuma quando não casa', () => {
    expect(links(monta(Hospede, { current: '/mestrado#pesquisa' }).el)).toEqual(['/mestrado#apresentacao Apresentação', '/mestrado#pesquisa[page] Pesquisa', '/mestrado#docentes Docentes']);
    expect(monta(Hospede, { current: '/mestrado#nada' }).el.querySelectorAll('[aria-current]').length).toBe(0);
    expect(monta(Hospede).el.querySelectorAll('[aria-current]').length).toBe(0);
  });
  it('aba sem rótulo, sem destino ou nula não entra; href repetido fica só na primeira; sem abas, sem lista', () => {
    const { el } = monta(Hospede, { items: [{ label: '', href: '/a' }, { label: 'B', href: ' ' }, null, { label: 'C', href: '/c' }, { label: 'C de novo', href: '/c' }] });
    expect(links(el)).toEqual(['/c C']);
    expect(monta(Hospede, { items: [] }).el.children.length).toBe(0);
  });
  it('depois de desenhar, a FILEIRA rola até a atual, e só quando há atual', () => {
    const rolar = vi.fn();
    const original = HTMLElement.prototype.scrollTo;
    HTMLElement.prototype.scrollTo = rolar as never;
    try {
      monta(Hospede);
      expect(rolar).not.toHaveBeenCalled();
      const { f, el } = monta(Hospede, { current: '/mestrado#docentes' });
      f.detectChanges();
      expect(rolar).toHaveBeenCalled();
      expect(rolar.mock.contexts.at(-1)).toBe(el);
      expect(rolar.mock.calls.at(-1)![0]).toMatchObject({ behavior: 'instant' });
    } finally {
      HTMLElement.prototype.scrollTo = original;
    }
  });
});
