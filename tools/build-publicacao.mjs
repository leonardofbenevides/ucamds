// Põe no ar o que a documentação promete, e reprova se a promessa não bater.
//
//   node tools/build-publicacao.mjs
//
// Roda por último no `pnpm dist`, depois que o site foi construído e os
// tarballs existem. Faz três coisas:
//
//   1. copia dist/pacotes/*.tgz para a saída publicada, em /pacotes;
//   2. copia o Trilho A — folha, sprite e o bundle dos custom elements — para
//      as rotas que spec/resources.json declara, espelhando a árvore do dist/;
//   3. confere que TODA URL ensinada em spec/resources.json existe como
//      arquivo nessa saída, e que o que essas folhas carregam existe também.
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
const DIST = join(ROOT, 'dist');
const PACOTES = join(DIST, 'pacotes');
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

// O Trilho A carrega a folha por <link>, o sprite por <use> e o A+ carrega o
// bundle de custom elements por <script>. Os três precisam sair do mesmo
// servidor do site, pela mesma razão que os tokens: a página de instalação os
// ensina, e link ensinado que não resolve é o defeito que este arquivo existe
// para impedir. O parque legado não tem passo de build — o que não está numa
// URL, para ele não existe, e até aqui só os tokens subiam: variáveis, sem um
// componente sequer.
//
// A ROTA VEM DA SPEC, e não de uma lista aqui: ela é o mesmo campo que a
// página de instalação ensina ao dev. Duas listas para a mesma rota é a
// segunda fonte que este arquivo inteiro existe para não ter.
//
// A ÁRVORE PUBLICADA ESPELHA dist/, E ISSO NÃO É ARRUMAÇÃO. `ucam.css` faz
// @import "../tokens/ucam-tokens.css" e `ucam-fonts.css` aponta para
// url('../fonts/…'): publicar css/ em lugar que não seja irmão de tokens/ e
// fonts/ devolveria 200 no <link> e 404 em tudo que ele carrega.
const ARVORE = [
  { rota: recursos.publicacao.css, pasta: 'css', comando: 'css' },
  { rota: recursos.publicacao.icones, pasta: 'icons', comando: 'icons' },
  // Só o par distribuível, pela mesma razão de tools/build-pacotes.mjs: o
  // medicao.js da ADR-010 é instrumento de medida, registra um componente só
  // e passaria por bundle quebrado a quem o carregasse por engano.
  {
    rota: recursos.publicacao.elements,
    pasta: 'elements',
    comando: 'elements',
    arquivos: ['ucam-elements.js', 'ucam-elements.css'],
  },
];

for (const { rota, pasta, comando, arquivos } of ARVORE) {
  const origem = join(DIST, pasta);
  if (!existsSync(origem)) {
    problemas.push(`dist/${pasta} alimenta ${rota} e não existe — rode: pnpm run ${comando}`);
    continue;
  }
  const alvo = join(SAIDA, rota.replace(/^\//, ''));
  mkdirSync(alvo, { recursive: true });
  if (!arquivos) {
    cpSync(origem, alvo, { recursive: true });
    continue;
  }
  for (const f of arquivos) {
    if (!existsSync(join(origem, f))) {
      problemas.push(`dist/${pasta}/${f} não saiu do build — rode: pnpm run ${comando}`);
      continue;
    }
    cpSync(join(origem, f), join(alvo, f));
  }
}

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

// Toda URL ensinada nos exemplos de instalação tem de resolver.
//
// OS MARCADORES SÃO RESOLVIDOS AQUI, COMO A PÁGINA OS RESOLVE. `{versao}` e
// `{host}` existem porque a versão e o host têm uma fonte só — o package.json
// da raiz e spec/resources.json — e escrevê-los por extenso na spec criaria a
// segunda. Quem lê a spec crua vê o marcador; quem lê a página vê o valor.
//
// E ESTE PORTÃO JÁ FOI CEGO POR ISSO. Quando os exemplos passaram a usar
// `{host}`, não sobrou nenhuma URL absoluta para o regex achar: ele anunciou
// "as 0 URL(s) ensinadas existem" e passou. Conferir zero coisas com sucesso é
// a forma mais silenciosa de um portão morrer — por isso a contagem virou
// condição, logo abaixo.
const MARCADORES = { '{versao}': VERSAO, '{host}': host };

const resolver = (texto) => {
  let s = String(texto);
  for (const [marca, valor] of Object.entries(MARCADORES)) s = s.replaceAll(marca, valor);
  return s;
};

const urls = new Set();
for (const t of recursos.instalacao.trilhos) {
  // O TRILHO INTEIRO, e não só o campo `codigo`. A URL que a prosa ensina — o
  // sprite dos ícones, o arquivo de quem só quer as variáveis — é copiada pelo
  // dev do mesmo jeito que a do bloco de código, e deixá-la fora do portão é
  // ter o defeito de 21/09 de volta pela porta dos fundos.
  for (const [campo, bruto] of Object.entries(t)) {
    if (typeof bruto !== 'string') continue;
    const texto = resolver(bruto);

    // Marcador que ninguém resolve sai literal no que o dev copia.
    for (const sobra of texto.match(/\{[a-zA-Z]+\}/g) ?? []) {
      problemas.push(`o trilho "${t.id}" usa o marcador ${sobra} em "${campo}" e nada o resolve`);
    }

    // A pontuação da frase não faz parte do endereço: em prosa a URL termina
    // em ponto, e cobrar "…/ucam-tokens.css." reprovaria um link correto.
    for (const u of texto.match(/https?:\/\/[^\s"'<>)\\]+/g) ?? []) {
      urls.add(u.replace(/[.,;:]+$/, ''));
    }
  }
}

// A guarda contra o sucesso vazio: os trilhos ensinam comandos, e comando de
// instalação sem endereço nenhum significa que a extração quebrou, não que não
// havia o que conferir.
if (!urls.size) {
  problemas.push(
    'nenhuma URL foi extraída dos exemplos de instalação — o portão não conferiu nada, e isso não é aprovação',
  );
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

/* -------------------------------------- o que a folha publicada carrega --- */

// Um nível abaixo do portão de cima, e é um nível que morde calado: o <link>
// responde 200 e o @import lá dentro dá 404, então a página carrega sem erro
// nenhum e aparece sem tipografia e sem cor. O portão de cima olha a URL que a
// DOCUMENTAÇÃO ensina ao dev; este olha as que a própria FOLHA ensina ao
// navegador — que é o que faz a árvore espelhada acima valer alguma coisa.
//
// Só referências relativas. As absolutas (url('/assets/…')) apontam para a
// aplicação que consome, não para este host: ucam.css cita uma assim dentro de
// um comentário, mostrando o app apontar para o próprio logo, e cobrá-la aqui
// seria cobrar do lugar errado.
const RELATIVA = /(?:@import\s+|url\()\s*["']?(?!data:|https?:|#|\/)([^"')?#]+)/g;

for (const { rota, arquivos } of ARVORE) {
  const alvo = join(SAIDA, rota.replace(/^\//, ''));
  if (!existsSync(alvo)) continue;

  for (const f of arquivos ?? readdirSync(alvo)) {
    if (!f.endsWith('.css')) continue;
    const folha = join(alvo, f);
    if (!existsSync(folha)) continue;

    for (const [, ref] of readFileSync(folha, 'utf8').matchAll(RELATIVA)) {
      if (!ref.trim()) continue;
      if (!existsSync(join(alvo, ref))) {
        problemas.push(`${rota}/${f} carrega "${ref}" e esse arquivo não está na saída`);
      }
    }
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
  arvore: Object.fromEntries(
    ARVORE.map(({ rota, arquivos }) => {
      const alvo = join(SAIDA, rota.replace(/^\//, ''));
      return [rota, existsSync(alvo) ? (arquivos ?? readdirSync(alvo)).sort() : []];
    }),
  ),
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
for (const [rota, arquivos] of Object.entries(inventario.arvore)) {
  console.log(`  ${rota}/   ${arquivos.length} arquivos`);
}
console.log(`✓ as ${urls.size} URL(s) ensinadas na instalação existem em ${host}`);
