// Gera o que o site de docs lê sobre os sites: site/src/generated/sites.data.json
// (contratos + demos) e site/src/generated/sites.css (tokens + submarcas +
// folha, sem @import), e copia tokens, fontes e o css de fontes para
// site/src/assets/sites/, que o site serve em /sites/tokens/, /sites/fonts/
// e /sites/css/ — o mesmo espelho que a aplicação tem em /tokens/.
//
//   node tools/build-sites-index.mjs

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { familiasSites, fontFaceCss } from './lib/fonts-css.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function construirIndice({ raiz = ROOT } = {}) {
  const ler = (p) => JSON.parse(readFileSync(join(raiz, p), 'utf8'));
  const dist = join(raiz, 'dist', 'sites');
  for (const f of ['tokens/ucam-site-tokens.css', 'css/ucam-site.css']) {
    if (!existsSync(join(dist, f))) throw new Error(`dist/sites/${f} não existe — rode pnpm run sites`);
  }
  const demos = ler('sites/spec/demos.json').demos;
  // AS DECISÕES DE CADA PEÇA são as ADRs que o contrato dela CITA, na ordem do
  // adr.json. Não vêm do campo afeta: lá o casamento é pelo id, e o button dos
  // sites herdava as vinte e uma ADRs do button da aplicação; e pôr seletor
  // dos sites em afeta faria o validador da aplicação avisar "sem contrato".
  // O contrato já diz o que o governa, e o validador já confere que existe.
  const adrIds = ler('spec/decisions/adr.json').decisions.map((a) => a.id);
  const decisoesDe = (c) => {
    const citadas = new Set(JSON.stringify(c).match(/ADR-\d{3}/g) ?? []);
    return adrIds.filter((id) => citadas.has(id));
  };
  const componentes = readdirSync(join(raiz, 'sites/spec/components'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => ler(`sites/spec/components/${f}`))
    // seletor_angular: o seletor de verdade da peça em @ucam/site-ui, tirado do
    // trilho_b. O campo `selector` do contrato é o identificador da peça no
    // catálogo (ucam-site-<id>), não um elemento que exista.
    .map((c) => ({ ...c, demo: demos[c.id], decisoes: decisoesDe(c), seletor_angular: / — (.+?)\. Entradas: /.exec(c.implementacao?.trilho_b ?? '')?.[1] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const submarcas = readdirSync(join(dist, 'tokens'))
    .filter((f) => /^ucam-site-marca-.+\.css$/.test(f))
    .map((f) => f.replace(/^ucam-site-marca-/, '').replace(/\.css$/, ''))
    .sort();
  const { version } = ler('package.json');
  const data = { meta: { componentes: componentes.length, versao: version, submarcas }, componentes };

  const tokensCss = readFileSync(join(dist, 'tokens/ucam-site-tokens.css'), 'utf8');
  const marcasCss = submarcas.map((m) => readFileSync(join(dist, `tokens/ucam-site-marca-${m}.css`), 'utf8')).join('\n');
  const folha = readFileSync(join(dist, 'css/ucam-site.css'), 'utf8').replace(/@import\s+["'][^"']*ucam-site-tokens\.css["'];\s*/, '');
  // As fontes dos sites, para o site de docs: o espelho que este gerador copia
  // fica em /sites/fonts. Sem este bloco o preview declarava Work Sans e Inter
  // e desenhava na fonte do sistema — um catálogo que não mostra a tipografia
  // que documenta (visto na captura de 09/10/2026).
  const fontes = fontFaceCss('/sites/fonts', familiasSites);
  const css = `/* Gerado por tools/build-sites-index.mjs — fontes, tokens, submarcas e a folha do UCAMDS Sites. NÃO EDITAR À MÃO. */

${fontes}

${tokensCss}

${marcasCss}

${folha}
`;
  return { data, css };
}

function principal() {
  const { data, css } = construirIndice();
  const gen = join(ROOT, 'site', 'src', 'generated');
  mkdirSync(gen, { recursive: true });
  writeFileSync(join(gen, 'sites.data.json'), JSON.stringify(data, null, 2) + '\n', 'utf8');
  writeFileSync(join(gen, 'sites.css'), css, 'utf8');
  const assets = join(ROOT, 'site', 'src', 'assets', 'sites');
  for (const sub of ['tokens', 'fonts', 'css']) {
    const origem = join(ROOT, 'dist', 'sites', sub);
    if (!existsSync(origem)) continue;
    mkdirSync(join(assets, sub), { recursive: true });
    cpSync(origem, join(assets, sub), { recursive: true });
  }
  console.log(`site/src/generated/sites.data.json · ${data.meta.componentes} componente(s), submarca ${data.meta.submarcas.join(', ') || 'nenhuma'}`);
  console.log('site/src/generated/sites.css · site/src/assets/sites/{tokens,fonts,css}');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) principal();
