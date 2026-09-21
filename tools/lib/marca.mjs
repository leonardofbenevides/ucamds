// O símbolo do UCAMDS, num lugar só.
//
// Desenho: PLACA sólida — o componente — com o TOKEN vazado nela, perto do
// canto inferior direito. Mesma geometria de
// site/src/assets/marca/ucamds-simbolo.svg, aqui em currentColor.
//
// Este arquivo já emitiu, entre 06 e 07/09/2026, um desenho que o site havia
// abandonado — a moldura aberta no canto —, enquanto o comentário desta mesma
// linha afirmava "mesma geometria de ucamds-simbolo.svg". As telas geradas em
// site/src/assets/t/ mostravam uma marca que o cabeçalho do site não
// reconhecia. Se a geometria mudar de novo, os CINCO lugares mudam juntos:
// este, o componente Angular, os dois SVGs e o favicon de site/index.html.
//
// Por que currentColor e não o bordô cravado: o símbolo aparece em página com
// tema claro e escuro, e o bordô troca entre os dois (#6C1E2B → #DF97A4).
// Herdando a cor de quem o contém, um desenho só cobre os dois temas — a
// alternativa seria uma segunda cópia do arquivo e dois hexes para manter.
//
// Este par markup+CSS é emitido por mais de um gerador (build-docs.mjs e
// build-demo.mjs). Pela lição do .ic — CSS de cromo que acompanha markup de
// dois geradores mora aqui, nunca inline num deles — quem emite importa daqui.
//
// ATENÇÃO: o símbolo é marca do DESIGN SYSTEM, não da universidade. A logo da
// UCAM é outra coisa, vive em site/src/assets/marca/ucam-logo-*.svg e não é
// substituída por este desenho.

export function simbolo(cls = 'marca-simbolo') {
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M8 2H16A6 6 0 0 1 22 8V16A6 6 0 0 1 16 22H8A6 6 0 0 1 2 16V8A6 6 0 0 1 8 2ZM14.1 11.5H16.9A2.6 2.6 0 0 1 19.5 14.1V16.9A2.6 2.6 0 0 1 16.9 19.5H14.1A2.6 2.6 0 0 1 11.5 16.9V14.1A2.6 2.6 0 0 1 14.1 11.5Z"/></svg>`;
}

// Tamanho base. Um <svg> sem inline-size estica até o contêiner — a mesma
// armadilha que já esticou os ícones das telas de docs/t/. Quem quiser outro
// tamanho sobrescreve inline-size/block-size no contexto.
export const marcaCss = `
.marca-simbolo{display:block;inline-size:1.25rem;block-size:1.25rem;flex:none}
`.trim();
