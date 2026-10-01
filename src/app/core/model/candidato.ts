export type SituacaoProva = 'CADASTRADO' | 'PROVA_INICIADA' | 'PROVA_FINALIZADA' | 'PROVA_CORRIGIDA';
export type SituacaoInscricao = 'APROVADO' | 'REPROVADO' | 'MATRICULADO' | (string & {});

export interface Unidade {
  oid: string;
  nome?: string;
  sigla?: string;
  cidade?: string;
  uf?: string;
}

/** O registro `candidatoprova` do backend, no formato em que ele chega. */
export interface CandidatoProva {
  oid: string;
  situacao: SituacaoProva;
  horarioinicio?: string | null;
  horariofim?: string | null;
  formaingressopessoa: {
    oid: string;
    situacao: SituacaoInscricao;
    pessoa: { oid: string; nome: string; cpf: { numero: string } };
    periodounidadecurso: {
      turnoLabel: string;
      unidadecurso: { curso: { nome: string }; unidade: Unidade };
    };
  };
}

export interface Tentativas {
  tentativaAtual: number;
  totalTentativasPossiveis: number;
}

/** Projeção `candidato-inline`: só o que o resultado usa. */
export interface DadosCandidato {
  horarioinicio?: string | null;
  horariofim?: string | null;
}
