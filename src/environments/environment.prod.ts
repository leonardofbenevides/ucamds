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
};
