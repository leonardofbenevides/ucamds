/*
 * Espelho de ESTADO para a documentação.
 *
 * O @ucam/css expressa estado por pseudo-classe pura — `.ucam-btn--primary:hover`,
 * `:focus-visible`, `:disabled` — e é o certo: é assim que o navegador entrega
 * o estado a quem usa o componente de verdade. O preço é que a DOCUMENTAÇÃO
 * não consegue mostrar os estados lado a lado: `:hover` só existe onde o
 * ponteiro está, e o ponteiro está num lugar só.
 *
 * Carbon publica a matriz variante × estado porque é a pergunta que todo
 * implementador faz — "como fica o hover do ghost em tom danger?" — e a
 * resposta aqui era uma fileira de chips com os NOMES dos estados.
 *
 * Este gerador NÃO toca no CSS dos componentes. Lê o que build-css.mjs já
 * emitiu e escreve uma folha à parte, onde cada regra de estado ganha um gêmeo
 * ativado por atributo:
 *
 *     .ucam-btn--primary:hover:not(:disabled) { background: X }
 *  →  .ucam-estado[data-ucam-estado="hover"] .ucam-btn--primary { background: X }
 *
 * A pseudo-classe SAI em vez de virar atributo no próprio elemento: o palco
 * inteiro é o estado, então dentro dele não há o que distinguir. Pelo mesmo
 * motivo o `:not(:disabled)` sai inteiro — num palco de hover nada está
 * desabilitado.
 *
 * O ESPELHO É DERIVADO: quando o CSS de um componente muda, a matriz muda
 * junto no build seguinte, sem ninguém reescrever nada.
 *
 * ---------------------------------------------------------------------------
 * As três armadilhas que a primeira versão caiu, todas gerando CSS inválido
 * que derrubava a folha INTEIRA do site (Tailwind aborta com "Missing opening
 * (" e nenhum estilo carrega):
 *
 *   1. `:not(:hover)` — tirar a pseudo-classe por substituição de texto deixa
 *      `:not()`, que é erro de sintaxe. Pseudo-classe DENTRO de parênteses
 *      não pode ser tocada: a regra que a contém é descartada.
 *   2. `:is(a, button).x` — dividir o seletor por vírgula sem contar
 *      parênteses parte o `:is()` no meio e produz `button).x`. O split conta
 *      o nível.
 *   3. Comentário com chave — `/* ... { ... *\/` fazia o scanner achar que
 *      começava um bloco. Os comentários saem antes de qualquer varredura.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Lê a SAÍDA REAL do build-css (dist/css/ucam.css), não a cópia que o
// build-index faz em site/src/generated/componentes.css: essa cópia só nasce
// no passo `indice`, que roda DEPOIS de `css`. Numa árvore limpa — o clone
// que a Vercel constrói — ela ainda não existe quando este gerador roda, e o
// build morria aqui (24/09/2026). Localmente passava porque a cópia sobrava
// de builds anteriores. E o diretório de saída pode ainda não existir pela
// mesma razão: é criado na hora.
const ENTRADA = join(ROOT, 'dist', 'css', 'ucam.css');
const SAIDA = join(ROOT, 'site', 'src', 'generated', 'estados.css');

/** Os estados que o espelho cobre, na ordem em que a matriz os mostra. */
const ESTADOS = [
  { nome: 'hover', pseudo: ':hover' },
  { nome: 'active', pseudo: ':active' },
  { nome: 'focus', pseudo: ':focus-visible' },
  { nome: 'disabled', pseudo: ':disabled' },
];

/** Tira os comentários. Armadilha 3: um deles pode conter `{` ou `}`. */
function semComentarios(fonte) {
  let saida = '';
  let i = 0;
  while (i < fonte.length) {
    if (fonte.startsWith('/*', i)) {
      const fim = fonte.indexOf('*/', i + 2);
      i = fim === -1 ? fonte.length : fim + 2;
      continue;
    }
    saida += fonte[i++];
  }
  return saida;
}

function fechaBloco(fonte, abre) {
  let nivel = 0;
  for (let j = abre; j < fonte.length; j++) {
    if (fonte[j] === '{') nivel++;
    else if (fonte[j] === '}') {
      nivel--;
      if (nivel === 0) return j;
    }
  }
  return fonte.length;
}

/**
 * Divide o CSS em regras de topo. `contexto` guarda o @media/@supports que
 * envolve a regra, para o espelho sair dentro da mesma condição — um hover que
 * só vale acima de 60rem não pode virar regra incondicional.
 */
function regras(fonte, contexto = null) {
  const saida = [];
  let i = 0;
  while (i < fonte.length) {
    if (fonte[i] === '@') {
      const abre = fonte.indexOf('{', i);
      if (abre === -1) break;
      const prelude = fonte.slice(i, abre).trim();
      const fim = fechaBloco(fonte, abre);
      if (prelude.startsWith('@media') || prelude.startsWith('@supports')) {
        for (const r of regras(fonte.slice(abre + 1, fim), prelude)) saida.push(r);
      }
      i = fim + 1;
      continue;
    }
    const abre = fonte.indexOf('{', i);
    if (abre === -1) break;
    const seletor = fonte.slice(i, abre).trim();
    const fim = fechaBloco(fonte, abre);
    const corpo = fonte.slice(abre + 1, fim).trim();
    if (seletor && !seletor.startsWith('@') && corpo) saida.push({ seletor, corpo, contexto });
    i = fim + 1;
  }
  return saida;
}

/** Split por vírgula no NÍVEL ZERO de parênteses. Armadilha 2. */
function partesDoSeletor(seletor) {
  const partes = [];
  let atual = '';
  let nivel = 0;
  for (const ch of seletor) {
    if (ch === '(') nivel++;
    else if (ch === ')') nivel--;
    if (ch === ',' && nivel === 0) {
      partes.push(atual.trim());
      atual = '';
      continue;
    }
    atual += ch;
  }
  if (atual.trim()) partes.push(atual.trim());
  return partes;
}

/** Posições da pseudo-classe que estão FORA de qualquer parêntese. */
function ocorrenciasSoltas(parte, pseudo) {
  const achadas = [];
  let nivel = 0;
  for (let i = 0; i < parte.length; i++) {
    const ch = parte[i];
    if (ch === '(') nivel++;
    else if (ch === ')') nivel--;
    else if (nivel === 0 && parte.startsWith(pseudo, i)) {
      // `:focus` não pode casar dentro de `:focus-visible`.
      const proximo = parte[i + pseudo.length];
      if (!proximo || !/[a-z-]/i.test(proximo)) achadas.push(i);
    }
  }
  return achadas;
}

/** Remove `:not(...)` de nível zero cujo conteúdo é um dos argumentos dados. */
function tiraNegacoes(parte, alvos) {
  let saida = '';
  let i = 0;
  while (i < parte.length) {
    if (parte.startsWith(':not(', i)) {
      let nivel = 0;
      let j = i + 4;
      for (; j < parte.length; j++) {
        if (parte[j] === '(') nivel++;
        else if (parte[j] === ')') {
          nivel--;
          if (nivel === 0) break;
        }
      }
      const dentro = parte.slice(i + 5, j).trim();
      if (alvos.includes(dentro)) {
        i = j + 1;
        continue;
      }
    }
    saida += parte[i++];
  }
  return saida;
}

const NEGACOES_QUE_SAEM = [':disabled', '[aria-disabled="true"]', "[aria-disabled='true']"];

function reescreve(seletor, pseudo, nome) {
  const novas = [];

  for (const parte of partesDoSeletor(seletor)) {
    const soltas = ocorrenciasSoltas(parte, pseudo);
    if (!soltas.length) continue;

    // Armadilha 1: a pseudo-classe também aparece DENTRO de parênteses nesta
    // parte (`:not(:hover)`, `:has(.x:hover)`). Mexer ali quebra a sintaxe, e
    // manter inverteria o sentido. A parte inteira é descartada.
    const total = parte.split(pseudo).length - 1;
    if (total !== soltas.length) continue;

    let novo = tiraNegacoes(parte, NEGACOES_QUE_SAEM);
    // Remove só as ocorrências soltas, da direita para a esquerda para os
    // índices não se moverem.
    //
    // Quando a pseudo-classe é o componente composto INTEIRO — `.ucam
    // :focus-visible`, que é como o anel de foco é escrito — apagá-la deixaria
    // `.ucam`, e a regra passaria a pintar o contêiner em vez do elemento
    // focado. Nesse caso ela vira `.ucam-estado-alvo`, a marca que o palco põe
    // no primeiro focável (ver estados-grade.component.ts).
    for (const pos of ocorrenciasSoltas(novo, pseudo).reverse()) {
      const antes = novo[pos - 1];
      const depois = novo[pos + pseudo.length];
      const sozinha =
        (antes === undefined || /[\s>+~]/.test(antes)) &&
        (depois === undefined || /[\s,]/.test(depois));
      const troca = sozinha ? '.ucam-estado-alvo' : '';
      novo = novo.slice(0, pos) + troca + novo.slice(pos + pseudo.length);
    }
    novo = novo.trim();

    if (!novo || /^[>+~]/.test(novo) || novo.includes('()')) continue;
    novas.push(`.ucam-estado[data-ucam-estado="${nome}"] ${novo}`);
  }

  return novas.length ? novas.join(',\n') : null;
}

if (!existsSync(ENTRADA)) {
  console.error('build-estados: ' + ENTRADA + ' não existe — rode build-css.mjs antes.');
  process.exit(1);
}

const todas = regras(semComentarios(readFileSync(ENTRADA, 'utf8')));

const linhas = [
  '/* GERADO por tools/build-estados.mjs — NÃO EDITAR À MÃO.',
  ' *',
  ' * Espelho das regras de estado do @ucam/css em seletores por atributo, para',
  ' * a documentação mostrar hover, active, focus e disabled lado a lado. O',
  ' * original continua sendo o que vale; isto existe só para o palco da matriz',
  ' * de estados em /catalogo/<id>. Ver a nota no gerador.',
  ' */',
  '',
];

const contagem = {};
for (const { nome, pseudo } of ESTADOS) {
  const bloco = [];
  for (const r of todas) {
    const sel = reescreve(r.seletor, pseudo, nome);
    if (!sel) continue;
    const regra = sel + ' {\n  ' + r.corpo + '\n}';
    bloco.push(r.contexto ? r.contexto + ' {\n' + regra + '\n}' : regra);
  }
  contagem[nome] = bloco.length;
  if (bloco.length) {
    linhas.push('/* ---------------------------------------------------- ' + nome + ' --- */');
    linhas.push(bloco.join('\n'));
    linhas.push('');
  }
}

const saida = linhas.join('\n');

/* PORTÃO. CSS inválido aqui não quebra só esta folha: o Tailwind aborta o
   processamento e o site inteiro fica sem estilo nenhum, com um 500 no
   styles.css. Melhor falhar o build do que servir isso. */
const corpoSemComentario = semComentarios(saida);
const abre = (corpoSemComentario.match(/\(/g) || []).length;
const fecha = (corpoSemComentario.match(/\)/g) || []).length;
const vazios = corpoSemComentario.includes('()');
if (abre !== fecha || vazios) {
  console.error(
    'build-estados: CSS inválido — parênteses ' + abre + '/' + fecha + (vazios ? ', há "()"' : ''),
  );
  process.exit(1);
}

mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(SAIDA, saida, 'utf8');

const total = Object.values(contagem).reduce((a, b) => a + b, 0);
console.log('site/src/generated/estados.css');
console.log(
  '  ' +
    total +
    ' regras espelhadas · ' +
    ESTADOS.map((e) => e.nome + ' ' + contagem[e.nome]).join(' · '),
);
