import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conferirMarcaVsDestrutivo, DECISIVOS } from '../check-marca-vs-destrutivo.mjs';

const mapa = (primario, perigo) => (nome) => ({
  'action-primary-default': primario[0],
  'action-primary-hover': primario[1],
  'action-primary-active': primario[2],
  'action-danger-default': perigo[0],
  'action-danger-hover': perigo[1],
  'action-danger-active': perigo[2],
}[nome] ?? null);

const RED = ['#B44334', '#9F2F23', '#7F2A1F'];

test('o par do UCAMDS (wine.600/700/800 × red.600/700/800) passa', () => {
  const r = conferirMarcaVsDestrutivo({ tema: 'base', cor: mapa(['#8D293A', '#6C1E2B', '#52151F'], RED), coexistem: [] });
  assert.deepEqual(r.falhas, []);
  assert.equal(r.relatos.length, DECISIVOS.length);
});

test('magenta.700 como ação encosta no red.600 e reprova', () => {
  const r = conferirMarcaVsDestrutivo({ tema: 'cenpre', cor: mapa(['#B4365B', '#922243', '#70132F'], RED), coexistem: [] });
  // Os três estados encostam: 700×600 d=0,010, 800×700 d=0,038, 900×800 d=0,054.
  assert.equal(r.falhas.length, 3);
  assert.match(r.falhas[0], /preenchimento em repouso/);
  assert.match(r.falhas[0], /#B4365B × #B44334/);
});

test('magenta.800/900/1000 como ação passa nos três estados', () => {
  const r = conferirMarcaVsDestrutivo({ tema: 'cenpre', cor: mapa(['#922243', '#70132F', '#530E23'], RED), coexistem: [] });
  assert.deepEqual(r.falhas, []);
});

test('token ausente é falha nomeada, não exceção', () => {
  const r = conferirMarcaVsDestrutivo({ tema: 'x', cor: () => null, coexistem: [] });
  assert.equal(r.falhas.length, DECISIVOS.length);
  assert.match(r.falhas[0], /token ausente/);
});
