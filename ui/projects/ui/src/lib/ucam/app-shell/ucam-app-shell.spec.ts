import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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
