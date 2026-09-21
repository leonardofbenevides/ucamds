/**
 * Gera dist/css/ucam-<id>.css para CADA adaptador em spec/adapters/.
 *
 * Um adaptador reveste um sistema que já tem CSS próprio — o tema Aristo do
 * PrimeFaces no SIGU, o main.css do Relatórios Acadêmicos — com os tokens
 * semânticos do DS, sem tocar no código do sistema. A folha é carregada
 * DEPOIS da folha do alvo e, por ordem de origem, vence os seletores de mesma
 * especificidade.
 *
 * Era build-adapter-primefaces.mjs, com o caminho do spec e o nome da saída
 * cravados. O segundo adaptador (ADR-025) mostrou que o gerador não tinha
 * nada de PrimeFaces: ele lê regras e emite CSS. Agora varre o diretório, e
 * adaptador novo entra sozinho — mesma regra do rotasDePaginas() do site.
 *
 * Regras (mesmas do build-css.mjs):
 *   - Só referencia token SEMÂNTICO. Cada var(--ucam-*) da saída — de token OU
 *     embutido em literal — é conferido contra os tokens publicados em
 *     dist/tokens/ucam-tokens.css; token inexistente aborta o build.
 *   - Zero reset global, zero hex cru: o desenho sai do token, serve os dois
 *     temas e nunca vaza para fora dos seletores do próprio alvo.
 *
 *   node tools/build-adapters.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS_CSS = join(ROOT, 'dist', 'tokens', 'ucam-tokens.css');
const DIR = join(ROOT, 'spec', 'adapters');
const OUT_DIR = join(ROOT, 'dist', 'css');

if (!existsSync(TOKENS_CSS)) {
  console.error('✗ dist/tokens/ucam-tokens.css não existe. Rode: pnpm run tokens');
  process.exit(1);
}

const tokensCss = readFileSync(TOKENS_CSS, 'utf8');
const tokensDisponiveis = new Set(
  [...tokensCss.matchAll(/^\s*(--ucam-[a-z0-9-]+):/gm)].map((m) => m[1])
);
// A folha de tokens emite os PRIMITIVOS também (--ucam-wine-600), e "existe na
// folha" deixava passar referência a primitivo — ADR-007. A lista de nomes
// resolvida pelo build-tokens separa as duas camadas; é o mesmo critério do
// build-css.mjs.
const nomes = JSON.parse(readFileSync(join(ROOT, 'dist', 'tokens', 'ucam-tokens.json'), 'utf8'));
const ehPrimitivo = new Set(Object.keys(nomes.primitive).map((n) => `--ucam-${n}`));
const ehSemantico = new Set(Object.keys(nomes.semantic).map((n) => `--ucam-${n}`));

/** Resolve o valor de uma prop: {token} vira var(--ucam-*), {literal} sai cru. */
function valor(v, contexto) {
  if (v && typeof v.token === 'string') return `var(--ucam-${v.token})`;
  if (v && typeof v.literal === 'string') return v.literal;
  console.error(`✗ prop sem token nem literal em ${contexto}`);
  process.exit(1);
}

function gerar(arquivo) {
  const spec = JSON.parse(readFileSync(join(DIR, arquivo), 'utf8'));
  const id = arquivo.replace(/\.json$/, '');
  if (spec.id !== id) {
    console.error(`✗ spec/adapters/${arquivo}: id "${spec.id}" não corresponde ao nome do arquivo`);
    process.exit(1);
  }
  const out = join(OUT_DIR, `ucam-${id}.css`);

  const linhas = [];
  for (const regra of spec.regras) {
    if (regra.nota) linhas.push(`/* ${regra.nota} */`);
    linhas.push(`${regra.seletor} {`);
    for (const [prop, v] of Object.entries(regra.props)) {
      linhas.push(`  ${prop}: ${valor(v, `${id}: ${regra.seletor} { ${prop} }`)};`);
    }
    linhas.push('}', '');
  }
  const corpo = linhas.join('\n');

  // Portão: todo var(--ucam-*) da saída precisa existir nos tokens publicados.
  const referenciados = [...corpo.matchAll(/var\(\s*(--ucam-[a-z0-9-]+)/g)].map((m) => m[1]);
  const ausentes = [...new Set(referenciados)].filter((t) => !tokensDisponiveis.has(t));
  if (ausentes.length) {
    console.error(`✗ ${arquivo}: tokens referenciados que não existem em ucam-tokens.css:`);
    for (const t of ausentes) console.error(`    ${t}`);
    console.error(`  Corrija spec/adapters/${arquivo} ou rode: pnpm run tokens`);
    process.exit(1);
  }
  const primitivos = [...new Set(referenciados)].filter((t) => ehPrimitivo.has(t) && !ehSemantico.has(t));
  if (primitivos.length) {
    console.error(`✗ ${arquivo}: referência a token PRIMITIVO (ADR-007 — só semântico):`);
    for (const t of primitivos) console.error(`    ${t}`);
    process.exit(1);
  }

  const alvo = spec.alvo;
  const nTokens = new Set(referenciados).size;
  const linhaAlvo = alvo.tema
    ? `${alvo.framework} ${alvo.versao} — tema ${alvo.tema}`
    : `${alvo.framework} ${alvo.versao}`;
  const linhaUso = alvo.carregar_apos || 'a folha de estilo do alvo';
  const linhaPendentes =
    spec.pendentes && spec.pendentes.length
      ? `\n *\n * Pendente — não é CSS, resolve na migração da tela:\n${spec.pendentes.map((p) => ` *   · ${p}`).join('\n')}`
      : '';
  const cabecalho = `/*
 * ucam-${id}.css — adaptador do trilho legado (${spec.name})
 *
 * Gerado de spec/adapters/${arquivo} por tools/build-adapters.mjs.
 * NÃO EDITAR À MÃO. Alterou o mapeamento? Edite a spec e rode: pnpm run adaptador
 *
 * Alvo: ${linhaAlvo}
 * Plataforma: ${alvo.plataforma || '—'}
 * Uso: carregar DEPOIS de ${linhaUso}.
 *
 * ${nTokens} tokens semânticos referenciados, ${spec.regras.length} regras.${linhaPendentes}
 */

@import "../tokens/ucam-tokens.css";

`;

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(out, cabecalho + corpo + '\n', 'utf8');
  console.log(
    `✓ dist/css/ucam-${id}.css — ${spec.regras.length} regras, ${nTokens} tokens (${linhaAlvo}).`
  );
}

const arquivos = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
if (!arquivos.length) {
  console.error('✗ spec/adapters/ não tem nenhum adaptador');
  process.exit(1);
}
for (const f of arquivos) gerar(f);
