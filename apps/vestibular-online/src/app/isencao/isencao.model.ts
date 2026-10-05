/**
 * A isenção de disciplinas como o backend do legado a entrega (`isencao/…`),
 * e os nomes que as telas dão a cada estado. O legado não tipa nada disto:
 * os campos abaixo são os que as telas antigas leem.
 */

export type StatusIsencao = 'PENDENTE_ANALISE' | 'ANALISADO_COM_PENDENCIA' | 'CONCLUIDO' | (string & {});
export type Aceita = 'ACEITO' | 'PENDENTE' | 'RECUSADO' | null;

export interface DisciplinaIsencao {
  oid?: string;
  nome: string;
  /** PENDENTE com motivo nulo é "ainda não avaliada" — é assim que o backend devolve. */
  aceita: Aceita;
  /** O que falta, dito ao candidato. Só em PENDENTE. */
  motivo?: string | null;
  /** Disciplina de origem, instituição e carga horária: o que justifica a isenção. Só em ACEITO. */
  descricao?: string | null;
  ies?: string | null;
  cargaHoraria?: string | null;
}

export interface DocumentoIsencao {
  oid: string;
  descricao: string;
  datacriacao: string;
  filename: string;
}

/** Período (em texto: "1", "2"…) → disciplinas. */
export type Semestres = Record<string, DisciplinaIsencao[]>;

/** O que o candidato recebe em `GET isencao/{oid}`. */
export interface IsencaoCandidato {
  status: StatusIsencao;
  curso: string;
  observacao?: string | null;
  semestres?: Semestres | null;
  documentos?: DocumentoIsencao[] | null;
}

/** O que a secretaria recebe em `GET isencao/{oid}/matrizes/{matriz}` — e devolve inteiro ao avaliar. */
export interface IsencaoAnalise extends IsencaoCandidato {
  nome: string;
  cpf?: string | null;
  telefone?: string[] | null;
  email?: string | null;
  [campo: string]: unknown;
}

export interface MatrizOpcao {
  oidmatriz: string;
  matriz: string;
}

/** Uma linha da fila: `candidates[]` de `analize/courses` e `analized/courses`. */
export interface CandidatoFila {
  nome: string;
  /** Em análise o campo é `situacao`; nas concluídas, `status`. */
  situacao?: StatusIsencao;
  status?: StatusIsencao;
  /** Quantos documentos a pessoa já enviou. */
  documentos?: number;
  telefone?: string | null;
  email?: string | null;
  periodoLetivo?: string | null;
  datasolicitacao?: string | null;
  dataalteracao?: string | null;
  formaIngressoPessoa: string;
  codigomatriz?: string | null;
}

export interface CursoFila {
  nome: string;
  unidade?: string | null;
  candidates: CandidatoFila[];
}

// ---------------------------------------------------------------- situação --

/**
 * Os quatro estados da solicitação, com o mesmo nome dos dois lados do fluxo.
 * "Aguardando envio" não é um status do backend: é PENDENTE_ANALISE sem
 * documento nenhum, como a fila do legado já distinguia.
 */
export type Situacao = 'envio' | 'analise' | 'candidato' | 'concluida';
export type Tom = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export const SITUACOES: Record<Situacao, { label: string; paraOCandidato: string; tone: Tom }> = {
  envio: { label: 'Aguardando envio', paraOCandidato: 'Aguardando seus documentos', tone: 'neutral' },
  analise: { label: 'Aguardando análise', paraOCandidato: 'Em análise', tone: 'info' },
  candidato: { label: 'Aguardando candidato', paraOCandidato: 'Aguardando você', tone: 'warning' },
  concluida: { label: 'Concluída', paraOCandidato: 'Concluída', tone: 'success' },
};

export function situacaoDe(status: StatusIsencao | null | undefined, documentos: number): Situacao {
  if (status === 'CONCLUIDO') return 'concluida';
  if (status === 'ANALISADO_COM_PENDENCIA') return 'candidato';
  return documentos > 0 ? 'analise' : 'envio';
}

// ----------------------------------------------------------------- decisão --

/** A decisão da secretaria sobre uma disciplina. '' é sem decisão. */
export type Decisao = '' | 'isentar' | 'nao' | 'documento';

export function decisaoDe(d: DisciplinaIsencao): Decisao {
  if (d.aceita === 'ACEITO') return 'isentar';
  if (d.aceita === 'RECUSADO') return 'nao';
  return d.aceita === 'PENDENTE' && d.motivo !== null && d.motivo !== undefined ? 'documento' : '';
}

export const DECISOES: Record<Decisao, { label: string; tone: Tom }> = {
  '': { label: 'Sem decisão', tone: 'neutral' },
  isentar: { label: 'Isenta', tone: 'success' },
  nao: { label: 'Não isenta', tone: 'neutral' },
  documento: { label: 'Aguardando documento', tone: 'warning' },
};

/** Como o candidato lê a mesma decisão: o que ainda não foi decidido está "Em análise". */
export function situacaoDaDisciplina(d: DisciplinaIsencao): { label: string; tone: Tom } {
  const decisao = decisaoDe(d);
  return decisao ? DECISOES[decisao] : { label: 'Em análise', tone: 'info' };
}

// ------------------------------------------------------------------ apoio --

export interface DisciplinaNoPeriodo {
  periodo: string;
  disciplina: DisciplinaIsencao;
}

/** As disciplinas em ordem de período, cada uma com o período a que pertence. */
export function disciplinasEmOrdem(semestres: Semestres | null | undefined): DisciplinaNoPeriodo[] {
  return Object.keys(semestres ?? {})
    .sort((a, b) => Number(a) - Number(b))
    .flatMap((periodo) => (semestres![periodo] ?? []).map((disciplina) => ({ periodo, disciplina })));
}

const PARTICULAS = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

/** 'MARCOS VINÍCIUS DE SOUZA' → 'Marcos Vinícius de Souza'. O backend manda o nome em caixa alta. */
export function nomeProprio(nome: string): string {
  return (nome ?? '')
    .toLocaleLowerCase('pt-BR')
    .split(/\s+/)
    .filter(Boolean)
    .map((p, i) => (i > 0 && PARTICULAS.has(p) ? p : p.charAt(0).toLocaleUpperCase('pt-BR') + p.slice(1)))
    .join(' ');
}

export function dataCurta(iso: string | null | undefined): string | null {
  return iso ? new Date(iso).toLocaleDateString('pt-BR') : null;
}
