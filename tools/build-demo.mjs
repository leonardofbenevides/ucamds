// Gera a prova do Trilho A: a tela "Setor" do Sistema de Protocolo, antes e
// depois, lado a lado.
//
// O lado DEPOIS é renderizado pelo CSS realmente gerado em dist/ — os arquivos
// são embutidos no HTML, não reescritos. Se o token mudar na spec, esta página
// muda junto. É prova, não maquete.
//
//   node tools/build-demo.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { simbolo, marcaCss } from './lib/marca.mjs';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const f of ['dist/tokens/ucam-tokens.css', 'dist/css/ucam.css']) {
  if (!existsSync(join(ROOT, f))) {
    console.error(`✗ ${f} não existe. Rode: pnpm run tokens && pnpm run css`);
    process.exit(1);
  }
}

const tokensCss = readFileSync(join(ROOT, 'dist/tokens/ucam-tokens.css'), 'utf8')
  .replace(/@import[^;]+;/g, '');
const ucamCss = readFileSync(join(ROOT, 'dist/css/ucam.css'), 'utf8')
  .replace(/@import[^;]+;/g, '');

// Dados reais da tela, lidos da captura image 12.
const setores = [
  'Assessoria Pedagógica', 'Biblioteca', 'CENPRE', 'Centro de Informática',
  'Centro Gráfico', 'CEPECAM', 'Colegiado Administração',
  'Colegiado Ciência da Computação', 'Colegiado Ciências Contábeis', 'Colegiado Direito',
];

/* ------------------------------------------------------------- ANTES --- */
// Reprodução fiel do legado, com o CSS isolado sob #antes para não vazar.
// O #7A1C2C daqui é o bordô observado nas capturas do sistema antigo, não o token da
// marca (#6C1E2B). É evidência do estado anterior — não alinhar ao token.

const antesCss = `
#antes { font-family: Roboto, Arial, sans-serif; font-size: 13px; color: #333; background: #E0E0E0; }
#antes .bar { background: #7A1C2C; color: #fff; padding: 10px 14px; display: flex; align-items: center; gap: 12px; }
#antes .bar .burger { background: #1a1a1a; color: #fff; padding: 8px 10px; font-size: 15px; line-height: 1; }
#antes .bar .sys { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; border-left: 1px solid rgba(255,255,255,.35); padding-left: 12px; }
#antes .bar .user { margin-left: auto; font-size: 11px; text-transform: uppercase; text-align: right; }
#antes .bar .campus { color: #A86472; font-size: 10px; display: block; }
#antes .panel { background: #fff; margin: 14px; padding: 16px 18px; }
#antes h2 { font-size: 17px; font-weight: 700; margin: 0 0 2px; color: #222; }
#antes .head { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
#antes .acts { display: flex; gap: 16px; font-size: 11px; text-transform: uppercase; color: #444; }
#antes .search { border: 0; border-bottom: 1px solid #bbb; padding: 6px 0; margin: 14px 0; width: 210px; font-size: 12px; color: #999; }
#antes table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
#antes thead th { background: #5A5A5A; color: #fff; text-transform: uppercase; letter-spacing: .04em; font-size: 10.5px; text-align: left; padding: 6px 10px; font-weight: 600; }
#antes tbody td { padding: 5px 10px; text-transform: uppercase; font-size: 11px; color: #444; }
#antes tbody tr:nth-child(even) { background: #E0E0E0; }
#antes .pag { display: flex; gap: 10px; justify-content: center; padding: 14px 0 2px; font-size: 11px; color: #7A1C2C; }
#antes .pag .glyph { color: #bbb; }
#antes .pag .cur { font-weight: 700; color: #222; }
#antes .btns { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
#antes .b-save { background: #111; color: #fff; padding: 8px 16px; font-size: 11px; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
#antes .b-del { background: #E8E8E8; color: #BFBFBF; padding: 8px 16px; font-size: 11px; text-transform: uppercase; }
`;

const antesHtml = `
<div id="antes">
  <div class="bar">
    <span class="burger">&#9776;</span>
    <span class="sys">Sistema de Protocolo<br>Candido Mendes</span>
    <span class="user">Leonardo Fagundes Benevides<span class="campus">Campos</span></span>
  </div>
  <div class="panel">
    <div class="head">
      <h2>Setor</h2>
      <div class="acts"><span>Novo</span><span>Pesquisar</span></div>
    </div>
    <input class="search" value="Digite aqui para pesquisar" readonly>
    <table>
      <thead><tr><th>Descrição</th></tr></thead>
      <tbody>${setores.map((s) => `<tr><td>${s}</td></tr>`).join('')}</tbody>
    </table>
    <div class="pag">
      <span class="glyph">|&#9664;</span><span class="glyph">&#9664;&#9664;</span>
      <span class="cur">1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
      <span class="glyph">&#9654;&#9654;</span><span class="glyph">&#9654;|</span>
    </div>
    <div class="btns">
      <span class="b-save">&#10004; Salvar</span>
      <span class="b-del">Excluir</span>
    </div>
  </div>
</div>`;

/* ------------------------------------------------------------ DEPOIS --- */
// Mesma tela, mesma informação. Marcação usando só classes de @ucam/css.

const depoisHtml = `
<div class="ucam" id="depois">
  <div class="ucam-appbar">
    <button class="ucam-btn ucam-btn--icon ucam-btn--ghost" aria-label="Abrir menu de navegação" style="color:var(--ucam-color-text-on-brand)">&#9776;</button>
    <span><strong>Sistema de Protocolo</strong><br><span class="ucam-campus__valor">Candido Mendes</span></span>
    <span style="margin-inline-start:auto;text-align:end">Leonardo Fagundes Benevides<br><span class="ucam-campus__valor">Campus Campos</span></span>
  </div>

  <div style="padding:var(--ucam-space-inset-lg)">
    <div class="ucam-card">
      <div class="ucam-page-header">
        <h2 class="ucam-page-header__title">Setores</h2>
        <div style="display:flex;gap:var(--ucam-space-inline-sm)">
          <button class="ucam-btn ucam-btn--secondary">Pesquisar</button>
          <button class="ucam-btn ucam-btn--primary">Novo setor</button>
        </div>
      </div>

      <div class="ucam-field ucam-field--content" style="margin-block-end:var(--ucam-space-stack-md)">
        <label class="ucam-field__label" for="busca">Pesquisar setor</label>
        <input class="ucam-input" id="busca" type="search" placeholder="Biblioteca" style="max-inline-size:22rem">
        <span class="ucam-field__hint">Busca por nome do setor.</span>
      </div>

      <div class="ucam-table-wrap">
        <table class="ucam-table">
          <caption class="ucam-sr-only">Setores cadastrados no campus Campos</caption>
          <thead>
            <tr>
              <th scope="col"><button type="button">Descrição <span aria-hidden="true">&#8593;</span></button></th>
              <th scope="col">Situação</th>
              <th scope="col" class="th--num">Requerimentos</th>
              <th scope="col"><span class="ucam-sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            ${setores.map((s, i) => `<tr>
              <td><a href="#" style="color:var(--ucam-color-text-link)">${s}</a></td>
              <td><span class="ucam-badge ucam-badge--${i % 5 === 3 ? 'warning' : 'success'}">${i % 5 === 3 ? 'Sem responsável' : 'Ativo'}</span></td>
              <td class="td--num" style="text-align:end;font-variant-numeric:tabular-nums">${[12, 4, 0, 31, 7, 2, 18, 9, 5, 23][i]}</td>
              <td style="text-align:end"><button class="ucam-btn ucam-btn--icon ucam-btn--ghost ucam-btn--sm" aria-label="Excluir setor ${s}">&#128465;</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
        <nav class="ucam-pagination" aria-label="Paginação de setores">
          <span class="ucam-pagination__range">1&ndash;10 de 58 setores</span>
          <button class="ucam-pagination__page" aria-disabled="true" aria-label="Página anterior">&#8249;</button>
          <button class="ucam-pagination__page" aria-current="page" aria-label="Página 1 de 6">1</button>
          <button class="ucam-pagination__page" aria-label="Página 2 de 6">2</button>
          <button class="ucam-pagination__page" aria-label="Página 3 de 6">3</button>
          <button class="ucam-pagination__page" aria-label="Página 4 de 6">4</button>
          <button class="ucam-pagination__page" aria-label="Página 5 de 6">5</button>
          <button class="ucam-pagination__page" aria-label="Página 6 de 6">6</button>
          <button class="ucam-pagination__page" aria-label="Próxima página">&#8250;</button>
        </nav>
      </div>
    </div>
  </div>
</div>`;

/* -------------------------------------------------------------- diffs --- */

const mudancas = [
  ['Ação primária invisível', 'O botão <em>Salvar</em> era preto e o <em>Novo</em> era só um texto cinza no cabeçalho. A ação principal da tela não se lia como ação.', 'A ação primária usa o bordô institucional. Uma por tela.', 'ADR-001'],
  ['Botão desabilitado ilegível', '<em>Excluir</em> em cinza-claro sobre cinza-claro, abaixo do limite de contraste.', 'O estado desabilitado mantém o rótulo legível, mesmo sendo isento pela 1.4.3.', 'WCAG 1.4.3'],
  ['Paginação anônima', 'Os glifos <code>|◀ ◀◀ ▶▶ ▶|</code> eram botões sem nome acessível — navegação inutilizável por leitor de tela.', 'Cada controle tem nome próprio: <em>Página 3 de 6</em>, <em>Próxima página</em>. A página atual usa <code>aria-current</code>.', 'WCAG 4.1.2'],
  ['Caixa alta em tudo', 'Cabeçalho, células, botões e navegação em CAIXA ALTA — mais lento de ler e soletrado por alguns leitores de tela.', 'Caixa natural em todo lugar. A hierarquia vem de peso e tamanho.', 'ADR-003'],
  ['Placeholder no lugar do rótulo', '<em>Digite aqui para pesquisar</em> era o único identificador do campo — e sumia ao digitar.', 'Rótulo persistente acima. O placeholder virou exemplo de valor.', 'ADR-004'],
  ['Ordenação escondida', 'Não havia como ordenar pelo cabeçalho; nas outras telas isso vivia num select separado.', 'Ordenação no cabeçalho da coluna, com <code>aria-sort</code>.', 'data-table'],
  ['Sem contagem nem intervalo', 'A paginação não dizia em que página se estava nem quantos registros existiam.', '<em>1–10 de 58 setores</em>, anunciado por região live ao mudar.', 'pagination'],
  ['Contexto de campus apagado', 'O campus ativo aparecia em cinza-claro sobre o bordô, com contraste insuficiente — e é informação crítica.', 'Herda a cor de texto sobre marca, com opacidade controlada.', 'shell-aplicacao'],
];

/* ------------------------------------------------------------- página --- */

const html = `<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Trilho A — Antes e Depois</title>
<style>
/* --fundo é o fundo da PÁGINA; --pg virou só o recuo (cabeçalho de tabela e
   trecho de código). Eram a mesma variável, e por isso a página inteira
   nascia cinza: ADR-040 diz que no tema claro nenhum FUNDO é cinza, mas o
   recuo funcional continua sendo. No escuro os dois seguem iguais, porque lá
   a separação é por luz e a página é mesmo o degrau mais baixo. */
:root{--fundo:#FFF;--pg:#F2F0F0;--pn:#FFF;--tx:#1A1717;--tx2:#5C5757;--tx3:#767171;--rl:#E4E1E1;--br:#6C1E2B;--brs:#FBF2F4;--gd:#24633F;--gds:#DDEFE5;
--fd:Georgia,"Iowan Old Style","Times New Roman",serif;--fb:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;--fm:ui-monospace,"Cascadia Mono",Consolas,monospace}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--fundo:#151212;--pg:#151212;--pn:#1D1919;--tx:#EFEBEB;--tx2:#B3ADAD;--tx3:#847E7E;--rl:#332C2C;--br:#D68E9B;--brs:#2B1418;--gd:#7FBF9C;--gds:#16281E}}
:root[data-theme="dark"]{--fundo:#151212;--pg:#151212;--pn:#1D1919;--tx:#EFEBEB;--tx2:#B3ADAD;--tx3:#847E7E;--rl:#332C2C;--br:#D68E9B;--brs:#2B1418;--gd:#7FBF9C;--gds:#16281E}
body{background:var(--fundo);color:var(--tx);font-family:var(--fb);font-size:15px;line-height:1.6}
.wrap{max-width:80rem;margin:0 auto;padding:2.5rem 1.25rem 5rem;display:flex;flex-direction:column;gap:2.5rem}
.eyebrow{font-family:var(--fm);font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3)}
${marcaCss}
/* O símbolo carrega o bordô; a linha de apoio ao lado fica no cinza de apoio. */
.marca-linha{display:flex;align-items:center;gap:.5rem;color:var(--br)}
h1{font-family:var(--fd);font-size:clamp(1.9rem,5vw,2.6rem);font-weight:400;line-height:1.1;letter-spacing:-.015em}
h2{font-family:var(--fd);font-size:1.6rem;font-weight:400;line-height:1.2}
.standfirst{font-size:1.1rem;color:var(--tx2);max-width:52ch}
header.top{border-bottom:2px solid var(--tx);padding-bottom:1.75rem;display:flex;flex-direction:column;gap:.9rem}
.note{background:var(--brs);border-inline-start:3px solid var(--br);padding:1rem 1.25rem}
.note p{max-width:66ch}
.panes{display:grid;grid-template-columns:1fr;gap:1.5rem}
@media(min-width:64rem){.panes{grid-template-columns:1fr 1fr}}
.pane{display:flex;flex-direction:column;gap:.6rem;min-width:0}
.pane-label{display:flex;align-items:baseline;gap:.6rem}
.pane-label strong{font-family:var(--fm);font-size:.7rem;letter-spacing:.09em;text-transform:uppercase}
.tag{font-family:var(--fm);font-size:.65rem;padding:.12rem .45rem;border-radius:2px}
.tag-old{background:#F0E2E2;color:#8A3A3A}
.tag-new{background:var(--gds);color:var(--gd)}
.frame{border:1px solid var(--rl);overflow:hidden;background:var(--pn)}
.frame > * { display:block }
table.diff{width:100%;border-collapse:collapse;font-size:.9rem;background:var(--pn);border:1px solid var(--rl)}
table.diff th,table.diff td{text-align:left;vertical-align:top;padding:.65rem .85rem;border-bottom:1px solid var(--rl)}
table.diff thead th{font-family:var(--fm);font-size:.65rem;letter-spacing:.07em;text-transform:uppercase;color:var(--tx3);font-weight:500;background:var(--pg)}
table.diff tbody tr:last-child td{border-bottom:0}
table.diff td:first-child{font-weight:640;white-space:nowrap}
code{font-family:var(--fm);font-size:.85em;background:var(--pg);border:1px solid var(--rl);border-radius:3px;padding:.05em .3em}
em{font-style:normal;color:var(--tx);font-weight:600}
.ref{font-family:var(--fm);font-size:.7rem;color:var(--br);white-space:nowrap}
footer{border-top:1px solid var(--rl);padding-top:1.25rem;font-size:.8rem;color:var(--tx3)}
:focus-visible{outline:2px solid var(--br);outline-offset:2px}
/* --- CSS legado, isolado sob #antes --- */
${antesCss}
/* --- tokens gerados --- */
${tokensCss}
/* --- @ucam/css gerado --- */
${ucamCss}
</style>

<div class="wrap">
  <header class="top">
    <div class="marca-linha">${simbolo()}<span class="eyebrow">Design System UCAM &middot; Trilho A</span></div>
    <h1>A mesma tela, sem migrar nada</h1>
    <p class="standfirst">Tela <strong>Setor</strong> do Sistema de Protocolo. À direita, a mesma informação renderizada por <code>@ucam/tokens</code> e <code>@ucam/css</code> — as folhas geradas de <code>spec/</code>, embutidas nesta página sem alteração.</p>
  </header>

  <div class="note">
    <p><strong>Por que isso importa.</strong> O parque está em Angular 14 ou anterior e não consegue consumir a biblioteca de componentes. Mas consegue consumir uma folha de estilo. O Trilho A entrega identidade e acessibilidade a esses sistemas <strong>hoje</strong>, com um <code>&lt;link&gt;</code> e um <code>class="ucam"</code> no container — sem tocar em uma linha de Angular, sem conflitar com o CSS existente e sem <em>preflight</em>.</p>
  </div>

  <div class="panes">
    <section class="pane">
      <div class="pane-label"><strong>Antes</strong><span class="tag tag-old">produção hoje</span></div>
      <div class="frame">${antesHtml}</div>
    </section>
    <section class="pane">
      <div class="pane-label"><strong>Depois</strong><span class="tag tag-new">@ucam/css</span></div>
      <div class="frame">${depoisHtml}</div>
    </section>
  </div>

  <section>
    <div class="eyebrow">O que mudou</div>
    <h2>Oito correções, nenhuma migração</h2>
    <table class="diff">
      <thead><tr><th>Problema</th><th>Antes</th><th>Depois</th><th>Contrato</th></tr></thead>
      <tbody>
        ${mudancas.map(([t, a, d, r]) => `<tr><td>${t}</td><td>${a}</td><td>${d}</td><td class="ref">${r}</td></tr>`).join('')}
      </tbody>
    </table>
  </section>

  <section>
    <div class="eyebrow">Como adotar</div>
    <h2>Duas linhas</h2>
    <div class="frame" style="padding:1.1rem 1.3rem;font-family:var(--fm);font-size:.82rem;line-height:1.7;color:var(--tx2);overflow-x:auto"><pre style="margin:0">&lt;link rel="stylesheet" href="/assets/ucam-tokens.css"&gt;
&lt;link rel="stylesheet" href="/assets/ucam.css"&gt;

&lt;div class="ucam"&gt;
  &lt;!-- a tela existente, com as classes trocadas gradualmente --&gt;
&lt;/div&gt;</pre></div>
    <p style="margin-top:.9rem;color:var(--tx2);max-width:66ch">A adoção é incremental: o <code>@ucam/css</code> não estiliza elemento nu nenhum. Uma tela pode ser convertida por vez, e uma tela pela metade continua funcionando.</p>
  </section>

  <footer>
    <p>Gerado por <code>tools/build-demo.mjs</code>. O lado <em>Depois</em> usa os arquivos reais de <code>dist/</code>: mudou o token na spec, muda esta página. As cores da paleta ainda são estimadas de captura de tela.</p>
  </footer>
</div>`;

const outDir = join(ROOT, 'docs');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'prova.html'), html, 'utf8');

console.log('prova do Trilho A → docs/prova.html');
console.log(`  ${(html.length / 1024).toFixed(0)} KB · ${mudancas.length} correções documentadas`);
console.log(`  CSS embutido: tokens ${(tokensCss.length / 1024).toFixed(1)} KB + ucam ${(ucamCss.length / 1024).toFixed(1)} KB`);
