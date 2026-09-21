// A classe .ic do sprite, num lugar só.
//
// O markup `<svg class='ic'><use href='#i-...'/></svg>` é emitido por mais de
// um gerador. Um <svg> sem inline-size não tem tamanho intrínseco: ele estica
// até o contêiner. Quando essa regra existia apenas no build-docs.mjs, as telas
// autônomas de docs/t/ saíam com ícones do tamanho da coluna — botões
// esticados, cabeçalho de tabela com 80px de altura. Quem emite o markup
// importa daqui para o par não se separar de novo.
//
// UM TAMANHO AQUI, O RESTO POR PAPEL. Havia cinco classes — .ic, .ic-sm,
// .ic-md, .ic-lg, .ic-xl — em 14, 16, 20 e 28px, e a marcação escolhia. O
// resultado: o mesmo selo saía com 14px numa tela e 16px em outra, o mesmo
// botão com 14 e com 16, e os degraus de 20 e 28 não apareciam em tela
// nenhuma. Duas escalas concorrentes — a classe na marcação e a regra de
// contexto da folha (`.ucam-btn--sm .ic`, `.ucam-badge .ic`) — e nada dizia
// qual mandava.
//
// Agora manda a folha: o degrau é do PAPEL, não de quem escreve a marcação.
// Aqui fica só o padrão — 20px, o mesmo `md` que o <ucam-icon> do Trilho B
// já entrega por omissão. Os desvios (16 no miúdo, 24 no estado vazio) estão
// na seção "escala de ícone por papel" do tools/build-css.mjs, ao lado das
// regras que já faziam isso.
//
// A escala fechada é a de spec/icons.json: 16 · 20 · 24. Fora dela é pedido
// ao design system, não valor local.

export const iconCss = `
.ic{display:inline-block;inline-size:var(--ucam-size-icon-md);block-size:var(--ucam-size-icon-md);flex:none;vertical-align:-.15em;stroke-width:2}
`.trim();
