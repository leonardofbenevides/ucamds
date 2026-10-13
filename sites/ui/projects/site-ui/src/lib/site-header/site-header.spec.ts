import { Component, signal } from '@angular/core';
import { blocosComuns, monta } from '../../testing/peca';
import { UcamSiteHeader, type UcamSiteHeaderLink } from './site-header';

const ITENS: UcamSiteHeaderLink[] = [
  { label: 'Vagas', href: '/vagas' },
  { label: 'Alunos e egressos', href: '/alunos' },
  { label: 'Empresas', href: '/empresas' },
];

@Component({
  imports: [UcamSiteHeader],
  template: `<header ucamSiteHeader data-peca class="minha" brand="CENPRE" [brandLabel]="$any(e()['brandLabel'])" [items]="$any(e()['items']) ?? itens"
    [current]="$any(e()['current'])" [homeHref]="$any(e()['homeHref']) ?? '/'" [action]="$any(e()['action'])" [secondaryAction]="$any(e()['secondaryAction'])"
    [menuLabel]="$any(e()['menuLabel'])"></header><button id="fora" type="button">fora</button>`,
})
class Hospede {
  readonly e = signal<Record<string, unknown>>({});
  readonly itens = ITENS;
}

const ACAO = { label: 'Acessar plataforma', href: 'https://plataforma.exemplo' };
const rotulos = (raiz: Element | null) => [...(raiz?.querySelectorAll('a') ?? [])].map((a) => a.textContent!.trim());
const esc = (alvo: EventTarget = document.body) => {
  const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  alvo.dispatchEvent(ev);
  return ev;
};

describe('header[ucamSiteHeader]', () => {
  blocosComuns('site-header', Hospede);

  it('a faixa tem a marca, a navegação principal e o menu do telefone com os mesmos links', () => {
    const { el } = monta(Hospede);
    const marca = el.querySelector('.ucam-site-header__brand')!;
    expect(marca.textContent).toBe('CENPRE');
    expect(marca.getAttribute('href')).toBe('/');
    const nav = el.querySelector('nav.ucam-site-header__nav')!;
    const movel = el.querySelector('details.ucam-site-header__menu nav.ucam-site-header__mobile')!;
    expect(nav.getAttribute('aria-label')).toBe('Principal');
    expect(movel.getAttribute('aria-label')).toBe('Menu');
    expect(rotulos(nav)).toEqual(['Vagas', 'Alunos e egressos', 'Empresas']);
    expect(rotulos(movel)).toEqual(['Vagas', 'Alunos e egressos', 'Empresas']);
    expect(el.querySelector('summary')!.getAttribute('aria-label')).toBe('Menu');
    expect(el.querySelectorAll('summary svg.ic use').length).toBe(1);
    expect(el.querySelector('details')!.open).toBe(false);
  });

  it('as duas navegações têm nomes diferentes mesmo com o rótulo do menu trocado', () => {
    const { el } = monta(Hospede, { menuLabel: 'Navegação' });
    expect(el.querySelector('summary')!.getAttribute('aria-label')).toBe('Navegação');
    expect(el.querySelector('.ucam-site-header__mobile')!.getAttribute('aria-label')).toBe('Navegação');
    expect(el.querySelector('.ucam-site-header__nav')!.getAttribute('aria-label')).toBe('Principal');
    // Vazio volta ao padrão: botão sem nome não diz o que abre.
    expect(monta(Hospede, { menuLabel: ' ' }).el.querySelector('summary')!.getAttribute('aria-label')).toBe('Menu');
  });

  it('current marca o mesmo link na faixa e no menu, e só ele', () => {
    const { el } = monta(Hospede, { current: '/alunos' });
    const atuais = [...el.querySelectorAll('[aria-current="page"]')];
    expect(atuais.map((a) => a.textContent)).toEqual(['Alunos e egressos', 'Alunos e egressos']);
    expect(monta(Hospede).el.querySelector('[aria-current]')).toBeNull();
    expect(monta(Hospede, { current: '/nao-existe' }).el.querySelector('[aria-current]')).toBeNull();
  });

  it('a marca diz o destino quando há rótulo, e não leva aria-label vazio', () => {
    expect(monta(Hospede, { brandLabel: 'CENPRE, página inicial' }).el.querySelector('.ucam-site-header__brand')!.getAttribute('aria-label')).toBe('CENPRE, página inicial');
    expect(monta(Hospede).el.querySelector('.ucam-site-header__brand')!.hasAttribute('aria-label')).toBe(false);
    expect(monta(Hospede, { homeHref: '/cenpre' }).el.querySelector('.ucam-site-header__brand')!.getAttribute('href')).toBe('/cenpre');
  });

  it('as ações aparecem na faixa e no fim do menu; a secundária vem antes da primária', () => {
    const semAcao = monta(Hospede).el;
    expect(semAcao.querySelector('.ucam-site-header__actions')).toBeNull();
    const { el } = monta(Hospede, { action: ACAO, secondaryAction: { label: 'Ver oportunidades', href: '/vagas' } });
    const naFaixa = [...el.querySelectorAll('.ucam-site-header__actions a')];
    expect(naFaixa.map((a) => a.className)).toEqual(['ucam-site-btn ucam-site-btn--secondary', 'ucam-site-btn ucam-site-btn--primary']);
    expect(naFaixa.map((a) => a.getAttribute('href'))).toEqual(['/vagas', 'https://plataforma.exemplo']);
    expect(rotulos(el.querySelector('.ucam-site-header__mobile')).slice(-2)).toEqual(['Ver oportunidades', 'Acessar plataforma']);
  });

  it('sem itens não há navegação vazia; sem itens e sem ação não há menu', () => {
    const soAcao = monta(Hospede, { items: [], action: ACAO }).el;
    expect(soAcao.querySelector('.ucam-site-header__nav')).toBeNull();
    expect(rotulos(soAcao.querySelector('.ucam-site-header__mobile'))).toEqual(['Acessar plataforma']);
    const vazio = monta(Hospede, { items: [] }).el;
    expect(vazio.querySelector('nav')).toBeNull();
    expect(vazio.querySelector('details')).toBeNull();
    expect(vazio.querySelector('.ucam-site-header__brand')).not.toBeNull();
    // Dado torto não vira link vazio.
    expect(monta(Hospede, { items: [{ label: '', href: '/x' }, { label: 'Ok', href: '/ok' }, null] }).el.querySelectorAll('.ucam-site-header__nav a').length).toBe(1);
  });

  it('Esc com o menu aberto fecha, devolve o foco ao botão e consome a tecla', () => {
    const { el } = monta(Hospede);
    const menu = el.querySelector('details')!;
    const botao = el.querySelector('summary')!;
    const foco = vi.spyOn(botao, 'focus');
    let chegou = 0;
    const ouvinte = () => chegou++;
    window.addEventListener('keydown', ouvinte);
    try {
      menu.open = true;
      esc(menu.querySelector('a')!);
      expect(menu.open).toBe(false);
      expect(foco).toHaveBeenCalledTimes(1);
      expect(chegou).toBe(0);
    } finally {
      window.removeEventListener('keydown', ouvinte);
    }
  });

  it('Esc com o menu fechado não faz nada e deixa a tecla seguir', () => {
    // Vale também com o foco no próprio botão do menu: fechado, a tecla não é dele.
    const { el } = monta(Hospede);
    const foco = vi.spyOn(el.querySelector('summary')!, 'focus');
    let chegou = 0;
    const ouvinte = () => chegou++;
    window.addEventListener('keydown', ouvinte);
    try {
      esc();
      expect(chegou).toBe(1);
      expect(foco).not.toHaveBeenCalled();
      expect(el.querySelector('details')!.open).toBe(false);
    } finally {
      window.removeEventListener('keydown', ouvinte);
    }
  });

  it('clicar fora fecha, sem mexer no foco; clicar dentro, fora de um link, não fecha', () => {
    const { f, el } = monta(Hospede);
    const menu = el.querySelector('details')!;
    const foco = vi.spyOn(el.querySelector('summary')!, 'focus');
    menu.open = true;
    el.querySelector('.ucam-site-header__mobile')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(menu.open).toBe(true);
    (f.nativeElement.querySelector('#fora') as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(menu.open).toBe(false);
    expect(foco).not.toHaveBeenCalled();
  });

  it('seguir um link do menu o fecha', () => {
    const { el } = monta(Hospede, { action: ACAO });
    const menu = el.querySelector('details')!;
    for (const link of el.querySelectorAll('.ucam-site-header__mobile a')) {
      menu.open = true;
      link.addEventListener('click', (ev) => ev.preventDefault(), { once: true });
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      expect(menu.open, link.textContent!).toBe(false);
    }
  });

  it('link da faixa, com o menu fechado, não é tocado', () => {
    const { el } = monta(Hospede);
    const link = el.querySelector('.ucam-site-header__nav a')!;
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.addEventListener('click', (e) => e.preventDefault(), { once: true });
    link.dispatchEvent(ev);
    expect(el.querySelector('details')!.open).toBe(false);
  });
});
