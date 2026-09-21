// Servidor local do site LEGADO (docs/index.html), o de navegação lateral.
//
// Não é O site do DSUCAM: esse mora em site/ (Analog, cabeçalho com abas) e
// roda com `pnpm dev`. Este aqui é `pnpm dev:legado`, e existe enquanto o
// legado seguir sendo reconstruído pelo `pnpm build`.
//
// Serve docs/ na raiz e dist/ em /dist. Observa spec/ e tools/ e refaz o
// build quando algo muda — a aba recarrega sozinha.
//
//   node tools/serve.mjs [porta]

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = Number(process.argv[2]) || 5050;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

/* --------------------------------------------------- recarga automática --- */
// Cada cliente abre um EventSource; um build concluído dispara "reload".

const clientes = new Set();
let versao = Date.now();

const SNIPPET = `<script>
(function(){
  var es = new EventSource('/__dev');
  es.onmessage = function(e){ if (e.data !== String(window.__v)) location.reload(); };
  es.addEventListener('hello', function(e){ window.__v = e.data; });
})();
</script>`;

let construindo = false;
let pendente = false;

function build() {
  if (construindo) { pendente = true; return; }
  construindo = true;
  const t0 = Date.now();
  // Mudança em spec/tokens precisa regerar tokens e CSS antes do site.
  const etapas = ['tools/build-tokens.mjs', 'tools/build-icons.mjs', 'tools/build-css.mjs', 'tools/build-docs.mjs', 'tools/build-templates.mjs'];
  const p = spawn(process.execPath, ['-e', etapas.map((e) => `require('child_process').execFileSync(process.execPath,['${e}'],{stdio:'pipe'})`).join(';')], { cwd: ROOT, shell: false });
  let saida = '';
  p.stdout.on('data', (d) => (saida += d));
  p.stderr.on('data', (d) => (saida += d));
  p.on('close', (code) => {
    construindo = false;
    if (code === 0) {
      versao = Date.now();
      for (const c of clientes) c.write(`data: ${versao}\n\n`);
      console.log(`  ✓ rebuild em ${Date.now() - t0}ms`);
    } else {
      console.error('  ✗ build falhou:\n' + saida.trim());
    }
    if (pendente) { pendente = false; build(); }
  });
}

let timer = null;
function agendar(arquivo) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`\nmudou: ${arquivo}`);
    build();
  }, 120);
}

for (const dir of ['spec', 'tools']) {
  watch(join(ROOT, dir), { recursive: true }, (_e, f) => {
    if (!f || f.includes('node_modules')) return;
    if (f.endsWith('.json') || f.endsWith('.mjs')) agendar(`${dir}/${f}`);
  });
}

/* ------------------------------------------------------------- servidor --- */

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORTA}`);

  if (url.pathname === '/__dev') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(`event: hello\ndata: ${versao}\n\n`);
    clientes.add(res);
    req.on('close', () => clientes.delete(res));
    return;
  }

  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';

  // /dist/... vem do diretório de build; o resto vem de docs/
  const base = rel.startsWith('/dist/') ? ROOT : join(ROOT, 'docs');
  const caminho = normalize(join(base, rel));

  // Impede sair da raiz do projeto por ../
  if (!caminho.startsWith(ROOT)) {
    res.writeHead(403).end('403');
    return;
  }

  try {
    const info = await stat(caminho);
    if (info.isDirectory()) throw new Error('dir');
    const ext = extname(caminho);
    let corpo = await readFile(caminho);

    // Injeta a recarga só no HTML
    if (ext === '.html') {
      corpo = Buffer.from(corpo.toString('utf8') + SNIPPET, 'utf8');
    }

    res.writeHead(200, {
      'Content-Type': TIPOS[ext] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(corpo);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<meta charset="utf-8"><body style="font:15px system-ui;padding:2rem">
      <h1>404</h1><p><code>${rel}</code> não existe.</p>
      <p><a href="/">Site</a> · <a href="/prova.html">Prova do Trilho A</a></p>`);
  }
});

server.listen(PORTA, () => {
  console.log(`\nDSUCAM (site LEGADO) em http://localhost:${PORTA}`);
  console.log(`  /            navegação lateral — o site atual é: pnpm dev`);
  console.log(`  /prova.html  antes e depois do Trilho A`);
  console.log(`\nobservando spec/ e tools/ — a aba recarrega sozinha.\n`);
});
