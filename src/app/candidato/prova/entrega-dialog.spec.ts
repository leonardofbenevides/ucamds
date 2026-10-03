import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { EntregaDialog } from './entrega-dialog';
import { ProvaStore } from '../../core/store/prova.store';
import { FilaRespostas } from '../../core/offline/fila-respostas';
import { ProvaApi } from '../../core/api/prova.api';
import { CandidatoStore } from '../../core/store/candidato.store';
import { candidatoFake } from '../../core/store/candidato.fake';

describe('EntregaDialog', () => {
  const api = { entregar: vi.fn(() => of({})) };
  const fila = { reenviar: vi.fn(async () => 0), pendentes: () => [] };

  async function montar(modo: 'manual' | 'tempo', respostas: Record<string, string> = {}, entregar = of({})) {
    TestBed.resetTestingModule();
    api.entregar.mockReset().mockReturnValue(entregar);
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
    expect(f.nativeElement.textContent).toContain('Português 1, Português 3');
    expect(f.nativeElement.textContent).toContain('Revisar');
  });

  it('nomeia as marcadas para revisar e, sem em branco, Revisar vai à primeira marcada', async () => {
    const f = await montar('manual', { p1: 'x', p2: 'x', p3: 'x' });
    TestBed.inject(ProvaStore).alternarRevisar('p3');
    await f.whenStable();
    const t = f.nativeElement.textContent as string;
    expect(t).not.toContain('em branco');
    expect(t).toContain('1 questão está marcada para revisar');
    expect(t).toContain('Português 3');
    const emitidos: unknown[] = [];
    f.componentInstance.revisar.subscribe((p) => emitidos.push(p));
    f.componentInstance.revisarAgora();
    expect(emitidos).toEqual([{ slug: 'portugues', n: 3 }]);
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

  it('com tempo esgotado e entrega falhando, tenta uma vez e espera o botão', async () => {
    const f = await montar('tempo', {}, throwError(() => new Error('rede')));
    await f.whenStable();
    await new Promise((r) => setTimeout(r, 300));
    await f.whenStable();
    expect(api.entregar).toHaveBeenCalledTimes(1);
    expect(f.nativeElement.textContent).toContain('Tentar de novo');
  });

  it('sem o mínimo da redação, a ação do diálogo é ir escrevê-la, e nada é entregue', async () => {
    const f = await montar('manual', { p1: 'a', p2: 'b', p3: 'c' });
    const store = TestBed.inject(ProvaStore);
    store.cadernos.update((c) => [...c, { oid: 'c3', tipoprova: 'REDACAO', questoes: [{ oid: 'r1', descricao: '', alternativas: [] }] }]);
    await f.whenStable();
    const texto = f.nativeElement.textContent as string;
    expect(texto).toContain('A redação ainda não tem o mínimo');
    expect(texto).toContain('Ir para a redação');
    expect(texto).not.toContain('Entregar prova');

    const destinos: unknown[] = [];
    f.componentInstance.revisar.subscribe((p) => destinos.push(p));
    f.componentInstance.irParaRedacao();
    expect(destinos).toEqual(['redacao']);

    await f.componentInstance.entregar();
    expect(api.entregar).not.toHaveBeenCalled();
  });

  it('lista as em branco pelo caderno e pelo número que o mapa mostra', async () => {
    const f = await montar('manual', { p2: 'x' });
    expect(f.nativeElement.textContent).toContain('Português 1, Português 3');
  });

  it('descarrega o texto da redação antes de entregar', async () => {
    const f = await montar('manual', { p1: 'a', p2: 'b', p3: 'c' });
    const store = TestBed.inject(ProvaStore);
    const descarregar = vi.spyOn(store, 'descarregarRedacao').mockResolvedValue();
    await f.componentInstance.entregar();
    expect(descarregar).toHaveBeenCalled();
    expect(descarregar.mock.invocationCallOrder[0]).toBeLessThan(api.entregar.mock.invocationCallOrder[0]);
  });
});
