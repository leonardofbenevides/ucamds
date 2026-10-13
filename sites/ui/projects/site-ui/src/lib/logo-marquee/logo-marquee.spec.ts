import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteMarquee, type UcamSiteLogo } from './logo-marquee';

const LOGOS: UcamSiteLogo[] = [
  { src: '/empresas/aurora.svg', alt: 'Aurora' },
  { src: '/empresas/brisa.svg', alt: 'Brisa', href: '/empresas/brisa' },
  { src: '/empresas/cais.svg', alt: 'Cais' },
];

@Component({
  imports: [UcamSiteMarquee],
  template: `<div ucamSiteMarquee data-peca class="minha" [logos]="$any(e()['logos']) ?? logos" [paused]="$any(e()['paused'])" [pauseLabel]="$any(e()['pauseLabel'])" [fieldId]="$any(e()['fieldId'])"></div>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly logos = LOGOS;
}

@Component({ imports: [UcamSiteMarquee], template: `<div ucamSiteMarquee [logos]="logos"></div><div ucamSiteMarquee [logos]="logos"></div>` })
class Dois { readonly logos = LOGOS; }

const R = 'ucam-site-marquee';
const grupos = (el: HTMLElement) => [...el.querySelectorAll(`ul.${R}__group`)];
const nomes = (g: Element) => [...g.querySelectorAll('img')].map((i) => i.getAttribute('alt'));

describe('div[ucamSiteMarquee]', () => {
  blocosComuns('logo-marquee', Hospede);

  it('recebe os logos uma vez e desenha os dois grupos do laço', () => {
    const { el } = monta(Hospede);
    const [a, b] = grupos(el);
    expect(grupos(el).length).toBe(2);
    expect(nomes(a)).toEqual(['Aurora', 'Brisa', 'Cais']);
    expect([...a.querySelectorAll('img')].map((i) => i.getAttribute('src'))).toEqual(LOGOS.map((l) => l.src));
    expect([...b.querySelectorAll('img')].map((i) => i.getAttribute('src'))).toEqual(LOGOS.map((l) => l.src));
    expect(a.parentElement!.className).toBe(`${R}__track`);
    expect(a.parentElement!.parentElement!.className).toBe(`${R}__viewport`);
    expect([...a.children].every((li) => li.className === `${R}__item`)).toBe(true);
  });

  it('a segunda cópia não é lida nem recebe foco: aria-hidden, alt vazio e link fora da ordem do Tab', () => {
    const [a, b] = grupos(monta(Hospede).el);
    expect(a.hasAttribute('aria-hidden')).toBe(false);
    expect(b.getAttribute('aria-hidden')).toBe('true');
    expect(nomes(b)).toEqual(['', '', '']);
    // Logo com href é link nos dois grupos; só o da cópia sai da ordem de foco.
    expect(a.querySelectorAll('a').length).toBe(1);
    expect(a.querySelector('a')!.getAttribute('href')).toBe('/empresas/brisa');
    expect(a.querySelector('a')!.hasAttribute('tabindex')).toBe(false);
    expect(b.querySelector('a')!.getAttribute('tabindex')).toBe('-1');
  });

  it('a caixa de pausa vem antes da janela, e o rótulo aponta para ela', () => {
    const { el } = monta(Hospede);
    expect([...el.children].map((c) => `${c.localName}.${c.className}`)).toEqual([`input.${R}__pausa`, `label.${R}__pausa-rotulo`, `div.${R}__viewport`]);
    const caixa = el.querySelector('input')!;
    expect(caixa.type).toBe('checkbox');
    expect(caixa.id).toBeTruthy();
    expect(el.querySelector('label')!.getAttribute('for')).toBe(caixa.id);
    expect(el.querySelector('label')!.textContent).toBe('Pausar o desfile');
    expect(monta(Hospede, { pauseLabel: 'Parar' }).el.querySelector('label')!.textContent).toBe('Parar');
    expect(monta(Hospede, { pauseLabel: ' ' }).el.querySelector('label')!.textContent).toBe('Pausar o desfile');
    expect(monta(Hospede, { fieldId: 'parceiros' }).el.querySelector('input')!.id).toBe('parceiros');
  });

  it('dois desfiles na página não repetem o id da caixa', () => {
    const f = TestBed.createComponent(Dois);
    f.detectChanges();
    const ids = [...f.nativeElement.querySelectorAll('input')].map((i) => (i as HTMLInputElement).id);
    expect(ids.length).toBe(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('parado: um grupo só, sem caixa nem rótulo, com o modificador', () => {
    const { el, classes } = monta(Hospede, { paused: true });
    expect(classes.has(`${R}--parado`)).toBe(true);
    expect(grupos(el).length).toBe(1);
    expect(el.querySelectorAll('input, label').length).toBe(0);
    expect([...el.children].map((c) => c.className)).toEqual([`${R}__viewport`]);
    expect(nomes(grupos(el)[0])).toEqual(['Aurora', 'Brisa', 'Cais']);
  });

  it('logo sem endereço é descartado; com menos de dois, não há o que desfilar e a peça fica parada', () => {
    const { el } = monta(Hospede, { logos: [{ src: '', alt: 'Sem arquivo' }, null, { src: '/a.svg', alt: 'A' }, { src: '  ', alt: 'B' }, { src: '/c.svg', alt: 'C' }] });
    expect(nomes(grupos(el)[0])).toEqual(['A', 'C']);
    const um = monta(Hospede, { logos: [{ src: '/a.svg', alt: 'A' }] });
    expect(grupos(um.el).length).toBe(1);
    expect(um.classes.has(`${R}--parado`)).toBe(true);
    expect(um.el.querySelector('input')).toBeNull();
    const nenhum = monta(Hospede, { logos: [] });
    expect(nenhum.el.querySelector('ul')).toBeNull();
    expect(nenhum.el.children.length).toBe(0);
  });

  it('trocar os logos atualiza os dois grupos', () => {
    const { f, el } = monta(Hospede);
    f.componentInstance.e.set({ logos: [{ src: '/x.svg', alt: 'Xisto' }, { src: '/y.svg', alt: 'Ypê' }] });
    f.detectChanges();
    const [a, b] = grupos(el);
    expect(nomes(a)).toEqual(['Xisto', 'Ypê']);
    expect(b.querySelectorAll('img').length).toBe(2);
  });
});
