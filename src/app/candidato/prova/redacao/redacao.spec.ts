import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { RedacaoPage } from './redacao';
import { ProvaStore } from '../../../core/store/prova.store';
import { CandidatoStore } from '../../../core/store/candidato.store';
import { candidatoFake } from '../../../core/store/candidato.fake';
import { ProvaPage } from '../prova';

describe('RedacaoPage', () => {
  const pedirEntrega = signal<'manual' | 'tempo' | null>(null);
  let store: ProvaStore;

  beforeEach(() => localStorage.clear());

  async function montar(textoSalvo = '') {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [RedacaoPage],
      providers: [provideRouter([]), { provide: ProvaPage, useValue: { pedirEntrega } }],
    }).compileComponents();
    TestBed.inject(CandidatoStore).definir(candidatoFake({ situacao: 'PROVA_INICIADA' }), 'fip-1');
    store = TestBed.inject(ProvaStore);
    store.cadernos.set([
      { oid: 'c1', tipoprova: 'PORTUGUES', questoes: [{ oid: 'p1', descricao: '', alternativas: [] }] },
      {
        oid: 'c3',
        tipoprova: 'REDACAO',
        questoes: [{ oid: 'r1', descricao: '<p>Tema</p>', textoreferencia: '<p>Apoio</p>', alternativas: [] }],
      },
    ]);
    store.textoRedacao.set(textoSalvo);
    store.estado.set('pronto');
    vi.spyOn(store, 'salvarRedacao').mockImplementation(async (t) => {
      store.textoRedacao.set(t);
    });
    const f = TestBed.createComponent(RedacaoPage);
    await f.whenStable();
    return f;
  }

  it('mostra tema, contador e quanto falta para o mínimo, ignorando espaços', async () => {
    const f = await montar('abc de');
    const t = f.nativeElement.textContent;
    expect(t).toContain('Tema');
    expect(t).toContain('5 de 3.000 caracteres');
    expect(t).toContain('Faltam 295 caracteres para o mínimo');
  });

  it('salva ao sair do campo quando houve mudança', async () => {
    const f = await montar();
    f.componentInstance.texto.set('novo texto');
    f.componentInstance.aoSair();
    expect(store.salvarRedacao).toHaveBeenCalledWith('novo texto');
    f.componentInstance.aoSair();
    expect(store.salvarRedacao).toHaveBeenCalledTimes(1);
  });

  it('bloqueia a entrega abaixo do mínimo com o motivo ao lado', async () => {
    const f = await montar('x'.repeat(299));
    const el = f.nativeElement as HTMLElement;
    const entregar = [...el.querySelectorAll('ucam-button')].find((b) => b.textContent?.includes('Entregar prova'))!;
    expect(entregar.querySelector('button')?.matches('[disabled],[aria-disabled="true"]')).toBe(true);
    expect(el.textContent).toContain('precisa de pelo menos 300 caracteres');
  });

  it('restaura o rascunho local quando o servidor não tem texto', async () => {
    localStorage.setItem('rascunho:cp-1', JSON.stringify({ texto: 'rascunho local', em: Date.now() }));
    const f = await montar('');
    expect(f.componentInstance.texto()).toBe('rascunho local');
  });

  it('o texto do servidor vence o rascunho local quando os dois existem', async () => {
    localStorage.setItem('rascunho:cp-1', JSON.stringify({ texto: 'rascunho local', em: Date.now() }));
    const f = await montar('texto do servidor');
    expect(f.componentInstance.texto()).toBe('texto do servidor');
  });

  it('cada mudança vai para o rascunho do store, e depois da entrega não grava mais', async () => {
    const f = await montar('');
    f.componentInstance.texto.set('digitando');
    await f.whenStable();
    expect(store.rascunhoRedacao()).toBe('digitando');
    store.entregue.set(true);
    f.destroy();
    expect(store.salvarRedacao).not.toHaveBeenCalled();
  });
});
