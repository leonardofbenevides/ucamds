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

export function ehRedacao(tipo: string): boolean {
  return /redacao/i.test(tipo);
}
