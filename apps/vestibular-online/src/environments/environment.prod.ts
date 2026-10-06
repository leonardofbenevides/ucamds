// Os marcadores DEPLOY_PROCESSO_BACKEND e UNIDADE_REFERENCIA são trocados no
// deploy (replace.sh), como no app legado.
export const environment = {
  production: true,
  backend: 'DEPLOY_PROCESSO_BACKEND/',
  backendApi: 'DEPLOY_PROCESSO_BACKEND/vestibularonline/',
  formUrl: 'https://www.candidomendes.edu.br/processo-seletivo/area-do-inscrito',
  siteEad: 'https://ead.candidomendes.edu.br/',
  sitePresencialBase: 'https://eupossoestudarnacandido.com.br/',
  unidRef: 'UNIDADE_REFERENCIA',
  duracaoPadraoMs: 2 * 60 * 60 * 1000,
  redacaoMin: 300,
  redacaoMax: 3000,
  contatoSecretaria: 'secretaria@candidomendes.edu.br',
  /** Login único da universidade, com o mesmo cliente do app legado: devolve em /admin/login/:token/:usuario. */
  loginUrl: 'https://login.ucam-campos.br/login.jsf?client_id=aplicVestOnline@ucam' as string | null,
  apiGerencial: 'https://api-gerencial.ucam-campos.br',
  /** Em produção a área interna só abre pelo login único. */
  loginDeTeste: null as { token: string; usuario: string } | null,
  /** Em produção ninguém entra por atalho: só pelo link. */
  candidatosDeTeste: [] as { oid: string; nome: string; apoio: string }[],
  /** Em produção quem corrige vem do login, não de um atalho. */
  corretorDeTeste: null as { nome: string; apoio: string } | null,
  isencaoDeTeste: null as { oid: string; nome: string; apoio: string } | null,
  /** Não existe fora do protótipo. */
  mockNovaProva: null as string | null,
  desempenhoProva: null as string | null,
};
