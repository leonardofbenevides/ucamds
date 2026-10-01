import { TestBed } from '@angular/core/testing';
import { MapaQuestoes } from './mapa-questoes';
import { ProvaStore } from '../../core/store/prova.store';

describe('MapaQuestoes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MapaQuestoes] }).compileComponents();
    const store = TestBed.inject(ProvaStore);
    store.cadernos.set([
      {
        oid: 'c1',
        tipoprova: 'PORTUGUES',
        questoes: [
          { oid: 'p1', descricao: '', alternativas: [] },
          { oid: 'p2', descricao: '', alternativas: [] },
        ],
      },
      { oid: 'c3', tipoprova: 'REDACAO', questoes: [{ oid: 'r1', descricao: '', alternativas: [] }] },
    ]);
    store.respostas.set({ p2: 'x' });
    store.definirPosicao('portugues', 1);
  });

  it('nomeia cada botão com o estado e marca a atual', async () => {
    const f = TestBed.createComponent(MapaQuestoes);
    await f.whenStable();
    const botoes = f.nativeElement.querySelectorAll('button[data-questao]') as NodeListOf<HTMLButtonElement>;
    expect(botoes).toHaveLength(2);
    expect(botoes[0].getAttribute('aria-label')).toBe('Questão 1, em branco');
    expect(botoes[0].getAttribute('aria-current')).toBe('page');
    expect(botoes[1].getAttribute('aria-label')).toBe('Questão 2, respondida');
    expect(f.nativeElement.textContent).toContain('1 de 2');
    expect(f.nativeElement.textContent).toContain('Redação');
  });

  it('emite a posição ao clicar', async () => {
    const f = TestBed.createComponent(MapaQuestoes);
    await f.whenStable();
    const emitidos: unknown[] = [];
    f.componentInstance.navegar.subscribe((p) => emitidos.push(p));
    (f.nativeElement.querySelectorAll('button[data-questao]')[1] as HTMLButtonElement).click();
    expect(emitidos).toEqual([{ slug: 'portugues', n: 2 }]);
  });
});
