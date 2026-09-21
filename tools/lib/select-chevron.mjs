// O chevron do Select, que o contrato exige e a implementação não tinha.
//
// spec/components/select.json declara `chevron` como parte OBRIGATÓRIA da
// anatomia — "indicador de lista, decorativo, aria-hidden". O <select> saía
// sem `appearance: none`, então mostrava a seta do sistema operacional: cinza
// no Windows, outra coisa no macOS, nenhuma relação com o resto do formulário.
//
// A geometria segue o trigger do z-select da base (ZardUI): mesma altura,
// mesmo raio, chevron alinhado à direita com 1rem.
//
// Por que um wrapper e não background-image no próprio <select>: uma data URI
// é um documento separado e não enxerga o currentColor de quem a usa, então
// um chevron como background precisaria do hex cravado, duas vezes, um por
// tema. Com o wrapper o desenho vem por `mask` — geometria pura, sem cor — e
// a cor sai do token no ::after. Um só lugar, os dois temas.
//
// A LISTA ABERTA continua sendo a do sistema operacional. Nenhum navegador
// deixa estilizar o popup de um <select> nativo. Trocar isso exige o overlay
// do z-select, o que o contrato hoje reserva ao ucam-combobox.

/** Chevron do lucide, só o traçado — a `mask` ignora a cor. */
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export const selectChevronCss = `
.ucam-select {
  appearance: none;
  -webkit-appearance: none;
  /* Espaço para o chevron não encostar no texto da opção mais longa. */
  padding-inline-end: 2rem;
}

.ucam-select-wrap {
  position: relative;
  display: block;
  inline-size: 100%;
}
.ucam-field--content .ucam-select-wrap { display: inline-block; inline-size: auto; }

.ucam-select-wrap::after {
  content: '';
  position: absolute;
  inset-inline-end: 0.625rem;
  inset-block-start: 50%;
  translate: 0 -50%;
  inline-size: var(--ucam-size-icon-sm);
  block-size: var(--ucam-size-icon-sm);
  /* O chevron é decorativo: não intercepta o clique, que é do select. */
  pointer-events: none;
  background: var(--ucam-color-text-secondary);
  -webkit-mask: ${CHEVRON} no-repeat center / contain;
  mask: ${CHEVRON} no-repeat center / contain;
}

/* Desabilitado: o chevron acompanha o texto, senão fica mais escuro que o
 * valor que ele aponta e o campo parece ativo. Desde a ADR-042 ele veste a
 * tinta de CONTROLE e não a de card: o chevron está por cima do chão do
 * campo bloqueado, e é contra esse chão que o portão de contraste o mede. */
.ucam-select-wrap:has(> .ucam-select:disabled)::after {
  background: var(--ucam-color-action-disabled-text);
}
`.trim();

/**
 * Envolve todo `<select class='ucam-select'>` num `.ucam-select-wrap`.
 *
 * O markup das telas e das demos é HTML escrito à mão dentro de spec/. Fazer
 * o wrap aqui evita repetir a mesma span em quinze lugares e garante que um
 * select novo já nasça com o chevron.
 */
export function wrapSelects(html) {
  return html.replace(
    /(<select\b[^>]*class=(['"])[^'"]*\bucam-select\b[^'"]*\2[^>]*>)([\s\S]*?)(<\/select>)/g,
    (_, abre, _aspas, miolo, fecha) =>
      `<span class="ucam-select-wrap">${abre}${miolo}${fecha}</span>`,
  );
}
