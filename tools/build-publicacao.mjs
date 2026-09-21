// Põe no ar o que a documentação promete, e reprova se a promessa não bater.
//
//   node tools/build-publicacao.mjs
//
// Roda por último no `pnpm dist`, depois que o site foi construído e os
// tarballs existem. Faz duas coisas:
//
//   1. copia dist/pacotes/*.tgz para a saída publicada, em /pacotes;
//   2. confere que TODA URL ensinada em spec/resources.json existe como
//      arquivo nessa saída.
//
// POR QUE O PASSO 2 EXISTE: em 21/09/2026 a página de instalação mandava o
// parque legado inteiro carregar `https://ds.ucam.br/tokens/ucam-tokens.css`.
// O domínio não era o publicado, e o caminho /tokens não existia na saída —
// o site nunca copiou os tokens para lugar nenhum. A primeira linha que um
// dev copiava dava 404, e nada no build reclamava, porque nenhum portão
// olhava para o que a documentação MANDA fazer. Contrato que ensina uma URL
// tem de provar a URL.
//
// A cópia acontece direto na saída construída, e não em site/src/assets/,
// por uma razão de ordem: os tarballs só existem depois de `pnpm lib` e
// `pnpm pacotes`, que rodam DEPOIS do build do site. Copiar para os assets
// exigiria construir o site duas vezes. Os tokens, que nascem cedo, vão pelo
// caminho normal (tools/build-tokens.mjs escreve em site/src/assets/tokens/),
// e por isso funcionam também no `pnpm dev`.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACOTES = join(ROOT, 'dist', 'pacotes');
const SAIDA = join(ROOT, 'site', 'dist', 'analog', 'public');

const { version: VERSAO } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const recursos = JSON.parse(readFileSync(join(ROOT, 'spec', 'resources.json'), 'utf8'));
const { host, pacotes: ROTA_PACOTES } = recursos.publicacao;

const problemas = [];

/* ------------------------------------------------------------- a cópia --- */

if (!existsSync(SAIDA)) {
  console.error(`✗ ${SAIDA.replace(ROOT, '.')} não existe — rode: pnpm run site`);
  process.exit(1);
}
if (!existsSync(PACOTES)) {
  console.error(`✗ ${PACOTES.replace(ROOT, '.')} não existe — rode: pnpm run pacotes`);
  process.exit(1);
}

const destino = join(SAIDA, ROTA_PACOTES.replace(/^\//, ''));
mkdirSync(destino, { recursive: true });

/* --------------------------------------------- o que a spec diz existir --- */

// Todo pacote marcado `gerado` tem de ter tarball. Marcar como gerado sem
// gerar é a mesma mentira da URL que não resolve, um nível acima.
//
// A CONFERÊNCIA VEM ANTES DA CÓPIA, E ISSO É O PONTO. Na primeira versão ela
// vinha depois, olhando o destino — e o destino tinha acabado de receber a
// cópia, então a resposta era sempre sim. Apaguei um tarball da saída para
// testar o portão e ele passou, porque repôs o arquivo antes de olhar. Portão
// que confere o que ele mesmo acabou de escrever não é portão. A pergunta de
// verdade é sobre a ORIGEM: o build produziu o que a spec promete?
const nomeDoTarball = (nome) => `${nome.replace(/^@/, '').replace('/', '-')}-${VERSAO}.tgz`;

for (const p of recursos.pacotes.itens) {
  if (p.estado !== 'gerado') continue;
  const arquivo = nomeDoTarball(p.nome);
  if (!existsSync(join(PACOTES, arquivo))) {
    problemas.push(
      `${p.nome} está marcado "gerado" em spec/resources.json e ${arquivo} não saiu do build — rode: pnpm run pacotes`,
    );
  }
}

const tarballs = readdirSync(PACOTES).filter((f) => f.endsWith('.tgz'));
for (const t of tarballs) cpSync(join(PACOTES, t), join(destino, t));
cpSync(join(PACOTES, 'index.json'), join(destino, 'index.json'));

// Toda URL absoluta ensinada nos exemplos de instalação tem de resolver.
//
// O `{versao}` é resolvido aqui pelo mesmo motivo que a página de instalação o
// resolve: a versão tem uma fonte só, o package.json da raiz, e escrevê-la na
// spec criaria a segunda. Conferir a URL com o marcador dentro reprovaria
// sempre — e foi o que este portão fez no dia em que o marcador entrou.
const urls = new Set();
for (const t of recursos.instalacao.trilhos) {
  const codigo = String(t.codigo).replaceAll('{versao}', VERSAO);
  for (const u of codigo.match(/https?:\/\/[^\s"'<>)\\]+/g) ?? []) urls.add(u);
}

for (const u of urls) {
  if (!u.startsWith(host)) {
    problemas.push(`o exemplo de instalação aponta para ${u}, e o host publicado é ${host}`);
    continue;
  }
  const rota = u.slice(host.length).replace(/^\//, '');
  // Diretório (…/pacotes) vale se existir; arquivo tem de existir pelo nome.
  if (!existsSync(join(SAIDA, rota))) {
    problemas.push(`o exemplo de instalação ensina ${u} e /${rota} não existe na saída publicada`);
  }
}

/* ---------------------------------------------------------- o inventário --- */

// Os tokens chegam aqui pelo publicDir do vite (site/src/assets/tokens/), e não
// por cópia deste arquivo. Se sumirem, o problema é lá — mas quem descobre é
// este portão, então a mensagem tem de dizer onde procurar, e não estourar um
// ENOENT cru no meio do build.
const DIR_TOKENS = join(SAIDA, recursos.publicacao.tokens.replace(/^\//, ''));
if (!existsSync(DIR_TOKENS)) {
  problemas.push(
    `${recursos.publicacao.tokens} não existe na saída — tools/build-tokens.mjs deveria ter escrito em site/src/assets/tokens/`,
  );
}

const inventario = {
  versao: VERSAO,
  host,
  geradoEm: new Date().toISOString(),
  tokens: existsSync(DIR_TOKENS) ? readdirSync(DIR_TOKENS).sort() : [],
  pacotes: recursos.pacotes.itens
    .filter((p) => p.estado === 'gerado')
    .map((p) => ({ nome: p.nome, arquivo: `${ROTA_PACOTES}/${nomeDoTarball(p.nome)}` })),
};
writeFileSync(join(destino, 'publicacao.json'), JSON.stringify(inventario, null, 2) + '\n', 'utf8');

/* -------------------------------------------------------------- relatório --- */

if (problemas.length) {
  console.error(`\n✗ a documentação promete o que a saída não entrega:`);
  for (const p of problemas) console.error(`  · ${p}`);
  process.exit(1);
}

console.log(`publicação → ${SAIDA.replace(ROOT, '.')}`);
console.log(`  ${ROTA_PACOTES}/  ${tarballs.length} tarballs na versão ${VERSAO}`);
console.log(`  /tokens/   ${inventario.tokens.length} arquivos`);
console.log(`✓ as ${urls.size} URL(s) ensinadas na instalação existem em ${host}`);
