// Audita os templates do app contra os contratos do UCAMDS.
// O binário `ucam-ds checar` recebe caminhos prontos; no Windows o npm não
// expande o glob, então este script expande e chama o mesmo núcleo.
//
// Entram os .html e também os templates embutidos nos .ts (molduras, diálogo
// de entrega, mapa de questões…): metade das telas mora ali, e até 01/10/2026
// só os .html eram conferidos.
import { globSync, readFileSync } from 'node:fs';
import { checar } from '@ucam/ds-mcp/mcp';

// DESVIOS DECLARADOS: onde a biblioteca (@ucam/ui) está à frente do contrato.
// O <ucam-app-shell> desenha a marquinha do sistema, o link da marca e os
// grupos de navegação por estas três entradas, e sem elas não há moldura; o
// contrato do app-shell ainda não as lista. Saem daqui quando o contrato as
// declarar — é pendência do DS, registrada no README.
const DESVIOS = [/<ucam-app-shell> não tem a prop "(systemIcon|homeHref|navGroups)"/];

const fontes = [
  ...globSync('src/app/**/*.html').map((arq) => ({ arq, codigo: readFileSync(arq, 'utf8') })),
  ...globSync('src/app/**/*.ts')
    .filter((arq) => !arq.endsWith('.spec.ts'))
    .map((arq) => ({ arq, codigo: /template:\s*`([\s\S]*?)`,\s*\n/.exec(readFileSync(arq, 'utf8'))?.[1] ?? '' }))
    .filter((f) => f.codigo.trim().length > 20),
];

let erros = 0;
for (const { arq, codigo } of fontes) {
  const achados = checar({ codigo }).achados.map((a) =>
    a.severidade === 'erro' && DESVIOS.some((d) => d.test(a.mensagem)) ? { ...a, severidade: 'desvio' } : a,
  );
  const n = (s) => achados.filter((a) => a.severidade === s).length;
  erros += n('erro');
  console.log(`${n('erro') ? '✗' : '✓'} ${arq} — ${n('erro')} erro(s), ${n('aviso')} aviso(s)${n('desvio') ? `, ${n('desvio')} desvio(s) declarado(s)` : ''}`);
  for (const a of achados) {
    if (a.severidade !== 'desvio') console.log(`    ${a.severidade === 'erro' ? '✗' : '⚠'} [${a.regra}] ${a.mensagem}`);
  }
}
console.log(`${fontes.length} template(s) auditado(s)`);
process.exit(erros ? 1 : 0);
