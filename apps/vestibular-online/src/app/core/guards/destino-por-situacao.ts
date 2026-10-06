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
  // Quem já se matriculou não tem mais o que fazer aqui: vai para a área do
  // inscrito, como no legado. O APROVADO que ainda não se matriculou fica: a
  // página de resultado é onde ele vê que passou, o desempenho e o botão da
  // matrícula. Até 06/10/2026 os dois saíam direto, e quem fazia redação e
  // voltava pelo link depois da correção nunca via o resultado da prova.
  if (c.situacao === 'PROVA_CORRIGIDA') {
    if (c.formaingressopessoa.situacao === 'MATRICULADO') return 'externo';
    if (c.formaingressopessoa.situacao === 'APROVADO') return tela === 'resultado' ? 'ok' : 'resultado';
  }
  const permitidas = PERMITIDAS[c.situacao] ?? ['entrada'];
  return permitidas.includes(tela) ? 'ok' : (PADRAO[c.situacao] ?? 'entrada');
}
