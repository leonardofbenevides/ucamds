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

  it('diz o estado de cada questão em forma, não só em cor, e explica a legenda', async () => {
    const f = TestBed.createComponent(MapaQuestoes);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    const botoes = el.querySelectorAll('button[data-questao]');
    expect(botoes[0].getAttribute('data-estado')).toBe('em-branco');
    expect(botoes[1].getAttribute('data-estado')).toBe('respondida');
    const legenda = el.querySelector('[data-legenda]');
    expect(legenda?.textContent).toContain('respondida');
    expect(legenda?.textContent).toContain('em branco');
  });

  it('a marcada para revisar leva a marca no desenho e no nome, e a legenda explica', async () => {
    const store = TestBed.inject(ProvaStore);
    store.revisar.set({ p1: true });
    const f = TestBed.createComponent(MapaQuestoes);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    const botoes = el.querySelectorAll('button[data-questao]');
    expect(botoes[0].getAttribute('data-revisar')).toBe('true');
    expect(botoes[0].getAttribute('aria-label')).toBe('Questão 1, em branco, marcada para revisar');
    expect(botoes[1].hasAttribute('data-revisar')).toBe(false);
    expect(el.querySelector('[data-legenda]')?.textContent).toContain('para revisar');

    // Sem em branco, o atalho passa a levar à próxima marcada.
    store.respostas.set({ p1: 'x', p2: 'x' });
    await f.whenStable();
    const emitidos: unknown[] = [];
    f.componentInstance.navegar.subscribe((p) => emitidos.push(p));
    (el.querySelector('[data-proxima-marcada] button') as HTMLButtonElement).click();
    expect(emitidos).toEqual([{ slug: 'portugues', n: 1 }]);
  });

  it('oferece ir à próxima em branco enquanto houver alguma', async () => {
    const f = TestBed.createComponent(MapaQuestoes);
    await f.whenStable();
    const emitidos: unknown[] = [];
    f.componentInstance.navegar.subscribe((p) => emitidos.push(p));
    const atalho = f.nativeElement.querySelector('[data-proxima-em-branco] button') as HTMLButtonElement;
    expect(atalho).not.toBeNull();
    atalho.click();
    expect(emitidos).toEqual([{ slug: 'portugues', n: 1 }]);

    TestBed.inject(ProvaStore).respostas.set({ p1: 'x', p2: 'x' });
    await f.whenStable();
    expect(f.nativeElement.querySelector('[data-proxima-em-branco]')).toBeNull();
  });

  it("a redação é um item do mapa com o mesmo desenho: estado em forma e em palavra, atual quando aberta", async () => {
    const store = TestBed.inject(ProvaStore);
    const f = TestBed.createComponent(MapaQuestoes);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    const item = el.querySelector("button[data-redacao]") as HTMLButtonElement;
    expect(item).not.toBeNull();
    expect(item.getAttribute("data-estado")).toBe("em-branco");
    expect(item.getAttribute("aria-label")).toBe("Redação, em branco");
    expect(item.hasAttribute("aria-current")).toBe(false);
    expect(el.querySelector("[data-grupo]")?.textContent).toContain("Português");

    store.posicao.set(null);
    await f.whenStable();
    expect(item.getAttribute("aria-current")).toBe("page");
    const emitidos: unknown[] = [];
    f.componentInstance.navegar.subscribe((p) => emitidos.push(p));
    item.click();
    expect(emitidos).toEqual(["redacao"]);
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
