// Gera o registro de ícones da biblioteca a partir de spec/icons.json.
//
// O conjunto é curado: só entra ícone que a spec lista. O tipo gerado faz o
// TypeScript recusar nome fora do conjunto — que é como se evita o Portal
// atual, onde o mesmo capelo identifica três módulos diferentes e alguns
// ícones aparecem quebrados em produção.
//
//   node tools/build-icons.mjs

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(readFileSync(join(ROOT, 'spec', 'icons.json'), 'utf8'));
const LIB = join(ROOT, 'ui', 'projects', 'ui', 'src', 'lib', 'ucam', 'icon');

const icones = spec.grupos.flatMap((g) => g.icones.map((i) => ({ ...i, grupo: g.id })));
const nomes = icones.map((i) => i.lucide);

const dup = nomes.filter((n, i) => nomes.indexOf(n) !== i);
if (dup.length) {
  console.error('✗ ícones duplicados em spec/icons.json:', [...new Set(dup)].join(', '));
  process.exit(1);
}

// @ng-icons/lucide exporta cada ícone como lucideNomeEmCamelCase.
const simbolo = (n) => 'lucide' + n[0].toUpperCase() + n.slice(1);

const out = `// GERADO por tools/build-icons.mjs a partir de spec/icons.json.
// NÃO EDITAR À MÃO. Para adicionar um ícone, edite a spec e rode: pnpm run icons
//
// ${icones.length} ícones em ${spec.grupos.length} grupos.

import { ${nomes.map(simbolo).sort().join(',\n  ')} } from '@ng-icons/lucide';

/** Nome de ícone aceito pelo design system. Qualquer outro é erro de tipo. */
export type UcamIconName =
${nomes.map((n) => `  | '${n}'`).sort().join('\n')};

/** Registro passado a provideIcons(). */
export const UCAM_ICONS: Record<string, string> = {
${nomes.map((n) => `  ${simbolo(n)},`).join('\n')}
};

/** Mapeia o nome público para a chave que o ng-icon espera. */
export const UCAM_ICON_KEY: Record<UcamIconName, string> = {
${nomes.map((n) => `  '${n}': '${simbolo(n)}',`).join('\n')}
};

/** Uso documentado de cada ícone — alimenta a página de Iconografia. */
export const UCAM_ICON_USO: Record<UcamIconName, string> = {
${icones.map((i) => `  '${i.lucide}': ${JSON.stringify(i.uso)},`).join('\n')}
};
`;

if (!existsSync(LIB)) mkdirSync(LIB, { recursive: true });
writeFileSync(join(LIB, 'ucam-icons.generated.ts'), out, 'utf8');

console.log('ícones → ui/projects/ui/src/lib/ucam/icon/');
console.log(`  ucam-icons.generated.ts  ${icones.length} ícones · ${spec.grupos.length} grupos`);

/* --------------------------------------------------------- sprite SVG --- */
// O site de documentação é HTML estático: não roda Angular, então não pode
// usar <ucam-icon>. O sprite dá os MESMOS ícones ao site, da mesma fonte —
// sem isso a documentação usaria emoji e divergiria do que ela documenta.

const lucide = await import('@ng-icons/lucide');

const faltando = [];
const simbolos = [];

for (const n of nomes) {
  const svg = lucide[simbolo(n)];
  if (typeof svg !== 'string') { faltando.push(n); continue; }
  // Extrai o miolo do <svg> e vira <symbol>, preservando o viewBox.
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? '0 0 24 24';
  const miolo = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
  // fill sai por variável, com "none" de padrão — o traçado do lucide continua
  // sendo o repouso de todo ícone. É o único jeito de um ícone do sprite mudar
  // de FORMA a partir do CSS: o conteúdo clonado pelo <use> não é alcançável
  // por seletor, e o fill="none" cravado como atributo vence a herança. Custom
  // property atravessa a fronteira do clone e o atributo passa a ler dela.
  //
  // Quem usa: o interruptor de ícone (icon-button.json, prop pressed), onde a
  // estrela pressionada precisa se distinguir da solta sem depender de cor.
  simbolos.push(
    `<symbol id="i-${n}" viewBox="${viewBox}" fill="var(--ucam-icon-fill, none)" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${miolo}</symbol>`,
  );
}

if (faltando.length) {
  console.error(`\n✗ ícones da spec que não existem no @ng-icons/lucide:`);
  for (const n of faltando) console.error(`  ${n} (esperado: ${simbolo(n)})`);
  process.exit(1);
}

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${simbolos.join('')}</svg>`;

const OUT_ICONS = join(ROOT, 'dist', 'icons');
if (!existsSync(OUT_ICONS)) mkdirSync(OUT_ICONS, { recursive: true });
writeFileSync(join(OUT_ICONS, 'sprite.svg'), sprite, 'utf8');

console.log(`  dist/icons/sprite.svg    ${(sprite.length / 1024).toFixed(1)} KB · mesmo conjunto, para o site`);
