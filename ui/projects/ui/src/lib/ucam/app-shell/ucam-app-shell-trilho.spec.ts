import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamAppShell, type UcamNavGroup, type UcamSystemLink } from './ucam-app-shell';

/* Trilho de sistemas (ADR-089, 19/11/2026). */
@Component({
  imports: [UcamAppShell],
  template: `<ucam-app-shell systemName="Protocolo" [navGroups]="nav" [systems]="sistemas"><p>conteúdo</p></ucam-app-shell>`,
})
class ComTrilho {
  readonly nav: UcamNavGroup[] = [{ label: 'Cadastros', items: [{ label: 'Naturezas', icon: 'listFilter', href: '#n', current: true }] }];
  readonly sistemas: UcamSystemLink[] = [
    { label: 'Protocolo', icon: 'clipboardList', href: '#p', current: true },
    { label: 'Acadêmico', icon: 'graduationCap' },
  ];
}

@Component({
  imports: [UcamAppShell],
  template: `<ucam-app-shell systemName="Protocolo" [navGroups]="nav"><p>conteúdo</p></ucam-app-shell>`,
})
class SemTrilho {
  readonly nav: UcamNavGroup[] = [{ items: [{ label: 'Naturezas', href: '#n' }] }];
}

async function montar<T>(c: new () => T) {
  await TestBed.configureTestingModule({ imports: [c] }).compileComponents();
  const f = TestBed.createComponent(c);
  await f.whenStable();
  return f.nativeElement as HTMLElement;
}

describe('UcamAppShell — trilho de sistemas', () => {
  it('desenha um <nav> "Sistemas" com o sistema atual marcado e nome em cada item', async () => {
    const el = await montar(ComTrilho);
    const trilho = el.querySelector('nav[aria-label="Sistemas"]')!;
    expect(trilho).toBeTruthy();
    const itens = [...trilho.querySelectorAll('a')];
    expect(itens.map((a) => a.getAttribute('aria-label'))).toEqual(['Protocolo', 'Acadêmico']);
    expect(itens[0].getAttribute('aria-current')).toBe('page');
  });

  it('sistema sem tela não navega e se declara desabilitado', async () => {
    const el = await montar(ComTrilho);
    const sem = el.querySelector('nav[aria-label="Sistemas"] a[aria-label="Acadêmico"]')!;
    expect(sem.hasAttribute('href')).toBe(false);
    expect(sem.getAttribute('aria-disabled')).toBe('true');
    expect(sem.getAttribute('role')).toBe('link');
  });

  it('o item aberto da navegação é neutro, não na cor da ação', async () => {
    const el = await montar(ComTrilho);
    const atual = el.querySelector('a[aria-current="page"][href="#n"]')!;
    expect(atual.className).toContain('text-[var(--ucam-color-text-primary)]');
    expect(atual.className).not.toContain('action-primary');
  });

  it('sem lista de sistemas, não há trilho', async () => {
    const el = await montar(SemTrilho);
    expect(el.querySelector('nav[aria-label="Sistemas"]')).toBeNull();
  });
});
