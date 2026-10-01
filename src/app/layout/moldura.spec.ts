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
    const itens = [...el.querySelectorAll('nav a')].map((a) => a.textContent?.replace(/\s+/g, ' ').trim());
    expect(itens.join(' | ')).toContain('Seus dados');
    expect(itens.join(' | ')).toContain('Prova objetiva');
    expect(itens.join(' | ')).toContain('Redação');
    expect(itens.join(' | ')).toContain('Resultado');
    const atual = el.querySelector('nav a[aria-current="page"]');
    expect(atual?.textContent).toContain('Prova objetiva');
    expect(atual?.textContent).toContain('1');
  });

  it('etapas que a situação não permite ficam desabilitadas', async () => {
    const el = await montar('CADASTRADO');
    const prova = [...el.querySelectorAll('nav a')].find((a) => a.textContent?.includes('Prova objetiva'))!;
    expect(prova.getAttribute('aria-disabled')).toBe('true');
    const dados = [...el.querySelectorAll('nav a')].find((a) => a.textContent?.includes('Seus dados'))!;
    expect(dados.getAttribute('aria-disabled')).toBeNull();
  });

  it('mostra quem é o candidato e a unidade na moldura', async () => {
    const el = await montar('CADASTRADO');
    expect(el.textContent).toContain('Ana Souza');
    expect(el.textContent).toContain('Engenharia de software');
    expect(el.textContent).toContain('Campos');
  });
});
