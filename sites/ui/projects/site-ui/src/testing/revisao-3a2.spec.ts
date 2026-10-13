/**
 * O que a revisão da fatia 3a-2 achou (13/10/2026). Cada bloco é um defeito
 * que os testes das peças não viam.
 */
import { BrowserPlatformLocation, PlatformLocation } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamSiteBreadcrumb } from '../lib/breadcrumb/breadcrumb';
import { UcamSiteInput } from '../lib/input/input';
import { UcamSiteNewsletter } from '../lib/newsletter-form/newsletter-form';
import { UcamSitePageMain, UcamSiteSkip } from '../lib/page-shell/page-shell';
import { UcamSitePagination } from '../lib/pagination/pagination';
import { UcamSiteHeader } from '../lib/site-header/site-header';
import { mesmaArvore } from './paridade';

const monta = <T>(tipo: new () => T) => {
  const f = TestBed.createComponent(tipo);
  f.detectChanges();
  return { f, el: f.nativeElement as HTMLElement, c: f.componentInstance };
};

/* ---- C1: o link padrão da paginação ------------------------------------- */
@Component({
  imports: [UcamSitePagination],
  template: `<nav ucamSitePagination [page]="pagina()" [total]="89" ariaLabel="Paginação" [hrefDe]="href()" [emMemoria]="memoria()" (pageChange)="pagina.set($event)"></nav>`,
})
class Paginas {
  readonly pagina = signal(2);
  readonly href = signal<string | ((p: number) => string) | null>(null);
  readonly memoria = signal(false);
}

describe('paginação: o endereço de cada página', () => {
  const base = () => document.querySelector('base');
  afterEach(() => { base()?.remove(); history.replaceState(null, '', '/'); });

  it('o padrão parte do endereço atual: sob <base href="/"> não manda para a home, e guarda os outros parâmetros', () => {
    // "?pagina=2" resolve contra a BASE do documento, não contra a página. Todo
    // app do Angular CLI tem <base href="/">: em /vagas/abertas o link levava a /.
    document.head.insertAdjacentHTML('afterbegin', '<base href="/">');
    history.replaceState(null, '', '/vagas/abertas?area=ti&pagina=2');
    // O ambiente de teste troca a localização por uma falsa; aqui interessa a de verdade, a do navegador.
    TestBed.configureTestingModule({ providers: [{ provide: PlatformLocation, useClass: BrowserPlatformLocation }] });
    const { el } = monta(Paginas);
    const tres = [...el.querySelectorAll('a')].find((a) => a.textContent === '3')!;
    const destino = new URL(tres.href);
    expect(destino.pathname).toBe('/vagas/abertas');
    expect(destino.searchParams.get('pagina')).toBe('3');
    expect(destino.searchParams.get('area')).toBe('ti');
  });

  it('aceita um modelo em texto, que é o que cabe num template', () => {
    const { f, el, c } = monta(Paginas);
    c.href.set('/vagas?pagina={pagina}');
    f.detectChanges();
    expect([...el.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([1, 1, 2, 3, 89, 3].map((p) => `/vagas?pagina=${p}`));
    c.href.set('/vagas/pagina/{pagina}/');
    f.detectChanges();
    expect(el.querySelectorAll('a')[1].getAttribute('href')).toBe('/vagas/pagina/1/');
  });

  it('em memória, clique com tecla modificadora ou botão do meio não é barrado nem emite', () => {
    const { f, el, c } = monta(Paginas);
    c.memoria.set(true);
    f.detectChanges();
    const tres = [...el.querySelectorAll('a')].find((a) => a.textContent === '3')!;
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }]) {
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
      tres.addEventListener('click', (e) => queueMicrotask(() => e.preventDefault()), { once: true });
      tres.dispatchEvent(ev);
      expect(ev.defaultPrevented, JSON.stringify(init)).toBe(false);
    }
    expect(c.pagina()).toBe(2);
  });

  it('em memória, o número escolhido continua sendo o MESMO elemento, agora o atual', () => {
    const { f, el, c } = monta(Paginas);
    c.memoria.set(true);
    c.pagina.set(45);
    f.detectChanges();
    const quarentaESeis = [...el.querySelectorAll('a')].find((a) => a.textContent === '46')!;
    quarentaESeis.focus();
    quarentaESeis.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    f.detectChanges();
    expect(c.pagina()).toBe(46);
    expect(quarentaESeis.isConnected).toBe(true);
    expect(quarentaESeis.textContent).toBe('46');
    expect(quarentaESeis.getAttribute('aria-current')).toBe('page');
    expect(document.activeElement).toBe(quarentaESeis);
  });

  it('em memória, a seta que perde o destino devolve o foco à página atual', async () => {
    const { f, el, c } = monta(Paginas);
    c.memoria.set(true);
    c.pagina.set(88);
    f.detectChanges();
    const seguinte = [...el.querySelectorAll('a')].at(-1)!;
    seguinte.focus();
    seguinte.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    f.detectChanges();
    await f.whenStable();
    expect(c.pagina()).toBe(89);
    expect(document.activeElement).toBe(el.querySelector('[aria-current="page"]'));
  });
});

/* ---- I1: o link de salto ------------------------------------------------- */
@Component({
  imports: [UcamSiteSkip, UcamSitePageMain],
  template: `<a ucamSiteSkip href="#conteudo">Ir para o conteúdo</a><main ucamSitePageMain id="conteudo">x</main><a ucamSiteSkip id="orfao" href="#nao-existe">y</a>`,
})
class Salto {}

describe('link de salto', () => {
  it('leva o foco ao alvo sem navegar: sob <base href="/"> o href sozinho recarregaria a home', () => {
    const { el } = monta(Salto);
    const principal = el.querySelector('main')!;
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    el.querySelector('a')!.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(principal);
    // O <main> não é focável sozinho: ganha tabindex -1, sem entrar na ordem do Tab.
    expect(principal.getAttribute('tabindex')).toBe('-1');
  });
  it('sem alvo na página, não barra nada', () => {
    const { el } = monta(Salto);
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    el.querySelector('#orfao')!.addEventListener('click', (e) => queueMicrotask(() => e.preventDefault()), { once: true });
    el.querySelector('#orfao')!.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });
});

/* ---- I2: o input sozinho não apaga o que o consumidor LIGA ---------------- */
@Component({
  imports: [UcamSiteInput],
  template: `<input ucamSiteInput [id]="id" [attr.aria-invalid]="'true'" [attr.aria-describedby]="'ajuda'">`,
})
class InputLigado { readonly id = 'meu'; }

describe('input sem campo em volta', () => {
  it('não toca em id, aria-describedby nem aria-invalid, escritos ou ligados', () => {
    const { el } = monta(InputLigado);
    const campo = el.querySelector('input')!;
    expect(campo.id).toBe('meu');
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    expect(campo.getAttribute('aria-describedby')).toBe('ajuda');
    expect(campo.className).toBe('ucam-site-input__field');
  });
});

/* ---- I3: a trilha com dado torto ------------------------------------------ */
@Component({ imports: [UcamSiteBreadcrumb], template: `<nav ucamSiteBreadcrumb [items]="$any(itens)"></nav>` })
class Trilha { readonly itens = [{ label: 'Início', href: '/' }, null, { label: '', href: '/x' }, { label: '  ' }, { label: 'Vagas', href: '/vagas' }, undefined]; }

describe('trilha com dado torto', () => {
  it('item nulo ou sem rótulo não quebra nem vira link sem nome', () => {
    const { el } = monta(Trilha);
    expect([...el.querySelectorAll('li')].map((li) => `${li.firstElementChild!.localName} ${li.textContent}`)).toEqual(['a Início', 'span Vagas']);
    expect(el.querySelector('[aria-current="page"]')!.textContent).toBe('Vagas');
  });
});

/* ---- I5: a newsletter exige o e-mail --------------------------------------- */
@Component({ imports: [UcamSiteNewsletter], template: `<form ucamSiteNewsletter heading="x" [state]="estado()" message="Falhou."></form>` })
class Assinatura { readonly estado = signal<'idle' | 'error'>('idle'); }

@Component({ imports: [UcamSiteNewsletter], template: `<button id="antes">antes</button><form ucamSiteNewsletter heading="x" state="error" message="Falhou."></form>` })
class NasceEmErro {}

describe('newsletter', () => {
  it('o campo é obrigatório e tem nome: o navegador barra o envio vazio e diz por quê', () => {
    const campo = monta(Assinatura).el.querySelector('input')!;
    expect(campo.required).toBe(true);
    expect(campo.getAttribute('name')).toBe('email');
    expect(campo.checkValidity()).toBe(false);
  });
  it('só leva o foco ao campo na PASSAGEM para erro, não quando já nasce em erro', async () => {
    const nasce = monta(NasceEmErro);
    (nasce.el.querySelector('#antes') as HTMLElement).focus();
    await nasce.f.whenStable();
    expect(document.activeElement).toBe(nasce.el.querySelector('#antes'));
    expect(nasce.el.querySelector('input')!.getAttribute('aria-invalid')).toBe('true');

    const { f, el, c } = monta(Assinatura);
    c.estado.set('error');
    f.detectChanges();
    await f.whenStable();
    expect(document.activeElement).toBe(el.querySelector('input'));
  });
});

/* ---- I6: o menu do cabeçalho ------------------------------------------------ */
@Component({
  imports: [UcamSiteHeader],
  template: `<header ucamSiteHeader brand="CENPRE" [items]="itens"></header><a id="depois" href="/x">depois</a>`,
})
class Cabecalho { readonly itens = [{ label: 'Vagas', href: '/vagas' }, { label: 'Empresas', href: '/empresas' }]; }

const esc = (alvo: EventTarget) => {
  const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  alvo.dispatchEvent(ev);
  return ev;
};

describe('menu do cabeçalho', () => {
  it('Esc só é do menu quando o foco está dentro dele', () => {
    const { el } = monta(Cabecalho);
    const menu = el.querySelector('details')!;
    const foco = vi.spyOn(menu.querySelector('summary')!, 'focus');
    menu.open = true;
    // Foco fora, menu aberto: a tecla não é do cabeçalho, e ele não puxa o foco.
    esc(el.querySelector('#depois')!);
    expect(menu.open).toBe(true);
    expect(foco).not.toHaveBeenCalled();
    // Foco dentro: fecha e devolve o foco ao botão.
    esc(menu.querySelector('a')!);
    expect(menu.open).toBe(false);
    expect(foco).toHaveBeenCalledTimes(1);
  });
  it('Esc dentro do menu aberto não chega a quem escuta acima; com o menu fechado, chega', () => {
    const { el } = monta(Cabecalho);
    const menu = el.querySelector('details')!;
    let noDocumento = 0;
    const ouvinte = () => noDocumento++;
    document.addEventListener('keydown', ouvinte);
    try {
      menu.open = true;
      esc(menu.querySelector('a')!);
      expect(noDocumento).toBe(0);
      esc(menu.querySelector('summary')!);
      expect(noDocumento).toBe(1);
    } finally {
      document.removeEventListener('keydown', ouvinte);
    }
  });
  it('sair do menu pelo Tab o fecha: o painel não fica por cima do que recebeu o foco', () => {
    const { el } = monta(Cabecalho);
    const menu = el.querySelector('details')!;
    menu.open = true;
    const ultimo = [...menu.querySelectorAll('a')].at(-1)!;
    // Foco que vai de um link do menu para outro: continua aberto.
    ultimo.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: menu.querySelector('a') }));
    expect(menu.open).toBe(true);
    // Foco que sai para fora: fecha.
    ultimo.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: el.querySelector('#depois') }));
    expect(menu.open).toBe(false);
    // Foco que some (clique no vazio, outra janela): não fecha por isso.
    menu.open = true;
    ultimo.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    expect(menu.open).toBe(true);
  });
});

/* ---- o portão: id repetido ---------------------------------------------------- */
describe('paridade', () => {
  it('id repetido reprova, mesmo que os dois lados o repitam igual', () => {
    const repetido = '<label for="a">x</label><input id="a"><p id="a">y</p>';
    const r = mesmaArvore(repetido, repetido);
    expect(r.igual).toBe(false);
    expect(r.diferenca).toContain('id repetido');
  });
});
