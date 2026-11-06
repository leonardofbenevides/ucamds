import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UcamSalvamento, type UcamSalvamentoEstado } from './ucam-salvamento';

@Component({
  imports: [UcamSalvamento],
  template: `<ucam-salvamento [estado]="estado()" [pendentes]="pendentes()" [mensagem]="mensagem()" />`,
})
class Host {
  readonly estado = signal<UcamSalvamentoEstado>('salvo');
  readonly pendentes = signal<number | null>(null);
  readonly mensagem = signal<string | null>(null);
}

describe('UcamSalvamento (salvamento.json)', () => {
  async function montar() {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    const raiz = () => el.querySelector('p.ucam-salvamento')!;
    return {
      f,
      raiz,
      visivel: () => raiz().querySelector('span[aria-hidden="true"]')!.textContent!.trim(),
      anuncio: () => raiz().querySelector('.sr-only')!.textContent!.trim(),
      passar: async (e: UcamSalvamentoEstado, extra: { pendentes?: number; mensagem?: string } = {}) => {
        f.componentInstance.estado.set(e);
        if (extra.pendentes !== undefined) f.componentInstance.pendentes.set(extra.pendentes);
        if (extra.mensagem !== undefined) f.componentInstance.mensagem.set(extra.mensagem);
        await f.whenStable();
      },
    };
  }

  it('a raiz é status e diz o estado em data-estado', async () => {
    const { raiz, visivel } = await montar();
    expect(raiz().getAttribute('role')).toBe('status');
    expect(raiz().getAttribute('data-estado')).toBe('salvo');
    expect(visivel()).toBe('Salvo');
  });

  it('as frases do contrato, com singular e plural', async () => {
    const { passar, visivel } = await montar();
    await passar('salvando');
    expect(visivel()).toBe('Salvando…');
    await passar('pendente', { pendentes: 2 });
    expect(visivel()).toBe('Sem conexão. 2 respostas serão enviadas quando ela voltar.');
    await passar('pendente', { pendentes: 1 });
    expect(visivel()).toBe('Sem conexão. 1 resposta será enviada quando ela voltar.');
    await passar('erro', { mensagem: 'O servidor não aceitou a resposta da questão 7. Escolha a alternativa de novo.' });
    expect(visivel()).toMatch(/^O servidor não aceitou a resposta da questão 7/);
  });

  it('salvando e salvo não são anunciados a cada resposta; o problema e a volta depois dele, sim', async () => {
    const { passar, anuncio } = await montar();
    await passar('salvando');
    await passar('salvo');
    expect(anuncio()).toBe('');
    await passar('pendente', { pendentes: 3 });
    expect(anuncio()).toBe('Sem conexão. 3 respostas serão enviadas quando ela voltar.');
    await passar('salvando');
    expect(anuncio()).toBe('Sem conexão. 3 respostas serão enviadas quando ela voltar.');
    await passar('salvo');
    expect(anuncio()).toBe('Salvo');
  });
});
