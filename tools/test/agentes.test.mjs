// O kit para agentes (@ucam/ds-mcp) sob teste: protocolo do servidor em stdio,
// as regras que o auditor cobra, o histórico de versões e o `ucam-ds instalar`
// atualizando o que ele mesmo gravou.
//
// Até 06/11/2026 esta prova morava em scratchpad/testa-mcp.mjs, fora do portão,
// e já estava quebrada sem ninguém saber: esperava o servidor chamado `dsucam`
// e ele se chamava `ucamds` desde o renome. Teste fora da suíte não é teste.
//
// Lê dist/agentes, que tools/test/preparar.mjs gera antes da suíte.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { gzipSync } from 'node:zlib';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mudancas, compararVersao } from '../agentes/nucleo.mjs';
import { conteudoDoTgz, diferencas } from '../lib/conteudo-tgz.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const KIT = join(ROOT, 'dist', 'agentes');
const lerJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const VERSAO = lerJson('package.json').version;

/* ----------------------------------------------- conversa com o servidor --- */

function abrirServidor() {
  const proc = spawn(process.execPath, [join(KIT, 'mcp', 'server.mjs')], { stdio: ['pipe', 'pipe', 'pipe'] });
  let id = 0;
  const pendentes = new Map();
  createInterface({ input: proc.stdout }).on('line', (linha) => {
    if (!linha.trim()) return;
    const msg = JSON.parse(linha);
    if (pendentes.has(msg.id)) {
      pendentes.get(msg.id)(msg);
      pendentes.delete(msg.id);
    }
  });
  const pedir = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id;
      pendentes.set(i, res);
      proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: i, method, params }) + '\n');
    });
  const chamar = async (name, args = {}) => {
    const r = await pedir('tools/call', { name, arguments: args });
    return { dados: JSON.parse(r.result.content[0].text), erro: r.result.isError };
  };
  return { pedir, chamar, fechar: () => proc.kill() };
}

test('o kit foi gerado antes da suíte', () => {
  assert.ok(existsSync(join(KIT, 'mcp', 'server.mjs')), 'dist/agentes não existe — rode tools/test/preparar.mjs');
});

test('protocolo: initialize, ping, lista de ferramentas', async (t) => {
  const s = abrirServidor();
  t.after(s.fechar);
  const ini = await s.pedir('initialize', { protocolVersion: '2025-06-18' });
  assert.equal(ini.result.protocolVersion, '2025-06-18');
  assert.equal(ini.result.serverInfo.name, 'ucamds');
  assert.equal(ini.result.serverInfo.version, VERSAO, 'o servidor diz a versão do kit que serve');
  for (const f of ['ucam_get_states', 'ucam_check_usage', 'ucam_get_changes']) {
    assert.ok(ini.result.instructions.includes(f), `as instruções citam ${f}: o agente precisa saber dela antes de precisar`);
  }
  assert.deepEqual((await s.pedir('ping')).result, {});

  const { tools } = (await s.pedir('tools/list')).result;
  const nomes = tools.map((x) => x.name);
  assert.ok(nomes.includes('ucam_get_changes'));
  assert.equal(new Set(nomes).size, nomes.length, 'nome de ferramenta repetido');
  for (const x of tools) {
    assert.ok(x.description?.length > 40, `${x.name} sem descrição útil`);
    assert.equal(x.inputSchema?.type, 'object', `${x.name} sem schema`);
  }
  const listadas = lerJson('spec/resources.json').mcp.ferramentas.map((f) => f.nome).sort();
  assert.deepEqual(listadas, [...nomes].sort(), 'spec/resources.json lista as mesmas ferramentas que o servidor serve');

  const ruim = await s.pedir('tools/call', { name: 'ucam_nao_existe', arguments: {} });
  assert.ok(ruim.error || ruim.result?.isError, 'ferramenta inexistente vira erro, não queda');
  const semArg = await s.pedir('tools/call', { name: 'ucam_check_usage', arguments: { code: 'x' } });
  assert.equal(semArg.error?.code, -32602, 'argumento obrigatório faltando é erro de protocolo, nunca aprovação');
});

test('estados: precedência, desabilitado e sinônimos chegam ao agente', async (t) => {
  const s = abrirServidor();
  t.after(s.fechar);
  const todos = (await s.chamar('ucam_get_states')).dados;
  assert.equal(todos.precedencia.ordem[0], 'disabled');
  assert.match(todos.precedencia.excecao, /focus-visible NUNCA/);
  assert.ok(todos.disabled.chao_unico && todos.disabled.dois_sinais);
  assert.match(todos.loading.regra, /NUNCA o atributo disabled/);
  const sin = (await s.chamar('ucam_get_states', { estado: 'aberto' })).dados;
  assert.equal(sin.vocabulario?.id, 'open');
  const nada = await s.chamar('ucam_get_states', { estado: 'inexistente' });
  assert.equal(nada.erro, true);
});

test('auditor: pega os defeitos plantados e não acusa o uso certo', async (t) => {
  const s = abrirServidor();
  t.after(s.fechar);
  const ruim = (
    await s.chamar('ucam_check_usage', {
      codigo: [
        '.ucam-btn:disabled { opacity: 0.5; }',
        '.ucam-input:disabled { background: var(--ucam-color-surface-subtle); }',
        '<ucam-button [loading]="salvando()" disabled>Salvar</ucam-button>',
        '<div data-estado="aberto"></div>',
      ].join('\n'),
    })
  ).dados;
  const regras = ruim.achados.map((a) => a.regra);
  assert.equal(regras.filter((r) => r === 'ADR-042').length, 2);
  assert.equal(regras.filter((r) => r === 'estados').length, 2);
  assert.equal(ruim.resumo.aprovado, false);

  const certo = (
    await s.chamar('ucam_check_usage', {
      codigo: [
        '.ucam-btn:disabled { background: var(--ucam-color-action-disabled-background); color: var(--ucam-color-action-disabled-text); border-color: transparent; }',
        '.ucam-input[readonly] { background: var(--ucam-color-surface-subtle); }',
        '<ucam-button variant="primary" [loading]="salvando()" aria-busy="true" aria-disabled="true">Salvar</ucam-button>',
      ].join('\n'),
    })
  ).dados;
  assert.deepEqual(certo.achados.filter((a) => a.regra === 'ADR-042' || a.regra === 'estados'), []);
});

test('catálogo, contrato e tokens continuam respondendo', async (t) => {
  const s = abrirServidor();
  t.after(s.fechar);
  const comps = (await s.chamar('ucam_list_components')).dados;
  assert.ok(comps.length >= 60);
  const btn = (await s.chamar('ucam_get_component', { id: 'button' })).dados;
  assert.ok(btn.props?.length > 0);
  assert.match(JSON.stringify((await s.chamar('ucam_get_tokens', { prefixo: 'color-action' })).dados), /action-disabled/);
  assert.ok((await s.pedir('resources/list')).result.resources.length > 0);
});

/* -------------------------------------------------------------- versões --- */

test('as três versões andam juntas e versoes.json fecha com elas', () => {
  const ui = lerJson('ui/projects/ui/package.json');
  const siteUi = lerJson('sites/ui/projects/site-ui/package.json');
  assert.equal(ui.version, VERSAO);
  assert.equal(siteUi.version, VERSAO);
  assert.equal(siteUi.peerDependencies?.['@ucam/site-css'], VERSAO);
  const versoes = lerJson('spec/versoes.json').versoes;
  assert.equal(versoes.at(-1).versao, VERSAO, 'suba a versão com pnpm run versao, que grava as duas coisas');
  for (let i = 1; i < versoes.length; i++) {
    assert.ok(compararVersao(versoes[i].versao, versoes[i - 1].versao) > 0, `${versoes[i].versao} fora de ordem`);
    assert.ok(versoes[i].data >= versoes[i - 1].data, `${versoes[i].versao} com data anterior à da versão de antes`);
  }
});

test('mudancas: janela de datas, novos por diferença de lista, e o que ficou sem versão', () => {
  const versoes = [
    { versao: '1.0.0', data: '2026-01-01', componentes: ['a'], telas: ['p/x'] },
    { versao: '1.1.0', data: '2026-02-01', componentes: ['a', 'b'], telas: ['p/x', 'p/y'] },
    { versao: '1.1.1', data: '2026-02-01' },
  ];
  const adrs = [
    { id: 'ADR-1', titulo: 'antes', data: '2026-01-01', status: 'aceita' },
    { id: 'ADR-2', titulo: 'na 1.1', data: '2026-01-15', status: 'aceita' },
    { id: 'ADR-3', titulo: 'depois', data: '2026-03-01', status: 'proposta' },
  ];
  const m = mudancas({ versoes, adrs, componentes: ['a', 'b', 'c'], telas: [] });
  assert.equal(m.ultima, '1.1.1');
  assert.equal(m.versoes[0].inicial, true);
  assert.deepEqual(m.versoes[1].adrs.map((a) => a.id), ['ADR-2'], 'a ADR do dia da versão anterior não entra na seguinte');
  assert.deepEqual(m.versoes[1].componentesNovos, ['b']);
  assert.deepEqual(m.versoes[1].telasNovas, ['p/y']);
  assert.equal(m.versoes[2].componentesNovos, null, 'sem lista registrada não se inventa diferença');
  assert.deepEqual(m.pendente.adrs.map((a) => a.id), ['ADR-3']);
  assert.deepEqual(mudancas({ versoes, adrs, desde: '1.1.0' }).versoes.map((v) => v.versao), ['1.1.1']);
  assert.ok(compararVersao('0.10.0', '0.9.9') > 0, 'compara número, não texto');
});

test('ucam_get_changes diz a versão do kit e respeita o desde', async (t) => {
  const s = abrirServidor();
  t.after(s.fechar);
  const tudo = (await s.chamar('ucam_get_changes')).dados;
  assert.equal(tudo.versaoDoKit, VERSAO);
  assert.equal(tudo.ultimaVersao, lerJson('spec/versoes.json').versoes.at(-1).versao);
  const nada = (await s.chamar('ucam_get_changes', { desde: tudo.ultimaVersao })).dados;
  assert.deepEqual(nada.versoes, []);
  assert.ok(existsSync(join(KIT, 'CHANGELOG.md')), 'o CHANGELOG sai da mesma função');
  assert.ok(readFileSync(join(KIT, 'CHANGELOG.md'), 'utf8').includes(`## ${tudo.ultimaVersao} —`));
});

/* ------------------------------------------- impressão do conteúdo do .tgz --- */

/** Tar mínimo em memória, no formato que o npm pack produz (prefixo package/). */
function tgz(arquivos) {
  const blocos = [];
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    const dados = Buffer.from(conteudo, 'utf8');
    const cab = Buffer.alloc(512);
    cab.write(`package/${nome}`, 0, 'utf8');
    cab.write('0000644\0', 100);
    cab.write(dados.length.toString(8).padStart(11, '0') + '\0', 124);
    cab.write('        ', 148);
    cab[156] = 48;
    cab.write('ustar\0' + '00', 257);
    let soma = 0;
    for (const b of cab) soma += b;
    cab.write(soma.toString(8).padStart(6, '0') + '\0 ', 148);
    blocos.push(cab, dados, Buffer.alloc((512 - (dados.length % 512)) % 512));
  }
  blocos.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocos));
}

test('impressão do conteúdo ignora a ordem de uma união de literais no .d.ts', () => {
  // O caso real da 0.2.0: a Vercel e a máquina local emitiram o mesmo tipo em ordem diferente.
  const a = conteudoDoTgz(tgz({ 'types/x.d.ts': 'zSize?: "xs" | "sm" | "default" | null;\nv: "a";' }));
  const b = conteudoDoTgz(tgz({ 'types/x.d.ts': 'zSize?: "default" | "xs" | "sm" | null;\nv: "a";' }));
  assert.equal(a.sha, b.sha);
  const c = conteudoDoTgz(tgz({ 'types/x.d.ts': 'zSize?: "default" | "xs" | "md" | null;\nv: "a";' }));
  assert.notEqual(a.sha, c.sha, 'membro trocado continua sendo mudança');
  const n1 = conteudoDoTgz(tgz({ 'types/x.d.ts': 'columns: InputSignal<1 | 3 | 2 | "auto">; h1: A | B;' }));
  const n2 = conteudoDoTgz(tgz({ 'types/x.d.ts': 'columns: InputSignal<2 | "auto" | 1 | 3>; h1: A | B;' }));
  assert.equal(n1.sha, n2.sha, 'união de números também');
  const j1 = conteudoDoTgz(tgz({ 'x.js': '//#region ../node_modules/.pnpm/@angular+elements@22_c469cd7a/x.mjs\nvar a = 1;\n//#endregion' }));
  const j2 = conteudoDoTgz(tgz({ 'x.js': '//#region ../node_modules/.pnpm/@angular+elements@22.1.4_@angular+core@22.1.4/x.mjs\nvar a = 1;\n//#endregion' }));
  assert.equal(j1.sha, j2.sha, 'o caminho do store no comentário de região não é conteúdo');
  const j3 = conteudoDoTgz(tgz({ 'x.js': '//#region a\nvar a = 2;\n//#endregion' }));
  assert.notEqual(j1.sha, j3.sha);
});

test('impressão do conteúdo ignora a hora do build e acusa o arquivo que mudou', () => {
  const a = conteudoDoTgz(tgz({ 'x.json': '{"$generated": "2026-10-01T00:00:00Z", "v": 1}', 'y.css': 'a{}' }));
  const b = conteudoDoTgz(tgz({ 'x.json': '{"$generated": "2026-11-06T09:00:00Z", "v": 1}', 'y.css': 'a{}' }));
  assert.equal(a.sha, b.sha, '$generated não é conteúdo');
  assert.deepEqual(Object.keys(a.arquivos).sort(), ['x.json', 'y.css'], 'o prefixo package/ do npm sai do nome');
  const c = conteudoDoTgz(tgz({ 'x.json': '{"v": 1}', 'y.css': 'a{color:red}' }));
  assert.notEqual(a.sha, c.sha);
  assert.deepEqual(diferencas(a.arquivos, c.arquivos), ['y.css']);
});

/* ------------------------------------- `ucam-ds instalar` numa atualização --- */

test('instalar atualiza o que o kit gravou e mantém o que o projeto editou', (t) => {
  const app = mkdtempSync(join(tmpdir(), 'ucam-app-'));
  t.after(() => rmSync(app, { recursive: true, force: true }));
  const cli = join(KIT, 'bin', 'ucam-ds.mjs');
  const rodar = () => execFileSync(process.execPath, [cli, 'instalar'], { cwd: app, encoding: 'utf8' });
  const agentes = join(app, 'AGENTS.ucam.md');
  const skill = join(app, '.claude', 'skills', 'ucam-ds', 'SKILL.md');
  const doKit = readFileSync(join(KIT, 'AGENTS.md'), 'utf8');

  rodar();
  assert.equal(readFileSync(agentes, 'utf8'), doKit);

  // Simula o arquivo de uma versão anterior: marca de gerado presente, texto velho.
  writeFileSync(agentes, doKit.replace(/pelo UCAMDS [\d.]+/, 'pelo UCAMDS 0.0.1') + '\nregra velha\n');
  writeFileSync(skill, readFileSync(skill, 'utf8') + '\npasso velho\n');
  const saida = rodar();
  assert.equal(readFileSync(agentes, 'utf8'), doKit, 'versão anterior gerada pelo kit é atualizada');
  assert.ok(!readFileSync(skill, 'utf8').includes('passo velho'), 'skill gerada pelo kit é atualizada');
  assert.match(saida, /AGENTS\.ucam\.md \(atualizado/);

  // O dev tirou a marca: editou de propósito, fica.
  writeFileSync(agentes, '# Nossas regras\n');
  assert.match(rodar(), /AGENTS\.ucam\.md: editado no projeto, mantido/);
  assert.equal(readFileSync(agentes, 'utf8'), '# Nossas regras\n');
});

/* ---------------------------------------------------------------- sites --- */

// Até 06/11/2026 o kit não sabia dos Sites: as peças do @ucam/site-ui não
// existiam para o agente, e o auditor REPROVAVA marcação certa de site
// (.ucam-site-btn "não é desenhada pelo @ucam/css") enquanto deixava passar a
// primitiva --ucam-site-wine-600.

test('sites: catálogo, contrato com demo e tokens por familia', async (t) => {
  const s = abrirServidor();
  t.after(s.fechar);
  const pecas = (await s.chamar('ucam_list_components', { familia: 'site' })).dados;
  const fonte = readdirSync(join(ROOT, 'sites', 'spec', 'components')).filter((f) => f.endsWith('.json')).length;
  assert.equal(pecas.length, fonte, 'toda peça de sites/spec/components chega ao agente');
  assert.ok(pecas.every((p) => p.familia === 'site' && p.classe?.startsWith('.ucam-site') && p.angular));
  const app = (await s.chamar('ucam_list_components')).dados;
  assert.ok(app.every((p) => p.familia === 'sistema'), 'sem familia, só a aplicação: o button do site não se confunde com o dela');

  const hero = (await s.chamar('ucam_get_component', { id: 'ucam-site-hero' })).dados;
  assert.equal(hero.familia, 'site', 'o seletor ucam-site-* resolve sem precisar da familia');
  assert.ok(hero.demo?.principal?.preview, 'a peça vem com o HTML da demo');
  assert.equal((await s.chamar('ucam_get_component', { id: 'button' })).dados.familia, 'sistema');
  assert.equal((await s.chamar('ucam_get_component', { id: '.ucam-site-btn' })).dados.id, 'button');
  const errado = await s.chamar('ucam_get_component', { id: 'hero' });
  assert.equal(errado.erro, true);
  assert.match(errado.dados.atencao, /familia "site"/, 'quem pede no sistema errado é avisado de que existe no outro');

  const tokens = (await s.chamar('ucam_get_tokens', { familia: 'site', prefixo: 'color-action-primary' })).dados;
  assert.ok(tokens.length && tokens.every((x) => x.css.startsWith('var(--ucam-site-color-action-primary')));
  const ruim = await s.pedir('tools/call', { name: 'ucam_list_components', arguments: { familia: 'outra' } });
  assert.equal(ruim.error?.code, -32602);
});

test('sites: o auditor aprova as 33 demos e pega o que é errado', async (t) => {
  const s = abrirServidor();
  t.after(s.fechar);
  const demos = JSON.parse(readFileSync(join(KIT, 'spec', 'sites', 'demos.json'), 'utf8')).demos;
  const achados = [];
  for (const [id, d] of Object.entries(demos)) {
    for (const bloco of [d.principal, ...(Array.isArray(d.exemplos) ? d.exemplos : [])].filter(Boolean)) {
      for (const k of ['codigo', 'preview']) {
        if (!bloco[k]) continue;
        const r = (await s.chamar('ucam_check_usage', { codigo: bloco[k] })).dados;
        for (const a of r.achados) achados.push(`${id}: [${a.regra}] ${a.mensagem}`);
      }
    }
  }
  assert.deepEqual(achados, [], 'a demo é marcação certa por definição: achado nela é falso positivo');

  const regras = async (codigo) => (await s.chamar('ucam_check_usage', { codigo })).dados.achados.map((a) => a.regra);
  assert.deepEqual(await regras('<div style="color: var(--ucam-site-wine-600)"></div>'), ['ADR-007']);
  assert.deepEqual(await regras('<a class="ucam-site-btn--gigante" href="/">x</a>'), ['sites']);
  assert.deepEqual(await regras('<ucam-site-hero></ucam-site-hero>'), ['sites']);
  assert.deepEqual(await regras('<div class="ucam-site"><button class="ucam-btn">x</button></div>'), ['sites'], 'misturar os dois sistemas avisa');
  assert.deepEqual(await regras('<div class="ucam"><select></select></div>'), ['ADR-011'], 'na aplicação o select nativo segue avisado');
});
