/**
 * Portão: crase NUA dentro do template literal de um componente Angular.
 *
 * Uma crase escrita num comentário — `id`, `middle`, `max-inline-size` — fecha
 * a string do `template:` e o que vem depois vira lixo sintático. O erro que
 * sai não fala em crase nenhuma: é "Cannot find name 'inline'" ou "Cannot find
 * name 'styles'", a dezenas de linhas do defeito, e o build morre inteiro.
 *
 * Aconteceu quatro vezes em três arquivos diferentes (tools/build-css.mjs,
 * pages/telas/[projeto]/[id].page.ts, pages/catalogo/[id].page.ts), sempre por
 * escrever um termo técnico entre crases como se o comentário fosse markdown.
 * Dentro de template literal o certo é aspas — ou a crase escapada, que é o que
 * o build-css.mjs já fazia no resto do arquivo.
 *
 *   node tools/check-crases.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Relativo ao script, não ao cwd: o portão roda tanto da raiz (pnpm run build)
// quanto de site/ (pnpm generate), e caminho relativo ao cwd quebra num dos dois.
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// DUAS raízes de componente Angular, não uma. O portão nasceu olhando só
// para o site e, em 08/09/2026, a mesma crase nua quebrou o build da
// BIBLIOTECA — 'Em `row` o valor aparece' dentro do template de
// ucam-stat. O wrapper é componente Angular igual à página do site e cai na
// mesma armadilha; ficar de fora do portão era acidente de origem, não
// decisão. Diretório que não existe é ignorado: quem só tem o site continua
// rodando o portão sem tropeçar.
const RAIZES = [
  path.join(ROOT, 'site/src/app'),
  path.join(ROOT, 'ui/projects/ui/src/lib/ucam'),
].filter((d) => fs.existsSync(d));
const BARRA = String.fromCharCode(92);

/** Toda crase da linha que não vem precedida de barra invertida. */
function crasesNuas(linha) {
  const achadas = [];
  for (let i = 0; i < linha.length; i++) {
    if (linha[i] === '`' && linha[i - 1] !== BARRA) achadas.push(i);
  }
  return achadas;
}

const arquivos = [];
for (const raiz of RAIZES) {
  (function anda(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) anda(p);
      else if (e.name.endsWith('.ts')) arquivos.push(p);
    }
  })(raiz);
}

/* --------------------------------------------- os geradores em tools/ ---
 *
 * BURACO QUE ESTE BLOCO FECHA: o cabeçalho deste portão cita build-css.mjs
 * como um dos arquivos onde o defeito aconteceu — e o portão nunca olhou para
 * ele. Só varria .ts de site/src/app. Em 03/09 o mesmo erro reapareceu duas
 * vezes no build-css.mjs com o portão reportando verde, porque os geradores
 * emitem CSS de dentro de um template literal aberto de outro jeito
 * (`export const css = \``), que a varredura de @Component não reconhece.
 *
 * A regra aqui é mais simples e não depende de reconhecer a abertura: conta
 * crases não escapadas para saber se a linha está DENTRO de um literal, e
 * dentro dele qualquer crase numa linha de comentário é erro. Serve para os
 * dois casos — uma crase (o literal fecha e o resto vira lixo) e duas (o
 * termo entre elas é interpretado como JavaScript). */
const TOOLS = path.join(ROOT, 'tools');
const geradores = fs
  .readdirSync(TOOLS, { withFileTypes: true })
  .flatMap((e) =>
    e.isDirectory()
      ? fs.readdirSync(path.join(TOOLS, e.name)).filter((n) => n.endsWith('.mjs')).map((n) => path.join(TOOLS, e.name, n))
      : e.name.endsWith('.mjs') && e.name !== 'check-crases.mjs'
        ? [path.join(TOOLS, e.name)]
        : [],
  );

/** Linha que o humano escreveu como comentário — CSS ou JS. */
const pareceComentario = (l) => {
  const t = l.trim();
  return t.startsWith('*') || t.startsWith('/*') || t.startsWith('//') || t.includes('/*');
};

/* Crase dentro de aspas não abre literal nenhum — este próprio portão tem
 * `linha[i] === '<crase>'` na função lá em cima, e contá-la invertia o estado
 * do resto do arquivo. Some com o conteúdo entre aspas antes de contar. */
const semStrings = (l) => l.replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/"(?:[^"\\]|\\.)*"/g, '""');

/* A crase que QUEBRA é a de markdown: vem colada num termo técnico, como em
 * "a parte <crase>search<crase>". A que FECHA o literal vem sozinha, seguida
 * de ponto e vírgula, vírgula ou fim de linha. Distinguir as duas é o que
 * separa achado de ruído — sem isto o portão acusava o próprio fechamento de
 * literal do build-tokens.mjs. */
const CRASE_DE_MARKDOWN = /(?<!\\)`[A-Za-z0-9_<@$./-]/;

let achados = 0;

for (const f of geradores) {
  const linhas = fs.readFileSync(f, 'utf8').split('\n');
  let dentro = false;
  for (let i = 0; i < linhas.length; i++) {
    const limpa = semStrings(linhas[i]);
    if (dentro && pareceComentario(limpa) && CRASE_DE_MARKDOWN.test(limpa)) {
      achados++;
      console.error(`  ${f}:${i + 1}  [literal]  ${linhas[i].trim().slice(0, 88)}`);
    }
    if (crasesNuas(limpa).length % 2 === 1) dentro = !dentro;
  }
}
for (const f of arquivos) {
  const linhas = fs.readFileSync(f, 'utf8').split('\n');
  // Onde estamos: dentro de `template:` / `styles:` de um @Component, ou fora.
  let dentro = null;
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    if (!dentro) {
      const abre = /^\s*(template|styles):\s*`\s*$/.exec(l);
      if (abre) dentro = abre[1];
      continue;
    }
    // A linha que fecha o literal é uma crase sozinha, com ou sem vírgula.
    if (/^\s*`,?\s*$/.test(l)) {
      dentro = null;
      continue;
    }
    if (crasesNuas(l).length) {
      achados++;
      console.error(`  ${f}:${i + 1}  [${dentro}]  ${l.trim().slice(0, 88)}`);
    }
  }
}

if (achados) {
  console.error(`\n✗ ${achados} crase(s) nua(s) em template literal.`);
  console.error('  Dentro de template:/styles: use aspas, não crase.');
  process.exit(1);
}
console.log(`✓ crases  ${arquivos.length + geradores.length} arquivos (site + biblioteca + geradores), nenhuma crase nua em template literal`);
