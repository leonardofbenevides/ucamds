// Portão da FAIXA (ADR-038).
//
//   node tools/check-faixa.mjs
//
// Três coisas do cabeçalho que já foram desfeitas sem ninguém notar, e que a
// partir daqui quebram o build em vez de sumir em silêncio:
//
//   1. BUSCA E CAMPUS EM PAPEL. Transparentes, herdam o fundo da faixa e ficam
//      invisíveis na faixa clara. O fundo sai de --ucam-appbar-control-bg, que
//      é papel por padrão e transparente só nas faixas escura e de marca.
//   2. A COR DO AVATAR É DELE. O avatar não pode cair no fundo dos controles
//      nem ficar transparente: é a única peça da faixa que identifica uma
//      pessoa, e some contra a barra sem fundo próprio.
//   3. ÁREA DE CLIQUE DOS ÍCONES. Os controles de ícone da faixa medem 28px
//      de desenho e dependem do extensor por pseudo-elemento do fim da folha
//      para chegar ao alvo mínimo. Sair da lista do extensor é encolher o
//      alvo sem mudar nada que se veja — foi assim que o botão de desfixar
//      quebrou em 10/09/2026.
//
// Lê o CSS CONSTRUÍDO, não a fonte: o que vale é o que sai em dist/.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSS = join(ROOT, 'dist', 'css', 'ucam.css');

if (!existsSync(CSS)) {
  console.error('✗ dist/css/ucam.css não existe — rode pnpm run css antes.');
  process.exit(1);
}

const css = readFileSync(CSS, 'utf8');
const erros = [];

/** O corpo da primeira regra com este seletor exato. */
function regra(seletor) {
  const i = css.indexOf(`\n${seletor} {`);
  if (i < 0) return null;
  return css.slice(i, css.indexOf('}', i));
}

function exige(seletor, propriedade, esperado, porque) {
  const corpo = regra(seletor);
  if (corpo === null) return erros.push(`${seletor} não existe mais na folha`);
  const m = corpo.match(new RegExp(`${propriedade}\\s*:\\s*([^;]+);`));
  if (!m) return erros.push(`${seletor} perdeu ${propriedade} — ${porque}`);
  const valor = m[1].trim();
  if (!valor.includes(esperado)) {
    erros.push(`${seletor} tem ${propriedade}: ${valor}, esperado conter "${esperado}" — ${porque}`);
  }
}

/* 1. Busca e campus em papel ------------------------------------------- */

exige('.ucam-appbar', '--ucam-appbar-control-bg', 'var(--ucam-color-surface-default)',
  'o padrão da faixa é papel; sem ele a busca volta a ter o fundo da barra');
exige('.ucam-appbar__search', 'background', '--ucam-appbar-control-bg',
  'o campo de busca lê o fundo dos controles da faixa, não transparente cravado');
exige('.ucam-select--faixa', 'background-color', '--ucam-appbar-control-bg',
  'o campus lê o mesmo fundo que a busca: são os dois controles da faixa');

for (const variante of ['.ucam-appbar--escura', '.ucam-appbar--marca']) {
  exige(variante, '--ucam-appbar-control-bg', 'transparent',
    'papel sobre tarja é um retângulo claro cravado nela — a faixa colorida já separa o controle');
}

/* 2. A cor do avatar é dele -------------------------------------------- */

const avatar = regra('.ucam-appbar__avatar');
if (avatar === null) {
  erros.push('.ucam-appbar__avatar não existe mais na folha');
} else {
  const m = avatar.match(/background\s*:\s*([^;]+);/);
  if (!m) {
    erros.push('.ucam-appbar__avatar perdeu o fundo próprio — sem ele a inicial flutua sobre a faixa');
  } else {
    const valor = m[1].trim();
    if (valor === 'transparent' || valor === 'none') {
      erros.push(`.ucam-appbar__avatar ficou sem fundo (${valor}) — é a peça que identifica a pessoa`);
    }
    if (valor.includes('--ucam-appbar-control-bg')) {
      erros.push('.ucam-appbar__avatar caiu no fundo dos CONTROLES — ele não é um controle, e em papel a inicial some');
    }
  }
}

/* 3. Área de clique dos ícones ----------------------------------------- */

// O bloco do extensor é o último da folha e declara duas listas: a que ganha
// position: relative e a dos ::after. Os controles de ícone da faixa têm de
// estar nas duas — na segunda é que mora o alvo.
const ALVOS = [
  ['.ucam-appbar__brand', 'a marca também troca de sistema'],
  ['.ucam-appbar__lancador', 'é o sino e o lançador de sistemas, 28px de desenho'],
  ['.ucam-appbar__user', 'abre o menu da conta'],
  ['.ucam-select--faixa', 'o campus é o controle mais estreito da faixa'],
  ['.ucam-btn', 'o botão de menu da faixa é um .ucam-btn'],
];

const iAlvo = css.indexOf('ALVO DE PONTEIRO');
const bloco = iAlvo < 0 ? '' : css.slice(iAlvo);
for (const [seletor, porque] of ALVOS) {
  if (!bloco.includes(`${seletor} {`) && !bloco.includes(`${seletor},`)) {
    erros.push(`${seletor} saiu da lista do extensor de alvo — ${porque}`);
  }
  if (!bloco.includes(`${seletor}::after`)) {
    erros.push(`${seletor} não tem ::after no extensor — o alvo encolheu para o tamanho do desenho, ${porque}`);
  }
}

if (erros.length) {
  console.error(`✗ faixa: ${erros.length} ${erros.length === 1 ? 'quebra' : 'quebras'}`);
  for (const e of erros) console.error(`    · ${e}`);
  process.exit(1);
}

console.log('  ✓ faixa: busca e campus em papel, avatar com cor própria, alvos de ícone estendidos');
