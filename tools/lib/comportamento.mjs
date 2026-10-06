// O COMPORTAMENTO DO TRILHO A — um arquivo, o mesmo código das telas (ADR-057).
//
// A pergunta que abriu isto (03/10/2026): "o dev chega 100% igual ao exemplo?"
// No visual chegava, copiando a marcação da tela; no comportamento não havia
// como chegar, porque os scripts que dão vida às 31 telas de referência
// (navegação, menu da conta, busca, abas, gaveta, diálogo, tabela, calendário,
// toast…) viviam só em tools/lib/shell.mjs e eram embutidos nas páginas
// autônomas. Uma tela copiada ficava idêntica e morta — e o guia de migração
// dizia, com razão, que o Trilho A "não entrega comportamento".
//
// Agora entrega, e pelo único caminho que não cria uma terceira versão: o
// arquivo dist/css/ucam-comportamento.js é a CONCATENAÇÃO dos mesmos exports
// que as telas carregam. Não há cópia para divergir; o que a tela de
// referência faz, a aplicação faz, porque é o mesmo texto.
//
// A ÚNICA diferença entre os dois lugares é o atributo data-referencia no
// <html> da tela autônoma. Com ele, os tratadores que FINGEM o servidor
// (arquivar, bloquear, finalizar análise, gravar na linha…) rodam; sem ele, o
// clique em [data-acao] dispara o evento `ucam:acao` e para. Os scripts que só
// existem para montar o fixture (grupo × menu do Gerencial, "criado" por
// ?criado=, soma por período) ficam fora do arquivo — lista REFERENCIA abaixo.
//
// O PORTÃO: todo export *Script de shell.mjs tem de estar numa das duas
// listas. Script novo sem classificação derruba o build, porque "esqueci de
// decidir" é como o arquivo da aplicação passaria a divergir da tela.

import * as shell from './shell.mjs';
import { listboxScript } from './select-listbox.mjs';

/** Na ordem em que as telas autônomas os carregam; a ordem importa (toast antes de quem o chama). */
export const COMPONENTE = [
  'toastScript',
  'navScript',
  'buscaGlobalScript',
  'atalhoBuscaScript',
  'menuContaScript',
  'estadoScript',
  'descricaoScript',
  'viewbarScript',
  'linhaDoTempoScript',
  'abasScript',
  'filtroScript',
  'confirmaScript',
  'dialogoScript',
  'contadorScript',
  'gavetaScript',
  'inboxScript',
  'tabelaScript',
  'avatarScript',
  'roloScript',
  'copiarScript',
  'motivoScript',
  'dataScript',
];

/** Só a tela de referência: montam o fixture, não um componente. */
export const REFERENCIA = ['grupoMenuScript', 'criadoScript', 'periodoScript'];

export function classificar() {
  const exportados = Object.keys(shell).filter((k) => /Script$/.test(k));
  const conhecidos = new Set([...COMPONENTE, ...REFERENCIA]);
  const semClasse = exportados.filter((k) => !conhecidos.has(k));
  const semExport = [...conhecidos].filter((k) => !(k in shell));
  return { exportados, semClasse, semExport };
}

const CABECALHO = `/*! UCAMDS — comportamento do Trilho A (ADR-057).
 *
 * O mesmo código que dá vida às telas de referência do design system, para a
 * marcação do Trilho A: navegação sobreposta, menu da conta, busca da faixa,
 * abas, segmentos que rolam, gaveta, diálogo, confirmação, toast, menu de
 * coluna e ordenação da tabela, "marcar todos" e barra de lote, calendário do
 * campo de data, listbox do select, contador do textarea, copiar identificador,
 * motivo do controle desabilitado, estrela de favorito, X do alerta.
 *
 * Carregue DEPOIS da marcação (fim do <body>, ou com defer):
 *   <link rel="stylesheet" href=".../css/ucam.css">
 *   <script src=".../css/ucam-comportamento.js" defer></script>
 *
 * Ações de sistema: todo controle com data-acao dispara o evento \`ucam:acao\`
 * (bolha, cancelável), com { acao, controle } em detail. Chame
 * preventDefault() nele para dizer "já cuidei"; sem isso o clique segue o seu
 * curso normal (um botão de formulário submete). Os tratadores que a tela de
 * referência usa para FINGIR o servidor não rodam aqui — só rodam no site do
 * design system, onde o <html> traz data-referencia.
 *
 *   document.addEventListener('ucam:acao', function (e) {
 *     if (e.detail.acao === 'arquivar') { e.preventDefault(); servico.arquivar(id); }
 *   });
 *
 * Toast (ADR-052): window.ucamToast(texto, tom) — tom em success | error | info.
 * Anúncio para quem ouve: ponha <p class="ucam-sr-only" role="status" data-anuncio></p>
 * dentro do .ucam-shell; o app-shell do catálogo já o traz.
 *
 * Gerado por tools/lib/comportamento.mjs a partir de tools/lib/shell.mjs — não
 * edite este arquivo.
 */
`;

export function bundleComportamento() {
  const partes = [CABECALHO, `\n/* --- select: listbox (ADR-011) --- */\n${listboxScript.trim()}\n`];
  for (const nome of COMPONENTE) {
    partes.push(`\n/* --- ${nome.replace(/Script$/, '')} --- */\n${shell[nome].trim()}\n`);
  }
  return partes.join('');
}
