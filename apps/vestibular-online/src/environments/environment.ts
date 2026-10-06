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
  /**
   * Login único da universidade: para onde vai quem chega à área interna sem
   * sessão; ele devolve em /admin/login/:token/:usuario. Nulo no protótipo,
   * onde quem entra é o perfil de teste (loginDeTeste).
   */
  loginUrl: null as string | null,
  /** O gerencial: de onde vêm o nome e as unidades de quem fez login. No protótipo, o backend de mentira. */
  apiGerencial: 'http://localhost:8030/gerencial',
  /** O token e o usuário que o atalho da área interna usa no lugar do login único. Só no protótipo. */
  loginDeTeste: { token: 'token-de-teste', usuario: 'marta' } as { token: string; usuario: string } | null,
  /** Atalhos da tela sem link, só no protótipo: os candidatos do backend de mentira (npm run mock). */
  candidatosDeTeste: [
    { oid: 'ana', nome: 'Ana Souza', apoio: 'Objetiva e redação — a banca corrige' },
    { oid: 'bruno', nome: 'Bruno Lima', apoio: 'Só objetiva — corrige na hora' },
  ],
  /**
   * Quem corrige, no protótipo: o atalho da tela sem link e o nome na moldura
   * da banca. No legado a banca entra pelo login único da universidade; aqui
   * ainda não há login.
   */
  corretorDeTeste: { nome: 'Marta Reis', apoio: 'Banca e secretaria — redações, isenção e provas' } as { nome: string; apoio: string } | null,
  /** O candidato de teste que acompanha uma isenção de disciplinas: a inscrição `joao` do backend de mentira. */
  isencaoDeTeste: { oid: 'joao', nome: 'João Cutrim', apoio: 'Acompanha a isenção de disciplinas' } as { oid: string; nome: string; apoio: string } | null,
  /** Rota do backend de mentira que devolve o candidato de teste ao zero quando a prova dele já foi entregue; recebe o oid no fim. */
  mockNovaProva: 'http://localhost:8030/mock/nova-prova/' as string | null,
  /**
   * De onde vem o desempenho da prova corrigida (acertos por caderno e nota da
   * redação); recebe o oid do candidatoprova no fim. O backend do legado não
   * tem esse endpoint: é pedido a ele, e enquanto não existir fica nulo em
   * produção e a tela de resultado mostra só o que sabe.
   */
  desempenhoProva: 'http://localhost:8030/mock/desempenho/' as string | null,
};
