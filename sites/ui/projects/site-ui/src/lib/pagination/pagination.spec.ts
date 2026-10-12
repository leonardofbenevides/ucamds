import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { janelaDePaginas } from './janela';
import { UcamSitePagination } from './pagination';

@Component({
  imports: [UcamSitePagination],
  template: `<nav ucamSitePagination data-peca class="minha" [page]="$any(e()['page']) ?? 2" [total]="$any(e()['total']) ?? 89" ariaLabel="Paginação das vagas"
    [emMemoria]="$any(e()['emMemoria'])" [hrefDe]="$any(e()['hrefDe']) ?? padrao" (pageChange)="avisos.push($event)"></nav>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly avisos: number[] = [];
  readonly padrao = (p: number) => `/vagas/pagina/${p}`;
}

/** A navegação como texto: `<` e `>` são as setas, `…` a reticência, `[n]` a atual, `x` a seta sem destino. */
const desenho = (el: HTMLElement) => [...el.children].map((c) => {
  if (c.classList.contains('ucam-site-pagination__reticencias')) return '…';
  if (c.classList.contains('ucam-site-pagination__item--seta')) return c.getAttribute('aria-disabled') === 'true' ? 'x' : c.getAttribute('aria-label') === 'Página anterior' ? '<' : '>';
  return c.getAttribute('aria-current') === 'page' ? `[${c.textContent}]` : c.textContent;
}).join(' ');

describe('janelaDePaginas', () => {
  const casos: [number, number, (number | null)[]][] = [
    [1, 1, [1]],
    [1, 2, [1, 2]],
    [2, 89, [1, 2, 3, null, 89]],
    [1, 89, [1, 2, null, 89]],
    [45, 89, [1, null, 44, 45, 46, null, 89]],
    [88, 89, [1, null, 87, 88, 89]],
    [89, 89, [1, null, 88, 89]],
    // Buraco de UMA página dos dois lados: mostra a página, não a reticência.
    [4, 7, [1, 2, 3, 4, 5, 6, 7]],
    [3, 5, [1, 2, 3, 4, 5]],
    [4, 8, [1, 2, 3, 4, 5, null, 8]],
    // Fora da faixa vem para dentro.
    [0, 5, [1, 2, null, 5]],
    [-3, 5, [1, 2, null, 5]],
    [99, 5, [1, null, 4, 5]],
    [3, 0, []],
    [3, -1, []],
    [NaN, 5, [1, 2, null, 5]],
    [2, NaN, []],
    [2.7, 5.9, [1, 2, 3, 4, 5]],
  ];
  for (const [page, total, esperado] of casos) {
    it(`página ${page} de ${total}`, () => expect(janelaDePaginas(page, total)).toEqual(esperado));
  }
  it('nunca repete número nem põe duas reticências seguidas', () => {
    for (let total = 1; total <= 30; total++) {
      for (let page = 1; page <= total; page++) {
        const j = janelaDePaginas(page, total);
        const numeros = j.filter((x): x is number => x !== null);
        expect(new Set(numeros).size).toBe(numeros.length);
        expect(numeros).toEqual([...numeros].sort((a, b) => a - b));
        expect(numeros[0]).toBe(1);
        expect(numeros.at(-1)).toBe(total);
        expect(numeros).toContain(page);
        j.forEach((x, i) => { if (x === null) { expect(j[i - 1]).not.toBeNull(); expect(j[i + 1]).not.toBeNull(); } });
      }
    }
  });
});

describe('nav[ucamSitePagination]', () => {
  blocosComuns('pagination', Hospede);

  it('desenha setas, números, a atual e a reticência, como o contrato', () => {
    const { el } = monta(Hospede);
    expect(desenho(el)).toBe('< 1 [2] 3 … 89 >');
    expect(el.getAttribute('aria-label')).toBe('Paginação das vagas');
    expect(el.querySelectorAll('[aria-current]').length).toBe(1);
    expect(el.querySelector('.ucam-site-pagination__reticencias')!.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelectorAll('.ucam-site-pagination__item--seta svg.ic use').length).toBe(2);
  });

  it('cada número e cada seta é um link para a página certa', () => {
    const { el } = monta(Hospede, { page: 45 });
    expect([...el.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(
      [44, 1, 44, 45, 46, 89, 46].map((p) => `/vagas/pagina/${p}`),
    );
  });

  it('nas pontas a seta sem destino não tem href e leva aria-disabled', () => {
    const primeira = monta(Hospede, { page: 1, total: 2 }).el;
    expect(desenho(primeira)).toBe('x [1] 2 >');
    expect(primeira.querySelector('a')!.hasAttribute('href')).toBe(false);
    const ultima = monta(Hospede, { page: 2, total: 2 }).el;
    expect(desenho(ultima)).toBe('< 1 [2] x');
    expect([...ultima.querySelectorAll('a')].at(-1)!.hasAttribute('href')).toBe(false);
  });

  it('com menos de duas páginas a navegação fica vazia', () => {
    for (const total of [0, 1, -4]) expect(monta(Hospede, { total }).el.children.length).toBe(0);
  });

  it('página fora da faixa é trazida para dentro', () => {
    expect(desenho(monta(Hospede, { page: 99, total: 5 }).el)).toBe('< 1 … 4 [5] x');
    expect(desenho(monta(Hospede, { page: 0, total: 5 }).el)).toBe('x [1] 2 … 5 >');
  });

  it('por padrão o clique navega e a peça não avisa', () => {
    const { f, el } = monta(Hospede);
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    el.querySelectorAll('a')[3].dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    expect(f.componentInstance.avisos).toEqual([]);
  });

  it('em memória o clique não navega e avisa a página; a atual e a seta sem destino não avisam', () => {
    const { f, el } = monta(Hospede, { emMemoria: true, page: 1, total: 5 });
    const clica = (a: Element) => { const ev = new MouseEvent('click', { bubbles: true, cancelable: true }); a.dispatchEvent(ev); return ev.defaultPrevented; };
    const links = [...el.querySelectorAll('a')];
    expect(desenho(el)).toBe('x [1] 2 … 5 >');
    expect(clica(links[2])).toBe(true); // 2
    expect(clica(links.at(-1)!)).toBe(true); // seguinte
    expect(clica(links[1])).toBe(true); // a atual
    expect(clica(links[0])).toBe(true); // seta sem destino
    expect(f.componentInstance.avisos).toEqual([2, 2]);
  });

  it('trocar a página troca a marcação, sem sobra', () => {
    const { f, el } = monta(Hospede);
    f.componentInstance.e.set({ page: 89 });
    f.detectChanges();
    expect(desenho(el)).toBe('< 1 … 88 [89] x');
  });
});
