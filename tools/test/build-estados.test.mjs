import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('build-estados espelha a folha que --entrada aponta e escreve em --saida', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ucamds-estados-'));
  const entrada = join(dir, 'x.css');
  const saida = join(dir, 'out', 'x-estados.css');
  writeFileSync(entrada, '.ucam-site-btn--primary:hover { background: red; }\n.ucam-site :focus-visible { outline: 2px solid blue; }\n');
  const out = execFileSync(process.execPath, [join(ROOT, 'tools/build-estados.mjs'), '--entrada', entrada, '--saida', saida], { encoding: 'utf8' });
  const css = readFileSync(saida, 'utf8');
  assert.match(css, /\.ucam-estado\[data-ucam-estado="hover"\] \.ucam-site-btn--primary \{/);
  assert.match(css, /\.ucam-estado\[data-ucam-estado="focus"\] \.ucam-site \.ucam-estado-alvo \{/);
  assert.match(out, /x-estados\.css/);
});

test('build-estados sem argumentos continua lendo dist/css/ucam.css', () => {
  const fonte = readFileSync(join(ROOT, 'tools/build-estados.mjs'), 'utf8');
  assert.match(fonte, /'dist', 'css', 'ucam\.css'/);
  assert.match(fonte, /'site', 'src', 'generated', 'estados\.css'/);
});
