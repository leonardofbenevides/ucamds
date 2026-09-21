/**
 * Portão: a frase de regra do anexo diz o que o campo realmente aceita?
 *
 * O contrato file-field manda a frase ser GERADA de accept e maxSize, e
 * explica por quê: "para que o que a tela promete e o que o campo aceita não
 * possam divergir". No Trilho B ela é gerada mesmo. Nas TELAS, não: a frase é
 * escrita à mão no markup, ao lado dos data-accept e data-max-size que a
 * governam — e tem de continuar escrita, porque o Trilho A é folha de estilo
 * e a regra precisa existir num app AngularJS sem JavaScript nosso.
 *
 * Declarar e depois cobrar é a mesma escolha do check-ancoras. O preço de
 * declarar é a chance de desalinhar: alguém muda o limite para 5 MB no
 * data-max-size e a frase continua prometendo 10. Este portão cobra o preço.
 *
 * A conta não é reimplementada aqui: vem de tools/lib/anexo-regra.mjs, o
 * mesmo módulo que documenta a regra do contrato.
 *
 *   node tools/check-regra-anexo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { regraDeAnexo } from './lib/anexo-regra.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const atributo = (tag, nome) => {
  const m = tag.match(new RegExp(`\\b${nome}=(['"])([\\s\\S]*?)\\1`));
  return m ? m[2] : null;
};

const semTags = (html) =>
  html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const soMarcacao = (html) =>
  html.replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<script\b[\s\S]*?<\/script>/gi, '');

/**
 * O apoio do campo a que este gatilho pertence. A frase de regra vem PRIMEIRO
 * nele; o hint da tela, se houver, vem depois ("Opcional.") — o contrato diz
 * que o hint soma ao lado da regra, nunca no lugar dela.
 */
function apoioDoCampo(html, iGatilho) {
  const depois = html.slice(iGatilho);
  const m = depois.match(/<(span|p)[^>]*class=(['"])[^'"]*\bucam-field__hint\b[^'"]*\2[^>]*>([\s\S]*?)<\/\1>/);
  if (m) return semTags(m[3]);
  // Campo cujo apoio vem ANTES do gatilho.
  const antes = html.slice(0, iGatilho);
  const todos = [...antes.matchAll(/<(span|p)[^>]*class=(['"])[^'"]*\bucam-field__hint\b[^'"]*\2[^>]*>([\s\S]*?)<\/\1>/g)];
  return todos.length ? semTags(todos[todos.length - 1][3]) : null;
}

function confere(html, onde, achados) {
  for (const m of html.matchAll(/<[a-z]+\b[^>]*\bdata-(?:accept|max-size)=[^>]*>/gi)) {
    const tag = m[0];
    const accept = atributo(tag, 'data-accept') || '';
    const bruto = atributo(tag, 'data-max-size');
    const maxSize = bruto ? Number(bruto) : null;
    const esperada = regraDeAnexo({ accept, maxSize });
    if (!esperada) continue;

    const apoio = apoioDoCampo(html, m.index);
    if (!apoio) {
      achados.push({ onde, esperada, erro: 'o campo declara accept/maxSize e não tem frase de regra nenhuma' });
      continue;
    }
    if (!apoio.startsWith(esperada)) {
      achados.push({ onde, esperada, erro: `a frase diz "${apoio}"` });
    }
  }
}

function cordasDe(v, saco = []) {
  if (typeof v === 'string') { if (/data-(accept|max-size)=/.test(v)) saco.push(v); return saco; }
  if (Array.isArray(v)) { for (const x of v) cordasDe(x, saco); return saco; }
  if (v && typeof v === 'object') { for (const x of Object.values(v)) cordasDe(x, saco); return saco; }
  return saco;
}

const alvos = [];
const telas = path.join(ROOT, 'site/src/assets/t');
if (fs.existsSync(telas)) {
  for (const f of fs.readdirSync(telas).filter((x) => x.endsWith('.html'))) {
    alvos.push({ arquivo: path.join(telas, f), rotulo: `telas/${f}`, json: false });
  }
}
for (const rel of ['spec/templates.json', 'spec/demos.json']) {
  const p = path.join(ROOT, rel);
  if (fs.existsSync(p)) alvos.push({ arquivo: p, rotulo: rel, json: true });
}

const achados = [];
let campos = 0;

for (const a of alvos) {
  const bruto = fs.readFileSync(a.arquivo, 'utf8');
  const pedacos = (a.json ? cordasDe(JSON.parse(bruto)) : [bruto]).map(soMarcacao);
  for (const p of pedacos) {
    campos += (p.match(/\bdata-accept=|\bdata-max-size=/g) || []).length;
    confere(p, a.rotulo, achados);
  }
}

if (achados.length) {
  console.error('');
  for (const x of achados) {
    console.error(`  ${x.onde}`);
    console.error(`    ✗ ${x.erro}`);
    console.error(`      accept e maxSize pedem: "${x.esperada}"`);
  }
  console.error(`\n✗ regra do anexo  ${achados.length} campo(s) prometendo coisa diferente do que aceitam.`);
  console.error('  file-field.json: a regra é gerada de accept e maxSize, nunca escrita à parte.');
  process.exit(1);
}

console.log(`✓ regra do anexo  ${campos} declaração(ões), frase igual ao que o campo aceita`);
