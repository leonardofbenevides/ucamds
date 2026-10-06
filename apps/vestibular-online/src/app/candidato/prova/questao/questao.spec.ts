import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { QuestaoPage } from './questao';
import { ProvaStore } from '../../../core/store/prova.store';
import { CandidatoStore } from '../../../core/store/candidato.store';
import { candidatoFake } from '../../../core/store/candidato.fake';
import { ProvaPage } from '../prova';

const alt = (oid: string, html: string) => ({ oid, descricao: html });
const cadernos = [
  {
    oid: 'c1',
    tipoprova: 'PORTUGUES',
    questoes: [
      {
        oid: 'p1',
        descricao: '<p>Enunciado 1</p>',
        textoreferencia: '<p>Texto base</p>',
        alternativas: [alt('a', '<em>um</em>'), alt('b', 'dois'), alt('c', 'três'), alt('d', 'quatro'), alt('e', 'cinco')],
      },
      { oid: 'p2', descricao: '<p>Enunciado 2</p>', alternativas: [alt('f', 'x'), alt('g', 'y')] },
    ],
  },
];

describe('QuestaoPage', () => {
  const pedirEntrega = signal<'manual' | 'tempo' | null>(null);
  let store: ProvaStore;

  async function montar(caderno = 'portugues', n = 1) {
    TestBed.resetTestingModule();
    pedirEntrega.set(null);
    await TestBed.configureTestingModule({
      imports: [QuestaoPage],
      providers: [provideRouter([]), { provide: ProvaPage, useValue: { pedirEntrega } }],
    }).compileComponents();
    TestBed.inject(CandidatoStore).definir(candidatoFake({ situacao: 'PROVA_INICIADA' }), 'fip-1');
    store = TestBed.inject(ProvaStore);
    store.cadernos.set(cadernos);
    store.respostas.set({});
    store.estado.set('pronto');
    vi.spyOn(store, 'responder').mockResolvedValue();
    const f = TestBed.createComponent(QuestaoPage);
    f.componentRef.setInput('caderno', caderno);
    f.componentRef.setInput('n', n);
    await f.whenStable();
    return f;
  }

  it('mostra caderno, número, enunciado em HTML e cinco alternativas com letra', async () => {
    const f = await montar();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('h2')?.textContent).toContain('Português · Questão 1 de 2');
    expect(el.querySelector('[data-enunciado] p')?.textContent).toBe('Enunciado 1');
    const labels = el.querySelectorAll('label.ucam-choice-card');
    expect(labels).toHaveLength(5);
    expect(labels[0].textContent).toContain('A');
    expect(labels[0].querySelector('em')?.textContent).toBe('um');
    expect(el.querySelectorAll('input[type=radio][name="questao-p1"]')).toHaveLength(5);
  });

  it('grava ao escolher e marca a alternativa', async () => {
    const f = await montar();
    const radio = f.nativeElement.querySelector('input[value="b"]') as HTMLInputElement;
    radio.click();
    await f.whenStable();
    expect(store.responder).toHaveBeenCalledWith('p1', 'b');
  });

  it('a alternativa escolhida não leva check: check ao lado de resposta de prova lê como "certa"', async () => {
    const f = await montar();
    (f.nativeElement.querySelector('input[value="b"]') as HTMLInputElement).click();
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('.ucam-choice-card__marca')).toBeNull();
    expect(el.querySelector('fieldset ucam-icon')).toBeNull();
    // A letra continua lá: é ela que a folha de estilo preenche na escolhida.
    expect(el.querySelectorAll('.ucam-choice-card__figura')).toHaveLength(5);
  });

  it('anterior fica desabilitada na primeira, com o motivo; próxima navega', async () => {
    const f = await montar();
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const botoes = f.nativeElement.querySelectorAll('ucam-button');
    expect(botoes[0].querySelector('button')?.matches('[disabled],[aria-disabled="true"]')).toBe(true);
    expect(f.nativeElement.textContent).toContain('primeira questão');
    f.componentInstance.proxima();
    expect(nav).toHaveBeenCalledWith(['/candidato', 'fip-1', 'prova', 'portugues', 2]);
  });

  it('ao chegar numa questão o foco vai ao título dela, e a troca diz a direção', async () => {
    const f = await montar();
    const el = f.nativeElement as HTMLElement;
    expect(document.activeElement).toBe(el.querySelector('h2'));
    expect(el.querySelector('article')?.getAttribute('data-entrada')).toBe('frente');

    f.componentRef.setInput('n', 2);
    await f.whenStable();
    expect(el.querySelector('h2')?.textContent).toContain('Questão 2 de 2');
    expect(document.activeElement).toBe(el.querySelector('h2'));

    f.componentRef.setInput('n', 1);
    await f.whenStable();
    expect(el.querySelector('article')?.getAttribute('data-entrada')).toBe('tras');
    expect(document.activeElement).toBe(el.querySelector('h2'));
  });

  it('anuncia a alternativa marcada por status, sem repetir ao trocar de questão', async () => {
    const f = await montar();
    const el = f.nativeElement as HTMLElement;
    const status = el.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent?.trim()).toBe('');
    (el.querySelector('input[value="b"]') as HTMLInputElement).click();
    await f.whenStable();
    expect(status.textContent).toContain('Alternativa B marcada');
    f.componentRef.setInput('n', 2);
    await f.whenStable();
    expect((el.querySelector('[role="status"]') as HTMLElement).textContent?.trim()).toBe('');
  });

  it('marca e desmarca a questão para revisar por um botão de alternância, anunciando', async () => {
    const f = await montar();
    const el = f.nativeElement as HTMLElement;
    const alternar = el.querySelector('button[aria-pressed]') as HTMLButtonElement;
    expect(alternar.getAttribute('aria-pressed')).toBe('false');
    expect(alternar.textContent).toContain('Marcar para revisar');
    alternar.click();
    await f.whenStable();
    expect(alternar.getAttribute('aria-pressed')).toBe('true');
    expect(store.revisar()['p1']).toBe(true);
    expect(el.querySelector('[role="status"]')?.textContent).toContain('marcada para revisar');
    alternar.click();
    await f.whenStable();
    expect(alternar.getAttribute('aria-pressed')).toBe('false');
    expect(store.revisar()['p1']).toBeUndefined();
    expect(el.querySelector('[role="status"]')?.textContent).toContain('retirada');
  });

  it('as setas do teclado andam entre as questões, mas não quando o foco está numa alternativa', async () => {
    const f = await montar('portugues', 1);
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(navegar).toHaveBeenCalledWith(['/candidato', 'fip-1', 'prova', 'portugues', 2]);
    navegar.mockClear();
    // Na primeira questão não há para onde voltar.
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(navegar).not.toHaveBeenCalled();
    // Dentro do grupo de alternativas a seta é do radio: troca a alternativa, não a questão.
    const radio = (f.nativeElement as HTMLElement).querySelector('input[type=radio]')!;
    radio.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(navegar).not.toHaveBeenCalled();
  });

  it('a seta para a direita não entrega a prova: na última questão ela não faz nada', async () => {
    await montar('portugues', 2);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(pedirEntrega()).toBeNull();
  });

  it('na última questão a ação vira Entregar prova', async () => {
    const f = await montar('portugues', 2);
    expect(f.nativeElement.textContent).toContain('Entregar prova');
    f.componentInstance.proxima();
    expect(pedirEntrega()).toBe('manual');
  });
});
