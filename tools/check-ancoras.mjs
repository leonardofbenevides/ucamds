/**
 * Portão: a lista de âncoras declarada numa página bate com as seções do
 * template dela?
 *
 * A navegação "Nesta página" é DECLARADA, não varrida do DOM — no prerender
 * não há DOM, e um índice que só aparecesse depois da hidratação seria salto
 * de layout em toda página. O preço dessa escolha é que a lista pode
 * desalinhar do template: seção nova sem entrada some da navegação, e entrada
 * sem seção vira link para lugar nenhum. Este portão cobra o preço.
 *
 * O que ele NÃO cobre, de propósito: id montado em runtime
 * (`[id]="'trilho-' + t.id"`). Não dá para resolver estaticamente, e fingir
 * que dá seria pior — o portão passaria a mentir. Esses casos ficam para a
 * verificação por navegador, que confere âncora por âncora na página montada.
 *
 *   node tools/check-ancoras.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Relativo ao script, não ao cwd: o portão roda tanto da raiz quanto de site/.
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.join(ROOT, 'site/src/app/pages');

const arquivos = [];
(function anda(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) anda(p);
    else if (e.name.endsWith('.page.ts')) arquivos.push(p);
  }
})(RAIZ);

let problemas = 0;
let conferidas = 0;

for (const f of arquivos) {
  const s = fs.readFileSync(f, 'utf8');
  if (!s.includes('<ucam-nesta-pagina')) continue;

  // ids declarados, nas duas formas que o repositório usa:
  //   { id: 'x', rotulo: 'X' }            — lista literal
  //   põe(condição, 'x', 'X')             — o atalho da página de componente,
  //                                         que só empurra o item se a seção
  //                                         existir naquele contrato.
  const declarados = [
    ...[...s.matchAll(/\{\s*id:\s*'([^']+)'\s*,\s*rotulo:/g)].map((m) => m[1]),
    ...[...s.matchAll(/põe\([^;]*?,\s*'([^']+)'\s*,\s*'/g)].map((m) => m[1]),
  ];
  // ids presentes no template — de novo, só os literais.
  const noTemplate = new Set([...s.matchAll(/<section[^>]*\sid="([^"]+)"/g)].map((m) => m[1]));
  // e as seções cujo id é montado em runtime, que ficam de fora da conta.
  const dinamicas = [...s.matchAll(/<section[^>]*\s\[id\]="/g)].length;

  const orfaos = declarados.filter((id) => !noTemplate.has(id));
  const mudas = [...noTemplate].filter((id) => !declarados.includes(id));

  conferidas++;
  if (orfaos.length || mudas.length) {
    problemas++;
    console.error(`\n  ${f}`);
    for (const id of orfaos) console.error(`    ✗ declarado e sem seção no template: #${id}`);
    for (const id of mudas) console.error(`    ✗ seção sem entrada na navegação: #${id}`);
    if (dinamicas) console.error(`    (${dinamicas} seção(ões) de id dinâmico não entram nesta conta)`);
  }
}

if (problemas) {
  console.error(`\n✗ âncoras  ${problemas} página(s) com lista fora de sincronia com o template.`);
  process.exit(1);
}
console.log(`✓ âncoras  ${conferidas} páginas com navegação, listas em sincronia`);
