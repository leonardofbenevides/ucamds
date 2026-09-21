// Valida os contratos de spec/ contra o JSON Schema e contra as regras que
// o schema não consegue expressar (integridade do grafo de composição,
// referências de token, coerência de status).
//
//   node tools/validate-spec.mjs

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// O export padrão do ajv é draft-07; o schema dos contratos é draft 2020-12.
import Ajv from 'ajv/dist/2020.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = join(ROOT, 'spec');
const read = (p) => JSON.parse(readFileSync(join(SPEC, p), 'utf8'));

const erros = [];
const avisos = [];
const falha = (arquivo, msg) => erros.push({ arquivo, msg });
const avisa = (arquivo, msg) => avisos.push({ arquivo, msg });

/* ------------------------------------------------- 1. schema dos contratos --- */

const schema = read('schema/component.schema.json');
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

const arquivos = readdirSync(join(SPEC, 'components')).filter((f) => f.endsWith('.json'));
const components = arquivos.map((f) => ({ file: f, spec: read(join('components', f)) }));

for (const { file, spec } of components) {
  if (!validate(spec)) {
    for (const e of validate.errors) {
      falha(file, `${e.instancePath || '/'} ${e.message}${e.params?.additionalProperty ? ` ("${e.params.additionalProperty}")` : ''}`);
    }
  }
  // O id precisa bater com o nome do arquivo — senão o gerador e o MCP
  // divergem sobre qual é a chave canônica.
  if (spec.id !== file.replace(/\.json$/, '')) {
    falha(file, `id "${spec.id}" não corresponde ao nome do arquivo`);
  }
  // Duas formas legítimas, e só duas: ELEMENTO `ucam-<id>` ou DIRETIVA de
  // atributo `[ucam<Id>]`. A diretiva entrou em 06/09/2026 com o tooltip —
  // dica não é caixa no arranjo, é comportamento colado a um controle que já
  // existe, e virar elemento obrigaria todo controle com dica a ganhar um
  // invólucro que muda o fluxo. O prefixo continua obrigatório nas duas: é ele
  // que mantém a fronteira da ADR-006.
  const camel = spec.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const esperados = [`ucam-${spec.id}`, `[ucam${camel[0].toUpperCase()}${camel.slice(1)}]`];
  if (!esperados.includes(spec.selector)) {
    falha(file, `selector "${spec.selector}" deveria ser ${esperados.map((e) => `"${e}"`).join(' ou ')}`);
  }
}

/* ------------------------------------------------- 1b. os adaptadores --- */
// spec/schema/adapter.schema.json existia desde o adaptador PrimeFaces e
// NADA o lia: o gerador conferia os tokens, e só. Um adaptador com `regras`
// vazias, `status` inventado ou uma prop sem `token` nem `literal` passava
// pelo validate e só quebrava no build — que é tarde, e no lugar errado. O
// segundo adaptador (ADR-025) é o que fez a lacuna aparecer.
{
  const schemaAdaptador = read('schema/adapter.schema.json');
  const validaAdaptador = ajv.compile(schemaAdaptador);
  const dir = join(SPEC, 'adapters');
  const adaptadores = readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const f of adaptadores) {
    const file = `adapters/${f}`;
    const spec = read(file);
    if (!validaAdaptador(spec)) {
      for (const e of validaAdaptador.errors) {
        falha(file, `${e.instancePath || '/'} ${e.message}${e.params?.additionalProperty ? ` ("${e.params.additionalProperty}")` : ''}`);
      }
    }
    if (spec.id !== f.replace(/\.json$/, '')) {
      falha(file, `id "${spec.id}" não corresponde ao nome do arquivo — o gerador nomeia a folha pelo arquivo`);
    }
    // Só token semântico (ADR-007). Os nomes do adaptador são os da folha
    // (kebab, color-action-primary-default), então a lista vem do
    // dist/tokens/ucam-tokens.json que o build-tokens já resolve — e que
    // separa primitivo de semântico. A folha de tokens emite os primitivos
    // também, logo "existe em ucam-tokens.css" não bastava: --ucam-wine-600
    // passaria. Em árvore limpa o arquivo não existe e a checagem se cala,
    // como a 4d faz com o ucam.css.
    //
    // O critério é o do build-css.mjs, e não "está em nomes.semantic": os
    // tokens compostos (typography-label) chegam à folha DESMONTADOS em
    // typography-label-font-size etc., que só existem lá. Então: existe na
    // folha, e não é nome de primitivo que não seja também semântico.
    const nomesTokens = join(ROOT, 'dist', 'tokens', 'ucam-tokens.json');
    const folhaTokens = join(ROOT, 'dist', 'tokens', 'ucam-tokens.css');
    if (existsSync(nomesTokens) && existsSync(folhaTokens)) {
      const nomes = JSON.parse(readFileSync(nomesTokens, 'utf8'));
      const semanticos = new Set(Object.keys(nomes.semantic));
      const primitivos = new Set(Object.keys(nomes.primitive));
      const publicados = new Set(
        [...readFileSync(folhaTokens, 'utf8').matchAll(/^\s*--ucam-([a-z0-9-]+):/gm)].map((m) => m[1])
      );
      for (const regra of spec.regras ?? []) {
        for (const [prop, v] of Object.entries(regra.props ?? {})) {
          const refs = v.token ? [v.token] : [...String(v.literal ?? '').matchAll(/var\(\s*--ucam-([a-z0-9-]+)/g)].map((m) => m[1]);
          for (const t of refs) {
            if (primitivos.has(t) && !semanticos.has(t)) falha(file, `${regra.seletor} { ${prop} } referencia o primitivo "${t}" — ADR-007: só token semântico`);
            else if (!publicados.has(t)) falha(file, `${regra.seletor} { ${prop} } referencia "${t}", que não é token publicado`);
          }
        }
      }
    }
  }
}

/* ---------------------------------------- 2. integridade do grafo de uso --- */

const ids = new Set(components.map((c) => c.spec.id));
const selectors = new Set(components.map((c) => c.spec.selector));
const statusPorSelector = Object.fromEntries(components.map((c) => [c.spec.selector, c.spec.status]));

for (const { file, spec } of components) {
  for (const dep of spec.composicao?.usa ?? []) {
    if (!selectors.has(dep)) {
      avisa(file, `depende de ${dep}, que ainda não tem contrato`);
      continue;
    }
    // ADR: componente stable não pode depender de draft.
    if (spec.status === 'stable' && statusPorSelector[dep] !== 'stable') {
      falha(file, `está stable mas depende de ${dep}, que é ${statusPorSelector[dep]}`);
    }
  }
}

/* -------------------------------------------- 2b. desambiguação simétrica --- */
//
// O campo `vs` responde "qual dos dois eu uso?". A pergunta é simétrica e a
// resposta precisa ser: quem abre o contrato do Dialog primeiro — que é o
// caminho mais provável — tem de encontrar o Drawer ali, não no contrato do
// Drawer. Antes deste portão a desambiguação existia em prosa espalhada e
// metade dela era de mão única: dos 54 pares confundíveis levantados contra o
// VibeDS em 08/09/2026, 17 tinham explicação de um lado só.
//
// Falha, não avisa: `vs` de mão única não é lacuna a preencher depois, é
// afirmação incompleta já publicada.
for (const { file, spec } of components) {
  for (const par of spec.vs ?? []) {
    if (!ids.has(par.componente)) {
      falha(file, `vs aponta "${par.componente}", que não é id de contrato nenhum`);
      continue;
    }
    if (par.componente === spec.id) {
      falha(file, 'vs aponta para o próprio componente');
      continue;
    }
    const outro = components.find((c) => c.spec.id === par.componente);
    if (!(outro.spec.vs ?? []).some((v) => v.componente === spec.id)) {
      falha(file, `vs explica a diferença para "${par.componente}", mas ${par.componente} não explica a diferença para "${spec.id}" — desambiguação de mão única`);
    }
  }
}

/* ---------------------------------------------- 3. camadas de token (ADR-007) --- */

const primitive = read('tokens/primitive.json');
const semantic = read('tokens/semantic.json');

const primitiveKeys = new Set(
  Object.keys(primitive).filter((k) => !k.startsWith('$') && !k.startsWith('_'))
);

// Toda referência {x.y} dentro de semantic.json precisa existir nos primitivos.
function checarRefs(node, trail = []) {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') && k !== '$value') continue;
    if (k === '$value' && typeof v === 'string' && v.startsWith('{')) {
      const path = v.replace(/[{}]/g, '').split('.');
      let cur = primitive;
      for (const seg of path) cur = cur?.[seg];
      if (!cur || !('$value' in cur)) {
        falha('tokens/semantic.json', `referência quebrada ${v} em ${trail.join('.')}`);
      }
    } else if (v && typeof v === 'object') {
      checarRefs(v, [...trail, k]);
    }
  }
}
checarRefs(semantic);

// Componentes só podem citar tokens semânticos (ADR-007).
const tokensEmSpecs = [];
for (const { file, spec } of components) {
  const json = JSON.stringify(spec);
  for (const m of json.matchAll(/"([a-z]+(?:\.[a-z-]+){1,4})"/g)) {
    const ref = m[1];
    const raiz = ref.split('.')[0];
    if (primitiveKeys.has(raiz) && raiz !== 'color' && raiz !== 'space') {
      falha(file, `referencia token primitivo "${ref}" — apenas a camada semântica é pública (ADR-007)`);
    }
    if (ref.startsWith('color.') || ref.startsWith('space.') || ref.startsWith('size.')) {
      tokensEmSpecs.push({ file, ref });
    }
  }
}

// Os tokens semânticos citados nas specs precisam existir.
function existeSemantico(ref) {
  let cur = semantic;
  for (const seg of ref.split('.')) {
    cur = cur?.[seg];
    if (!cur) return false;
  }
  return true;
}
for (const { file, ref } of tokensEmSpecs) {
  if (!existeSemantico(ref)) {
    falha(file, `cita token semântico inexistente "${ref}"`);
  }
}

/* ------------------------------------------------ 4. ADRs e padrões --- */

const adrs = read('decisions/adr.json').decisions;
const adrIds = new Set(adrs.map((a) => a.id));
for (const a of adrs) {
  for (const alvo of a.afeta) {
    if (alvo !== '*' && !ids.has(alvo)) {
      avisa('decisions/adr.json', `${a.id} afeta "${alvo}", que ainda não tem contrato`);
    }
  }
}

// Toda referência a ADR-xxx dentro das specs precisa existir.
for (const { file, spec } of components) {
  for (const m of JSON.stringify(spec).matchAll(/ADR-\d{3}/g)) {
    if (!adrIds.has(m[0])) falha(file, `cita ${m[0]}, que não existe em decisions/adr.json`);
  }
}

const patterns = read('patterns/patterns.json').patterns;
for (const p of patterns) {
  for (const dep of p.usa ?? []) {
    if (!selectors.has(dep)) avisa('patterns/patterns.json', `padrão "${p.id}" usa ${dep}, sem contrato ainda`);
  }
}

/* -------------------------------------------- 4b. composição simétrica --- */
//
// Mesma doença do `vs`, achada pelo mesmo método em 09/09/2026: `composicao`
// era um grafo de mão única. `realce.usada_por` listava o combobox e o combobox
// não declarava `composicao` nenhuma; `field.usada_por` listava seis controles
// e nenhum deles dizia usar o Field. Eram 89 arestas com um lado só entre
// componentes, mais 45 entre padrão e componente.
//
// Isso não é cosmético. O portão do bloco 2 — "stable não pode depender de
// draft" — lê SÓ `usa`. Toda aresta que existia apenas como `usada_por` era
// invisível para ele, e um componente poderia passar a stable sobre
// dependências draft que ninguém enxergava. A simetria é o que faz o grafo
// ser um grafo, e é o que o site precisa para responder "quem quebra se eu
// mexer aqui".
//
// Falha, não avisa, pelo mesmo motivo do `vs`: meia aresta é afirmação
// incompleta já publicada, não lacuna a preencher depois.
const rotuloPadrao = (p) => `padrao-${p.id}`;
const padroesPorRotulo = Object.fromEntries(patterns.map((p) => [rotuloPadrao(p), p]));
const porSelector = Object.fromEntries(components.map((c) => [c.spec.selector, c]));

for (const { file, spec } of components) {
  for (const dep of spec.composicao?.usa ?? []) {
    const outro = porSelector[dep];
    if (!outro) continue; // já avisado no bloco 2
    if (!(outro.spec.composicao?.usada_por ?? []).includes(spec.selector)) {
      falha(file, `declara usar ${dep}, mas ${outro.spec.id} não lista ${spec.selector} em usada_por — grafo de mão única`);
    }
  }
  for (const quem of spec.composicao?.usada_por ?? []) {
    if (quem.startsWith('padrao-')) {
      const p = padroesPorRotulo[quem];
      if (!p) { falha(file, `usada_por aponta ${quem}, que não é padrão nenhum`); continue; }
      if (!(p.usa ?? []).includes(spec.selector)) {
        falha(file, `diz ser usada por ${quem}, mas o padrão não lista ${spec.selector} — grafo de mão única`);
      }
      continue;
    }
    const outro = porSelector[quem];
    if (!outro) { falha(file, `usada_por aponta ${quem}, que não é selector de contrato nenhum`); continue; }
    if (!(outro.spec.composicao?.usa ?? []).includes(spec.selector)) {
      falha(file, `diz ser usada por ${quem}, mas ${outro.spec.id} não lista ${spec.selector} em usa — grafo de mão única`);
    }
  }
}

for (const p of patterns) {
  for (const dep of p.usa ?? []) {
    const outro = porSelector[dep];
    if (!outro) continue; // já avisado logo acima
    if (!(outro.spec.composicao?.usada_por ?? []).includes(rotuloPadrao(p))) {
      falha('patterns/patterns.json', `padrão "${p.id}" usa ${dep}, mas ${outro.spec.id} não o lista em usada_por — grafo de mão única`);
    }
  }
}

/* -------------------------------------------- 4c. templates x contratos --- */
// O regulamento de templates.json diz, com todas as letras: "Template que
// precisa de componente inexistente vira PEDIDO DE CONTRATO, não gambiarra
// local". Nada verificava isso.
//
// O custo apareceu inteiro: `ucam-card` e `ucam-alert` foram usados em telas
// por semanas sem contrato nenhum, e `ucam-stat` só foi pego porque um PADRÃO
// também o declarava — a checagem de patterns existia, a de templates não. Um
// `usa` com o seletor errado (ucam-definition-list, que nunca existiu) também
// atravessou sem ruído.
//
// Falha, não aviso, para o que está ESCRITO no código da tela: aquilo é o
// exemplo copiável que o desenvolvedor leva para a migração, e um seletor que
// não existe ali é instrução errada. O `usa` declarado continua sendo aviso —
// é legítimo uma tela antecipar um componente que ainda vai ser especificado,
// desde que a lacuna fique visível.
// ---------------------------------------------------------------------------
// O CONTRATO MENTE SOBRE A IMPLEMENTAÇÃO?
//
// `implementacao.trilho_b` é o que um agente lê para decidir se pode usar o
// componente ou se precisa escrevê-lo. Em 20/09/2026 sete contratos diziam "a
// escrever" para componentes que estavam escritos há semanas, e um apontava
// para um arquivo que não existia — o file-field, cuja validação de accept e
// maxSize ninguém fazia porque cada trilho achava que era do outro.
//
// São duas perguntas verificáveis: o caminho citado existe, e a frase não
// desmente o arquivo. A terceira — contrato sem entrada nenhuma — é AVISO,
// não erro: a ausência não engana ninguém, e transformar dezoito silêncios em
// falha de build pararia o repositório por causa de documentação atrasada.
for (const { file, spec } of components) {
  const tb = spec.implementacao && spec.implementacao.trilho_b;
  const texto = typeof tb === 'string' ? tb : tb ? JSON.stringify(tb) : null;
  const caminho = texto && texto.match(/ui\/[\w./-]+\.ts/);
  const existe = caminho ? existsSync(join(ROOT, caminho[0])) : null;

  if (caminho && !existe) {
    falha(`components/${file}`, `implementacao.trilho_b aponta para ${caminho[0]}, que não existe`);
  }
  if (texto && /a escrever|pendente|não implementado/i.test(texto) && existe) {
    falha(`components/${file}`, `implementacao.trilho_b diz "a escrever" e ${caminho[0]} está lá`);
  }
  if (!texto) {
    const provavel = `ui/projects/ui/src/lib/ucam/${spec.id}/ucam-${spec.id}.ts`;
    if (existsSync(join(ROOT, provavel))) {
      avisa(`components/${file}`, `sem implementacao.trilho_b, e ${provavel} existe`);
    }
  }
}

const templates = read('templates.json');
for (const projeto of templates.projetos ?? []) {
  for (const t of projeto.templates ?? []) {
    const onde = `templates.json (${projeto.id}/${t.id})`;

    for (const dep of t.usa ?? []) {
      if (!selectors.has(dep)) avisa(onde, `declara ${dep}, que não tem contrato`);
    }

    // O que o código da tela realmente instancia.
    for (const m of (t.codigo ?? '').matchAll(/<(ucam-[a-z0-9-]+)/g)) {
      if (!selectors.has(m[1])) falha(onde, `o código usa <${m[1]}>, que não tem contrato`);
      else if (!(t.usa ?? []).includes(m[1])) {
        avisa(onde, `usa <${m[1]}> no código mas não o declara em "usa"`);
      }
    }
  }
}

/* ------------------------------------------- 4d. a MARCAÇÃO dos templates --- */
// O bloco acima olha o campo "codigo" — o exemplo em Angular que o
// desenvolvedor copia. Ninguém olhava o campo "preview", que é a TELA: o HTML
// de verdade, com as classes do Trilho A, que o site renderiza num iframe e que
// serve de prova de que o padrão fecha.
//
// O preço de não olhar apareceu inteiro numa auditoria de 07/09/2026:
//
//   · a tela de analytics tinha um </div> a mais e um a menos. O painel de
//     apoio caía FORA do bloco que o dividia, ia parar embaixo em largura
//     cheia, e a coluna de 22rem ficava branca. O navegador não reclama: ele
//     conserta em silêncio e desenha outra tela;
//   · a tela de novo requerimento usava ucam-choice-card__figura, que o
//     CONTRATO declara e o Trilho A nunca emitiu. Funcionava por acidente,
//     porque ao lado havia um ucam-icon-tile fazendo o trabalho;
//   · quatro links apontavam #/telas/<projeto>/<tela>, que não é a rota que
//     religaPreview() reescreve. Âncora morta nos dois destinos, e justamente
//     nas telas cujo assunto é levar a outro lugar.
//
// Os três são verificáveis por máquina, e nenhum deles dá erro em tempo de
// execução — é por isso que atravessaram semanas.

const alvosDeTemplate = new Set(
  (templates.projetos ?? []).flatMap((proj) =>
    (proj.templates ?? []).map((t) => `${proj.id}/${t.id}`),
  ),
);

// As classes que o Trilho A realmente desenha. A folha é gerada, então pode não
// existir ainda numa árvore limpa — sem ela a checagem se cala, em vez de
// reprovar por um arquivo ausente. A classe .ic não mora na folha: vem de
// tools/lib/icon-css.mjs, injetada por quem emite a marcação.
//
// É UMA SÓ. Eram cinco — ic, ic-sm, ic-md, ic-lg, ic-xl — e ter cinco era o
// convite para a marcação escolher o tamanho do ícone peça a peça: o mesmo
// selo saía com 14px numa tela e 16 em outra. Hoje o degrau é do PAPEL e sai
// da folha; a marcação escreve `class="ic"` e pronto. O portão de degrau
// abaixo é o que impede a escolha de voltar por marcação nova.
const CSS_TRILHO_A = join(ROOT, 'dist', 'css', 'ucam.css');
const classesDoTrilhoA = existsSync(CSS_TRILHO_A)
  ? new Set([
      ...[...readFileSync(CSS_TRILHO_A, 'utf8').matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]),
      'ic',
    ])
  : null;

/** Degrau de ícone escrito na marcação. Não existe mais: quem decide é o papel. */
const DEGRAU_DE_ICONE = /\bic-(?:sm|md|lg|xl|\d+)\b/;

// Elementos que não levam fechamento, para a conta de balanceamento.
const VAZIOS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'source', 'track', 'wbr', 'use', 'path', 'circle', 'rect']);

const TAGS = /<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>/g;
const CLASSES = /class=['"]([^'"]*)['"]/g;
const HREFS = /href=['"]([^'"]+)['"]/g;
const ROTA = /^#\/templates\/([a-z0-9-]+\/[a-z0-9-]+)$/;

/**
 * As duas checagens que valem para QUALQUER marcação da spec: ela fecha, e
 * toda classe do design system que ela usa é desenhada pelo Trilho A.
 *
 * Virou função porque a segunda clientela é demos.json. O buraco: a 4d só
 * varria templates.json, e o preview da demo — que é o que o catálogo desenha
 * no card e na página do componente — passava sem conferência nenhuma. Foi por
 * ali que `ucam-choice-card__figura` viveu semanas, e é por ali que
 * `ucam-tooltip` entrou na spec antes de o gerador emitir uma linha sequer.
 */
function conferaMarcacao(onde, html) {
  const pilha = [];
  let quebra = null;
  for (const m of html.matchAll(TAGS)) {
    const [, fecha, tag, auto] = m;
    if (VAZIOS.has(tag) || auto) continue;
    if (!fecha) { pilha.push(tag); continue; }
    const topo = pilha.pop();
    if (topo !== tag && !quebra) {
      quebra = topo ? `fecha </${tag}> com <${topo}> aberto` : `fecha </${tag}> sem nada aberto`;
    }
  }
  if (quebra) falha(onde, `marcação não fecha: ${quebra}`);
  else if (pilha.length) falha(onde, `marcação não fecha: <${pilha.join('>, <')}> sem fechamento`);

  if (!classesDoTrilhoA) return;
  const usadas = new Set(
    [...html.matchAll(CLASSES)].flatMap((m) => m[1].split(/\s+/)).filter(Boolean),
  );
  for (const c of [...usadas].sort()) {
    if (!/^ucam-|^ic(-|$)/.test(c)) continue;
    if (DEGRAU_DE_ICONE.test(c)) {
      falha(
        onde,
        `escreve o degrau do ícone na marcação (.${c}). O tamanho é do PAPEL e sai da folha — ` +
          `escreva class="ic" e, se o papel novo precisar de outro degrau, declare-o na seção ` +
          `"escala de ícone por papel" de tools/build-css.mjs`,
      );
      continue;
    }
    if (classesDoTrilhoA.has(c)) continue;
    falha(onde, `usa a classe .${c}, que o Trilho A não desenha — não pinta nada`);
  }
}

for (const projeto of templates.projetos ?? []) {
  for (const t of projeto.templates ?? []) {
    const onde = `templates.json (${projeto.id}/${t.id})`;
    const html = t.preview ?? '';
    if (!html) { falha(onde, 'não tem preview — a tela não existe'); continue; }

    // --- a marcação fecha, e toda classe do design system pinta? ---
    conferaMarcacao(onde, html);

    // --- todo link interno chega a alguma tela? ---
    for (const m of html.matchAll(HREFS)) {
      const u = m[1];
      if (u.startsWith('#i-')) continue; // referência a ícone do sprite
      const rota = u.match(ROTA);
      if (!rota) {
        falha(onde, `href "${u}" fora da convenção — use #/templates/<projeto>/<tela>, que é a rota que religaPreview() reescreve`);
        continue;
      }
      if (!alvosDeTemplate.has(rota[1])) {
        falha(onde, `href aponta para "${rota[1]}", que não é uma tela declarada`);
      }
    }
  }
}

/* -------------------------------------------- 4e. escada de maturidade --- */
//
// Até 09/09/2026 o campo `status` tinha quatro valores possíveis e critério
// escrito para UM deles. O resultado previsível: os 46 contratos em `draft`,
// um rótulo idêntico em toda parte, que não separa o que já dá para usar do
// que ainda vai mudar. Rótulo que nunca varia não é informação.
//
// A escada está descrita no schema. Aqui ela é COBRADA, para `review` não
// virar carimbo: um contrato que sobe e depois perde uma das condições —
// alguém apaga o `quando_usar`, o wrapper do Trilho B some, uma variante
// deixa de ter tinta — cai no portão em vez de continuar anunciando maturidade
// que já não tem.
//
// `stable` não é cobrado aqui de propósito: o critério dele é DOIS CONSUMIDORES
// REAIS EM PRODUÇÃO, que este repositório não tem como medir. Fica como
// afirmação humana, e o bloco 2 já impede que um stable dependa de draft.
const CAMPOS_DE_REVIEW = ['evidencia', 'quando_usar', 'anatomia', 'props', 'estados', 'limites',
  'acessibilidade', 'conteudo', 'composicao', 'migracao', 'exemplos', 'boas_praticas', 'vs'];

const temConteudo = (v) =>
  v !== undefined && (Array.isArray(v) ? v.length > 0 : Object.keys(v ?? {}).length > 0);

const DIR_WRAPPERS = join(ROOT, 'ui/projects/ui/src/lib/ucam');
const wrappers = existsSync(DIR_WRAPPERS) ? new Set(readdirSync(DIR_WRAPPERS)) : null;

const emTela = new Set();
for (const projeto of templates.projetos ?? []) {
  for (const t of projeto.templates ?? []) {
    const alvo = `${t.codigo ?? ''}${t.preview ?? ''}`;
    for (const { spec } of components) {
      if (spec.selector.startsWith('[')) continue;
      if (alvo.includes(`<${spec.selector}`)) emTela.add(spec.id);
    }
  }
}

for (const { file, spec } of components) {
  if (spec.status !== 'review' && spec.status !== 'stable') continue;

  const faltando = CAMPOS_DE_REVIEW.filter((k) => !temConteudo(spec[k]));
  if (faltando.length) {
    falha(file, `está ${spec.status} com campo vazio: ${faltando.join(', ')} — a escada exige o contrato completo`);
  }
  // Sem a pasta da biblioteca por perto (checkout só da spec) a condição não é
  // verificável: melhor não cobrar do que cobrar errado.
  if (wrappers && !wrappers.has(spec.id)) {
    falha(file, `está ${spec.status} sem wrapper do Trilho B em ui/projects/ui/src/lib/ucam/${spec.id}`);
  }
  if (!emTela.has(spec.id)) {
    falha(file, `está ${spec.status} sem aparecer em nenhuma tela de templates.json — nada demonstra o componente`);
  }
}

/* -------------------------------------------- 4b. vocabulário de estados --- */
// Estado inventado localmente é divergência silenciosa: o contrato diz uma
// coisa, o modelo de estados diz outra, e a precedência deixa de valer.

const states = read('states.json');
const estadosConhecidos = new Set(states.estados.map((e) => e.id));

// Estado de domínio (empty, checked, sticky, com-foto...) descreve o CONTEÚDO
// e é livre — cada componente tem os seus, e manter whitelist disso só produz
// manutenção sem retorno.
//
// O que precisa ser vigiado é o estado de INTERAÇÃO: se alguém escreve "focus"
// em vez de "focus-visible", ou "hovered" em vez de "hover", a tabela de
// precedência deixa de valer em silêncio. A regra: quem menciona um conceito
// de interação tem de usar o nome exato.
const CONCEITOS = ['focus', 'hover', 'active', 'disabled', 'loading', 'default'];

for (const { file, spec } of components) {
  for (const e of spec.estados) {
    if (estadosConhecidos.has(e)) continue;
    const conceito = CONCEITOS.find((c) => e.toLowerCase().includes(c));
    if (!conceito) continue; // estado de domínio, livre
    const oficial = states.estados.find((s) => s.id.includes(conceito))?.id;
    falha(file, `estado "${e}" parece variação de interação; o vocabulário oficial é "${oficial}" (states.json)`);
  }
}

// SINÔNIMO DE ESTADO (13/09/2026).
//
// O bloco acima vigia os seis estados de INTERAÇÃO, e só em inglês: o
// "carregando" do avatar passava porque não contém "loading", e a precedência
// deixava de valer para ele em silêncio. Os estados de domínio, livres por
// desenho, tinham derivado para duas línguas — o menu dizia "aberto" e o
// diálogo "open", a aba "selecionada" e a linha "selected". Nove contratos.
//
// A regra não fecha o vocabulário: só recusa o SINÔNIMO EXATO de um termo que
// o sistema já nomeou (states.json, vocabulario). Estado composto, como
// "nav-sobreposta-aberta", continua livre.
const vocabulario = states.vocabulario ?? { termos: [], ambiguos: [] };
const sinonimoDe = new Map();
for (const t of vocabulario.termos) for (const s of t.sinonimos) sinonimoDe.set(s, t.id);
const ambiguo = new Map();
for (const a of vocabulario.ambiguos ?? []) for (const x of [a.termo, ...(a.tambem ?? [])]) ambiguo.set(x, a.opcoes);

for (const { file, spec } of components) {
  for (const e of spec.estados) {
    if (sinonimoDe.has(e)) {
      falha(file, `estado "${e}" é sinônimo de "${sinonimoDe.get(e)}" — use o nome do vocabulário (states.json)`);
    } else if (ambiguo.has(e)) {
      falha(file, `estado "${e}" é ambíguo: ${ambiguo.get(e)} (states.json)`);
    }
  }
}

if (states.precedencia.ordem.length !== states.estados.length) {
  falha('states.json', 'a ordem de precedência não cobre todos os estados declarados');
}

/* ------------------------------- 4f. as fundações que não são token --- */
// writing.json, dataviz.json, formats.json e density.json descrevem fundações
// que não saem de tokens: elas APONTAM para o resto do spec — para um contrato,
// para uma ADR, para um token de tamanho. Um ponteiro quebrado aqui não faz o
// build falhar sozinho: a página renderiza o id cru no lugar do nome e ninguém
// vê. Este bloco cobra os ponteiros.

const escrita = read('writing.json');
const dataviz = read('dataviz.json');
const formats = read('formats.json');
const density = read('density.json');

const idsDeAdr = adrIds;

// Toda peça de texto aponta o componente que a desenha.
for (const f of escrita.formas) {
  if (!ids.has(f.componente)) {
    falha('writing.json', `forma "${f.id}" aponta componente inexistente "${f.componente}"`);
  }
}
for (const p of escrita.principios) {
  if (p.adr && !idsDeAdr.has(p.adr)) {
    falha('writing.json', `princípio "${p.id}" cita ${p.adr}, que não existe em decisions/adr.json`);
  }
}

// A fundação de Escrita SOMA o bloco `conteudo` dos contratos — se um contrato
// deixar de ter o bloco, a página passa a somar menos sem dizer nada.
for (const { file, spec } of components) {
  if (!spec.conteudo) {
    falha(file, 'sem bloco "conteudo": a fundação de Escrita agrega os 46 e este sairia da conta em silêncio');
  }
}

// O veículo de cada pergunta de dado é um contrato de verdade.
for (const v of dataviz.veiculos) {
  if (!ids.has(v.componente)) {
    falha('dataviz.json', `veículo de "${v.pergunta}" aponta componente inexistente "${v.componente}"`);
  }
}
if (!idsDeAdr.has(dataviz.portao.adr)) {
  falha('dataviz.json', `o portão cita ${dataviz.portao.adr}, que não existe`);
}
// A paleta de série tem seis slots, e a fundação promete seis.
const slotsDeSerie = Object.keys(semantic.color.chart ?? {}).filter((k) => !k.startsWith('$'));
if (slotsDeSerie.length !== 6) {
  falha('dataviz.json', `a fundação declara seis slots de série e semantic.json tem ${slotsDeSerie.length}`);
}

// Os componentes que têm licença para formatar existem.
for (const e of formats.onde_formata.excecoes) {
  if (!ids.has(e.componente)) {
    falha('formats.json', `exceção aponta componente inexistente "${e.componente}"`);
  }
}

// Todo papel de altura cita token de tamanho que existe — é o valor que a
// página imprime, e um token errado imprimiria vazio.
for (const p of density.alturas.papeis) {
  for (const [, nome] of p.token.matchAll(/size\.([a-z0-9-]+)/g)) {
    if (!semantic.size?.[nome]) {
      falha('density.json', `papel de altura cita size.${nome}, que não existe em semantic.json`);
    }
  }
}

/* ---------------------------------------------------- 5. demos (stories) --- */

const demos = read('demos.json').demos;

for (const id of Object.keys(demos)) {
  if (!ids.has(id)) falha('demos.json', `demo "${id}" não corresponde a nenhum contrato`);
}
for (const { file, spec } of components) {
  const d = demos[spec.id];
  if (!d) { avisa(file, 'não tem demo em demos.json — o site mostra a página sem preview'); continue; }
  if (!d.principal?.codigo) falha('demos.json', `"${spec.id}" não tem demo principal`);
  if (!d.instalacao) avisa('demos.json', `"${spec.id}" não tem comando de instalação`);

  // O preview da demo é a MINIATURA do catálogo e o desenho da página do
  // componente. Mesma conferência da 4d: marcação que fecha e classe que pinta.
  for (const [i, demo] of [d.principal, ...(d.exemplos ?? [])].filter(Boolean).entries()) {
    const html = demo.preview ?? '';
    if (!html) continue;
    conferaMarcacao(`demos.json (${spec.id}${i ? ` · exemplo ${i}` : ''})`, html);
  }

  // O código da demo não pode citar prop que o contrato não declara.
  const props = new Set(spec.props.map((p) => p.nome));
  const eventos = new Set((spec.eventos ?? []).map((e) => e.nome));
  const todas = [d.principal, ...(d.exemplos ?? [])].filter(Boolean);

  // Contrato de DIRETIVA fica de fora desta conferência. O seletor é [nome], e
  // o elemento hospedeiro carrega os atributos DELE — class, href, type. Num
  // componente, atributo não declarado é prop inventada; numa diretiva não é
  // evidência de nada, e tratar como erro reprova a demo certa: o <a href> do
  // exemplo de tooltip foi reprovado por usar "href", que de fato não é prop
  // do tooltip nem tem por que ser.
  //
  // Pior que não conferir, porém, era conferir errado. `new RegExp('<[ucamTooltip]')`
  // monta uma CLASSE DE CARACTERES: casava com <a, <p, <ul e qualquer tag cuja
  // inicial estivesse entre as letras do nome da diretiva.
  const ehDiretiva = spec.selector.startsWith('[');
  for (const demo of ehDiretiva ? [] : todas) {
    const tag = new RegExp(`<${spec.selector}\\b[^>]*`, 'g');
    for (const m of (demo.codigo ?? '').matchAll(tag)) {
      // Angular distingue entrada de saída pela sintaxe: [x]= e x= são
      // entradas, (x)= é saída e [(x)]= é two-way, que exige os dois.
      for (const attr of m[0].matchAll(/(\[\(|\(|\[|\s)([a-zA-Z][a-zA-Z0-9]*)(\)\]|\)|\])?=/g)) {
        const abre = attr[1].trim();
        const nome = attr[2];
        if (nome.startsWith('ng') || nome.startsWith('attr') || nome === 'class' || nome === 'style') continue;

        if (abre === '[(') {
          if (!props.has(nome)) falha('demos.json', `"${spec.id}" faz two-way em "${nome}", que não é prop do contrato`);
          if (!eventos.has(nome + 'Change')) falha('demos.json', `"${spec.id}" faz two-way em "${nome}" mas o contrato não declara o evento "${nome}Change"`);
        } else if (abre === '(') {
          if (!eventos.has(nome)) falha('demos.json', `"${spec.id}" escuta o evento "${nome}", que não existe no contrato`);
        } else if (!props.has(nome)) {
          falha('demos.json', `"${spec.id}" usa a prop "${nome}", que não existe no contrato`);
        }
      }
    }
  }
}

/* --------------------------------- 6. a raiz do Trilho A vira CSS mesmo? --- */
// O contrato declara, em implementacao.trilho_a.raiz, a classe que a camada
// CSS entrega. Ninguém conferia se ela existe na folha — e três contratos
// declararam raiz que o gerador nunca emitiu:
//
//   · ucam-tooltip, declarada em 06/09/2026, emitida em 09/09;
//   · ucam-input-group e ucam-file-field, as duas emitidas em 09/09/2026
//     depois de aparecerem como card sem miniatura no catálogo.
//
// Nos três o sintoma foi o mesmo e é o pior tipo: nada quebra. A classe não
// casa com regra nenhuma, o navegador não reclama, o elemento aparece nu — e
// quem lê o contrato continua acreditando que o legado tem o componente.
//
// A 4d pega o caso em que a MARCAÇÃO usa uma classe inexistente. Esta seção
// pega o anterior: o contrato PROMETE a classe e ninguém a escreveu.

// E o buraco que ficou entre as duas: quem NÃO DECLARA o campo escapa das
// duas. Dezoito contratos o omitiam — button, checkbox, select, menu, dialog e
// data-table entre eles, os mais usados do catálogo — e ninguém conferia raiz
// nenhuma neles. O combobox é a prova de que o campo some sem barulho: o
// comentário acima o cita como exemplo de "não entrega" e o campo já não
// estava mais lá quando isto foi escrito. Omitir passou a ser falha.
//
// COMO A RAIZ É LIDA. O campo é prosa de propósito — há componente que é duas
// classes ("o wrap mais a tabela") e componente que é marcação inteira
// ("<ol class='ucam-stepper'>"). Então lê-se das duas formas: `.classe` e
// `class="a b"`. A heurística antiga era só a primeira, e por isso quatro
// contratos que declaram raiz DE VERDADE — app-shell, choice-card, stepper e
// timeline — caíam no ramo de "não entrega" e nunca foram conferidos. Um deles
// promete `ucam-shell`, que é a moldura de toda tela do parque.

const SEM_TRILHO_A = 'não entrega';

if (classesDoTrilhoA) {
  for (const { file, spec } of components) {
    const raiz = spec.implementacao?.trilho_a?.raiz;

    if (typeof raiz !== 'string' || !raiz.trim()) {
      falha(
        file,
        `não declara implementacao.trilho_a.raiz — sem ela ninguém confere se o @ucam/css entrega este componente. Declare a classe raiz, ou "${SEM_TRILHO_A}" se a camada CSS realmente não o tem`,
      );
      continue;
    }

    // A ÚNICA saída é a frase exata. Antes bastava não ter ponto, e aí
    // qualquer descuido de escrita virava dispensa silenciosa.
    if (raiz.trim() === SEM_TRILHO_A) continue;

    const classes = new Set([
      ...[...raiz.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]),
      ...[...raiz.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].trim().split(/\s+/)),
    ]);

    if (!classes.size) {
      falha(
        file,
        `declara uma raiz de Trilho A em que não há classe nenhuma ("${raiz}") — escreva a classe (.ucam-algo) ou "${SEM_TRILHO_A}"`,
      );
      continue;
    }

    for (const classe of classes) {
      if (classesDoTrilhoA.has(classe)) continue;
      falha(
        file,
        `declara .${classe} como raiz do Trilho A, e @ucam/css não emite essa classe — o contrato promete um componente que a camada CSS não tem`,
      );
    }
  }
}

/* ------------------------------- 6b. e as PARTES da anatomia, elas existem? --- */
// A seção acima confere a raiz. Esta desce um degrau: cada parte da anatomia
// nomeia a classe que a desenha, e ninguém conferia essas — oito partes
// citavam classe que nenhuma das duas camadas escrevia.
//
// O sintoma é o pior de todos, porque a anatomia é o que alguém LÊ para
// escrever markup legado: o contrato do gráfico prometia .ucam-chart__legenda
// e .ucam-chart__dica (a ZardUI desenha as duas por dentro, sem classe nossa)
// e deixava sem classe a .ucam-chart__tabela, que existe. Quem seguisse a
// anatomia escreveria três classes: duas mortas e nenhuma da que funciona.
//
// CONFERE CONTRA AS DUAS CAMADAS, e não só contra o CSS. Componente que
// declara "não entrega" no Trilho A — o gráfico e a paleta de comandos — tem
// anatomia mesmo assim, e ela descreve o wrapper Angular. Cobrar a folha ali
// seria cobrar da camada errada. A pergunta certa é: ALGUÉM escreve esta
// classe? Se nenhuma das duas escreve, o contrato promete uma parte
// endereçável que não existe.

const FONTE_TRILHO_B = join(ROOT, 'ui/projects/ui/src/lib/ucam');
const classesDoTrilhoB = existsSync(FONTE_TRILHO_B)
  ? (() => {
      const achadas = new Set();
      const anda = (dir) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const p = join(dir, e.name);
          if (e.isDirectory()) anda(p);
          else if (/\.(ts|html|css)$/.test(e.name)) {
            for (const m of readFileSync(p, 'utf8').matchAll(/\bucam-[a-z][\w-]*/g)) achadas.add(m[0]);
          }
        }
      };
      anda(FONTE_TRILHO_B);
      return achadas;
    })()
  : null;

if (classesDoTrilhoA && classesDoTrilhoB) {
  for (const { file, spec } of components) {
    for (const parte of spec.anatomia ?? []) {
      if (!parte.classe) continue;
      for (const classe of String(parte.classe).trim().split(/\s+/).filter(Boolean)) {
        if (classesDoTrilhoA.has(classe) || classesDoTrilhoB.has(classe)) continue;
        falha(
          file,
          `anatomia: a parte "${parte.parte}" declara .${classe}, e nenhuma das duas camadas escreve essa classe — nem @ucam/css, nem o wrapper em ui/. Ou a parte tem outro nome, ou ela não é endereçável e o campo classe deve sair`,
        );
      }
    }
  }
}

/* ------------------------------------------------ vocabulário de variante --- */
/* Os nomes que o contrato declara existem nos DOIS trilhos?
 *
 * Pedido pela ADR-020, que o nomeou e não o escreveu. O caso que o motivou:
 * o badge declarava variant: soft | solid | dot; o CSS entregava contorno no
 * padrão, preenchimento sob --cheio e nenhum ponto; o Angular entregava
 * soft | dot com soft sendo o contorno. Três camadas, três vocabulários, e
 * "solid" não existindo em nenhuma delas. Junto vieram um size: sm | md que
 * nunca teve tinta, o selectable do data-table e o width=min do ColumnDef.
 *
 * É o quinto buraco do mesmo feitio — a spec prometendo e nada conferindo —
 * depois de contratos sem validação, daltonismo em prosa (ADR-016), hidden
 * perdendo para o display (ADR-017) e output com nome de evento (ADR-018).
 *
 * AVISA, não reprova: um valor recém-declarado antes da implementação é
 * trabalho em curso legítimo num catálogo inteiro em draft. O que não pode é
 * ser invisível.
 *
 * Só olha valores que o contrato descreveu em `valores` — é a declaração de
 * que aquele nome é uma variante de verdade, e não um parâmetro qualquer. O
 * valor DEFAULT é pulado no Trilho A: por convenção o padrão não tem
 * modificador, ele é o que a classe-raiz já desenha. */

for (const { file, spec } of components) {
  const id = spec.id;
  for (const prop of spec.props ?? []) {
    if (!prop.valores) continue;
    const padrao = String(prop.default ?? '').replace(/'/g, '');

    // Só valem os valores que estão na UNIÃO DE TIPO. Vários contratos usam
    // `valores` para documentar estados que não são literais — o pressed do
    // icon-button descreve "null" e "true/false", que são a forma do boolean
    // e não nomes de variante. Cobrar tinta para eles seria ruído, e um portão
    // que grita à toa é um portão que ninguém lê.
    const literais = new Set(
      [...String(prop.tipo ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]),
    );
    if (!literais.size) continue;

    for (const [valor, corpo] of Object.entries(prop.valores)) {
      if (!literais.has(valor)) continue;
      // --- Trilho B: o valor aparece como literal no fonte do componente?
      const ts = join(ROOT, 'ui', 'projects', 'ui', 'src', 'lib', 'ucam', id, `ucam-${id}.ts`);
      if (existsSync(ts)) {
        const fonte = readFileSync(ts, 'utf8');
        // Literal aspado, ou CHAVE de objeto sem aspas: o skeleton declara as
        // formas como { heading: ..., block: ... }, e cobrar aspas ali
        // acusaria de ausente o que está implementado a três linhas de
        // distância. A chave só é procurada quando o valor é um
        // identificador válido — "table-row" não pode aparecer sem aspas.
        const identificador = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(valor);
        // Varredura LITERAL, e nao regex montada em string: dentro de um
        // template literal a barra e consumida antes de a regex existir, e o
        // portao passa a nunca casar — calado, que e o pior modo de falhar.
        const comoChave =
          identificador &&
          (() => {
            const alvo = valor + ':';
            for (let i = fonte.indexOf(alvo); i >= 0; i = fonte.indexOf(alvo, i + 1)) {
              if (i === 0) return true;
              const c = fonte[i - 1];
              if (c === '{' || c === ',' || fonte.charCodeAt(i - 1) <= 32) return true;
            }
            return false;
          })();
        if (!fonte.includes(`'${valor}'`) && !fonte.includes(`"${valor}"`) && !comoChave) {
          avisa(
            file,
            `${prop.nome}: "${valor}" é declarado no contrato e não aparece em ucam-${id}.ts — o Trilho B não conhece esse nome`,
          );
        }
      }

      // --- Trilho A: existe classe para o valor? O padrão não precisa de uma.
      // --- Trilho A: existe classe para o valor? O padrao nao precisa de uma.
      //
      // So cobra tinta de quem PROMETE tinta. O contrato declara `tokens` no
      // valor quando ele tem tratamento visual proprio; sem isso o valor e
      // comportamento, nao aparencia — o live do alert e atributo ARIA, o
      // order da timeline e ordenacao de dados, o selection do choice-card
      // troca radio por checkbox. Nenhum desses tem classe porque nenhum
      // deveria ter, e cobrar uma seria ensinar a ignorar o portao.
      if (!classesDoTrilhoA || valor === padrao) continue;
      if (!corpo?.tokens && !corpo?.classe) continue;
      if (!classesDoTrilhoA.has(`ucam-${id}`)) continue;
      const bruta = corpo?.classe ?? `ucam-${id}--${valor}`;
      const esperada = bruta.startsWith(".") ? bruta.slice(1) : bruta;
      if (classesDoTrilhoA.has(esperada)) continue;

      // A convenção falhou. Antes de acusar, procura o modificador em
      // QUALQUER classe da família — o tom do progress mora em
      // .ucam-progress__fill--info, num elemento interno, e está tão
      // implementado quanto se estivesse na raiz.
      const naFamilia = [...classesDoTrilhoA].some(
        (c) => c.startsWith(`ucam-${id}`) && c.endsWith(`--${valor}`),
      );
      if (naFamilia) continue;

      avisa(
        file,
        `${prop.nome}: "${valor}" não acha tinta no Trilho A — nem .${esperada}, nem nada da família .ucam-${id}* terminando em --${valor}. Se a classe existe com outro nome, declare-a em valores.${valor}.classe`,
      );
    }
  }
}

/* ----------------------------------------------------------- relatório --- */

const N = (n, s, p) => `${n} ${n === 1 ? s : p}`;

console.log(`spec/ — ${N(components.length, 'contrato', 'contratos')}, ${N(adrs.length, 'ADR', 'ADRs')}, ${N(patterns.length, 'padrão', 'padrões')}\n`);

if (avisos.length) {
  console.log(`⚠ ${N(avisos.length, 'aviso', 'avisos')} (não bloqueiam):`);
  const porArquivo = {};
  for (const a of avisos) (porArquivo[a.arquivo] ??= []).push(a.msg);
  for (const [f, msgs] of Object.entries(porArquivo)) {
    console.log(`  ${f}`);
    for (const m of msgs) console.log(`    · ${m}`);
  }
  console.log('');
}

if (erros.length) {
  console.error(`✗ ${N(erros.length, 'erro', 'erros')}:`);
  const porArquivo = {};
  for (const e of erros) (porArquivo[e.arquivo] ??= []).push(e.msg);
  for (const [f, msgs] of Object.entries(porArquivo)) {
    console.error(`  ${f}`);
    for (const m of msgs) console.error(`    · ${m}`);
  }
  process.exit(1);
}

console.log('✓ todos os contratos válidos');
