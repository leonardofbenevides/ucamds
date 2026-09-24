// Gera o pacote de dados que o site consome.
//
//   node tools/build-index.mjs
//
// Saída: site/src/generated/spec.data.json
//
// O site não lê spec/ em tempo de execução e não tem conteúdo escrito à mão.
// Ele importa este arquivo, já resolvido e com os contrastes calculados — o
// mesmo cálculo que o portão de build de tools/build-tokens.mjs usa, porque
// ambos importam tools/lib/wcag.mjs.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { contrast, grade } from './lib/wcag.mjs';
import { listboxSelects, listboxScript } from './lib/select-listbox.mjs';
import { menuContaScript, estadoScript, descricaoScript, linhaDoTempoScript, abasScript } from './lib/shell.mjs';
import { iconCss } from './lib/icon-css.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = join(ROOT, 'spec');
const read = (p) => JSON.parse(readFileSync(join(SPEC, p), 'utf8'));

const primitive = read('tokens/primitive.json');
const semantic = read('tokens/semantic.json');
const dark = read('tokens/theme.dark.json');
const recursos = read('resources.json');
const adrs = read('decisions/adr.json').decisions;
const demos = read('demos.json').demos;
const padroes = read('patterns/patterns.json').patterns;
const layouts = read('layouts.json');
const projetos = read('templates.json').projetos;
const migracao = read('migracao.json');
const iconesSpec = read('icons.json');
const estadosSpec = read('states.json');
const escritaSpec = read('writing.json');
const dadosSpec = read('dataviz.json');
const formatosSpec = read('formats.json');
const densidadeSpec = read('density.json');

// A demo entra no contrato aqui, já resolvida: a página do componente mostra
// o exemplo antes de qualquer prosa e não vai ler dois arquivos para isso. O
// preview passa por listboxSelects porque o Select é markup, não CSS: a
// ADR-011 aposentou o <select> nativo, e o preview tem de mostrar o
// componente que existe — não o que saiu.
const comPreview = (d) => (d?.preview ? { ...d, preview: listboxSelects(d.preview) } : d);

function demoDe(id) {
  const d = demos[id];
  if (!d) return undefined;
  return {
    ...d,
    principal: comPreview(d.principal),
    exemplos: (d.exemplos ?? []).map(comPreview),
    // Retrato do catálogo, para quem não tem preview. Passa por listboxSelects
    // pelo mesmo motivo do preview: um <select> ali seria o controle aposentado.
    ...(d.miniatura ? { miniatura: listboxSelects(d.miniatura) } : {}),
  };
}

const componentes = readdirSync(join(SPEC, 'components'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => read(join('components', f)))
  .map((c) => ({ ...c, demo: demoDe(c.id) }))
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

/* ------------------------------------------- disponibilidade por trilho ---
   Em qual dos três trilhos cada contrato EXISTE hoje.

   Tudo aqui é DERIVADO das fontes que mandam, nunca declarado numa lista à
   parte: um componente entra e sai sozinho no dia em que a fonte muda. As
   três perguntas e quem as responde:

     Trilho A   o gerador de demos emitiu preview em CSS puro?
     Trilho A+  a tag está no REGISTRO de elements/src/main.ts?
     Trilho B   o id é reexportado por ui/.../public-api.ts?

   O Trilho B era medido pela EXISTÊNCIA DA PASTA em lib/ucam/, e pasta não é
   API: kbd, link, prazo e radio-group têm o arquivo do componente escrito e
   não saem no public-api.ts — nenhuma aplicação consegue importá-los, e o
   site dizia que os 49 estavam prontos. Quem decide o que uma aplicação
   alcança é o barril, então é o barril que se lê. */

/** Ids exportados por @ucam/ui. Vazio se a lib não estiver no workspace. */
function idsDoTrilhoB() {
  const API = join(ROOT, 'ui', 'projects', 'ui', 'src', 'public-api.ts');
  if (!existsSync(API)) return null;
  const fonte = readFileSync(API, 'utf8');
  return new Set([...fonte.matchAll(/\.\/lib\/ucam\/([a-z0-9-]+)'/g)].map((m) => m[1]));
}

/** Tags registradas pelo bundle de custom elements do Trilho A+. */
function idsDoTrilhoAMais() {
  const MAIN = join(ROOT, 'elements', 'src', 'main.ts');
  if (!existsSync(MAIN)) return null;
  const fonte = readFileSync(MAIN, 'utf8');
  const bloco = fonte.match(/const REGISTRO[^=]*=\s*\[([\s\S]*?)\];/);
  if (!bloco) return null;
  // A tag é ucam-button; o id do contrato é button. O prefixo é o mesmo para
  // os seis, então tirá-lo basta — não há mapa a manter.
  return new Set([...bloco[1].matchAll(/'ucam-([a-z0-9-]+)'/g)].map((m) => m[1]));
}

const EXPORTADOS = idsDoTrilhoB();
const REGISTRADOS = idsDoTrilhoAMais();

/**
 * Os três trilhos de um contrato, na ordem em que a home os apresenta.
 *
 * `disponivel: null` quer dizer "não dá para saber daqui" — a fonte não está
 * no workspace. É diferente de `false`, que afirma ausência, e a página
 * precisa dessa diferença para não prometer nem negar o que não mediu.
 */
function trilhosDe(c) {
  const temPreview = Boolean(c.demo?.principal?.preview);
  return [
    {
      id: 'a',
      rotulo: 'Trilho A',
      meio: 'CSS puro',
      disponivel: temPreview,
      detalhe: c.implementacao?.trilho_a?.raiz ?? null,
    },
    {
      id: 'a-mais',
      rotulo: 'Trilho A+',
      meio: 'bundle de elements',
      disponivel: REGISTRADOS ? REGISTRADOS.has(c.id) : null,
      detalhe: REGISTRADOS?.has(c.id) ? c.selector : null,
    },
    {
      id: 'b',
      rotulo: 'Trilho B',
      meio: '@ucam/ui',
      disponivel: EXPORTADOS ? EXPORTADOS.has(c.id) : null,
      detalhe: EXPORTADOS?.has(c.id) ? c.selector : null,
    },
  ];
}

// Contratos que o Trilho B ainda não implementa — agora pelo barril, não pela
// pasta. Ver a nota acima.
function semAngular() {
  if (!EXPORTADOS) return [];
  return componentes
    .filter((c) => !EXPORTADOS.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, selector: c.selector }));
}

// Só AQUI, e não junto da lista: trilhosDe() lê EXPORTADOS e REGISTRADOS, que
// são const declaradas acima — chamá-la antes cai na zona morta temporal.
for (const c of componentes) c.trilhos = trilhosDe(c);

/* Quantos contratos cada trilho entrega HOJE. Sai da mesma derivação que
   alimenta a matriz no topo de cada componente, então os dois números nunca
   discordam: a home diz 46 e a página do Kbd diz que o Trilho B não o tem,
   e as duas afirmações vêm do mesmo lugar. */
for (const t of recursos.instalacao?.trilhos ?? []) {
  t.componentes = componentes.filter((c) => c.trilhos.some((x) => x.id === t.id && x.disponivel)).length;
}

const slug = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ----------------------------------------------------------- resolução --- */

function resolvePrimitive(ref) {
  if (typeof ref !== 'string' || !ref.startsWith('{')) return ref;
  const path = ref.replace(/[{}]/g, '').split('.');
  let node = primitive;
  for (const k of path) node = node?.[k];
  return node?.$value ?? null;
}

// Achata uma subárvore de cor em [{ token, ref, hex, descricao }].
function flattenColors(node, trail) {
  const out = [];
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith('$') || key.startsWith('_')) continue;
    if (val && typeof val === 'object' && '$value' in val) {
      out.push({
        token: [...trail, key].join('.'),
        ref: val.$value,
        hex: resolvePrimitive(val.$value),
        descricao: val.$description ?? '',
      });
    } else if (val && typeof val === 'object') {
      out.push(...flattenColors(val, [...trail, key]));
    }
  }
  return out;
}

const corClara = flattenColors(semantic.color, ['color']);
const corEscuraOverrides = flattenColors(dark.color, ['color']);

// O tema escuro é o claro com as sobrescritas aplicadas por cima — não é um
// conjunto independente. Um token sem sobrescrita mantém o valor claro.
const nomesEscuros = new Set(corEscuraOverrides.map((c) => c.token));
const corEscura = [
  ...corClara.filter((c) => !nomesEscuros.has(c.token)),
  ...corEscuraOverrides,
].sort((a, b) => a.token.localeCompare(b.token));

/* -------------------------------------------------------------- cores --- */

const acharHex = (lista, token) => lista.find((c) => c.token === token)?.hex;

// Linhas de contraste de texto. WCAG 1.4.3 isenta componentes inativos:
// marcar `disabled` como reprova seria gritar lobo e treinar o leitor a
// ignorar a coluna inteira.
function linhasTexto(cores) {
  const surface = acharHex(cores, 'color.surface.default') ?? '#FFFFFF';
  const brand = acharHex(cores, 'color.surface.brand') ?? '#6C1E2B';

  return cores
    .filter((c) => c.token.startsWith('color.text') && c.hex)
    .map((t) => {
      const sobreMarca = t.token.includes('on-brand') || t.token.includes('on-action');
      const fundo = sobreMarca ? brand : surface;
      const razao = contrast(t.hex, fundo);
      const isento = t.token.includes('disabled');
      return {
        token: t.token,
        ref: t.ref,
        hex: t.hex,
        fundo,
        razao: Number(razao.toFixed(2)),
        wcag: isento ? { label: 'isento 1.4.3', tone: 'muted' } : grade(razao),
        isento,
        descricao: t.descricao,
      };
    });
}

// Cada cor de ação sólida carrega rótulo branco: o contraste que importa é
// contra o branco, não contra a superfície.
function linhasAcao(cores) {
  const branco = acharHex(cores, 'color.text.on-action') ?? '#FFFFFF';
  return cores
    .filter((c) => c.token.startsWith('color.action') && c.hex && !c.token.includes('border'))
    .map((t) => {
      const razao = contrast(branco, t.hex);
      return {
        token: t.token,
        hex: t.hex,
        ref: t.ref,
        razao: Number(razao.toFixed(2)),
        wcag: grade(razao),
        descricao: t.descricao,
      };
    });
}

/* -------------------------------------------------------------- rampas --- */

const rampas = Object.entries(primitive)
  .filter(([k, v]) => !k.startsWith('$') && !k.startsWith('_') && v.$type === 'color')
  .map(([nome, rampa]) => ({
    nome,
    descricao: rampa.$description ?? '',
    degraus: Object.entries(rampa)
      .filter(([k]) => !k.startsWith('$'))
      .map(([degrau, tok]) => {
        // Qual tinta se lê sobre este degrau — decidido por contraste, não por
        // chute de "claro ou escuro".
        const sobreBranco = contrast(tok.$value, '#FFFFFF');
        const sobrePreto = contrast(tok.$value, '#1A1717');
        return {
          degrau,
          valor: tok.$value,
          descricao: tok.$description ?? '',
          tinta: sobreBranco >= sobrePreto ? '#FFFFFF' : '#1A1717',
        };
      }),
  }));

/* -------------------------------------------------------- outras escalas --- */

const escalaPrimitiva = (grupo) =>
  Object.entries(primitive[grupo] ?? {})
    .filter(([k]) => !k.startsWith('$'))
    .map(([token, v]) => ({ token, valor: v.$value, descricao: v.$description ?? '' }));

const escalaSemantica = (grupo) =>
  Object.entries(semantic[grupo] ?? {})
    .filter(([k]) => !k.startsWith('$'))
    .map(([token, v]) => ({
      token,
      ref: v.$value,
      valor: resolvePrimitive(v.$value),
      descricao: v.$description ?? '',
    }));

const tipografia = Object.entries(semantic.typography)
  .filter(([k]) => !k.startsWith('$'))
  .map(([papel, v]) => ({
    papel,
    fontSize: resolvePrimitive(v.$value.fontSize),
    fontWeight: resolvePrimitive(v.$value.fontWeight),
    lineHeight: v.$value.lineHeight,
    letterSpacing: v.$value.letterSpacing ?? null,
  }));


/* --------------------------------------------------- famílias de cor --- */
// A página de Cor mostrava DUAS famílias — texto e ação — de oito que existem.
// surface, border, interaction, realce, feedback e chart estavam no token, no
// CSS e na tela de todo mundo, e em lugar nenhum da documentação: quem
// precisasse do fundo de um aviso tinha de abrir semantic.json.

// Tinta legível sobre uma amostra, decidida por contraste e não por chute de
// "claro ou escuro" — o mesmo critério das rampas primitivas.
const tintaSobre = (hex) =>
  contrast(hex, '#FFFFFF') >= contrast(hex, '#1A1717') ? '#FFFFFF' : '#1A1717';

const familiaDeCor = (cores, familia) =>
  cores
    .filter((c) => c.token.startsWith(`color.${familia}.`) && c.hex)
    .map((c) => ({
      token: c.token,
      nome: c.token.split('.').slice(2).join('.'),
      ref: c.ref,
      hex: c.hex,
      tinta: tintaSobre(c.hex),
      descricao: c.descricao,
    }));

const FAMILIAS = ['surface', 'border', 'interaction', 'realce', 'chart'];

const familias = (cores) =>
  FAMILIAS.map((f) => ({
    id: f,
    descricao: semantic.color[f]?.$description ?? '',
    amostras: familiaDeCor(cores, f),
  }));

// Feedback é a única família com PARES de tinta e fundo declarados, então é a
// única onde o contraste é verificável token contra token. Sucesso, atenção,
// erro e informação, cada um com fundo, tinta, filete e o traço de gráfico.
const feedback = (cores) =>
  ['success', 'warning', 'danger', 'info'].map((tom) => {
    const de = (parte) => cores.find((c) => c.token === `color.feedback.${tom}.${parte}`);
    const fundo = de('background');
    const tinta = de('foreground');
    const razao = fundo?.hex && tinta?.hex ? contrast(tinta.hex, fundo.hex) : null;
    return {
      tom,
      descricao: semantic.color.feedback[tom]?.$description ?? '',
      background: fundo?.hex ?? null,
      foreground: tinta?.hex ?? null,
      border: de('border')?.hex ?? null,
      graphic: de('graphic')?.hex ?? null,
      razao: razao === null ? null : Number(razao.toFixed(2)),
      wcag: razao === null ? null : grade(razao),
    };
  });

/* ------------------------------------------------------ outras fundações --- */

// Como escalaSemantica, mas para subárvore — motion.easing e motion.duration
// moram um nível abaixo do topo.
const escalaEm = (node) =>
  Object.entries(node ?? {})
    .filter(([k]) => !k.startsWith('$'))
    .map(([token, v]) => ({
      token,
      ref: v.$value,
      valor: resolvePrimitive(v.$value),
      descricao: v.$description ?? '',
    }));

const elevacao = {
  descricao: semantic.elevation.$description,
  sombras: escalaPrimitiva('shadow'),
  papeis: escalaSemantica('elevation'),
  // No escuro a sombra quase some e a separação passa a vir da superfície —
  // então o degrau de cada papel MUDA, e mostrar só o claro seria documentar
  // metade do sistema.
  escuroDescricao: dark.elevation?.$description ?? '',
  papeisEscuro: Object.entries(dark.elevation ?? {})
    .filter(([k]) => !k.startsWith('$'))
    .map(([token, v]) => ({
      token,
      ref: v.$value,
      valor: resolvePrimitive(v.$value),
      descricao: v.$description ?? '',
    })),
  camadasDescricao: semantic.z.$description,
  camadas: Object.entries(semantic.z)
    .filter(([k]) => !k.startsWith('$'))
    .map(([token, v]) => ({ token, valor: v.$value, descricao: v.$description ?? '' }))
    .sort((a, b) => a.valor - b.valor),
};

const breakpoints = {
  descricao: primitive.breakpoint.$description,
  papeisDescricao: semantic.viewport.$description,
  escala: escalaPrimitiva('breakpoint').map((d) => ({
    ...d,
    px: Math.round(parseFloat(d.valor) * 16),
  })),
  papeis: escalaSemantica('viewport').map((p) => ({
    ...p,
    px: Math.round(parseFloat(p.valor) * 16),
    degrau: p.ref.replace(/[{}]/g, '').split('.').at(-1),
  })),
  // Papéis de CONTÊINER (ADR-028): largura do painel em que o bloco vive, não
  // da janela. Não referenciam degrau primitivo — a escala de viewport é da
  // janela, e um contêiner de 52rem não é "o lg".
  contentoresDescricao: semantic.container?.$description ?? '',
  contentores: escalaSemantica('container').map((p) => ({
    ...p,
    px: Math.round(parseFloat(p.valor) * 16),
  })),
};

const movimento = {
  descricao: semantic.motion.$description,
  curvas: escalaEm(semantic.motion.easing),
  duracoes: escalaEm(semantic.motion.duration),
  curvasPrimitivas: escalaPrimitiva('easing'),
  duracoesPrimitivas: escalaPrimitiva('duration'),
};

const fontes = {
  descricao: semantic.font.$description,
  origem: primitive.fontFamily.$description,
  familias: escalaSemantica('font'),
  tamanhos: escalaPrimitiva('fontSize'),
  pesos: escalaPrimitiva('fontWeight'),
};

const icones = {
  descricao: iconesSpec.$description,
  // A CHAMADA e o RACIONAL são campos diferentes desde 22/09/2026: o lede curto
  // abre a página e o $description inteiro passou para o bloco "Por quê".
  lede: iconesSpec.$lede ?? '',
  regras: iconesSpec.regras_de_uso ?? [],
  meta: iconesSpec._meta ?? {},
  total: iconesSpec.grupos.reduce((n, g) => n + g.icones.length, 0),
  grupos: iconesSpec.grupos.map((g) => ({
    id: g.id,
    nome: g.nome,
    icones: g.icones.map((i) => ({ lucide: i.lucide, uso: i.uso ?? '' })),
  })),
};


/* ------------------------------------------------------------- estados --- */
// O modelo de estados vale para TODO componente interativo, e por isso não
// mora em contrato nenhum: repetido em quarenta e seis arquivos, divergiria no
// primeiro que alguém editasse.

const estados = {
  descricao: estadosSpec.$description,
  // A CHAMADA e o RACIONAL são campos diferentes desde 22/09/2026: o lede curto
  // abre a página e o $description inteiro passou para o bloco "Por quê".
  lede: estadosSpec.$lede ?? '',
  origem: estadosSpec._meta?.origem ?? '',
  divergencia: estadosSpec._meta?.divergencia ?? '',
  // Na ordem em que VENCEM, não na ordem em que foram declarados: a página
  // sobre precedência não pode listar os estados fora dela.
  lista: [...estadosSpec.estados].sort((a, b) => a.precedencia - b.precedencia),
  precedencia: estadosSpec.precedencia,
  disabled: estadosSpec.disabled,
  loading: estadosSpec.loading,
  movimento: estadosSpec.movimento,
};

/* ------------------------------------------------------------- escrita --- */
// A fundação de Escrita é a única que não traz o próprio conteúdo inteiro: os
// PRINCÍPIOS vêm de spec/writing.json, e o texto de cada componente continua
// morando no contrato dele, no bloco `conteudo`. Aqui os quarenta e seis são
// somados.
//
// Foi essa a razão de a fundação não existir antes: 178 regras de texto já
// estavam escritas, uma por contrato, e nenhuma página as somava. Copiá-las
// para um arquivo novo seria criar a segunda cópia — e a divergência junto.

const blocosDeConteudo = (conteudo) =>
  Object.entries(conteudo ?? {}).map(([chave, valor]) => ({
    chave,
    regras: Array.isArray(valor) ? valor : [],
    bom: Array.isArray(valor) ? [] : (valor.bom ?? []),
    ruim: Array.isArray(valor) ? [] : (valor.ruim ?? []),
  }));

const conteudoPorComponente = componentes
  .filter((c) => c.conteudo)
  .map((c) => ({
    id: c.id,
    nome: c.name,
    categoria: c.category,
    blocos: blocosDeConteudo(c.conteudo),
  }));

const somaConteudo = (campo) =>
  conteudoPorComponente.reduce(
    (n, c) => n + c.blocos.reduce((m, b) => m + b[campo].length, 0),
    0,
  );

const escrita = {
  descricao: escritaSpec.$description,
  // A CHAMADA e o RACIONAL são campos diferentes desde 22/09/2026: o lede curto
  // abre a página e o $description inteiro passou para o bloco "Por quê".
  lede: escritaSpec.$lede ?? '',
  meta: escritaSpec._meta,
  voz: escritaSpec.voz,
  principios: escritaSpec.principios,
  vocabulario: escritaSpec.vocabulario,
  // Cada forma aponta um componente; o nome dele é resolvido aqui para que a
  // página não precise cruzar duas listas na mão.
  formas: escritaSpec.formas.map((f) => ({
    ...f,
    componenteNome: componentes.find((c) => c.id === f.componente)?.name ?? f.componente,
  })),
  proibido: escritaSpec.proibido,
  porComponente: conteudoPorComponente,
  // Os números que o índice de fundações mostra, e a prova de que a soma é
  // lida e não digitada.
  totais: {
    contratos: conteudoPorComponente.length,
    regras: somaConteudo('regras'),
    bons: somaConteudo('bom'),
    ruins: somaConteudo('ruim'),
    // Contrato sem bloco de texto. Zero hoje; se algum dia deixar de ser, a
    // página diz qual — em vez de somar 45 e parecer completa.
    semConteudo: componentes.filter((c) => !c.conteudo).map((c) => c.name),
  },
};

/* ----------------------------------------------------- dados (visualização) --- */
// A fundação decide o VEÍCULO; o contrato do chart decide a forma. As formas e
// os limites são lidos do contrato, não recopiados: a pizza que hoje aceita
// três fatias aceita outro número no dia em que o portão de daltonismo disser
// outra coisa, e a página tem de mudar junto.

const chartSpec = componentes.find((c) => c.id === 'chart');
const propType = chartSpec?.props?.find((p) => p.nome === 'type');

const dados = {
  descricao: dadosSpec.$description,
  // A CHAMADA e o RACIONAL são campos diferentes desde 22/09/2026: o lede curto
  // abre a página e o $description inteiro passou para o bloco "Por quê".
  lede: dadosSpec.$lede ?? '',
  meta: dadosSpec._meta,
  veiculos: dadosSpec.veiculos.map((v) => ({
    ...v,
    componenteNome: componentes.find((c) => c.id === v.componente)?.name ?? v.componente,
  })),
  formas: Object.entries(propType?.valores ?? {}).map(([id, v]) => ({ id, ...v })),
  paleta: {
    ...dadosSpec.paleta,
    descricao: semantic.color.chart?.$description ?? '',
    slots: familiaDeCor(corClara, 'chart'),
    slotsEscuro: familiaDeCor(corEscura, 'chart'),
  },
  integridade: dadosSpec.integridade,
  equivalente: dadosSpec.equivalente,
  portao: dadosSpec.portao,
  // Os limites do contrato do chart, para que a fundação não os repita.
  limites: chartSpec?.limites ?? { regras: [], motivo: '' },
  proibido: dadosSpec.proibido,
};

/* ------------------------------------------------------------ formatos --- */

const formatos = {
  descricao: formatosSpec.$description,
  // A CHAMADA e o RACIONAL são campos diferentes desde 22/09/2026: o lede curto
  // abre a página e o $description inteiro passou para o bloco "Por quê".
  lede: formatosSpec.$lede ?? '',
  meta: formatosSpec._meta,
  fronteira: formatosSpec.fronteira,
  formatos: formatosSpec.formatos,
  regras: formatosSpec.regras_gerais,
  ondeFormata: {
    ...formatosSpec.onde_formata,
    excecoes: formatosSpec.onde_formata.excecoes.map((e) => ({
      ...e,
      componenteNome: componentes.find((c) => c.id === e.componente)?.name ?? e.componente,
    })),
  },
  evidencia: formatosSpec.evidencia,
};

/* ----------------------------------------------------------- densidade --- */
// As alturas saem do TOKEN, não do texto do spec: o papel é declarado aqui, o
// valor é lido de semantic.size. Um token que mude de medida muda a página
// sozinho, e um papel que cite token inexistente é pego pelo validador.

const valorDeSize = (token) => semantic.size?.[token]?.$value ?? null;

const densidade = {
  descricao: densidadeSpec.$description,
  // A CHAMADA e o RACIONAL são campos diferentes desde 22/09/2026: o lede curto
  // abre a página e o $description inteiro passou para o bloco "Por quê".
  lede: densidadeSpec.$lede ?? '',
  meta: densidadeSpec._meta,
  larguras: densidadeSpec.larguras,
  leitura: densidadeSpec.medida_de_leitura,
  alturas: {
    ...densidadeSpec.alturas,
    papeis: densidadeSpec.alturas.papeis.map((p) => {
      // Um papel pode citar mais de um token — os três degraus de ícone são um
      // papel só. Cada citação vira {token, valor, px}.
      const citados = [...p.token.matchAll(/size\.([a-z0-9-]+)/g)].map((m) => m[1]);
      return {
        ...p,
        tokens: citados.map((t) => {
          const valor = valorDeSize(t);
          return {
            token: t,
            valor,
            px: valor ? Math.round(parseFloat(valor) * 16) : null,
            descricao: semantic.size?.[t]?.$description ?? '',
          };
        }),
      };
    }),
  },
  alvos: densidadeSpec.alvos,
  portao: densidadeSpec.portao,
  proibido: densidadeSpec.proibido,
};

/* ------------------------------------------------------------ templates --- */
// A tela vai para o site JÁ montada no shell — o mesmo renderShell que gera
// docs/t/. Se o site montasse o próprio embrulho, voltaríamos ao problema que
// tools/lib/shell.mjs existe para resolver: cada consumidor com uma faixa.

// O shell montado NÃO vai mais para o site. A miniatura da grade de telas
// virou um iframe para a mesma página autônoma que a tela de detalhe embute —
// media query responde à viewport, e no mesmo documento as 12 miniaturas
// caíam no arranjo de tablet ou de celular junto com a janela do site.
//
// Com isso o campo saiu do spec.data.json: eram 266KB de HTML que nenhum
// código do site lia mais, num arquivo que o bundle do cliente importa
// inteiro. Quem monta o shell para valer é tools/build-templates.mjs, que
// sempre teve o seu próprio renderShell.
const telas = projetos.map((proj) => ({
  ...proj,
  // O preview CRU também fica de fora: é a entrada de quem monta a tela, e
  // quem monta a tela é o build. O site só precisa do nome do arquivo.
  templates: proj.templates.map(({ preview: _preview, ...t }) => ({
    ...t,
    // O arquivo autônomo em docs/t/, para abrir a tela em tamanho real.
    arquivo: `${proj.id}-${t.id}.html`,
  })),
}));

/* --------------------------------------------------------------- busca --- */
// Índice client-side. Sem serviço externo: são poucas centenas de itens.

const busca = [
  ...componentes.map((c) => ({
    tipo: 'Componente',
    titulo: c.name,
    subtitulo: c.selector,
    url: `/catalogo/${c.id}`,
    texto: [
      c.description,
      c.category,
      ...(c.props ?? []).map((p) => p.nome),
      ...(c.estados ?? []),
    ].join(' '),
  })),
  ...padroes.map((p) => ({
    tipo: 'Padrão',
    titulo: p.nome,
    subtitulo: p.frequencia,
    url: `/padroes/${p.id}`,
    texto: [p.problema, ...(p.regras ?? [])].join(' '),
  })),
  ...telas.flatMap((p) =>
    p.templates.map((t) => ({
      tipo: 'Tela',
      titulo: t.nome,
      subtitulo: p.nome,
      url: `/telas/${p.id}/${t.id}`,
      texto: [t.descricao, t.padrao, ...(t.usa ?? []), ...(t.notas ?? [])].join(' '),
    }))
  ),
  ...layouts.blocos.map((b) => ({
    tipo: 'Layout',
    titulo: b.nome,
    subtitulo: `.${b.classe}`,
    url: `/layout#${b.id}`,
    texto: [b.papel, b.quando, b.decisao].filter(Boolean).join(' '),
  })),
  {
    tipo: 'Layout',
    titulo: layouts.shell.nome,
    subtitulo: `.${layouts.shell.classe}`,
    url: '/layout#shell',
    texto: [layouts.shell.papel, layouts.shell.grade, layouts.shell.evidencia].join(' '),
  },
  ...adrs.map((a) => ({
    tipo: 'Decisão',
    titulo: `${a.id} — ${a.titulo}`,
    subtitulo: a.status,
    url: `/decisoes/${slug(a.id)}`,
    texto: [a.contexto, a.decisao].join(' '),
  })),
  ...corClara.map((c) => ({
    tipo: 'Token',
    titulo: c.token,
    subtitulo: c.hex ?? c.ref,
    url: '/fundamentos/cor',
    texto: c.descricao,
  })),
  ...icones.grupos.flatMap((g) =>
    g.icones.map((i) => ({
      tipo: 'Ícone',
      titulo: i.lucide,
      subtitulo: g.nome,
      url: '/fundamentos/icones',
      texto: i.uso,
    }))
  ),
  ...breakpoints.papeis.map((p) => ({
    tipo: 'Token',
    titulo: `viewport.${p.token}`,
    subtitulo: `${p.valor} · ${p.px}px`,
    url: '/fundamentos/breakpoints',
    texto: p.descricao,
  })),
  ...breakpoints.contentores.map((p) => ({
    tipo: 'Token',
    titulo: `container.${p.token}`,
    subtitulo: `${p.valor} · ${p.px}px`,
    url: '/fundamentos/breakpoints#contentores',
    texto: p.descricao,
  })),
  ...elevacao.papeis.map((e) => ({
    tipo: 'Token',
    titulo: `elevation.${e.token}`,
    subtitulo: e.ref,
    url: '/fundamentos/elevacao',
    texto: e.descricao,
  })),
  // As fundações novas entram na busca pelo que se PROCURA nelas: um princípio
  // pelo nome, uma palavra do vocabulário, um formato pela forma ("dd/mm"), um
  // papel de medida pelo token.
  ...escrita.principios.map((p) => ({
    tipo: 'Escrita',
    titulo: p.titulo,
    subtitulo: p.adr ?? 'princípio',
    url: `/fundamentos/escrita#${p.id}`,
    texto: [p.regra, p.porque, ...(p.bom ?? []), ...(p.ruim ?? [])].join(' '),
  })),
  ...escrita.vocabulario.termos.map((t) => ({
    tipo: 'Escrita',
    titulo: t.use,
    subtitulo: `em vez de ${t.evite}`,
    url: '/fundamentos/escrita#vocabulario',
    texto: [t.nota, t.evite].join(' '),
  })),
  ...formatos.formatos.map((f) => ({
    tipo: 'Formato',
    titulo: f.nome,
    subtitulo: f.forma,
    url: `/fundamentos/formatos#${f.id}`,
    texto: [f.exemplo, f.onde, f.regra].join(' '),
  })),
  ...dados.veiculos.map((v) => ({
    tipo: 'Dados',
    titulo: v.pergunta,
    subtitulo: v.componenteNome,
    url: '/fundamentos/dados#veiculos',
    texto: [v.forma, v.evite, v.porque].join(' '),
  })),
  ...densidade.larguras.papeis.map((p) => ({
    tipo: 'Medida',
    titulo: p.token,
    subtitulo: p.valor,
    url: '/fundamentos/densidade#larguras',
    texto: [p.papel, p.porque].join(' '),
  })),
  ...recursos.mcp.ferramentas.map((f) => ({
    tipo: 'MCP',
    titulo: f.nome,
    subtitulo: f.estado,
    url: '/comecar/mcp',
    texto: f.faz,
  })),
];

/* ---------------------------------------------------------------- meta --- */

const meta = {
  geradoEm: new Date().toISOString(),
  // Versão do design system e estado majoritário dos contratos. Sai daqui e
  // não de uma constante no site: a regra do repositório é que nada no site é
  // conteúdo escrito à mão. O estado é a MAIORIA, a mesma leitura que a
  // lateral já faz para decidir quando um selo distingue alguma coisa.
  versao: JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version,
  estado: (() => {
    const contagem = new Map();
    for (const c of componentes) contagem.set(c.status, (contagem.get(c.status) ?? 0) + 1);
    return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'draft';
  })(),
  componentes: componentes.length,
  padroes: padroes.length,
  adrs: adrs.length,
  telas: telas.reduce((n, p) => n + p.templates.length, 0),
  projetos: telas.length,
  blocos: layouts.blocos.length,
  icones: iconesSpec.grupos.reduce((n, g) => n + g.icones.length, 0),
  breakpoints: Object.keys(semantic.viewport).filter((k) => k[0] !== '$').length,
  estados: estadosSpec.estados.length,
  regrasDeTexto: escrita.totais.regras,
  formatos: formatosSpec.formatos.length,
  evidencias: componentes.reduce((n, c) => n + (c.evidencia?.ocorrencias?.length ?? 0), 0),
  requisitosA11y: componentes.reduce((n, c) => n + (c.acessibilidade?.requisitos?.length ?? 0), 0),
  criteriosWcag: new Set(componentes.flatMap((c) => c.acessibilidade?.criterios_wcag ?? [])).size,
  conversoesMigracao: componentes.reduce((n, c) => n + (c.migracao?.mapa?.length ?? 0), 0),
  // Aparece como aviso em toda página de fundações até a medição em produção.
  avisoCores: {
    origem: primitive._meta.origem,
    pendencia: primitive._meta.pendencia,
  },
};

/* ------------------------------------------------------------- releases --- */
// Não há histórico de versões ainda. Em vez de inventar um, o site mostra o
// estado real: cada contrato, sua versão e desde quando existe.

const releases = componentes
  .map((c) => ({
    id: c.id,
    nome: c.name,
    versao: c.version,
    desde: c.since ?? c.version,
    status: c.status,
  }))
  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

/* -------------------------------------------------------------- saída --- */

const data = {
  meta,
  fundamentos: {
    descricao: semantic.$description,
    regraCamadas: semantic._meta.regra,
    temaEscuro: { descricao: dark.$description, regra: dark._meta.regra },
    rampas,
    texto: linhasTexto(corClara),
    textoEscuro: linhasTexto(corEscura),
    acao: linhasAcao(corClara),
    acaoEscuro: linhasAcao(corEscura),
    espacoPrimitivo: escalaPrimitiva('space'),
    espacoSemantico: escalaSemantica('space'),
    raio: escalaPrimitiva('radius'),
    duracao: escalaPrimitiva('duration'),
    tipografia,
    tamanhos: escalaSemantica('size'),
    foco: {
      larguraAnel: semantic.focus['ring-width'].$value,
      offset: semantic.focus['ring-offset'].$value,
    },
    // O raio tinha a escala primitiva na página e os PAPÉIS em lugar nenhum —
    // e é o papel que responde "qual raio eu uso aqui".
    raioPapeis: escalaSemantica('radius'),
    familias: familias(corClara),
    familiasEscuro: familias(corEscura),
    feedback: feedback(corClara),
    feedbackEscuro: feedback(corEscura),
    elevacao,
    breakpoints,
    movimento,
    fontes,
    icones,
    estados,
    escrita,
    dados,
    formatos,
    densidade,
  },
  componentes,
  padroes,
  layouts,
  telas,
  adrs: adrs.map((a) => ({ ...a, slug: slug(a.id) })),
  recursos,
  migracao: {
    ...migracao,
    aindaNaoExiste: {
      ...migracao.aindaNaoExiste,
      semAngular: semAngular(),
    },
  },
  releases,
  busca,
};

const GEN = join(ROOT, 'site', 'src', 'generated');
mkdirSync(GEN, { recursive: true });

const out = join(GEN, 'spec.data.json');
writeFileSync(out, JSON.stringify(data, null, 2) + '\n', 'utf8');

// O CSS de tokens entra no site como um arquivo só. ucam-theme.css referencia
// ucam-tokens.css por @import relativo, que não sobrevive à cópia — então os
// dois são concatenados, com o @import removido.
const DIST = join(ROOT, 'dist', 'tokens');
const tokensCss = readFileSync(join(DIST, 'ucam-tokens.css'), 'utf8');
const themeCss = readFileSync(join(DIST, 'ucam-theme.css'), 'utf8').replace(
  /@import\s+["']\.\/ucam-tokens\.css["'];\s*/,
  '',
);
writeFileSync(
  join(GEN, 'tokens.css'),
  `/* Gerado por tools/build-index.mjs — concatenação de dist/tokens/.\n   NÃO EDITAR À MÃO. */\n\n${tokensCss}\n${themeCss}`,
  'utf8',
);

// @ucam/css entra no site pelo mesmo caminho e pelo mesmo motivo dos tokens: o
// preview do catálogo é renderizado pelo CSS REAL do Trilho A, não por uma
// imitação — mudou o token, muda o preview. Tudo ali é escopado sob .ucam,
// então nada alcança a cromagem do site. O @import relativo aos tokens sai:
// eles já estão em tokens.css.
const CSS_COMPONENTES = join(ROOT, 'dist', 'css', 'ucam.css');
if (!existsSync(CSS_COMPONENTES)) {
  console.error('✗ dist/css/ucam.css não existe. Rode: pnpm run css');
  process.exit(1);
}
const componentesCss = readFileSync(CSS_COMPONENTES, 'utf8').replace(
  /@import\s+["'][^"']*ucam-tokens\.css["'];\s*/,
  '',
);
// As classes .ic acompanham o markup, não o CSS de componente: elas vivem em
// tools/lib/icon-css.mjs justamente para não se separarem de quem emite
// `<svg class='ic'><use/></svg>`. Este gerador é o terceiro consumidor desse
// markup (depois de build-docs e build-templates) e precisa da mesma regra —
// sem ela um <svg> sem inline-size estica até o contêiner e o ícone do
// PageHeader ocupa o card inteiro. Escopado sob .ucam como o resto: nada aqui
// pode alcançar a cromagem do site.
//
// ANTES da folha de componentes, nunca depois. O escopo sobe a especificidade
// de `.ic` (0,1,0) para `.ucam .ic` (0,2,0) — a MESMA de `.ucam-badge .ic` e de
// toda a "escala de ícone por papel" do build-css. Com especificidade igual,
// vence quem vem depois: emitida no fim, esta regra atropelava os desvios, e
// todo ícone de preview saía com 20px — selo e chip medidos em 20×20 dentro de
// uma pastilha de 22 (11/09/2026), enquanto as telas autônomas, onde .ic vem
// primeiro, mostravam o degrau do papel. No topo ela volta a ser o que é: o
// padrão, que o contexto sobrescreve.
const icScoped = iconCss.replace(/^\./gm, '.ucam .');

writeFileSync(
  join(GEN, 'componentes.css'),
  `/* Gerado por tools/build-index.mjs — as classes .ic de tools/lib/icon-css.mjs
   mais uma cópia de dist/css/ucam.css. NÃO EDITAR À MÃO. */

${icScoped}

${componentesCss}
`,
  'utf8',
);

// O sprite acompanha o CSS pelo mesmo motivo, e sem ele metade dos previews
// mostra botão vazio: o markup de spec/demos.json referencia os ícones por
// <use href="#i-*">, e <use> só resolve contra um <symbol> presente no
// documento. Vira módulo TS porque o app precisa injetá-lo no DOM tanto no
// prerender quanto na hidratação — um arquivo .svg em assets/ não faria isso.
const SPRITE = join(ROOT, 'dist', 'icons', 'sprite.svg');
if (!existsSync(SPRITE)) {
  console.error('✗ dist/icons/sprite.svg não existe. Rode: pnpm run icons');
  process.exit(1);
}
const sprite = readFileSync(SPRITE, 'utf8').trim();
writeFileSync(
  join(GEN, 'sprite.ts'),
  `// Gerado por tools/build-index.mjs — cópia de dist/icons/sprite.svg.
// NÃO EDITAR À MÃO.
export const SPRITE = ${JSON.stringify(sprite)};
`,
  'utf8',
);

// O comportamento do listbox tem UMA fonte: tools/lib/select-listbox.mjs.
// A página estática de docs/ recebe o mesmo texto como <script>; o site
// Angular recebe esta função e a chama uma vez no AppComponent. O script é
// delegação no document, então vale também para preview injetado depois —
// que é como o site monta as demos (innerHTML via bypassSecurityTrustHtml,
// onde uma <script> embutida nunca executaria).
writeFileSync(
  join(GEN, 'listbox.ts'),
  `// @ts-nocheck
// Gerado por tools/build-index.mjs a partir de tools/lib/select-listbox.mjs.
// NÃO EDITAR À MÃO — edite a lib e rode o build.
//
// @ts-nocheck porque a FONTE é JavaScript de navegador: o mesmo texto vai
// como <script> nas telas autônomas e em docs/index.html, onde anotação de
// tipo não existe. Anotar aqui quebraria lá, e manter duas cópias — uma
// tipada e uma não — é justamente o que a regra do repositório proíbe. O
// preço é este arquivo sair da checagem; o contrapeso é que ele é gerado,
// nunca editado à mão, e verificado por CDP (prova-listbox).
export function ligarListbox(): void {
${listboxScript
  .split('\n')
  .map((l) => (l ? '  ' + l : l))
  .join('\n')}
}

/**
 * O menu da conta na faixa e os ramos do menu lateral. Mesma fonte
 * (tools/lib/shell.mjs), mesma delegação no documento, mesmo motivo de estar
 * aqui: o preview do shell chega ao DOM por innerHTML, e <script> embutida em
 * innerHTML nunca executa.
 */
export function ligarMenuConta(): void {
${menuContaScript
  .split('\n')
  .map((l) => (l ? '  ' + l : l))
  .join('\n')}
}

/**
 * Estrela de favorito, segmented e seção recolhível — os controles de estado
 * das telas. Mesma fonte, mesma delegação, mesmo motivo.
 */
export function ligarEstado(): void {
${estadoScript
  .split('\n')
  .map((l) => (l ? '  ' + l : l))
  .join('\n')}
}

/**
 * "Mostrar todos os N valores" da lista de descrição. Estava nas telas
 * autônomas e em docs/, e não aqui: o botão do catálogo alternava o
 * aria-expanded no atributo e nada na tela.
 */
export function ligarDescricao(): void {
${descricaoScript
  .split('\n')
  .map((l) => (l ? '  ' + l : l))
  .join('\n')}
}

/**
 * A tira de abas: seleção, recorte do painel e a seta do teclado. Estava nas
 * telas autônomas e em docs/, e não aqui — a demo de Tabs do catálogo tinha
 * quatro abas e nenhuma trocava de recorte.
 */
export function ligarAbas(): void {
${abasScript
  .split('\n')
  .map((l) => (l ? '  ' + l : l))
  .join('\n')}
}

/** O filtro Todos · Mensagens · Tramitação da linha do tempo (ADR-036). */
export function ligarLinhaDoTempo(): void {
${linhaDoTempoScript
  .split('\n')
  .map((l) => (l ? '  ' + l : l))
  .join('\n')}
}
`,
  'utf8',
);

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log('site/src/generated/spec.data.json');
console.log(
  `  ${meta.componentes} componentes · ${meta.blocos + 1} blocos de layout · ${meta.telas} telas · ${meta.padroes} padrões · ${meta.adrs} ADRs · ${busca.length} itens de busca`,
);
console.log(`  ${kb(JSON.stringify(data).length)}`);
