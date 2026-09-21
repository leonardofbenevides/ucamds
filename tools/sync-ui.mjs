// Liga @ucam/tokens à biblioteca Angular e verifica a fronteira da ADR-006.
//
//   1. copia os CSS gerados para dentro de ui/projects/ui/src/tokens/
//   2. garante que o styles.css da ZardUI importe a ponte
//   3. FALHA se qualquer símbolo Zard* vazar para a API pública
//
//   node tools/sync-ui.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'tokens');
const LIB = join(ROOT, 'ui', 'projects', 'ui', 'src');

if (!existsSync(LIB)) {
  console.log('ui/ ainda não existe — pulando sync.');
  process.exit(0);
}

const erros = [];

/* ------------------------------------------------- 1. copiar os tokens --- */

const destino = join(LIB, 'tokens');
if (!existsSync(destino)) mkdirSync(destino, { recursive: true });

const arquivos = ['ucam-tokens.css', 'ucam-zard-bridge.css'];
for (const f of arquivos) {
  const origem = join(DIST, f);
  if (!existsSync(origem)) {
    erros.push(`${f} não existe em dist/tokens — rode: pnpm run tokens`);
    continue;
  }
  copyFileSync(origem, join(destino, f));
}

/* ------------------------------------ 2. ligar a ponte ao tema da Zard --- */

const stylesPath = join(LIB, 'styles.css');
const IMPORT = `@import './tokens/ucam-zard-bridge.css';`;

if (existsSync(stylesPath)) {
  let styles = readFileSync(stylesPath, 'utf8');
  if (!styles.includes(IMPORT)) {
    // A ponte precisa vir DEPOIS do :root neutro que o zard-cli instalou,
    // senão o tema da base vence por ordem de cascata.
    styles = styles.trimEnd() + `\n\n/* ponte para os tokens da UCAM — gerada por tools/build-tokens.mjs.\n   Precisa ficar por último: sobrescreve o tema neutro da ZardUI. */\n${IMPORT}\n`;
    writeFileSync(stylesPath, styles, 'utf8');
    console.log('  styles.css — import da ponte adicionado');
  } else {
    console.log('  styles.css — import da ponte já presente');
  }
} else {
  erros.push('projects/ui/src/styles.css não encontrado');
}

/* ------------------------------------------- 3. fronteira da ADR-006 --- */
// Nenhum símbolo da base pode vazar para a API pública. Se vazar, uma
// aplicação pode importar <z-button> e a promessa de trocar a base sem
// tocar em tela nenhuma deixa de valer.

const publicApi = join(LIB, 'public-api.ts');
if (existsSync(publicApi)) {
  const src = readFileSync(publicApi, 'utf8');
  for (const linha of src.split('\n')) {
    if (linha.trim().startsWith('//') || linha.trim().startsWith('*')) continue;
    if (/\bZard\w*/.test(linha) || /shared\/components/.test(linha)) {
      erros.push(`public-api.ts expõe a base: ${linha.trim()}`);
    }
  }
}

// Wrappers podem importar a base; aplicações, não. Verifica se todo wrapper
// realmente existe para os componentes que a base instalou.
const zardDir = join(LIB, 'lib', 'shared', 'components');
const ucamDir = join(LIB, 'lib', 'ucam');
if (existsSync(zardDir) && existsSync(ucamDir)) {
  const base = readdirSync(zardDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const wrappers = readdirSync(ucamDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  // O wrapper raramente tem o nome da base (text-field envolve input). A
  // cobertura real se mede pelos imports, não pelo nome da pasta.
  const importado = new Set();
  for (const w of wrappers) {
    for (const f of readdirSync(join(ucamDir, w))) {
      if (!f.endsWith('.ts')) continue;
      const src = readFileSync(join(ucamDir, w, f), 'utf8');
      for (const m of src.matchAll(/shared\/components\/([a-z-]+)\//g)) importado.add(m[1]);
    }
  }
  console.log(`  base ZardUI: ${base.length} componentes · wrappers UCAM: ${wrappers.length}`);

  // Cobertura pelo lado que importa: cada contrato tem base para partir?
  // Escrever do zero o que a base já resolve é desperdício e divergência.
  // null = não existe base para partir, ou existe e foi recusada com motivo
  // escrito no cabeçalho do wrapper. O null precisa ser declarado aqui: sem
  // ele o portão pede "npx zard-cli add <componente>" para um componente que
  // a ZardUI não tem, e o aviso vira ruído que se aprende a ignorar.
  const MAPA_BASE = {
    'text-field': 'input', 'date-field': 'input', 'badge': 'badge',
    'icon-button': 'button', 'app-shell': 'sidebar', 'section-bar': 'separator',
    'data-table': 'table', 'empty-state': null, 'page-header': null,
    // A ZardUI não tem equivalente para nenhum destes.
    'list-item': null, 'description-list': null, 'timeline': null,
    // A trilha NÃO é componente próprio: é parte do page-header, que a
    // declara na anatomia e no prop `breadcrumb`. O z-breadcrumb da base foi
    // REMOVIDO do repositório em 06/09/2026 — ninguém importava, e a
    // implementação do page-header diverge dele de propósito em três pontos
    // escritos no arquivo (tinta que separa link de página atual, separador
    // tipográfico em vez de ícone maior que o texto, e a trilha como faixa
    // própria acima do cabeçalho). Manter uma cópia não usada da base é
    // código morto fingindo ser matéria-prima. Voltar custa um comando.
    'stepper': null, 'choice-card': null,
    // Tem z-progress, e ele foi RECUSADO: crava aria-valuemin=0 e
    // aria-valuemax=100 no host e só aceita porcentagem, enquanto o contrato
    // exige o total real mais aria-valuetext. O motivo está no cabeçalho de
    // ucam-progress.ts.
    'progress': null,

    // Contratos escritos em 05/09/2026, a partir de blocos que já existiam no
    // Trilho A e não tinham contrato nenhum. Nenhum deles tem equivalente na
    // ZardUI, e declará-los aqui é o que impede o portão de mandar rodar
    // "zard-cli add stat" — comando que não existe e ensina a ignorar o aviso.
    'stat': null,        // ladrilho de indicador; a base não tem métrica
    'prazo': null,       // marcador de urgência, específico do domínio
    'icon-tile': null,   // fundo de ícone; a base resolve caso a caso no markup
    'segmented': null,   // a base tem toggle-group, com API de seleção múltipla
    'kbd': null,         // pastilha de tecla
    'chip': null,        // a base tem badge, que é outro papel — ver os contratos
    'link': null,        // âncora estilizada; a base não estiliza elemento nu
    'field': null,       // casca de campo; é justamente o que falta na base
    'icon': null,        // vem de @ng-icons/lucide, não da ZardUI
    // Marca do trecho que casou com a busca. A base não tem nada equivalente —
    // e não teria: o que o realce faz de difícil não é pintar, é FATIAR o texto
    // em nós sem passar por innerHTML, que é decisão de aplicação e não de
    // biblioteca de componentes.
    'realce': null,
    // A fala de uma pessoa no corpo do registro. A base não desenha blockquote.
    'citacao': null,
    // A caixa de escrever a resposta: campo e ações numa peça só. A base tem
    // textarea e button soltos, e é deles que ela é composta — não há base
    // para PARTIR.
    'compositor': null,
    'card': 'card',
    'alert': 'alert',
    'tabs': 'tabs',
  };

  const contratos = readdirSync(join(ROOT, 'spec', 'components'))
    .filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));

  const semBase = [];
  const semPartir = [];
  for (const c of contratos) {
    const alvo = c in MAPA_BASE ? MAPA_BASE[c] : c;
    if (alvo === null) { semBase.push(c); continue; }
    if (!base.includes(alvo)) semPartir.push(`${c} (precisa de "${alvo}")`);
  }

  console.log(`  contratos com base para partir: ${contratos.length - semBase.length - semPartir.length}/${contratos.length}`);
  if (semPartir.length) {
    console.log(`  ⚠ contrato sem a base instalada: ${semPartir.join(', ')}`);
    console.log(`    instale com: npx zard-cli add <componente>`);
  }
  if (semBase.length) {
    console.log(`  sem equivalente na base (implementação nossa): ${semBase.join(', ')}`);
  }

  const naBaseSemContrato = base.filter(
    (b) => !contratos.includes(b) && !Object.values(MAPA_BASE).includes(b),
  );
  if (naBaseSemContrato.length) {
    console.log(`  na base, ainda sem contrato: ${naBaseSemContrato.join(', ')}`);
  }
}

/* ------------- 3b. output com nome de evento do DOM dispara em dobro --- */
//
// Um componente que declara `readonly click = output<MouseEvent>()` e emite
// esse output a partir de um <button> do próprio template faz o handler do
// consumidor rodar DUAS vezes por clique: uma pelo output, outra pelo evento
// nativo, que continua borbulhando do <button> interno até o host.
//
// Passou despercebido por meses porque todo handler existente era idempotente
// — `excluiu.set(true)`, `salvar()` — e rodar duas vezes dava o mesmo
// resultado. Quem revelou foi o primeiro handler que NÃO é: o interruptor da
// estrela, `fixado.set(!fixado())`, que alternava duas vezes e voltava ao
// estado inicial. O custo real é a submissão em dobro num formulário.
//
// A saída é não declarar o output: o evento nativo já sobe até o host, e o
// (click) do consumidor continua funcionando — uma vez só.
{
  // Eventos que o host, sendo um elemento de verdade, já entrega por bolha.
  const NATIVOS = new Set([
    'click', 'dblclick', 'focus', 'blur', 'input', 'change', 'submit', 'select',
    'keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'mouseenter',
    'mouseleave', 'mouseover', 'mouseout', 'mousemove', 'contextmenu', 'scroll',
    'wheel', 'drag', 'drop', 'paste', 'copy', 'cut', 'toggle',
  ]);
  const ucamDir = join(ROOT, 'ui', 'projects', 'ui', 'src', 'lib', 'ucam');
  const colisoes = [];
  for (const arq of readdirSync(ucamDir, { recursive: true })) {
    const nome = String(arq);
    if (!nome.endsWith('.ts') || nome.endsWith('.generated.ts')) continue;
    const src = readFileSync(join(ucamDir, nome), 'utf8');
    for (const m of src.matchAll(/readonly\s+([a-zA-Z]+)\s*=\s*output\s*[<(]/g)) {
      if (NATIVOS.has(m[1])) colisoes.push(`${nome.replace(/\\/g, '/')} → output "${m[1]}"`);
    }
  }
  if (colisoes.length) {
    console.error('\n✗ output com nome de evento nativo — o handler do consumidor roda DUAS vezes:');
    for (const c of colisoes) console.error(`    ${c}`);
    console.error('    Remova o output: o evento nativo já borbulha do controle interno até o host.');
    process.exitCode = 1;
  } else {
    console.log('  ✓ nenhum output colide com evento nativo (sem disparo em dobro)');
  }
}

/* ------------------------------------- 4. o wrapper casa com a base? --- */
//
// Um wrapper que escreve `<span z-badge>` quando o seletor da base é
// `z-badge, a[z-badge]` compila, renderiza e ESTÁ ERRADO: o componente nunca
// é instanciado, e a peça sai sem as classes da base — foi assim que a
// Badge ficou sem preenchimento e sem raio, sem ninguém perceber
// enquanto só o preview do Trilho A aparecia no site. O compilador do Angular
// não reclama porque um atributo desconhecido em elemento HTML é legal.
{
  const seletores = new Map(); // nome do atributo z-* → tags que a base aceita
  for (const arq of readdirSync(zardDir, { recursive: true })) {
    if (!String(arq).endsWith('.component.ts')) continue;
    const src = readFileSync(join(zardDir, String(arq)), 'utf8');
    for (const m of src.matchAll(/selector:\s*'([^']+)'/g)) {
      for (const parte of m[1].split(',').map((s) => s.trim())) {
        const attr = parte.match(/^([a-z0-9]*)\[([a-z0-9-]+)\]$/);
        if (attr) {
          const nome = attr[2];
          if (!seletores.has(nome)) seletores.set(nome, new Set());
          // tag vazia = qualquer elemento
          seletores.get(nome).add(attr[1] || '*');
        }
      }
    }
  }

  // Comentários fora antes de varrer: este arquivo e os wrappers EXPLICAM o
  // erro citando `<span z-badge>` em prosa, e sem isto o portão acusaria a
  // própria documentação dele.
  const semComentarios = (s) =>
    s
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

  for (const arq of readdirSync(ucamDir, { recursive: true })) {
    if (!String(arq).endsWith('.ts')) continue;
    const src = semComentarios(readFileSync(join(ucamDir, String(arq)), 'utf8'));
    for (const m of src.matchAll(/<([a-z][a-z0-9]*)\s+(z-[a-z0-9-]+)[\s>]/g)) {
      const [, tag, attr] = m;
      const aceitas = seletores.get(attr);
      if (!aceitas) {
        erros.push(
          `${arq}: usa o atributo [${attr}], que nenhum seletor da base declara. ` +
            `Use o ELEMENTO <${attr}> ou confira o nome.`,
        );
      } else if (!aceitas.has('*') && !aceitas.has(tag)) {
        erros.push(
          `${arq}: <${tag} ${attr}> não casa com a base — ela aceita ${[...aceitas]
            .map((t) => (t === '*' ? 'qualquer elemento' : `<${t}>`))
            .join(' ou ')}. O componente não seria instanciado.`,
        );
      }
    }
  }
}

/* ---------------------------------------------------------- relatório --- */

if (erros.length) {
  console.error('\n✗ sync-ui:');
  for (const e of erros) console.error(`  ${e}`);
  process.exit(1);
}
console.log('  ✓ fronteira ADR-006 intacta: nada da ZardUI na API pública');
