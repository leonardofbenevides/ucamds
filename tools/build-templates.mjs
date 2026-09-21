// Gera uma página autônoma por template, em docs/t/.
//
// Serve a dois propósitos:
//   1. o "abrir em nova aba" da moldura de dispositivo — a tela em tamanho
//      real, sem o cromo da documentação;
//   2. mandar o link para alguém que não vai navegar no site inteiro.
//
// A tela é montada com o dist/css/ucam.css real, igual ao preview embutido.
//
//   node tools/build-templates.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { iconCss } from './lib/icon-css.mjs';
// ADR-011: o <select> nativo saiu. Nas telas autônomas ele vira gatilho +
// listbox estilizado — ver o cabeçalho de lib/select-listbox.mjs.
import { listboxSelects, listboxScript } from './lib/select-listbox.mjs';
import { fontFaceCss } from './lib/fonts-css.mjs';
// O shell vem de um lugar só. Ver o cabeçalho de lib/shell.mjs para o porquê.
import {
  renderShell,
  shellDaTela,
  indiceDeDestinos,
  atalhoBuscaScript,
  buscaGlobalScript,
  menuContaScript,
  estadoScript,
  descricaoScript,
  linhaDoTempoScript,
  abasScript,
  filtroScript,
  grupoMenuScript,
  confirmaScript,
  dialogoScript,
  gavetaScript,
  navScript,
} from './lib/shell.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Dois destinos, um gerador. docs/t/ é o "abrir em nova aba" do site
// estático; site/src/assets/t/ é o que o <iframe> do Analog carrega — a raiz
// pública do site é src/assets, então '../fonts' resolve nos dois lugares.
// O HTML é o mesmo nos dois, com UMA diferença: o link "Ver documentação" de
// volta para a página da tela. Os dois sites roteiam de formas diferentes —
// docs/ é uma SPA de hash, o site do Analog tem rota de verdade — e um href
// escrito para um dava 404 no outro. Cada destino traz a sua função.
const DESTINOS = [
  { dir: join(ROOT, 'docs', 't'), doc: (p, t) => `../index.html#/templates/${p.id}/${t.id}` },
  { dir: join(ROOT, 'site', 'src', 'assets', 't'), doc: (p, t) => `../telas/${p.id}/${t.id}` },
];

for (const f of ['dist/tokens/ucam-tokens.css', 'dist/css/ucam.css', 'dist/icons/sprite.svg']) {
  if (!existsSync(join(ROOT, f))) {
    console.error(`✗ ${f} não existe. Rode: pnpm run tokens && pnpm run icons && pnpm run css`);
    process.exit(1);
  }
}

const tokensCss = readFileSync(join(ROOT, 'dist/tokens/ucam-tokens.css'), 'utf8').replace(/@import[^;]+;/g, '');
const ucamCss = readFileSync(join(ROOT, 'dist/css/ucam.css'), 'utf8').replace(/@import[^;]+;/g, '');
const sprite = readFileSync(join(ROOT, 'dist/icons/sprite.svg'), 'utf8');
const projetos = JSON.parse(readFileSync(join(ROOT, 'spec/templates.json'), 'utf8')).projetos;

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* As duas chaves de consulta (?embed=1 e ?tema=) são estado da MOLDURA que
 * hospeda a tela, não da tela. Navegando de uma irmã para outra elas se
 * perderiam no primeiro clique: dentro do quadro da documentação, a segunda
 * tela reapareceria clara e com a barra de contexto que a primeira escondia —
 * um pisca de tema a cada item de menu. Repassar a consulta é o que torna a
 * navegação dentro da moldura indistinguível de navegar no sistema.
 *
 * Só irmãs: href relativo, terminando em .html, sem consulta própria. Link
 * externo ou âncora não herda nada. */
const propagaConsultaScript = `
(function () {
  var busca = location.search;
  if (!busca) return;
  var alvos = document.querySelectorAll('a[href$=".html"]');
  for (var i = 0; i < alvos.length; i++) {
    var h = alvos[i].getAttribute('href');
    if (!h || h.charAt(0) === '#' || h.indexOf('?') > -1 || /^[a-z]+:/i.test(h)) continue;
    alvos[i].setAttribute('href', h + busca);
  }
})();
`.trim();

// O índice de destinos vem de lib/shell.mjs — ver o cabeçalho de
// indiceDeDestinos() para o porquê de ele não morar aqui.
const { de: destinosDe, religaPreview } = indiceDeDestinos(projetos);

/* O TÍTULO DA TELA VIRA <h1> — aqui, e só aqui.
 *
 * O nível do cabeçalho não é propriedade do texto, é do DOCUMENTO que o
 * hospeda, e a mesma marcação de tela serve a dois documentos:
 *
 *   esta página autônoma  -> a tela É o documento. Sem <h1>, as doze telas
 *                            começavam em <h2> e a hierarquia pulava o nível
 *                            1 inteira. Quem navega por cabeçalho salta por H
 *                            atrás do título da página e não achava nada.
 *   o preview do site     -> a tela é um pedaço de uma página que já tem o
 *                            <h1> dela ("Telas de referência"). Um segundo
 *                            <h1> ali seria o defeito oposto.
 *
 * Por isso a spec guarda o nível SEGURO para embutir (h2) e quem sabe o
 * contexto promove. O gerador do site não promove nada — é a diferença entre
 * os dois destinos, e é deliberada.
 *
 * SOBE A ESCADA INTEIRA, um degrau. Não só o título: h2 vira h1, h3 vira h2,
 * h4 vira h3. Promover só o título abre um buraco no nível 2 — as seções da
 * tela são <h3>, e a leitura passaria de 1 direto para 3 em dez das doze
 * telas. Salto de nível é o mesmo defeito de hierarquia que a falta do <h1>,
 * um degrau adiante. Deslocar todos preserva o ANINHAMENTO, que é o que a
 * hierarquia de fato comunica: o que está dentro de quê.
 *
 * Sem casar classe: nas doze telas o primeiro <h2> é sempre o nome da tela, e
 * ele usa três marcações conforme o arranjo — `.ucam-viewbar__titulo` na
 * maioria, `.ucam-page-header__title` no login (que não tem barra) e
 * `.ucam-sr-only` na Caixa de entrada, cujo título é só para quem ouve, porque
 * a barra dela abre direto nas abas. Casar classe por classe já falhou aqui: a
 * Caixa de entrada mudou de marcação e ficou sem <h1>, sozinha entre as doze,
 * sem nada acusar. */
const promoveTitulo = (html = '') =>
  html.replace(/<(\/?)h([2-5])\b/g, (_, barra, nivel) => `<${barra}h${Number(nivel) - 1}`);

for (const { dir } of DESTINOS) if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

// A logo institucional vive ao lado das telas, um nível acima — o mesmo
// caminho relativo que as fontes usam. O @ucam/css não embute asset nenhum: é
// a página hospedeira que aponta o arquivo, por --ucam-appbar-logo.
// Dois arquivos, não um: a moldura com rail usa o SÍMBOLO (o lockup
// horizontal não cabe em 72px), e a moldura com faixa usa o lockup. Uma tela
// que declarasse o rail sem o símbolo copiado ganharia uma máscara apontando
// para 404 — que não dá erro nenhum, só não pinta.
const MARCAS = ['ucam-logo-horizontal.svg', 'dsucam-simbolo-inverso.svg'];
for (const d of DESTINOS.map((x) => join(x.dir, '..', 'marca'))) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
  for (const m of MARCAS) copyFileSync(join(ROOT, 'site/src/assets/marca', m), join(d, m));
}

let n = 0;
for (const proj of projetos) {
  for (const t of proj.templates) {
    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(t.nome)} — ${esc(proj.nome)} · DSUCAM</title>
<meta name="description" content="${esc(t.descricao)}">
<style>
${fontFaceCss('../fonts')}
  html,body{margin:0;padding:0}
  /* O documento é uma coluna: o shell ocupa o que sobra e a barra de contexto
     assenta embaixo dele, em fluxo normal.
     Isto substituiu uma barra "position: fixed" mais um
     "calc(100dvh - 2.75rem)" no shell. O número era chute — a barra mede 34px,
     não 44 — e a conta errada deixava a barra por cima do rodapé E 44px de
     rolagem morta. Em coluna flex não há número nenhum para acertar. */
  body{background:var(--ucam-color-surface-canvas);
    display:flex;flex-direction:column;min-block-size:100dvh}
  /* Faixa de contexto: deixa claro que é um template do design system, não o
     sistema em produção. Sem ela alguém confunde o protótipo com a tela real.
     Fica no fim do DOM e no rodapé da tela: se viesse antes, seria o primeiro
     elemento focável do documento, na frente do skip-link. */
  .dsucam-bar{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;
    /* 40px INTEIROS: 12px/1.4 dava 16,8 de linha, mais 16 de recuo, mais 1 de
       filete = 41,8px — e a fração empurrava a tela INTEIRA acima dela para
       y=x,1. Linha de 16, filete por sombra, e a barra fecha em 40. */
    block-size:2.5rem;padding:0 .9rem;font:500 12px/16px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    background:var(--ucam-color-surface-default);color:var(--ucam-color-text-secondary);
    box-shadow:inset 0 1px 0 var(--ucam-color-border-subtle)}
  .dsucam-bar strong{color:var(--ucam-color-text-primary)}
  /* padding-block: o link da barra media 16,8px de alvo. Em elemento em linha
     o recuo cresce a caixa de acerto sem mexer na altura da faixa — mesmo
     recurso que o .ucam-link usa na folha. */
  .dsucam-bar a{color:var(--ucam-color-action-primary-default);text-decoration:none;padding-block:.25rem}
  .dsucam-bar a:hover{text-decoration:underline}
  .dsucam-bar .sep{opacity:.4}
  /* Modo embutido: esta mesma página é o preview dentro da moldura de
     dispositivo da documentação. Ali a barra de contexto é ruído — a página
     em volta já diz que é template do design system — e ainda roubaria altura
     da viewport que a moldura anuncia. Ver deviceFrame() em build-docs.mjs. */
  html.embed .dsucam-bar{display:none}
/* Sem isto o <svg class='ic'> não tem tamanho e estica até o contêiner. */
${iconCss}
${tokensCss}
${ucamCss}
/* Depois do ucamCss, e não antes.
 *
 * O @ucam/css declara o default de --ucam-appbar-logo no MESMO seletor
 * (.ucam-shell). Mesma especificidade: quem vence é quem vem por último. Com
 * esta regra antes da folha, a página apontava a logo e o default a
 * sobrescrevia em silêncio — a faixa reservava o espaço e não pintava nada.
 * É a mesma armadilha de cascata que já mordeu a cópia de tokens em ui/. */
  .ucam-shell{--ucam-appbar-logo:url('../marca/ucam-logo-horizontal.svg');
    /* A ALTURA ÚTIL desta página não é a da janela: a faixa de contexto assenta
       ABAIXO do shell, em fluxo normal, e come 2.125rem. Quem lê --ucam-vh não é
       só o shell — é também o bloco de lista e detalhe, que promete que cada
       painel rola por dentro e a página não rola. Enquanto ele partia de 100dvh
       direto, a promessa era falsa por construção aqui, e as duas telas de
       triagem tentavam compensar aumentando o desconto no chute: a caixa de
       entrada rolava 139px e a de setores 87px, ambas com a barra escondida.
       Descontado uma vez, aqui, as duas fecham.
       No modo embutido a barra some (html.embed abaixo) e o desconto zera. */
    --ucam-vh:calc(100dvh - 2.125rem);
    /* O shell pede a altura útil; aqui ele é item de uma coluna flex que já tem
       essa altura, e repetir o mínimo empurraria a barra para fora da tela. */
    min-block-size:0;flex:1}
  html.embed .ucam-shell{--ucam-vh:100dvh}
  /* O escopo .ucam fica ENTRE o body e o shell — sem repassar o crescimento
     aqui, o flex:1 acima não alcança nada e o rodapé para no meio da tela. */
  body > .ucam{display:flex;flex-direction:column;flex:1;min-block-size:0}
</style>
<script>
/* Duas chaves de consulta, lidas antes da primeira pintura:
     ?tema=dark|light  — a moldura de dispositivo da documentação empurra o
                         tema da página hospedeira para cá. Sem isto o preview
                         ficaria claro dentro de uma documentação escura.
                         Vence a escolha guardada: a moldura mostra o tema da
                         documentação, não o de quem a abriu.
     ?embed=1          — esconde a barra de contexto (regra .embed acima).
     ?paleta=           — subpaleta do sistema (ADR-037, em teste): sem chave
                         vale a cheia; 'moldura' tinge só faixa e menu e
                         mantém a ação em bordô; 'comum' desliga tudo.
   Sem ?tema, vale o que a pessoa escolheu no menu da conta (localStorage
   ucam-theme, a mesma chave do site de documentação). Sem escolha, o <html>
   fica SEM data-theme e a folha de tokens segue o prefers-color-scheme —
   "como o dispositivo" é o padrão desde 19/09/2026; até ali toda tela nascia
   com data-theme=light cravado.
   Fica no <head> de propósito: aplicado depois do <body> haveria um quadro
   pintado no tema errado. */
(function(){var p=new URLSearchParams(location.search),t=p.get('tema');
if(t!=='dark'&&t!=='light'){try{t=localStorage.getItem('ucam-theme');}catch(e){t=null;}}
if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);
if(p.has('embed'))document.documentElement.classList.add('embed');
var pal=p.get('paleta');if(pal==='comum'||pal==='moldura')document.documentElement.setAttribute('data-paleta',pal);})();
</script>
</head>
<body>
${sprite}
<div class="ucam">${listboxSelects(renderShell(shellDaTela(proj, t, destinosDe(proj)), promoveTitulo(religaPreview(t.preview))))}</div>
<div class="dsucam-bar">
  <strong>DSUCAM</strong><span class="sep">·</span>
  <span>${esc(proj.nome)}</span><span class="sep">/</span>
  <span>${esc(t.nome)}</span>
  <span style="margin-inline-start:auto">Template do design system — não é o sistema em produção.</span>
  <a href="__DOC__">Ver documentação</a>
</div>
<script>${propagaConsultaScript}</script>
<script>${listboxScript}</script>
<script>${navScript}</script>
<script>${buscaGlobalScript}</script>
<script>${atalhoBuscaScript}</script>
<script>${menuContaScript}</script>
<script>${estadoScript}</script>
<script>${descricaoScript}</script>
<script>${linhaDoTempoScript}</script>
<script>${abasScript}</script>
<script>${filtroScript}</script>
<script>${grupoMenuScript}</script>
<script>${confirmaScript}</script>
<script>${dialogoScript}</script>
<script>${gavetaScript}</script>
</body>
</html>`;

    for (const d of DESTINOS) {
      writeFileSync(
        join(d.dir, `${proj.id}-${t.id}.html`),
        html.replace('__DOC__', esc(d.doc(proj, t))),
        'utf8',
      );
    }
    n++;
  }
}

console.log('templates autônomos → docs/t/ e site/src/assets/t/');
console.log(`  ${n} telas · ${projetos.length} projetos`);
