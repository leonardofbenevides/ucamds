// Fatia 3a-1: a lib Angular dos sites. Gerador de demos, validador e pacote.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { gerarDemos } from '../build-sites-ui-demos.mjs';

/** Uma raiz mínima: só sites/spec/demos.json. */
const raizCom = (demos) => {
  const raiz = mkdtempSync(join(tmpdir(), 'sites-ui-'));
  mkdirSync(join(raiz, 'sites/spec'), { recursive: true });
  writeFileSync(join(raiz, 'sites/spec/demos.json'), JSON.stringify({ demos }));
  return raiz;
};

test('demo sem a forma Angular não gera componente', () => {
  const { ts, ids } = gerarDemos({ raiz: raizCom({ tag: { principal: { preview: '<span></span>', codigo: '<span></span>' } } }) });
  assert.deepEqual(ids, []);
  assert.match(ts, /export const DEMOS[^=]*= \{\};/);
  assert.ok(!ts.includes('UCAM_SITE'), 'sem demo não há o que importar da lib');
});

test('a principal vem primeiro, e cada exemplo com Angular vira um componente com o HTML ao lado', () => {
  const { ts, ids } = gerarDemos({
    raiz: raizCom({
      tag: {
        principal: { preview: '<span class="x">a</span>', codigo: '<span class="ucam-site-tag">EAD</span>', angular: '<span ucamSiteTag>EAD</span>' },
        exemplos: [
          { titulo: 'Sem Angular', codigo: '<span></span>' },
          { titulo: 'Sobre seção escura', codigo: '<span class="ucam-site-tag ucam-site-tag--inverse">Estágio</span>', angular: '<span ucamSiteTag tone="inverse">Estágio</span>' },
        ],
      },
    }),
  });
  assert.deepEqual(ids, ['tag']);
  assert.equal((ts.match(/@Component\(/g) ?? []).length, 2);
  assert.ok(ts.indexOf("titulo: 'principal'") < ts.indexOf('titulo: "Sobre seção escura"'), 'a principal não é a primeira');
  assert.ok(ts.includes(JSON.stringify('<span class="ucam-site-tag">EAD</span>')), 'o html da principal não é o codigo');
  assert.ok(ts.includes('template: `<span ucamSiteTag tone="inverse">Estágio</span>`'));
  assert.match(ts, /import \{ UCAM_SITE \} from '\.\.\/public-api';/);
  // O espaço entre dois elementos em linha é parte do que a demo mostra: o
  // Angular o tira ao compilar, e dois botões ficavam 4px mais juntos que no HTML.
  assert.equal((ts.match(/preserveWhitespaces: true/g) ?? []).length, 2);
});

test('crase, cifrão-chave e barra invertida do template saem escapados', () => {
  const { ts } = gerarDemos({ raiz: raizCom({ tag: { principal: { codigo: '<span></span>', angular: 'a`b ${c} d\\e' } } }) });
  assert.ok(ts.includes('template: `a\\`b \\${c} d\\\\e`'), ts);
});

test('fechamento de script no template reprova, dizendo a peça', () => {
  assert.throws(() => gerarDemos({ raiz: raizCom({ tag: { principal: { codigo: '<span></span>', angular: '<span></script></span>' } } }) }), /tag/);
});
