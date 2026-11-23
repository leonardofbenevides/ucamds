import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamAppShell, type UcamNavGroup, type UcamSystemLink } from './ucam-app-shell';

/* Painel de apps (ADR-093, 22/11/2026): um ícone na faixa abre a grade. */
@Component({
  imports: [UcamAppShell],
  template: `<ucam-app-shell systemName="Protocolo" [navGroups]="nav" [systems]="sistemas"><p>conteúdo</p></ucam-app-shell>`,
})
class ComSistemas {
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
class SemSistemas {
  readonly nav: UcamNavGroup[] = [{ items: [{ label: 'Naturezas', href: '#n' }] }];
}

async function montar<T>(c: new () => T) {
  await TestBed.configureTestingModule({ imports: [c] }).compileComponents();
  const f = TestBed.createComponent(c);
  await f.whenStable();
  return f;
}
const gatilho = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('header button[aria-label="Trocar de sistema"]');

describe('UcamAppShell — painel de apps', () => {
  it('a faixa tem um ícone só, e nenhuma fileira de sistemas', async () => {
    const el = (await montar(ComSistemas)).nativeElement as HTMLElement;
    expect(gatilho(el)?.getAttribute('aria-haspopup')).toBe('menu');
    expect(el.querySelector('nav[aria-label="Sistemas"]')).toBeNull();
  });

  it('o painel abre em grade, com o atual marcado e o sem tela desabilitado', async () => {
    const f = await montar(ComSistemas);
    gatilho(f.nativeElement)!.click();
    await f.whenStable();
    const painel = document.querySelector('.ucam-menu--apps')!;
    const itens = [...painel.querySelectorAll('[role="menuitem"]')];
    expect(itens.map((i) => i.textContent?.trim())).toEqual(['Protocolo', 'Acadêmico']);
    expect(itens[0].getAttribute('aria-current')).toBe('page');
    expect(itens[1].getAttribute('aria-disabled')).toBe('true');
  });

  it('o item aberto da navegação é neutro, não na cor da ação', async () => {
    const el = (await montar(ComSistemas)).nativeElement as HTMLElement;
    const atual = el.querySelector('a[aria-current="page"][href="#n"]')!;
    expect(atual.className).toContain('text-[var(--ucam-color-text-primary)]');
    expect(atual.className).not.toContain('action-primary');
  });

  it('sem lista de sistemas, não há ícone', async () => {
    const el = (await montar(SemSistemas)).nativeElement as HTMLElement;
    expect(gatilho(el)).toBeNull();
  });
});
