// SONDAS DAS TELAS — o que só se vê com a tela aberta no navegador.
//
// Os portões estáticos (validate-spec, obrigatoriedade, regra do anexo) leem a
// marcação. Os defeitos que mais custaram de setembro a novembro só apareceram
// com a tela renderizada: controle que não faz nada, ação que não avisa quem
// não vê, rolagem lateral no telefone, alvo de toque que cai no vizinho, anel
// de foco recortado ou sob o rodapé fixo, botão sem nome. Cada sonda morava
// num script de scratchpad/ com porta fixa; aqui elas são versionadas, sobem o
// próprio Chrome e o próprio servidor, e reprovam.
//
//   pnpm run telas                       (gera docs/t)
//   node tools/sondas.mjs                (todas as sondas, todas as telas)
//   node tools/sondas.mjs --so mortos,erros --projeto isencao --tela analise
//   node tools/sondas.mjs --paralelo 6 --json
//
// Achado novo reprova (saída 1). Achado conhecido e aceito vai em
// tools/sondas/excecoes.json com motivo e data — exceção nomeada, como o
// EXCECOES do check-daltonismo. Exceção que não aparece mais é aviso: tire-a.
// Relatório completo em dist/sondas/relatorio.json.

import { readdirSync, statSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { abreNavegador } from './lib/cdp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const PASTA = join(ROOT, 'tools', 'sondas');

const args = process.argv.slice(2);
const opc = (k, d = null) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const lista = (k) => (opc(k) ? opc(k).split(',').map((s) => s.trim()).filter(Boolean) : null);
const SO = lista('so');
const PROJETOS = lista('projeto');
const TELAS_PEDIDAS = lista('tela');
const PARALELO = Number(opc('paralelo', '4'));
const RAIZ = opc('raiz') ? resolve(ROOT, opc('raiz')) : DOCS;
const COMO_JSON = args.includes('--json');
const EXCECOES_ARQ = opc('excecoes') ? resolve(ROOT, opc('excecoes')) : join(PASTA, 'excecoes.json');

/* ---------------------------------------------------------------- sondas --- */
const ORDEM = ['erros', 'nomes', 'rolagem', 'alvos', 'foco', 'estados', 'mortos', 'mudas'];
const SONDAS = [];
for (const n of ORDEM) {
  if (SO && !SO.includes(n)) continue;
  SONDAS.push(await import(pathToFileURL(join(PASTA, n + '.mjs')).href));
}
if (SO) for (const n of SO) if (!ORDEM.includes(n)) { console.error(`✗ sonda desconhecida: ${n} (há: ${ORDEM.join(', ')})`); process.exit(2); }

/* ----------------------------------------------------------------- telas --- */
const T = join(RAIZ, 't');
if (!existsSync(T)) { console.error(`✗ ${T} não existe — rode: pnpm run telas`); process.exit(2); }
const telas = [];
for (const projeto of readdirSync(T).sort()) {
  const d = join(T, projeto);
  if (projeto === 'fonte' || !statSync(d).isDirectory()) continue;
  if (PROJETOS && !PROJETOS.includes(projeto)) continue;
  for (const f of readdirSync(d).filter((x) => x.endsWith('.html')).sort()) {
    const tela = f.slice(0, -5);
    if (TELAS_PEDIDAS && !TELAS_PEDIDAS.includes(tela) && !TELAS_PEDIDAS.includes(`${projeto}/${tela}`)) continue;
    telas.push(`${projeto}/${tela}`);
  }
}
if (!telas.length) { console.error('✗ nenhuma tela casou com o filtro'); process.exit(2); }

/* ------------------------------------------------------------- exceções --- */
const excecoes = existsSync(EXCECOES_ARQ) ? JSON.parse(readFileSync(EXCECOES_ARQ, 'utf8')).excecoes || [] : [];
const casa = (sonda, tela, chave) => excecoes.find((e) => e.sonda === sonda && (e.tela === tela || e.tela === '*') && e.chave === chave);
const usadas = new Set();

/* --------------------------------------------------------------- rodada --- */
const t0 = Date.now();
const nav = await abreNavegador({ raiz: RAIZ });
const resultado = {};
let feitas = 0;
const fila = [...telas];

async function trabalhador() {
  const p = await nav.pagina();
  while (fila.length) {
    const tela = fila.shift();
    const url = (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return `${nav.base}/t/${tela}.html${q ? '?' + q : ''}`;
    };
    resultado[tela] = {};
    for (const s of SONDAS) {
      let achados;
      try { achados = await s.roda(p, { url, tela }); }
      catch (e) { achados = [{ chave: 'a sonda falhou', detalhe: e.message.slice(0, 160) }]; }
      resultado[tela][s.nome] = achados.map((a) => {
        const ex = casa(s.nome, tela, a.chave);
        if (ex) usadas.add(ex);
        return { ...a, aceito: ex ? ex.motivo : undefined };
      });
    }
    feitas++;
    if (!COMO_JSON && process.stdout.isTTY) process.stdout.write(`\r  ${feitas}/${telas.length} telas`);
  }
  await p.fecha();
}

try {
  await Promise.all(Array.from({ length: Math.min(PARALELO, telas.length) }, trabalhador));
} finally {
  await nav.fecha();
}

/* ------------------------------------------------------------- relatório --- */
const novos = [];
const aceitos = [];
for (const tela of telas) {
  for (const [sonda, achados] of Object.entries(resultado[tela])) {
    for (const a of achados) (a.aceito ? aceitos : novos).push({ tela, sonda, ...a });
  }
}
const filtroCompleto = !SO && !PROJETOS && !TELAS_PEDIDAS;
const sobrando = filtroCompleto ? excecoes.filter((e) => !usadas.has(e)) : [];

mkdirSync(join(ROOT, 'dist', 'sondas'), { recursive: true });
const relatorio = {
  $generated: new Date().toISOString(),
  telas: telas.length,
  sondas: SONDAS.map((s) => ({ nome: s.nome, pergunta: s.pergunta })),
  novos: novos.length, aceitos: aceitos.length,
  resultado,
};
if (filtroCompleto) writeFileSync(join(ROOT, 'dist', 'sondas', 'relatorio.json'), JSON.stringify(relatorio, null, 2));

if (COMO_JSON) {
  console.log(JSON.stringify({ novos, aceitos: aceitos.length, sobrando }, null, 2));
} else {
  if (process.stdout.isTTY) process.stdout.write('\r');
  const seg = ((Date.now() - t0) / 1000).toFixed(0);
  const porSonda = {};
  for (const n of novos) porSonda[n.sonda] = (porSonda[n.sonda] || 0) + 1;
  for (const s of SONDAS) {
    const n = porSonda[s.nome] || 0;
    console.log(`  ${n ? '✗' : '✓'} ${s.nome.padEnd(8)} ${n ? String(n).padStart(3) + ' achado(s)' : '         ok'}  — ${s.pergunta}`);
  }
  if (novos.length) {
    console.log('');
    let ultima = '';
    for (const n of novos) {
      if (n.tela !== ultima) { console.log(`  ${n.tela}`); ultima = n.tela; }
      console.log(`    · [${n.sonda}] ${n.chave}${n.detalhe ? '  (' + n.detalhe + ')' : ''}`);
    }
  }
  if (sobrando.length) {
    console.log(`\n  ⚠ ${sobrando.length} exceção(ões) que não aparecem mais — tire de tools/sondas/excecoes.json:`);
    for (const e of sobrando) console.log(`    · [${e.sonda}] ${e.tela} :: ${e.chave}`);
  }
  console.log(`\n${novos.length ? '✗' : '✓'} sondas  ${telas.length} telas × ${SONDAS.length} sondas em ${seg}s · ${novos.length} achado(s) novo(s) · ${aceitos.length} aceito(s) com motivo`);
}
process.exitCode = novos.length ? 1 : 0;
