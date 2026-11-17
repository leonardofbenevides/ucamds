// Os guias "Como usar" das telas, de spec/guias/<projeto>.json.
//
// POR QUE ISTO EXISTE (27/10/2026)
//
// Tudo o que a spec dizia de uma tela era para quem a desenha ou a constrói:
// notas de decisão, regras de negócio, o efeito de cada ação. Nada respondia a
// pergunta de quem a USA: "para que serve isto e por onde começo?". O guia é
// essa resposta, escrito por tarefa e não por região da tela, porque é por
// tarefa que a pessoa procura ajuda (ajuda orientada a tarefa, e não um tour).
//
// Um arquivo por projeto, e não um campo em templates.json: o guia muda em
// ritmo próprio, é escrito por outra mão e não disputa a linha única do
// preview com as sessões que editam as telas.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function lerGuias(root) {
  const dir = join(root, 'spec', 'guias');
  const guias = {};
  if (!existsSync(dir)) return guias;
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    const g = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    guias[g.projeto] = g;
  }
  return guias;
}

/** O guia de uma tela, ou undefined. */
export const guiaDe = (guias, projeto, tela) => guias[projeto]?.telas?.[tela];

/**
 * Confere o guia contra as telas. Devolve a lista de problemas.
 * Regras: toda tela tem guia; todo guia tem objetivo, quem e ao menos uma
 * tarefa com título e passos; nenhum guia aponta para tela que não existe.
 */
export function confereGuias(guias, projetos) {
  const erros = [];
  const texto = (v) => typeof v === 'string' && v.trim().length > 0;
  for (const p of projetos) {
    const gp = guias[p.id];
    if (!gp) { erros.push(`${p.id}: projeto sem spec/guias/${p.id}.json`); continue; }
    if (!texto(gp.app?.para_que)) erros.push(`${p.id}: falta app.para_que`);
    const ids = new Set(p.templates.map((t) => t.id));
    for (const id of Object.keys(gp.telas ?? {})) if (!ids.has(id)) erros.push(`${p.id}/${id}: guia de tela que não existe`);
    for (const t of p.templates) {
      const g = gp.telas?.[t.id];
      const onde = `${p.id}/${t.id}`;
      if (!g) { erros.push(`${onde}: tela sem guia`); continue; }
      if (!texto(g.objetivo)) erros.push(`${onde}: falta objetivo`);
      if (!texto(g.quem)) erros.push(`${onde}: falta quem`);
      if (!Array.isArray(g.tarefas) || !g.tarefas.length) erros.push(`${onde}: falta ao menos uma tarefa`);
      for (const [i, tf] of (g.tarefas ?? []).entries()) {
        if (!texto(tf.titulo)) erros.push(`${onde}: tarefa ${i + 1} sem título`);
        if (!Array.isArray(tf.passos) || !tf.passos.length || !tf.passos.every(texto)) erros.push(`${onde}: tarefa ${i + 1} sem passos`);
        if ((tf.passos ?? []).length > 7) erros.push(`${onde}: tarefa ${i + 1} com mais de 7 passos — divida em duas`);
      }
      for (const x of g.termos ?? []) if (!texto(x.termo) || !texto(x.significa)) erros.push(`${onde}: termo incompleto`);
      for (const x of g.duvidas ?? []) if (!texto(x.pergunta) || !texto(x.resposta)) erros.push(`${onde}: dúvida incompleta`);
    }
  }
  return erros;
}
