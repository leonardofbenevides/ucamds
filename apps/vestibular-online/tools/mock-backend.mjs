// Backend de MENTIRA para desenvolvimento: imita os endpoints do legado que o
// fluxo do candidato usa, com dados fictícios em memória. Nada aqui toca em
// dado real. Suba com `npm run mock` e abra:
//   http://localhost:4200/candidato/ana    (prova objetiva + redação)
//   http://localhost:4200/candidato/bruno  (só objetiva: corrige na hora)
//   http://localhost:4200/banca            (quem corrige as redações)
//   http://localhost:4200/banca/isencao    (a fila de isenção de disciplinas)
//   http://localhost:4200/isencao/joao     (o candidato acompanha a isenção)
// Qualquer outro oid também funciona (candidato genérico, com redação).
// TEMPO=00:03:00 node tools/mock-backend.mjs  → prova de 3 minutos.
// BANCA=60 node tools/mock-backend.mjs        → sem ninguém corrigindo, a
//   redação sai corrigida sozinha 60 s depois da entrega.
import { createServer } from 'node:http';

const PORTA = Number(process.env.PORTA ?? 8030);
const TEMPO = process.env.TEMPO ?? '00:20:00';
// A banca AUTOMÁTICA é opcional: quem corrige agora é o perfil da banca
// (/banca), que dá a nota de cada redação. Com BANCA=<segundos>, a prova com
// redação que ninguém corrigiu vira corrigida sozinha depois desse tempo —
// para demonstrar só o lado do candidato.
const BANCA_MS = process.env.BANCA ? Number(process.env.BANCA) * 1000 : null;
/** Suposição do protótipo: nota de redação a partir da qual a prova pode aprovar. A regra real é do backend. */
const NOTA_MINIMA_REDACAO = 5;
const NOTA_BANCA_AUTOMATICA = 7;
const TOTAL_TENTATIVAS = 3;

const q = (oid, descricao, alternativas, certa, textoreferencia = null) => ({
  oid,
  descricao,
  textoreferencia,
  alternativas: alternativas.map((d, i) => ({ oid: `${oid}-${'abcde'[i]}`, descricao: d })),
  certa: `${oid}-${certa}`,
});

const CADERNOS = {
  PORTUGUES: {
    oid: 'cad-pt',
    tipoprova: 'PORTUGUES',
    questoes: [
      q('pt1', '<p>Assinale a alternativa em que a concordância verbal está <strong>correta</strong>.</p>',
        ['Fazem dois anos que ele partiu.', 'Houveram muitos problemas na obra.', 'Faz dois anos que ele partiu.', 'Existe pessoas que não concordam.', 'Devem haver outras saídas.'], 'c',
        '<p>Leia o trecho: "A língua é um sistema vivo, que muda com quem a usa."</p>'),
      q('pt2', '<p>No trecho de apoio, a palavra <em>vivo</em> funciona como:</p>',
        ['substantivo', 'adjetivo', 'advérbio', 'verbo', 'conjunção'], 'b',
        '<p>Leia o trecho: "A língua é um sistema vivo, que muda com quem a usa."</p>'),
      q('pt3', '<p>Qual frase usa a crase corretamente?</p>',
        ['Fui à pé até a escola.', 'Entreguei o livro à ela.', 'Refiro-me à professora de química.', 'Começou à chover.', 'Voltou à casa cedo.'], 'c'),
    ],
  },
  MATEMATICA: {
    oid: 'cad-mt',
    tipoprova: 'MATEMATICA',
    questoes: [
      q('mt1', '<p>Se <em>x</em> + 3 = 10, então 2<em>x</em> vale:</p>', ['7', '10', '13', '14', '20'], 'd'),
      q('mt2', '<p>Um produto de R$ 200,00 recebe desconto de 15%. Quanto se paga?</p>', ['R$ 150,00', 'R$ 170,00', 'R$ 175,00', 'R$ 185,00', 'R$ 215,00'], 'b'),
    ],
  },
  REDACAO: {
    oid: 'cad-rd',
    tipoprova: 'REDACAO',
    questoes: [
      {
        oid: 'rd1',
        pontuacao: 10,
        ordem: 1,
        descricao: '<p>Com base nos textos de apoio e no que você conhece do assunto, escreva um texto dissertativo-argumentativo sobre <strong>o papel da leitura na formação do cidadão</strong>. Defenda um ponto de vista e sustente-o com argumentos.</p>',
        textoreferencia:
          '<p><strong>Texto I</strong></p>' +
          '<p>"Ler é, antes de tudo, aprender a pensar com a cabeça dos outros para depois pensar com a própria. Quem lê pouco não fica apenas com menos informação: fica com menos palavras para dizer o que sente e menos caminhos para discordar do que ouve."</p>' +
          '<p>Adaptado de ensaio sobre leitura e formação.</p>' +
          '<p><strong>Texto II</strong></p>' +
          '<p>Uma pesquisa nacional sobre hábitos de leitura registrou que cerca de metade dos entrevistados não havia lido nenhum livro, inteiro ou em parte, nos três meses anteriores. Entre os que leem, a escola e a família aparecem como as principais portas de entrada para o primeiro livro.</p>' +
          '<p>Síntese de dados divulgados pela imprensa.</p>',
        alternativas: [],
      },
    ],
  },
};

// O CADASTRO DE PROVAS: os cadernos de cada processo seletivo, forma de
// ingresso e captação (a "vigência" do legado). A primeira vigência é a que os
// candidatos do protótipo fazem: o caderno de redação dela É o CADERNOS.REDACAO,
// então editar a proposta em /banca/provas muda o que o candidato lê.
const PROCESSOS = [
  { oid: 'pps-2026-2', periodoletivo: { ano: 2026, semestre: 2 } },
  { oid: 'pps-2027-1', periodoletivo: { ano: 2027, semestre: 1 } },
];
const FORMAS_CADASTRO = [
  { oid: 'fi-vest', descricao: 'Vestibular online' },
  { oid: 'fi-agendado', descricao: 'Vestibular agendado' },
];
const CAPTACOES = [
  { oid: 'cap-geral', label: 'Geral' },
  { oid: 'cap-convenio', label: 'Convênio' },
];
const vigenciaDe = (processo, forma, captacao) => `fiv-${processo}-${forma}-${captacao}`;
const VIGENCIA_DOS_CANDIDATOS = vigenciaDe(PROCESSOS[0].oid, FORMAS_CADASTRO[0].oid, CAPTACOES[0].oid);
/** oid da vigência → cadernos cadastrados nela. */
const cadernosPorVigencia = new Map([[VIGENCIA_DOS_CANDIDATOS, [CADERNOS.REDACAO]]]);
let serie = 0;
const novoOid = (prefixo) => `${prefixo}-${++serie}`;
const cadernoCadastro = (c) => ({ oid: c.oid, tipoprova: c.tipoprova, questoes: [...c.questoes].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)).map(({ certa, alternativas, ...q }) => q) });
const acharCaderno = (oid) => [...cadernosPorVigencia.values()].flat().find((c) => c.oid === oid);
/** A redação que o candidato do protótipo faz hoje: o caderno da vigência dele, se ainda existir e tiver questão. */
const redacaoDosCandidatos = () => (cadernosPorVigencia.get(VIGENCIA_DOS_CANDIDATOS) ?? []).find((c) => c.tipoprova === 'REDACAO' && c.questoes.length) ?? null;

// A ISENÇÃO DE DISCIPLINAS, como em isencao/ e admin/isencao do legado: quem
// entra com histórico de outra instituição pede isenção, manda os documentos e
// a secretaria decide disciplina a disciplina, sobre a matriz do curso.
const MATRIZES = {
  'mat-dir-20222': { matriz: 'DIR20222', curso: 'DIREITO', disciplinas: [
    [1, 'Introdução ao Estudo do Direito'], [1, 'Teoria Geral do Estado'], [1, 'Português Jurídico'], [1, 'Sociologia Geral e Jurídica'],
    [2, 'Direito Civil I'], [2, 'Direito Constitucional I'], [2, 'História do Direito'],
    [3, 'Direito Penal I'], [3, 'Direito Civil II'],
  ] },
  'mat-dir-20201': { matriz: 'DIR20201', curso: 'DIREITO', disciplinas: [
    [1, 'Introdução ao Estudo do Direito'], [1, 'Ciência Política'], [1, 'Português Jurídico'],
    [2, 'Direito Civil I'], [2, 'Direito Constitucional I'], [2, 'Filosofia do Direito'],
    [3, 'Direito Penal I'], [3, 'Direito Civil II'],
  ] },
  'mat-adm-20231': { matriz: 'ADM20231', curso: 'ADMINISTRAÇÃO', disciplinas: [
    [1, 'Teoria Geral da Administração'], [1, 'Matemática Básica'], [1, 'Comunicação Empresarial'],
    [2, 'Contabilidade Geral'], [2, 'Introdução à Economia'], [2, 'Estatística'],
  ] },
};
const discOid = (matriz, n) => `${matriz}-d${n + 1}`;
const diaIso = (dias) => new Date(Date.now() - dias * 864e5).toISOString();
const doc = (oid, descricao, filename, dias) => ({ oid, descricao, filename, datacriacao: diaIso(dias) });
const isento = (descricao, ies, cargaHoraria) => ({ aceita: 'ACEITO', motivo: null, descricao, ies, cargaHoraria });
const RECUSADA = { aceita: 'RECUSADO', motivo: null, descricao: null, ies: null, cargaHoraria: null };
/** oid da inscrição → solicitação de isenção. Pessoas, documentos e pareceres são inventados. */
const ISENCOES = new Map(
  [
    { fip: 'joao', nome: 'JOÃO CUTRIM', cpf: '11122233344', telefone: ['(22) 99911-2233'], email: 'joao.cutrim@exemplo.com', curso: 'DIREITO', periodoLetivo: '2026.2',
      solicitada: 19, alterada: 17, status: 'PENDENTE_ANALISE', matriz: 'mat-dir-20222', observacao: null, avaliacoes: {},
      documentos: [doc('doc-j1', 'Histórico escolar', 'historico-uff.pdf', 19), doc('doc-j2', 'Ementas das disciplinas cursadas', 'ementas-uff.pdf', 17)] },
    { fip: 'anapaula', nome: 'ANA PAULA ROCHA', cpf: '22233344455', telefone: ['(22) 99822-3344'], email: 'ana.rocha@exemplo.com', curso: 'DIREITO', periodoLetivo: '2026.2',
      solicitada: 16, alterada: 16, status: 'PENDENTE_ANALISE', matriz: null, observacao: null, avaliacoes: {}, documentos: [] },
    { fip: 'marcos', nome: 'MARCOS VINÍCIUS TEIXEIRA', cpf: '33344455566', telefone: [], email: 'marcos.teixeira@exemplo.com', curso: 'DIREITO', periodoLetivo: '2026.2',
      solicitada: 24, alterada: 6, status: 'ANALISADO_COM_PENDENCIA', matriz: 'mat-dir-20222', observacao: 'Falta a ementa de Direito Civil I.',
      avaliacoes: {
        [discOid('mat-dir-20222', 0)]: isento('Introdução ao Direito', 'Universidade Federal Fluminense', '60'),
        [discOid('mat-dir-20222', 2)]: isento('Língua Portuguesa', 'Universidade Federal Fluminense', '60'),
        [discOid('mat-dir-20222', 4)]: { aceita: 'PENDENTE', motivo: 'Envie a ementa de Direito Civil I: sem ela não dá para comparar o conteúdo.', descricao: null, ies: null, cargaHoraria: null },
      },
      documentos: [doc('doc-m1', 'Histórico escolar', 'historico.pdf', 24)] },
    { fip: 'pedro', nome: 'PEDRO ALVES', cpf: '44455566677', telefone: ['(21) 98877-6655'], email: 'pedro.alves@exemplo.com', curso: 'DIREITO', periodoLetivo: '2026.1',
      solicitada: 200, alterada: 195, status: 'CONCLUIDO', matriz: 'mat-dir-20222', observacao: 'Parecer concluído conforme o histórico e as ementas enviadas.',
      avaliacoes: Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => [discOid('mat-dir-20222', n), n < 6 ? isento('Disciplina equivalente cursada', 'Universidade Estácio de Sá', '60') : RECUSADA])),
      documentos: [doc('doc-p1', 'Histórico escolar', 'historico-estacio.pdf', 200), doc('doc-p2', 'Ementas', 'ementas-estacio.pdf', 199)] },
    { fip: 'beatriz', nome: 'BEATRIZ LIMA', cpf: '55566677788', telefone: ['(22) 99700-1122'], email: 'beatriz.lima@exemplo.com', curso: 'ADMINISTRAÇÃO', periodoLetivo: '2026.2',
      solicitada: 9, alterada: 8, status: 'PENDENTE_ANALISE', matriz: null, observacao: null, avaliacoes: {},
      documentos: [doc('doc-b1', 'Histórico e ementas', 'historico-e-ementas.pdf', 8)] },
    { fip: 'rafael', nome: 'RAFAEL COSTA', cpf: '66677788899', telefone: ['(22) 99655-4433'], email: 'rafael.costa@exemplo.com', curso: 'ADMINISTRAÇÃO', periodoLetivo: '2026.2',
      solicitada: 4, alterada: 4, status: 'PENDENTE_ANALISE', matriz: null, observacao: null, avaliacoes: {}, documentos: [] },
    { fip: 'sofia', nome: 'SOFIA MENDES', cpf: '77788899900', telefone: ['(21) 99123-4567'], email: 'sofia.mendes@exemplo.com', curso: 'ADMINISTRAÇÃO', periodoLetivo: '2026.1',
      solicitada: 180, alterada: 170, status: 'CONCLUIDO', matriz: 'mat-adm-20231', observacao: null,
      avaliacoes: Object.fromEntries([0, 1, 2, 3, 4, 5].map((n) => [discOid('mat-adm-20231', n), n % 2 === 0 ? isento('Disciplina equivalente cursada', 'Universidade Veiga de Almeida', '80') : RECUSADA])),
      documentos: [doc('doc-s1', 'Histórico escolar', 'historico-uva.pdf', 180)] },
  ].map((i) => [i.fip, { ...i, datasolicitacao: diaIso(i.solicitada), dataalteracao: diaIso(i.alterada) }]),
);
const UNIDADE_ISENCAO = 'Campos dos Goytacazes';
/** As disciplinas de uma matriz, por período, com o que já foi decidido para esta solicitação. */
function semestresDe(i, oidMatriz) {
  const m = MATRIZES[oidMatriz];
  if (!m) return {};
  const semestres = {};
  m.disciplinas.forEach(([periodo, nome], n) => {
    const oid = discOid(oidMatriz, n);
    // Não avaliada é PENDENTE com motivo nulo, como o backend do legado devolve.
    const a = (i.matriz === oidMatriz && i.avaliacoes[oid]) || { aceita: 'PENDENTE', motivo: null, descricao: null, ies: null, cargaHoraria: null };
    (semestres[String(periodo)] ??= []).push({ oid, nome, ...a });
  });
  return semestres;
}
const isencaoDoCandidato = (i) => ({ status: i.status, curso: i.curso, observacao: i.observacao, semestres: i.matriz ? semestresDe(i, i.matriz) : {}, documentos: i.documentos });
const linhaDaFila = (i) => ({
  nome: i.nome, situacao: i.status, status: i.status, documentos: i.documentos.length, telefone: i.telefone[0] ?? null, email: i.email,
  periodoLetivo: i.periodoLetivo, datasolicitacao: i.datasolicitacao, dataalteracao: i.dataalteracao, formaIngressoPessoa: i.fip, codigomatriz: i.matriz ?? undefined,
});
function cursosDaFila(concluidas) {
  const porCurso = new Map();
  for (const i of ISENCOES.values()) {
    if ((i.status === 'CONCLUIDO') !== concluidas) continue;
    if (!porCurso.has(i.curso)) porCurso.set(i.curso, { nome: i.curso, unidade: UNIDADE_ISENCAO, candidates: [] });
    porCurso.get(i.curso).candidates.push(linhaDaFila(i));
  }
  return [...porCurso.values()];
}
async function lerBruto(req) {
  const partes = [];
  for await (const chunk of req) partes.push(chunk);
  return Buffer.concat(partes);
}
// Um PDF de uma página em branco: o que o download de mentira devolve.
const PDF_VAZIO = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n', 'latin1');

const PESSOAS = {
  ana: { nome: 'Ana Souza', cpf: '12345678901', curso: 'ENGENHARIA DE SOFTWARE', turno: 'N', redacao: true },
  bruno: { nome: 'Bruno Lima', cpf: '98765432100', curso: 'ADMINISTRACAO', turno: 'M', redacao: false },
};

/** oidFip → estado da inscrição (tentativas e candidatoprova atual). */
const inscricoes = new Map();

// A FILA DA BANCA já nasce com redações entregues, para o perfil que corrige
// ter o que fazer antes de alguém terminar uma prova no protótipo. Textos e
// pessoas são inventados.
const PERIODOS = [
  { oid: 'pi-2026-2', periodoletivo: { ano: 2026, semestre: 2, datainicio: '2026-07-01', datafim: '2026-12-20' } },
  { oid: 'pi-2026-1', periodoletivo: { ano: 2026, semestre: 1, datainicio: '2026-01-15', datafim: '2026-06-30' } },
];
const FORMAS = [
  { oid: 'fi-vest', descricao: 'Vestibular online' },
  { oid: 'fi-enem', descricao: 'Nota do ENEM' },
];
const paragrafos = (...ps) => ps.map((t) => `<p>${t}</p>`).join('');
// oid, nome, CPF, curso, turno, há quantos dias entregou, acertos na objetiva, nota já dada (ou null), texto.
const REDACOES_PRONTAS = [
  ['carla', 'Carla Menezes', '31245678902', 'DIREITO', 'N', 5, 3, null, paragrafos(
    'A leitura costuma ser tratada como um hábito de quem tem tempo, quando na verdade é uma das poucas ferramentas que permitem a alguém entender o mundo sem depender do que os outros dizem sobre ele. Um cidadão que lê compara versões, percebe quando um argumento não se sustenta e consegue dizer com precisão o que pensa.',
    'Isso não acontece por acaso. A escola e a família são, para a maioria das pessoas, a porta de entrada do primeiro livro, e quando as duas falham o leitor simplesmente não se forma. Por isso a leitura não pode ser cobrada só como tarefa: precisa ser apresentada como algo que serve à vida de quem lê.',
    'Formar leitores é, portanto, formar pessoas capazes de discordar com fundamento. Uma sociedade que lê pouco continua votando, trabalhando e opinando, mas faz tudo isso com menos palavras e menos caminhos, e é essa pobreza que a leitura combate.')],
  ['diego', 'Diego Farias', '45678912303', 'ADMINISTRAÇÃO', 'M', 4, 2, null, paragrafos(
    'Hoje em dia as pessoas leem muito pouco e isso é um problema para o país. Quem não lê não sabe das coisas e acaba acreditando em tudo que aparece na internet, sem conferir se é verdade ou não.',
    'Eu acho que a leitura ajuda a pessoa a ser um cidadão melhor porque ela aprende coisas novas e passa a conhecer os seus direitos. Na escola a gente lê só o que o professor manda e muita gente pega raiva de livro por causa disso, o que é uma pena.',
    'Então é preciso que o governo e as famílias incentivem mais a leitura, com bibliotecas e livros mais baratos, para que todo mundo possa ler e o Brasil melhore.')],
  ['elisa', 'Elisa Carvalho', '56789123404', 'PSICOLOGIA', 'N', 3, 5, null, paragrafos(
    'Dizer que metade dos brasileiros não leu um livro nos últimos meses é dizer que metade do país conversa sobre o que não teve como examinar. O dado assusta menos pelo número do que pelo que ele revela: a leitura deixou de ser percebida como instrumento de cidadania e passou a ser vista como passatempo de poucos.',
    'O texto de apoio acerta ao afirmar que ler é aprender a pensar com a cabeça dos outros antes de pensar com a própria. É esse exercício que dá ao leitor repertório para discordar. Quem nunca atravessou um raciocínio alheio até o fim tende a reagir a opiniões, e não a argumentos, e fica mais exposto a quem fala mais alto.',
    'Há ainda um efeito menos visível. A leitura alarga o vocabulário, e com ele a capacidade de nomear o que se sente e o que se quer. Um cidadão sem palavras para descrever uma injustiça dificilmente consegue reclamá-la.',
    'Cabe à escola, portanto, mais do que cobrar a leitura: cabe a ela mostrar para que a leitura serve. Sem isso, continuaremos formando pessoas alfabetizadas que não se tornam leitoras, e eleitores que não se tornam cidadãos.')],
  ['fabio', 'Fábio Nogueira', '67891234505', 'ENGENHARIA DE SOFTWARE', 'N', 2, 4, null, paragrafos(
    'A leitura forma o cidadão porque ensina a esperar. Um texto não entrega tudo na primeira linha, e quem lê aprende a segurar o julgamento até entender o argumento inteiro, o que é raro numa época de manchetes.',
    'Esse hábito tem consequência prática. Contratos, bulas, editais e leis são textos, e quem não consegue lê-los depende de alguém que leia por ele. A cidadania começa quando a pessoa deixa de precisar desse intermediário.',
    'Por isso o incentivo à leitura não é luxo cultural. É a condição para que as pessoas exerçam sozinhas os direitos que já têm no papel.')],
  ['gabi', 'Gabriela Pinto', '78912345606', 'DIREITO', 'M', 1, 1, null, ''],
  ['hugo', 'Hugo Barreto', '89123456707', 'ADMINISTRAÇÃO', 'N', 9, 4, 8.5, paragrafos(
    'A formação de um cidadão passa, necessariamente, pela capacidade de compreender o que lê. Não se trata apenas de decifrar palavras, mas de relacionar o que está escrito com a própria experiência e com o que outros já disseram sobre o mesmo tema.',
    'Quando a escola reduz a leitura a uma obrigação, ela ensina o aluno a terminar livros, e não a lê-los. O resultado aparece mais tarde, no adulto que evita qualquer texto longo e por isso assina, vota e decide com base em resumos feitos por terceiros.',
    'Uma política séria de leitura começa por bibliotecas vivas e professores leitores. Só quem lê por gosto consegue convencer alguém de que vale a pena.')],
  ['iara', 'Iara Lopes', '91234567808', 'PSICOLOGIA', 'M', 8, 2, 4, paragrafos(
    'Ler é muito importante para todas as pessoas. A leitura traz conhecimento e também diverte, e por isso deveria ser mais valorizada no nosso país, onde muita gente não tem o costume de ler.',
    'O cidadão que lê fica mais informado sobre o que acontece e pode cobrar os políticos. Já quem não lê fica sem saber dos seus direitos. Assim, é necessário incentivar a leitura desde cedo nas escolas, para formar pessoas melhores.',
    'Conclui-se que a leitura é fundamental e que todos devem ler mais.')],
];
const diasAtras = (dias, hora) => { const d = new Date(Date.now() - dias * 864e5); d.setHours(hora, 20, 0, 0); return d; };
for (const [oid, nome, cpf, curso, turno, dias, certas, nota, texto] of REDACOES_PRONTAS) {
  const fim = diasAtras(dias, 9 + (dias % 9));
  const objetivas = [CADERNOS.PORTUGUES, CADERNOS.MATEMATICA].flatMap((c) => c.questoes);
  const respostas = Object.fromEntries(
    objetivas.map((qq, n) => [qq.oid, { oidAlternativa: n < certas ? qq.certa : qq.alternativas.find((a) => a.oid !== qq.certa).oid, respostaTextual: null }]),
  );
  if (texto) respostas.rd1 = { oidAlternativa: null, respostaTextual: texto };
  const i = {
    oidFip: oid,
    pessoa: { nome, cpf, curso, turno, redacao: true },
    situacaoInscricao: 'INSCRITO',
    tentativaAtual: 1,
    candidato: { oid: `cp-${oid}-1`, situacao: 'PROVA_FINALIZADA', horarioinicio: new Date(fim.getTime() - 55 * 60e3).toISOString(), horariofim: fim.toISOString() },
    respostas,
    notaRedacao: null,
  };
  inscricoes.set(oid, i);
  if (nota !== null) darNota(i, nota);
}

/** A nota da banca fecha a correção: prova corrigida, e a inscrição aprovada ou reprovada. */
function darNota(i, nota) {
  i.notaRedacao = nota;
  i.candidato.situacao = 'PROVA_CORRIGIDA';
  i.situacaoInscricao = corrigir(i) === 'APROVADO' && nota >= NOTA_MINIMA_REDACAO ? 'APROVADO' : 'REPROVADO';
}

function inscricao(oidFip) {
  if (!inscricoes.has(oidFip)) {
    const p = PESSOAS[oidFip] ?? { nome: `Candidato ${oidFip}`, cpf: '00000000000', curso: 'DIREITO', turno: 'N', redacao: true };
    inscricoes.set(oidFip, { oidFip, pessoa: p, situacaoInscricao: 'INSCRITO', tentativaAtual: 0, candidato: null, respostas: {}, notaRedacao: null });
  }
  return comBanca(inscricoes.get(oidFip));
}

/** Com a banca automática ligada, passado o prazo a prova com redação entregue vira corrigida. */
function comBanca(i) {
  const c = i?.candidato;
  if (BANCA_MS !== null && c?.situacao === 'PROVA_FINALIZADA' && i.pessoa.redacao && Date.now() - new Date(c.horariofim).getTime() >= BANCA_MS) {
    darNota(i, NOTA_BANCA_AUTOMATICA);
  }
  return i;
}

function candidatoProva(i) {
  const c = i.candidato;
  return {
    oid: c.oid,
    situacao: c.situacao,
    horarioinicio: c.horarioinicio,
    horariofim: c.horariofim,
    dataprova: c.horariofim,
    formaingressopessoa: {
      oid: i.oidFip,
      situacao: i.situacaoInscricao,
      notaredacao: i.notaRedacao,
      pessoa: { oid: `pessoa-${i.oidFip}`, nome: i.pessoa.nome, cpf: { numero: i.pessoa.cpf } },
      periodounidadecurso: {
        turnoLabel: i.pessoa.turno,
        unidadecurso: { curso: { nome: i.pessoa.curso }, unidade: { oid: 'unid01', sigla: 'Campos', nome: 'Campos dos Goytacazes' } },
      },
    },
  };
}

function cadernosDe(i) {
  const lista = [CADERNOS.PORTUGUES, CADERNOS.MATEMATICA];
  const redacao = redacaoDosCandidatos();
  if (i.pessoa.redacao && redacao) lista.push(redacao);
  return lista.map(({ questoes, ...c }) => ({
    ...c,
    questoes: [...questoes].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)).map(({ certa, ...qq }) => ({ ...qq, alternativas: qq.alternativas ?? [] })),
  }));
}

function porCandidato(oidCp) {
  return comBanca([...inscricoes.values()].find((i) => i.candidato?.oid === oidCp));
}

function corrigir(i) {
  const objetivas = [CADERNOS.PORTUGUES, CADERNOS.MATEMATICA].flatMap((c) => c.questoes);
  const certas = objetivas.filter((qq) => i.respostas[qq.oid]?.oidAlternativa === qq.certa).length;
  return certas * 2 >= objetivas.length ? 'APROVADO' : 'REPROVADO';
}

/** Só do protótipo: o desempenho que o backend de verdade ainda não entrega ao candidato. */
function desempenho(i) {
  const cadernos = [CADERNOS.PORTUGUES, CADERNOS.MATEMATICA].map((c) => ({
    tipoprova: c.tipoprova,
    acertos: c.questoes.filter((qq) => i.respostas[qq.oid]?.oidAlternativa === qq.certa).length,
    total: c.questoes.length,
  }));
  return { cadernos, notaRedacao: i.notaRedacao ?? null };
}

function responder(res, status, corpo, tipo = 'application/json') {
  res.writeHead(status, {
    'Content-Type': tipo + '; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  });
  res.end(corpo === undefined ? '' : tipo === 'application/json' ? JSON.stringify(corpo) : String(corpo));
}

async function lerJson(req) {
  let s = '';
  for await (const chunk of req) s += chunk;
  try { return s ? JSON.parse(s) : null; } catch { return null; }
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORTA}`);
  const p = url.pathname;
  const m = req.method;
  console.log(`${m} ${p}${url.search}`);
  if (m === 'OPTIONS') return responder(res, 204);

  let x;
  // SÓ DO PROTÓTIPO (não existe no legado): os atalhos de teste chamam isto
  // antes de entrar. Prova já entregue ou corrigida → a inscrição volta ao
  // zero, para dar para fazer a prova de novo sem reiniciar o servidor. Prova
  // em andamento fica como está: fechar a aba e voltar não pode custar as
  // respostas.
  if ((x = /^\/mock\/desempenho\/([^/]+)$/.exec(p)) && m === 'GET') {
    const i = [...inscricoes.values()].find((ins) => ins.candidato?.oid === x[1]);
    return i ? responder(res, 200, desempenho(i)) : responder(res, 404, { erro: 'candidatoprova não encontrado' });
  }
  if ((x = /^\/mock\/nova-prova\/([^/]+)$/.exec(p)) && m === 'POST') {
    const situacao = inscricoes.get(x[1])?.candidato?.situacao;
    const reiniciada = situacao === 'PROVA_FINALIZADA' || situacao === 'PROVA_CORRIGIDA';
    if (reiniciada) inscricoes.delete(x[1]);
    return responder(res, 200, { reiniciada });
  }
  if (m === 'GET' && p === '/vestibularonline/candidatoprova/search/findbyformaingressopessoa') {
    const i = inscricao(url.searchParams.get('oidformaingressopessoa'));
    return i.candidato ? responder(res, 200, candidatoProva(i)) : responder(res, 200, null);
  }
  if (m === 'POST' && p === '/vestibularonline/candidatoprova') {
    const i = inscricao(url.searchParams.get('oidformaingressopessoa'));
    const tentativa = Number(url.searchParams.get('tentativa') ?? '0');
    const podeNova = !i.candidato || (i.candidato.situacao === 'PROVA_CORRIGIDA' && i.situacaoInscricao === 'REPROVADO' && tentativa > i.tentativaAtual && tentativa <= TOTAL_TENTATIVAS);
    if (!podeNova) return responder(res, 409, { message: 'Já existe candidatoprova para esta tentativa.' });
    i.tentativaAtual = Math.max(1, tentativa || 1);
    i.candidato = { oid: `cp-${i.oidFip}-${i.tentativaAtual}`, situacao: 'CADASTRADO', horarioinicio: null, horariofim: null };
    i.respostas = {};
    i.notaRedacao = null;
    return responder(res, 201, candidatoProva(i));
  }
  if ((x = /^\/vestibularonline\/formaingressopessoa\/([^/]+)\/tentativas$/.exec(p)) && m === 'GET') {
    const i = inscricao(x[1]);
    return responder(res, 200, { tentativaAtual: i.tentativaAtual, totalTentativasPossiveis: TOTAL_TENTATIVAS });
  }
  if ((x = /^\/vestibularonline\/candidatoprova\/([^/]+)\/(iniciarprova|cadernoprova|responderquestao|finalizarprova|tipoprova|corrigir-prova-objetiva)$/.exec(p))) {
    const i = porCandidato(x[1]);
    if (!i) return responder(res, 404, { message: 'candidatoprova não encontrado' });
    switch (x[2]) {
      case 'iniciarprova':
        if (i.candidato.situacao === 'CADASTRADO') { i.candidato.situacao = 'PROVA_INICIADA'; i.candidato.horarioinicio = new Date().toISOString(); }
        return responder(res, 200, candidatoProva(i));
      case 'cadernoprova':
        return responder(res, 200, cadernosDe(i));
      case 'responderquestao': {
        if (i.candidato.situacao !== 'PROVA_INICIADA') return responder(res, 400, { message: 'A prova não está em andamento.' });
        const corpo = await lerJson(req);
        i.respostas[corpo.oidQuestao] = { oidAlternativa: corpo.oidAlternativa ?? null, respostaTextual: corpo.respostaTextual ?? null };
        return responder(res, 200, {});
      }
      case 'finalizarprova':
        i.candidato.situacao = 'PROVA_FINALIZADA'; i.candidato.horariofim = new Date().toISOString();
        return responder(res, 200, candidatoProva(i));
      case 'tipoprova':
        return responder(res, 200, cadernosDe(i).map((c) => c.tipoprova));
      case 'corrigir-prova-objetiva': {
        const r = corrigir(i);
        i.candidato.situacao = 'PROVA_CORRIGIDA'; i.situacaoInscricao = r;
        return responder(res, 200, r, 'text/plain');
      }
    }
  }
  // ---- A ISENÇÃO: isencao/ (candidato) e admin/isencao (secretaria) do legado. ----
  if ((x = /^\/isencao\/([^/]+)\/([^/]+)\/(analize|analized)\/courses$/.exec(p)) && m === 'GET') {
    return responder(res, 200, cursosDaFila(x[3] === 'analized'));
  }
  if ((x = /^\/isencao\/([^/]+)\/matrizes$/.exec(p)) && m === 'GET') {
    const i = ISENCOES.get(x[1]);
    if (!i) return responder(res, 404, { message: 'isenção não encontrada' });
    return responder(res, 200, Object.entries(MATRIZES).filter(([, mm]) => mm.curso === i.curso).map(([oidmatriz, mm]) => ({ oidmatriz, matriz: mm.matriz })));
  }
  if ((x = /^\/isencao\/([^/]+)\/matrizes\/([^/]+)$/.exec(p)) && m === 'GET') {
    const i = ISENCOES.get(x[1]);
    if (!i || !MATRIZES[x[2]]) return responder(res, 404, { message: 'isenção ou matriz não encontrada' });
    return responder(res, 200, {
      curso: i.curso, nome: i.nome, cpf: i.cpf, telefone: i.telefone, email: i.email, status: i.status, observacao: i.observacao,
      semestres: semestresDe(i, x[2]), documentos: i.documentos,
    });
  }
  if ((x = /^\/isencao\/([^/]+)\/evaluate$/.exec(p)) && m === 'POST') {
    const i = ISENCOES.get(x[1]);
    const corpo = await lerJson(req);
    if (!i || !corpo?.matriz || !MATRIZES[corpo.matriz]) return responder(res, 400, { message: 'Faltam a isenção e a matriz.' });
    if (i.status === 'CONCLUIDO') return responder(res, 409, { message: 'A isenção já foi concluída.' });
    const parcial = url.searchParams.get('partial') === 'true';
    i.matriz = corpo.matriz;
    i.observacao = corpo.observacao || null;
    i.avaliacoes = {};
    for (const d of Object.values(corpo.semestres ?? {}).flat()) {
      if (d.aceita) i.avaliacoes[d.oid] = { aceita: d.aceita, motivo: d.motivo ?? null, descricao: d.descricao ?? null, ies: d.ies ?? null, cargaHoraria: d.cargaHoraria ?? null };
    }
    i.dataalteracao = new Date().toISOString();
    // SUPOSIÇÃO DO PROTÓTIPO (no legado quem decide a situação é o backend):
    // salvar parcial guarda e não muda a situação; finalizar conclui, a não ser
    // que haja disciplina pendente com motivo — aí a solicitação espera o candidato.
    if (!parcial) {
      const esperaCandidato = Object.values(i.avaliacoes).some((a) => a.aceita === 'PENDENTE' && a.motivo);
      i.status = esperaCandidato ? 'ANALISADO_COM_PENDENCIA' : 'CONCLUIDO';
    }
    return responder(res, 200, {});
  }
  if ((x = /^\/isencao\/([^/]+)\/upload$/.exec(p)) && m === 'POST') {
    const i = ISENCOES.get(x[1]);
    const bruto = (await lerBruto(req)).toString('latin1');
    if (!i) return responder(res, 404, { message: 'isenção não encontrada' });
    const latin = (t) => Buffer.from(t, 'latin1').toString('utf8');
    const filename = latin(/name="file"; filename="([^"]*)"/.exec(bruto)?.[1] ?? 'documento.pdf');
    const descricao = latin(/name="descricao"\r\n\r\n([\s\S]*?)\r\n--/.exec(bruto)?.[1] ?? 'Documento');
    i.documentos = [...i.documentos, { oid: novoOid('doc'), descricao, filename, datacriacao: new Date().toISOString() }];
    i.dataalteracao = new Date().toISOString();
    // SUPOSIÇÃO DO PROTÓTIPO: o documento que o candidato manda devolve a solicitação à análise.
    if (i.status === 'ANALISADO_COM_PENDENCIA') i.status = 'PENDENTE_ANALISE';
    return responder(res, 200, isencaoDoCandidato(i));
  }
  if ((x = /^\/isencao\/([^/]+)\/download\/([^/]+)$/.exec(p)) && m === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/pdf', 'Access-Control-Allow-Origin': '*' });
    return res.end(PDF_VAZIO);
  }
  if ((x = /^\/isencao\/([^/]+)$/.exec(p)) && m === 'GET') {
    const i = ISENCOES.get(x[1]);
    return i ? responder(res, 200, isencaoDoCandidato(i)) : responder(res, 404, { message: 'isenção não encontrada' });
  }

  // ---- O CADASTRO: cadernos e questões, como em admin/cadastro do legado. ----
  if (m === 'GET' && p === '/data-context/periodoprocessoseletivo/search/findByUnidade') {
    return responder(res, 200, { _embedded: { periodoprocessoseletivo: PROCESSOS } });
  }
  if (m === 'GET' && /^\/vestibularonline\/formaingresso\/search\/find-formaingresso-vestibularonline\/?$/.test(p)) {
    return responder(res, 200, FORMAS_CADASTRO);
  }
  if (m === 'GET' && p === '/vestibularonline/captacao/search/findall') {
    return responder(res, 200, CAPTACOES);
  }
  if (m === 'GET' && p === '/data-context/formaingressovigencia/search/findByProcessoSeletivo') {
    const q = url.searchParams;
    return responder(res, 200, { oid: vigenciaDe(q.get('oidPeriodoProcessoSeletivo'), q.get('oidFormaIngresso'), q.get('captacao')) });
  }
  if (m === 'GET' && p === '/vestibularonline/cadernoprova/search/find-cadernoprova-by-processoseletivo') {
    const q = url.searchParams;
    const vigencia = vigenciaDe(q.get('oidPeriodoProcessoSeletivo'), q.get('oidFormaIngresso'), q.get('oidCaptacao'));
    return responder(res, 200, (cadernosPorVigencia.get(vigencia) ?? []).map(cadernoCadastro));
  }
  if (m === 'POST' && /^\/vestibularonline\/cadernoprova\/?$/.test(p)) {
    const corpo = await lerJson(req);
    const vigencia = corpo?.formaingressovigencia?.oid;
    if (!vigencia || !corpo?.tipoprova) return responder(res, 400, { message: 'Faltam a vigência e o tipo do caderno.' });
    const caderno = { oid: novoOid('cad'), tipoprova: corpo.tipoprova, questoes: [] };
    cadernosPorVigencia.set(vigencia, [...(cadernosPorVigencia.get(vigencia) ?? []), caderno]);
    return responder(res, 201, cadernoCadastro(caderno));
  }
  if ((x = /^\/vestibularonline\/cadernoprova\/([^/]+)$/.exec(p)) && m === 'DELETE') {
    for (const [vigencia, lista] of cadernosPorVigencia) cadernosPorVigencia.set(vigencia, lista.filter((c) => c.oid !== x[1]));
    return responder(res, 204);
  }
  if ((m === 'POST' || m === 'PUT') && /^\/vestibularonline\/questao\/?$/.test(p)) {
    const corpo = await lerJson(req);
    const caderno = acharCaderno(corpo?.cadernoprova?.oid);
    if (!caderno) return responder(res, 404, { message: 'caderno não encontrado' });
    const campos = { descricao: corpo.descricao ?? '', textoreferencia: corpo.textoreferencia || null, pontuacao: Number(corpo.pontuacao ?? 0), ordem: Number(corpo.ordem ?? 0) };
    if (m === 'POST') {
      const questao = { oid: novoOid('q'), alternativas: [], ...campos };
      caderno.questoes.push(questao);
      return responder(res, 201, questao);
    }
    const questao = caderno.questoes.find((qq) => qq.oid === corpo.oid);
    if (!questao) return responder(res, 404, { message: 'questão não encontrada' });
    Object.assign(questao, campos);
    return responder(res, 200, questao);
  }
  if ((x = /^\/vestibularonline\/questao\/([^/]+)$/.exec(p)) && m === 'DELETE') {
    for (const c of [...cadernosPorVigencia.values()].flat()) c.questoes = c.questoes.filter((qq) => qq.oid !== x[1]);
    return responder(res, 204);
  }

  // ---- A BANCA: os endpoints que a correção de redação do legado usa. ----
  if (m === 'GET' && p === '/data-context/periodoingresso/search/findPeriodoingressoComCandidatosProvaOnline') {
    return responder(res, 200, { _embedded: { periodoingresso: PERIODOS } });
  }
  if (m === 'GET' && p === '/data-context/formaingresso/search/findFormaingressoComCandidatosProvaOnline') {
    return responder(res, 200, { _embedded: { formaingresso: FORMAS } });
  }
  if (m === 'GET' && (x = /^\/vestibularonline\/candidatoprova\/search\/(find-candidatos-para-correcao|find-candidatos-prova-corrigida)$/.exec(p))) {
    const corrigidas = x[1] === 'find-candidatos-prova-corrigida';
    const q = url.searchParams;
    const termo = (q.get('pesquisa') ?? '').trim().toLowerCase();
    const digitos = termo.replace(/\D/g, '');
    const inicio = q.get('dataInicio');
    const fim = q.get('dataFim');
    // No protótipo toda redação pertence ao período e à forma mais recentes.
    const noRecorte = (q.get('oidPeriodoIngresso') || PERIODOS[0].oid) === PERIODOS[0].oid && (q.get('oidFormaIngresso') || FORMAS[0].oid) === FORMAS[0].oid;
    const todos = [...inscricoes.values()]
      .map(comBanca)
      .filter((i) => noRecorte && i.pessoa.redacao && i.candidato?.situacao === (corrigidas ? 'PROVA_CORRIGIDA' : 'PROVA_FINALIZADA'))
      .filter((i) => !termo || i.pessoa.nome.toLowerCase().includes(termo) || (digitos && i.pessoa.cpf.includes(digitos)))
      .filter((i) => { const dia = i.candidato.horariofim.slice(0, 10); return (!inicio || dia >= inicio) && (!fim || dia <= fim); })
      // Em espera: a mais antiga primeiro. Corrigidas: a mais recente primeiro.
      .sort((a, b) => (corrigidas ? -1 : 1) * a.candidato.horariofim.localeCompare(b.candidato.horariofim));
    const size = Number(q.get('size') ?? 10);
    const page = Number(q.get('page') ?? 0);
    return responder(res, 200, {
      content: todos.slice(page * size, (page + 1) * size).map(candidatoProva),
      totalElements: todos.length,
      totalPages: Math.ceil(todos.length / size),
      number: page,
      size,
    });
  }
  if (m === 'GET' && p === '/vestibularonline/respostacandidato/search/find-resposta-redacao') {
    const i = porCandidato(url.searchParams.get('oidCandidato'));
    if (!i) return responder(res, 404, { message: 'candidatoprova não encontrado' });
    // O texto vale qualquer que seja a questão em que foi escrito: a proposta
    // pode ter sido trocada no cadastro depois da entrega.
    const questao = redacaoDosCandidatos()?.questoes[0] ?? null;
    const escrito = Object.values(i.respostas).find((r) => r.respostaTextual !== null && r.respostaTextual !== undefined);
    return responder(res, 200, {
      respostaTextual: escrito?.respostaTextual ?? '',
      textoReferencia: questao?.textoreferencia ?? null,
      descricaoQuestao: questao?.descricao ?? null,
    });
  }
  if ((x = /^\/vestibularonline\/candidatoprova\/([^/]+)\/notaredacao$/.exec(p)) && m === 'POST') {
    const i = porCandidato(x[1]);
    if (!i) return responder(res, 404, { message: 'candidatoprova não encontrado' });
    const nota = Number((await lerJson(req))?.nota);
    if (!Number.isFinite(nota) || nota < 0 || nota > 10) return responder(res, 400, { message: 'A nota vai de 0 a 10.' });
    darNota(i, nota);
    return responder(res, 200, candidatoProva(i));
  }
  if ((x = /^\/vestibularonline\/candidato\/([^/]+)\/tempo-maximo-prova$/.exec(p)) && m === 'GET') {
    return responder(res, 200, { tempomaximo: TEMPO });
  }
  if (m === 'GET' && p === '/vestibularonline/respostacandidato/search/find-resposta-por-questao') {
    const i = porCandidato(url.searchParams.get('oidCandidato'));
    return responder(res, 200, i?.respostas[url.searchParams.get('oidQuestao')] ?? null);
  }
  if ((x = /^\/data-context\/candidato\/([^/]+)$/.exec(p)) && m === 'GET') {
    const i = porCandidato(x[1]);
    return i ? responder(res, 200, { horarioinicio: i.candidato.horarioinicio, horariofim: i.candidato.horariofim }) : responder(res, 404, {});
  }
  // ---- O GERENCIAL: o que a volta do login único consulta (TryTokenLogin do legado). ----
  // Qualquer usuário entra: no protótipo não há login de verdade.
  if ((x = /^\/gerencial\/usuario\/([^/]+)$/.exec(p)) && m === 'GET') {
    return responder(res, 200, { oid: x[1], oidPessoa: `pessoa-${x[1]}`, foto: null });
  }
  if (m === 'GET' && p === '/gerencial/unidadeUsuario/search/usuario') {
    const oidUsuario = url.searchParams.get('oidusuario');
    return responder(res, 200, { _embedded: { unidadesUsuarios: [{ oidUsuario, oidUnidade: 'unid01', sigla: 'Campos', razaosocial: 'Campos dos Goytacazes' }] } });
  }
  if ((x = /^\/gerencial\/usuario\/([^/]+)\/pessoa$/.exec(p)) && m === 'GET') {
    return responder(res, 200, { nome: x[1] === 'marta' ? 'Marta Reis' : `Usuário ${x[1]}`, email: `${x[1]}@ucam.example` });
  }
  return responder(res, 404, { message: `sem rota: ${m} ${p}` });
});

servidor.listen(PORTA, () => {
  console.log(`backend de mentira em http://localhost:${PORTA}/ (tempo de prova ${TEMPO}, ${BANCA_MS === null ? 'redações corrigidas em /banca' : `banca automática em ${BANCA_MS / 1000} s`})`);
  console.log('abra: http://localhost:4200/candidato/ana  ou  http://localhost:4200/candidato/bruno  ou  http://localhost:4200/banca');
});
