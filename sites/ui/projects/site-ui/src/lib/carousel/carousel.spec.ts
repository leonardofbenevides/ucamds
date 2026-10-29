import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteCarousel, UcamSiteCarouselItem, UcamSiteCarouselTitulo } from './carousel';

@Component({
  imports: [UcamSiteCarousel, UcamSiteCarouselItem, UcamSiteCarouselTitulo],
  template: `<section ucamSiteCarousel data-peca class="minha" [ariaLabel]="$any(e()['ariaLabel'])"><h2 ucamSiteCarouselTitulo>Depoimentos</h2>@for (n of itens(); track n) {<li ucamSiteCarouselItem>Item {{ n }}</li>}</section>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly itens = signal([1, 2, 3, 4]);
}

describe('section[ucamSiteCarousel]', () => {
  blocosComuns('carousel', Hospede);

  it('é uma região com nome, e nome vazio volta ao padrão', () => {
    expect(monta(Hospede, { ariaLabel: 'Depoimentos dos alunos' }).el.getAttribute('aria-label')).toBe('Depoimentos dos alunos');
    expect(monta(Hospede, { ariaLabel: ' ' }).el.getAttribute('aria-label')).toBe('Destaques');
  });

  it('todos os itens ficam na página, na trilha focável', () => {
    const { el } = monta(Hospede);
    const trilha = el.querySelector('ul.ucam-site-carousel__trilha')!;
    expect(trilha.getAttribute('tabindex')).toBe('0');
    expect(trilha.querySelectorAll('li.ucam-site-carousel__item').length).toBe(4);
  });

  it('antes de medir: "1 de N", Anterior desabilitado, Próximo não; setas ligadas à trilha', () => {
    const { el } = monta(Hospede);
    expect(el.querySelector('.ucam-site-carousel__contagem')!.textContent).toBe('1 de 4');
    const [ant, prox] = [...el.querySelectorAll('button')];
    expect(ant.getAttribute('aria-label')).toBe('Anterior');
    expect(ant.disabled).toBe(true);
    expect(prox.disabled).toBe(false);
    const id = el.querySelector('ul')!.id;
    expect(id).toBeTruthy();
    expect(ant.getAttribute('aria-controls')).toBe(id);
    expect(prox.getAttribute('aria-controls')).toBe(id);
  });

  it('o título vai no topo, antes dos controles', () => {
    const topo = monta(Hospede).el.querySelector('.ucam-site-carousel__topo')!;
    expect(topo.firstElementChild!.localName).toBe('h2');
  });

  it('com um item só, as duas setas ficam desabilitadas', () => {
    const { f, el } = monta(Hospede);
    f.componentInstance.itens.set([1]);
    f.detectChanges();
    expect([...el.querySelectorAll('button')].every((b) => b.disabled)).toBe(true);
    expect(el.querySelector('.ucam-site-carousel__contagem')!.textContent).toBe('1 de 1');
  });
});
