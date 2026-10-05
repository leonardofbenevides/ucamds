import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { InstrucoesPage } from './instrucoes';
import { ProvaApi } from '../../core/api/prova.api';
import { CandidatoStore } from '../../core/store/candidato.store';
import { candidatoFake } from '../../core/store/candidato.fake';

describe('InstrucoesPage', () => {
  const q = (oid: string) => ({ oid, descricao: '', alternativas: [] });
  const api = {
    iniciar: vi.fn(() => of(candidatoFake({ situacao: 'PROVA_INICIADA' }))),
    tempoMaximo: vi.fn(() => of({ tempomaximo: '02:00:00' })),
    cadernos: vi.fn(() =>
      of([
        { oid: 'c1', tipoprova: 'PORTUGUES', questoes: [q('p1'), q('p2'), q('p3')] },
        { oid: 'c2', tipoprova: 'MATEMATICA', questoes: [q('m1'), q('m2')] },
        { oid: 'c3', tipoprova: 'REDACAO', questoes: [q('r1')] },
      ]),
    ),
  };

  beforeEach(async () => {
    api.iniciar.mockClear();
    await TestBed.configureTestingModule({
      imports: [InstrucoesPage],
      providers: [provideRouter([]), { provide: ProvaApi, useValue: api }],
    }).compileComponents();
    TestBed.inject(CandidatoStore).definir(candidatoFake(), 'fip-1');
  });

  it('resume a prova em indicadores: tempo, questões objetivas e redação', async () => {
    const f = TestBed.createComponent(InstrucoesPage);
    await f.whenStable();
    const t = f.nativeElement.textContent as string;
    expect(t).toContain('2 h');
    expect(t).toContain('5');
    expect(t).toContain('Português, Matemática');
    expect(t).toContain('Redação');
    expect(f.nativeElement.querySelectorAll('ucam-stat')).toHaveLength(3);
    expect(f.nativeElement.querySelector('ucam-stepper')).not.toBeNull();
  });

  it('sem a confirmação de leitura, não inicia e aponta o erro na própria caixa', async () => {
    const f = TestBed.createComponent(InstrucoesPage);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Marque a confirmação');
    await f.componentInstance.iniciar();
    await f.whenStable();
    expect(api.iniciar).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Marque a confirmação para começar a prova');
    expect(f.componentInstance.faltaConfirmar()).toBe(true);
  });

  it('inicia e vai para a prova', async () => {
    const f = TestBed.createComponent(InstrucoesPage);
    await f.whenStable();
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    f.componentInstance.confirmado.set(true);
    await f.componentInstance.iniciar();
    expect(api.iniciar).toHaveBeenCalledWith('cp-1');
    expect(nav).toHaveBeenCalledWith(['/candidato', 'fip-1', 'prova']);
  });
});
