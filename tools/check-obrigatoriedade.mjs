/**
 * Portão: todo asterisco de campo obrigatório tem obrigatoriedade de verdade
 * no controle?
 *
 * O contrato field.json diz a regra em duas linhas: "a marca é o asterisco no
 * rótulo, DECORATIVO, e a obrigatoriedade real vive em required/aria-required
 * no controle". O asterisco é aria-hidden — lido em voz alta ele seria
 * "estrela" e não informaria nada. Se o atributo não está lá, o campo é
 * obrigatório só para quem enxerga, e a validação do navegador diverge da do
 * formulário.
 *
 * Em 19/09/2026 a revisão de feedback encontrou a regra quebrada em três das
 * quatro telas que marcam campo obrigatório, e o defeito era invisível: o
 * asterisco estava lá, bonito, em cima de um controle sem nada. Uma das
 * quebras nem era do autor da tela — o conversor de <select> em gatilho
 * (select-listbox.mjs) descartava o `required` na conversão, porque <button>
 * não tem esse atributo. O portão existe para que nenhuma das duas formas
 * volte em silêncio.
 *
 * O que ele cobre: o HTML gerado das telas, a página do legado, e as duas
 * fontes de onde esse HTML sai (spec/templates.json e spec/demos.json).
 *
 *   node tools/check-obrigatoriedade.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const MARCA = 'ucam-field__required';
const CONTROLES = 'input|select|textarea|button';

const atributo = (tag, nome) => {
  const m = tag.match(new RegExp(`\\b${nome}=(['"])([\\s\\S]*?)\\1`));
  return m ? m[2] : null;
};

/** `required` nativo ou `aria-required="true"` — o contrato aceita os dois. */
const obrigatorio = (tag) =>
  /\srequired(?=[\s/>=])/.test(tag) || atributo(tag, 'aria-required') === 'true';

/**
 * Cada asterisco encontrado devolve o veredito do campo a que ele pertence.
 *
 * O caminho até o controle é o mesmo que o leitor de tela faz: do rótulo pelo
 * `for`, ou do <legend> para o <fieldset> que ele nomeia. Rótulo sem `for`
 * também é falha — sem ele o asterisco não governa controle nenhum.
 */
function confere(html, onde, achados) {
  let i = -1;
  while ((i = html.indexOf(MARCA, i + 1)) !== -1) {
    const antes = html.slice(0, i);
    const iRot = Math.max(antes.lastIndexOf('<label'), antes.lastIndexOf('<legend'));
    if (iRot === -1) {
      achados.push({ onde, campo: '(marca fora de rótulo)', erro: 'asterisco sem <label> nem <legend> antes' });
      continue;
    }
    const tagRot = html.slice(iRot, html.indexOf('>', iRot) + 1);
    const fim = html.indexOf('<', html.indexOf('>', iRot) + 1);
    const campo = html.slice(html.indexOf('>', iRot) + 1, fim).trim() || '(sem texto)';

    if (tagRot.startsWith('<legend')) {
      // Grupo: quem carrega a obrigatoriedade é o <fieldset>, como o
      // ucam-radio-group do Trilho B faz.
      const iFs = antes.lastIndexOf('<fieldset');
      if (iFs === -1) {
        achados.push({ onde, campo, erro: '<legend> com asterisco fora de <fieldset>' });
        continue;
      }
      const tagFs = html.slice(iFs, html.indexOf('>', iFs) + 1);
      if (!obrigatorio(tagFs)) achados.push({ onde, campo, erro: 'fieldset sem aria-required="true"' });
      continue;
    }

    const alvo = atributo(tagRot, 'for');
    if (!alvo) {
      achados.push({ onde, campo, erro: '<label> com asterisco e sem for=' });
      continue;
    }
    const re = new RegExp(`<(?:${CONTROLES})\\b[^>]*\\sid=(['"])${alvo}\\1[^>]*>`);
    const m = html.match(re);
    if (!m) {
      achados.push({ onde, campo, erro: `nenhum controle com id="${alvo}"` });
      continue;
    }
    if (!obrigatorio(m[0])) achados.push({ onde, campo, erro: `#${alvo} sem required nem aria-required` });
  }
}

/**
 * Fora a folha e os scripts embutidos: as telas autônomas carregam o CSS
 * inteiro dentro de <style>, e a REGRA `.ucam-field__required` contava como
 * marca — 20 falsos positivos, um por tela.
 */
const soMarcacao = (html) =>
  html.replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<script\b[\s\S]*?<\/script>/gi, '');

/** Do JSON entram só as cordas: é nelas que o HTML das telas e demos viaja. */
function cordasDe(v, saco = []) {
  if (typeof v === 'string') { if (v.includes(MARCA)) saco.push(v); return saco; }
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
for (const rel of ['docs/index.html']) {
  const p = path.join(ROOT, rel);
  if (fs.existsSync(p)) alvos.push({ arquivo: p, rotulo: rel, json: false });
}
for (const rel of ['spec/templates.json', 'spec/demos.json']) {
  const p = path.join(ROOT, rel);
  if (fs.existsSync(p)) alvos.push({ arquivo: p, rotulo: rel, json: true });
}

const achados = [];
let marcas = 0;

for (const a of alvos) {
  const bruto = fs.readFileSync(a.arquivo, 'utf8');
  const pedacos = (a.json ? cordasDe(JSON.parse(bruto)) : [bruto]).map(soMarcacao);
  for (const p of pedacos) {
    marcas += p.split(MARCA).length - 1;
    confere(p, a.rotulo, achados);
  }
}

if (achados.length) {
  console.error('');
  let atual = null;
  for (const x of achados) {
    if (x.onde !== atual) { console.error(`  ${x.onde}`); atual = x.onde; }
    console.error(`    ✗ ${x.campo} — ${x.erro}`);
  }
  console.error(`\n✗ obrigatoriedade  ${achados.length} de ${marcas} marca(s) sem atributo no controle.`);
  console.error('  field.json: o asterisco é decorativo; required/aria-required é que obriga.');
  process.exit(1);
}

console.log(`✓ obrigatoriedade  ${marcas} campos marcados, todos com required ou aria-required`);
