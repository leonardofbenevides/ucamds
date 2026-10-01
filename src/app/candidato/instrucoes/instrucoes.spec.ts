import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { InstrucoesPage } from './instrucoes';
import { ProvaApi } from '../../core/api/prova.api';
import { CandidatoStore } from '../../core/store/candidato.store';
import { candidatoFake } from '../../core/store/candidato.store.spec';

describe('InstrucoesPage', () => {
  const api = {
    iniciar: vi.fn(() => of(candidatoFake({ situacao: 'PROVA_INICIADA' }))),
    tempoMaximo: vi.fn(() => of({ tempomaximo: '02:00:00' })),
    cadernos: vi.fn(() =>
      of([
        { oid: 'c1', tipoprova: 'PORTUGUES', questoes: [] },
        { oid: 'c2', tipoprova: 'REDACAO', questoes: [] },
      ]),
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrucoesPage],
      providers: [provideRouter([]), { provide: ProvaApi, useValue: api }],
    }).compileComponents();
    TestBed.inject(CandidatoStore).definir(candidatoFake(), 'fip-1');
  });

  it('resume a prova com tempo, cadernos e redação', async () => {
    const f = TestBed.createComponent(InstrucoesPage);
    await f.whenStable();
    const t = f.nativeElement.textContent;
    expect(t).toContain('2 h');
    expect(t).toContain('Português');
    expect(t).toContain('Redação');
  });

  it('inicia e vai para a prova', async () => {
    const f = TestBed.createComponent(InstrucoesPage);
    await f.whenStable();
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await f.componentInstance.iniciar();
    expect(api.iniciar).toHaveBeenCalledWith('cp-1');
    expect(nav).toHaveBeenCalledWith(['/candidato', 'fip-1', 'prova']);
  });
});
