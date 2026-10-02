import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamPageHeader } from '../page-header/ucam-page-header';
import { UcamAppShell } from './ucam-app-shell';

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
