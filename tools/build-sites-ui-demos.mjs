// As demos Angular dos sites, de sites/spec/demos.json para um arquivo de
// componentes. O campo `angular` de cada demo é o template; o `codigo` ao lado
// é o HTML que ele tem de reproduzir.
//
// Um arquivo só, usado por dois: o teste de paridade da lib e a página
// /sites/<id> do site de docs. É o que garante que o código Angular
// documentado é o que roda e o que foi testado.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = 'sites/ui/projects/site-ui/src/testing/demos.gerado.ts';

/** O template vai num literal de crase: escapa o que o encerraria ou interpolaria. */
const literal = (s) => '`' + s.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${') + '`';
const nomeDe = (id, i) => `Demo_${id.replace(/[^a-zA-Z0-9]/g, '_')}_${i}`;

export function gerarDemos({ raiz = ROOT } = {}) {
  const demos = JSON.parse(readFileSync(join(raiz, 'sites/spec/demos.json'), 'utf8')).demos;
  const classes = [];
  const entradas = [];
  const ids = [];
  for (const [id, demo] of Object.entries(demos)) {
    const paineis = [
      demo.principal?.angular ? { titulo: 'principal', ...demo.principal } : null,
      ...(demo.exemplos ?? []).filter((e) => e.angular),
    ].filter(Boolean);
    if (!paineis.length) continue;
    ids.push(id);
    const itens = paineis.map((p, i) => {
      if (/<\/script/i.test(p.angular)) throw new Error(`${id}: a demo "${p.titulo}" tem </script no template Angular`);
      const nome = nomeDe(id, i);
      // Sem preserveWhitespaces: a demo compila como o template do consumidor.
      // Peças irmãs em linha vão dentro de .ucam-site-fileira, na spec.
      classes.push(`@Component({ imports: [UCAM_SITE], template: ${literal(p.angular)} })\nclass ${nome} {}`);
      const titulo = p.titulo === 'principal' ? "'principal'" : JSON.stringify(p.titulo);
      return `    { titulo: ${titulo}, html: ${JSON.stringify(p.codigo)}, componente: ${nome} },`;
    });
    entradas.push(`  ${JSON.stringify(id)}: [\n${itens.join('\n')}\n  ],`);
  }
  const tipo = 'Record<string, { titulo: string; html: string; componente: Type<unknown> }[]>';
  const ts = [
    '// GERADO por tools/build-sites-ui-demos.mjs a partir de sites/spec/demos.json.',
    '// Não editar: muda-se a demo na spec e roda-se `pnpm run sites`.',
    ids.length ? "import { Component, type Type } from '@angular/core';" : "import { type Type } from '@angular/core';",
    ...(ids.length ? ["import { UCAM_SITE } from '../public-api';"] : []),
    '',
    ...classes.flatMap((c) => [c, '']),
    ids.length ? `export const DEMOS: ${tipo} = {\n${entradas.join('\n')}\n};` : `export const DEMOS: ${tipo} = {};`,
    '',
  ].join('\n');
  return { ts, ids };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { ts, ids } = gerarDemos();
  mkdirSync(dirname(join(ROOT, DESTINO)), { recursive: true });
  writeFileSync(join(ROOT, DESTINO), ts);
  console.log(`${DESTINO} · ${ids.length} peça(s) com demo Angular`);
}
