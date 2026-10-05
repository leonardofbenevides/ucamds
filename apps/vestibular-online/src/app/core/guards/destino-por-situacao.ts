import { CandidatoProva } from '../model/candidato';

export type Tela = 'entrada' | 'instrucoes' | 'prova' | 'resultado';

const PERMITIDAS: Record<CandidatoProva['situacao'], Tela[]> = {
  CADASTRADO: ['entrada', 'instrucoes'],
  PROVA_INICIADA: ['prova'],
  PROVA_FINALIZADA: ['entrada', 'resultado'],
  PROVA_CORRIGIDA: ['entrada', 'resultado'],
};
const PADRAO: Record<CandidatoProva['situacao'], Tela> = {
  CADASTRADO: 'entrada',
  PROVA_INICIADA: 'prova',
  PROVA_FINALIZADA: 'resultado',
  PROVA_CORRIGIDA: 'resultado',
};

/** Se a situação deixa a pessoa entrar nessa tela. A mesma tabela do guarda, para a navegação não prometer o que ele nega. */
export function telaPermitida(situacao: CandidatoProva['situacao'] | null, tela: Tela): boolean {
  return (PERMITIDAS[situacao ?? 'CADASTRADO'] ?? ['entrada']).includes(tela);
}

/** Que tela a situação do candidato permite: 'ok' fica, 'externo' sai do app, senão vai para a tela devolvida. */
export function destinoPorSituacao(c: CandidatoProva, tela: Tela): 'ok' | 'externo' | Tela {
  if (c.situacao === 'PROVA_CORRIGIDA' && ['APROVADO', 'MATRICULADO'].includes(c.formaingressopessoa.situacao)) {
    return 'externo';
  }
  const permitidas = PERMITIDAS[c.situacao] ?? ['entrada'];
  return permitidas.includes(tela) ? 'ok' : (PADRAO[c.situacao] ?? 'entrada');
}
