import fs from 'node:fs';
function troca(arquivo, de, para, vezes = 1) {
  const txt = fs.readFileSync(arquivo, 'utf8');
  const n = txt.split(de).length - 1;
  if (n !== vezes) throw new Error(`${arquivo}: esperava ${vezes} ocorrência(s), achei ${n} de: ${de.slice(0, 80)}`);
  fs.writeFileSync(arquivo, txt.split(de).join(para));
  console.log('ok', arquivo, '-', de.slice(0, 60).replace(/\s+/g, ' '));
}

// 1. shell.mjs — Desfazer do rascunho da IA vira botão do DS (contrato link.json: ação não é link)
troca('tools/lib/shell.mjs',
  `Revise antes de enviar. <button type="button" class="ucam-link ucam-link--apoio" data-fluxo="c" data-acao="ia-desfazer-observacao">Desfazer</button>';`,
  `Revise antes de enviar. <button type="button" class="ucam-btn ucam-btn--ghost ucam-btn--sm" data-fluxo="c" data-acao="ia-desfazer-observacao">Desfazer</button>';`);

// 1b. shell.mjs — clicar no fundo fecha o diálogo (Trilho A; o Angular já fazia em aoClicarNoFundo)
troca('tools/lib/shell.mjs',
`    var primeiro = d.querySelector('select, [data-listbox], input, textarea');
    if (primeiro) primeiro.focus();
  }, true);
})();
\`;`,
`    var primeiro = d.querySelector('select, [data-listbox], input, textarea');
    if (primeiro) primeiro.focus();
  }, true);

  /* CLICAR NO FUNDO FECHA (08/10/2026: "clicar fora no modal faz fechar").
   * O contrato (dismissible, padrão true) promete Esc, fundo e ×; o <dialog>
   * nativo entrega só o Esc. O ::backdrop não recebe evento próprio: o clique
   * nele chega ao próprio <dialog>, e o que distingue fundo de conteúdo é o
   * retângulo — ponto fora da caixa, foi no fundo. Mesma conta do
   * aoClicarNoFundo do Trilho B. Vale para TODO .ucam-dialog da página, o do
   * HTML e o que o confirmaScript monta, e respeita as duas exceções do
   * contrato: aria-busy (operação em curso) e data-dismissible="false"
   * (perda de dado, com saída rotulada na tela). Fechar pelo fundo é desistir:
   * returnValue fica vazio e o onclose de quem abriu não confirma nada. */
  document.addEventListener('click', function (e) {
    var d = e.target;
    if (!d || d.tagName !== 'DIALOG' || !d.open || !d.classList.contains('ucam-dialog')) return;
    if (d.getAttribute('aria-busy') === 'true' || d.getAttribute('data-dismissible') === 'false') return;
    var r = d.getBoundingClientRect();
    var dentro = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!dentro) d.close();
  });
})();
\`;`);

// 2. build-css.mjs — campo que declara ocupar a linha tira o teto de 48rem da textarea
troca('tools/build-css.mjs',
`/* A TEXTAREA FORA DA GRADE para na medida de leitura (48rem, a mesma de
 * .ucam-corpo--leitura): a descrição do Novo requerimento abria em 1205px a
 * 1920, ~170 caracteres por linha (28/09/2026). Na grade quem manda é a
 * trilha (1 / span 2). */
:where(:not(.ucam-form-grid) > .ucam-field) > .ucam-textarea { max-inline-size: 48rem; }`,
`/* A TEXTAREA FORA DA GRADE para na medida de leitura (48rem, a mesma de
 * .ucam-corpo--leitura): a descrição do Novo requerimento abria em 1205px a
 * 1920, ~170 caracteres por linha (28/09/2026). Na grade quem manda é a
 * trilha (1 / span 2).
 *
 * Salvo no campo que DECLARA ocupar a linha (.ucam-field--linha): aí o teto
 * é o do cartão, como o --linha já fazia com os outros controles. Foi o que
 * a Observação da isenção mostrou (08/10/2026, "campo fill"): sozinha num
 * cartão de largura cheia, a textarea parava em 768px e o contador "0 de 150
 * caracteres", alinhado ao fim do campo, ficava 265px à direita dela — o
 * número lia como de outra coisa. */
:where(:not(.ucam-form-grid) > .ucam-field:not(.ucam-field--linha)) > .ucam-textarea { max-inline-size: 48rem; }`);

// 2b. build-css.mjs — botão dentro da nota da IA centra com a frase
troca('tools/build-css.mjs',
`.ucam-ia-nota > .ic { flex: none; inline-size: 0.8125rem; block-size: 0.8125rem; margin-block-start: 0.2em; opacity: 0.8; }`,
`.ucam-ia-nota > .ic { flex: none; inline-size: 0.8125rem; block-size: 0.8125rem; margin-block-start: 0.2em; opacity: 0.8; }
/* O Desfazer da nota é botão (link.json: ação não é link), no degrau sm; a
 * nota alinha pelo topo para o ícone acompanhar a primeira linha, e o botão,
 * mais alto que a linha, centra com a frase. */
.ucam-ia-nota > .ucam-btn { flex: none; align-self: center; }`);

// 3. templates.json — a Observação da análise declara ocupar a linha (edição em texto: o arquivo não sobrevive a stringify)
troca('spec/templates.json',
  `<div class='ucam-card ucam-section'><div class='ucam-field'><label class='ucam-field__label' for='is-obs'>Observação</label>`,
  `<div class='ucam-card ucam-section'><div class='ucam-field ucam-field--linha'><label class='ucam-field__label' for='is-obs'>Observação</label>`);

// 4. layouts.json — documenta a exceção
troca('spec/layouts.json',
  `"quando": "Ocupa a linha inteira: grupo de caixas, grade de escolha, grupo de interruptores. Todo filho da grade que não é campo nem grupo (aviso, cluster, anexos) já ocupa a linha."`,
  `"quando": "Ocupa a linha inteira: grupo de caixas, grade de escolha, grupo de interruptores. Todo filho da grade que não é campo nem grupo (aviso, cluster, anexos) já ocupa a linha. Fora da grade, é o que tira da textarea o teto de 48rem: o campo preenche o cartão e o contador termina onde ele termina (Observação da isenção, 08/10/2026)."`);
troca('spec/layouts.json',
  `"quando": "Linha inteira com uma ou duas trilhas; 1 / span 2 com três ou mais (~48rem, a medida de leitura). Fora da grade, a textarea para em 48rem."`,
  `"quando": "Linha inteira com uma ou duas trilhas; 1 / span 2 com três ou mais (~48rem, a medida de leitura). Fora da grade, a textarea para em 48rem, salvo em .ucam-field--linha."`);

// 5. dialog.json — o fechamento pelo fundo é script, e está dito onde
troca('spec/components/dialog.json',
  `"nota": "Foco preso, inert atrás e fechamento por Escape vêm do elemento <dialog> nativo, não do CSS. Um <div class=\\"ucam-dialog\\"> tem o visual certo e nenhum dos comportamentos.",`,
  `"nota": "Foco preso, inert atrás e fechamento por Escape vêm do elemento <dialog> nativo, não do CSS. Um <div class=\\"ucam-dialog\\"> tem o visual certo e nenhum dos comportamentos. O fechamento por clique no fundo NÃO vem do nativo: o ::backdrop não recebe evento, o clique chega ao <dialog>, e é o retângulo que diz se foi fora da caixa — um listener de documento (dialogoScript, tools/lib/shell.mjs) fecha todo .ucam-dialog aberto nesse caso, salvo aria-busy=true ou data-dismissible=\\"false\\". Mesma conta do aoClicarNoFundo do componente Angular.",`);
