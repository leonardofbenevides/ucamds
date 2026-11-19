import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { provideRouter } from '@angular/router';

import { UcamPageHeader } from '../page-header/ucam-page-header';
import { UcamAppShell, type UcamShellLayout } from './ucam-app-shell';
/**
 * O que o app-shell passou a entregar em 29/09/2026: os três arranjos
 * (appbar, rail, lateral) e o seletor de campus (context/contextOptions).
 * Teste de fumaça — a tela monta, o arranjo chega ao host e o campus vira
 * seletor só com mais de uma opção.
 */
@Component({
  imports: [UcamAppShell],
  template: `
    <ucam-app-shell systemName="Gerencial" [shellLayout]="layout()" [(context)]="campus" [contextOptions]="opcoes()">
      <nav ucamShellRail aria-label="Módulos"><a href="#" aria-label="Protocolo">P</a></nav>
      <p>conteúdo</p>
    </ucam-app-shell>
  `,
})
class Hospedeiro {
  readonly layout = signal<UcamShellLayout>('appbar');
  readonly campus = signal<string | null>('rio');
  readonly opcoes = signal([{ value: 'rio', label: 'Rio de Janeiro' }, { value: 'campos', label: 'Campos' }]);
}

describe('UcamAppShell — arranjos e campus', () => {
  async function monta(layout: UcamShellLayout, umaOpcao = false) {
    await TestBed.configureTestingModule({ imports: [Hospedeiro], providers: [provideRouter([])] }).compileComponents();
    const fx = TestBed.createComponent(Hospedeiro);
    fx.componentInstance.layout.set(layout);
    if (umaOpcao) fx.componentInstance.opcoes.set([{ value: 'rio', label: 'Rio de Janeiro' }]);
    fx.detectChanges();
    await fx.whenStable();
    return { fx, el: fx.nativeElement as HTMLElement };
  }

  for (const layout of ['appbar', 'rail', 'lateral'] as UcamShellLayout[]) {
    it(`monta no arranjo ${layout} e o escreve no host`, async () => {
      const { el } = await monta(layout);
      const host = el.querySelector('ucam-app-shell')!;
      expect(host.getAttribute('data-layout')).toBe(layout);
      expect(el.textContent).toContain('conteúdo');
    });
  }

  it('com mais de uma unidade, o campus é um seletor', async () => {
    const { el } = await monta('appbar');
    expect(el.querySelector('ucam-app-shell ucam-select')).toBeTruthy();
  });

  it('com uma unidade só, o campus é texto', async () => {
    const { el } = await monta('lateral', true);
    expect(el.querySelector('ucam-app-shell ucam-select')).toBeNull();
    expect(el.textContent).toContain('Rio de Janeiro');
  });

  it('no rail, os módulos da aplicação entram pelo slot', async () => {
    const { el } = await monta('rail');
    expect(el.querySelector('[aria-label="Protocolo"]')).toBeTruthy();
  });
});


@Component({
  imports: [UcamAppShell, UcamPageHeader],
  template: `
    <ucam-app-shell systemName="Vestibular Online" systemCategory="pessoas">
      <ucam-page-header variante="barra" title="Redações" />
    </ucam-app-shell>
  `,
})
class Host {}

describe('UcamAppShell — a faixa de marca e o que gruda sob ela', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    el = f.nativeElement;
  });

  it('a faixa de marca pinta o texto com text-on-brand, que é claro nos dois temas', () => {
    // text-on-action vira tinta ESCURA no tema escuro (a ação fica clara), e
    // sobre a superfície de marca, que continua escura, o nome do sistema some.
    const faixa = el.querySelector('ucam-app-shell > div > header')!;
    expect(faixa.className).toContain('text-[var(--ucam-color-text-on-brand)]');
    expect(faixa.className).not.toContain('text-on-action');
  });

  it('declara o degrau da faixa para o que gruda dentro do conteúdo', () => {
    const shell = el.querySelector<HTMLElement>('ucam-app-shell')!;
    expect(shell.style.getPropertyValue('--ucam-sticky-top')).toBe('var(--ucam-appbar-height)');
  });

  it('a barra de visão do cabeçalho de página gruda abaixo desse degrau, não em zero', () => {
    const barra = el.querySelector('ucam-page-header')!;
    expect(barra.className).toContain('top-[var(--ucam-sticky-top,0px)]');
    expect(barra.className.split(/\s+/)).not.toContain('top-0');
  });
});

describe('UcamAppShell — a subpaleta chega ao que a base monta fora do shell', () => {
  it('carimba data-sistema no contêiner de overlay do CDK, onde gaveta, menu e select são montados', async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const container = TestBed.inject(OverlayContainer).getContainerElement();
    expect(container.getAttribute('data-sistema')).toBe('pessoas');
  });
});

/**
 * O que entrou em 05/10/2026, pela prova de paridade de tela (ADR-058): busca
 * global, sino, menu da conta, recolher, ação do módulo e Favoritos.
 */
@Component({
  imports: [UcamAppShell],
  template: `
    <ucam-app-shell
      systemName="Protocolo"
      [user]="{ name: 'Leonardo F. Benevides' }"
      [searchable]="busca()"
      searchLabel="Buscar requerimento"
      searchShortcut="/"
      [(searchQuery)]="texto"
      [notifications]="naoLidas()"
      [navAction]="{ label: 'Novo requerimento' }"
      [favorites]="favoritos()"
      [navGroups]="[{ label: 'Trabalho', items: [{ label: 'Caixa de entrada', count: 9, href: '#' }] }]"
      (unpin)="desfixado.set($event.label)"
      (signOut)="saiu.set(true)"
      (navActionClick)="acionou.set(true)"
    />
  `,
})
class Completo {
  readonly busca = signal(true);
  readonly texto = signal('');
  readonly naoLidas = signal<number | null>(7);
  readonly favoritos = signal([{ label: 'Urgentes', href: '#' }]);
  readonly desfixado = signal('');
  readonly saiu = signal(false);
  readonly acionou = signal(false);
}

describe('UcamAppShell — busca, sino, conta, recolher, ação e favoritos', () => {
  async function monta() {
    localStorage.removeItem('ucam-nav-recolhida');
    await TestBed.configureTestingModule({ imports: [Completo] }).compileComponents();
    const fx = TestBed.createComponent(Completo);
    fx.detectChanges();
    await fx.whenStable();
    return { fx, el: fx.nativeElement as HTMLElement, c: fx.componentInstance };
  }
  const botao = (el: ParentNode, nome: string) =>
    [...el.querySelectorAll<HTMLElement>('button')].find((b) =>
      ((b.getAttribute('aria-label') ?? '') + b.textContent).includes(nome),
    )!;

  it('a busca só existe quando a aplicação declara que há o que buscar', async () => {
    const { fx, el, c } = await monta();
    expect(el.querySelector('header input[type=search]')).toBeTruthy();
    c.busca.set(false);
    fx.detectChanges();
    expect(el.querySelector('header input[type=search]')).toBeNull();
  });

  it('o campo tem nome, anuncia o atalho e devolve o texto a cada tecla', async () => {
    const { fx, el, c } = await monta();
    const campo = el.querySelector<HTMLInputElement>('header input[type=search]')!;
    expect(el.querySelector(`label[for="${campo.id}"]`)?.textContent).toContain('Buscar requerimento');
    expect(campo.getAttribute('aria-keyshortcuts')).toBe('/');
    campo.value = 'boleto';
    campo.dispatchEvent(new Event('input'));
    fx.detectChanges();
    expect(c.texto()).toBe('boleto');
  });

  it('a tecla do atalho leva o foco ao campo, e não rouba a barra de quem está digitando', async () => {
    const { fx, el } = await monta();
    document.body.appendChild(el);
    const campo = el.querySelector<HTMLInputElement>('header input[type=search]')!;
    const dentro = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
    campo.dispatchEvent(dentro);
    expect(dentro.defaultPrevented).toBe(false);
    const fora = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
    document.body.dispatchEvent(fora);
    expect(fora.defaultPrevented).toBe(true);
    await new Promise((r) => setTimeout(r));
    fx.detectChanges();
    expect(document.activeElement).toBe(campo);
    el.remove();
  });

  it('o sino diz a contagem no nome; com zero fica sem selo e com null não existe', async () => {
    const { fx, el, c } = await monta();
    expect(botao(el, 'Notificações').textContent).toContain('7 não lidas');
    c.naoLidas.set(0);
    fx.detectChanges();
    expect(botao(el, 'Notificações').textContent).not.toContain('não lidas');
    c.naoLidas.set(null);
    fx.detectChanges();
    expect(botao(el, 'Notificações')).toBeUndefined();
  });

  it('o menu da conta guarda o nome por extenso e o Sair, que emite signOut', async () => {
    const { fx, el, c } = await monta();
    botao(el, 'Conta de Leonardo F. Benevides').click();
    fx.detectChanges();
    const menu = TestBed.inject(OverlayContainer).getContainerElement().querySelector('[role=menu]')!;
    expect(menu.textContent).toContain('Leonardo F. Benevides');
    [...menu.querySelectorAll<HTMLElement>('[role=menuitem]')].find((i) => i.textContent?.includes('Sair'))!.click();
    expect(c.saiu()).toBe(true);
  });

  it('recolher troca aria-expanded e tira o rótulo da vista, não do nome', async () => {
    const { fx, el } = await monta();
    const nav = el.querySelector('nav')!;
    const recolher = botao(nav, 'Recolher navegação');
    expect(recolher.getAttribute('aria-expanded')).toBe('true');
    recolher.click();
    fx.detectChanges();
    expect(recolher.getAttribute('aria-expanded')).toBe('false');
    expect(recolher.getAttribute('aria-label')).toBe('Expandir navegação');
    expect(nav.hasAttribute('data-recolhida')).toBe(true);
    const item = [...nav.querySelectorAll('a')].find((a) => a.textContent?.includes('Caixa de entrada'))!;
    expect(item.querySelector('span')!.className).toContain('sr-only');
    expect(item.textContent).toContain('9');
    localStorage.removeItem('ucam-nav-recolhida');
  });

  it('a ação do módulo sem destino é botão e emite', async () => {
    const { el, c } = await monta();
    botao(el.querySelector('nav')!, 'Novo requerimento').click();
    expect(c.acionou()).toBe(true);
  });

  it('favoritos: o desfixar fica ao lado do link, nunca dentro, e emite o item', async () => {
    const { fx, el, c } = await monta();
    const nav = el.querySelector('nav')!;
    const desfixar = botao(nav, 'Remover Urgentes dos favoritos');
    expect(desfixar.closest('a')).toBeNull();
    desfixar.click();
    expect(c.desfixado()).toBe('Urgentes');
    c.favoritos.set([]);
    fx.detectChanges();
    expect(botao(nav, 'Favoritos')).toBeUndefined();
  });
});
