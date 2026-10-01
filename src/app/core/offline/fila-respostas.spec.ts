import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { FilaRespostas } from './fila-respostas';
import { ProvaApi } from '../api/prova.api';

describe('FilaRespostas', () => {
  const responder = vi.fn();
  let fila: FilaRespostas;

  beforeEach(() => {
    localStorage.clear();
    responder.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: ProvaApi, useValue: { responder } }] });
    fila = TestBed.inject(FilaRespostas);
    fila.carregar('cp-1');
  });

  const corpo = { oidQuestao: 'q1', oidAlternativa: 'a1', respostaTextual: null };

  it('envia na hora quando a rede responde', async () => {
    responder.mockReturnValue(of({}));
    expect(await fila.enviar('cp-1', corpo)).toBe('enviada');
    expect(fila.pendentes()).toHaveLength(0);
    expect(fila.estado()).toBe('salvo');
  });

  it('enfileira em falha e persiste no localStorage', async () => {
    responder.mockReturnValue(throwError(() => new Error('rede')));
    expect(await fila.enviar('cp-1', corpo)).toBe('pendente');
    expect(fila.pendentes()).toHaveLength(1);
    expect(fila.estado()).toBe('pendente');
    expect(JSON.parse(localStorage.getItem('fila:cp-1')!)).toHaveLength(1);
  });

  it('substitui a resposta pendente da mesma questão', async () => {
    responder.mockReturnValue(throwError(() => new Error('rede')));
    await fila.enviar('cp-1', corpo);
    await fila.enviar('cp-1', { ...corpo, oidAlternativa: 'a3' });
    expect(fila.pendentes()).toHaveLength(1);
    expect(fila.pendentes()[0].oidAlternativa).toBe('a3');
  });

  it('envios da mesma questão são serializados: a última escolha é a que fica', async () => {
    let resolverA!: () => void;
    responder
      .mockReturnValueOnce(new Observable((s) => { resolverA = () => { s.next({}); s.complete(); }; }))
      .mockReturnValueOnce(throwError(() => new Error('rede')));
    const a = fila.enviar('cp-1', corpo);
    const b = fila.enviar('cp-1', { ...corpo, oidAlternativa: 'a9' });
    await new Promise((r) => setTimeout(r, 0)); // A entra em voo
    resolverA();
    await Promise.all([a, b]);
    expect(fila.pendentes()).toHaveLength(1);
    expect(fila.pendentes()[0].oidAlternativa).toBe('a9');
    expect(responder.mock.calls[1][1].oidAlternativa).toBe('a9');
  });

  it('recusa do servidor não é "sem conexão": não enfileira e vira erro', async () => {
    responder.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400, statusText: 'Bad Request' })));
    expect(await fila.enviar('cp-1', corpo)).toBe('erro');
    expect(fila.pendentes()).toHaveLength(0);
    expect(fila.estado()).toBe('erro');
    expect(fila.ultimoErro()).toContain('q1');
  });

  it('com pendência, tenta reenviar a cada 30 s', async () => {
    vi.useFakeTimers();
    responder.mockReturnValueOnce(throwError(() => new Error('rede')));
    await fila.enviar('cp-1', corpo);
    responder.mockReturnValue(of({}));
    fila.iniciarReenvioPeriodico('cp-1');
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fila.pendentes()).toHaveLength(0);
    fila.pararReenvioPeriodico();
    vi.useRealTimers();
  });

  it('reenvia o que ficou pendente e devolve quantas restam', async () => {
    responder.mockReturnValueOnce(throwError(() => new Error('rede')));
    await fila.enviar('cp-1', corpo);
    responder.mockReturnValue(of({}));
    expect(await fila.reenviar('cp-1')).toBe(0);
    expect(fila.estado()).toBe('salvo');
  });
});
