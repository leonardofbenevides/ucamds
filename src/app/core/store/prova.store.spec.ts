import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ProvaStore } from './prova.store';
import { ProvaApi } from '../api/prova.api';
import { FilaRespostas } from '../offline/fila-respostas';

const q = (oid: string) => ({
  oid,
  descricao: `<p>${oid}</p>`,
  alternativas: [
    { oid: `${oid}-a`, descricao: 'A' },
    { oid: `${oid}-b`, descricao: 'B' },
  ],
});
const cadernos = [
  { oid: 'c1', tipoprova: 'PORTUGUES', questoes: [q('p1'), q('p2')] },
  { oid: 'c2', tipoprova: 'MATEMATICA', questoes: [q('m1')] },
  { oid: 'c3', tipoprova: 'REDACAO', questoes: [{ oid: 'r1', descricao: 'Tema', alternativas: [] }] },
];

describe('ProvaStore', () => {
  const api = { cadernos: vi.fn(() => of(cadernos)), resposta: vi.fn() };
  const fila = { enviar: vi.fn(async () => 'enviada' as const), carregar: vi.fn() };
  let store: ProvaStore;

  beforeEach(async () => {
    api.resposta.mockImplementation((oid: string) =>
      of(
        oid === 'p2'
          ? { oidAlternativa: 'p2-b', respostaTextual: null }
          : oid === 'r1'
            ? { oidAlternativa: null, respostaTextual: 'texto salvo' }
            : null,
      ),
    );
    TestBed.configureTestingModule({
      providers: [
        { provide: ProvaApi, useValue: api },
        { provide: FilaRespostas, useValue: fila },
      ],
    });
    store = TestBed.inject(ProvaStore);
    await store.carregar('cp-1');
  });

  it('separa objetivas de redação e carrega as respostas existentes', () => {
    expect(store.estado()).toBe('pronto');
    expect(store.objetivos().map((c) => c.tipoprova)).toEqual(['PORTUGUES', 'MATEMATICA']);
    expect(store.redacao()?.tipoprova).toBe('REDACAO');
    expect(store.totalObjetivas()).toBe(3);
    expect(store.respondidas()).toBe(1);
    expect(store.textoRedacao()).toBe('texto salvo');
  });

  it('navega entre cadernos e termina na redação', () => {
    store.definirPosicao('portugues', 2);
    expect(store.questaoAtual()?.oid).toBe('p2');
    expect(store.proxima()).toEqual({ slug: 'matematica', n: 1 });
    store.definirPosicao('matematica', 1);
    expect(store.proxima()).toBe('redacao');
    expect(store.anterior()).toEqual({ slug: 'portugues', n: 2 });
    store.definirPosicao('portugues', 1);
    expect(store.anterior()).toBeNull();
  });

  it('lista as em branco com número global e acha a primeira', () => {
    expect(store.emBranco().map((e) => e.numeroGlobal)).toEqual([1, 3]);
    expect(store.primeiraEmBranco()).toEqual({ slug: 'portugues', n: 1 });
  });

  it('responder marca localmente e manda para a fila', async () => {
    await store.responder('p1', 'p1-a');
    expect(store.respostas()['p1']).toBe('p1-a');
    expect(store.respondidas()).toBe(2);
    expect(fila.enviar).toHaveBeenCalledWith('cp-1', { oidQuestao: 'p1', oidAlternativa: 'p1-a', respostaTextual: null });
  });

  it('conta caracteres não brancos da redação', async () => {
    await store.salvarRedacao('abc de  f\n');
    expect(store.caracteresRedacao()).toBe(6);
    expect(store.redacaoAtingeMinimo()).toBe(false);
    await store.salvarRedacao('x'.repeat(300));
    expect(store.redacaoAtingeMinimo()).toBe(true);
  });
});
