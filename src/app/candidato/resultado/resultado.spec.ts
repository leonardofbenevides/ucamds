import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ResultadoPage } from './resultado';
import { ProvaApi } from '../../core/api/prova.api';
import { CandidatoApi } from '../../core/api/candidato.api';
import { CandidatoStore } from '../../core/store/candidato.store';
import { Navegador } from '../../core/navegador';
import { candidatoFake } from '../../core/store/candidato.store.spec';

describe('ResultadoPage', () => {
  const prova = { tiposProva: vi.fn(), corrigirObjetiva: vi.fn() };
  const cand = { dados: vi.fn(() => of({ horarioinicio: '2026-10-01T10:00:00Z', horariofim: '2026-10-01T11:15:30Z' })) };
  const navegador = { irParaExterno: vi.fn() };

  async function montar(tipos: string[], correcao = 'REPROVADO', tentativas = { tentativaAtual: 1, totalTentativasPossiveis: 3 }) {
    TestBed.resetTestingModule();
    prova.tiposProva.mockReset().mockReturnValue(of(tipos));
    prova.corrigirObjetiva.mockReset().mockReturnValue(of(correcao));
    await TestBed.configureTestingModule({
      imports: [ResultadoPage],
      providers: [
        provideRouter([]),
        { provide: ProvaApi, useValue: prova },
        { provide: CandidatoApi, useValue: cand },
        { provide: Navegador, useValue: navegador },
      ],
    }).compileComponents();
    const store = TestBed.inject(CandidatoStore);
    store.definir(candidatoFake({ situacao: 'PROVA_FINALIZADA' }), 'fip-1');
    store.tentativas.set(tentativas);
    const f = TestBed.createComponent(ResultadoPage);
    await f.whenStable();
    return f.nativeElement as HTMLElement;
  }

  it('com redação, diz que aguarda correção e leva ao site', async () => {
    const el = await montar(['PORTUGUES', 'REDACAO']);
    expect(el.textContent).toContain('corrigida pela banca');
    expect(el.textContent).toContain('Ir para o site');
    expect(el.textContent).toContain('01:15:30');
    expect(prova.corrigirObjetiva).not.toHaveBeenCalled();
  });

  it('sem redação, corrige na hora: aprovado leva à matrícula', async () => {
    const el = await montar(['PORTUGUES'], 'APROVADO');
    expect(el.querySelector('ucam-badge')?.textContent).toContain('Aprovado');
    expect(el.textContent).toContain('Concluir matrícula');
  });

  it('reprovado com tentativa oferece tentar de novo, em tom neutro', async () => {
    const el = await montar(['PORTUGUES'], 'REPROVADO');
    expect(el.querySelector('ucam-badge')?.textContent).toContain('Reprovado');
    expect(el.querySelector('ucam-badge')?.getAttribute('data-tone')).toBe('neutral');
    expect(el.textContent).toContain('Tentar novamente');
  });

  it('reprovado sem tentativa explica e leva ao site', async () => {
    const el = await montar(['PORTUGUES'], 'REPROVADO', { tentativaAtual: 3, totalTentativasPossiveis: 3 });
    expect(el.textContent).toContain('usou as 3 tentativas');
    expect(el.textContent).not.toContain('Tentar novamente');
  });
});
