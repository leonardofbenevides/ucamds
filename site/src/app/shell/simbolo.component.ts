import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * O símbolo do DSUCAM.
 *
 * Uma PLACA sólida — o componente — com o TOKEN vazado nela, perto do canto
 * inferior direito. O token não é desenhado por cima: é o buraco. Componente é
 * a massa, token é o que se recorta dela, e o fundo aparece através.
 *
 * TROCADO EM 07/09/2026, e o desenho anterior durou um dia. Ele era a mesma
 * tese com os papéis invertidos — placa em TRAÇO e token em massa, sobrepostos
 * na diagonal — e morria de dois jeitos:
 *
 *   1. Dois quadrados arredondados sobrepostos na diagonal são o glifo
 *      universal de COPIAR. A marca do design system lia como um ícone de
 *      interface, que é o pior lugar possível para uma marca ficar.
 *   2. Traço de 2,3 num viewBox de 24 dá 1,53px a 16px e some no
 *      antialiasing — exatamente a falha que já havia matado o desenho de
 *      31/08, e que o comentário deste arquivo descrevia enquanto o desenho
 *      novo a repetia.
 *
 * Massa não tem esse problema: o vazado tem 8 unidades de lado, mede 5,3px a
 * 16px, e a marca fica MAIS legível na redução, não menos.
 *
 * UM PATH SÓ, com fill-rule="evenodd", e não um <mask> com id. O símbolo é
 * consumido de três formas — inline aqui, como máscara de alfa na trilha das
 * telas legadas (.ucam-rail__marca faz `background: currentColor` + `mask`), e
 * como data URI no favicon. Um <mask> exigiria um id único por instância, e
 * ids duplicados num documento com o símbolo em dois lugares fazem o navegador
 * resolver os dois contra o primeiro. O subpath de winding oposto não precisa
 * de id nenhum e recorta igual nos três consumos.
 *
 * A geometria vive em QUATRO arquivos por necessidade, não por descuido —
 * inline aqui, dois SVGs em assets/marca/, o data URI do favicon em index.html
 * e o emissor de tools/lib/marca.mjs. Mexeu num, mexa nos cinco; até 06/09/2026
 * o marca.mjs emitia um desenho que o site já não usava, e as telas geradas
 * mostravam um símbolo que o cabeçalho não reconhecia.
 *
 * ATENÇÃO: o símbolo é marca do DESIGN SYSTEM, não da universidade. A logo da
 * UCAM é outra coisa, vive em assets/marca/ucam-logo-*.svg, e no cabeçalho vem
 * DEPOIS do filete e no cinza secundário — posição de quem assina.
 */
@Component({
  selector: 'ucam-simbolo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        fill-rule="evenodd"
        d="M8 2H16A6 6 0 0 1 22 8V16A6 6 0 0 1 16 22H8A6 6 0 0 1 2 16V8A6 6 0 0 1 8 2ZM14.1 11.5H16.9A2.6 2.6 0 0 1 19.5 14.1V16.9A2.6 2.6 0 0 1 16.9 19.5H14.1A2.6 2.6 0 0 1 11.5 16.9V14.1A2.6 2.6 0 0 1 14.1 11.5Z"
      />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      /* Quadrado por padrão; quem usa define o corpo em uma dimensão só. */
      inline-size: 1.5rem;
      aspect-ratio: 1;
      flex: none;
    }
    svg {
      display: block;
      inline-size: 100%;
      block-size: 100%;
    }
  `,
})
export class SimboloComponent {}
