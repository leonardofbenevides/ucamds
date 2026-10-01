import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EntradaPage } from './entrada';
import { CandidatoStore } from '../../core/store/candidato.store';
import { candidatoFake } from '../../core/store/candidato.store.spec';

describe('EntradaPage', () => {
  async function montar(
    situacao: 'CADASTRADO' | 'PROVA_FINALIZADA' | 'PROVA_CORRIGIDA' = 'CADASTRADO',
    tentativas = { tentativaAtual: 1, totalTentativasPossiveis: 3 },
  ) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [EntradaPage], providers: [provideRouter([])] }).compileComponents();
    const store = TestBed.inject(CandidatoStore);
    store.definir(candidatoFake({ situacao }), 'fip-1');
    store.tentativas.set(tentativas);
    const f = TestBed.createComponent(EntradaPage);
    await f.whenStable();
    return f.nativeElement as HTMLElement;
  }

  it('mostra os dados em lista de descrição e um h1 só', async () => {
    const el = await montar();
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(el.textContent).toContain('Ana Souza');
    expect(el.textContent).toContain('123.456.789-01');
    expect(el.textContent).toContain('Engenharia de software');
    expect(el.textContent).toContain('Noturno');
  });

  it('a ação nomeia o destino', async () => {
    expect((await montar('CADASTRADO')).querySelector('ucam-button')?.textContent).toContain('Entrar na prova');
    expect((await montar('PROVA_FINALIZADA')).querySelector('ucam-button')?.textContent).toContain('Ver resultado');
  });

  it('sem tentativas, explica e desabilita', async () => {
    const el = await montar('PROVA_CORRIGIDA', { tentativaAtual: 3, totalTentativasPossiveis: 3 });
    expect(el.querySelector('ucam-alert')?.textContent).toContain('3 tentativas');
    expect(el.querySelector('ucam-button button')?.matches('[disabled],[aria-disabled="true"]')).toBe(true);
  });
});
