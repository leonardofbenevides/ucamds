import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { QuestaoPage } from './questao';
import { ProvaStore } from '../../../core/store/prova.store';
import { CandidatoStore } from '../../../core/store/candidato.store';
import { candidatoFake } from '../../../core/store/candidato.store.spec';
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

  it('anterior fica desabilitada na primeira, com o motivo; próxima navega', async () => {
    const f = await montar();
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const botoes = f.nativeElement.querySelectorAll('ucam-button');
    expect(botoes[0].querySelector('button')?.matches('[disabled],[aria-disabled="true"]')).toBe(true);
    expect(f.nativeElement.textContent).toContain('primeira questão');
    f.componentInstance.proxima();
    expect(nav).toHaveBeenCalledWith(['/candidato', 'fip-1', 'prova', 'portugues', 2]);
  });

  it('na última questão a ação vira Entregar prova', async () => {
    const f = await montar('portugues', 2);
    expect(f.nativeElement.textContent).toContain('Entregar prova');
    f.componentInstance.proxima();
    expect(pedirEntrega()).toBe('manual');
  });
});
