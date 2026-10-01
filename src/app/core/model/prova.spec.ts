import { ehRedacao, rotuloTipoProva, slugTipoProva } from './prova';

describe('tipos de prova', () => {
  it('gera slug de URL', () => {
    expect(slugTipoProva('PORTUGUES')).toBe('portugues');
    expect(slugTipoProva('CONHECIMENTOS_GERAIS')).toBe('conhecimentos-gerais');
    expect(slugTipoProva('REDACAO')).toBe('redacao');
  });
  it('gera rótulo em caixa natural', () => {
    expect(rotuloTipoProva('MATEMATICA')).toBe('Matemática');
    expect(rotuloTipoProva('HISTORIA_GERAL')).toBe('Historia geral');
  });
  it('reconhece redação', () => {
    expect(ehRedacao('REDACAO')).toBe(true);
    expect(ehRedacao('PORTUGUES')).toBe(false);
  });
});
