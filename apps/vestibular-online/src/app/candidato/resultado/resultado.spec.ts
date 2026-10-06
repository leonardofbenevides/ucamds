import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ResultadoPage } from './resultado';
import { ProvaApi } from '../../core/api/prova.api';
import { CandidatoApi } from '../../core/api/candidato.api';
import { CandidatoStore } from '../../core/store/candidato.store';
import { Navegador } from '../../core/navegador';
import { candidatoFake } from '../../core/store/candidato.fake';

describe('ResultadoPage', () => {
  const prova = { tiposProva: vi.fn(), corrigirObjetiva: vi.fn(), desempenho: vi.fn() };
  const cand = {
    dados: vi.fn(() => of({ horarioinicio: '2026-10-01T10:00:00Z', horariofim: '2026-10-01T11:15:30Z' })),
    buscar: vi.fn(),
  };
  const navegador = { irParaExterno: vi.fn() };

  /** O candidato como o servidor o devolve depois de a banca corrigir. */
  function corrigido(inscricao: 'APROVADO' | 'REPROVADO') {
    const c = candidatoFake({ situacao: 'PROVA_CORRIGIDA' });
    return { ...c, formaingressopessoa: { ...c.formaingressopessoa, situacao: inscricao } };
  }

  async function montar(
    tipos: string[],
    correcao = 'REPROVADO',
    tentativas = { tentativaAtual: 1, totalTentativasPossiveis: 3 },
    candidato = candidatoFake({ situacao: 'PROVA_FINALIZADA' }),
    desempenho: unknown = null,
  ) {
    TestBed.resetTestingModule();
    prova.tiposProva.mockReset().mockReturnValue(of(tipos));
    prova.corrigirObjetiva.mockReset().mockReturnValue(of(correcao));
    prova.desempenho.mockReset().mockReturnValue(of(desempenho));
    cand.buscar.mockReset().mockReturnValue(of(candidato));
    await TestBed.configureTestingModule({
      imports: [ResultadoPage],
      providers: [
        provideRouter([]),
        { provide: ProvaApi, useValue: prova },
        { provide: CandidatoApi, useValue: cand },
        { provide: Navegador, useValue: navegador },
      ],
    }).compileComponents();
    const store = TestBed.inject(CandidatoStore);
    store.definir(candidato, 'fip-1');
    store.tentativas.set(tentativas);
    const f = TestBed.createComponent(ResultadoPage);
    await f.whenStable();
    return f.nativeElement as HTMLElement;
  }

  async function clicar(el: HTMLElement, rotulo: string) {
    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes(rotulo))!.click();
    await TestBed.inject(ApplicationRef).whenStable();
  }

  it('com redação, diz que aguarda correção e leva ao site', async () => {
    const el = await montar(['PORTUGUES', 'REDACAO']);
    expect(el.textContent).toContain('correção da banca');
    expect(el.textContent).toContain('Ir para o site');
    expect(el.textContent).toContain('1 h 15 min');
    expect(prova.corrigirObjetiva).not.toHaveBeenCalled();
  });

  it('com redação já corrigida pela banca, mostra o resultado em vez da espera', async () => {
    const el = await montar(['PORTUGUES', 'REDACAO'], 'REPROVADO', undefined, corrigido('REPROVADO'));
    expect(el.textContent).not.toContain('correção da banca');
    expect(el.querySelector('ucam-badge')?.textContent).toContain('Reprovado');
    expect(el.textContent).toContain('Tentar novamente');
    expect(prova.corrigirObjetiva).not.toHaveBeenCalled();
  });

  it('na espera, "Ver se já saiu" consulta de novo e mostra o resultado quando a banca terminou', async () => {
    const el = await montar(['PORTUGUES', 'REDACAO']);
    cand.buscar.mockReturnValue(of(corrigido('APROVADO')));
    await clicar(el, 'Ver se já saiu');
    expect(cand.buscar).toHaveBeenCalledWith('fip-1');
    expect(el.querySelector('ucam-badge')?.textContent).toContain('Aprovado');
    expect(el.textContent).toContain('Concluir matrícula');
  });

  it('na espera, se a banca ainda não terminou, diz quando foi a última consulta', async () => {
    const el = await montar(['PORTUGUES', 'REDACAO']);
    await clicar(el, 'Ver se já saiu');
    expect(el.textContent).toContain('ainda não terminou');
    expect(el.textContent).toContain('correção da banca');
  });

  it('sem redação, corrige na hora: aprovado leva à matrícula', async () => {
    const el = await montar(['PORTUGUES'], 'APROVADO');
    expect(el.querySelector('ucam-badge')?.textContent).toContain('Aprovado');
    expect(el.textContent).toContain('Concluir matrícula');
  });

  it('aprovado: a notícia vem primeiro, numa celebração com o nome, o curso e o próximo passo', async () => {
    const el = await montar(['PORTUGUES'], 'APROVADO');
    const festa = el.querySelector('.ucam-celebracao');
    expect(festa).toBeTruthy();
    expect(festa!.textContent).toContain('Parabéns, Ana');
    expect(festa!.textContent).toContain('Você passou no vestibular');
    expect(festa!.textContent).toContain('Engenharia de software');
    // O confete é enfeite: fora da árvore de acessibilidade.
    expect(festa!.querySelector('.ucam-celebracao__confete')?.getAttribute('aria-hidden')).toBe('true');
    await clicar(el, 'Concluir matrícula');
    expect(navegador.irParaExterno).toHaveBeenCalled();
  });

  it('aprovado: o comprovante se imprime da própria tela', async () => {
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const el = await montar(['PORTUGUES'], 'APROVADO');
    await clicar(el, 'Imprimir comprovante');
    expect(imprimir).toHaveBeenCalled();
    imprimir.mockRestore();
  });

  it('com o desempenho que o servidor entrega, mostra os acertos, o aproveitamento, cada caderno e a nota da redação', async () => {
    const el = await montar(['PORTUGUES', 'MATEMATICA', 'REDACAO'], 'APROVADO', undefined, corrigido('APROVADO'), {
      cadernos: [
        { tipoprova: 'PORTUGUES', acertos: 3, total: 3 },
        { tipoprova: 'MATEMATICA', acertos: 1, total: 2 },
      ],
      notaRedacao: 8,
    });
    const texto = el.textContent!.replace(/\s+/g, ' ');
    expect(texto).toContain('Acertos na objetiva');
    expect(texto).toContain('4 de 5');
    expect(texto).toContain('80% de aproveitamento');
    const cadernos = el.querySelector('[data-por-caderno]')!.textContent!.replace(/\s+/g, ' ');
    expect(cadernos).toContain('Português');
    expect(cadernos).toContain('3 de 3');
    expect(cadernos).toContain('Matemática');
    expect(cadernos).toContain('1 de 2');
    expect(texto).toContain('8,0');
  });

  it('sem o desempenho (o backend de hoje só diz aprovado ou reprovado), não inventa número', async () => {
    const el = await montar(['PORTUGUES'], 'APROVADO');
    expect(el.textContent).not.toContain('Acertos na objetiva');
    expect(el.querySelector('[data-por-caderno]')).toBeNull();
  });

  it('reprovado com tentativa oferece tentar de novo, em tom neutro', async () => {
    const el = await montar(['PORTUGUES'], 'REPROVADO');
    expect(el.querySelector('ucam-badge')?.textContent).toContain('Reprovado');
    expect(el.querySelector('ucam-badge')?.getAttribute('data-tone')).toBe('neutral');
    expect(el.textContent).toContain('Tentar novamente');
  });

  it('reprovado sem tentativa explica e leva ao site', async () => {
    const el = await montar(['PORTUGUES'], 'REPROVADO', { tentativaAtual: 3, totalTentativasPossiveis: 3 });
    expect(el.textContent).toContain('usou as 3 tentativas');
    expect(el.textContent).not.toContain('Tentar novamente');
  });
});
