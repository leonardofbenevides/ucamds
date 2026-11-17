import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamAppShell, type UcamNavGroup } from './ucam-app-shell';

/* Ramo na navegação (17/11/2026): Etapas e Tabelas do SigFin. */
@Component({
  imports: [UcamAppShell],
  template: `<ucam-app-shell systemName="SigFin" [navGroups]="nav"><p>conteúdo</p></ucam-app-shell>`,
})
class Host {
  readonly nav: UcamNavGroup[] = [
    {
      label: 'Cadastros',
      items: [
        { label: 'Etapas', icon: 'listChecks', items: [{ label: 'Cálculo em lote', href: '#c' }] },
        { label: 'Tabelas', icon: 'landmark', items: [{ label: 'Convênios', href: '#v', current: true }, { label: 'Bancos e agências', href: '#b' }] },
      ],
    },
  ];
}

async function montar() {
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const f = TestBed.createComponent(Host);
  await f.whenStable();
  return f;
}
const ramo = (el: HTMLElement, nome: string) =>
  [...el.querySelectorAll<HTMLButtonElement>('button[aria-controls]')].find((b) => b.textContent?.includes(nome))!;

describe('UcamAppShell — ramo', () => {
  it('o ramo com a página atual nasce aberto; o outro, fechado', async () => {
    const el = (await montar()).nativeElement as HTMLElement;
    expect(ramo(el, 'Tabelas').getAttribute('aria-expanded')).toBe('true');
    expect(ramo(el, 'Etapas').getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('a[aria-current="page"]')?.textContent?.trim()).toBe('Convênios');
  });

  it('clicar abre a lista que o aria-controls aponta', async () => {
    const f = await montar();
    const el = f.nativeElement as HTMLElement;
    const b = ramo(el, 'Etapas');
    const lista = el.querySelector('#' + b.getAttribute('aria-controls'))!;
    expect(lista.classList.contains('hidden')).toBe(true);
    b.click();
    await f.whenStable();
    expect(b.getAttribute('aria-expanded')).toBe('true');
    expect(lista.classList.contains('flex')).toBe(true);
  });
});
