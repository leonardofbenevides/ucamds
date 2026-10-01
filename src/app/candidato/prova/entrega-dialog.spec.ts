import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { EntregaDialog } from './entrega-dialog';
import { ProvaStore } from '../../core/store/prova.store';
import { FilaRespostas } from '../../core/offline/fila-respostas';
import { ProvaApi } from '../../core/api/prova.api';
import { CandidatoStore } from '../../core/store/candidato.store';
import { candidatoFake } from '../../core/store/candidato.store.spec';

describe('EntregaDialog', () => {
  const api = { entregar: vi.fn(() => of({})) };
  const fila = { reenviar: vi.fn(async () => 0), pendentes: () => [] };

  async function montar(modo: 'manual' | 'tempo', respostas: Record<string, string> = {}) {
    TestBed.resetTestingModule();
    api.entregar.mockClear();
    fila.reenviar.mockClear();
    await TestBed.configureTestingModule({
      imports: [EntregaDialog],
      providers: [
        { provide: ProvaApi, useValue: api },
        { provide: FilaRespostas, useValue: fila },
      ],
    }).compileComponents();
    TestBed.inject(CandidatoStore).definir(candidatoFake({ situacao: 'PROVA_INICIADA' }), 'fip-1');
    const store = TestBed.inject(ProvaStore);
    store.cadernos.set([
      {
        oid: 'c1',
        tipoprova: 'PORTUGUES',
        questoes: [
          { oid: 'p1', descricao: '', alternativas: [] },
          { oid: 'p2', descricao: '', alternativas: [] },
          { oid: 'p3', descricao: '', alternativas: [] },
        ],
      },
    ]);
    store.respostas.set(respostas);
    const f = TestBed.createComponent(EntregaDialog);
    f.componentRef.setInput('modo', modo);
    await f.whenStable();
    return f;
  }

  it('nomeia quantas e quais questões estão em branco e oferece revisar', async () => {
    const f = await montar('manual', { p2: 'x' });
    expect(f.nativeElement.textContent).toContain('2 questões estão em branco');
    expect(f.nativeElement.textContent).toContain('1, 3');
    expect(f.nativeElement.textContent).toContain('Revisar');
  });

  it('entrega chama a API e emite entregue', async () => {
    const f = await montar('manual', { p1: 'a', p2: 'b', p3: 'c' });
    let entregue = false;
    f.componentInstance.entregue.subscribe(() => (entregue = true));
    await f.componentInstance.entregar();
    expect(api.entregar).toHaveBeenCalledWith('cp-1');
    expect(entregue).toBe(true);
  });

  it('não entrega com respostas pendentes e explica', async () => {
    fila.reenviar.mockResolvedValueOnce(2);
    const f = await montar('manual');
    await f.componentInstance.entregar();
    await f.whenStable();
    expect(api.entregar).not.toHaveBeenCalled();
    expect(f.nativeElement.textContent).toContain('2 respostas não foram enviadas');
  });

  it('com tempo esgotado entrega sozinho e diz isso', async () => {
    const f = await montar('tempo');
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('O tempo acabou');
    expect(api.entregar).toHaveBeenCalled();
  });
});
