// Monta os pacotes distribuíveis do DSUCAM a partir do que já existe em dist/.
//
//   node tools/build-pacotes.mjs
//
// Saída: dist/pacotes/<nome>/ (a árvore do pacote) e dist/pacotes/*.tgz
// (o tarball versionado, que é o artefato que se instala hoje e o mesmo que
// um dia vai para o `npm publish` — nada aqui se joga fora quando existir
// registro privado).
//
// POR QUE TARBALL, E NÃO SÓ A PASTA: `pnpm add ./dist/pacotes/tokens` cria um
// link simbólico para a pasta do repositório. O app passa a enxergar o
// trabalho em curso, e a versão que ele diz consumir deixa de existir de
// verdade. O .tgz congela — é instalação, não atalho.
//
// A VERSÃO TEM UMA FONTE SÓ: o `version` do package.json da raiz. Os três
// pacotes sobem juntos, porque a ponte entre eles (a ponte Zard, os tokens que
// o CSS importa) não tem compatibilidade cruzada declarada. Versões
// independentes exigiriam matriz de compatibilidade — e não há quem a mantenha.

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SAIDA = join(DIST, 'pacotes');

const { version: VERSAO } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

const erros = [];
const feitos = [];

/** Exigido: sem isto o pacote sai pela metade e ninguém percebe até instalar. */
function exigir(caminho, dica) {
  if (existsSync(caminho)) return true;
  erros.push(`${caminho.replace(ROOT + '\\', '').replace(ROOT + '/', '')} não existe — ${dica}`);
  return false;
}

const LICENCA = `Copyright (c) Universidade Candido Mendes.
Uso interno. Redistribuição fora da UCAM não autorizada.
`;

/* ------------------------------------------------------------ @ucam/tokens --- */
// O menor denominador comum: só as variáveis. Um app AngularJS que não pode
// receber CSS de componente ainda pode alinhar cor, espaçamento e tipografia.

function tokens() {
  if (!exigir(join(DIST, 'tokens', 'ucam-tokens.css'), 'rode: pnpm run tokens')) return null;

  const dir = join(SAIDA, 'tokens');
  mkdirSync(dir, { recursive: true });
  cpSync(join(DIST, 'tokens'), dir, { recursive: true });

  const pkg = {
    name: '@ucam/tokens',
    version: VERSAO,
    description:
      'Tokens do Design System da UCAM em CSS, SCSS e JSON (DTCG). Consumível por qualquer stack, inclusive AngularJS.',
    license: 'UNLICENSED',
    sideEffects: ['*.css'],
    // O `exports` é o contrato de importação. Sem ele, Node e bundlers
    // modernos recusam subcaminhos e o `@import "@ucam/tokens/ucam-theme.css"`
    // que a página de instalação ensina falha com ERR_PACKAGE_PATH_NOT_EXPORTED.
    exports: {
      './ucam-tokens.css': './ucam-tokens.css',
      './ucam-theme.css': './ucam-theme.css',
      './ucam-zard-bridge.css': './ucam-zard-bridge.css',
      './ucam-tokens.json': './ucam-tokens.json',
      './_ucam-tokens.scss': './_ucam-tokens.scss',
      './package.json': './package.json',
    },
  };
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  writeFileSync(join(dir, 'LICENSE'), LICENCA, 'utf8');
  writeFileSync(
    join(dir, 'README.md'),
    `# @ucam/tokens

Tokens do Design System da Universidade Candido Mendes. Gerado de \`spec/tokens/\`
por \`tools/build-tokens.mjs\` — não editar à mão.

## Qualquer stack, inclusive AngularJS

\`\`\`html
<link rel="stylesheet" href="node_modules/@ucam/tokens/ucam-tokens.css">
\`\`\`

## Angular moderno com Tailwind v4

\`\`\`css
@import "tailwindcss";
@import "@ucam/tokens/ucam-theme.css";
\`\`\`

## O que tem dentro

| Arquivo | Para quê |
|---|---|
| \`ucam-tokens.css\` | As custom properties \`--ucam-*\`, tema claro e escuro. |
| \`ucam-theme.css\` | O bloco \`@theme\` do Tailwind v4. |
| \`ucam-zard-bridge.css\` | Liga os tokens às variáveis da base. Uso interno do \`@ucam/ui\`. |
| \`ucam-tokens.json\` | Formato DTCG/W3C, para ferramentas de design. |
| \`_ucam-tokens.scss\` | Variáveis SCSS, para build antigo que não lê custom property. |

O tema escuro entra por \`data-theme="dark"\` no elemento raiz.
`,
    'utf8',
  );
  return dir;
}

/* --------------------------------------------------------------- @ucam/css --- */
// Trilho A. Autocontido de propósito: traz os tokens, o sprite e as fontes
// junto. Um app legado que precisa de dois `<link>` não deveria ter de
// entender resolução de dependência entre pacotes — e como os dois vêm do
// mesmo gerador, a cópia não pode divergir da origem.

function css() {
  if (!exigir(join(DIST, 'css', 'ucam.css'), 'rode: pnpm run css')) return null;

  const dir = join(SAIDA, 'css');
  mkdirSync(dir, { recursive: true });

  // A árvore espelha dist/: `ucam.css` faz @import "../tokens/ucam-tokens.css",
  // caminho relativo que só resolve se css/ e tokens/ forem irmãos aqui dentro.
  for (const sub of ['css', 'tokens', 'icons', 'fonts']) {
    const origem = join(DIST, sub);
    if (!existsSync(origem)) {
      erros.push(`dist/${sub} não existe — rode: pnpm run build`);
      continue;
    }
    cpSync(origem, join(dir, sub), { recursive: true });
  }

  const pkg = {
    name: '@ucam/css',
    version: VERSAO,
    description:
      'Primitivos visuais do DSUCAM sem framework, escopados sob .ucam. Trilho A: aplicações legadas.',
    license: 'UNLICENSED',
    sideEffects: ['*.css'],
    exports: {
      './ucam.css': './css/ucam.css',
      './ucam-fonts.css': './css/ucam-fonts.css',
      './tokens/*': './tokens/*',
      './icons/sprite.svg': './icons/sprite.svg',
      './fonts/*': './fonts/*',
      './package.json': './package.json',
    },
  };
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  writeFileSync(join(dir, 'LICENSE'), LICENCA, 'utf8');
  writeFileSync(
    join(dir, 'README.md'),
    `# @ucam/css

Trilho A do Design System da UCAM: aparência sem framework, para o parque
legado — AngularJS, Angular 14 ou anterior, qualquer coisa que aceite um
\`<link>\`.

\`\`\`html
<link rel="stylesheet" href="node_modules/@ucam/css/css/ucam-fonts.css">
<link rel="stylesheet" href="node_modules/@ucam/css/css/ucam.css">

<div class="ucam">
  <button class="ucam-btn ucam-btn--primary">Salvar</button>
</div>
\`\`\`

\`ucam.css\` já importa os tokens — não é preciso um terceiro \`<link>\`.

## Escopo, e por que ele existe

Tudo vive sob \`.ucam\`. Não há reset global nem preflight: a folha convive com
Bootstrap, Angular Material e o CSS próprio do app sem colidir. Fora de um
ancestral \`.ucam\`, nada acontece.

## Ícones

O sprite fica em \`icons/sprite.svg\`:

\`\`\`html
<svg class="ic" aria-hidden="true"><use href="/caminho/sprite.svg#inbox"></use></svg>
\`\`\`

## O que este pacote NÃO entrega

Comportamento. Combobox com busca, retenção de foco de diálogo e paginação
acessível precisam de JavaScript — estão no \`@ucam/ui\`, e para o legado no
protótipo de custom elements (ADR-010). Gráfico também não: a folha não desenha
gráfico, e a tela estática mostra a tabela equivalente.
`,
    'utf8',
  );
  return dir;
}

/* ---------------------------------------------------------------- @ucam/ui --- */
// Trilho B. Aqui não se monta nada: ng-packagr já produziu a árvore correta em
// ui/dist/ui. O que se faz é conferir que ela não está velha.

function ui() {
  const origem = join(ROOT, 'ui', 'dist', 'ui');
  if (!exigir(join(origem, 'package.json'), 'rode: pnpm run lib')) return null;

  const pkgLib = JSON.parse(readFileSync(join(origem, 'package.json'), 'utf8'));
  if (pkgLib.name !== '@ucam/ui') {
    erros.push(`ui/dist/ui declara "${pkgLib.name}" — o build saiu de um manifesto antigo, refaça`);
  }
  if (pkgLib.version !== VERSAO) {
    erros.push(`ui/dist/ui está na ${pkgLib.version} e a raiz na ${VERSAO} — refaça o build da lib`);
  }

  // A defasagem que passou semanas sem ninguém ver: o pacote publicável ficou
  // parado enquanto a fonte andava. Conferir símbolo por símbolo é caro; a
  // contagem de entradas do public-api contra os diretórios de lib/ucam pega
  // o caso real, que é wrapper novo que nunca entrou no build.
  // O nome do .d.ts deriva do nome do pacote (@ucam/ui → ucam-ui.d.ts), então
  // cravá-lo aqui faria esta checagem passar calada no dia em que o nome
  // mudasse — que é o dia em que ela mais precisa falar. Vem do manifesto.
  const dts = join(origem, pkgLib.typings ?? '');
  if (!pkgLib.typings || !existsSync(dts)) {
    erros.push(`ui/dist/ui não tem os tipos declarados em "typings" (${pkgLib.typings ?? 'ausente'})`);
  } else {
    const construido = new Set(
      [...readFileSync(dts, 'utf8').matchAll(/declare class (Ucam[A-Za-z]*)/g)].map((m) => m[1]),
    );
    const publicApi = readFileSync(
      join(ROOT, 'ui', 'projects', 'ui', 'src', 'public-api.ts'),
      'utf8',
    );
    const exportados = [...publicApi.matchAll(/'\.\/lib\/ucam\/([a-z-]+)'/g)].map((m) => m[1]);
    if (construido.size === 0) {
      erros.push('ui/dist/ui/types não declara nenhuma classe Ucam* — build vazio');
    } else if (exportados.length > construido.size + 6) {
      // +6 de folga: há wrappers que exportam mais de uma classe e outros
      // que exportam só tipos. A checagem procura defasagem grosseira.
      erros.push(
        `ui/dist/ui parece defasado: public-api exporta ${exportados.length} módulos e o build declara ${construido.size} classes`,
      );
    }
  }

  const dir = join(SAIDA, 'ui');
  mkdirSync(dir, { recursive: true });
  cpSync(origem, dir, { recursive: true });
  writeFileSync(join(dir, 'LICENSE'), LICENCA, 'utf8');
  return dir;
}

/* ----------------------------------------------------------- @ucam/ds-mcp --- */
// O kit para agentes: servidor MCP, skills, AGENTS.md e a spec em JSON. A árvore
// já sai pronta de tools/build-agentes.mjs; aqui só entra o manifesto. Sem
// dependência de execução, de propósito: o servidor tem de subir em máquina que
// não alcança o registro público.

function agentes() {
  const origem = join(DIST, 'agentes');
  if (!exigir(join(origem, 'mcp', 'server.mjs'), 'rode: pnpm run agentes')) return null;

  const dir = join(SAIDA, 'ds-mcp');
  mkdirSync(dir, { recursive: true });
  cpSync(origem, dir, { recursive: true });

  const pkg = {
    name: '@ucam/ds-mcp',
    version: VERSAO,
    description:
      'Kit do DSUCAM para agentes de IA: servidor MCP (stdio, sem dependência), skills ucam-ds/ucam-migrate/ucam-audit, AGENTS.md e os contratos em JSON.',
    license: 'UNLICENSED',
    type: 'module',
    engines: { node: '>=18' },
    bin: { 'ucam-ds': './bin/ucam-ds.mjs', 'ucam-ds-mcp': './mcp/server.mjs' },
    exports: {
      './mcp': './mcp/nucleo.mjs',
      './spec/*': './spec/*',
      './AGENTS.md': './AGENTS.md',
      './package.json': './package.json',
    },
  };
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  writeFileSync(join(dir, 'LICENSE'), LICENCA, 'utf8');
  return dir;
}

/* ------------------------------------------------------------------ tarball --- */

function empacotar(dir) {
  // `shell: true` é obrigatório no Windows: o npm é um .cmd e o execFileSync
  // sem shell não o encontra. O DEP0190 avisa que os argumentos vão
  // concatenados sem escape — por isso NÃO se passa caminho como argumento.
  // O tarball nasce no próprio diretório do pacote e é movido depois; assim a
  // linha de comando é constante e não depende de onde o repositório mora.
  execFileSync('npm', ['pack'], {
    cwd: dir,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  const tgz = readdirSync(dir).find((f) => f.endsWith('.tgz'));
  if (!tgz) {
    erros.push(`npm pack não produziu tarball em ${dir}`);
    return null;
  }
  renameSync(join(dir, tgz), join(SAIDA, tgz));
  return tgz;
}

/* --------------------------------------------------------------------- main --- */

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(SAIDA, { recursive: true });

for (const montar of [tokens, css, ui, agentes]) {
  const dir = montar();
  if (!dir) continue;
  // O AGENTS.md viaja em TODO pacote: quem instala só o @ucam/css também
  // abre o projeto num editor com agente, e é o arquivo que o agente lê primeiro.
  const guia = join(DIST, 'agentes', 'AGENTS.md');
  if (montar !== agentes && existsSync(guia)) cpSync(guia, join(dir, 'AGENTS.md'));
  const tgz = empacotar(dir);
  const nome = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).name;
  feitos.push({ nome, tgz });
}

if (feitos.length) {
  console.log(`dist/pacotes/ — ${feitos.length} pacote(s) na versão ${VERSAO}`);
  for (const f of feitos) console.log(`  ${f.nome.padEnd(14)} ${f.tgz}`);
}

if (erros.length) {
  console.error(`\n✗ ${erros.length} problema(s):`);
  for (const e of erros) console.error(`  · ${e}`);
  process.exit(1);
}

// O índice existe para a página de instalação não repetir à mão nomes de
// arquivo que mudam a cada versão.
writeFileSync(
  join(SAIDA, 'index.json'),
  JSON.stringify({ versao: VERSAO, geradoEm: new Date().toISOString(), pacotes: feitos }, null, 2) + '\n',
  'utf8',
);
console.log('\n✓ tarballs prontos. Instalação local:');
for (const f of feitos) console.log(`    pnpm add ./dist/pacotes/${f.tgz}`);
