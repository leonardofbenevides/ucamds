import { destinoPorSituacao } from './destino-por-situacao';
import { candidatoFake } from '../store/candidato.fake';

describe('destinoPorSituacao', () => {
  it('CADASTRADO vê entrada e instruções; prova e resultado voltam à entrada', () => {
    const c = candidatoFake({ situacao: 'CADASTRADO' });
    expect(destinoPorSituacao(c, 'entrada')).toBe('ok');
    expect(destinoPorSituacao(c, 'instrucoes')).toBe('ok');
    expect(destinoPorSituacao(c, 'prova')).toBe('entrada');
    expect(destinoPorSituacao(c, 'resultado')).toBe('entrada');
  });
  it('PROVA_INICIADA só vê a prova', () => {
    const c = candidatoFake({ situacao: 'PROVA_INICIADA' });
    expect(destinoPorSituacao(c, 'prova')).toBe('ok');
    expect(destinoPorSituacao(c, 'entrada')).toBe('prova');
    expect(destinoPorSituacao(c, 'instrucoes')).toBe('prova');
  });
  it('PROVA_FINALIZADA vê entrada e resultado', () => {
    const c = candidatoFake({ situacao: 'PROVA_FINALIZADA' });
    expect(destinoPorSituacao(c, 'resultado')).toBe('ok');
    expect(destinoPorSituacao(c, 'entrada')).toBe('ok');
    expect(destinoPorSituacao(c, 'prova')).toBe('resultado');
  });
  it('PROVA_CORRIGIDA aprovado vai para fora; reprovado vê o resultado', () => {
    const ap = candidatoFake({ situacao: 'PROVA_CORRIGIDA' });
    ap.formaingressopessoa.situacao = 'APROVADO';
    expect(destinoPorSituacao(ap, 'entrada')).toBe('externo');
    const rep = candidatoFake({ situacao: 'PROVA_CORRIGIDA' });
    rep.formaingressopessoa.situacao = 'REPROVADO';
    expect(destinoPorSituacao(rep, 'entrada')).toBe('ok');
    expect(destinoPorSituacao(rep, 'resultado')).toBe('ok');
    expect(destinoPorSituacao(rep, 'prova')).toBe('resultado');
  });
});
