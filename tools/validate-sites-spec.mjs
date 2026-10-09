// Valida os contratos de sites/spec/components/ contra o MESMO JSON Schema da
// aplicação e contra o perfil de contrato dos sites (spec de 08/10/2026):
// selector ucam-site-<id>, só token semântico dos sites, classes que existem
// na folha, vs e composição simétricos, demo com preview e código, evidência,
// limites, boas práticas, sem trilho_b.
//
// Roda DEPOIS do build-sites-css: confere classe contra a folha.
//
//   node tools/validate-sites-spec.mjs

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv from 'ajv/dist/2020.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Achata uma árvore DTCG em nomes `--ucam-site-a-b-c`. */
function nomesDe(arvore) {
  const out = new Set();
  (function anda(no, trilha) {
    for (const [k, v] of Object.entries(no)) {
      if (k.startsWith('$') || k.startsWith('_')) continue;
      if (v && typeof v === 'object' && '$value' in v) {
        const nome = `--ucam-site-${[...trilha, k].join('-')}`;
        // Token composto (tipografia) sai na folha como uma variável por
        // propriedade, em kebab: typography-lede-font-size. É o mesmo
        // desdobramento de tools/lib/tokens.mjs (expandComposite).
        if (v.$value && typeof v.$value === 'object') {
          for (const prop of Object.keys(v.$value)) out.add(`${nome}-${prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`);
        } else out.add(nome);
      } else if (v && typeof v === 'object') anda(v, [...trilha, k]);
    }
  })(arvore, []);
  return out;
}

export function validar({ raiz = ROOT, css } = {}) {
  const ler = (p) => JSON.parse(readFileSync(join(raiz, p), 'utf8'));
  const erros = [];
  const avisos = [];
  const falha = (arquivo, msg) => erros.push({ arquivo, msg });
  const avisa = (arquivo, msg) => avisos.push({ arquivo, msg });

  const caminhoFolha = join(raiz, 'dist/sites/css/ucam-site.css');
  const folha = css ?? (existsSync(caminhoFolha) ? readFileSync(caminhoFolha, 'utf8') : '');
  if (!folha) falha('dist/sites/css/ucam-site.css', 'não existe — rode node tools/build-sites-css.mjs antes');
  const classesDaFolha = new Set([...folha.matchAll(/\.(ucam-site[a-z0-9_-]*)/g)].map((m) => m[1]));
  const variaveisDaFolha = new Set([...folha.matchAll(/var\(\s*(--ucam-site-[a-z0-9-]+)/g)].map((m) => m[1]));

  /* ---------------------------------------------------------- schema --- */
  const schema = ler('spec/schema/component.schema.json');
  const ajv = new Ajv({ allErrors: true, strict: false });
  const valido = ajv.compile(schema);
  const dir = join(raiz, 'sites/spec/components');
  const arquivos = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  const contratos = arquivos.map((f) => ({ file: `sites/spec/components/${f}`, spec: ler(`sites/spec/components/${f}`) }));
  const ids = new Set(contratos.map((c) => c.spec.id));
  const seletores = new Set(contratos.map((c) => c.spec.selector));

  for (const { file, spec } of contratos) {
    if (!valido(spec)) for (const e of valido.errors) falha(file, `${e.instancePath || '/'} ${e.message}`);
    const esperado = `ucam-site-${spec.id}`;
    if (spec.selector !== esperado) falha(file, `selector "${spec.selector}" deveria ser "${esperado}"`);
    if (spec.id !== file.split('/').pop().replace(/\.json$/, '')) falha(file, `id "${spec.id}" não corresponde ao nome do arquivo`);
  }

  /* ------------------------------------------------------ tokens --- */
  const semantic = ler('sites/spec/tokens/semantic.json');
  const primitive = { ...ler('spec/tokens/primitive.json'), ...ler('sites/spec/tokens/primitive.json') };
  const grupos = new Set(Object.keys(primitive).filter((k) => !k.startsWith('$') && !k.startsWith('_')));
  const existeSemantico = (ref) => {
    let cur = semantic;
    for (const seg of ref.split('.')) {
      cur = cur?.[seg];
      if (!cur) return false;
    }
    return true;
  };
  const semanticos = nomesDe(semantic);
  const primitivos = nomesDe(primitive);
  const GRUPOS_SEMANTICOS = /^(color|space|size|radius|typography|elevation|container|viewport|motion|font|focus|z)\./;

  for (const { file, spec } of contratos) {
    const json = JSON.stringify(spec);
    for (const m of json.matchAll(/"([a-z]+(?:\.[a-z-]+){1,4})"/g)) {
      const ref = m[1];
      const grupo = ref.split('.')[0];
      if (grupos.has(grupo) && !['color', 'space', 'radius'].includes(grupo)) {
        falha(file, `cita token primitivo "${ref}" — só a camada semântica dos sites é pública (ADR-007)`);
      } else if (GRUPOS_SEMANTICOS.test(ref) && !existeSemantico(ref)) {
        falha(file, `cita token semântico inexistente nos sites "${ref}"`);
      }
    }
    for (const v of spec.implementacao?.trilho_a?.variaveis ?? []) {
      if (!v.startsWith('--ucam-site-')) falha(file, `variável fora do prefixo dos sites: ${v}`);
      else if (primitivos.has(v) && !semanticos.has(v)) falha(file, `variável primitiva em trilho_a.variaveis: ${v}`);
      else if (!semanticos.has(v)) falha(file, `variável inexistente em trilho_a.variaveis: ${v}`);
      else if (!variaveisDaFolha.has(v)) avisa(file, `trilho_a.variaveis cita ${v}, que a folha não lê`);
    }
  }

  /* ------------------------------------------------------ perfil --- */
  const caminhoDemos = join(raiz, 'sites/spec/demos.json');
  const demos = existsSync(caminhoDemos) ? ler('sites/spec/demos.json').demos : {};
  for (const { file, spec } of contratos) {
    const id = spec.id;
    if (!spec.evidencia) falha(file, `${id} sem evidencia — o perfil dos sites exige a origem no site no ar ou no kit`);
    if (!spec.quando_usar?.length) falha(file, `${id} sem quando_usar`);
    if (!spec.limites) falha(file, `${id} sem limites`);
    if (!(spec.boas_praticas?.length >= 2)) falha(file, `${id} com menos de duas boas_praticas`);
    const temBomRuim = Object.values(spec.conteudo ?? {}).some((v) => v && typeof v === 'object' && !Array.isArray(v) && (v.bom || v.ruim));
    if (!temBomRuim) avisa(file, `${id}: conteudo sem par bom/ruim`);
    if (!spec.implementacao?.trilho_a?.raiz) falha(file, `${id} sem implementacao.trilho_a.raiz`);
    if (spec.implementacao?.trilho_b) avisa(file, `${id} declara trilho_b — a lib Angular dos sites é o subprojeto 3`);
    if (spec.eventos) falha(file, `${id} declara eventos — é Angular; sai até o subprojeto 3`);
    const raizClasse = spec.implementacao?.trilho_a?.raiz?.replace(/^\./, '');
    if (raizClasse && !classesDaFolha.has(raizClasse)) falha(file, `${id}: trilho_a.raiz ${raizClasse} não existe na folha`);
    for (const parte of spec.anatomia ?? []) {
      const cl = parte.classe?.replace(/^\./, '');
      if (cl && !classesDaFolha.has(cl)) falha(file, `${id}: anatomia "${parte.parte}" cita a classe ${cl}, que a folha não emite`);
    }
    for (const p of spec.props ?? []) {
      for (const [chave, v] of Object.entries(p.valores ?? {})) {
        const cl = v.classe?.replace(/^\./, '');
        if (cl && !classesDaFolha.has(cl)) falha(file, `${id}: prop ${p.nome}=${chave} cita a classe ${cl}, que a folha não emite`);
      }
    }
    const d = demos[id];
    if (!d) falha(file, `${id} sem demo em sites/spec/demos.json`);
    else {
      if (!d.principal?.preview) falha(file, `${id}: demo sem principal.preview`);
      if (!d.principal?.codigo) falha(file, `${id}: demo sem principal.codigo`);
      for (const html of [d.principal?.preview, ...(d.exemplos ?? []).map((e) => e.preview)]) {
        for (const m of (html ?? '').matchAll(/\b(ucam-site[a-z0-9_-]*)/g)) {
          if (!classesDaFolha.has(m[1])) falha(file, `${id}: o preview usa a classe ${m[1]}, que a folha não emite`);
        }
        if (/\bucam-(?!site)[a-z]/.test(html ?? '')) falha(file, `${id}: o preview usa classe da aplicação (ucam-…) — os sites só leem ucam-site-*`);
      }
    }
    for (const sel of [...(spec.composicao?.usa ?? []), ...(spec.composicao?.usada_por ?? [])]) {
      if (!sel.startsWith('ucam-site-')) falha(file, `${id}: composicao cita ${sel}, que não é dos sites`);
      else if (!seletores.has(sel)) avisa(file, `${id}: composicao cita ${sel}, ainda sem contrato`);
    }
  }

  /* ------------------------------------------------- simetrias --- */
  const porId = new Map(contratos.map((c) => [c.spec.id, c]));
  for (const { file, spec } of contratos) {
    for (const v of spec.vs ?? []) {
      const outro = porId.get(v.componente);
      if (!outro) {
        avisa(file, `${spec.id}: vs cita ${v.componente}, ainda sem contrato`);
        continue;
      }
      if (!(outro.spec.vs ?? []).some((x) => x.componente === spec.id)) {
        falha(outro.file, `${outro.spec.id} não devolve o vs que ${spec.id} declara — a desambiguação é simétrica`);
      }
    }
    for (const sel of spec.composicao?.usa ?? []) {
      const outro = porId.get(sel.replace('ucam-site-', ''));
      if (outro && !(outro.spec.composicao?.usada_por ?? []).includes(spec.selector)) {
        falha(outro.file, `${outro.spec.id} não declara usada_por ${spec.selector}, que o usa`);
      }
    }
    for (const sel of spec.composicao?.usada_por ?? []) {
      const outro = porId.get(sel.replace('ucam-site-', ''));
      if (outro && !(outro.spec.composicao?.usa ?? []).includes(spec.selector)) {
        falha(outro.file, `${outro.spec.id} não declara usa ${spec.selector}, que diz ser usado por ele`);
      }
    }
  }

  /* -------------------------------------------------------- ADRs --- */
  const adrIds = new Set(ler('spec/decisions/adr.json').decisions.map((a) => a.id));
  for (const { file, spec } of contratos) {
    for (const m of JSON.stringify(spec).matchAll(/ADR-\d{3}/g)) if (!adrIds.has(m[0])) falha(file, `cita ${m[0]}, que não existe`);
  }

  return { erros, avisos, total: contratos.length, ids: [...ids] };
}

function principal() {
  const r = validar();
  for (const a of r.avisos) console.log(`⚠ ${a.arquivo}: ${a.msg}`);
  if (r.erros.length) {
    console.error(`✗ ${r.erros.length} erro(s) nos contratos dos sites:`);
    for (const e of r.erros) console.error(`  ${e.arquivo}: ${e.msg}`);
    process.exit(1);
  }
  console.log(`✓ ${r.total} contrato(s) dos sites válidos (${r.ids.join(', ')})`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) principal();
