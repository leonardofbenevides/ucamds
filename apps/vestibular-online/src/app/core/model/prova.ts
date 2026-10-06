export interface Alternativa {
  oid: string;
  descricao: string;
}
export interface Questao {
  oid: string;
  descricao: string;
  textoreferencia?: string | null;
  alternativas: Alternativa[];
}
export interface CadernoProva {
  oid: string;
  tipoprova: string;
  questoes: Questao[];
}
export interface RespostaCandidato {
  oidAlternativa: string | null;
  respostaTextual: string | null;
}
/** Quantas questões de um caderno objetivo a pessoa acertou. */
export interface DesempenhoCaderno {
  tipoprova: string;
  acertos: number;
  total: number;
}
/**
 * O desempenho na prova corrigida. O backend do legado NÃO entrega isto ao
 * candidato — só diz APROVADO ou REPROVADO —; existe aqui para o dia em que
 * entregar, e hoje vem só do backend de mentira (environment.desempenhoProva).
 */
export interface Desempenho {
  cadernos: DesempenhoCaderno[];
  notaRedacao: number | null;
}
/** `tempomaximo` vem como 'HH:MM:SS'. */
export interface TempoMaximo {
  tempomaximo: string;
}

const ROTULOS: Record<string, string> = {
  portugues: 'Português',
  matematica: 'Matemática',
  conhecimentos_gerais: 'Conhecimentos gerais',
  redacao: 'Redação',
};

function chave(tipo: string): string | undefined {
  const t = tipo.toLowerCase();
  return Object.keys(ROTULOS).find((k) => t.includes(k));
}

/** 'CONHECIMENTOS_GERAIS' → 'conhecimentos-gerais' (segmento de URL). */
export function slugTipoProva(tipo: string): string {
  return (chave(tipo) ?? tipo.toLowerCase()).replace(/_/g, '-');
}

/** 'CONHECIMENTOS_GERAIS' → 'Conhecimentos gerais'. Desconhecido: o próprio tipo em caixa natural. */
export function rotuloTipoProva(tipo: string): string {
  const k = chave(tipo);
  if (k) return ROTULOS[k];
  const t = tipo.toLowerCase().replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const ICONES = {
  portugues: 'bookOpen',
  matematica: 'calculator',
  conhecimentos_gerais: 'landmark',
  redacao: 'pencil',
} as const;

/** O desenho que identifica o caderno na questão. Desconhecido: a folha de prova. */
export function iconeTipoProva(tipo: string): (typeof ICONES)[keyof typeof ICONES] | 'fileText' {
  const k = chave(tipo) as keyof typeof ICONES | undefined;
  return k ? ICONES[k] : 'fileText';
}

export function ehRedacao(tipo: string): boolean {
  return /redacao/i.test(tipo);
}
