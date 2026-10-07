// Prova da isenção em rolagem única (ADR-063/064): os fluxos que as provas de
// setembro cobriam, contra o desenho de hoje. Precisa de um Chrome com CDP
// (CDP=http://localhost:9471) e das telas servidas (BASE=http://localhost:5471).
//   1. pnpm run css && pnpm run telas        (gera docs/t)
//   2. sirva docs/ em :5471 e abra um Chrome com --remote-debugging-port=9471
//   3. node tools/prova-isencao.mjs          (CDP e BASE trocam os endereços)
// Não entra no build: é prova de comportamento, para rodar depois de mexer nas telas
// da isenção ou nos tratadores delas em tools/lib/shell.mjs.
const CDP = process.env.CDP || 'http://localhost:9471';
const BASE = process.env.BASE || 'http://localhost:5471';
async function abre(tela, largura = 1440) {
  const alvo = await (await fetch(`${CDP}/json/new?${BASE}/t/isencao-${tela}.html`, { method: 'PUT' })).json();
  const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map(); const erros = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
  const cmd = (m, p = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: largura, height: 900, deviceScaleFactor: 1, mobile: false });
  await cmd('Page.reload'); await new Promise((r) => setTimeout(r, 1300));
  const js = async (x) => { const r = await cmd('Runtime.evaluate', { expression: `(async () => { ${x} })()`, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) { erros.push('eval: ' + (r.result.exceptionDetails.exception?.description || '')); return undefined; } return r.result.result?.value; };
  const fecha = async () => { await fetch(`${CDP}/json/close/${alvo.id}`).catch(() => {}); await new Promise((r) => { ws.onclose = () => r(); ws.close(); setTimeout(r, 400); }); };
  return { js, erros, fecha };
}
let falhas = 0, total = 0;
const prova = (nome, ok, det = '') => { total++; if (!ok) falhas++; console.log((ok ? 'ok    ' : 'FALHA ') + nome + (ok ? '' : '  ← ' + (typeof det === 'string' ? det : JSON.stringify(det)))); };
const AJUDA = `const w = (n) => new Promise((r) => setTimeout(r, n)); const q = (s) => document.querySelector(s); const qa = (s) => [...document.querySelectorAll(s)];
  const linha = (nome) => q('tr[data-disciplina="' + nome + '"]'); const decide = (nome, v) => linha(nome).querySelector('[data-decisao] button[data-valor="' + v + '"]').click();
  const barra = () => qa('[data-totais-barra] span').map((s) => s.style.getPropertyValue('--ucam-progress-valor')).join(' '); const legenda = () => qa('[data-parte-n]').map((x) => x.textContent).join(' ');
  const pe = () => q('[data-totais]').textContent; const fim = () => q('[data-acao="finalizar-analise"]');`;

// ── análise ────────────────────────────────────────────────────────────────
{
  const p = await abre('analise');
  const ini = await p.js(`${AJUDA} return { pe: pe(), legenda: legenda(), botao: fim().textContent.trim(), passos: qa('.ucam-section__passo').map((x) => x.textContent).join(''), ficha: !!q('.ucam-ficha img'), aside: !!q('.ucam-aside') };`);
  prova('análise: abre com 1 aguardando documento e 8 sem decisão', ini.pe === '9 disciplinas · 0 isentas · 0 não isentas · 1 aguardando documento · 8 sem decisão', ini.pe);
  prova('análise: legenda da barra 0 0 1 8', ini.legenda === '0 0 1 8', ini.legenda);
  prova('análise: com documento pedido, o botão é Enviar pedido', ini.botao === 'Enviar pedido ao candidato', ini.botao);
  prova('análise: passos 1, 2, 3 e ficha com retrato, sem coluna de apoio', ini.passos === '123' && ini.ficha && !ini.aside, ini);

  const d1 = await p.js(`${AJUDA} decide('Introdução ao Estudo do Direito', 'isentar'); decide('História do Direito', 'nao'); await w(250);
    return { pe: pe(), legenda: legenda(), barra: barra(), campos: !linha('Introdução ao Estudo do Direito').querySelector('[data-campos="isentar"]').hidden };`);
  prova('decidir: rodapé e legenda andam juntos', d1.pe.includes('1 isenta · 1 não isenta') && d1.legenda === '1 1 1 6', d1);
  prova('decidir: a barra tem as quatro partes em nonos', d1.barra === '11.1% 11.1% 11.1% 66.7%', d1.barra);
  prova('decidir Isentar abre os campos de origem', d1.campos === true);

  const d2 = await p.js(`${AJUDA} decide('História do Direito', 'nao'); await w(250); return { legenda: legenda(), decidida: linha('História do Direito').getAttribute('data-decidida') };`);
  prova('clicar de novo na marcada desfaz a decisão', d2.legenda === '1 0 1 7' && !d2.decidida, d2);

  const blq = await p.js(`${AJUDA} fim().click(); await w(350); const d = q('dialog[open]'); const r = { titulo: d ? (d.querySelector('.ucam-dialog__title') || {}).textContent : '', texto: d ? d.textContent : '', marcadas: qa('[data-decisao][aria-invalid="true"]').length, pend: fim().getAttribute('data-pendentes'), selo: q('[data-selo-situacao]').textContent.trim() };
    if (d) { const ir = [...d.querySelectorAll('button')].find((b) => /primeira/i.test(b.textContent)); if (ir) ir.click(); await w(300); } r.fechou = !q('dialog[open]'); r.foco = !!document.activeElement.closest('tr[data-disciplina]'); return r;`);
  prova('finalizar com sem-decisão é barrado: diz quantas faltam, nomeia e marca as linhas', blq.titulo === 'Faltam ' + blq.pend + ' decisões' && /Sociologia Jurídica/.test(blq.texto) && blq.marcadas === Number(blq.pend) && /Aguardando análise/.test(blq.selo), blq);
  prova('"Ir para a primeira" fecha o aviso e leva o foco à linha', blq.fechou && blq.foco, blq);

  const ap = await p.js(`${AJUDA} q('[data-acao="aplicar-sugestoes"]').click(); await w(400); return { legenda: legenda(), rotulo: q('[data-aplicar-rotulo]').textContent, marcadas: qa('[data-decisao][aria-invalid="true"]').length, anuncio: (q('[data-anuncio]') || {}).textContent || '' };`);
  prova('aplicar sugestões preenche só as firmes e não toca o que já foi decidido', ap.legenda === '4 3 1 1', ap);
  prova('aplicar sugestões anuncia o que fez e o que fica', /sugest/i.test(ap.anuncio) && /Direito Constitucional I/.test(ap.anuncio), ap.anuncio);

  const doc = await p.js(`${AJUDA} q('[data-abre-dialogo="is-docs"]').click(); await w(300); const d = q('dialog#is-docs'); const r = { aberto: d.open, arquivos: d.querySelectorAll('.ucam-anexo').length };
    d.querySelector('[data-acao="baixar-anexo"]').click(); await w(250); r.anuncio = (q('[data-anuncio]') || {}).textContent || ''; d.close(); await w(150); r.fechou = !d.open; return r;`);
  prova('o clipe abre o diálogo com os 2 documentos', doc.aberto && doc.arquivos === 2, doc);
  prova('baixar um documento anuncia o nome do arquivo', /historico-joao-cutrim\.pdf/.test(doc.anuncio), doc.anuncio);

  const fin = await p.js(`${AJUDA} decide('Direito Constitucional I', 'nao'); decide('Direito Civil I', 'isentar'); await w(300);
    const r = { legenda: legenda(), botao: fim().textContent.trim(), pend: fim().getAttribute('data-pendentes') }; fim().click(); await w(400);
    const d = q('dialog[open]'); r.dialogo = !!d; r.titulo = d ? (d.querySelector('.ucam-dialog__title') || {}).textContent : ''; r.texto = d ? (d.querySelector('.ucam-dialog__texto') || {}).textContent : '';
    if (d) { const ok = d.querySelector('[data-confirmar-ok]'); if (ok) ok.click(); await w(500); } r.selo = q('[data-selo-situacao]').textContent.trim(); r.travado = fim().getAttribute('aria-disabled'); return r;`);
  prova('tudo decidido: 5 isentas, 4 não isentas, botão Finalizar análise', fin.legenda === '5 4 0 0' && fin.botao === 'Finalizar análise' && fin.pend === '0', fin);
  prova('finalizar confirma nomeando os números', fin.dialogo && /5/.test(fin.texto) && /4/.test(fin.texto), fin);
  prova('confirmada, a situação vira Concluída', /Conclu/.test(fin.selo), fin.selo);
  prova('análise: nenhum erro de script no percurso', p.erros.length === 0, p.erros.join(' | '));
  await p.fecha();
}
// ── acompanhamento (candidato) ─────────────────────────────────────────────
{
  const p = await abre('acompanhamento', 1920);
  const etapas = `qa('.ucam-stepper__passo').map((l) => (l.className.includes('--done') ? 'feita' : l.className.includes('--current') ? 'atual' : 'pendente')).join(' ')`;
  const ini = await p.js(`${AJUDA} return { etapas: ${etapas}, tinta: !!q('.ucam-card--tinta .ucam-ficha'), docs: qa('ul[data-anexos] li').length, cheia: q('.ucam-corpo').getBoundingClientRect().width };`);
  prova('aluno: etapas feita · atual · pendente · pendente, no cartão preenchido', ini.etapas === 'feita atual pendente pendente' && ini.tinta, ini);
  prova('aluno: a página preenche a janela de 1920px', ini.cheia > 1800, String(ini.cheia));
  const env = await p.js(`${AJUDA} q('[data-abre-dialogo="is-envio"]').click(); await w(300); const d = q('dialog#is-envio'); const ok = d.querySelector('[value="ok"]'); const travado = ok.getAttribute('aria-disabled');
    const ul = document.createElement('ul'); ul.className = 'ucam-anexos'; ul.innerHTML = '<li class="ucam-anexo"><span class="ucam-anexo__corpo"><span class="ucam-anexo__nome">ementa-civil.pdf</span><span class="ucam-anexo__apoio">PDF · 1,0 MB · anexado</span></span></li>';
    d.querySelector('.ucam-dialog__body').appendChild(ul); ok.removeAttribute('aria-disabled'); ok.click(); await w(800);
    return { travado, etapas: ${etapas}, docs: qa('ul[data-anexos] li').length, novo: (qa('ul[data-anexos] li .ucam-id').pop() || {}).textContent, barra: qa('[data-valor-enviado]').map((s) => s.style.getPropertyValue('--ucam-progress-valor')).join(' '),
      selo: q('[data-selo-situacao]').textContent.trim(), pe: q('.ucam-pagination__range').textContent, aguardando: qa('[data-aguarda-documento]').length };`);
  prova('enviar: sem arquivo o botão nasce indisponível', env.travado === 'true', env.travado);
  prova('enviado: o arquivo entra na fileira de documentos', env.docs === 3 && env.novo === 'ementa-civil.pdf', env);
  prova('enviado: Documentos fecha e a Análise vira a etapa atual', env.etapas === 'feita feita atual pendente', env.etapas);
  prova('enviado: barra, selo e rodapé dizem Em análise', env.barra === '100% 0%' && env.selo === 'Em análise' && env.pe === '9 disciplinas · 9 em análise' && env.aguardando === 0, env);
  prova('acompanhamento: nenhum erro de script', p.erros.length === 0, p.erros.join(' | '));
  await p.fecha();
}
// ── fila ───────────────────────────────────────────────────────────────────
{
  const p = await abre('fila');
  const r = await p.js(`${AJUDA} const vis = () => qa('tr[data-situacao]').filter((t) => t.offsetParent);
    const passos = qa('td[data-proximo] a').map((a) => a.textContent.trim() + '→' + a.getAttribute('href').split('/').pop().replace(/^isencao-/, '').replace(/.html$/, ''));
    const cont = {}; passos.forEach((x) => (cont[x] = (cont[x] || 0) + 1));
    const todas = vis().length; q('.ucam-segmented [data-valor="analise"]').click(); await w(250); const soAnalise = vis().map((t) => t.getAttribute('data-situacao'));
    q('.ucam-segmented [data-valor=""]').click(); await w(200); q('#is-aba-concluidas').click(); await w(300); const concl = vis().map((t) => t.getAttribute('data-situacao'));
    return { cont, todas, soAnalise, concl };`);
  prova('fila: cada linha diz o próximo passo e leva à tela certa', r.cont['Analisar→analise'] === 4 && r.cont['Cobrar documentos→sem-documentos'] === 3 && r.cont['Ver o pedido→analise'] === 1 && r.cont['Ver o parecer→consulta'] === 5 && Object.keys(r.cont).length === 4, r.cont);
  prova('fila: abre com as 8 em análise', r.todas === 8, String(r.todas));
  prova('fila: o filtro de situação recorta', r.soAnalise.length === 4 && r.soAnalise.every((s) => s === 'analise'), r.soAnalise);
  prova('fila: a aba Concluídas mostra as 5', r.concl.length === 5 && r.concl.every((s) => s === 'concluida'), r.concl);
  prova('fila: nenhum erro de script', p.erros.length === 0, p.erros.join(' | '));
  await p.fecha();
}
// ── consulta, resultado, sem documentos ────────────────────────────────────
for (const [tela, espera] of [['consulta', '9 disciplinas · 6 isentas · 3 não isentas'], ['resultado', '9 disciplinas · 6 isentas · 3 não isentas'], ['sem-documentos', null]]) {
  const p = await abre(tela);
  const r = await p.js(`${AJUDA} return { pe: (q('.ucam-pagination__range') || {}).textContent, icones: qa('.td--figura .ucam-icon-tile').length, ficha: !!q('.ucam-ficha img'), aside: !!q('.ucam-aside'), bloqueadas: qa('[data-decisao] button[aria-disabled="true"]').length };`);
  prova(`${tela}: ficha com retrato, 9 matérias com ícone, sem coluna de apoio`, r.ficha && r.icones === 9 && !r.aside, r);
  if (espera) prova(`${tela}: o rodapé fecha a conta`, r.pe === espera, r.pe);
  else prova('sem documentos: as 27 opções de decisão ficam indisponíveis', r.bloqueadas === 27, String(r.bloqueadas));
  prova(`${tela}: nenhum erro de script`, p.erros.length === 0, p.erros.join(' | '));
  await p.fecha();
}
console.log(falhas ? `${falhas} de ${total} prova(s) falharam` : `todas as ${total} provas passaram`);
setTimeout(() => process.exit(falhas ? 1 : 0), 250);
