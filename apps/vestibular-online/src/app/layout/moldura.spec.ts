import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Moldura } from './moldura';
import { CandidatoStore } from '../core/store/candidato.store';
import { ProvaStore } from '../core/store/prova.store';
import { candidatoFake } from '../core/store/candidato.fake';

@Component({ imports: [Moldura], template: `<app-moldura><p>conteúdo</p></app-moldura>` })
class Host {}

describe('Moldura', () => {
  async function montar(situacao: 'CADASTRADO' | 'PROVA_INICIADA' | 'PROVA_FINALIZADA', url = '/candidato/fip-1') {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [Host], providers: [provideRouter([])] }).compileComponents();
    TestBed.inject(CandidatoStore).definir(candidatoFake({ situacao }), 'fip-1');
    const prova = TestBed.inject(ProvaStore);
    prova.cadernos.set([
      { oid: 'c1', tipoprova: 'PORTUGUES', questoes: [{ oid: 'p1', descricao: '', alternativas: [] }, { oid: 'p2', descricao: '', alternativas: [] }] },
      { oid: 'c3', tipoprova: 'REDACAO', questoes: [{ oid: 'r1', descricao: '', alternativas: [] }] },
    ]);
    prova.respostas.set({ p1: 'x' });
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue(url);
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    return f.nativeElement as HTMLElement;
  }

  it('a coluna lateral traz as etapas, com a atual marcada e a contagem de respondidas', async () => {
    const el = await montar('PROVA_INICIADA', '/candidato/fip-1/prova/portugues/1');
    const etapas = [...el.querySelectorAll('[data-etapa]')].map((li) => li.textContent?.replace(/\s+/g, ' ').trim());
    expect(etapas.join(' | ')).toContain('Seus dados');
    expect(etapas.join(' | ')).toContain('Prova objetiva');
    expect(etapas.join(' | ')).toContain('Redação');
    expect(etapas.join(' | ')).toContain('Resultado');
    const atual = el.querySelector('[data-etapa] a[aria-current="page"]');
    expect(atual?.textContent).toContain('Prova objetiva');
    expect(atual?.textContent).toContain('1 de 2 respondidas');
  });

  it('etapa futura não é clicável; etapa concluída abre em gaveta', async () => {
    const el = await montar('CADASTRADO');
    // Antes de começar, a prova ainda não é destino: nem link nem botão.
    expect(el.querySelector('[data-etapa="objetiva"]')?.querySelector('a, button')).toBeNull();
    // Os dados já conferidos continuam consultáveis, sem sair da tela.
    expect(el.querySelector('[data-etapa="dados"] button')?.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('mostra quem é o candidato e a unidade na moldura', async () => {
    const el = await montar('CADASTRADO');
    expect(el.textContent).toContain('Ana Souza');
    expect(el.textContent).toContain('Engenharia de software');
    expect(el.textContent).toContain('Campos');
  });
});
