// AS TELAS VIVAS — a tela de referência montada em Angular (Trilho B).
//
// O campo `codigo` de spec/templates.json nasceu como esboço: um trecho em
// Angular dez vezes menor que a tela, que ninguém compilava. Em 03/10/2026 a
// primeira tela de referência foi montada de verdade com @ucam/ui, em
// site/src/app/pages/vivo/<projeto>/<tela>.page.ts, e comparada pixel a
// pixel com a página autônoma do Trilho A (tools/prova-paridade-tela.mjs).
//
// Quando a tela viva existe, ELA é o código que o dev copia — o esboço da
// spec fica para trás. Este módulo é o único lugar que sabe onde a tela viva
// mora e como tirar o template dela; build-index (site) e build-agentes
// (kit) perguntam aqui, para o site e o MCP mostrarem o mesmo código.

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function arquivoVivo(projetoId, telaId) {
  return join(ROOT, 'site', 'src', 'app', 'pages', 'vivo', projetoId, `${telaId}.page.ts`);
}

/**
 * O template da tela viva, sem o recuo do arquivo, ou null quando a tela
 * ainda não foi montada em Angular.
 */
export function codigoVivo(projetoId, telaId) {
  const arquivo = arquivoVivo(projetoId, telaId);
  if (!existsSync(arquivo)) return null;
  const fonte = readFileSync(arquivo, 'utf8');
  const ini = fonte.indexOf('template: `');
  const fim = fonte.indexOf('\n  `,', ini);
  if (ini < 0 || fim < 0) throw new Error(`${arquivo}: não achei "template: \`" … "\`," — o extrator espera o template como literal direto no decorator`);
  const corpo = fonte.slice(ini + 'template: `'.length, fim);
  // Tira o recuo comum (o template vive quatro espaços para dentro do decorator).
  const linhas = corpo.replace(/^\n/, '').split('\n');
  const recuo = Math.min(...linhas.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return linhas.map((l) => l.slice(recuo)).join('\n').trim() + '\n';
}

/** Os projetos com o `codigo` das telas vivas no lugar do esboço, e `vivo: true` nelas. */
export function comTelasVivas(projetos) {
  return projetos.map((p) => ({
    ...p,
    templates: p.templates.map((t) => {
      const vivo = codigoVivo(p.id, t.id);
      return vivo ? { ...t, codigo: vivo, vivo: true } : t;
    }),
  }));
}
