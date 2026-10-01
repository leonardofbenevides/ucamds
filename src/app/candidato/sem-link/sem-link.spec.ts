import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { SemLinkPage } from './sem-link';

describe('SemLinkPage', () => {
  async function montar() {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [SemLinkPage], providers: [provideRouter([])] }).compileComponents();
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const f = TestBed.createComponent(SemLinkPage);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    const digitar = async (texto: string) => {
      const input = el.querySelector('input')!;
      input.value = texto;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await f.whenStable();
    };
    const entrar = async () => {
      const botao = [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Entrar')!;
      botao.click();
      await f.whenStable();
    };
    return { el, navegar, digitar, entrar };
  }

  it('explica como chegar à prova', async () => {
    const { el } = await montar();
    expect(el.textContent).toContain('link');
    expect(el.textContent).toContain('secretaria');
  });

  it('com o link colado inteiro, entra pelo código do fim e leva a tentativa junto', async () => {
    const { navegar, digitar, entrar } = await montar();
    await digitar('https://vestibular.candidomendes.edu.br/vestibularonline/abc-123?tentativa=2');
    await entrar();
    expect(navegar).toHaveBeenCalledWith(['/candidato', 'abc-123'], { queryParams: { tentativa: '2' } });
  });

  it('só com o código também entra', async () => {
    const { navegar, digitar, entrar } = await montar();
    await digitar('  abc-123 ');
    await entrar();
    expect(navegar).toHaveBeenCalledWith(['/candidato', 'abc-123'], { queryParams: {} });
  });

  it('vazio, pede o link e não sai do lugar — o botão nunca desabilita', async () => {
    const { el, navegar, entrar } = await montar();
    await entrar();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Cole o link');
    expect(navegar).not.toHaveBeenCalled();
  });

  it('a moldura de entrada declara o sistema, para a ação sair na cor do sub-app e não no bordô', async () => {
    const { el } = await montar();
    expect(el.querySelector('.ucam-shell')?.getAttribute('data-sistema')).toBe('academico');
  });

  it('no protótipo, os candidatos de teste são atalhos', async () => {
    const { el } = await montar();
    expect(el.textContent).toContain('Ana Souza');
    expect(el.querySelector('a[href="/candidato/ana"]')).not.toBeNull();
  });
});
