import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ProvaPage } from './prova';
import { ProvaApi } from '../../core/api/prova.api';
import { CandidatoStore } from '../../core/store/candidato.store';
import { RelogioProva } from '../../core/tempo/relogio-prova';
import { candidatoFake } from '../../core/store/candidato.fake';

describe('ProvaPage', () => {
  const api = {
    tempoMaximo: vi.fn(() => of({ tempomaximo: '02:00:00' })),
    cadernos: vi.fn(() => of([{ oid: 'c1', tipoprova: 'PORTUGUES', questoes: [{ oid: 'p1', descricao: '', alternativas: [] }] }])),
    resposta: vi.fn(() => of(null)),
    responder: vi.fn(() => of({})),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProvaPage],
      providers: [provideRouter([]), { provide: ProvaApi, useValue: api }],
    }).compileComponents();
    TestBed.inject(CandidatoStore).definir(
      candidatoFake({ situacao: 'PROVA_INICIADA', horarioinicio: new Date(Date.now() - 60_000).toISOString() }),
      'fip-1',
    );
  });
  afterEach(() => TestBed.inject(RelogioProva).parar());

  it('mostra as instruções dentro da prova, sem abrir outra aba', async () => {
    const f = TestBed.createComponent(ProvaPage);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('a[target="_blank"]')).toBeNull();
    expect(el.querySelector('button[aria-label="Como a prova funciona"]')).not.toBeNull();
    el.querySelector<HTMLButtonElement>('button[aria-label="Como a prova funciona"]')!.click();
    await f.whenStable();
    // A gaveta do DS abre em overlay no body, fora do fixture.
    expect(document.body.textContent).toContain('Tudo salvo na hora');
  });

  it('um relógio esgotado de uma prova anterior não entrega esta', async () => {
    const relogio = TestBed.inject(RelogioProva);
    relogio.iniciar(new Date(Date.now() - 10 * 3_600_000), 3_600_000);
    expect(relogio.esgotado()).toBe(true);
    relogio.parar();
    const f = TestBed.createComponent(ProvaPage);
    await f.whenStable();
    expect(f.componentInstance.pedirEntrega()).toBeNull();
  });
});
