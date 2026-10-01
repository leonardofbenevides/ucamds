// Backend de MENTIRA para desenvolvimento: imita os endpoints do legado que o
// fluxo do candidato usa, com dados fictícios em memória. Nada aqui toca em
// dado real. Suba com `npm run mock` e abra:
//   http://localhost:4200/candidato/ana    (prova objetiva + redação)
//   http://localhost:4200/candidato/bruno  (só objetiva: corrige na hora)
// Qualquer outro oid também funciona (candidato genérico, com redação).
// TEMPO=00:03:00 node tools/mock-backend.mjs  → prova de 3 minutos.
import { createServer } from 'node:http';

const PORTA = Number(process.env.PORTA ?? 8030);
const TEMPO = process.env.TEMPO ?? '00:20:00';
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
        descricao: '<p>Com base no texto de apoio, escreva um texto dissertativo-argumentativo sobre <strong>o papel da leitura na formação do cidadão</strong>.</p>',
        textoreferencia: '<p>"Ler é, antes de tudo, aprender a pensar com a cabeça dos outros para depois pensar com a própria." — adaptado.</p>',
        alternativas: [],
      },
    ],
  },
};

const PESSOAS = {
  ana: { nome: 'Ana Souza', cpf: '12345678901', curso: 'ENGENHARIA DE SOFTWARE', turno: 'N', redacao: true },
  bruno: { nome: 'Bruno Lima', cpf: '98765432100', curso: 'ADMINISTRACAO', turno: 'M', redacao: false },
};

/** oidFip → estado da inscrição (tentativas e candidatoprova atual). */
const inscricoes = new Map();

function inscricao(oidFip) {
  if (!inscricoes.has(oidFip)) {
    const p = PESSOAS[oidFip] ?? { nome: `Candidato ${oidFip}`, cpf: '00000000000', curso: 'DIREITO', turno: 'N', redacao: true };
    inscricoes.set(oidFip, { oidFip, pessoa: p, situacaoInscricao: 'INSCRITO', tentativaAtual: 0, candidato: null, respostas: {} });
  }
  return inscricoes.get(oidFip);
}

function candidatoProva(i) {
  const c = i.candidato;
  return {
    oid: c.oid,
    situacao: c.situacao,
    horarioinicio: c.horarioinicio,
    horariofim: c.horariofim,
    formaingressopessoa: {
      oid: i.oidFip,
      situacao: i.situacaoInscricao,
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
  if (i.pessoa.redacao) lista.push(CADERNOS.REDACAO);
  return lista.map(({ questoes, ...c }) => ({ ...c, questoes: questoes.map(({ certa, ...qq }) => qq) }));
}

function porCandidato(oidCp) {
  return [...inscricoes.values()].find((i) => i.candidato?.oid === oidCp);
}

function corrigir(i) {
  const objetivas = [CADERNOS.PORTUGUES, CADERNOS.MATEMATICA].flatMap((c) => c.questoes);
  const certas = objetivas.filter((qq) => i.respostas[qq.oid]?.oidAlternativa === qq.certa).length;
  return certas * 2 >= objetivas.length ? 'APROVADO' : 'REPROVADO';
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
  return responder(res, 404, { message: `sem rota: ${m} ${p}` });
});

servidor.listen(PORTA, () => {
  console.log(`backend de mentira em http://localhost:${PORTA}/ (tempo de prova ${TEMPO})`);
  console.log('abra: http://localhost:4200/candidato/ana  ou  http://localhost:4200/candidato/bruno');
});
