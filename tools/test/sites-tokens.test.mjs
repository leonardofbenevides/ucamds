import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { construir } from '../build-sites-tokens.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/* Um repositório mínimo: o primitivo compartilhado real, e uma semântica de
 * sites pequena o bastante para o teste ler. */
function repoMinimo({ extensao, semantic, marcas = {} } = {}) {
  const raiz = mkdtempSync(join(tmpdir(), 'ucamds-sites-'));
  mkdirSync(join(raiz, 'spec/tokens'), { recursive: true });
  mkdirSync(join(raiz, 'sites/spec/tokens'), { recursive: true });
  cpSync(join(ROOT, 'spec/tokens/primitive.json'), join(raiz, 'spec/tokens/primitive.json'));
  writeFileSync(join(raiz, 'sites/spec/tokens/primitive.json'), JSON.stringify(extensao ?? { magenta: { $type: 'color', 800: { $value: '#922243' } } }));
  writeFileSync(join(raiz, 'sites/spec/tokens/semantic.json'), JSON.stringify(semantic ?? SEMANTICA));
  for (const [id, m] of Object.entries(marcas)) writeFileSync(join(raiz, `sites/spec/tokens/marca.${id}.json`), JSON.stringify(m));
  return raiz;
}

const SEMANTICA = {
  color: {
    $type: 'color',
    surface: { canvas: { $value: '{neutral.0}' }, inverse: { $value: '{neutral.700}' }, brand: { $value: '{wine.600}' } },
    text: { primary: { $value: '{neutral.800}' }, 'on-inverse': { $value: '{neutral.0}' }, 'on-brand': { $value: '{neutral.0}' }, 'on-action': { $value: '{neutral.0}' }, link: { $value: '{wine.600}' } },
    action: {
      primary: { default: { $value: '{wine.600}' }, hover: { $value: '{wine.700}' }, active: { $value: '{wine.800}' }, subtle: { $value: '{wine.50}' } },
      danger: { default: { $value: '{red.600}' }, hover: { $value: '{red.700}' }, active: { $value: '{red.800}' } },
    },
    border: { focus: { $value: '{neutral.500}' }, 'focus-on-inverse': { $value: '{neutral.300}' } },
    feedback: { danger: { background: { $value: '{red.100}' }, foreground: { $value: '{red.700}' }, border: { $value: '{red.500}' } } },
  },
  typography: { $type: 'typography', body: { $value: { fontSize: '{fontSize.md}', fontWeight: '{fontWeight.regular}', lineHeight: '1.5' } } },
};

test('a spec real dos sites passa em todos os portões e gera os quatro arquivos', () => {
  const r = construir({ raiz: ROOT });
  assert.deepEqual(r.falhas, []);
  const nomes = r.arquivos.map(([n]) => n);
  assert.deepEqual(nomes, ['ucam-site-tokens.css', '_ucam-site-tokens.scss', 'ucam-site-tokens.json', 'ucam-site-marca-cenpre.css']);
  const css = r.arquivos[0][1];
  assert.match(css, /--ucam-site-color-action-primary-default: #8D293A;/);
  assert.match(css, /--ucam-site-typography-display-hero-font-size: clamp\(/);
  assert.doesNotMatch(css, /--ucam-color-/);
  const marca = r.arquivos[3][1];
  assert.match(marca, /:root\[data-marca="cenpre"\] \{/);
  assert.match(marca, /--ucam-site-color-action-primary-default: #922243;/);
  assert.doesNotMatch(marca, /--ucam-site-color-text-primary/);
});

test('o repositório mínimo passa', () => {
  const r = construir({ raiz: repoMinimo() });
  assert.deepEqual(r.falhas, []);
});

test('extensão que redefine wine.600 derruba nomeando o caminho', () => {
  const raiz = repoMinimo({ extensao: { wine: { 600: { $value: '#000000' } } } });
  assert.throws(() => construir({ raiz }), /redefine primitivo compartilhado: wine\.600/);
});

test('hex cru em cor da semântica é falha', () => {
  const s = structuredClone(SEMANTICA);
  s.color.text.link = { $value: '#B4365B' };
  const r = construir({ raiz: repoMinimo({ semantic: s }) });
  assert.ok(r.falhas.some((f) => /hex cru.*color-text-link/.test(f)), r.falhas.join('\n'));
});

test('submarca que cria token é falha; submarca que só sobrescreve passa', () => {
  const cria = { color: { text: { novo: { $value: '{magenta.800}' } } } };
  const r1 = construir({ raiz: repoMinimo({ marcas: { x: cria } }) });
  assert.ok(r1.falhas.some((f) => /marca x cria token color-text-novo/.test(f)), r1.falhas.join('\n'));
  const sobrescreve = { color: { action: { primary: { default: { $value: '{magenta.800}' } } } } };
  const r2 = construir({ raiz: repoMinimo({ marcas: { x: sobrescreve } }) });
  assert.deepEqual(r2.falhas, []);
});

test('par de contraste que reprova é falha com o par nomeado', () => {
  const s = structuredClone(SEMANTICA);
  s.color.text.primary = { $value: '{neutral.300}' };
  const r = construir({ raiz: repoMinimo({ semantic: s }) });
  assert.ok(r.falhas.some((f) => /texto principal sobre a página/.test(f)), r.falhas.join('\n'));
});

test('submarca cuja ação encosta no vermelho é falha de marca × destrutivo', () => {
  const ext = { magenta: { $type: 'color', 700: { $value: '#B4365B' }, 800: { $value: '#922243' }, 900: { $value: '#70132F' } } };
  const marca = { color: { action: { primary: { default: { $value: '{magenta.700}' }, hover: { $value: '{magenta.800}' }, active: { $value: '{magenta.900}' } } } } };
  const r = construir({ raiz: repoMinimo({ extensao: ext, marcas: { cenpre: marca } }) });
  assert.ok(r.falhas.some((f) => /\[cenpre\] preenchimento em repouso/.test(f)), r.falhas.join('\n'));
});

test('adaptador: destino inexistente é falha; nome do kit fora do mapa é falha quando o scss existe', () => {
  const raiz = repoMinimo();
  mkdirSync(join(raiz, 'sites/spec/adapters'), { recursive: true });
  writeFileSync(join(raiz, 'sites/spec/adapters/kit.json'), JSON.stringify({
    id: 'kit', name: 'kit', alvo: { repositorio: 'x', arquivo: '_tokens.scss' },
    mapa: { '$color-brand': { destino: 'color.action.primary.default' }, '$color-x': { destino: 'color.nao.existe' } },
  }));
  const scss = join(raiz, '_tokens.scss');
  writeFileSync(scss, '$color-brand: #b4365b;\n$color-x: #000;\n$space-4: 4px;\n');
  const r = construir({ raiz, kitScss: scss });
  assert.ok(r.falhas.some((f) => /\$color-x.*color\.nao\.existe/.test(f)), r.falhas.join('\n'));
  assert.ok(r.falhas.some((f) => /\$space-4.*sem destino no adaptador kit/.test(f)), r.falhas.join('\n'));
});

test('adaptador: sem o scss no disco, a cobertura vira aviso', () => {
  const raiz = repoMinimo();
  mkdirSync(join(raiz, 'sites/spec/adapters'), { recursive: true });
  writeFileSync(join(raiz, 'sites/spec/adapters/kit.json'), JSON.stringify({
    id: 'kit', name: 'kit', alvo: { repositorio: 'x', arquivo: '_tokens.scss' },
    mapa: { '$color-brand': { destino: 'color.action.primary.default' } },
  }));
  const r = construir({ raiz, kitScss: join(raiz, 'nao-existe.scss') });
  assert.deepEqual(r.falhas, []);
  assert.ok(r.desvios.some((d) => /kit.*não está no disco/.test(d)));
});

test('o adaptador real do CENPRE cobre o _tokens.scss do kit, se ele estiver no disco', () => {
  const r = construir({ raiz: ROOT });
  assert.deepEqual(r.falhas, []);
});
