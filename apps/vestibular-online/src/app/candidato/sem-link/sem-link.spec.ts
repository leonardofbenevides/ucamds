import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { SemLinkPage } from './sem-link';

describe('SemLinkPage', () => {
  async function montar() {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [SemLinkPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const http = TestBed.inject(HttpTestingController);
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
    const atalho = async (oid: string) => {
      (el.querySelector(`a[href="/candidato/${oid}"]`) as HTMLElement).click();
      await f.whenStable();
    };
    return { el, navegar, digitar, entrar, atalho, http };
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

  it('vazio, pede o código e não sai do lugar — o botão nunca desabilita', async () => {
    const { el, navegar, entrar } = await montar();
    await entrar();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Cole o código');
    expect(el.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
    expect(navegar).not.toHaveBeenCalled();
  });

  it('o campo pede o código da inscrição, com rótulo ligado ao controle', async () => {
    const { el } = await montar();
    const input = el.querySelector('input')!;
    expect(el.querySelector(`label[for="${input.id}"]`)?.textContent).toContain('Código da inscrição');
  });

  it('a moldura de entrada declara o sistema, para a ação sair no teal do vestibular e não no bordô', async () => {
    const { el } = await montar();
    expect(el.querySelector('.ucam-shell')?.getAttribute('data-sistema')).toBe('pessoas');
  });

  it('no protótipo, os candidatos de teste são atalhos', async () => {
    const { el } = await montar();
    expect(el.textContent).toContain('Ana Souza');
    expect(el.querySelector('a[href="/candidato/ana"]')).not.toBeNull();
  });

  it('o atalho pede uma prova nova ao backend de mentira e só então entra', async () => {
    const { navegar, atalho, http } = await montar();
    await atalho('ana');
    const pedido = http.expectOne('http://localhost:8030/mock/nova-prova/ana');
    expect(pedido.request.method).toBe('POST');
    expect(navegar).not.toHaveBeenCalled();
    pedido.flush({ reiniciada: true });
    await vi.waitFor(() => expect(navegar).toHaveBeenCalledWith(['/candidato', 'ana']));
  });

  it('se o backend de mentira não responde, o atalho entra do mesmo jeito', async () => {
    const { navegar, atalho, http } = await montar();
    await atalho('bruno');
    http.expectOne('http://localhost:8030/mock/nova-prova/bruno').error(new ProgressEvent('error'));
    await vi.waitFor(() => expect(navegar).toHaveBeenCalledWith(['/candidato', 'bruno']));
  });
});
