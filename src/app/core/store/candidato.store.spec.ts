import { TestBed } from '@angular/core/testing';
import { CandidatoStore } from './candidato.store';
import { candidatoFake } from './candidato.fake';

describe('CandidatoStore', () => {
  let store: CandidatoStore;
  beforeEach(() => (store = TestBed.inject(CandidatoStore)));

  it('expõe os dados da entrada em caixa natural', () => {
    store.definir(candidatoFake(), 'fip-1');
    expect(store.nome()).toBe('Ana Souza');
    expect(store.cpf()).toBe('123.456.789-01');
    expect(store.curso()).toBe('Engenharia de software');
    expect(store.turno()).toBe('Noturno');
    expect(store.oidCandidatoProva()).toBe('cp-1');
  });

  it('diz se pode tentar de novo', () => {
    store.tentativas.set({ tentativaAtual: 1, totalTentativasPossiveis: 3 });
    expect(store.podeTentarDeNovo()).toBe(true);
    store.tentativas.set({ tentativaAtual: 3, totalTentativasPossiveis: 3 });
    expect(store.podeTentarDeNovo()).toBe(false);
  });

  it('classifica a unidade e monta a URL do site', () => {
    store.definir(candidatoFake(), 'fip-1');
    expect(store.tipoUnidade()).toBe('PRESENCIAL');
    expect(store.urlSite()).toBe('https://eupossoestudarnacandido.com.br/campos');
    const c = candidatoFake();
    c.formaingressopessoa.periodounidadecurso.unidadecurso.unidade = { oid: 'polo19', sigla: 'Polo Niterói' };
    store.definir(c, 'fip-1');
    expect(store.tipoUnidade()).toBe('EAD');
  });
});
