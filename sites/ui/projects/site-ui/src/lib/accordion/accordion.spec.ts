import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteAccordion, UcamSiteAccordionItem } from './accordion';

@Component({
  imports: [UcamSiteAccordion, UcamSiteAccordionItem],
  template: `<div ucamSiteAccordion data-peca class="minha" [name]="$any(e()['name'])">
    <details ucamSiteAccordionItem heading="Primeira" [open]="$any(e()['open'])" (openChange)="avisos.push($event)"><p>Resposta um.</p></details>
    <details ucamSiteAccordionItem heading="Segunda"><p>Resposta dois.</p></details>
  </div>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly avisos: boolean[] = [];
}

@Component({
  imports: [UcamSiteAccordionItem],
  template: `<details ucamSiteAccordionItem data-peca heading="Sozinho" [(open)]="aberto"><p>x</p></details>`,
})
class Solto {
  readonly e = signal<Record<string, unknown>>({});
  readonly aberto = signal(false);
}

/** O que o navegador faz quando o usuário abre ou fecha o <details>: muda `open` e dispara `toggle`. */
const alterna = (d: HTMLDetailsElement, aberto: boolean) => {
  d.open = aberto;
  d.dispatchEvent(new Event('toggle'));
};

describe('[ucamSiteAccordion]', () => {
  blocosComuns('accordion', Hospede);

  it('cada item é um details com o summary, um ícone e o painel', () => {
    const { el } = monta(Hospede);
    const itens = el.querySelectorAll('details');
    expect(itens.length).toBe(2);
    for (const d of itens) {
      expect(d.className).toBe('ucam-site-accordion__item');
      expect(d.querySelectorAll('summary.ucam-site-accordion__trigger').length).toBe(1);
      expect(d.querySelectorAll('.ucam-site-accordion__icon[aria-hidden="true"] svg.ic use').length).toBe(1);
      expect(d.querySelector('.ucam-site-accordion__panel p')).not.toBeNull();
    }
    expect(itens[0].querySelector('summary')!.textContent!.trim()).toBe('Primeira');
  });

  it('o grupo põe o mesmo name em todos os itens, e nenhum quando não há grupo', () => {
    const nomes = (el: HTMLElement) => [...el.querySelectorAll('details')].map((d) => d.getAttribute('name'));
    expect(nomes(monta(Hospede, { name: 'faq' }).el)).toEqual(['faq', 'faq']);
    expect(nomes(monta(Hospede).el)).toEqual([null, null]);
    expect(nomes(monta(Hospede, { name: '  ' }).el)).toEqual([null, null]);
  });

  it('open abre o item, e fechado é o padrão', () => {
    expect(monta(Hospede).el.querySelector('details')!.open).toBe(false);
    expect(monta(Hospede, { open: true }).el.querySelector('details')!.open).toBe(true);
    expect(monta(Hospede, { open: true }).el.querySelectorAll('details')[1].open).toBe(false);
  });

  it('quando o usuário abre ou fecha, o item avisa com o estado real', () => {
    const { f, el } = monta(Hospede);
    const d = el.querySelector('details')!;
    alterna(d, true);
    alterna(d, false);
    expect(f.componentInstance.avisos).toEqual([true, false]);
  });

  it('toggle que não muda o estado não avisa de novo', () => {
    const { f, el } = monta(Hospede, { open: true });
    el.querySelector('details')!.dispatchEvent(new Event('toggle'));
    expect(f.componentInstance.avisos).toEqual([]);
  });

  it('mudar a entrada depois abre e fecha', () => {
    const { f, el } = monta(Hospede);
    f.componentInstance.e.set({ open: true });
    f.detectChanges();
    expect(el.querySelector('details')!.open).toBe(true);
    f.componentInstance.e.set({ open: false });
    f.detectChanges();
    expect(el.querySelector('details')!.open).toBe(false);
  });

  it('o item funciona fora de um grupo, com ligação nos dois sentidos', () => {
    const f = TestBed.createComponent(Solto);
    f.detectChanges();
    const d = f.nativeElement.querySelector('details') as HTMLDetailsElement;
    expect(d.hasAttribute('name')).toBe(false);
    alterna(d, true);
    expect(f.componentInstance.aberto()).toBe(true);
    f.detectChanges();
    f.componentInstance.aberto.set(false);
    f.detectChanges();
    expect(d.open).toBe(false);
  });
});
