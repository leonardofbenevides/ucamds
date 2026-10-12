import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteBreadcrumb, type UcamSiteBreadcrumbItem } from './breadcrumb';

const TRILHA: UcamSiteBreadcrumbItem[] = [{ label: 'Início', href: '/' }, { label: 'Empresas', href: '/empresas' }, { label: 'Cadastro de convênio' }];

@Component({
  imports: [UcamSiteBreadcrumb],
  template: `<nav ucamSiteBreadcrumb data-peca class="minha" [items]="$any(e()['items']) ?? trilha" [inverse]="$any(e()['inverse'])" [ariaLabel]="$any(e()['ariaLabel'])"></nav>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly trilha = TRILHA;
}

const itens = (el: HTMLElement) => [...el.querySelectorAll('li')].map((li) => {
  const filho = li.firstElementChild!;
  return `${filho.localName}${filho.getAttribute('href') ? `[${filho.getAttribute('href')}]` : ''}${filho.hasAttribute('aria-current') ? '!' : ''} ${filho.textContent}`;
});

describe('nav[ucamSiteBreadcrumb]', () => {
  blocosComuns('breadcrumb', Hospede);

  it('os itens são links, e o último é a página atual', () => {
    const { el } = monta(Hospede);
    expect(itens(el)).toEqual(['a[/] Início', 'a[/empresas] Empresas', 'span! Cadastro de convênio']);
    expect(el.querySelector('[aria-current]')!.getAttribute('aria-current')).toBe('page');
    expect(el.querySelectorAll('li').length).toBe(el.querySelectorAll('.ucam-site-breadcrumb__item').length);
  });
  it('o último é a página atual mesmo que venha com href: a página atual não é link para si mesma', () => {
    const { el } = monta(Hospede, { items: [{ label: 'Início', href: '/' }, { label: 'Vagas', href: '/vagas' }] });
    expect(itens(el)).toEqual(['a[/] Início', 'span! Vagas']);
  });
  it('item do meio sem href é texto, sem aria-current', () => {
    const { el } = monta(Hospede, { items: [{ label: 'Início', href: '/' }, { label: 'Seção' }, { label: 'Página' }] });
    expect(itens(el)).toEqual(['a[/] Início', 'span Seção', 'span! Página']);
  });
  it('um item só é a página atual; lista vazia não deixa <ol> vazio', () => {
    expect(itens(monta(Hospede, { items: [{ label: 'Início', href: '/' }] }).el)).toEqual(['span! Início']);
    const { el } = monta(Hospede, { items: [] });
    expect(el.querySelector('ol')).toBeNull();
    expect(el.children.length).toBe(0);
  });
  it('o nome da navegação é Trilha, e pode ser outro', () => {
    expect(monta(Hospede).el.getAttribute('aria-label')).toBe('Trilha');
    expect(monta(Hospede, { ariaLabel: 'Você está em' }).el.getAttribute('aria-label')).toBe('Você está em');
    // Vazio ou nulo volta ao padrão: navegação sem nome não distingue esta da principal.
    expect(monta(Hospede, { ariaLabel: '  ' }).el.getAttribute('aria-label')).toBe('Trilha');
  });
  it('trocar a trilha troca os itens, sem sobra', () => {
    const { f, el } = monta(Hospede);
    f.componentInstance.e.set({ items: [{ label: 'Início', href: '/' }, { label: 'Contato' }] });
    f.detectChanges();
    expect(itens(el)).toEqual(['a[/] Início', 'span! Contato']);
  });
});
