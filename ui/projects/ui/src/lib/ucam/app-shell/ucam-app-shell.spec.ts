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
