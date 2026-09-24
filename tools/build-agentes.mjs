// Monta o kit para agentes e desenvolvedores: dist/agentes/.
//
//   node tools/build-agentes.mjs
//
// Saída (vira o pacote @ucam/ds-mcp em tools/build-pacotes.mjs):
//
//   AGENTS.md            instruções para agentes e pessoas — GERADO da spec
//   llms.txt             índice curto, no formato llms.txt
//   skills/*/SKILL.md    ucam-ds, ucam-migrate, ucam-audit (as três de resources.json)
//   spec/                cópia dos contratos, padrões, telas, ADRs, tokens e classes
//   mcp/                 servidor MCP stdio sem dependência (fonte em tools/agentes/)
//   bin/ucam-ds.mjs      CLI: instalar, checar, mcp
//   exemplos/            .mcp.json e .vscode/mcp.json prontos
//
// POR QUE GERADO: a regra do spec/README vale aqui dentro — se o AGENTS.md
// listasse componentes à mão, o primeiro contrato novo o deixaria mentindo para
// o agente, e o agente mente para o desenvolvedor com a confiança de quem leu a
// documentação oficial. O que é MÉTODO (a ordem de trabalho de cada skill) é
// escrito aqui; o que é DADO (catálogo, regras, telas) sai da spec.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = join(ROOT, 'dist', 'agentes');
const ler = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const { version: VERSAO } = ler('package.json');

for (const f of ['dist/tokens/ucam-tokens.json', 'dist/css/ucam.css']) {
  if (!existsSync(join(ROOT, f))) {
    console.error(`✗ ${f} não existe. Rode: pnpm run tokens && pnpm run css`);
    process.exit(1);
  }
}

const componentes = readdirSync(join(ROOT, 'spec/components'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => ler(`spec/components/${f}`))
  .sort((a, b) => a.id.localeCompare(b.id));
const padroes = ler('spec/patterns/patterns.json').patterns;
const projetos = ler('spec/templates.json').projetos;
const adrs = ler('spec/decisions/adr.json').decisions;
const migracao = ler('spec/migracao.json');
const recursos = ler('spec/resources.json');
const escrita = ler('spec/writing.json');
const estados = ler('spec/states.json');

const umaLinha = (s = '', n = 160) => {
  const t = String(s).replace(/\s+/g, ' ').replace(/\|/g, '/').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
};
/** Item de lista da spec que pode ser texto ou objeto com nomes variados. */
const itemTexto = (o) => {
  if (typeof o === 'string') return o;
  if (!o || typeof o !== 'object') return String(o);
  const chave = ['titulo', 'passo', 'nome', 'regra', 'item', 'erro', 'texto', 'pergunta', 'descricao'].find((k) => typeof o[k] === 'string');
  const principal = chave ? o[chave] : Object.values(o).find((v) => typeof v === 'string') ?? '';
  const detalhe = ['como', 'porque', 'por_que', 'correcao', 'verificacao', 'descricao'].find((k) => k !== chave && typeof o[k] === 'string');
  return detalhe ? `${principal} — ${o[detalhe]}` : principal;
};
const lista = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v).find(Array.isArray) ?? [] : []);

/** O checklist do guia é agrupado: { grupos: [{ grupo, itens: [texto] }] }. */
const checklist = () =>
  (migracao.checklistDeTela?.grupos ?? [])
    .map((g) => `**${g.grupo}**\n\n${(g.itens ?? []).map((i) => `- [ ] ${umaLinha(itemTexto(i), 300)}`).join('\n')}`)
    .join('\n\n');

/** Os três trilhos saem do guia de migração, que é quem os DECIDE. A página de
 *  instalação ensina a instalar cada um e lê o mesmo seletor: a pergunta que
 *  decide e o "quando" de cada trilho existem uma vez só, e o agente recebe a
 *  mesma frase que o dev lê no site. */
const trilhos = () => {
  const itens = (migracao.escolhaDoTrilho?.trilhos ?? [])
    .map(
      (t) =>
        `- **${t.nome}.** Quando: ${umaLinha(t.quando, 260)} Entrega: ${umaLinha(t.entrega, 260)} Não entrega: ${umaLinha(t.naoEntrega, 260)}${t.armadilha ? ` Armadilha: ${umaLinha(t.armadilha, 260)}` : ''}`,
    )
    .join('\n');
  return `**${umaLinha(migracao.escolhaDoTrilho?.pergunta ?? '', 120)}** ${umaLinha(migracao.escolhaDoTrilho?.$descricao ?? '', 400)}

${umaLinha(migracao.escolhaDoTrilho?.nota ?? '', 500)}

${itens}

Até existir registro privado, os pacotes saem como tarball de \`dist/pacotes/\` (\`pnpm run dist\` no repositório do UCAMDS):

\`\`\`bash
# Trilho A — legado (traz tokens, ícones e fontes junto)
pnpm add ${recursos.publicacao.host}${recursos.publicacao.pacotes}/ucam-css-${VERSAO}.tgz

# Trilho B — Angular moderno
pnpm add ${recursos.publicacao.host}${recursos.publicacao.pacotes}/ucam-ui-${VERSAO}.tgz ${recursos.publicacao.host}${recursos.publicacao.pacotes}/ucam-tokens-${VERSAO}.tgz

# Agentes, em qualquer trilho
pnpm add -D ${recursos.publicacao.host}${recursos.publicacao.pacotes}/ucam-ds-mcp-${VERSAO}.tgz
npx ucam-ds instalar
\`\`\``;
};

/* ------------------------------------------------------------- AGENTS.md --- */

const REGRAS_DE_OURO = [
  'Aplicação importa `<ucam-*>` (Trilho B, `@ucam/ui`) ou usa as classes `.ucam-*` sob um ancestral `.ucam` (Trilho A, `@ucam/css`). Nunca `<z-*>`: a ZardUI é matéria-prima do design system, não dependência (ADR-006).',
  'Cor, espaço, raio e tipografia só por token SEMÂNTICO (`var(--ucam-color-text-secondary)`). Nada de hex, nada de primitiva (`--ucam-wine-600`), nada de valor arbitrário (ADR-007).',
  'Componente, prop ou valor que o contrato não declara não existe. Consulte `ucam_get_component` antes de escrever o uso — não deduza a API pelo nome.',
  'Toda tela começa por uma tela de referência parecida (`ucam_list_templates`) e pelo padrão que ela implementa (`ucam_get_pattern`). Tela nova sem padrão é pedido de padrão, não improviso.',
  'Estado não se deduz do contrato do componente: `ucam_get_states` diz como cada um se desenha, qual vence quando dois se aplicam e como ele se chama. Desabilitado é COR explícita — nunca opacidade — sobre um chão só, e carregando nunca usa o atributo `disabled` (ADR-042).',
  'Antes de concluir, rode `ucam_check_usage` (ou `npx ucam-ds checar <arquivo>`) e corrija todo erro.',
];

const ADRS_ESSENCIAIS = new Set(['ADR-001', 'ADR-002', 'ADR-003', 'ADR-004', 'ADR-007', 'ADR-011', 'ADR-015', 'ADR-022', 'ADR-023', 'ADR-027', 'ADR-029', 'ADR-033', 'ADR-034', 'ADR-042', 'ADR-044']);


const secaoEstados = () => {
  const ordem = [...estados.estados].sort((a, b) => a.precedencia - b.precedencia);
  const fila = ordem
    .map((s) => `| ${s.precedencia} | \`${s.id}\` | ${umaLinha(s.gatilho, 60)} | ${umaLinha(s.aparencia, 200)} |`)
    .join('\n');
  // O vocabulário entra com os SINÔNIMOS à vista: a regra só é útil para quem
  // está prestes a escrever "aberto", e essa pessoa não procura por "open".
  const vocab = estados.vocabulario.termos
    .map((v) => `| \`${v.id}\` | ${umaLinha(v.uso, 80)} | ${(v.sinonimos ?? []).map((s) => `~~${s}~~`).join(', ') || '—'} |`)
    .join('\n');
  return `Vale para TODO componente interativo, e é a metade das regras que não está em contrato nenhum.

### Precedência

${umaLinha(estados.precedencia.regra, 400)}

| # | Estado | Gatilho | Aparência |
|---|---|---|---|
${fila}

**Exceção:** ${umaLinha(estados.precedencia.excecao, 300)}

### Desabilitado

- **${umaLinha(estados.disabled.chao_unico.regra, 400)}** ${umaLinha(estados.disabled.chao_unico.motivo, 300)}
- **${umaLinha(estados.disabled.dois_sinais.regra, 400)}** ${umaLinha(estados.disabled.dois_sinais.motivo, 300)}
- **Não confundir com somente leitura.** ${umaLinha(estados.disabled.dois_sinais.nao_confundir, 300)}
- **Nunca opacidade.** ${umaLinha(estados.disabled.motivo, 300)}
${estados.disabled.acessibilidade.map((a) => `- ${umaLinha(a, 320)}`).join('\n')}

### Carregando

**${umaLinha(estados.loading.regra, 200)}** ${umaLinha(estados.loading.motivo, 300)}

${estados.loading.posicao_do_indicador.map((p) => `- **${p.componente}:** ${umaLinha(p.posicao, 200)}`).join('\n')}

### Vocabulário

${umaLinha(estados.vocabulario.regra, 400)}

| Nome | Uso | Recusado |
|---|---|---|
${vocab}`;
};
const secaoTelas = projetos
  .map((p) => {
    const linhas = p.templates.map((t) => `| \`${p.id}/${t.id}\` | ${t.nome} | \`${t.padrao}\` | ${umaLinha(t.descricao, 140)} |`).join('\n');
    return `### ${p.nome}\n\n${umaLinha(p.descricao, 400)}\n\n| Tela | Nome | Padrão | O que resolve |\n|---|---|---|---|\n${linhas}`;
  })
  .join('\n\n');

const agentsMd = `# Design System da UCAM — instruções para agentes e desenvolvedores

> Gerado de \`spec/\` pelo UCAMDS ${VERSAO} (\`tools/build-agentes.mjs\`). Não editar à mão: a próxima versão do pacote sobrescreve.

Este projeto segue o **UCAMDS**. A fonte da verdade são os contratos em JSON que vêm neste pacote (\`spec/\`) e o servidor MCP \`ucamds\`, que responde a partir deles. Quando este texto e um contrato divergirem, **vale o contrato**.

## Regras de ouro

${REGRAS_DE_OURO.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Como trabalhar

| Pergunta | Ferramenta MCP | Sem MCP, leia |
|---|---|---|
| Que componentes existem? | \`ucam_list_components\` | \`spec/components/*.json\` |
| Qual é a API exata de um componente? | \`ucam_get_component\` | \`spec/components/<id>.json\` |
| Que cor, espaço ou raio uso? | \`ucam_get_tokens\` | \`spec/tokens/semantic.json\` |
| Já existe uma tela parecida? | \`ucam_list_templates\` → \`ucam_get_template\` | \`spec/templates.json\` |
| Qual padrão de tela vale aqui? | \`ucam_get_pattern\` | \`spec/patterns/patterns.json\` |
| Como desenho este estado? | \`ucam_get_states\` | \`spec/states.json\` |
| Por que a regra é essa? | \`ucam_get_decisions\` | \`spec/decisions/adr.json\` |
| Como converto esta tela legada? | \`ucam_migrate_from_legacy\` | \`spec/migracao.json\` e a seção \`migracao\` de cada contrato |
| Isto está certo? | \`ucam_check_usage\` | \`npx ucam-ds checar <arquivo>\` |

Skills que empacotam o método: ${recursos.skills.itens.map((s) => `\`${s.nome}\` (${umaLinha(s.faz, 90)})`).join('; ')}. \`npx ucam-ds instalar\` liga o MCP, as skills e este arquivo no projeto.

## Trilhos e instalação

${trilhos()}

## Decisões que mais pesam numa tela

${adrs
  .filter((a) => ADRS_ESSENCIAIS.has(a.id))
  .map((a) => `- **${a.id} — ${a.titulo}.** ${umaLinha(a.decisao, 420)}`)
  .join('\n')}

As ${adrs.length} decisões completas: \`ucam_get_decisions\`.

## Estados

${secaoEstados()}

## Checklist de tela

${checklist()}

## Erros que sobrevivem a uma migração literal

${lista(migracao.errosQueSobrevivem).map((e) => `- ${umaLinha(itemTexto(e), 300)}`).join('\n')}

## Escrita de interface

${lista(escrita.principios).slice(0, 8).map((p) => `- ${umaLinha(itemTexto(p), 240)}`).join('\n')}

## Catálogo (${componentes.length} contratos)

| Componente | Seletor | Maturidade | Para quê |
|---|---|---|---|
${componentes.map((c) => `| ${c.name} | \`${c.selector}\` | ${c.status} | ${umaLinha(c.description, 130)} |`).join('\n')}

## Padrões de tela

${padroes.map((p) => `- **\`${p.id}\` — ${p.nome}.** ${umaLinha(p.problema, 220)}${p.regras?.length ? `\n  Regras: ${p.regras.map((r) => umaLinha(r, 140)).join(' · ')}` : ''}`).join('\n')}

## Telas de referência

Cada tela já resolvida com o design system, com os problemas do legado, as notas de decisão e o código Angular de partida. Construa a sua a partir da mais parecida: \`ucam_get_template({ projeto, tela })\`.

${secaoTelas}
`;

/* ------------------------------------------------------------- llms.txt --- */

const llms = `# UCAMDS — Design System da Universidade Candido Mendes

> Contratos em JSON (componentes, tokens, padrões, telas de referência, decisões) e servidor MCP para agentes. Versão ${VERSAO}.

## Comece aqui
- [AGENTS.md](AGENTS.md): regras de ouro, fluxo de trabalho, catálogo e telas de referência
- [skills/ucam-ds/SKILL.md](skills/ucam-ds/SKILL.md): construir tela ou componente
- [skills/ucam-migrate/SKILL.md](skills/ucam-migrate/SKILL.md): migrar tela legada
- [skills/ucam-audit/SKILL.md](skills/ucam-audit/SKILL.md): auditar tela

## Dados
- [spec/components/](spec/components/): um contrato por componente
- [spec/tokens/semantic.json](spec/tokens/semantic.json): tokens semânticos (DTCG)
- [spec/states.json](spec/states.json): modelo de estados — precedência, desabilitado, carregando, vocabulário
- [spec/patterns/patterns.json](spec/patterns/patterns.json): padrões de tela
- [spec/templates.json](spec/templates.json): telas de referência por sistema
- [spec/decisions/adr.json](spec/decisions/adr.json): decisões
- [spec/migracao.json](spec/migracao.json): guia de migração
- [spec/layouts.json](spec/layouts.json): blocos de arranjo de página
- [spec/icons.json](spec/icons.json): o conjunto de ícones e o nome de cada um
- [spec/writing.json](spec/writing.json): escrita de interface — rótulo, mensagem de erro, vazio
- [spec/tokens/theme.dark.json](spec/tokens/theme.dark.json): sobrescritas do tema escuro (o ucam_get_tokens já resolve por tema)
`;

/* --------------------------------------------------------------- skills --- */

const cabecalhoSkill = (nome, descricao) => `---\nname: ${nome}\ndescription: ${descricao}\n---\n`;

const fonteDeDados = `## Onde estão os dados

Com o servidor MCP \`ucamds\` ligado, use as ferramentas \`ucam_*\`. Sem ele, os mesmos dados estão em \`node_modules/@ucam/ds-mcp/spec/\` e a regra geral em \`AGENTS.ucam.md\` (ou \`node_modules/@ucam/ds-mcp/AGENTS.md\`). Nunca responda de memória sobre props, tokens ou regras — a spec muda a cada versão.`;

const skillDs =
  cabecalhoSkill(
    'ucam-ds',
    'Constrói ou altera telas e componentes de aplicações da Universidade Candido Mendes usando o Design System da UCAM (UCAMDS): componentes <ucam-*> ou classes .ucam-*, tokens semânticos, padrões de tela e telas de referência. Use sempre que a tarefa for criar, montar, redesenhar ou ajustar interface num app da UCAM (SIGU, Módulo Gerencial, Protocolo, Portal, SigFin), escolher cor, espaçamento, botão, tabela ou formulário. Nunca emite hex cru, token primitivo, <z-*> nem prop fora do contrato.',
  ) +
  `
# Construir com o UCAMDS

${fonteDeDados}

## Ordem de trabalho

1. **Ache a tela parecida.** \`ucam_list_templates\` e \`ucam_get_template\`. Leia \`problemas\` e \`notas\`: são as decisões que a tela de referência já tomou, e a sua deve seguir as mesmas.
2. **Confirme o padrão.** \`ucam_get_pattern\` com o \`padrao\` da tela. As \`regras\` do padrão são obrigatórias (onde fica a ação de criar, onde vive a ordenação, como é o estado vazio).
3. **Leia o contrato de cada componente** que vai usar, com \`ucam_get_component\`. Olhe \`props\` (nomes e valores válidos), \`limites\` (quando NÃO usar) e \`acessibilidade\`.
4. **Escreva** com \`<ucam-*>\` (Trilho B) ou com as classes do Trilho A, só com tokens semânticos (\`ucam_get_tokens\`).
5. **Antes de desenhar qualquer estado**, \`ucam_get_states\`. O contrato do componente LISTA os estados que ele tem; como cada um se desenha, qual vence quando dois se aplicam e como ele se chama estão no modelo de estados, que vale para todos. É onde a tela nova mais erra: desabilitado por opacidade, carregando com o atributo \`disabled\`, e o mesmo estado com dois nomes em duas telas.
6. **Audite** com \`ucam_check_usage\` e corrija todos os erros. Avisos pedem justificativa escrita se ficarem.
7. **Passe o checklist** abaixo.

## Regras que mais aparecem em revisão

${REGRAS_DE_OURO.map((r) => `- ${r}`).join('\n')}
${adrs
  .filter((a) => ['ADR-002', 'ADR-023', 'ADR-029', 'ADR-034', 'ADR-022', 'ADR-003'].includes(a.id))
  .map((a) => `- **${a.titulo}** (${a.id}).`)
  .join('\n')}

## Checklist

${checklist()}
`;

const skillMigrate =
  cabecalhoSkill(
    'ucam-migrate',
    'Migra telas do parque legado da UCAM (AngularJS, Angular Material, Angular até 14, JSF/PrimeFaces do SIGU, HTML com CSS próprio) para o Design System da UCAM, aplicando os mapas de migração dos contratos e a ordem de operações do guia. Use quando a tarefa for converter, reescrever ou modernizar uma tela existente, ou quando o código tiver md-*, p:*, mat-*, ui-* ou classes visuais próprias.',
  ) +
  `
# Migrar para o UCAMDS

${fonteDeDados}

## Primeiro: qual trilho

${umaLinha(migracao.escolhaDoTrilho?.pergunta ?? '', 120)}

${lista(migracao.escolhaDoTrilho).map((t) => `- **${t.nome ?? t.id}** — quando: ${umaLinha(t.quando, 200)} Não entrega: ${umaLinha(t.naoEntrega ?? '', 200)}`).join('\n')}

## Ordem de operações

${lista(migracao.ordem).map((o, i) => `${i + 1}. ${umaLinha(itemTexto(o), 320)}`).join('\n')}

## Como usar a ferramenta

1. Passe o trecho legado para \`ucam_migrate_from_legacy\`. Ela devolve as \`sugestoes\` (legado → novo, com a nota quando a conversão não é 1:1) e os \`semCorrespondencia\`.
2. Para cada sugestão, abra o contrato com \`ucam_get_component\` e confira as props — a nota do mapa muitas vezes diz que o legado estava errado (vermelho em ação que não destrói, diálogo para formulário longo).
3. Procure a tela de referência do mesmo sistema em \`ucam_list_templates\`: os \`problemas\` dela costumam ser os mesmos da sua tela.
4. **Refaça os estados, não converta.** \`ucam_get_states\`. O legado desabilita por opacidade e por classe própria (\`.botao--desabilitado\`), e a conversão literal carrega isso para dentro do sistema novo: vira um botão que o portão de contraste dá por bom e ninguém lê. Carregando vira \`aria-busy\`, nunca \`disabled\`.
5. Rode \`ucam_check_usage\` no resultado.

## Erros que sobrevivem a uma conversão literal

${lista(migracao.errosQueSobrevivem).map((e) => `- ${umaLinha(itemTexto(e), 320)}`).join('\n')}
`;

const skillAudit =
  cabecalhoSkill(
    'ucam-audit',
    'Audita uma tela ou componente de aplicação da UCAM contra os contratos do Design System: uso de token, componente e prop existentes, limites de uso, um primário por tela, contraste, nome acessível, alvo de toque, caixa natural e as decisões registradas. Use em revisão de código, antes de abrir PR de interface, ou quando pedirem para revisar, conferir ou validar uma tela.',
  ) +
  `
# Auditar contra o UCAMDS

${fonteDeDados}

## Passos

1. **Máquina primeiro.** \`ucam_check_usage\` com o template e a folha da tela (ou \`npx ucam-ds checar <arquivos>\`). Todo erro entra no relatório.
2. **Contrato por componente.** Para cada \`<ucam-*>\` usado, \`ucam_get_component\` com \`secoes: ["limites", "acessibilidade", "conteudo"]\`. Confira se o uso cai em algum limite ("quando NÃO usar") e se os requisitos de acessibilidade estão na marcação (rótulo, \`aria-*\`, nome acessível que nomeia o objeto).
3. **Padrão.** Identifique o padrão da tela e confira as \`regras\` dele com \`ucam_get_pattern\`.
4. **Estados.** \`ucam_get_states\`. Confira: desabilitado por COR explícita e nunca por opacidade, com o chão único de \`color.action.disabled.background\` e sem aresta (ADR-042); somente leitura distinguível de desabilitado; carregando com \`aria-busy\`/\`aria-disabled\` e nunca com o atributo \`disabled\`; anel de foco nunca suprimido; e todo nome de estado no vocabulário do sistema, sem sinônimo em português.
5. **Decisões.** Confira as que mais reprovam: ${adrs
    .filter((a) => ['ADR-002', 'ADR-003', 'ADR-004', 'ADR-022', 'ADR-023', 'ADR-027', 'ADR-029', 'ADR-034'].includes(a.id))
    .map((a) => `${a.id} (${umaLinha(a.titulo, 80)})`)
    .join('; ')}.
6. **Fluxo.** Toda ação leva a algum lugar, está indisponível com o motivo ou age na própria tela com eco visível (ADR-033).

## Relatório

Uma linha por achado: severidade (erro / aviso), regra (ADR ou contrato), onde, o que está errado, a correção. Ordene do mais grave ao menos grave. Não reporte gosto: todo achado cita uma regra.

## Checklist de tela

${checklist()}
`;

/* ---------------------------------------------------------------- gravar --- */

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(SAIDA, { recursive: true });

writeFileSync(join(SAIDA, 'AGENTS.md'), agentsMd, 'utf8');
writeFileSync(join(SAIDA, 'llms.txt'), llms, 'utf8');
for (const [nome, conteudo] of [['ucam-ds', skillDs], ['ucam-migrate', skillMigrate], ['ucam-audit', skillAudit]]) {
  mkdirSync(join(SAIDA, 'skills', nome), { recursive: true });
  writeFileSync(join(SAIDA, 'skills', nome, 'SKILL.md'), conteudo, 'utf8');
}

// spec copiada: só o que as ferramentas leem
const spec = join(SAIDA, 'spec');
for (const d of ['components', 'patterns', 'decisions']) cpSync(join(ROOT, 'spec', d), join(spec, d), { recursive: true });
for (const f of ['templates.json', 'migracao.json', 'writing.json', 'layouts.json', 'states.json', 'icons.json']) copyFileSync(join(ROOT, 'spec', f), join(spec, f));
mkdirSync(join(spec, 'tokens'), { recursive: true });
for (const f of ['semantic.json', 'theme.dark.json']) copyFileSync(join(ROOT, 'spec', 'tokens', f), join(spec, 'tokens', f));
copyFileSync(join(ROOT, 'dist', 'tokens', 'ucam-tokens.json'), join(spec, 'tokens', 'ucam-tokens.json'));
const classes = [...new Set([...readFileSync(join(ROOT, 'dist/css/ucam.css'), 'utf8').matchAll(/\.(ucam-[\w-]+)/g)].map((m) => m[1]))].sort();
writeFileSync(join(spec, 'classes-trilho-a.json'), JSON.stringify({ $description: 'Classes que o @ucam/css desenha. Gerado de dist/css/ucam.css.', classes }, null, 2) + '\n', 'utf8');

// servidor e CLI
mkdirSync(join(SAIDA, 'mcp'), { recursive: true });
mkdirSync(join(SAIDA, 'bin'), { recursive: true });
copyFileSync(join(ROOT, 'tools/agentes/nucleo.mjs'), join(SAIDA, 'mcp/nucleo.mjs'));
copyFileSync(join(ROOT, 'tools/agentes/server.mjs'), join(SAIDA, 'mcp/server.mjs'));
copyFileSync(join(ROOT, 'tools/agentes/ucam-ds.mjs'), join(SAIDA, 'bin/ucam-ds.mjs'));

// exemplos de configuração
mkdirSync(join(SAIDA, 'exemplos', '.vscode'), { recursive: true });
writeFileSync(
  join(SAIDA, 'exemplos', '.mcp.json'),
  JSON.stringify({ mcpServers: { ucamds: { command: 'node', args: ['node_modules/@ucam/ds-mcp/mcp/server.mjs'] } } }, null, 2) + '\n',
  'utf8',
);
writeFileSync(
  join(SAIDA, 'exemplos', '.vscode', 'mcp.json'),
  JSON.stringify({ servers: { ucamds: { type: 'stdio', command: 'node', args: ['${workspaceFolder}/node_modules/@ucam/ds-mcp/mcp/server.mjs'] } } }, null, 2) + '\n',
  'utf8',
);

writeFileSync(
  join(SAIDA, 'README.md'),
  `# @ucam/ds-mcp

Kit do Design System da UCAM para agentes de IA e para quem os usa: servidor MCP, skills, \`AGENTS.md\` e os contratos em JSON. Versão ${VERSAO}.

## Instalar num app

Não há registro privado, então o pacote se instala pela URL do tarball — \`pnpm add @ucam/ds-mcp\` não resolve.

\`\`\`bash
pnpm add -D ${recursos.publicacao.host}${recursos.publicacao.pacotes}/ucam-ds-mcp-${VERSAO}.tgz
npx ucam-ds instalar
\`\`\`

\`instalar\` faz quatro coisas, sem apagar o que já existe:

1. registra o servidor \`ucamds\` em \`.mcp.json\` (Claude Code) e em \`.vscode/mcp.json\` (VS Code / Copilot);
2. copia as skills \`ucam-ds\`, \`ucam-migrate\` e \`ucam-audit\` para \`.claude/skills/\` e \`.agents/skills/\`;
3. grava \`AGENTS.ucam.md\` com as regras e o catálogo;
4. acrescenta a referência a ele em \`AGENTS.md\` e \`CLAUDE.md\`.

Reinicie o cliente depois.

## Ferramentas MCP

${recursos.mcp.ferramentas.map((f) => `- \`${f.nome}\` — ${f.faz}`).join('\n')}

## Auditoria na linha de comando e no CI

\`\`\`bash
npx ucam-ds checar src/app/**/*.html
\`\`\`

Sai com código 1 se houver erro.
`,
  'utf8',
);

// Manifesto mínimo: o servidor lê a versão daqui. O build-pacotes sobrescreve
// com o manifesto completo; sem este, o MCP rodando de dist/ respondia 0.0.0.
writeFileSync(join(SAIDA, 'package.json'), JSON.stringify({ name: '@ucam/ds-mcp', version: VERSAO, private: true, type: 'module' }, null, 2) + '\n', 'utf8');

console.log(`agentes → dist/agentes/  AGENTS.md · llms.txt · 3 skills · ${componentes.length} contratos · ${projetos.reduce((n, p) => n + p.templates.length, 0)} telas · ${classes.length} classes`);
