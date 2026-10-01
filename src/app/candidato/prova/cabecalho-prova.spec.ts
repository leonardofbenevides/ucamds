import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CabecalhoProva } from './cabecalho-prova';
import { RelogioProva } from '../../core/tempo/relogio-prova';
import { FilaRespostas } from '../../core/offline/fila-respostas';
import { ProvaStore } from '../../core/store/prova.store';

const MIN = 60_000;

describe('CabecalhoProva', () => {
  const fila = { estado: signal<'salvo' | 'salvando' | 'pendente'>('salvo'), pendentes: signal([{}, {}, {}]) };

  beforeEach(async () => {
    fila.estado.set('salvo');
    await TestBed.configureTestingModule({
      imports: [CabecalhoProva],
      providers: [{ provide: FilaRespostas, useValue: fila }],
    }).compileComponents();
    // Relógio real (timers falsos travam o whenStable): começou há 29,5 min de 60.
    TestBed.inject(RelogioProva).iniciar(new Date(Date.now() - 29.5 * MIN), 60 * MIN);
    const store = TestBed.inject(ProvaStore);
    store.cadernos.set([{ oid: 'c1', tipoprova: 'PORTUGUES', questoes: [{ oid: 'p1', descricao: '', alternativas: [] }] }]);
  });
  afterEach(() => TestBed.inject(RelogioProva).parar());

  it('mostra o tempo em palavra, a barra com tom e o progresso', async () => {
    const f = TestBed.createComponent(CabecalhoProva);
    await f.whenStable();
    const t = f.nativeElement.textContent as string;
    expect(t).toContain('Faltam 30 min');
    expect(t).toMatch(/00:30:[0-5]\d/);
    expect(t).toContain('0 de 1 respondidas');
    expect(t).toContain('Salvo');
    expect(f.nativeElement.querySelector('ucam-progress')).not.toBeNull();
  });

  it('diz quantas respostas estão pendentes', async () => {
    fila.estado.set('pendente');
    const f = TestBed.createComponent(CabecalhoProva);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('3 respostas serão enviadas');
  });
});
