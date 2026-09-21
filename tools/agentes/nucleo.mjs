// Núcleo do @ucam/ds-mcp: lê a spec empacotada e responde às ferramentas.
//
// Sem dependência nenhuma, de propósito. O pacote vai para máquinas de
// desenvolvedor do parque inteiro, inclusive as que não alcançam o registro
// público do npm; um servidor que precisasse do SDK para subir falharia
// justamente onde ele mais é pedido. O protocolo em stdio é JSON-RPC 2.0 por
// linha, e cabe em server.mjs.
//
// Este arquivo é FONTE em tools/agentes/. O gerador (tools/build-agentes.mjs)
// copia para dist/agentes/mcp/, ao lado da spec copiada. Não editar a cópia.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = process.env.UCAM_DS_RAIZ ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = join(RAIZ, 'spec');

const lerJson = (rel) => JSON.parse(readFileSync(join(SPEC, rel), 'utf8'));
export const lerTexto = (rel) => readFileSync(join(RAIZ, rel), 'utf8');

let memo = null;
export function dados() {
  if (memo) return memo;
  const componentes = readdirSync(join(SPEC, 'components'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => lerJson(`components/${f}`))
    .sort((a, b) => a.id.localeCompare(b.id));
  const pkg = existsSync(join(RAIZ, 'package.json')) ? JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')) : {};
  memo = {
    versao: pkg.version ?? '0.0.0',
    componentes,
    padroes: lerJson('patterns/patterns.json').patterns,
    projetos: lerJson('templates.json').projetos,
    adrs: lerJson('decisions/adr.json').decisions,
    migracao: lerJson('migracao.json'),
    estados: lerJson('states.json'),
    tokens: lerJson('tokens/ucam-tokens.json'),
    semantica: lerJson('tokens/semantic.json'),
    classes: existsSync(join(SPEC, 'classes-trilho-a.json')) ? new Set(lerJson('classes-trilho-a.json').classes) : null,
  };
  return memo;
}

/* ------------------------------------------------------------ ajudantes --- */

const curta = (s = '', n = 220) => {
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
};

function acharComponente(chave = '') {
  const k = String(chave).trim().toLowerCase().replace(/^<|>$/g, '');
  return dados().componentes.find(
    (c) => c.id === k || c.selector.toLowerCase() === k || `ucam-${c.id}` === k || c.name.toLowerCase() === k,
  );
}

function descricaoDoToken(nome) {
  // color-text-primary -> semantic.color.text.primary.$description
  let no = dados().semantica;
  const partes = nome.split('-');
  let i = 0;
  while (i < partes.length && no) {
    let achou = false;
    for (let j = partes.length; j > i; j--) {
      const k = partes.slice(i, j).join('-');
      if (no[k] !== undefined) { no = no[k]; i = j; achou = true; break; }
    }
    if (!achou) return null;
  }
  return no?.$description ? curta(no.$description, 260) : null;
}

/* ----------------------------------------------------------- ferramentas --- */

export const FERRAMENTAS = [
  {
    name: 'ucam_list_components',
    description:
      'Lista o catálogo do Design System da UCAM: id, seletor Angular (<ucam-*>), maturidade, categoria e descrição curta. Use antes de compor qualquer tela, para saber o que existe — nunca invente um componente.',
    inputSchema: {
      type: 'object',
      properties: {
        categoria: { type: 'string', description: 'Filtra pela categoria (ex.: dados, acao, formulario).' },
        busca: { type: 'string', description: 'Texto livre procurado no nome e na descrição.' },
      },
    },
  },
  {
    name: 'ucam_get_component',
    description:
      'Devolve o contrato completo de um componente: props com valores válidos, anatomia, estados, acessibilidade, limites de uso, conteúdo, mapa de migração e exemplos. É a fonte da verdade para a API — prop que não está aqui não existe.',
    inputSchema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Id (button), seletor (ucam-button) ou nome (Button).' },
        secoes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Opcional: só estas seções (props, limites, acessibilidade, migracao, exemplos, anatomia, conteudo, boas_praticas…).',
        },
      },
    },
  },
  {
    name: 'ucam_get_tokens',
    description:
      'Devolve os tokens SEMÂNTICOS resolvidos por tema, com o nome da custom property (--ucam-*) e o papel de cada um. Componentes e aplicações só referenciam tokens semânticos (ADR-007): nunca hex cru, nunca primitiva.',
    inputSchema: {
      type: 'object',
      properties: {
        tema: { type: 'string', enum: ['claro', 'escuro'], description: 'Padrão: claro.' },
        prefixo: { type: 'string', description: 'Ex.: color-text, color-feedback, space, radius, typography.' },
      },
    },
  },
  {
    name: 'ucam_get_pattern',
    description:
      'Padrões de tela (listagem-crud, formulario-entidade, painel-indicadores, listagem-inspetor, triagem-lista-detalhe, consulta-relatorio, confirmacao-destrutiva, shell-aplicacao): estrutura, regras e componentes. Sem id, lista todos.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } } },
  },
  {
    name: 'ucam_list_templates',
    description:
      'Telas de referência já resolvidas com o design system, agrupadas por sistema (Protocolo, Portal, SigFin, Relatórios, Módulo Gerencial do SIGU…). Cada tela diz o padrão que implementa. Comece por aqui ao construir uma tela parecida.',
    inputSchema: { type: 'object', properties: { projeto: { type: 'string', description: 'Ex.: gerencial, protocolo.' } } },
  },
  {
    name: 'ucam_get_template',
    description:
      'Uma tela de referência inteira: problemas do legado, notas de decisão, componentes usados, código Angular de partida, fluxos (de onde se chega e o que cada ação faz) e, se pedido, o HTML do Trilho A.',
    inputSchema: {
      type: 'object',
      required: ['projeto', 'tela'],
      properties: {
        projeto: { type: 'string' },
        tela: { type: 'string' },
        incluirPreview: { type: 'boolean', description: 'Inclui o HTML do Trilho A (grande). Padrão: false.' },
      },
    },
  },
  {
    name: 'ucam_get_decisions',
    description:
      'Decisões registradas (ADRs): o porquê de cada regra — um primário por tela, vermelho só para o irreversível, arquivar não é excluir, indicador limpo… Sem argumentos, lista id e título.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Ex.: ADR-023.' },
        busca: { type: 'string', description: 'Texto procurado no título, contexto e decisão.' },
      },
    },
  },
  {
    name: 'ucam_migrate_from_legacy',
    description:
      'Recebe um trecho de template legado (AngularJS, Angular Material, PrimeFaces/JSF, HTML com classes próprias) e devolve o equivalente na API da UCAM segundo os mapas de migração dos contratos, mais a ordem de migração e os erros que sobrevivem a uma conversão literal.',
    inputSchema: { type: 'object', required: ['trecho'], properties: { trecho: { type: 'string' } } },
  },
  {
    name: 'ucam_get_states',
    description:
      'Devolve o modelo de estados que vale para TODO componente interativo: a ordem de precedência (qual estado ganha quando dois se aplicam), as regras de desabilitado e de carregando, o vocabulário obrigatório dos nomes de estado e o mapa de movimento. Consulte antes de escrever qualquer estado — desabilitado, carregando, somente leitura, selecionado, aberto —, porque a metade destas regras não está em contrato de componente nenhum: elas valem para todos.',
    inputSchema: {
      type: 'object',
      properties: {
        estado: { type: 'string', description: 'Opcional. Um estado (disabled, loading, focus-visible, hover, active, default) ou um termo do vocabulário (open, empty, invalid, readonly, selected…). Sem ele, devolve o modelo inteiro.' },
      },
    },
  },
  {
    name: 'ucam_check_usage',
    description:
      'Audita um trecho de código (template Angular, HTML do Trilho A ou CSS) contra os contratos: cor crua, primitiva referenciada, <z-*> da base, componente ou prop inexistente, valor fora do enum, classe que o Trilho A não desenha, mais de um primário, select nativo, caixa alta. Rode antes de concluir qualquer tela.',
    inputSchema: { type: 'object', required: ['codigo'], properties: { codigo: { type: 'string' } } },
  },
];

function listarComponentes({ categoria, busca } = {}) {
  const b = busca?.toLowerCase();
  return dados()
    .componentes.filter((c) => !categoria || c.category === categoria)
    .filter((c) => !b || `${c.name} ${c.description}`.toLowerCase().includes(b))
    .map((c) => ({ id: c.id, seletor: c.selector, status: c.status, categoria: c.category, descricao: curta(c.description) }));
}

function obterComponente({ id, secoes } = {}) {
  const c = acharComponente(id);
  if (!c) {
    return { erro: `Nenhum contrato para "${id}". Não invente o componente: use ucam_list_components.`, sugestoes: listarComponentes({ busca: id }).slice(0, 5) };
  }
  if (!secoes?.length) return c;
  return Object.fromEntries(['id', 'name', 'selector', 'status', ...secoes].filter((k) => c[k] !== undefined).map((k) => [k, c[k]]));
}

function obterTokens({ tema = 'claro', prefixo = '' } = {}) {
  const { tokens } = dados();
  const base = { ...tokens.semantic };
  if (tema === 'escuro') Object.assign(base, tokens.dark ?? {});
  return Object.entries(base)
    .filter(([nome]) => nome.startsWith(prefixo))
    .map(([nome, valor]) => ({
      token: nome,
      css: `var(--ucam-${nome})`,
      valor: typeof valor === 'object' && valor !== null ? valor.value ?? valor : valor,
      papel: descricaoDoToken(nome),
    }));
}

function obterPadrao({ id } = {}) {
  const { padroes } = dados();
  if (!id) return padroes.map((p) => ({ id: p.id, nome: p.nome, problema: curta(p.problema) }));
  return padroes.find((p) => p.id === id) ?? { erro: `Padrão "${id}" não existe.`, existentes: padroes.map((p) => p.id) };
}

function listarTelas({ projeto } = {}) {
  return dados()
    .projetos.filter((p) => !projeto || p.id === projeto)
    .map((p) => ({
      projeto: p.id,
      nome: p.nome,
      descricao: curta(p.descricao, 300),
      telas: p.templates.map((t) => ({ id: t.id, nome: t.nome, padrao: t.padrao, descricao: curta(t.descricao) })),
    }));
}

function obterTela({ projeto, tela, incluirPreview = false } = {}) {
  const p = dados().projetos.find((x) => x.id === projeto);
  const t = p?.templates.find((x) => x.id === tela);
  if (!t) return { erro: `Tela "${projeto}/${tela}" não existe.`, existentes: listarTelas({ projeto }) };
  const { preview, ...resto } = t;
  return {
    projeto: p.id,
    sistema: p.nome,
    ...resto,
    navegacao: p.shell?.nav?.map((g) => ({ grupo: g.titulo, itens: g.itens.map((i) => i.rotulo) })),
    ...(incluirPreview ? { preview } : {}),
  };
}

function obterDecisoes({ id, busca } = {}) {
  const { adrs } = dados();
  if (id) return adrs.find((a) => a.id.toLowerCase() === id.toLowerCase()) ?? { erro: `${id} não existe.` };
  const b = busca?.toLowerCase();
  return adrs
    .filter((a) => !b || `${a.titulo} ${a.contexto} ${a.decisao}`.toLowerCase().includes(b))
    .map((a) => ({ id: a.id, titulo: a.titulo, status: a.status, data: a.data, ...(b ? { decisao: curta(a.decisao, 500) } : {}) }));
}

export function migrar({ trecho = '' } = {}) {
  const t = trecho.toLowerCase();
  const termos = new Set([
    ...[...t.matchAll(/<([a-z][a-z0-9:-]*)/g)].map((m) => m[1]),
    ...[...t.matchAll(/class=["']([^"']+)["']/g)].flatMap((m) => m[1].split(/\s+/)),
    ...[...t.matchAll(/\s((?:md|ng|ui|p|mat)-[a-z-]+)/g)].map((m) => m[1]),
    ...[...t.matchAll(/\b(dialog|modal|datatable|table|select|button|input|tab|menu|checkbox|radio|tooltip|toast|badge|card|pagination)\b/g)].map((m) => m[1]),
  ]);
  const uteis = [...termos].filter((x) => x.length > 2 && !['div', 'span', 'class', 'for', 'label'].includes(x));
  const sugestoes = [];
  for (const c of dados().componentes) {
    for (const e of c.migracao?.mapa ?? []) {
      const legado = String(e.legado ?? '').toLowerCase();
      const casou = uteis.filter((x) => legado.includes(x));
      if (casou.length) sugestoes.push({ componente: c.id, seletor: c.selector, legado: e.legado, novo: e.novo, nota: e.nota, casou });
    }
  }
  sugestoes.sort((a, b) => b.casou.length - a.casou.length);
  const { migracao } = dados();
  return {
    termosReconhecidos: uteis,
    sugestoes: sugestoes.slice(0, 40),
    semCorrespondencia: uteis.filter((x) => !sugestoes.some((s) => s.casou.includes(x))),
    ordem: migracao.ordem,
    errosQueSobrevivem: migracao.errosQueSobrevivem,
    lembrete:
      'Conversão literal não termina a migração. Confira cada <ucam-*> com ucam_get_component e rode ucam_check_usage no resultado.',
  };
}

const ATRIBUTOS_LIVRES = /^(class|style|id|role|tabindex|name|for|title|href|src|alt|type|value|placeholder|slot|formcontrolname|formcontrol|formgroup|ngmodel|ngmodeloptions|routerlink|routerlinkactive|queryparams|ngclass|ngstyle|attr\..*|class\..*|style\..*|aria-.*|data-.*)$/i;
const PRIMITIVAS = /var\(--ucam-(wine|neutral|grafite|green|amber|red|blue|ochre|teal|violet|olive)-\d+/g;

export function estados({ estado } = {}) {
  const e = dados().estados;
  const ordem = [...e.estados].sort((a, b) => a.precedencia - b.precedencia);

  if (estado) {
    const k = String(estado).trim().toLowerCase();
    const interacao = ordem.find((s) => s.id === k);
    // O vocabulário responde tanto pelo termo quanto pelos sinônimos que ele
    // proíbe: quem procura "aberto" precisa cair em "open", não em nada.
    const termo = e.vocabulario.termos.find((v) => v.id === k || v.sinonimos?.includes(k));
    if (!interacao && !termo) {
      return { erro: 'Estado desconhecido: ' + estado, estados: ordem.map((s) => s.id), vocabulario: e.vocabulario.termos.map((v) => v.id) };
    }
    return {
      ...(interacao ? { interacao, precedencia: e.precedencia.regra } : {}),
      ...(termo ? { vocabulario: { ...termo, regra: e.vocabulario.regra, ...(termo.id !== k ? { atencao: '"' + k + '" é sinônimo recusado pelo validador. O nome é "' + termo.id + '".' } : {}) } } : {}),
      ...(k === 'disabled' ? { disabled: e.disabled } : {}),
      ...(k === 'loading' ? { loading: e.loading } : {}),
    };
  }

  return {
    descricao: e.$description,
    precedencia: { ordem: e.precedencia.ordem, regra: e.precedencia.regra, excecao: e.precedencia.excecao, estados: ordem },
    disabled: e.disabled,
    loading: e.loading,
    vocabulario: e.vocabulario,
    movimento: e.movimento,
  };
}

export function checar({ codigo = '' } = {}) {
  const achados = [];
  const add = (regra, severidade, mensagem, trecho) => achados.push({ regra, severidade, mensagem, trecho: curta(trecho, 120) });
  const { componentes, classes } = dados();
  const porSeletor = new Map(componentes.filter((c) => !c.selector.startsWith('[')).map((c) => [c.selector, c]));

  for (const m of codigo.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    if (![4, 5, 7, 9].includes(m[0].length)) continue;
    const antes = codigo.slice(Math.max(0, m.index - 8), m.index);
    if (/(href|use|url)\s*=?\s*\(?["']?$/i.test(antes)) continue;
    add('ADR-007', 'erro', `Cor crua ${m[0]}. Use um token semântico — ucam_get_tokens lista os papéis.`, m[0]);
  }
  for (const m of codigo.matchAll(PRIMITIVAS)) {
    add('ADR-007', 'erro', 'Token PRIMITIVO referenciado. Aplicação só lê a camada semântica (color.text.*, color.surface.*, color.feedback.*…).', m[0]);
  }
  for (const m of codigo.matchAll(/<(z-[a-z0-9-]+)/g)) {
    add('ADR-006', 'erro', `<${m[1]}> é a base ZardUI. Aplicações importam <ucam-*>, nunca <z-*>.`, m[0]);
  }
  for (const m of codigo.matchAll(/<select\b(?![^>]*ucam-select)/g)) {
    add('ADR-011', 'aviso', 'Select nativo. No Trilho B use <ucam-select>; no Trilho A, class="ucam-select" (o gerador troca pelo listbox do sistema).', m[0]);
  }

  let primarios = 0;
  for (const m of codigo.matchAll(/<(ucam-[a-z0-9-]+)((?:[^>"']|"[^"]*"|'[^']*')*)>/g)) {
    const [inteiro, seletor, attrs] = m;
    const c = porSeletor.get(seletor);
    if (!c) {
      add('contrato', 'erro', `<${seletor}> não tem contrato — o componente não existe. Veja ucam_list_components.`, inteiro);
      continue;
    }
    const props = new Map((c.props ?? []).map((p) => [p.nome.toLowerCase(), p]));
    for (const a of attrs.matchAll(/(\[\(|\[|\(|\*|#|@)?([a-zA-Z][\w.:-]*)(?:\)\]|\]|\))?(?:\s*=\s*("[^"]*"|'[^']*'))?/g)) {
      const [, marca = '', nome, valorBruto] = a;
      if (marca === '(' || marca === '*' || marca === '#' || marca === '@') continue;
      if (ATRIBUTOS_LIVRES.test(nome)) continue;
      const p = props.get(nome.toLowerCase());
      if (!p) {
        add('contrato', 'erro', `<${seletor}> não tem a prop "${nome}". Props válidas: ${[...props.keys()].join(', ') || 'nenhuma'}.`, inteiro);
        continue;
      }
      if (!marca && valorBruto && p.valores && typeof p.valores === 'object') {
        const valor = valorBruto.slice(1, -1);
        const validos = Object.keys(p.valores);
        if (validos.length && !validos.includes(valor)) {
          add('contrato', 'erro', `<${seletor} ${nome}="${valor}"> fora do contrato. Valores: ${validos.join(', ')}.`, inteiro);
        }
      }
    }
    if (seletor === 'ucam-button' && /\bvariant\s*=\s*["']primary["']/.test(attrs)) primarios++;
  }
  primarios += [...codigo.matchAll(/ucam-btn--primary/g)].length;
  if (primarios > 1) {
    add('ADR-023', 'aviso', `${primarios} ações primárias no trecho. Uma vista, um primário — o da ação frequente; o resto desce a secundário ou fantasma.`, 'variant="primary"');
  }

  if (classes) {
    const vistas = new Set();
    for (const m of codigo.matchAll(/class(?:Name)?=["']([^"']+)["']/g)) {
      for (const cl of m[1].split(/\s+/)) {
        if (!/^ucam-/.test(cl) || classes.has(cl) || vistas.has(cl)) continue;
        vistas.add(cl);
        add('trilho-a', 'erro', `.${cl} não é desenhada pelo @ucam/css — não pinta nada.`, cl);
      }
    }
  }

  for (const m of codigo.matchAll(/>\s*([A-ZÀ-Ý]{3,}(?:\s+[A-ZÀ-Ý]{2,})+)\s*</g)) {
    add('ADR-003', 'aviso', `Texto em caixa alta ("${m[1]}"). Rótulos e títulos em caixa natural.`, m[1]);
  }
  // Palavra solta só dentro de botão, e com 5+ letras: fora dele, CPF, SIGU e ENADE são siglas legítimas.
  for (const m of codigo.matchAll(/<(ucam-button|button|z-button)\b[^>]*>\s*([A-ZÀ-Ý]{5,})\s*<\/\1>/g)) {
    add('ADR-003', 'aviso', `Rótulo de botão em caixa alta ("${m[2]}"). Rótulos em caixa natural.`, m[2]);
  }

  /* ------------------------------------------------------- estados --- */
  /* O auditor não sabia nada sobre estado, e estado é a metade das regras que
     não moram em contrato de componente nenhum: valem para todos. As quatro
     conferências abaixo saem de spec/states.json e da ADR-042 — nenhuma é
     opinião deste arquivo.

     Por REGRA e não por regex corrida: a primeira versão procurava o seletor
     e o valor numa expressão só, e o "[^{}]*" no meio atravessava o fim de um
     seletor para dentro do bloco do vizinho. Resultado: ".ucam-input[readonly]"
     e "thead th" eram acusados de pintar desabilitado com o cinza errado, que
     é exatamente o uso CERTO dos dois. Separar seletor de corpo faz a
     pergunta certa: este bloco fala de desabilitado? então o que ele pinta? */
  const DESABILITADO = /:disabled|\[disabled\]|\[aria-disabled(?:\s*=\s*["']?true["']?)?\]|\.ucam-[\w-]*(?:disabled|desabilitad\w*)/i;

  for (const regra of codigo.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const [, seletor, corpo] = regra;
    if (!DESABILITADO.test(seletor)) continue;

    // 1. OPACIDADE. A regra é cor explícita, e o motivo é que opacity derruba
    //    o contraste de um jeito invisível para quem escreve o código: o
    //    portão de contraste enxerga o token, não o que sobra da transparência.
    if (/opacity\s*:\s*(?:0?\.\d+|0)\s*[;}]?/i.test(corpo)) {
      add(
        'ADR-042',
        'erro',
        'Desabilitado por opacidade. A regra é COR EXPLÍCITA — color.action.disabled.background e color.action.disabled.text. opacity reduz o contraste sem que nenhum portão veja, e é o que produziu os botões ilegíveis do Protocolo e do SIGFIN. Ver ucam_get_states com estado="disabled".',
        seletor.trim(),
      );
    }

    // 2. O CHÃO. Um chão só para todo controle bloqueado. surface.subtle é o
    //    recuo de SOMENTE LEITURA e surface.sunken é a faixa de rótulo da
    //    tabela: usar qualquer um dos dois aqui refaz as três cinzas que a
    //    ADR-042 unificou — e, com surface.subtle, apaga a diferença entre
    //    bloqueado e somente leitura, que era o defeito de origem.
    const chao = corpo.match(/--ucam-color-surface-(subtle|sunken)/i);
    if (chao) {
      add(
        'ADR-042',
        'erro',
        `Controle desabilitado pintado com surface.${chao[1]}. O chão do estado é UM só: color.action.disabled.background. surface.subtle é o recuo de somente-leitura e surface.sunken é a faixa de rótulo da tabela — os dois desfazem a distinção que o estado carrega.`,
        seletor.trim(),
      );
    }
  }

  // Opacidade também por style inline, que não tem seletor para inspecionar.
  for (const m of codigo.matchAll(/<[^>]*\bdisabled\b[^>]*>/gi)) {
    if (/style\s*=\s*["'][^"']*opacity\s*:\s*(?:0?\.\d+|0)/i.test(m[0])) {
      add('ADR-042', 'erro', 'Desabilitado por opacidade em style inline. Cor explícita, sempre.', m[0]);
    }
  }

  // 3. CARREGANDO NÃO USA disabled. O atributo tira o elemento da ordem de
  //    foco, e quem navega por teclado perde o contexto no meio da operação.
  //    A regra é aria-busy + aria-disabled, com o clique barrado no código.
  for (const m of codigo.matchAll(/<(?:ucam-[a-z0-9-]+|button)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)) {
    const attrs = m[1];
    const carregando = /(?:^|\s)(?:\[loading\]|loading)\s*(?:=|$|\s)/i.test(attrs) || /aria-busy\s*=\s*["']?true/i.test(attrs);
    // "disabled" solto ou [disabled], mas NÃO aria-disabled: esse é o certo.
    const bloqueado = /(?:^|\s)(?:\[disabled\]|disabled)(?:\s|=|$)/i.test(attrs);
    if (carregando && bloqueado) {
      add(
        'estados',
        'erro',
        'Carregando com o atributo disabled. Use aria-busy="true" e aria-disabled="true" e barre a ação no manipulador: disabled tira o elemento da ordem de foco, e quem navega por teclado perde o contexto no meio da operação.',
        m[0],
      );
    }
  }

  // 4. VOCABULÁRIO. Sinônimo é divergência silenciosa: quem procura "open" nos
  //    contratos não acha o menu que dizia "aberto". O validador da spec já
  //    recusa o sinônimo exato NOS CONTRATOS; aqui ele é pego no código da
  //    aplicação, que é onde o validador não chega.
  const sinonimos = new Map();
  for (const termo of dados().estados?.vocabulario?.termos ?? []) {
    for (const s of termo.sinonimos ?? []) sinonimos.set(s.toLowerCase(), termo.id);
  }
  if (sinonimos.size) {
    for (const m of codigo.matchAll(/\b(data-[\w-]+|\[?(?:estado|state|situacao)\]?)\s*=\s*["']([^"']+)["']/gi)) {
      const alvo = sinonimos.get(m[2].trim().toLowerCase());
      if (alvo) {
        add(
          'estados',
          'aviso',
          `${m[1]}="${m[2]}" usa sinônimo. O nome do estado no sistema é "${alvo}", em inglês, como os estados de interação — ver ucam_get_states.`,
          m[0],
        );
      }
    }
  }

  const erros = achados.filter((a) => a.severidade === 'erro').length;
  return { resumo: { erros, avisos: achados.length - erros, aprovado: erros === 0 }, achados };
}

const EXECUTORES = {
  ucam_list_components: listarComponentes,
  ucam_get_component: obterComponente,
  ucam_get_tokens: obterTokens,
  ucam_get_pattern: obterPadrao,
  ucam_list_templates: listarTelas,
  ucam_get_template: obterTela,
  ucam_get_decisions: obterDecisoes,
  ucam_migrate_from_legacy: migrar,
  ucam_get_states: estados,
  ucam_check_usage: checar,
};

export function executar(nome, args = {}) {
  const f = EXECUTORES[nome];
  if (!f) throw Object.assign(new Error(`Ferramenta desconhecida: ${nome}`), { code: -32602 });
  exigirObrigatorios(nome, args ?? {});
  return f(args ?? {});
}

// POR QUE ISTO EXISTE: o `required` do inputSchema era decoração. Cada executor
// tem default (`{ codigo = '' } = {}`), então chamada sem argumento não quebrava
// — devolvia resposta vazia. Em `ucam_check_usage` isso virava o pior resultado
// possível: `{ erros: 0, aprovado: true }` sobre código que ninguém auditou.
//
// E a chamada errada é fácil de fazer: os nomes das ferramentas são em inglês e
// os parâmetros em português, então o agente que chuta `code` em vez de
// `codigo` recebia sinal verde. A regra de ouro do AGENTS.md manda rodar
// `ucam_check_usage` antes de concluir; um portão que aprova em silêncio é
// pior que portão nenhum.
function exigirObrigatorios(nome, args) {
  const esquema = FERRAMENTAS.find((t) => t.name === nome)?.inputSchema ?? {};
  const faltando = (esquema.required ?? []).filter(
    (k) => args[k] === undefined || args[k] === null || args[k] === '',
  );
  if (!faltando.length) return;

  const aceitos = Object.keys(esquema.properties ?? {});
  const recebidos = Object.keys(args);
  const pista = recebidos.length
    ? ` Recebi ${recebidos.join(', ')}; esta ferramenta aceita ${aceitos.join(', ')}.`
    : '';
  throw Object.assign(
    new Error(
      `${nome} exige ${faltando.join(', ')} e veio sem.${pista} Nada foi verificado — não trate isto como aprovação.`,
    ),
    { code: -32602 },
  );
}

/* -------------------------------------------------------------- recursos --- */

export function recursos() {
  const lista = [{ uri: 'ucam://agents', name: 'AGENTS.md — como trabalhar com o UCAMDS', mimeType: 'text/markdown', arquivo: 'AGENTS.md' }];
  const dir = join(RAIZ, 'skills');
  if (existsSync(dir)) {
    for (const s of readdirSync(dir)) {
      lista.push({ uri: `ucam://skills/${s}`, name: `Skill ${s}`, mimeType: 'text/markdown', arquivo: `skills/${s}/SKILL.md` });
    }
  }
  return lista;
}
