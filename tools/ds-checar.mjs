// Audita os templates do app contra os contratos do UCAMDS.
// O binário `ucam-ds checar` recebe caminhos prontos; no Windows o npm não
// expande o glob, então este script expande e chama o mesmo núcleo.
import { globSync, readFileSync } from 'node:fs';
import { checar } from '@ucam/ds-mcp/mcp';

const arquivos = globSync('src/app/**/*.html');
let erros = 0;
for (const arq of arquivos) {
  const { resumo, achados } = checar({ codigo: readFileSync(arq, 'utf8') });
  erros += resumo.erros;
  console.log(`${resumo.aprovado ? '✓' : '✗'} ${arq} — ${resumo.erros} erro(s), ${resumo.avisos} aviso(s)`);
  for (const a of achados) console.log(`    ${a.severidade === 'erro' ? '✗' : '⚠'} [${a.regra}] ${a.mensagem}`);
}
console.log(`${arquivos.length} arquivo(s) auditado(s)`);
process.exit(erros ? 1 : 0);
