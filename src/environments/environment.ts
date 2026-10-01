export const environment = {
  production: false,
  backend: 'http://localhost:8030/',
  backendApi: 'http://localhost:8030/vestibularonline/',
  /** Área do inscrito: destino do aprovado, com o CPF no fim. */
  formUrl: 'https://www.candidomendes.edu.br/processo-seletivo/area-do-inscrito',
  siteEad: 'https://ead.candidomendes.edu.br/',
  /** Recebe o slug da sigla da unidade no fim. */
  sitePresencialBase: 'https://eupossoestudarnacandido.com.br/',
  /** Unidade de referência da instalação. unid32 = EAD. */
  unidRef: 'unid01',
  duracaoPadraoMs: 2 * 60 * 60 * 1000,
  redacaoMin: 300,
  redacaoMax: 3000,
  contatoSecretaria: 'secretaria@candidomendes.edu.br',
  /** Atalhos da tela sem link, só no protótipo: os candidatos do backend de mentira (npm run mock). */
  candidatosDeTeste: [
    { oid: 'ana', nome: 'Ana Souza', apoio: 'Objetiva e redação — resultado aguarda a banca' },
    { oid: 'bruno', nome: 'Bruno Lima', apoio: 'Só objetiva — corrige na hora' },
  ],
};
