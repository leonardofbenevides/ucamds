import { CandidatoProva } from '../model/candidato';

/**
 * Candidato de apoio para os specs. Mora fora de qualquer `.spec.ts` de
 * propósito: spec que importa spec faz o Vitest carregar o arquivo importado
 * pelo cache do importador, e os `describe` dele deixam de ser registrados no
 * próprio arquivo ("No test suite found") conforme a ordem dos workers.
 */
export function candidatoFake(extra: Partial<CandidatoProva> = {}): CandidatoProva {
  return {
    oid: 'cp-1',
    situacao: 'CADASTRADO',
    formaingressopessoa: {
      oid: 'fip-1',
      situacao: 'INSCRITO',
      pessoa: { oid: 'p-1', nome: 'Ana Souza', cpf: { numero: '12345678901' } },
      periodounidadecurso: {
        turnoLabel: 'N',
        unidadecurso: {
          curso: { nome: 'ENGENHARIA DE SOFTWARE' },
          unidade: { oid: 'unid01', sigla: 'Campos', nome: 'Campos' },
        },
      },
    },
    ...extra,
  };
}
