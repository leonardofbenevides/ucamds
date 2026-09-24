/**
 * Portão do LEDE: a chamada de página é curta, e o racional não ocupa o lugar
 * dela.
 *
 * O defeito que ele registra é de 22/09/2026, e era visível em toda fundação:
 * a página passava o `$description` da spec como lede. O `$description` é
 * RACIONAL — por que a fundação existe, o que ela decide, o que ficou de fora
 * —, e racional tem oitenta palavras. A página de blocos de layout abria com
 * nove linhas de texto antes de qualquer conteúdo, e as vinte e sete páginas
 * do site somavam 3.801 linhas renderizadas.
 *
 * A separação é de CAMPO, não de corte automático: `$lede` é a chamada, escrita
 * para ser lida de passagem; `$description` continua inteiro e vai para o bloco
 * "Por quê", fechado, no cabeçalho. Nada foi jogado fora.
 *
 * Este portão cobra as duas pontas:
 *   1. todo `$lede` cabe em LIMITE palavras;
 *   2. onde existe `$lede`, nenhuma página serve o `$description` como lede —
 *      senão o campo novo existiria e a página continuaria com a parede.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIMITE = 25;

const problemas = [];

/** Conta palavras como o olho conta: separadas por espaço. */
const palavras = (t) => String(t).trim().split(/\s+/).filter(Boolean).length;

/* ------------------------------------------------- 1. o teto de palavras --- */

const arquivos = readdirSync(join(ROOT, 'spec'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => ['spec/' + f, JSON.parse(readFileSync(join(ROOT, 'spec', f), 'utf8'))]);

const comLede = [];

const varrer = (valor, caminho, arquivo) => {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return;
  if (typeof valor.$lede === 'string') {
    comLede.push({ arquivo, caminho, lede: valor.$lede });
    const n = palavras(valor.$lede);
    if (n > LIMITE) {
      problemas.push(`${arquivo}${caminho} tem lede de ${n} palavras (teto ${LIMITE})`);
    }
    if (!valor.$description) {
      problemas.push(`${arquivo}${caminho} tem $lede e não tem $description — o racional sumiu`);
    }
  }
  for (const [k, v] of Object.entries(valor)) varrer(v, `${caminho}.${k}`, arquivo);
};

for (const [arquivo, json] of arquivos) varrer(json, '', arquivo);

if (!comLede.length) {
  problemas.push('nenhum $lede encontrado na spec — o portão não conferiu nada, e isso não é aprovação');
}

/* ------------------------------ 2. a página não pode servir o racional --- */

// A REGRA AQUI É A DO RACIONAL QUE SOME, e não "nenhuma página passa
// $description". A primeira versão cobrava isso e reprovou quatro páginas cujo
// texto já cabia — `fundamentos.descricao` tem 23 palavras. Portão que reprova
// o que está certo é portão que alguém desliga.
//
// O que ele prova: quem já adotou a chamada curta tem de mandar o racional
// para o bloco "Por quê". Sem isso, a página encurta jogando fora o porquê —
// e é essa a única forma de o texto sumir do site sem ninguém notar.
const paginas = [];
const juntar = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) juntar(p);
    else if (e.name.endsWith('.page.ts')) paginas.push(p);
  }
};
const DIR_PAGINAS = join(ROOT, 'site', 'src', 'app', 'pages');
if (existsSync(DIR_PAGINAS)) juntar(DIR_PAGINAS);

for (const p of paginas) {
  const fonte = readFileSync(p, 'utf8');
  const rel = p.slice(ROOT.length + 1).replaceAll('\\', '/');
  for (const m of fonte.matchAll(/\[lede\]="([^"]*)"/g)) {
    const expr = m[1];
    const usaChamada = /\$lede\b/.test(expr) || /\.lede\b/.test(expr);
    if (usaChamada && !fonte.includes('[porque]')) {
      problemas.push(`${rel} usa a chamada curta ([lede]="${expr}") e não passa [porque] — o racional sumiu da página`);
    }
  }
}

/* ---------------------------------------------------------------- saída --- */

if (problemas.length) {
  console.error(`\n✗ lede: ${problemas.length} problema(s)`);
  for (const p of problemas) console.error('  · ' + p);
  process.exit(1);
}

const maior = comLede.reduce((a, b) => (palavras(a.lede) > palavras(b.lede) ? a : b));
console.log(
  `✓ lede  ${comLede.length} chamadas na spec, a maior com ${palavras(maior.lede)} palavras (teto ${LIMITE}); toda página que usa a chamada curta manda o racional para o "Por quê"`,
);
